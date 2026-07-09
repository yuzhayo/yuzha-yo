import { useState, useCallback, useEffect, useRef } from "react";
import type { ScannedSeries, ScannedChapter } from "@shared/manga-types";
import { loadHistory } from "./useReadingHistory";
import {
  saveFolderHandle,
  loadFolderHandle,
  queryFolderPermission,
  requestFolderPermission,
} from "./folderHandleStore";

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function isCbzFile(name: string): boolean {
  return name.toLowerCase().endsWith(".cbz");
}

export function isFolderScanSupported(): boolean {
  return "showDirectoryPicker" in window;
}

export type FolderScanState =
  | { status: "idle" }
  | { status: "restoring" }
  | { status: "needs-permission"; folderName: string }
  | { status: "scanning" }
  | { status: "ready"; series: ScannedSeries[] }
  | { status: "error"; message: string };

async function readSeriesFromDir(dirHandle: FileSystemDirectoryHandle): Promise<ScannedSeries[]> {
  const history = loadHistory();
  const seriesList: ScannedSeries[] = [];
  const rootCbzFiles: ScannedChapter[] = [];

  for await (const [name, handle] of (dirHandle as any).entries()) {
    if (name.startsWith(".")) continue;

    if ((handle as FileSystemHandle).kind === "directory") {
      const chapters: ScannedChapter[] = [];
      for await (const [chName, chHandle] of (handle as any).entries()) {
        if (chName.startsWith(".")) continue;
        if ((chHandle as FileSystemHandle).kind === "file" && isCbzFile(chName)) {
          const histKey = `folder::${name}::${chName}`;
          const historyEntry = history.find((e) => e.key === histKey);
          chapters.push({
            name: chName.replace(/\.cbz$/i, ""),
            fileName: chName,
            fileHandle: chHandle as FileSystemFileHandle,
            historyEntry,
          });
        }
      }
      if (chapters.length > 0) {
        chapters.sort((a, b) => naturalSort(a.fileName, b.fileName));
        seriesList.push({
          name,
          chapters,
          coverHandle: chapters[0]?.fileHandle,
        });
      }
    } else if ((handle as FileSystemHandle).kind === "file" && isCbzFile(name)) {
      const histKey = `folder::__root__::${name}`;
      const historyEntry = history.find((e) => e.key === histKey);
      rootCbzFiles.push({
        name: name.replace(/\.cbz$/i, ""),
        fileName: name,
        fileHandle: handle as FileSystemFileHandle,
        historyEntry,
      });
    }
  }

  seriesList.sort((a, b) => naturalSort(a.name, b.name));

  if (rootCbzFiles.length > 0) {
    rootCbzFiles.sort((a, b) => naturalSort(a.fileName, b.fileName));
    seriesList.unshift({
      name: "📄 Standalone Files",
      chapters: rootCbzFiles,
      coverHandle: rootCbzFiles[0]?.fileHandle,
    });
  }

  return seriesList;
}

export function useFolderScanner() {
  const [state, setState] = useState<FolderScanState>({ status: "idle" });
  // Keep the handle around so "needs-permission" can be resolved without re-picking
  const pendingHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  const scanDir = useCallback(async (dirHandle: FileSystemDirectoryHandle) => {
    setState({ status: "scanning" });
    try {
      const seriesList = await readSeriesFromDir(dirHandle);
      setState({ status: "ready", series: seriesList });
    } catch (err) {
      setState({ status: "error", message: `Scan failed: ${String(err)}` });
    }
  }, []);

  const scanFolder = useCallback(async () => {
    if (!isFolderScanSupported()) {
      setState({
        status: "error",
        message: "Folder scanning is not supported in this environment.",
      });
      return;
    }

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await (window as any).showDirectoryPicker({ mode: "read" });
    } catch {
      // User cancelled — do nothing
      return;
    }

    await saveFolderHandle(dirHandle);
    pendingHandleRef.current = dirHandle;
    await scanDir(dirHandle);
  }, [scanDir]);

  // Re-grant permission for the already-selected folder (no picker shown)
  const grantAccess = useCallback(async () => {
    const handle = pendingHandleRef.current;
    if (!handle) return;
    const permission = await requestFolderPermission(handle);
    if (permission === "granted") {
      await scanDir(handle);
    } else {
      setState({
        status: "error",
        message: "Folder access was denied. Click \"Open Folder\" to select it again.",
      });
    }
  }, [scanDir]);

  // On mount: try to restore the last used folder automatically
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isFolderScanSupported()) return;

      const handle = await loadFolderHandle();
      if (!handle || cancelled) return;

      pendingHandleRef.current = handle;
      setState({ status: "restoring" });

      const permission = await queryFolderPermission(handle);
      if (cancelled) return;

      if (permission === "granted") {
        await scanDir(handle);
      } else {
        // Browser requires a user gesture to re-request permission —
        // surface a lightweight prompt instead of the folder picker.
        setState({ status: "needs-permission", folderName: handle.name });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    pendingHandleRef.current = null;
    setState({ status: "idle" });
  }, []);

  return { state, scanFolder, grantAccess, reset };
}

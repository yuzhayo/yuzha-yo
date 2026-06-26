import { useState, useCallback } from "react";
import type { ScannedSeries, ScannedChapter } from "../types";
import { loadHistory } from "./useReadingHistory";

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
  | { status: "scanning" }
  | { status: "ready"; series: ScannedSeries[] }
  | { status: "error"; message: string };

export function useFolderScanner() {
  const [state, setState] = useState<FolderScanState>({ status: "idle" });

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

    setState({ status: "scanning" });
    const history = loadHistory();

    try {
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

      setState({ status: "ready", series: seriesList });
    } catch (err) {
      setState({ status: "error", message: `Scan failed: ${String(err)}` });
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, scanFolder, reset };
}

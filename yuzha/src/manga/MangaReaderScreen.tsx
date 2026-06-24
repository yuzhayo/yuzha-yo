import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCbzLoader } from "./useCbzLoader";
import { useReaderState } from "./useReaderState";
import { useKeyboardNav } from "./useKeyboardNav";
import { useFolderScanner } from "./useFolderScanner";
import { saveHistory, loadHistory, getHistoryEntry, deleteHistoryEntry } from "./useReadingHistory";
import MangaHome from "./MangaHome";
import MangaLibrary from "./MangaLibrary";
import MangaReader from "./MangaReader";
import MangaToolbar from "./MangaToolbar";
import MangaControls from "./MangaControls";
import type { HistoryEntry, ScannedSeries, ScannedChapter } from "./types";

type View = "home" | "library" | "reader";

type Props = {
  onBack?: () => void;
};

export default function MangaReaderScreen({ onBack }: Props) {
  const [view, setView] = useState<View>("home");
  const [activeSeries, setActiveSeries] = useState<ScannedSeries | null>(null);
  const [activeChapter, setActiveChapter] = useState<ScannedChapter | null>(null);
  const [activeHistoryKey, setActiveHistoryKey] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());

  // Folder scanner
  const { state: folderState, scanFolder } = useFolderScanner();

  // CBZ loader
  const { result, loadFile, reset: resetLoader } = useCbzLoader();
  const isReady = result.status === "ready";
  const pages = isReady ? result.pages : [];

  // Reader state
  const {
    currentPage,
    goNext,
    goPrev,
    goToPage,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    mode,
    toggleMode,
    rtl,
    toggleRtl,
  } = useReaderState(pages.length);

  // Keyboard nav (only in reader view)
  useKeyboardNav({
    onNext: goNext,
    onPrev: goPrev,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
    rtl,
    enabled: view === "reader" && isReady,
  });

  // Pending page restore — set before pages load, applied once pages are ready
  const pendingPageRestoreRef = useRef<number | null>(null);

  // Apply pending page restore once pages become available
  useEffect(() => {
    if (pages.length > 0 && pendingPageRestoreRef.current !== null) {
      goToPage(pendingPageRestoreRef.current);
      pendingPageRestoreRef.current = null;
    }
  }, [pages.length, goToPage]);

  // Auto-save history on every page change while in reader view
  const prevPageRef = useRef<number>(-1);
  useEffect(() => {
    if (view !== "reader" || !activeHistoryKey || pages.length === 0) return;
    if (currentPage === prevPageRef.current) return;
    prevPageRef.current = currentPage;

    const displayTitle =
      activeChapter?.name ?? (isReady ? result.fileName.replace(/\.cbz$/i, "") : "");
    if (!displayTitle) return;

    const entry: HistoryEntry = {
      key: activeHistoryKey,
      displayTitle,
      seriesName: activeSeries?.name,
      page: currentPage,
      totalPages: pages.length,
      lastRead: Date.now(),
      source: activeChapter ? "folder" : "file",
    };

    saveHistory(entry);
    setHistory(loadHistory());
  }, [currentPage, view, activeHistoryKey, pages.length]);

  // Refresh history when returning to home view
  useEffect(() => {
    if (view === "home") {
      setHistory(loadHistory());
      prevPageRef.current = -1;
    }
  }, [view]);

  // Open a file via drag-drop / file picker
  const openFile = useCallback(
    (file: File) => {
      const key = `file::${file.name}`;
      setActiveSeries(null);
      setActiveChapter(null);
      setActiveHistoryKey(key);

      const hist = getHistoryEntry(key);
      if (hist && hist.page > 0) {
        pendingPageRestoreRef.current = hist.page;
      }

      loadFile(file);
      setView("reader");
    },
    [loadFile],
  );

  // Open a chapter from folder scan
  const openChapter = useCallback(
    async (series: ScannedSeries, chapter: ScannedChapter) => {
      let file: File;
      try {
        file = await chapter.fileHandle.getFile();
      } catch {
        alert("File not found. Please re-scan your manga folder.");
        return;
      }

      const key = `folder::${series.name}::${chapter.fileName}`;
      setActiveSeries(series);
      setActiveChapter(chapter);
      setActiveHistoryKey(key);

      const hist = getHistoryEntry(key);
      if (hist && hist.page > 0) {
        pendingPageRestoreRef.current = hist.page;
      }

      loadFile(file);
      setView("reader");
    },
    [loadFile],
  );

  // Continue reading from history
  const handleContinueReading = useCallback(
    (entry: HistoryEntry) => {
      if (entry.source === "folder") {
        // Try to find the chapter in the current folder scan
        if (folderState.status === "ready") {
          const seriesName = entry.seriesName ?? "__root__";
          const chapterFileName = entry.key.split("::")[2] ?? "";
          const series = folderState.series.find((s) => s.name === seriesName);
          const chapter = series?.chapters.find((c) => c.fileName === chapterFileName);
          if (series && chapter) {
            openChapter(series, chapter);
            return;
          }
        }
        // Folder not scanned or chapter not found
        alert(
          "Scan your manga folder first to continue this chapter.\n\nClick \"Open Folder\" and select the same folder.",
        );
      } else {
        // Drag-drop file source — need user to re-open the file
        alert(
          `To continue reading "${entry.displayTitle}", drag-drop or open that .cbz file again. Your progress (page ${entry.page + 1}) is saved.`,
        );
      }
    },
    [folderState, openChapter],
  );

  // Back navigation from reader
  const handleReaderBack = useCallback(() => {
    // Final history save with current page
    if (activeHistoryKey && pages.length > 0) {
      const displayTitle =
        activeChapter?.name ?? (isReady ? result.fileName.replace(/\.cbz$/i, "") : "");
      if (displayTitle) {
        saveHistory({
          key: activeHistoryKey,
          displayTitle,
          seriesName: activeSeries?.name,
          page: currentPage,
          totalPages: pages.length,
          lastRead: Date.now(),
          source: activeChapter ? "folder" : "file",
        });
      }
    }
    resetLoader();
    // Return to library view if came from a folder series, otherwise home
    if (activeChapter && activeSeries) {
      setView("library");
    } else {
      setView("home");
    }
  }, [activeHistoryKey, pages.length, currentPage, activeChapter, activeSeries, resetLoader, isReady, result]);

  const handleDeleteHistory = useCallback((key: string) => {
    deleteHistoryEntry(key);
    setHistory(loadHistory());
  }, []);

  // ── RENDER ──────────────────────────────────────────────────────────────────

  if (view === "library" && activeSeries) {
    return (
      <MangaLibrary
        series={activeSeries}
        onBack={() => setView("home")}
        onOpenChapter={(chapter) => openChapter(activeSeries, chapter)}
      />
    );
  }

  if (view === "reader" && isReady) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-neutral-950">
        <MangaToolbar
          fileName={result.fileName}
          seriesName={activeSeries?.name}
          currentPage={currentPage}
          totalPages={pages.length}
          onBack={handleReaderBack}
          onPageJump={goToPage}
        />
        <MangaReader
          pages={pages}
          currentPage={currentPage}
          zoom={zoom}
          mode={mode}
          rtl={rtl}
          onNext={goNext}
          onPrev={goPrev}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />
        <MangaControls
          currentPage={currentPage}
          totalPages={pages.length}
          zoom={zoom}
          mode={mode}
          rtl={rtl}
          onPrev={goPrev}
          onNext={goNext}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onToggleMode={toggleMode}
          onToggleRtl={toggleRtl}
        />
      </div>
    );
  }

  // Loading state while in reader view (CBZ extracting)
  if (view === "reader" && result.status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-neutral-950 text-white gap-4">
        <span className="text-4xl">📖</span>
        <p className="text-neutral-400 text-sm">Extracting pages…</p>
        <div className="w-64 bg-neutral-800 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${result.progress}%` }}
          />
        </div>
        <p className="text-neutral-600 text-xs tabular-nums">{result.progress}%</p>
      </div>
    );
  }

  // Error state
  if (view === "reader" && result.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-neutral-950 text-white gap-4">
        <span className="text-4xl">⚠️</span>
        <p className="text-red-400 text-sm max-w-xs text-center">{result.message}</p>
        <button
          type="button"
          onClick={() => {
            resetLoader();
            setView("home");
          }}
          className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm text-white transition-colors"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  // Home view (default)
  return (
    <MangaHome
      onBack={onBack}
      history={history}
      folderState={folderState}
      onScanFolder={scanFolder}
      onOpenFile={openFile}
      onContinueReading={handleContinueReading}
      onOpenSeries={(series) => {
        setActiveSeries(series);
        setView("library");
      }}
      onDeleteHistory={handleDeleteHistory}
      isLoadingFile={false}
      fileError={null}
    />
  );
}

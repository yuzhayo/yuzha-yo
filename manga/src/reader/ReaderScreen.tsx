import { useState, useEffect, useRef, useCallback } from "react";
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
import type { HistoryEntry, ScannedSeries, ScannedChapter } from "../types";

type View = "home" | "library" | "reader";

type Props = {
  onBack?: () => void;
};

export default function ReaderScreen({ onBack }: Props) {
  const [view, setView] = useState<View>("home");
  const [activeSeries, setActiveSeries] = useState<ScannedSeries | null>(null);
  const [activeChapter, setActiveChapter] = useState<ScannedChapter | null>(null);
  const [activeHistoryKey, setActiveHistoryKey] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<"file" | "folder">("file");
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

  useKeyboardNav({
    onNext: goNext,
    onPrev: goPrev,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
    rtl,
    enabled: view === "reader" && isReady,
  });

  // Pending page restore
  const pendingPageRestoreRef = useRef<number | null>(null);

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

    let displayTitle = "";
    if (activeChapter) {
      displayTitle = activeChapter.name;
    } else if (result.status === "ready") {
      displayTitle = result.fileName.replace(/\.cbz$/i, "");
    }
    if (!displayTitle) return;

    const entry: HistoryEntry = {
      key: activeHistoryKey,
      identifier:
        activeChapter?.fileName ??
        (result.status === "ready" ? result.fileName : activeHistoryKey),
      displayTitle,
      seriesName: activeSeries?.name,
      page: currentPage,
      totalPages: pages.length,
      savedAt: Date.now(),
      source: activeSource,
    };

    saveHistory(entry);
    setHistory(loadHistory());
  }, [currentPage, view, activeHistoryKey, pages.length]);

  // Refresh history on return to home
  useEffect(() => {
    if (view === "home") {
      setHistory(loadHistory());
      prevPageRef.current = -1;
    }
  }, [view]);

  // ── OPEN FUNCTIONS ───────────────────────────────────────────────────────────

  const openFile = useCallback(
    (file: File) => {
      const key = `file::${file.name}`;
      setActiveSeries(null);
      setActiveChapter(null);
      setActiveHistoryKey(key);
      setActiveSource("file");
      const hist = getHistoryEntry(key);
      if (hist && hist.page > 0) pendingPageRestoreRef.current = hist.page;
      loadFile(file);
      setView("reader");
    },
    [loadFile],
  );

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
      setActiveSource("folder");
      const hist = getHistoryEntry(key);
      if (hist && hist.page > 0) pendingPageRestoreRef.current = hist.page;
      loadFile(file);
      setView("reader");
    },
    [loadFile],
  );

  // Resume from history
  const handleContinueReading = useCallback(
    (entry: HistoryEntry) => {
      if (entry.source === "folder") {
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
        alert(
          'Scan your manga folder first to continue this chapter.\n\nClick "Open Folder" and select the same folder.',
        );
      } else {
        alert(
          `To continue reading "${entry.displayTitle}", drag-drop or open that .cbz file again. Your progress (page ${entry.page + 1}) is saved.`,
        );
      }
    },
    [folderState, openChapter],
  );

  // Chapter navigation (folder mode only)
  const chapterIndex =
    activeSeries && activeChapter
      ? activeSeries.chapters.findIndex((c) => c.fileName === activeChapter.fileName)
      : -1;

  const prevChapterEntry =
    chapterIndex > 0 && activeSeries ? activeSeries.chapters[chapterIndex - 1] : null;
  const nextChapterEntry =
    chapterIndex >= 0 && activeSeries && chapterIndex < activeSeries.chapters.length - 1
      ? activeSeries.chapters[chapterIndex + 1]
      : null;

  const handlePrevChapter = useCallback(() => {
    if (prevChapterEntry && activeSeries) openChapter(activeSeries, prevChapterEntry);
  }, [prevChapterEntry, activeSeries, openChapter]);

  const handleNextChapter = useCallback(() => {
    if (nextChapterEntry && activeSeries) openChapter(activeSeries, nextChapterEntry);
  }, [nextChapterEntry, activeSeries, openChapter]);

  // Back from reader
  const handleReaderBack = useCallback(() => {
    if (activeHistoryKey && pages.length > 0) {
      let displayTitle = "";
      if (activeChapter) {
        displayTitle = activeChapter.name;
      } else if (result.status === "ready") {
        displayTitle = result.fileName.replace(/\.cbz$/i, "");
      }
      if (displayTitle) {
        saveHistory({
          key: activeHistoryKey,
          identifier:
            activeChapter?.fileName ??
            (result.status === "ready" ? result.fileName : activeHistoryKey),
          displayTitle,
          seriesName: activeSeries?.name,
          page: currentPage,
          totalPages: pages.length,
          savedAt: Date.now(),
          source: activeSource,
        });
      }
    }
    resetLoader();
    if (activeSource === "folder" && activeChapter && activeSeries) {
      setView("library");
    } else {
      setView("home");
    }
  }, [
    activeHistoryKey,
    pages.length,
    currentPage,
    activeChapter,
    activeSeries,
    activeSource,
    resetLoader,
    result,
  ]);

  const handleDeleteHistory = useCallback((key: string) => {
    deleteHistoryEntry(key);
    setHistory(loadHistory());
  }, []);

  // ── RENDER ───────────────────────────────────────────────────────────────────

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
    const toolbarFileName = result.status === "ready" ? result.fileName : "";
    const toolbarSeriesName = activeSeries?.name;

    return (
      <div className="w-screen h-screen overflow-hidden bg-neutral-950">
        <MangaToolbar
          fileName={toolbarFileName}
          seriesName={toolbarSeriesName}
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
          onPrevChapter={prevChapterEntry ? handlePrevChapter : undefined}
          onNextChapter={nextChapterEntry ? handleNextChapter : undefined}
          prevChapterLabel={prevChapterEntry?.name}
          nextChapterLabel={nextChapterEntry?.name}
        />
      </div>
    );
  }

  // Loading state
  if (view === "reader" && (result.status === "loading" || result.status === "idle")) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-neutral-950 text-white gap-4">
        <span className="text-4xl">📖</span>
        <p className="text-neutral-400 text-sm">Extracting pages…</p>
        {result.status === "loading" && (
          <>
            <div className="w-64 bg-neutral-800 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${result.progress}%` }}
              />
            </div>
            <p className="text-neutral-600 text-xs tabular-nums">{result.progress}%</p>
          </>
        )}
      </div>
    );
  }

  // Error state
  if (view === "reader" && result.status === "error") {
    const msg = result.message;
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-neutral-950 text-white gap-4">
        <span className="text-4xl">⚠️</span>
        <p className="text-red-400 text-sm max-w-xs text-center">{msg}</p>
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

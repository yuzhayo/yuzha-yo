import React, { useCallback, useRef, useState } from "react";
import type { HistoryEntry, ScannedSeries, ScannedChapter } from "./types";
import type { FolderScanState } from "./useFolderScanner";
import { isFolderScanSupported } from "./useFolderScanner";

type Props = {
  onBack?: () => void;
  history: HistoryEntry[];
  folderState: FolderScanState;
  onScanFolder: () => void;
  onOpenFile: (file: File) => void;
  onContinueReading: (entry: HistoryEntry) => void;
  onOpenSeries: (series: ScannedSeries) => void;
  onDeleteHistory: (key: string) => void;
  onSearch: (query: string) => void;
  isLoadingFile: boolean;
  fileError: string | null;
};

function ProgressBar({ page, total }: { page: number; total: number }) {
  const pct = total > 0 ? Math.round(((page + 1) / total) * 100) : 0;
  const isDone = page >= total - 1 && total > 0;
  return (
    <div className="w-full bg-neutral-700 rounded-full h-1 mt-1.5">
      <div
        className={`h-1 rounded-full transition-all ${isDone ? "bg-green-500" : "bg-blue-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function HistoryCard({
  entry,
  onContinue,
  onDelete,
}: {
  entry: HistoryEntry;
  onContinue: () => void;
  onDelete: () => void;
}) {
  const isDone = entry.page >= entry.totalPages - 1 && entry.totalPages > 0;
  const icon = entry.source === "mangadex" ? "🌐" : "📖";
  return (
    <div className="relative flex-shrink-0 w-36 bg-neutral-800 rounded-xl p-3 cursor-pointer hover:bg-neutral-700 active:bg-neutral-600 transition-colors border border-neutral-700">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-1.5 right-1.5 text-neutral-500 hover:text-red-400 text-xs leading-none p-0.5"
        title="Remove from history"
      >
        ×
      </button>
      <div
        className="flex flex-col gap-1"
        onClick={onContinue}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onContinue()}
      >
        <div className="text-4xl text-center py-2">{icon}</div>
        {entry.seriesName && (
          <p className="text-[10px] text-blue-400 truncate">{entry.seriesName}</p>
        )}
        <p className="text-xs text-white font-medium truncate leading-tight">
          {entry.displayTitle}
        </p>
        <p className="text-[10px] text-neutral-400 tabular-nums">
          {isDone ? "✅ Done" : `Pg ${entry.page + 1} / ${entry.totalPages}`}
        </p>
        <ProgressBar page={entry.page} total={entry.totalPages} />
      </div>
    </div>
  );
}

function SeriesCard({ series, onClick }: { series: ScannedSeries; onClick: () => void }) {
  const readCount = series.chapters.filter(
    (c) => c.historyEntry && c.historyEntry.page >= c.historyEntry.totalPages - 1,
  ).length;
  const startedCount = series.chapters.filter((c) => c.historyEntry).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col bg-neutral-800 rounded-xl overflow-hidden hover:bg-neutral-700 active:bg-neutral-600 transition-colors border border-neutral-700 text-left"
    >
      <div className="flex items-center justify-center h-28 bg-neutral-900 text-5xl">📚</div>
      <div className="p-2.5">
        <p className="text-sm text-white font-medium truncate">{series.name}</p>
        <p className="text-xs text-neutral-400 mt-0.5">
          {series.chapters.length} chapter{series.chapters.length !== 1 ? "s" : ""}
        </p>
        {startedCount > 0 && (
          <p className="text-[10px] text-blue-400 mt-0.5">
            {readCount > 0
              ? `${readCount} / ${series.chapters.length} done`
              : `Ch ${(series.chapters.findIndex((c) => c.historyEntry) ?? 0) + 1} in progress`}
          </p>
        )}
      </div>
    </button>
  );
}

export default function MangaHome({
  onBack,
  history,
  folderState,
  onScanFolder,
  onOpenFile,
  onContinueReading,
  onOpenSeries,
  onDeleteHistory,
  onSearch,
  isLoadingFile,
  fileError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".cbz")) {
        alert("Please select a .cbz file.");
        return;
      }
      onOpenFile(file);
    },
    [onOpenFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchQuery.trim();
      if (q.length >= 2) onSearch(q);
    },
    [searchQuery, onSearch],
  );

  const folderSupported = isFolderScanSupported();

  return (
    <div
      className="flex flex-col w-screen min-h-screen bg-neutral-950 text-white"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {dragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/40 border-4 border-blue-400 border-dashed pointer-events-none">
          <p className="text-2xl font-bold text-blue-200">Drop .cbz file here</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
          >
            ← Back
          </button>
        )}
        <h1 className="text-xl font-bold">📚 Manga Reader</h1>
      </div>

      <div className="flex flex-col gap-5 px-4 pb-8 flex-1">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search MangaDex…"
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={searchQuery.trim().length < 2}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            🔍
          </button>
        </form>
        <p className="text-[10px] text-neutral-600 -mt-3">Powered by MangaDex</p>

        {/* Continue Reading */}
        {history.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Continue Reading
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {history.slice(0, 10).map((entry) => (
                <HistoryCard
                  key={entry.key}
                  entry={entry}
                  onContinue={() => onContinueReading(entry)}
                  onDelete={() => onDeleteHistory(entry.key)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <section className="flex flex-wrap gap-3">
          {folderSupported && (
            <button
              type="button"
              onClick={onScanFolder}
              disabled={folderState.status === "scanning"}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-700 hover:bg-purple-600 active:bg-purple-800 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              {folderState.status === "scanning" ? <>⏳ Scanning…</> : <>📂 Open Folder</>}
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isLoadingFile}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-700 hover:bg-blue-600 active:bg-blue-800 disabled:opacity-50 transition-colors font-medium text-sm"
          >
            {isLoadingFile ? <>⏳ Loading…</> : <>📄 Open File</>}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".cbz"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </section>

        {isLoadingFile && <div className="text-sm text-neutral-400">Extracting pages…</div>}

        {fileError && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
            {fileError}
          </div>
        )}

        {folderState.status === "error" && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
            {folderState.message}
          </div>
        )}

        {/* Library Grid */}
        {folderState.status === "ready" && folderState.series.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              My Library{" "}
              <span className="text-neutral-600 normal-case font-normal">
                ({folderState.series.length})
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {folderState.series.map((series) => (
                <SeriesCard
                  key={series.name}
                  series={series}
                  onClick={() => onOpenSeries(series)}
                />
              ))}
            </div>
          </section>
        )}

        {folderState.status === "ready" && folderState.series.length === 0 && (
          <div className="text-sm text-neutral-500 py-4">No .cbz files found in that folder.</div>
        )}

        {history.length === 0 && folderState.status === "idle" && (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-center gap-3">
            <span className="text-6xl">📖</span>
            <p className="text-neutral-400 text-sm max-w-xs">
              Search MangaDex above, open a folder, or drop a{" "}
              <code className="bg-neutral-800 px-1 rounded text-blue-300">.cbz</code> file anywhere
              on this page.
            </p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-neutral-700 pb-3">
        Local files are processed locally — nothing is uploaded
      </p>
    </div>
  );
}

import type { ScannedSeries, ScannedChapter } from "../types";

type Props = {
  series: ScannedSeries;
  onBack: () => void;
  onOpenChapter: (chapter: ScannedChapter) => void;
};

function ChapterProgress({ chapter }: { chapter: ScannedChapter }) {
  const hist = chapter.historyEntry;
  if (!hist) {
    return <span className="text-xs text-neutral-500">Unread</span>;
  }
  const isDone = hist.page >= hist.totalPages - 1 && hist.totalPages > 0;
  if (isDone) {
    return <span className="text-xs text-green-400">✅ Done</span>;
  }
  return (
    <span className="text-xs text-blue-400 tabular-nums">
      Pg {hist.page + 1} / {hist.totalPages}
    </span>
  );
}

export default function MangaLibrary({ series, onBack, onOpenChapter }: Props) {
  return (
    <div className="flex flex-col w-screen min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-neutral-800">
        <button
          type="button"
          onClick={onBack}
          className="text-sm px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex flex-col min-w-0">
          <h1 className="text-base font-bold truncate">{series.name}</h1>
          <p className="text-xs text-neutral-500">
            {series.chapters.length} chapter{series.chapters.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Chapter list */}
      <div className="flex flex-col divide-y divide-neutral-800 overflow-y-auto">
        {series.chapters.map((chapter) => (
          <button
            key={chapter.fileName}
            type="button"
            onClick={() => onOpenChapter(chapter)}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-800 active:bg-neutral-700 transition-colors text-left w-full"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm text-white font-medium truncate">{chapter.name}</span>
              {chapter.historyEntry && (
                <div className="w-32 bg-neutral-700 rounded-full h-1 mt-1">
                  <div
                    className={`h-1 rounded-full ${
                      chapter.historyEntry.page >= chapter.historyEntry.totalPages - 1
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                    style={{
                      width: `${Math.round(
                        ((chapter.historyEntry.page + 1) / chapter.historyEntry.totalPages) * 100,
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <ChapterProgress chapter={chapter} />
              <span className="text-neutral-600 text-sm">›</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

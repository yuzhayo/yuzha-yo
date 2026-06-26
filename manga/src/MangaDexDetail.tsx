import React, { useState, useEffect } from "react";
import type { MangaDexManga, MangaDexChapter } from "./types";
import {
  getMangaTitle,
  getMangaDescription,
  getCoverUrl,
  getChapterLabel,
  getAvailableLanguages,
  getMangaChapters,
  formatRelativeDate,
  getGenreTags,
} from "./mangaDexApi";
import { getHistoryEntry } from "./useReadingHistory";

type Props = {
  manga: MangaDexManga;
  onBack: () => void;
  onReadChapter: (manga: MangaDexManga, chapter: MangaDexChapter) => void;
};

function StatusBadge({ status }: { status: MangaDexManga["attributes"]["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    ongoing: { label: "Ongoing", cls: "text-green-400" },
    completed: { label: "Completed", cls: "text-neutral-400" },
    hiatus: { label: "Hiatus", cls: "text-yellow-400" },
    cancelled: { label: "Cancelled", cls: "text-red-400" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "text-neutral-400" };
  return <span className={`text-xs font-medium ${cls}`}>{label}</span>;
}

function ChapterProgressBadge({ chapterId }: { chapterId: string }) {
  const hist = getHistoryEntry(`mangadex::${chapterId}`);
  if (!hist) return <span className="text-[10px] text-neutral-600">Unread</span>;
  const isDone = hist.page >= hist.totalPages - 1 && hist.totalPages > 0;
  if (isDone) return <span className="text-[10px] text-green-400">✅ Done</span>;
  return (
    <span className="text-[10px] text-blue-400 tabular-nums">
      Pg {hist.page + 1} / {hist.totalPages}
    </span>
  );
}

export default function MangaDexDetail({ manga, onBack, onReadChapter }: Props) {
  const [chapters, setChapters] = useState<MangaDexChapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [lang, setLang] = useState("en");
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const title = getMangaTitle(manga);
  const coverUrl = getCoverUrl(manga, 512);
  const description = getMangaDescription(manga);
  const genres = getGenreTags(manga);

  useEffect(() => {
    let cancelled = false;
    setLoadingChapters(true);
    setError(null);

    getMangaChapters(manga.id, lang)
      .then((data) => {
        if (cancelled) return;
        setChapters(data);

        // Detect available languages from a broader fetch (use existing data first)
        if (availableLangs.length === 0) {
          const langs = getAvailableLanguages(data);
          // If English has 0 results but langs exist, show what's available
          if (data.length === 0 && langs.length === 0) {
            // Try fetching without language filter to discover available langs
            getMangaChapters(manga.id, "")
              .then((allData) => {
                if (cancelled) return;
                const allLangs = getAvailableLanguages(allData);
                setAvailableLangs(allLangs.length > 0 ? allLangs : ["en"]);
              })
              .catch(() => {
                if (!cancelled) setAvailableLangs(["en"]);
              });
          } else {
            setAvailableLangs(langs.length > 0 ? langs : ["en"]);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load chapters.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingChapters(false);
      });

    return () => {
      cancelled = true;
    };
  }, [manga.id, lang]);

  return (
    <div className="flex flex-col w-screen min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors shrink-0"
        >
          ← Back
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Manga info section */}
        <div className="flex gap-4 px-4 pb-4">
          {/* Cover */}
          <div className="flex-shrink-0 w-28 h-40 rounded-xl overflow-hidden bg-neutral-800">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-col gap-1.5 min-w-0 flex-1 pt-1">
            <h1 className="text-base font-bold leading-tight">{title}</h1>
            <div className="flex items-center gap-2">
              <StatusBadge status={manga.attributes.status} />
              {manga.attributes.lastChapter && (
                <span className="text-xs text-neutral-500">
                  · {manga.attributes.lastChapter} ch
                </span>
              )}
            </div>
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {genres.slice(0, 5).map((g) => (
                  <span
                    key={g}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="px-4 pb-4">
            <p
              className={`text-xs text-neutral-400 leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}
            >
              {description}
            </p>
            {description.length > 200 && (
              <button
                type="button"
                onClick={() => setDescExpanded((v) => !v)}
                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
              >
                {descExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        <div className="border-t border-neutral-800 mx-4" />

        {/* Language selector */}
        {availableLangs.length > 1 && (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-xs text-neutral-400">Language:</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="text-xs bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-white outline-none focus:border-blue-500"
            >
              {availableLangs.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Chapter list */}
        <div className="pb-8">
          {loadingChapters && (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 animate-pulse"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3 bg-neutral-800 rounded w-24" />
                    <div className="h-2 bg-neutral-800 rounded w-16" />
                  </div>
                  <div className="w-16 h-7 bg-neutral-800 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mx-4 mt-4 bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {!loadingChapters && !error && chapters.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-2 text-center">
              <span className="text-4xl">📭</span>
              <p className="text-neutral-400 text-sm">No {lang.toUpperCase()} chapters found</p>
              {availableLangs.length > 1 && (
                <p className="text-neutral-600 text-xs">Try a different language above</p>
              )}
            </div>
          )}

          {!loadingChapters &&
            chapters.map((chapter) => {
              const label = getChapterLabel(chapter);
              const group = chapter.relationships.find((r) => r.type === "scanlation_group");
              const groupName = group?.attributes?.name;
              const date = formatRelativeDate(chapter.attributes.publishAt);

              return (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-3">
                    <span className="text-sm text-white font-medium truncate">{label}</span>
                    <div className="flex items-center gap-2">
                      {groupName && (
                        <span className="text-[10px] text-neutral-500 truncate">{groupName}</span>
                      )}
                      <span className="text-[10px] text-neutral-600">{date}</span>
                    </div>
                    <ChapterProgressBadge chapterId={chapter.id} />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onReadChapter(manga, chapter)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white transition-colors font-medium"
                    >
                      Read ›
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Coming in Phase 3"
                      className="text-xs px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-600 border border-neutral-700 cursor-not-allowed"
                    >
                      ⬇
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

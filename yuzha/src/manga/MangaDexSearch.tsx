import React from "react";
import type { MangaDexManga } from "./types";
import type { SearchState } from "./useMangaDexSearch";
import { getCoverUrl, getMangaTitle, getGenreTags } from "./mangaDexApi";

type Props = {
  state: SearchState;
  query: string;
  onSelectManga: (manga: MangaDexManga) => void;
  onBack: () => void;
};

function StatusBadge({ status }: { status: MangaDexManga["attributes"]["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    ongoing: { label: "Ongoing", cls: "bg-green-800/60 text-green-300" },
    completed: { label: "Completed", cls: "bg-neutral-700 text-neutral-300" },
    hiatus: { label: "Hiatus", cls: "bg-yellow-800/60 text-yellow-300" },
    cancelled: { label: "Cancelled", cls: "bg-red-900/60 text-red-400" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-neutral-700 text-neutral-300" };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cls}`}>{label}</span>
  );
}

function RatingBadge({ rating }: { rating: MangaDexManga["attributes"]["contentRating"] }) {
  if (rating === "safe") return null;
  const map: Record<string, { label: string; cls: string }> = {
    suggestive: { label: "16+", cls: "bg-yellow-800/60 text-yellow-300" },
    erotica: { label: "18+", cls: "bg-red-900/60 text-red-400" },
    pornographic: { label: "18+", cls: "bg-red-900/60 text-red-400" },
  };
  const entry = map[rating];
  if (!entry) return null;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${entry.cls}`}>
      {entry.label}
    </span>
  );
}

function MangaResultCard({
  manga,
  onClick,
}: {
  manga: MangaDexManga;
  onClick: () => void;
}) {
  const title = getMangaTitle(manga);
  const coverUrl = getCoverUrl(manga, 256);
  const genres = getGenreTags(manga).slice(0, 3);
  const desc =
    manga.attributes.description["en"] ?? Object.values(manga.attributes.description)[0] ?? "";
  const shortDesc = desc.length > 120 ? desc.slice(0, 120) + "…" : desc;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex gap-3 w-full text-left p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 transition-colors border border-neutral-700"
    >
      <div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-neutral-700">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
        )}
      </div>

      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate leading-tight">{title}</p>

        <div className="flex items-center gap-1 flex-wrap">
          <StatusBadge status={manga.attributes.status} />
          <RatingBadge rating={manga.attributes.contentRating} />
        </div>

        {genres.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {genres.map((g) => (
              <span
                key={g}
                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {shortDesc && (
          <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">{shortDesc}</p>
        )}
      </div>
    </button>
  );
}

export default function MangaDexSearch({ state, query, onSelectManga, onBack }: Props) {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-neutral-800 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="text-sm px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors shrink-0"
        >
          ← Back
        </button>
        <div className="flex flex-col min-w-0">
          <h1 className="text-base font-bold">Search Results</h1>
          {query && <p className="text-xs text-neutral-500 truncate">"{query}"</p>}
        </div>
        {state.status === "searching" && (
          <div className="ml-auto shrink-0 text-xs text-neutral-500">Searching…</div>
        )}
      </div>

      <div className="flex flex-col gap-2 px-4 py-4 overflow-y-auto flex-1">
        {/* Error */}
        {state.status === "error" && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
            {state.message}
          </div>
        )}

        {/* Results */}
        {state.status === "ready" && state.results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-5xl">🔍</span>
            <p className="text-neutral-400 text-sm">No results for "{state.query}"</p>
            <p className="text-neutral-600 text-xs">Try a different title or spelling</p>
          </div>
        )}

        {state.status === "ready" &&
          state.results.map((manga) => (
            <MangaResultCard
              key={manga.id}
              manga={manga}
              onClick={() => onSelectManga(manga)}
            />
          ))}

        {/* Idle / searching placeholders */}
        {state.status === "searching" && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-xl bg-neutral-800 border border-neutral-700 animate-pulse"
              >
                <div className="w-16 h-24 rounded-lg bg-neutral-700" />
                <div className="flex flex-col gap-2 flex-1 py-1">
                  <div className="h-3 bg-neutral-700 rounded w-3/4" />
                  <div className="h-2 bg-neutral-700 rounded w-1/4" />
                  <div className="h-2 bg-neutral-700 rounded w-full" />
                  <div className="h-2 bg-neutral-700 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-neutral-700 pb-3">
        Results powered by MangaDex
      </p>
    </div>
  );
}

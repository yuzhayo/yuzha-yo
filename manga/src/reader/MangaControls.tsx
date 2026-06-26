import React from "react";
import type { ReadingMode } from "../types";

type Props = {
  currentPage: number;
  totalPages: number;
  zoom: number;
  mode: ReadingMode;
  rtl: boolean;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleMode: () => void;
  onToggleRtl: () => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  prevChapterLabel?: string;
  nextChapterLabel?: string;
};

export default function MangaControls({
  currentPage,
  totalPages,
  zoom,
  mode,
  rtl,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleMode,
  onToggleRtl,
  onPrevChapter,
  onNextChapter,
  prevChapterLabel,
  nextChapterLabel,
}: Props) {
  const btnBase = "text-xs px-3 py-2 rounded-lg text-white border transition-colors select-none";
  const btnNormal = `${btnBase} bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border-neutral-700`;
  const btnActive = `${btnBase} bg-blue-700 hover:bg-blue-600 active:bg-blue-800 border-blue-600`;
  const btnDisabled = `${btnBase} bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed`;
  const btnChapter = `${btnBase} bg-purple-800 hover:bg-purple-700 active:bg-purple-900 border-purple-700`;
  const btnChapterDisabled = `${btnBase} bg-neutral-900 border-neutral-800 text-neutral-700 cursor-not-allowed`;

  const isLastPage = currentPage >= totalPages - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-3 py-2 bg-black/85 backdrop-blur-sm border-t border-white/5">
      {/* Page nav */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage === 0}
          className={currentPage === 0 ? btnDisabled : btnNormal}
        >
          ‹ Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isLastPage}
          className={isLastPage ? btnDisabled : btnNormal}
        >
          Next ›
        </button>
      </div>

      {/* Prev chapter — fills left empty slot */}
      <div className="flex">
        {onPrevChapter ? (
          <button
            type="button"
            onClick={onPrevChapter}
            title={prevChapterLabel ? `Previous: ${prevChapterLabel}` : "Previous chapter"}
            className={btnChapter}
          >
            ‹ Ch
          </button>
        ) : (
          <button type="button" disabled className={btnChapterDisabled}>
            ‹ Ch
          </button>
        )}
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <button type="button" onClick={onZoomOut} className={btnNormal}>
          −
        </button>
        <button
          type="button"
          onClick={onResetZoom}
          className="text-xs px-2 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 tabular-nums w-14 text-center transition-colors"
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" onClick={onZoomIn} className={btnNormal}>
          +
        </button>
      </div>

      {/* Next chapter — fills right empty slot; highlights on last page */}
      <div className="flex">
        {onNextChapter ? (
          <button
            type="button"
            onClick={onNextChapter}
            title={nextChapterLabel ? `Next: ${nextChapterLabel}` : "Next chapter"}
            className={
              isLastPage
                ? `${btnBase} bg-green-700 hover:bg-green-600 active:bg-green-800 border-green-600 font-semibold`
                : btnChapter
            }
          >
            Ch ›
          </button>
        ) : (
          <button type="button" disabled className={btnChapterDisabled}>
            Ch ›
          </button>
        )}
      </div>

      {/* Mode toggles */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onToggleMode}
          className={mode === "webtoon" ? btnActive : btnNormal}
          title={mode === "webtoon" ? "Switch to single page" : "Switch to webtoon scroll"}
        >
          {mode === "webtoon" ? "📜 Webtoon" : "📖 Single"}
        </button>
        <button
          type="button"
          onClick={onToggleRtl}
          className={rtl ? btnActive : btnNormal}
          title="Right-to-left reading (manga style)"
        >
          {rtl ? "RTL ✓" : "RTL"}
        </button>
      </div>
    </div>
  );
}

import React from "react";
import type { ReadingMode } from "./types";

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
}: Props) {
  const btnBase =
    "text-xs px-3 py-2 rounded-lg text-white border transition-colors select-none";
  const btnNormal = `${btnBase} bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border-neutral-700`;
  const btnActive = `${btnBase} bg-blue-700 hover:bg-blue-600 active:bg-blue-800 border-blue-600`;
  const btnDisabled = `${btnBase} bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-3 py-2 bg-black/85 backdrop-blur-sm border-t border-white/5 flex-wrap">
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
          disabled={currentPage >= totalPages - 1}
          className={currentPage >= totalPages - 1 ? btnDisabled : btnNormal}
        >
          Next ›
        </button>
      </div>

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

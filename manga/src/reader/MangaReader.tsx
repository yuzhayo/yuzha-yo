import React, { useRef, useCallback } from "react";
import type { ReadingMode } from "../types";

type Props = {
  pages: string[];
  currentPage: number;
  zoom: number;
  mode: ReadingMode;
  rtl: boolean;
  onNext: () => void;
  onPrev: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

const TOOLBAR_HEIGHT = 44;
const CONTROLS_HEIGHT = 52;

export default function MangaReader({
  pages,
  currentPage,
  zoom,
  mode,
  rtl,
  onNext,
  onPrev,
  onZoomIn,
  onZoomOut,
}: Props) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastPinchDist = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t0 = e.touches[0]!;
      const t1 = e.touches[1]!;
      const dx = t0.clientX - t1.clientX;
      const dy = t0.clientY - t1.clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
      return;
    }
    touchStartX.current = e.touches[0]!.clientX;
    touchStartY.current = e.touches[0]!.clientY;
    lastPinchDist.current = null;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDist.current !== null) {
        const t0 = e.touches[0]!;
        const t1 = e.touches[1]!;
        const dx = t0.clientX - t1.clientX;
        const dy = t0.clientY - t1.clientY;
        const dist = Math.hypot(dx, dy);
        if (dist > lastPinchDist.current + 8) onZoomIn();
        else if (dist < lastPinchDist.current - 8) onZoomOut();
        lastPinchDist.current = dist;
      }
    },
    [onZoomIn, onZoomOut],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (lastPinchDist.current !== null) {
        lastPinchDist.current = null;
        return;
      }
      const dx = e.changedTouches[0]!.clientX - touchStartX.current;
      const dy = e.changedTouches[0]!.clientY - touchStartY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) rtl ? onPrev() : onNext();
        else rtl ? onNext() : onPrev();
      }
    },
    [onNext, onPrev, rtl],
  );

  const paddingTop = `${TOOLBAR_HEIGHT}px`;
  const paddingBottom = `${CONTROLS_HEIGHT}px`;

  if (mode === "single") {
    const src = pages[currentPage];

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mid = rect.width / 2;
      const x = e.clientX - rect.left;
      if (x > mid) rtl ? onPrev() : onNext();
      else rtl ? onNext() : onPrev();
    };

    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-neutral-950 cursor-pointer"
        style={{ paddingTop, paddingBottom }}
        onClick={handleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {src && (
          <img
            key={src}
            src={src}
            alt={`Page ${currentPage + 1}`}
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              userSelect: "none",
              pointerEvents: "none",
              transition: "transform 0.15s ease",
            }}
            draggable={false}
          />
        )}
        <div className="absolute inset-y-0 left-0 w-1/3 flex items-center justify-start pl-3 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-white/20 text-3xl">{rtl ? "›" : "‹"}</span>
        </div>
        <div className="absolute inset-y-0 right-0 w-1/3 flex items-center justify-end pr-3 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-white/20 text-3xl">{rtl ? "‹" : "›"}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-neutral-950"
      style={{ paddingTop, paddingBottom }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        style={{
          width: `${zoom * 100}%`,
          maxWidth: zoom <= 1 ? "100%" : undefined,
          margin: "0 auto",
        }}
      >
        {pages.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Page ${i + 1}`}
            style={{ width: "100%", display: "block" }}
            loading="lazy"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}

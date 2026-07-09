import { useState, useCallback } from "react";
import type { ReadingMode } from "@shared/manga-types";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.25;

export function useReaderState(totalPages: number) {
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [mode, setMode] = useState<ReadingMode>("webtoon");
  const [rtl, setRtl] = useState(false);

  const goNext = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 0));
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    },
    [totalPages],
  );

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(+(z + ZOOM_STEP).toFixed(2), MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(+(z - ZOOM_STEP).toFixed(2), MIN_ZOOM));
  }, []);

  const resetZoom = useCallback(() => setZoom(1.0), []);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "single" ? "webtoon" : "single"));
    setZoom(1.0);
    setCurrentPage(0);
  }, []);

  const toggleRtl = useCallback(() => setRtl((r) => !r), []);

  return {
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
  };
}

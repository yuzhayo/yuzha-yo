import React from "react";
import { useCbzLoader } from "./useCbzLoader";
import { useReaderState } from "./useReaderState";
import { useKeyboardNav } from "./useKeyboardNav";
import MangaUploader from "./MangaUploader";
import MangaReader from "./MangaReader";
import MangaToolbar from "./MangaToolbar";
import MangaControls from "./MangaControls";

type Props = {
  onBack?: () => void;
};

export default function MangaReaderScreen({ onBack }: Props) {
  const { result, loadFile, reset } = useCbzLoader();
  const isReady = result.status === "ready";
  const pages = isReady ? result.pages : [];

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
    enabled: isReady,
  });

  const handleBack = () => {
    if (isReady) {
      reset();
    } else if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  if (!isReady) {
    return (
      <MangaUploader
        onFile={loadFile}
        isLoading={result.status === "loading"}
        progress={result.status === "loading" ? result.progress : 0}
        error={result.status === "error" ? result.message : null}
      />
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-neutral-950">
      <MangaToolbar
        fileName={result.fileName}
        currentPage={currentPage}
        totalPages={pages.length}
        onBack={handleBack}
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

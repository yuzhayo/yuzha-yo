import { useEffect } from "react";

type KeyboardNavOptions = {
  onNext: () => void;
  onPrev: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  rtl: boolean;
  enabled: boolean;
};

export function useKeyboardNav(opts: KeyboardNavOptions) {
  useEffect(() => {
    if (!opts.enabled) return;

    const { onNext, onPrev, onZoomIn, onZoomOut, onResetZoom, rtl } = opts;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowRight":
          rtl ? onPrev() : onNext();
          break;
        case "ArrowLeft":
          rtl ? onNext() : onPrev();
          break;
        case "ArrowDown":
          onNext();
          break;
        case "ArrowUp":
          onPrev();
          break;
        case "+":
        case "=":
          onZoomIn();
          break;
        case "-":
          onZoomOut();
          break;
        case "0":
          onResetZoom();
          break;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY < 0) onZoomIn();
      else onZoomOut();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
    };
  }, [opts]);
}

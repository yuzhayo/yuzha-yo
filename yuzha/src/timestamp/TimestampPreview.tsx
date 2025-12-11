import React, { useRef, useEffect, useCallback } from "react";

export type TimestampPreviewProps = {
  widthPx: number;
  heightPx: number;
  imageSrc: string | null;
  scale: number;
  translateX: number;
  translateY: number;
  rotation?: number;
  onScaleChange: (scale: number) => void;
  onTranslateChange: (x: number, y: number) => void;
  onBoundsChange: (bounds: { x: number; y: number; width: number; height: number }) => void;
};

export default function TimestampPreview({
  widthPx,
  heightPx,
  imageSrc,
  scale,
  translateX,
  translateY,
  rotation = 0,
  onScaleChange,
  onTranslateChange,
  onBoundsChange,
}: TimestampPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

  const isPinching = useRef(false);
  const initialPinchDistance = useRef(0);
  const initialPinchScale = useRef(1);
  const lastTapTime = useRef(0);

  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        onBoundsChange({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateBounds();

    const resizeObserver = new ResizeObserver(updateBounds);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateBounds);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateBounds);
    };
  }, [onBoundsChange, widthPx, heightPx]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!imageSrc) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(5, scale * delta));
      onScaleChange(newScale);
    },
    [imageSrc, scale, onScaleChange]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!imageSrc) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      translateStart.current = { x: translateX, y: translateY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [imageSrc, translateX, translateY]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning.current || !imageSrc) return;
      const deltaX = e.clientX - panStart.current.x;
      const deltaY = e.clientY - panStart.current.y;
      onTranslateChange(translateStart.current.x + deltaX, translateStart.current.y + deltaY);
    },
    [imageSrc, onTranslateChange]
  );

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch0 = touches[0];
    const touch1 = touches[1];
    if (!touch0 || !touch1) return 0;
    const dx = touch0.clientX - touch1.clientX;
    const dy = touch0.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!imageSrc) return;

      if (e.touches.length === 1) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime.current;

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
          e.preventDefault();
          onScaleChange(1);
          onTranslateChange(0, 0);
          lastTapTime.current = 0;
        } else {
          lastTapTime.current = now;
        }
      }

      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching.current = true;
        isPanning.current = false;
        initialPinchDistance.current = getTouchDistance(e.touches);
        initialPinchScale.current = scale;
      }
    },
    [imageSrc, scale, onScaleChange, onTranslateChange]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!imageSrc || !isPinching.current) return;

      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);

        if (initialPinchDistance.current > 0) {
          const scaleChange = currentDistance / initialPinchDistance.current;
          const newScale = Math.max(0.1, Math.min(5, initialPinchScale.current * scaleChange));
          onScaleChange(newScale);
        }
      }
    },
    [imageSrc, onScaleChange]
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      isPinching.current = false;
      initialPinchDistance.current = 0;
    }
  }, []);

  return (
    <div className="flex flex-1 items-start justify-center">
      <div
        ref={containerRef}
        className="relative border-2 border-emerald-400/70 overflow-hidden bg-slate-900"
        style={{
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          cursor: imageSrc ? "grab" : "default",
          touchAction: "none",
        }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm pointer-events-none" />
        {imageSrc && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`,
              transformOrigin: "center center",
              pointerEvents: "none",
            }}
          >
            <img
              src={imageSrc}
              alt="Preview"
              className="max-w-none"
              style={{ userSelect: "none", pointerEvents: "none" }}
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

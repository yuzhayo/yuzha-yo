import React, { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type Position = { x: number; y: number };
type Size = { width: number; height: number };
type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | null;

export type FloatingBorderlessProps = {
  children: ReactNode;
  initialPos?: Position;
  initialSize?: Size;
  minWidth?: number;
  minHeight?: number;
  zIndex?: number;
  onChange?: (pos: Position, size: Size) => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * FloatingBorderless - chrome-free draggable + resizable container.
 * Reuses the drag/resize mechanics from FloatingWindowTemplate but without header or background.
 */
export default function FloatingBorderless({
  children,
  initialPos = { x: 120, y: 120 },
  initialSize = { width: 240, height: 120 },
  minWidth = 80,
  minHeight = 60,
  zIndex = 1000,
  onChange,
  className,
  style,
}: FloatingBorderlessProps) {
  const viewportMargin = 8;
  const [position, setPosition] = useState<Position>(initialPos);
  const [size, setSize] = useState<Size>(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const resizeStartRef = useRef<{ pos: Position; size: Size }>({
    pos: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
  });

  useEffect(() => {
    onChange?.(position, size);
  }, [position, size, onChange]);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".fb-resize")) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDrag = (e: PointerEvent) => {
    if (!isDragging) return;
    const maxX = Math.max(0, window.innerWidth - size.width - viewportMargin);
    const maxY = Math.max(0, window.innerHeight - size.height - viewportMargin);
    const newX = Math.max(viewportMargin, Math.min(e.clientX - dragStartRef.current.x, maxX));
    const newY = Math.max(viewportMargin, Math.min(e.clientY - dragStartRef.current.y, maxY));
    setPosition({ x: newX, y: newY });
  };
  const endDrag = () => setIsDragging(false);

  const startResize = (e: React.PointerEvent<HTMLDivElement>, handle: ResizeHandle) => {
    e.stopPropagation();
    setIsResizing(true);
    setActiveHandle(handle);
    resizeStartRef.current = { pos: { x: e.clientX, y: e.clientY }, size: { ...size } };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onResize = (e: PointerEvent) => {
    if (!isResizing || !activeHandle) return;
    const { size: startSize, pos: startPos } = resizeStartRef.current;
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    let { width, height } = startSize;
    let { x, y } = position;

    if (activeHandle.includes("e")) width = Math.max(minWidth, startSize.width + deltaX);
    if (activeHandle.includes("s")) height = Math.max(minHeight, startSize.height + deltaY);
    if (activeHandle.includes("w")) {
      const proposed = startSize.width - deltaX;
      if (proposed >= minWidth) {
        width = proposed;
        x = position.x + deltaX;
      }
    }
    if (activeHandle.includes("n")) {
      const proposed = startSize.height - deltaY;
      if (proposed >= minHeight) {
        height = proposed;
        y = position.y + deltaY;
      }
    }

    const maxX = Math.max(0, window.innerWidth - width - viewportMargin);
    const maxY = Math.max(0, window.innerHeight - height - viewportMargin);
    x = Math.max(viewportMargin, Math.min(x, maxX));
    y = Math.max(viewportMargin, Math.min(y, maxY));

    setSize({ width, height });
    setPosition({ x, y });
  };
  const endResize = () => {
    setIsResizing(false);
    setActiveHandle(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", onDrag);
      window.addEventListener("pointerup", endDrag);
      return () => {
        window.removeEventListener("pointermove", onDrag);
        window.removeEventListener("pointerup", endDrag);
      };
    }
  }, [isDragging, position, size]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("pointermove", onResize);
      window.addEventListener("pointerup", endResize);
      return () => {
        window.removeEventListener("pointermove", onResize);
        window.removeEventListener("pointerup", endResize);
      };
    }
  }, [isResizing, activeHandle, position, size]);

  useEffect(() => {
    const clampToViewport = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setSize((prev) => ({
        width: Math.min(Math.max(prev.width, minWidth), Math.max(0, vw - viewportMargin * 2)),
        height: Math.min(Math.max(prev.height, minHeight), Math.max(0, vh - viewportMargin * 2)),
      }));
      setPosition((prev) => ({
        x: Math.min(Math.max(prev.x, viewportMargin), Math.max(viewportMargin, vw - viewportMargin - size.width)),
        y: Math.min(Math.max(prev.y, viewportMargin), Math.max(viewportMargin, vh - viewportMargin - size.height)),
      }));
    };
    clampToViewport();
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [minWidth, minHeight, size.width, size.height]);

  const handleSize = 8;
  const edgeSize = 6;
  const baseHandleStyle: CSSProperties = { position: "absolute", touchAction: "none" };
  const handles: Array<{ h: ResizeHandle; style: CSSProperties; cursor: string }> = [
    { h: "n", style: { top: 0, left: 0, right: 0, height: edgeSize }, cursor: "ns-resize" },
    { h: "s", style: { bottom: 0, left: 0, right: 0, height: edgeSize }, cursor: "ns-resize" },
    { h: "e", style: { right: 0, top: 0, bottom: 0, width: edgeSize }, cursor: "ew-resize" },
    { h: "w", style: { left: 0, top: 0, bottom: 0, width: edgeSize }, cursor: "ew-resize" },
    { h: "ne", style: { top: 0, right: 0, width: handleSize, height: handleSize }, cursor: "nesw-resize" },
    { h: "nw", style: { top: 0, left: 0, width: handleSize, height: handleSize }, cursor: "nwse-resize" },
    { h: "se", style: { bottom: 0, right: 0, width: handleSize, height: handleSize }, cursor: "nwse-resize" },
    { h: "sw", style: { bottom: 0, left: 0, width: handleSize, height: handleSize }, cursor: "nesw-resize" },
  ];

  const containerStyle: CSSProperties = {
    position: "fixed",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    touchAction: "none",
    userSelect: isDragging || isResizing ? "none" : "auto",
    zIndex,
    background: "transparent",
    overflow: "visible",
    ...style,
  };

  return (
    <div style={containerStyle} className={className ?? ""}>
      <div
        className="fb-drag-surface"
        style={{ width: "100%", height: "100%", position: "relative" }}
        onPointerDown={startDrag}
      >
        {children}
        {handles.map(({ h, style: s, cursor }) => (
          <div
            key={h}
            className="fb-resize"
            style={{ ...baseHandleStyle, ...s, cursor }}
            onPointerDown={(e) => startResize(e, h)}
          />
        ))}
      </div>
    </div>
  );
}

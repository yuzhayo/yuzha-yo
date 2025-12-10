import React, { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type Position = { x: number; y: number };
type Size = { width: number; height: number };
type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | null;

export type BoundingRect = { x: number; y: number; width: number; height: number };

export type FloatingBorderlessProps = {
  children: ReactNode;
  initialPos?: Position;
  initialSize?: Size;
  /** Controlled position; if provided, internal position will sync to this. */
  pos?: Position;
  /** Controlled size; if provided, internal size will sync to this. */
  size?: Size;
  minWidth?: number;
  minHeight?: number;
  zIndex?: number;
  onChange?: (pos: Position, size: Size) => void;
  className?: string;
  style?: CSSProperties;
  /** Delay before drag activates (ms). Useful to avoid accidental drags on tap. */
  dragDelayMs?: number;
  /** Custom bounding rect to clamp within instead of viewport. Coordinates are absolute screen position. */
  boundingRect?: BoundingRect;
  /** If true, disable resize handles */
  disableResize?: boolean;
};

/**
 * FloatingBorderless - chrome-free draggable + resizable container.
 * Reuses the drag/resize mechanics from FloatingWindowTemplate but without header or background.
 */
export default function FloatingBorderless({
  children,
  initialPos = { x: 120, y: 120 },
  initialSize = { width: 240, height: 120 },
  pos,
  size: controlledSize,
  minWidth = 80,
  minHeight = 60,
  zIndex = 1000,
  onChange,
  className,
  style,
  dragDelayMs = 0,
  boundingRect,
  disableResize = false,
}: FloatingBorderlessProps) {
  const viewportMargin = 8;

  const getBounds = () => {
    if (boundingRect) {
      return {
        minX: boundingRect.x,
        minY: boundingRect.y,
        maxWidth: boundingRect.width,
        maxHeight: boundingRect.height,
      };
    }
    return {
      minX: viewportMargin,
      minY: viewportMargin,
      maxWidth: window.innerWidth - viewportMargin * 2,
      maxHeight: window.innerHeight - viewportMargin * 2,
    };
  };
  // Use controlled pos/size as initial value if provided, otherwise use initialPos/initialSize
  const [position, setPosition] = useState<Position>(pos ?? initialPos);
  const [size, setSize] = useState<Size>(controlledSize ?? initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const resizeStartRef = useRef<{ pos: Position; size: Size }>({
    pos: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
  });
  const dragTimerRef = useRef<number | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track if we're currently syncing from parent to avoid feedback loops
  const isSyncingFromParentRef = useRef(false);
  const prevPosRef = useRef<Position | null>(null);
  const prevSizeRef = useRef<Size | null>(null);

  // Report changes to parent - but only when not syncing from parent
  useEffect(() => {
    if (isSyncingFromParentRef.current) {
      isSyncingFromParentRef.current = false;
      return;
    }
    
    const posChanged = prevPosRef.current === null || prevPosRef.current.x !== position.x || prevPosRef.current.y !== position.y;
    const sizeChanged = prevSizeRef.current === null || prevSizeRef.current.width !== size.width || prevSizeRef.current.height !== size.height;
    
    if (posChanged || sizeChanged) {
      prevPosRef.current = { ...position };
      prevSizeRef.current = { ...size };
      onChangeRef.current?.(position, size);
    }
  }, [position, size]);

  // Sync controlled position from parent - use functional update to compare with current state
  const posX = pos?.x;
  const posY = pos?.y;
  useEffect(() => {
    if (posX !== undefined && posY !== undefined) {
      setPosition((prev) => {
        if (prev.x === posX && prev.y === posY) return prev;
        isSyncingFromParentRef.current = true;
        return { x: posX, y: posY };
      });
    }
  }, [posX, posY]);

  const ctrlW = controlledSize?.width;
  const ctrlH = controlledSize?.height;
  useEffect(() => {
    if (ctrlW !== undefined && ctrlH !== undefined) {
      setSize((prev) => {
        if (prev.width === ctrlW && prev.height === ctrlH) return prev;
        isSyncingFromParentRef.current = true;
        return { width: ctrlW, height: ctrlH };
      });
    }
  }, [ctrlW, ctrlH]);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".fb-resize")) return;
    const delay = Math.max(0, dragDelayMs);
    if (delay === 0) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    } else {
      dragTimerRef.current = window.setTimeout(() => {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
      }, delay);
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDrag = (e: PointerEvent) => {
    if (!isDragging) return;
    const bounds = getBounds();
    const maxX = Math.max(0, bounds.minX + bounds.maxWidth - size.width);
    const maxY = Math.max(0, bounds.minY + bounds.maxHeight - size.height);
    const newX = Math.max(bounds.minX, Math.min(e.clientX - dragStartRef.current.x, maxX));
    const newY = Math.max(bounds.minY, Math.min(e.clientY - dragStartRef.current.y, maxY));
    setPosition({ x: newX, y: newY });
  };
  const endDrag = () => {
    if (dragTimerRef.current !== null) {
      window.clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
    setIsDragging(false);
  };

  const startResize = (e: React.PointerEvent<HTMLDivElement>, handle: ResizeHandle) => {
    e.stopPropagation();
    setIsResizing(true);
    setActiveHandle(handle);
    resizeStartRef.current = { pos: { x: e.clientX, y: e.clientY }, size: { ...size } };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onResize = (e: PointerEvent) => {
    if (!isResizing || !activeHandle) return;
    const bounds = getBounds();
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

    const maxX = Math.max(0, bounds.minX + bounds.maxWidth - width);
    const maxY = Math.max(0, bounds.minY + bounds.maxHeight - height);
    x = Math.max(bounds.minX, Math.min(x, maxX));
    y = Math.max(bounds.minY, Math.min(y, maxY));

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

  const boundingX = boundingRect?.x;
  const boundingY = boundingRect?.y;
  const boundingW = boundingRect?.width;
  const boundingH = boundingRect?.height;

  // Use ref to track current size for clampToBounds without creating dependency loop
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useEffect(() => {
    const clampToBounds = () => {
      const bounds = getBounds();
      const currentSize = sizeRef.current;
      
      setSize((prev) => {
        const newW = Math.min(Math.max(prev.width, minWidth), Math.max(0, bounds.maxWidth));
        const newH = Math.min(Math.max(prev.height, minHeight), Math.max(0, bounds.maxHeight));
        if (prev.width === newW && prev.height === newH) return prev;
        return { width: newW, height: newH };
      });
      
      setPosition((prev) => {
        const newX = Math.min(Math.max(prev.x, bounds.minX), Math.max(bounds.minX, bounds.minX + bounds.maxWidth - currentSize.width));
        const newY = Math.min(Math.max(prev.y, bounds.minY), Math.max(bounds.minY, bounds.minY + bounds.maxHeight - currentSize.height));
        if (prev.x === newX && prev.y === newY) return prev;
        return { x: newX, y: newY };
      });
    };
    clampToBounds();
    window.addEventListener("resize", clampToBounds);
    return () => window.removeEventListener("resize", clampToBounds);
  }, [minWidth, minHeight, boundingX, boundingY, boundingW, boundingH]);

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
        {!disableResize && handles.map(({ h, style: s, cursor }) => (
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

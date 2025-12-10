import React, { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/**
 * FloatingWindowTemplate - Draggable & Resizable Window Component
 *
 * Features:
 * - Drag from header to move
 * - Resize from 8 handles (4 corners + 4 edges)
 * - Support desktop (mouse) and mobile (touch) via Pointer Events API
 * - Boundary constraints to keep window in viewport
 * - Minimum size constraints
 *
 * Usage:
 * ```tsx
 * <FloatingWindowTemplate title="Control Panel">
 *   <YourContent />
 * </FloatingWindowTemplate>
 * ```
 */

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | null;

interface FloatingWindowProps {
  children: React.ReactNode;
  title?: string;
  initialPos?: Position;
  initialSize?: Size;
  minWidth?: number;
  minHeight?: number;
  onClose?: () => void;
}

export default function FloatingWindowTemplate({
  children,
  title = "Floating Window",
  initialPos = { x: 100, y: 100 },
  initialSize = { width: 400, height: 300 },
  minWidth = 200,
  minHeight = 150,
  onClose,
}: FloatingWindowProps) {
  const viewportMargin = 12; // keep a small gutter so the window never touches the edges

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

  // Drag handlers
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".resize-handle")) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDrag = (e: PointerEvent) => {
    if (!isDragging) return;

    const maxX = Math.max(0, window.innerWidth - size.width - viewportMargin);
    const maxY = Math.max(0, window.innerHeight - size.height - viewportMargin);
    const minX = viewportMargin;
    const minY = viewportMargin;

    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;

    setPosition({
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY)),
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Resize handlers
  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>, handle: ResizeHandle) => {
    e.stopPropagation();
    setIsResizing(true);
    setActiveHandle(handle);
    resizeStartRef.current = {
      pos: { x: e.clientX, y: e.clientY },
      size: { ...size },
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleResize = (e: PointerEvent) => {
    if (!isResizing || !activeHandle) return;

    const deltaX = e.clientX - resizeStartRef.current.pos.x;
    const deltaY = e.clientY - resizeStartRef.current.pos.y;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newWidth = resizeStartRef.current.size.width;
    let newHeight = resizeStartRef.current.size.height;
    let newX = position.x;
    let newY = position.y;

    // Handle horizontal resize
    if (activeHandle.includes("e")) {
      newWidth = Math.max(minWidth, resizeStartRef.current.size.width + deltaX);
    } else if (activeHandle.includes("w")) {
      const proposedWidth = resizeStartRef.current.size.width - deltaX;
      if (proposedWidth >= minWidth) {
        newWidth = proposedWidth;
        newX = position.x + deltaX;
      }
    }

    // Handle vertical resize
    if (activeHandle.includes("s")) {
      newHeight = Math.max(minHeight, resizeStartRef.current.size.height + deltaY);
    } else if (activeHandle.includes("n")) {
      const proposedHeight = resizeStartRef.current.size.height - deltaY;
      if (proposedHeight >= minHeight) {
        newHeight = proposedHeight;
        newY = position.y + deltaY;
      }
    }

    // Apply boundary constraints
    const fitDimension = (value: number, min: number, max: number) =>
      Math.max(Math.min(value, max), Math.min(min, max));

    const maxWidth = Math.max(0, viewportWidth - newX - viewportMargin);
    const maxHeight = Math.max(0, viewportHeight - newY - viewportMargin);
    newWidth = fitDimension(newWidth, minWidth, maxWidth);
    newHeight = fitDimension(newHeight, minHeight, maxHeight);

    if (newX < viewportMargin) {
      const diff = viewportMargin - newX;
      newX = viewportMargin;
      newWidth = Math.max(minWidth, newWidth - diff);
    }
    if (newY < viewportMargin) {
      const diff = viewportMargin - newY;
      newY = viewportMargin;
      newHeight = Math.max(minHeight, newHeight - diff);
    }

    setSize({ width: newWidth, height: newHeight });
    setPosition({ x: newX, y: newY });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setActiveHandle(null);
  };

  // Global event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handleDrag);
      window.addEventListener("pointerup", handleDragEnd);
      return () => {
        window.removeEventListener("pointermove", handleDrag);
        window.removeEventListener("pointerup", handleDragEnd);
      };
    }
  }, [isDragging, position, size]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("pointermove", handleResize);
      window.addEventListener("pointerup", handleResizeEnd);
      return () => {
        window.removeEventListener("pointermove", handleResize);
        window.removeEventListener("pointerup", handleResizeEnd);
      };
    }
  }, [isResizing, activeHandle, position, size]);

  // Detect touch device for larger handles (deferred to client to avoid SSR issues)
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  // Clamp position/size to viewport (useful on small screens or after rotations)
  useEffect(() => {
    const fitDimension = (value: number, min: number, max: number) =>
      Math.max(Math.min(value, max), Math.min(min, max));

    const clampToViewport = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      setSize((prev) => {
        const maxWidth = Math.max(0, viewportWidth - viewportMargin * 2);
        const maxHeight = Math.max(0, viewportHeight - viewportMargin * 2);
        const nextSize = {
          width: fitDimension(prev.width, minWidth, maxWidth),
          height: fitDimension(prev.height, minHeight, maxHeight),
        };
        // Clamp position against the freshly clamped size so resize feels natural near edges
        setPosition((prevPos) => ({
          x: Math.min(
            Math.max(prevPos.x, viewportMargin),
            Math.max(viewportMargin, viewportWidth - viewportMargin - nextSize.width),
          ),
          y: Math.min(
            Math.max(prevPos.y, viewportMargin),
            Math.max(viewportMargin, viewportHeight - viewportMargin - nextSize.height),
          ),
        }));
        return nextSize;
      });
    };

    clampToViewport();
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [size.width, size.height, minWidth, minHeight]);
  const handleSize = isTouchDevice ? 12 : 6;
  const edgeThickness = isTouchDevice ? 8 : 4;

  const resizeHandles: Array<{ handle: ResizeHandle; style: CSSProperties; cursor: string }> = [
    {
      handle: "n",
      style: { top: 0, left: 0, right: 0, height: edgeThickness },
      cursor: "ns-resize",
    },
    {
      handle: "s",
      style: { bottom: 0, left: 0, right: 0, height: edgeThickness },
      cursor: "ns-resize",
    },
    {
      handle: "e",
      style: { right: 0, top: 0, bottom: 0, width: edgeThickness },
      cursor: "ew-resize",
    },
    {
      handle: "w",
      style: { left: 0, top: 0, bottom: 0, width: edgeThickness },
      cursor: "ew-resize",
    },
    {
      handle: "ne",
      style: { top: 0, right: 0, width: handleSize, height: handleSize },
      cursor: "nesw-resize",
    },
    {
      handle: "nw",
      style: { top: 0, left: 0, width: handleSize, height: handleSize },
      cursor: "nwse-resize",
    },
    {
      handle: "se",
      style: { bottom: 0, right: 0, width: handleSize, height: handleSize },
      cursor: "nwse-resize",
    },
    {
      handle: "sw",
      style: { bottom: 0, left: 0, width: handleSize, height: handleSize },
      cursor: "nesw-resize",
    },
  ];

  const containerStyle: CSSProperties = {
    position: "fixed",
    background: "#ffffff",
    boxShadow: "0 20px 55px rgba(0,0,0,0.25)",
    borderRadius: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    touchAction: "none",
    userSelect: isDragging || isResizing ? "none" : "auto",
    zIndex: 1000,
  };

  const headerStyle: CSSProperties = {
    background: "linear-gradient(90deg, #2563eb, #7c3aed)",
    color: "#ffffff",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "move",
    userSelect: "none",
  };

  const titleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    margin: 0,
    padding: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const closeButtonStyle: CSSProperties = {
    marginLeft: 8,
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    border: "none",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    cursor: "pointer",
    transition: "background 120ms ease",
  };

  const contentStyle: CSSProperties = {
    flex: 1,
    overflow: "auto",
    padding: 16,
    background: "#ffffff",
  };

  const handleBaseStyle: CSSProperties = {
    position: "absolute",
    background: isTouchDevice ? "rgba(59,130,246,0.2)" : "transparent",
    transition: "background 120ms ease",
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle} onPointerDown={handleDragStart}>
        <h3 style={titleStyle} title={title}>
          {title}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={closeButtonStyle}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.24)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div style={contentStyle}>{children}</div>

      {resizeHandles.map(({ handle, style, cursor }) => (
        <div
          key={handle}
          className="resize-handle"
          style={{
            ...handleBaseStyle,
            ...style,
            cursor,
            touchAction: "none",
          }}
          onPointerDown={(e) => handleResizeStart(e, handle)}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.35)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = handleBaseStyle.background as string)
          }
        />
      ))}
    </div>
  );
}

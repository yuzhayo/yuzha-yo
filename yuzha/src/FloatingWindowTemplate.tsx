import React, { useState, useEffect, useRef } from "react";

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

type ResizeHandle = 
  | "n" | "s" | "e" | "w" 
  | "ne" | "nw" | "se" | "sw" 
  | null;

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

    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;

    // Boundary constraints
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
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
    if (newX + newWidth > window.innerWidth) {
      newWidth = window.innerWidth - newX;
    }
    if (newY + newHeight > window.innerHeight) {
      newHeight = window.innerHeight - newY;
    }
    if (newX < 0) {
      newWidth += newX;
      newX = 0;
    }
    if (newY < 0) {
      newHeight += newY;
      newY = 0;
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

  // Detect touch device for larger handles
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const handleSize = isTouchDevice ? 12 : 6;
  const edgeThickness = isTouchDevice ? 8 : 4;

  const resizeHandles: Array<{ handle: ResizeHandle; className: string; cursor: string }> = [
    { handle: "n", className: `top-0 left-0 right-0 h-[${edgeThickness}px]`, cursor: "ns-resize" },
    { handle: "s", className: `bottom-0 left-0 right-0 h-[${edgeThickness}px]`, cursor: "ns-resize" },
    { handle: "e", className: `right-0 top-0 bottom-0 w-[${edgeThickness}px]`, cursor: "ew-resize" },
    { handle: "w", className: `left-0 top-0 bottom-0 w-[${edgeThickness}px]`, cursor: "ew-resize" },
    { handle: "ne", className: `top-0 right-0 w-[${handleSize}px] h-[${handleSize}px]`, cursor: "nesw-resize" },
    { handle: "nw", className: `top-0 left-0 w-[${handleSize}px] h-[${handleSize}px]`, cursor: "nwse-resize" },
    { handle: "se", className: `bottom-0 right-0 w-[${handleSize}px] h-[${handleSize}px]`, cursor: "nwse-resize" },
    { handle: "sw", className: `bottom-0 left-0 w-[${handleSize}px] h-[${handleSize}px]`, cursor: "nesw-resize" },
  ];

  return (
    <div
      className="fixed bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        touchAction: "none",
        userSelect: isDragging || isResizing ? "none" : "auto",
        zIndex: 1000,
      }}
    >
      {/* Header - Drag Area */}
      <div
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between cursor-move select-none"
        onPointerDown={handleDragStart}
        style={{ touchAction: "none" }}
      >
        <h3 className="text-sm font-semibold truncate">{title}</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>

      {/* Resize Handles */}
      {resizeHandles.map(({ handle, className, cursor }) => {
        const isCorner = handle && handle.length === 2;
        const bgClass = isTouchDevice 
          ? (isCorner ? "bg-blue-400/30 hover:bg-blue-500/50" : "bg-blue-400/20 hover:bg-blue-500/40")
          : "hover:bg-blue-500/30";
        
        return (
          <div
            key={handle}
            className={`resize-handle absolute ${className} ${bgClass} transition-colors`}
            style={{ cursor, touchAction: "none" }}
            onPointerDown={(e) => handleResizeStart(e, handle)}
          />
        );
      })}
    </div>
  );
}

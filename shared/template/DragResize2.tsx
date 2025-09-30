/**
 * DragResize2.tsx - Simplified Button + Draggable/Resizable Screen Component
 * 
 * A clean implementation of draggable and resizable popup window with paired button.
 * Based on the HTML template we analyzed, converted to React + TypeScript.
 * 
 * Features:
 * - Button triggers popup (paired together)
 * - Draggable by header
 * - Resizable from 8 directions (N, S, E, W, NE, NW, SE, SW)
 * - Portal rendering (no z-index conflicts)
 * - TypeScript + Tailwind CSS
 * 
 * Usage:
 * ```tsx
 * import DragResize2 from '@shared/template/DragResize2';
 * 
 * <DragResize2 buttonLabel="Open Window" title="My Window">
 *   <div>Your content here</div>
 * </DragResize2>
 * ```
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

// ===================================================================
// TYPES & INTERFACES
// ===================================================================

export type DragResize2Props = {
  /** Button label text */
  buttonLabel?: string;
  /** Window title in header */
  title?: string;
  /** Initial window width */
  initialWidth?: number;
  /** Initial window height */
  initialHeight?: number;
  /** Minimum window width */
  minWidth?: number;
  /** Minimum window height */
  minHeight?: number;
  /** Window content */
  children?: React.ReactNode;
  /** Custom button className */
  buttonClassName?: string;
  /** Custom window className */
  windowClassName?: string;
};

type Position = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export default function DragResize2(props: DragResize2Props) {
  const {
    buttonLabel = "Open Popup",
    title = "Popup Window",
    initialWidth = 400,
    initialHeight = 300,
    minWidth = 200,
    minHeight = 150,
    children,
    buttonClassName,
    windowClassName,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [position, setPosition] = useState<Position>({
    x: 0,
    y: 0,
    width: initialWidth,
    height: initialHeight,
  });

  // Center popup when opened
  useEffect(() => {
    if (isOpen && popupRef.current) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      setPosition((prev) => ({
        ...prev,
        x: (viewportWidth - prev.width) / 2,
        y: (viewportHeight - prev.height) / 2,
      }));
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  // ===================================================================
  // DRAG HANDLERS
  // ===================================================================

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".close-btn")) return;
    if (!popupRef.current) return;

    const rect = popupRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !popupRef.current) return;

      const x = e.clientX - dragOffsetRef.current.x;
      const y = e.clientY - dragOffsetRef.current.y;

      const maxX = window.innerWidth - position.width;
      const maxY = window.innerHeight - position.height;

      setPosition((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY)),
      }));
    },
    [isDragging, position.width, position.height]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ===================================================================
  // RESIZE HANDLERS
  // ===================================================================

  const handleResizeStart = useCallback((e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeHandle(handle);
  }, []);

  const handleResizeMove = useCallback(
    (e: PointerEvent) => {
      if (!isResizing || !resizeHandle || !popupRef.current) return;

      const rect = popupRef.current.getBoundingClientRect();
      let newWidth = position.width;
      let newHeight = position.height;
      let newX = position.x;
      let newY = position.y;

      // East (right edge)
      if (resizeHandle.includes("e")) {
        newWidth = Math.max(minWidth, e.clientX - rect.left);
      }

      // West (left edge)
      if (resizeHandle.includes("w")) {
        const deltaX = e.clientX - rect.left;
        newWidth = Math.max(minWidth, position.width - deltaX);
        newX = position.x + deltaX;
      }

      // South (bottom edge)
      if (resizeHandle.includes("s")) {
        newHeight = Math.max(minHeight, e.clientY - rect.top);
      }

      // North (top edge)
      if (resizeHandle.includes("n")) {
        const deltaY = e.clientY - rect.top;
        newHeight = Math.max(minHeight, position.height - deltaY);
        newY = position.y + deltaY;
      }

      setPosition({ x: newX, y: newY, width: newWidth, height: newHeight });
    },
    [isResizing, resizeHandle, position, minWidth, minHeight]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // ===================================================================
  // GLOBAL EVENT LISTENERS
  // ===================================================================

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handleDragMove);
      window.addEventListener("pointerup", handleDragEnd);
      return () => {
        window.removeEventListener("pointermove", handleDragMove);
        window.removeEventListener("pointerup", handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("pointermove", handleResizeMove);
      window.addEventListener("pointerup", handleResizeEnd);
      return () => {
        window.removeEventListener("pointermove", handleResizeMove);
        window.removeEventListener("pointerup", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Prevent text selection during drag/resize
  useEffect(() => {
    const preventSelect = (e: Event) => {
      if (isDragging || isResizing) {
        e.preventDefault();
      }
    };
    document.addEventListener("selectstart", preventSelect);
    return () => document.removeEventListener("selectstart", preventSelect);
  }, [isDragging, isResizing]);

  // ===================================================================
  // RENDER
  // ===================================================================

  const defaultButtonClass =
    "px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all active:scale-95";

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName || defaultButtonClass}
      >
        {buttonLabel}
      </button>

      {/* POPUP WINDOW (Portal) */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
              ref={popupRef}
              className={
                windowClassName ||
                "absolute bg-white rounded-xl shadow-2xl overflow-hidden hover:shadow-3xl transition-shadow"
              }
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${position.width}px`,
                height: `${position.height}px`,
                minWidth: `${minWidth}px`,
                minHeight: `${minHeight}px`,
              }}
            >
              {/* HEADER - Draggable */}
              <div
                className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white px-4 py-3 select-none flex items-center justify-between"
                onPointerDown={handleDragStart}
                style={{ cursor: isDragging ? "grabbing" : "move" }}
              >
                <div className="font-semibold text-sm">{title}</div>
                <button
                  type="button"
                  className="close-btn w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white text-xs font-bold transition-all hover:scale-110"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                >
                  ×
                </button>
              </div>

              {/* CONTENT */}
              <div className="p-5 h-[calc(100%-48px)] bg-gray-100 overflow-auto">{children}</div>

              {/* RESIZE HANDLES - 8 directions */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 cursor-n-resize bg-transparent hover:bg-blue-400/30"
                onPointerDown={(e) => handleResizeStart(e, "n")}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-1.5 cursor-s-resize bg-transparent hover:bg-blue-400/30"
                onPointerDown={(e) => handleResizeStart(e, "s")}
              />
              <div
                className="absolute top-0 right-0 bottom-0 w-1.5 cursor-e-resize bg-transparent hover:bg-blue-400/30"
                onPointerDown={(e) => handleResizeStart(e, "e")}
              />
              <div
                className="absolute top-0 left-0 bottom-0 w-1.5 cursor-w-resize bg-transparent hover:bg-blue-400/30"
                onPointerDown={(e) => handleResizeStart(e, "w")}
              />
              <div
                className="absolute top-0 right-0 w-6 h-6 cursor-ne-resize bg-transparent hover:bg-blue-400/50 rounded-bl"
                onPointerDown={(e) => handleResizeStart(e, "ne")}
              />
              <div
                className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize bg-transparent hover:bg-blue-400/50 rounded-br"
                onPointerDown={(e) => handleResizeStart(e, "nw")}
              />
              <div
                className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-transparent hover:bg-blue-400/50 rounded-tl"
                onPointerDown={(e) => handleResizeStart(e, "se")}
              />
              <div
                className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize bg-transparent hover:bg-blue-400/50 rounded-tr"
                onPointerDown={(e) => handleResizeStart(e, "sw")}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// Named exports for convenience
export { DragResize2 };

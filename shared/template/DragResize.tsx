/**
 * DragResize.tsx - Standalone Draggable & Resizable Popup Component
 * 
 * Usage Example:
 * ```tsx
 * import { DragResize } from '@shared/template/DragResize';
 * 
 * function MyScreen() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>Open Popup</button>
 *       <DragResize
 *         isOpen={isOpen}
 *         onClose={() => setIsOpen(false)}
 *         title="My Popup"
 *         initialWidth={400}
 *         initialHeight={300}
 *       >
 *         <div>Your custom content here</div>
 *       </DragResize>
 *     </>
 *   );
 * }
 * ```
 */

import React, { useRef, useState, useEffect, useCallback } from "react";

export type DragResizeProps = {
  /** Control popup visibility */
  isOpen: boolean;
  /** Callback when popup should close */
  onClose: () => void;
  /** Popup title in header */
  title?: string;
  /** Custom content to display inside popup */
  children?: React.ReactNode;
  /** Initial width in pixels */
  initialWidth?: number;
  /** Initial height in pixels */
  initialHeight?: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Center popup on open */
  centerOnOpen?: boolean;
  /** Custom header class */
  headerClassName?: string;
  /** Custom content class */
  contentClassName?: string;
};

type DragState = {
  isDragging: boolean;
  offsetX: number;
  offsetY: number;
};

type ResizeState = {
  isResizing: boolean;
  handle: string | null;
};

type Position = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function DragResize({
  isOpen,
  onClose,
  title = "Popup Window",
  children,
  initialWidth = 400,
  initialHeight = 300,
  minWidth = 200,
  minHeight = 150,
  centerOnOpen = true,
  headerClassName = "",
  contentClassName = "",
}: DragResizeProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
  });
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    handle: null,
  });
  const [position, setPosition] = useState<Position>({
    x: 0,
    y: 0,
    width: initialWidth,
    height: initialHeight,
  });

  // Center popup when opened
  useEffect(() => {
    if (isOpen && centerOnOpen && popupRef.current) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      setPosition((prev) => ({
        ...prev,
        x: (viewportWidth - prev.width) / 2,
        y: (viewportHeight - prev.height) / 2,
      }));
    }
  }, [isOpen, centerOnOpen]);

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // ===================================================================
  // DRAGGING LOGIC
  // ===================================================================

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    // Don't drag if clicking close button
    if ((e.target as HTMLElement).closest(".close-btn")) return;

    if (!popupRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = popupRef.current.getBoundingClientRect();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    console.log('[DragResize] Drag start', { clientX: e.clientX, clientY: e.clientY });

    setDragState({
      isDragging: true,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  }, []);

  const handleDragMove = useCallback(
    (e: Event) => {
      const pe = e as PointerEvent;
      if (!dragState.isDragging || !popupRef.current) return;
      e.preventDefault();

      const x = pe.clientX - dragState.offsetX;
      const y = pe.clientY - dragState.offsetY;

      // Keep within viewport
      const maxX = window.innerWidth - position.width;
      const maxY = window.innerHeight - position.height;

      setPosition((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY)),
      }));
    },
    [dragState, position.width, position.height]
  );

  const handleDragEnd = useCallback((e: Event) => {
    console.log('[DragResize] Drag end');
    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // ===================================================================
  // RESIZING LOGIC
  // ===================================================================

  const handleResizeStart = useCallback((e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    console.log('[DragResize] Resize start', { handle });
    setResizeState({ isResizing: true, handle });
  }, []);

  const handleResizeMove = useCallback(
    (e: Event) => {
      const pe = e as PointerEvent;
      if (!resizeState.isResizing || !popupRef.current) return;
      e.preventDefault();

      const rect = popupRef.current.getBoundingClientRect();
      const handle = resizeState.handle;

      let newWidth = position.width;
      let newHeight = position.height;
      let newX = position.x;
      let newY = position.y;

      // East side (right edge)
      if (handle?.includes("e")) {
        newWidth = Math.max(minWidth, pe.clientX - rect.left);
      }

      // West side (left edge)
      if (handle?.includes("w")) {
        const deltaX = pe.clientX - rect.left;
        newWidth = Math.max(minWidth, position.width - deltaX);
        newX = position.x + deltaX;
      }

      // South side (bottom edge)
      if (handle?.includes("s")) {
        newHeight = Math.max(minHeight, pe.clientY - rect.top);
      }

      // North side (top edge)
      if (handle?.includes("n")) {
        const deltaY = pe.clientY - rect.top;
        newHeight = Math.max(minHeight, position.height - deltaY);
        newY = position.y + deltaY;
      }

      setPosition({ x: newX, y: newY, width: newWidth, height: newHeight });
    },
    [resizeState, position, minWidth, minHeight]
  );

  const handleResizeEnd = useCallback((e: Event) => {
    console.log('[DragResize] Resize end');
    setResizeState({ isResizing: false, handle: null });
  }, []);

  // ===================================================================
  // POINTER EVENT LISTENERS
  // ===================================================================

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener("pointermove", handleDragMove);
      document.addEventListener("pointerup", handleDragEnd);
      return () => {
        document.removeEventListener("pointermove", handleDragMove);
        document.removeEventListener("pointerup", handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (resizeState.isResizing) {
      document.addEventListener("pointermove", handleResizeMove);
      document.addEventListener("pointerup", handleResizeEnd);
      return () => {
        document.removeEventListener("pointermove", handleResizeMove);
        document.removeEventListener("pointerup", handleResizeEnd);
      };
    }
  }, [resizeState.isResizing, handleResizeMove, handleResizeEnd]);

  // Prevent text selection during drag/resize
  useEffect(() => {
    const preventSelect = (e: Event) => {
      if (dragState.isDragging || resizeState.isResizing) {
        e.preventDefault();
      }
    };
    document.addEventListener("selectstart", preventSelect);
    return () => document.removeEventListener("selectstart", preventSelect);
  }, [dragState.isDragging, resizeState.isResizing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={popupRef}
        className="absolute bg-white rounded-xl shadow-2xl overflow-hidden transition-shadow hover:shadow-3xl"
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
          className={`bg-gradient-to-r from-blue-400 to-cyan-400 text-white px-4 py-3 cursor-move select-none flex items-center justify-between ${headerClassName}`}
          onPointerDown={handleDragStart}
          style={{ cursor: dragState.isDragging ? "grabbing" : "move" }}
        >
          <div className="font-semibold text-sm">{title}</div>
          <button
            type="button"
            className="close-btn w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center text-white text-xs font-bold transition-all hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* CONTENT */}
        <div
          className={`p-5 h-[calc(100%-48px)] bg-gray-100 overflow-auto ${contentClassName}`}
        >
          {children}
        </div>

        {/* RESIZE HANDLES - 8 directions (larger touch targets) */}
        {/* North */}
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-n-resize bg-transparent hover:bg-blue-400/30 touch-none"
          onPointerDown={(e) => handleResizeStart(e, "n")}
        />
        {/* South */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize bg-transparent hover:bg-blue-400/30 touch-none"
          onPointerDown={(e) => handleResizeStart(e, "s")}
        />
        {/* East */}
        <div
          className="absolute top-0 right-0 bottom-0 w-2 cursor-e-resize bg-transparent hover:bg-blue-400/30 touch-none"
          onPointerDown={(e) => handleResizeStart(e, "e")}
        />
        {/* West */}
        <div
          className="absolute top-0 left-0 bottom-0 w-2 cursor-w-resize bg-transparent hover:bg-blue-400/30 touch-none"
          onPointerDown={(e) => handleResizeStart(e, "w")}
        />
        {/* Northeast */}
        <div
          className="absolute top-0 right-0 w-6 h-6 cursor-ne-resize bg-transparent hover:bg-blue-400/50 rounded-bl touch-none"
          onPointerDown={(e) => handleResizeStart(e, "ne")}
        />
        {/* Northwest */}
        <div
          className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize bg-transparent hover:bg-blue-400/50 rounded-br touch-none"
          onPointerDown={(e) => handleResizeStart(e, "nw")}
        />
        {/* Southeast */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-transparent hover:bg-blue-400/50 rounded-tl touch-none"
          onPointerDown={(e) => handleResizeStart(e, "se")}
        />
        {/* Southwest */}
        <div
          className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize bg-transparent hover:bg-blue-400/50 rounded-tr touch-none"
          onPointerDown={(e) => handleResizeStart(e, "sw")}
        />
      </div>
    </div>
  );
}

export default DragResize;

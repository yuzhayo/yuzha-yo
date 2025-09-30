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

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Don't drag if clicking close button
    if ((e.target as HTMLElement).closest(".close-btn")) return;

    if (!popupRef.current) return;
    const rect = popupRef.current.getBoundingClientRect();

    setDragState({
      isDragging: true,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  }, []);

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !popupRef.current) return;

      const x = e.clientX - dragState.offsetX;
      const y = e.clientY - dragState.offsetY;

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

  const handleDragEnd = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // ===================================================================
  // RESIZING LOGIC
  // ===================================================================

  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setResizeState({ isResizing: true, handle });
  }, []);

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizeState.isResizing || !popupRef.current) return;

      const rect = popupRef.current.getBoundingClientRect();
      const handle = resizeState.handle;

      let newWidth = position.width;
      let newHeight = position.height;
      let newX = position.x;
      let newY = position.y;

      // East side (right edge)
      if (handle?.includes("e")) {
        newWidth = Math.max(minWidth, e.clientX - rect.left);
      }

      // West side (left edge)
      if (handle?.includes("w")) {
        const deltaX = e.clientX - rect.left;
        newWidth = Math.max(minWidth, position.width - deltaX);
        newX = position.x + deltaX;
      }

      // South side (bottom edge)
      if (handle?.includes("s")) {
        newHeight = Math.max(minHeight, e.clientY - rect.top);
      }

      // North side (top edge)
      if (handle?.includes("n")) {
        const deltaY = e.clientY - rect.top;
        newHeight = Math.max(minHeight, position.height - deltaY);
        newY = position.y + deltaY;
      }

      setPosition({ x: newX, y: newY, width: newWidth, height: newHeight });
    },
    [resizeState, position, minWidth, minHeight]
  );

  const handleResizeEnd = useCallback(() => {
    setResizeState({ isResizing: false, handle: null });
  }, []);

  // ===================================================================
  // MOUSE EVENT LISTENERS
  // ===================================================================

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
      return () => {
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (resizeState.isResizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
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
          onMouseDown={handleDragStart}
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

        {/* RESIZE HANDLES - 8 directions */}
        {/* North */}
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-n-resize bg-transparent hover:bg-blue-400/30"
          onMouseDown={(e) => handleResizeStart(e, "n")}
        />
        {/* South */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize bg-transparent hover:bg-blue-400/30"
          onMouseDown={(e) => handleResizeStart(e, "s")}
        />
        {/* East */}
        <div
          className="absolute top-0 right-0 bottom-0 w-1 cursor-e-resize bg-transparent hover:bg-blue-400/30"
          onMouseDown={(e) => handleResizeStart(e, "e")}
        />
        {/* West */}
        <div
          className="absolute top-0 left-0 bottom-0 w-1 cursor-w-resize bg-transparent hover:bg-blue-400/30"
          onMouseDown={(e) => handleResizeStart(e, "w")}
        />
        {/* Northeast */}
        <div
          className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize bg-transparent hover:bg-blue-400/50 rounded-bl"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
        />
        {/* Northwest */}
        <div
          className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize bg-transparent hover:bg-blue-400/50 rounded-br"
          onMouseDown={(e) => handleResizeStart(e, "nw")}
        />
        {/* Southeast */}
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-transparent hover:bg-blue-400/50 rounded-tl"
          onMouseDown={(e) => handleResizeStart(e, "se")}
        />
        {/* Southwest */}
        <div
          className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize bg-transparent hover:bg-blue-400/50 rounded-tr"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
        />
      </div>
    </div>
  );
}

export default DragResize;

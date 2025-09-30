/**
 * DragResize.tsx - Reusable Template for Button + Draggable/Resizable Screen
 * 
 * Architecture:
 * - SECTION 1: Types & Interfaces (reusable)
 * - SECTION 2: Button Component (image registry support)
 * - SECTION 3: Screen Component (drag & resize with Portal)
 * - SECTION 4: Composite Component (combines both)
 * 
 * Usage Example:
 * ```tsx
 * import { DragResizeButton } from '@shared/template/DragResize';
 * 
 * // Use standalone button (recommended)
 * <DragResizeButton 
 *   bgNormal="/path/to/normal.png"
 *   bgClick="/path/to/click.png"
 *   width={120}
 *   height={40}
 * >
 *   <div>Your screen content</div>
 * </DragResizeButton>
 * 
 * // Or use default composite
 * <DragResize title="My Window">
 *   <div>Your screen content</div>
 * </DragResize>
 * ```
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// ===================================================================
// SECTION 1: TYPES & INTERFACES (Reusable Template)
// ===================================================================

export type DragResizeButtonConfig = {
  /** Background image for normal state (path to image registry) */
  bgNormal?: string;
  /** Background image for click/pressed state (path to image registry) */
  bgClick?: string;
  /** Button width in pixels */
  width?: number;
  /** Button height in pixels */
  height?: number;
  /** Button text label (if no bg image) */
  label?: string;
  /** Custom button class */
  className?: string;
  /** Click handler (optional, for custom behavior) */
  onClick?: () => void;
};

export type DragResizeScreenConfig = {
  /** Screen title in header */
  title?: string;
  /** Initial width in pixels */
  initialWidth?: number;
  /** Initial height in pixels */
  initialHeight?: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Center screen on open */
  centerOnOpen?: boolean;
  /** Custom header class */
  headerClassName?: string;
  /** Custom content class */
  contentClassName?: string;
  /** Screen content */
  children?: React.ReactNode;
  /** Is screen open */
  isOpen?: boolean;
  /** Close callback */
  onClose?: () => void;
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

// ===================================================================
// SECTION 2: BUTTON COMPONENT (Image Registry Support)
// ===================================================================

export function DragResizeButton(props: DragResizeButtonConfig & { children?: React.ReactNode }) {
  const {
    bgNormal,
    bgClick,
    width = 120,
    height = 40,
    label = "Open",
    className = "",
    children,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback(() => {
    if (props.onClick) {
      props.onClick();
    } else {
      setIsOpen(true);
    }
  }, [props]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Determine button style
  const hasImages = bgNormal || bgClick;
  const currentBg = isPressed && bgClick ? bgClick : bgNormal;

  const buttonStyle: React.CSSProperties = hasImages
    ? {
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: currentBg ? `url(${currentBg})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {
        width: `${width}px`,
        height: `${height}px`,
      };

  const defaultClassName = hasImages
    ? "border-0 bg-transparent cursor-pointer transition-transform active:scale-95"
    : "text-[10px] px-2 py-0.5 rounded bg-emerald-600/80 hover:bg-emerald-500/80 active:bg-emerald-600 text-white shadow-sm border border-white/10 transition-all active:scale-95";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        className={className || defaultClassName}
        style={buttonStyle}
        aria-label={label}
      >
        {!hasImages && label}
      </button>

      {isOpen && (
        <DragResizeScreen isOpen={isOpen} onClose={handleClose} title="Drag & Resize Demo">
          {children || (
            <div className="text-gray-800">
              <h2 className="text-lg font-bold mb-3">Draggable & Resizable Window</h2>
              <p className="mb-2">This is a demo of the DragResize template.</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Drag the header to move the window</li>
                <li>Drag the edges to resize</li>
                <li>Drag the corners for diagonal resize</li>
                <li>Press ESC to close</li>
              </ul>
            </div>
          )}
        </DragResizeScreen>
      )}
    </>
  );
}

// ===================================================================
// SECTION 3: SCREEN COMPONENT (Drag & Resize with Portal)
// ===================================================================

export function DragResizeScreen(props: DragResizeScreenConfig) {
  const {
    title = "Window",
    initialWidth = 500,
    initialHeight = 400,
    minWidth = 200,
    minHeight = 150,
    centerOnOpen = true,
    headerClassName = "",
    contentClassName = "",
    children,
    isOpen = true,
    onClose,
  } = props;

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
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Dragging logic
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".close-btn")) return;
    if (!popupRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = popupRef.current.getBoundingClientRect();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    console.log("[DragResize] Drag start", { clientX: e.clientX, clientY: e.clientY });

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
    console.log("[DragResize] Drag end");
    setDragState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // Resizing logic
  const handleResizeStart = useCallback((e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    console.log("[DragResize] Resize start", { handle });
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

      if (handle?.includes("e")) {
        newWidth = Math.max(minWidth, pe.clientX - rect.left);
      }
      if (handle?.includes("w")) {
        const deltaX = pe.clientX - rect.left;
        newWidth = Math.max(minWidth, position.width - deltaX);
        newX = position.x + deltaX;
      }
      if (handle?.includes("s")) {
        newHeight = Math.max(minHeight, pe.clientY - rect.top);
      }
      if (handle?.includes("n")) {
        const deltaY = pe.clientY - rect.top;
        newHeight = Math.max(minHeight, position.height - deltaY);
        newY = position.y + deltaY;
      }

      setPosition({ x: newX, y: newY, width: newWidth, height: newHeight });
    },
    [resizeState, position, minWidth, minHeight]
  );

  const handleResizeEnd = useCallback(() => {
    console.log("[DragResize] Resize end");
    setResizeState({ isResizing: false, handle: null });
  }, []);

  // Event listeners
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

  // Use Portal to render at document.body level (bypass all layer conflicts)
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
              if (onClose) onClose();
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* CONTENT */}
        <div className={`p-5 h-[calc(100%-48px)] bg-gray-100 overflow-auto ${contentClassName}`}>
          {children}
        </div>

        {/* RESIZE HANDLES - 8 directions */}
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-n-resize bg-transparent hover:bg-blue-400/30 touch-none"
          onPointerDown={(e) => handleResizeStart(e, "n")}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize bg-transparent hover:bg-blue-400/30 touch-none"
          onPointerDown={(e) => handleResizeStart(e, "s")}
        />
        <div
          className="absolute top-0 right-0 bottom-0 w-2 cursor-e-resize bg-transparent hover:bg-blue-400/30 touch-none"
          onPointerDown={(e) => handleResizeStart(e, "e")}
        />
        <div
          className="absolute top-0 left-0 bottom-0 w-2 cursor-w-resize bg-transparent hover:bg-blue-400/30 touch-none"
          onPointerDown={(e) => handleResizeStart(e, "w")}
        />
        <div
          className="absolute top-0 right-0 w-6 h-6 cursor-ne-resize bg-transparent hover:bg-blue-400/50 rounded-bl touch-none"
          onPointerDown={(e) => handleResizeStart(e, "ne")}
        />
        <div
          className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize bg-transparent hover:bg-blue-400/50 rounded-br touch-none"
          onPointerDown={(e) => handleResizeStart(e, "nw")}
        />
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-transparent hover:bg-blue-400/50 rounded-tl touch-none"
          onPointerDown={(e) => handleResizeStart(e, "se")}
        />
        <div
          className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize bg-transparent hover:bg-blue-400/50 rounded-tr touch-none"
          onPointerDown={(e) => handleResizeStart(e, "sw")}
        />
      </div>
    </div>,
    document.body
  );
}

// ===================================================================
// SECTION 4: COMPOSITE COMPONENT (Default Export)
// ===================================================================

export default function DragResize(
  props: DragResizeButtonConfig & DragResizeScreenConfig & { children?: React.ReactNode }
) {
  return <DragResizeButton {...props}>{props.children}</DragResizeButton>;
}

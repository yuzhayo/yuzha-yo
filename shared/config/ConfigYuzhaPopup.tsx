import React, { useState, useRef, useEffect, useCallback } from "react";
import { NestedAccordion } from "./AccordionContent";
import type {
  AccordionParentItem,
  AccordionSubParentItem,
  AccordionChildItem,
} from "./AccordionContent";
import configYuzhaData from "./ConfigYuzha.json";
import imageRegistryData from "./ImageRegistry.json";

export interface ConfigYuzhaPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

// Transform ConfigYuzha.json to accordion structure
function transformConfigToAccordion(): AccordionParentItem[] {
  return configYuzhaData.map((layerConfig) => {
    const children: AccordionSubParentItem[] = [];

    // Process each group in the layer config
    if (layerConfig.groups) {
      Object.entries(layerConfig.groups).forEach(([groupName, groupData]) => {
        const groupChildren: AccordionChildItem[] = [];

        // Convert each property to a child item
        Object.entries(groupData).forEach(([key, value]) => {
          let type: AccordionChildItem["type"] = "text";

          if (key === "renderer") {
            type = "dropdown";
          } else if (key === "imageId") {
            type = "dropdown";
          } else if (key === "order") {
            type = "number";
          } else if (key === "angle") {
            type = "number";
          } else if (Array.isArray(value)) {
            type = "array";
          }

          groupChildren.push({
            id: `${layerConfig.layerId}-${groupName}-${key}`,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: value as string | number | number[] | null,
            type,
            level: 3,
            hidden: false,
          });
        });

        children.push({
          id: `${layerConfig.layerId}-${groupName}`,
          label: groupName,
          level: 2,
          children: groupChildren,
        });
      });
    }

    return {
      id: layerConfig.layerId,
      label: layerConfig.layerId,
      level: 1,
      children,
    };
  });
}

// ---------------------------------------------------------------------------
// ConfigYuzhaPopup (screen)
// ---------------------------------------------------------------------------
export function ConfigYuzhaPopup({
  isOpen,
  onClose,
  title = "Layer Configuration",
  children,
}: ConfigYuzhaPopupProps) {
  // Runtime state and refs for drag/resize behaviour
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 600, height: 500 });
  const [isCentered, setIsCentered] = useState(true);

  const popupRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeHandleRef = useRef<string | null>(null);
  const sizeRef = useRef(size);
  const positionRef = useRef(position);
  const animationFrameRef = useRef<number | null>(null);
  const resizeOriginRef = useRef<{
    pointer: { x: number; y: number };
    size: { width: number; height: number };
    position: { x: number; y: number };
  } | null>(null);

  // Transform data for accordion
  const [accordionData] = useState<AccordionParentItem[]>(() => transformConfigToAccordion());
  const [imageOptions] = useState<string[]>(() => imageRegistryData.map((img) => img.id));

  // Keep refs in sync so pointer callbacks always use the latest values
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (isOpen && isCentered) {
      setIsCentered(true);
    }
  }, [isOpen, isCentered]);

  const handleSaveChanges = useCallback((data: AccordionParentItem[]) => {
    console.log("Saving configuration changes:", data);
    // Here you could implement actual save logic
    // For now, just log the changes
    alert("Changes saved! (Console log available)");
  }, []);

  // Helper to extract coordinates from mouse or touch event
  const getEventCoordinates = (
    event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
  ) => {
    if ("touches" in event && event.touches.length > 0) {
      return { x: event.touches[0]!.clientX, y: event.touches[0]!.clientY };
    }
    return {
      x: (event as MouseEvent | React.MouseEvent).clientX,
      y: (event as MouseEvent | React.MouseEvent).clientY,
    };
  };

  // Direct DOM manipulation for performance (GPU accelerated)
  const updatePopupTransform = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (!popupRef.current) return;

      // Use transform for GPU acceleration instead of left/top
      popupRef.current.style.transform = `translate(${x}px, ${y}px)`;
      popupRef.current.style.width = `${width}px`;
      popupRef.current.style.height = `${height}px`;
    },
    [],
  );

  const startDrag = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!popupRef.current) return;

      setIsDragging(true);
      const rect = popupRef.current.getBoundingClientRect();

      if (isCentered) {
        const next = { x: rect.left, y: rect.top };
        positionRef.current = next;
        setPosition(next);
        setIsCentered(false);
      }

      const coords = getEventCoordinates(event);
      dragOffsetRef.current = {
        x: coords.x - rect.left,
        y: coords.y - rect.top,
      };
    },
    [isCentered],
  );

  const drag = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDragging || !popupRef.current) return;

      // Prevent default touch behavior
      if ("touches" in event) {
        event.preventDefault();
      }

      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use RAF for smooth 60fps updates
      animationFrameRef.current = requestAnimationFrame(() => {
        const coords = getEventCoordinates(event);
        const currentSize = sizeRef.current;
        const proposedX = coords.x - dragOffsetRef.current.x;
        const proposedY = coords.y - dragOffsetRef.current.y;

        const maxX = Math.max(0, window.innerWidth - currentSize.width);
        const maxY = Math.max(0, window.innerHeight - currentSize.height);

        const next = {
          x: Math.max(0, Math.min(proposedX, maxX)),
          y: Math.max(0, Math.min(proposedY, maxY)),
        };

        // Update ref and DOM directly (no React re-render)
        positionRef.current = next;
        updatePopupTransform(next.x, next.y, currentSize.width, currentSize.height);
      });
    },
    [isDragging, updatePopupTransform],
  );

  const stopDrag = useCallback(() => {
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Sync final position to React state
    setPosition(positionRef.current);
    setIsDragging(false);
  }, []);

  const startResize = useCallback(
    (event: React.MouseEvent | React.TouchEvent, handle: string) => {
      event.stopPropagation();

      setIsResizing(true);
      resizeHandleRef.current = handle;

      if (isCentered && popupRef.current) {
        const rect = popupRef.current.getBoundingClientRect();
        const next = { x: rect.left, y: rect.top };
        positionRef.current = next;
        setPosition(next);
        setIsCentered(false);
      }

      const coords = getEventCoordinates(event);
      resizeOriginRef.current = {
        pointer: { x: coords.x, y: coords.y },
        size: sizeRef.current,
        position: positionRef.current,
      };
    },
    [isCentered],
  );

  const resize = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isResizing) return;

      // Prevent default touch behavior
      if ("touches" in event) {
        event.preventDefault();
      }

      const handle = resizeHandleRef.current;
      const origin = resizeOriginRef.current;
      if (!handle || !origin) return;

      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use RAF for smooth 60fps updates
      animationFrameRef.current = requestAnimationFrame(() => {
        const coords = getEventCoordinates(event);
        const deltaX = coords.x - origin.pointer.x;
        const deltaY = coords.y - origin.pointer.y;

        let newWidth = origin.size.width;
        let newHeight = origin.size.height;
        let newX = origin.position.x;
        let newY = origin.position.y;

        if (handle.includes("e")) {
          newWidth = Math.max(MIN_WIDTH, origin.size.width + deltaX);
        }

        if (handle.includes("w")) {
          const candidateWidth = origin.size.width - deltaX;
          newWidth = Math.max(MIN_WIDTH, candidateWidth);
          newX = origin.position.x + (origin.size.width - newWidth);
        }

        if (handle.includes("s")) {
          newHeight = Math.max(MIN_HEIGHT, origin.size.height + deltaY);
        }

        if (handle.includes("n")) {
          const candidateHeight = origin.size.height - deltaY;
          newHeight = Math.max(MIN_HEIGHT, candidateHeight);
          newY = origin.position.y + (origin.size.height - newHeight);
        }

        const maxX = Math.max(0, window.innerWidth - newWidth);
        const maxY = Math.max(0, Math.min(window.innerHeight - newHeight, window.innerHeight));
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        const nextSize = { width: newWidth, height: newHeight };
        const nextPosition = { x: newX, y: newY };

        // Update refs and DOM directly (no React re-render)
        sizeRef.current = nextSize;
        positionRef.current = nextPosition;
        updatePopupTransform(newX, newY, newWidth, newHeight);
      });
    },
    [isResizing, updatePopupTransform],
  );

  const stopResize = useCallback(() => {
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Sync final size and position to React state
    setSize(sizeRef.current);
    setPosition(positionRef.current);
    setIsResizing(false);
    resizeHandleRef.current = null;
    resizeOriginRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => drag(event);
    const handleTouchMove = (event: TouchEvent) => drag(event);
    const handleMouseUp = () => stopDrag();
    const handleTouchEnd = () => stopDrag();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, drag, stopDrag]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => resize(event);
    const handleTouchMove = (event: TouchEvent) => resize(event);
    const handleMouseUp = () => stopResize();
    const handleTouchEnd = () => stopResize();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isResizing, resize, stopResize]);

  useEffect(() => {
    const preventSelect = (event: Event) => {
      if (isDragging || isResizing) {
        event.preventDefault();
      }
    };
    document.addEventListener("selectstart", preventSelect);
    return () => document.removeEventListener("selectstart", preventSelect);
  }, [isDragging, isResizing]);

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const renderHeader = () => (
    <div
      className="bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white px-4 py-3 cursor-move select-none flex justify-between items-center active:cursor-grabbing"
      style={{ touchAction: "none" }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <div className="font-semibold text-sm">{title}</div>
      <div className="flex">
        <button
          className="w-4 h-4 rounded-full bg-[#ff5f57] text-white flex items-center justify-center text-[10px] font-bold transition-all duration-200 hover:scale-110 hover:opacity-80"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          title="Close"
          data-testid="close-popup-button"
        >
          ×
        </button>
      </div>
    </div>
  );

  const renderBody = () => {
    return (
      <div className="relative bg-gray-50" style={{ height: "calc(100% - 48px)" }}>
        <div
          className="accordion-scroll w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth"
          style={{ maxHeight: "100%" }}
        >
          <div className="p-3">
            {children ? (
              children
            ) : (
              <NestedAccordion
                data={accordionData}
                onSave={handleSaveChanges}
                imageOptions={imageOptions}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const popupStyle = isCentered
    ? {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: `${size.width}px`,
        height: `${size.height}px`,
      }
    : {
        left: "0",
        top: "0",
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000]"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div
        ref={popupRef}
        className="absolute bg-white rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.25)] overflow-hidden transition-shadow duration-300 hover:shadow-[0_35px_60px_rgba(0,0,0,0.3)]"
        style={{
          ...popupStyle,
          touchAction: "none",
          willChange: isDragging || isResizing ? "transform, width, height" : "auto",
        }}
        onMouseDown={(event) => event.stopPropagation()}
        data-testid="config-popup"
      >
        {renderHeader()}
        {renderBody()}

        <div
          className="absolute top-0 left-0 right-0 h-[5px] cursor-n-resize"
          style={{ touchAction: "none" }}
          onMouseDown={(event) => startResize(event, "n")}
          onTouchStart={(event) => startResize(event, "n")}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-[5px] cursor-s-resize"
          style={{ touchAction: "none" }}
          onMouseDown={(event) => startResize(event, "s")}
          onTouchStart={(event) => startResize(event, "s")}
        />
        <div
          className="absolute top-0 right-0 bottom-0 w-[5px] cursor-e-resize"
          style={{ touchAction: "none" }}
          onMouseDown={(event) => startResize(event, "e")}
          onTouchStart={(event) => startResize(event, "e")}
        />
        <div
          className="absolute top-0 left-0 bottom-0 w-[5px] cursor-w-resize"
          style={{ touchAction: "none" }}
          onMouseDown={(event) => startResize(event, "w")}
          onTouchStart={(event) => startResize(event, "w")}
        />
        <div
          className="absolute top-0 right-0 w-[10px] h-[10px] cursor-ne-resize"
          style={{ touchAction: "none" }}
          onMouseDown={(event) => startResize(event, "ne")}
          onTouchStart={(event) => startResize(event, "ne")}
        />
        <div
          className="absolute top-0 left-0 w-[10px] h-[10px] cursor-nw-resize"
          style={{ touchAction: "none" }}
          onMouseDown={(event) => startResize(event, "nw")}
          onTouchStart={(event) => startResize(event, "nw")}
        />
        <div
          className="absolute bottom-0 right-0 w-[10px] h-[10px] cursor-se-resize"
          style={{ touchAction: "none" }}
          onMouseDown={(event) => startResize(event, "se")}
          onTouchStart={(event) => startResize(event, "se")}
        />
        <div
          className="absolute bottom-0 left-0 w-[10px] h-[10px] cursor-sw-resize"
          style={{ touchAction: "none" }}
          onMouseDown={(event) => startResize(event, "sw")}
          onTouchStart={(event) => startResize(event, "sw")}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfigYuzhaPopupButton (trigger)
// ---------------------------------------------------------------------------
export interface ConfigYuzhaPopupButtonProps {
  label?: string;
  popupTitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ConfigYuzhaPopupButton({
  label = "Sync Assets",
  popupTitle,
  className,
  children,
}: ConfigYuzhaPopupButtonProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          className ??
          "text-[10px] px-2 py-0.5 rounded bg-indigo-600/80 hover:bg-indigo-500/80 active:bg-indigo-600 text-white shadow-sm border border-white/10"
        }
        data-testid="sync-assets-button"
      >
        {label}
      </button>
      <ConfigYuzhaPopup isOpen={open} onClose={handleClose} title={popupTitle}>
        {children}
      </ConfigYuzhaPopup>
    </>
  );
}

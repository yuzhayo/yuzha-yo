import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import type { Position, Size } from "./ConfigYuzhaPopupUtils";
import { MIN_WIDTH, MIN_HEIGHT, getMaxWidth, getMaxHeight, getEventCoordinates } from "./ConfigYuzhaPopupUtils";

interface UseDragResizeReturn {
  isDragging: boolean;
  isResizing: boolean;
  position: Position;
  size: Size;
  isCentered: boolean;
  setIsCentered: (centered: boolean) => void;
  popupRef: React.RefObject<HTMLDivElement>;
  startDrag: (event: React.MouseEvent | React.TouchEvent) => void;
  startResize: (event: React.MouseEvent | React.TouchEvent, handle: string) => void;
  updatePopupTransform: (x: number, y: number, width: number, height: number) => void;
}

export function useConfigYuzhaPopupDragResize(): UseDragResizeReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [size, setSize] = useState<Size>(() => ({
    width: Math.floor(window.innerWidth * 0.5),
    height: Math.floor(window.innerHeight * 0.5),
  }));
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

  // Keep refs in sync so pointer callbacks always use the latest values
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (isCentered) {
      setIsCentered(true);
    }
  }, [isCentered]);

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
          newWidth = Math.max(MIN_WIDTH, Math.min(getMaxWidth(), origin.size.width + deltaX));
        }

        if (handle.includes("w")) {
          const candidateWidth = origin.size.width - deltaX;
          newWidth = Math.max(MIN_WIDTH, Math.min(getMaxWidth(), candidateWidth));
          newX = origin.position.x + (origin.size.width - newWidth);
        }

        if (handle.includes("s")) {
          newHeight = Math.max(MIN_HEIGHT, Math.min(getMaxHeight(), origin.size.height + deltaY));
        }

        if (handle.includes("n")) {
          const candidateHeight = origin.size.height - deltaY;
          newHeight = Math.max(MIN_HEIGHT, Math.min(getMaxHeight(), candidateHeight));
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

  // Drag event listeners
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

  // Resize event listeners
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

  // Prevent text selection during drag/resize
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

  // Handle window resize - ensure popup stays within bounds
  useEffect(() => {
    const handleWindowResize = () => {
      const maxW = getMaxWidth();
      const maxH = getMaxHeight();

      setSize((prevSize) => ({
        width: Math.min(prevSize.width, maxW),
        height: Math.min(prevSize.height, maxH),
      }));

      if (!isCentered) {
        setPosition((prevPos) => ({
          x: Math.min(prevPos.x, Math.max(0, window.innerWidth - sizeRef.current.width)),
          y: Math.min(prevPos.y, Math.max(0, window.innerHeight - sizeRef.current.height)),
        }));
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [isCentered]);

  return {
    isDragging,
    isResizing,
    position,
    size,
    isCentered,
    setIsCentered,
    popupRef,
    startDrag,
    startResize,
    updatePopupTransform,
  };
}
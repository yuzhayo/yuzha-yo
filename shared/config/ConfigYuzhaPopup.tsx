import React, { useState, useRef, useEffect, useCallback } from "react";

export interface ConfigYuzhaPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

// ---------------------------------------------------------------------------
// Default fallback content rendered when no children are provided
function DefaultContent() {
  const [inputValue, setInputValue] = useState("");
  const text = "Enter text";

  return (
    <>
      <div className="relative">
        <input
          type="text"
          className="text-base outline-none px-[15px] py-[10px] block w-[200px] border-2 border-gray-600 rounded-lg bg-transparent focus:border-[#3679ff] peer"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          required
        />
        <label className="text-gray-600 text-base font-normal absolute pointer-events-none left-1/2 top-3 flex -translate-x-1/2">
          {text.split("").map((char, index) => (
            <span
              key={index}
              className="transition-all duration-200 ease-in-out peer-focus:-translate-y-5 peer-focus:text-sm peer-focus:text-[#3679ff] peer-focus:bg-gray-200 peer-valid:-translate-y-5 peer-valid:text-sm peer-valid:text-[#3679ff] peer-valid:bg-gray-200"
              style={{ transitionDelay: `${index * 0.05}s` }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </label>
      </div>
      <button className="bg-gradient-to-r from-[#3679ff] to-[#4f8fff] text-white border-none px-6 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(54,121,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(54,121,255,0.4)]">
        Submit
      </button>
    </>
  );
}

export function ConfigYuzhaPopup({
  isOpen,
  onClose,
  title = "SETTING",
  children,
}: ConfigYuzhaPopupProps) {
  // ---------------------------------------------------------------------------
  // Popup runtime state and backing refs
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 400, height: 300 });
  const [isCentered, setIsCentered] = useState(true);

  const popupRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeHandleRef = useRef<string | null>(null);
  const sizeRef = useRef(size);
  const positionRef = useRef(position);
  const resizeOriginRef = useRef<
    | {
        pointer: { x: number; y: number };
        size: { width: number; height: number };
        position: { x: number; y: number };
      }
    | null
  >(null);

  // ---------------------------------------------------------------------------
  // Sync state snapshots so drag/resize handlers always read latest values
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

  // ---------------------------------------------------------------------------
  // Pointer handlers for dragging and resizing
  const startDrag = useCallback((event: React.MouseEvent) => {
    if (!popupRef.current) return;

    setIsDragging(true);
    const rect = popupRef.current.getBoundingClientRect();

    if (isCentered) {
      const next = { x: rect.left, y: rect.top };
      positionRef.current = next;
      setPosition(next);
      setIsCentered(false);
    }

    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, [isCentered]);

  const drag = useCallback((event: MouseEvent) => {
    if (!isDragging || !popupRef.current) return;

    const currentSize = sizeRef.current;
    const proposedX = event.clientX - dragOffsetRef.current.x;
    const proposedY = event.clientY - dragOffsetRef.current.y;

    const maxX = Math.max(0, window.innerWidth - currentSize.width);
    const maxY = Math.max(0, window.innerHeight - currentSize.height);

    const next = {
      x: Math.max(0, Math.min(proposedX, maxX)),
      y: Math.max(0, Math.min(proposedY, maxY)),
    };

    positionRef.current = next;
    setPosition(next);
  }, [isDragging]);

  const stopDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  const startResize = useCallback((event: React.MouseEvent, handle: string) => {
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

    resizeOriginRef.current = {
      pointer: { x: event.clientX, y: event.clientY },
      size: sizeRef.current,
      position: positionRef.current,
    };
  }, [isCentered]);

  const resize = useCallback((event: MouseEvent) => {
    if (!isResizing) return;

    const handle = resizeHandleRef.current;
    const origin = resizeOriginRef.current;
    if (!handle || !origin) return;

    const deltaX = event.clientX - origin.pointer.x;
    const deltaY = event.clientY - origin.pointer.y;

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
    const maxY = Math.max(0, window.innerHeight - newHeight);
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    const nextSize = { width: newWidth, height: newHeight };
    const nextPosition = { x: newX, y: newY };

    sizeRef.current = nextSize;
    positionRef.current = nextPosition;
    setSize(nextSize);
    setPosition(nextPosition);
  }, [isResizing]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
    resizeHandleRef.current = null;
    resizeOriginRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => drag(event);
    const handleMouseUp = () => stopDrag();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, drag, stopDrag]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => resize(event);
    const handleMouseUp = () => stopResize();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
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

  // ---------------------------------------------------------------------------
  // Render helpers so header/body tweaks stay isolated
  const renderHeader = () => (
    <div
      className="bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white px-4 py-3 cursor-move select-none flex justify-between items-center active:cursor-grabbing"
      onMouseDown={startDrag}
    >
      {/* Adjust title styling or add buttons here */}
      <div className="font-semibold text-sm">{title}</div>
      <div className="flex">
        <button
          className="w-4 h-4 rounded-full bg-[#ff5f57] text-white flex items-center justify-center text-[10px] font-bold transition-all duration-200 hover:scale-110 hover:opacity-80"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          title="Close"
        >
          X
        </button>
      </div>
    </div>
  );

  const renderBody = () => (
    <div className="p-5 bg-gray-200 flex flex-col items-center justify-center gap-5" style={{ height: "calc(100% - 48px)" }}>
      {/* Drop in custom popup content below or replace DefaultContent */}
      {children || <DefaultContent />}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
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
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000]" onMouseDown={(event) => event.stopPropagation()}>
      <div
        ref={popupRef}
        className="absolute bg-white rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.25)] overflow-hidden transition-shadow duration-300 hover:shadow-[0_35px_60px_rgba(0,0,0,0.3)]"
        style={popupStyle}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {renderHeader()}
        {renderBody()}

        <div className="absolute top-0 left-0 right-0 h-[5px] cursor-n-resize" onMouseDown={(event) => startResize(event, "n")} />
        <div className="absolute bottom-0 left-0 right-0 h-[5px] cursor-s-resize" onMouseDown={(event) => startResize(event, "s")} />
        <div className="absolute top-0 right-0 bottom-0 w-[5px] cursor-e-resize" onMouseDown={(event) => startResize(event, "e")} />
        <div className="absolute top-0 left-0 bottom-0 w-[5px] cursor-w-resize" onMouseDown={(event) => startResize(event, "w")} />
        <div className="absolute top-0 right-0 w-[10px] h-[10px] cursor-ne-resize" onMouseDown={(event) => startResize(event, "ne")} />
        <div className="absolute top-0 left-0 w-[10px] h-[10px] cursor-nw-resize" onMouseDown={(event) => startResize(event, "nw")} />
        <div className="absolute bottom-0 right-0 w-[10px] h-[10px] cursor-se-resize" onMouseDown={(event) => startResize(event, "se")} />
        <div className="absolute bottom-0 left-0 w-[10px] h-[10px] cursor-sw-resize" onMouseDown={(event) => startResize(event, "sw")} />
      </div>
    </div>
  );
}
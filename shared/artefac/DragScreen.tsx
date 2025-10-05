import React, { useState, useRef, useEffect } from "react";

interface DragScreenProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export default function DragScreen({
  isOpen,
  onClose,
  title = "Popup Window",
  children,
}: DragScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 400, height: 300 });
  const [isCentered, setIsCentered] = useState(true);

  const popupRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeHandleRef = useRef<string | null>(null);

  // Center popup when opened
  useEffect(() => {
    if (isOpen && isCentered) {
      setIsCentered(true);
    }
  }, [isOpen]);

  // Dragging handlers
  const startDrag = (e: React.MouseEvent) => {
    if (!popupRef.current) return;

    setIsDragging(true);
    const rect = popupRef.current.getBoundingClientRect();

    if (isCentered) {
      setPosition({ x: rect.left, y: rect.top });
      setIsCentered(false);
    }

    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const drag = (e: MouseEvent) => {
    if (!isDragging || !popupRef.current) return;

    const x = e.clientX - dragOffsetRef.current.x;
    const y = e.clientY - dragOffsetRef.current.y;

    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;

    setPosition({
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    });
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  // Resizing handlers
  const startResize = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeHandleRef.current = handle;

    if (isCentered && popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      setPosition({ x: rect.left, y: rect.top });
      setIsCentered(false);
    }
  };

  const resize = (e: MouseEvent) => {
    if (!isResizing || !popupRef.current) return;

    const rect = popupRef.current.getBoundingClientRect();
    const handle = resizeHandleRef.current;

    let newWidth = size.width;
    let newHeight = size.height;
    let newX = position.x;
    let newY = position.y;

    if (handle?.includes("e")) {
      newWidth = Math.max(200, e.clientX - rect.left);
    }

    if (handle?.includes("w")) {
      const deltaX = e.clientX - rect.left;
      newWidth = Math.max(200, size.width - deltaX);
      newX = position.x + deltaX;
    }

    if (handle?.includes("s")) {
      newHeight = Math.max(150, e.clientY - rect.top);
    }

    if (handle?.includes("n")) {
      const deltaY = e.clientY - rect.top;
      newHeight = Math.max(150, size.height - deltaY);
      newY = position.y + deltaY;
    }

    setSize({ width: newWidth, height: newHeight });
    setPosition({ x: newX, y: newY });
  };

  const stopResize = () => {
    setIsResizing(false);
    resizeHandleRef.current = null;
  };

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", stopDrag);
      return () => {
        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", stopDrag);
      };
    }
  }, [isDragging]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", resize);
      document.addEventListener("mouseup", stopResize);
      return () => {
        document.removeEventListener("mousemove", resize);
        document.removeEventListener("mouseup", stopResize);
      };
    }
  }, [isResizing]);

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div
        ref={popupRef}
        className="absolute bg-white rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.25)] overflow-hidden transition-shadow duration-300 hover:shadow-[0_35px_60px_rgba(0,0,0,0.3)]"
        style={popupStyle}
      >
        {/* Header */}
        <div
          className="bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white px-4 py-3 cursor-move select-none flex justify-between items-center active:cursor-grabbing"
          onMouseDown={startDrag}
        >
          <div className="font-semibold text-sm">{title}</div>
          <div className="flex">
            <button
              className="w-4 h-4 rounded-full bg-[#ff5f57] text-white flex items-center justify-center text-[10px] font-bold transition-all duration-200 hover:scale-110 hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="p-5 bg-gray-200 flex flex-col items-center justify-center gap-5"
          style={{ height: "calc(100% - 48px)" }}
        >
          {children || <DefaultContent />}
        </div>

        {/* Resize handles */}
        <div
          className="absolute top-0 left-0 right-0 h-[5px] cursor-n-resize"
          onMouseDown={(e) => startResize(e, "n")}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-[5px] cursor-s-resize"
          onMouseDown={(e) => startResize(e, "s")}
        />
        <div
          className="absolute top-0 right-0 bottom-0 w-[5px] cursor-e-resize"
          onMouseDown={(e) => startResize(e, "e")}
        />
        <div
          className="absolute top-0 left-0 bottom-0 w-[5px] cursor-w-resize"
          onMouseDown={(e) => startResize(e, "w")}
        />
        <div
          className="absolute top-0 right-0 w-[10px] h-[10px] cursor-ne-resize"
          onMouseDown={(e) => startResize(e, "ne")}
        />
        <div
          className="absolute top-0 left-0 w-[10px] h-[10px] cursor-nw-resize"
          onMouseDown={(e) => startResize(e, "nw")}
        />
        <div
          className="absolute bottom-0 right-0 w-[10px] h-[10px] cursor-se-resize"
          onMouseDown={(e) => startResize(e, "se")}
        />
        <div
          className="absolute bottom-0 left-0 w-[10px] h-[10px] cursor-sw-resize"
          onMouseDown={(e) => startResize(e, "sw")}
        />
      </div>
    </div>
  );
}

// Default content component with animated input
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
          onChange={(e) => setInputValue(e.target.value)}
          required
        />
        <label className="text-gray-600 text-base font-normal absolute pointer-events-none left-1/2 top-3 flex -translate-x-1/2">
          {text.split("").map((char, i) => (
            <span
              key={i}
              className="transition-all duration-200 ease-in-out peer-focus:-translate-y-5 peer-focus:text-sm peer-focus:text-[#3679ff] peer-focus:bg-gray-200 peer-valid:-translate-y-5 peer-valid:text-sm peer-valid:text-[#3679ff] peer-valid:bg-gray-200"
              style={{ transitionDelay: `${i * 0.05}s` }}
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

// Example usage component
export function DragScreenExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none px-6 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)]"
      >
        Open Popup
      </button>

      <DragScreen isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

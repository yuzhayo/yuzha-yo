import React, { useState } from "react";
import DragScreen from "./DragScreen";

export function DragScreenButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-md shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
      >
        DragScreen
      </button>

      <DragScreen isOpen={isOpen} onClose={() => setIsOpen(false)} title="Drag & Resize Demo" />
    </>
  );
}

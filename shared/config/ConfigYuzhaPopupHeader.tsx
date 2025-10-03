import React from "react";

interface ConfigYuzhaPopupHeaderProps {
  title: string;
  onClose: () => void;
  onMouseDown: (event: React.MouseEvent) => void;
  onTouchStart: (event: React.TouchEvent) => void;
}

export function ConfigYuzhaPopupHeader({
  title,
  onClose,
  onMouseDown,
  onTouchStart,
}: ConfigYuzhaPopupHeaderProps) {
  return (
    <div
      className="bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white px-4 py-3 cursor-move select-none flex justify-between items-center active:cursor-grabbing"
      style={{ touchAction: "none" }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
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
}
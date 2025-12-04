import React from "react";

type ScreenPosition = { x: number; y: number };

type BaseButtonProps = {
  screenPosition: ScreenPosition;
  label: string;
  onClick?: () => void;
  size?: number;
};

const BUTTON_BASE_SIZE = 56;

function FloatingButton({ screenPosition, label, onClick, size = BUTTON_BASE_SIZE }: BaseButtonProps) {
  return (
    <div
      className="pointer-events-none fixed z-30"
      style={{ left: screenPosition.x, top: screenPosition.y }}
    >
      <button
        type="button"
        className="pointer-events-auto rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-slate-700 active:bg-slate-800"
        onClick={onClick}
        style={{ width: size, height: size }}
      >
        {label}
      </button>
    </div>
  );
}

export function CounterBackButton(props: BaseButtonProps) {
  return <FloatingButton {...props} />;
}

export function CounterResetButton(props: BaseButtonProps) {
  return <FloatingButton {...props} />;
}

export function CounterSettingsButton(props: BaseButtonProps) {
  return <FloatingButton {...props} />;
}

export { BUTTON_BASE_SIZE };

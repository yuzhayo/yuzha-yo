import React from "react";

export type CounterSettingsProps = {
  size: number;
  onSizeChange: (value: number) => void;
  position: { x: number; y: number };
  onPositionChange: (value: { x: number; y: number }) => void;
  messageSize: number;
  onMessageSizeChange: (value: number) => void;
  messagePosition: { x: number; y: number };
  onMessagePositionChange: (value: { x: number; y: number }) => void;
  messageFontSize: number;
  onMessageFontSizeChange: (value: number) => void;
  backgroundOpacity: number;
  onBackgroundOpacityChange: (value: number) => void;
  onClose?: () => void;
};

export default function CounterSettings({
  size,
  onSizeChange,
  position,
  onPositionChange,
  messageSize,
  onMessageSizeChange,
  messagePosition,
  onMessagePositionChange,
  messageFontSize,
  onMessageFontSizeChange,
  backgroundOpacity,
  onBackgroundOpacityChange,
  onClose,
}: CounterSettingsProps) {
  const clampStage = (value: number) => Math.min(2048, Math.max(0, value));

  const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (!Number.isNaN(next)) {
      onSizeChange(next);
    }
  };

  const handleMessageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (!Number.isNaN(next)) {
      onMessageSizeChange(next);
    }
  };

  const handlePositionChange = (axis: "x" | "y") => (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (Number.isNaN(next)) return;
    onPositionChange({ ...position, [axis]: clampStage(next) });
  };

  const handleMessagePositionChange =
    (axis: "x" | "y") => (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.target.value);
      if (Number.isNaN(next)) return;
      onMessagePositionChange({ ...messagePosition, [axis]: clampStage(next) });
    };

  const handleMessageFontChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (!Number.isNaN(next)) {
      onMessageFontSizeChange(next);
    }
  };

  const handleBackgroundOpacityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (!Number.isNaN(next)) {
      onBackgroundOpacityChange(Math.min(1, Math.max(0, next)));
    }
  };

  return (
    <div className="pointer-events-auto fixed left-6 top-24 z-30 rounded-lg bg-white/95 p-4 shadow-xl shadow-black/30 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Floating Button Size</p>
            <input
              type="range"
              min={200}
              max={900}
              step={10}
              value={size}
              onChange={handleSizeChange}
              className="mt-2 w-full"
              aria-label="Floating button size"
            />
            <div className="mt-1 text-xs text-slate-600">Current: {size}px</div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Position (stage 0-2048)</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
              <label className="flex items-center gap-2">
                <span className="w-4 text-right">X</span>
                <input
                  type="number"
                  min={0}
                  max={2048}
                  value={position.x}
                  onChange={handlePositionChange("x")}
                  className="w-full rounded border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="w-4 text-right">Y</span>
                <input
                  type="number"
                  min={0}
                  max={2048}
                  value={position.y}
                  onChange={handlePositionChange("y")}
                  className="w-full rounded border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Message Size</p>
            <input
              type="range"
              min={200}
              max={900}
              step={10}
              value={messageSize}
              onChange={handleMessageSizeChange}
              className="mt-2 w-full"
              aria-label="Message button size"
            />
            <div className="mt-1 text-xs text-slate-600">Current: {messageSize}px</div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Message Position (stage 0-2048)</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
              <label className="flex items-center gap-2">
                <span className="w-4 text-right">X</span>
                <input
                  type="number"
                  min={0}
                  max={2048}
                  value={messagePosition.x}
                  onChange={handleMessagePositionChange("x")}
                  className="w-full rounded border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="w-4 text-right">Y</span>
                <input
                  type="number"
                  min={0}
                  max={2048}
                  value={messagePosition.y}
                  onChange={handleMessagePositionChange("y")}
                  className="w-full rounded border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Message Font Size</p>
            <input
              type="range"
              min={16}
              max={120}
              step={2}
              value={messageFontSize}
              onChange={handleMessageFontChange}
              className="mt-2 w-full"
              aria-label="Message font size"
            />
            <div className="mt-1 text-xs text-slate-600">Current: {messageFontSize}px</div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Floating Background Opacity</p>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={backgroundOpacity}
              onChange={handleBackgroundOpacityChange}
              className="mt-2 w-full"
              aria-label="Floating background opacity"
            />
            <div className="mt-1 text-xs text-slate-600">
              Current: {Math.round(backgroundOpacity * 100)}%
            </div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 active:bg-slate-800"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

import React from "react";

type Counter2SettingsProps = {
  onClose?: () => void;
  hapticsEnabled?: boolean;
  onHapticsToggle?: (enabled: boolean) => void;
  soundEnabled?: boolean;
  onSoundToggle?: (enabled: boolean) => void;
  floatingSize?: number;
  onFloatingSizeChange?: (size: number) => void;
  messageSize?: number;
  onMessageSizeChange?: (size: number) => void;
  messageFontSize?: number;
  onMessageFontSizeChange?: (size: number) => void;
  messageColor?: string;
  onMessageColorChange?: (color: string) => void;
  floatingPosition?: { x: number; y: number };
  onFloatingPositionChange?: (pos: { x: number; y: number }) => void;
  messagePosition?: { x: number; y: number };
  onMessagePositionChange?: (pos: { x: number; y: number }) => void;
};

export default function Counter2Settings({
  onClose,
  hapticsEnabled = true,
  onHapticsToggle,
  soundEnabled = false,
  onSoundToggle,
  floatingSize = 250,
  onFloatingSizeChange,
  messageSize = 240,
  onMessageSizeChange,
  messageFontSize = 90,
  onMessageFontSizeChange,
  messageColor = "#ffffff",
  onMessageColorChange,
  floatingPosition = { x: 1024, y: 1300 },
  onFloatingPositionChange,
  messagePosition = { x: 1024, y: 400 },
  onMessagePositionChange,
}: Counter2SettingsProps) {
  const clampStage = (value: number) => Math.min(2048, Math.max(0, value));

  const handlePositionChange =
    (setter: ((value: { x: number; y: number }) => void) | undefined, current: { x: number; y: number }) =>
    (axis: "x" | "y") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.target.value);
      if (Number.isNaN(next) || !setter) return;
      setter({ ...current, [axis]: clampStage(next) });
    };

  const renderPositionInputs = (
    label: string,
    value: { x: number; y: number },
    setter: ((val: { x: number; y: number }) => void) | undefined,
  ) => (
    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
      <h3 className="text-sm font-medium text-slate-200 mb-2">{label}</h3>
      <p className="text-xs text-slate-400 mb-2">Stage coordinates (0-2048)</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <span className="w-4 text-right">X</span>
          <input
            type="number"
            min={0}
            max={2048}
            value={value.x}
            onChange={handlePositionChange(setter, value)("x")}
            className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-500 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <span className="w-4 text-right">Y</span>
          <input
            type="number"
            min={0}
            max={2048}
            value={value.y}
            onChange={handlePositionChange(setter, value)("y")}
            className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-teal-500 focus:outline-none"
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-[90%] max-w-md bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Counter2 Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Counter Settings</div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <div>
              <h3 className="text-sm font-medium text-slate-200">Haptic Feedback</h3>
              <p className="text-xs text-slate-400 mt-0.5">Vibrate on tap</p>
            </div>
            <button
              type="button"
              onClick={() => onHapticsToggle?.(!hapticsEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                hapticsEnabled ? "bg-teal-600" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  hapticsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <div>
              <h3 className="text-sm font-medium text-slate-200">Sound Effects</h3>
              <p className="text-xs text-slate-400 mt-0.5">Play sound on tap</p>
            </div>
            <button
              type="button"
              onClick={() => onSoundToggle?.(!soundEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                soundEnabled ? "bg-teal-600" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  soundEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <h3 className="text-sm font-medium text-slate-200 mb-2">Button Size</h3>
            <input
              type="range"
              min="150"
              max="400"
              value={floatingSize}
              onChange={(e) => onFloatingSizeChange?.(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-slate-400 mt-1 text-right">{floatingSize}px</div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <h3 className="text-sm font-medium text-slate-200 mb-2">Display Size</h3>
            <input
              type="range"
              min="150"
              max="400"
              value={messageSize}
              onChange={(e) => onMessageSizeChange?.(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-slate-400 mt-1 text-right">{messageSize}px</div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <h3 className="text-sm font-medium text-slate-200 mb-2">Font Size</h3>
            <input
              type="range"
              min="40"
              max="150"
              value={messageFontSize}
              onChange={(e) => onMessageFontSizeChange?.(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-slate-400 mt-1 text-right">{messageFontSize}px</div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <h3 className="text-sm font-medium text-slate-200 mb-2">Text Color</h3>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={messageColor}
                onChange={(e) => onMessageColorChange?.(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-600 cursor-pointer"
              />
              <span className="text-sm text-slate-300">{messageColor}</span>
            </div>
          </div>

          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 mt-6">Position Controls</div>

          {renderPositionInputs("Button Position", floatingPosition, onFloatingPositionChange)}

          {renderPositionInputs("Display Position", messagePosition, onMessagePositionChange)}
        </div>

        <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600/80 hover:bg-teal-500/80 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

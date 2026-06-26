import React from "react";
import FloatingWindowTemplate from "@shared/floating/FloatingWindowTemplate";

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
  backPosition?: { x: number; y: number };
  onBackPositionChange?: (pos: { x: number; y: number }) => void;
  resetPosition?: { x: number; y: number };
  onResetPositionChange?: (pos: { x: number; y: number }) => void;
  settingsPosition?: { x: number; y: number };
  onSettingsPositionChange?: (pos: { x: number; y: number }) => void;
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
  backPosition = { x: 180, y: 180 },
  onBackPositionChange,
  resetPosition = { x: 280, y: 180 },
  onResetPositionChange,
  settingsPosition = { x: 380, y: 180 },
  onSettingsPositionChange,
}: Counter2SettingsProps) {
  const clampStage = (value: number) => Math.min(2048, Math.max(0, value));

  const handlePositionChange =
    (
      setter: ((value: { x: number; y: number }) => void) | undefined,
      current: { x: number; y: number },
    ) =>
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
    <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/50">
      <h3 className="text-sm font-medium text-slate-200 mb-1">{label}</h3>
      <p className="text-xs text-slate-400 mb-2">Stage coords (0–2048)</p>
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

  const renderToggle = (
    label: string,
    desc: string,
    checked: boolean,
    onChange: (() => void) | undefined,
  ) => (
    <div className="flex items-center justify-between p-3 bg-slate-800/70 rounded-xl border border-slate-700/50">
      <div>
        <h3 className="text-sm font-medium text-slate-200">{label}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-teal-600" : "bg-slate-600"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );

  return (
    <FloatingWindowTemplate
      title="Counter2 Settings"
      initialPos={{ x: 24, y: 24 }}
      initialSize={{ width: 420, height: 560 }}
      minWidth={360}
      minHeight={400}
      onClose={onClose}
    >
      {/* Dark theme wrapper — fills template's white content area */}
      <div
        className="space-y-4"
        style={{ margin: -16, padding: 16, minHeight: "100%", background: "#0f172a" }}
      >
        <p className="text-xs text-slate-400 uppercase tracking-wider">Feedback</p>

        {renderToggle("Haptic Feedback", "Vibrate on tap", hapticsEnabled, () =>
          onHapticsToggle?.(!hapticsEnabled),
        )}
        {renderToggle("Sound Effects", "Play sound on tap", soundEnabled, () =>
          onSoundToggle?.(!soundEnabled),
        )}

        <p className="text-xs text-slate-400 uppercase tracking-wider pt-2">Display</p>

        <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-200 mb-2">Button Size</h3>
          <input
            type="range"
            min={200}
            max={900}
            step={10}
            value={floatingSize}
            onChange={(e) => onFloatingSizeChange?.(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-slate-400 mt-1 text-right">{floatingSize}px</div>
        </div>

        <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-200 mb-2">Display Size</h3>
          <input
            type="range"
            min={200}
            max={900}
            step={10}
            value={messageSize}
            onChange={(e) => onMessageSizeChange?.(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-slate-400 mt-1 text-right">{messageSize}px</div>
        </div>

        <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-200 mb-2">Font Size</h3>
          <input
            type="range"
            min={16}
            max={120}
            step={2}
            value={messageFontSize}
            onChange={(e) => onMessageFontSizeChange?.(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-slate-400 mt-1 text-right">{messageFontSize}px</div>
        </div>

        <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/50">
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

        <p className="text-xs text-slate-400 uppercase tracking-wider pt-2">
          Position (stage 0–2048)
        </p>

        {renderPositionInputs("Button Position", floatingPosition, onFloatingPositionChange)}
        {renderPositionInputs("Display Position", messagePosition, onMessagePositionChange)}
        {renderPositionInputs("Back Button", backPosition, onBackPositionChange)}
        {renderPositionInputs("Reset Button", resetPosition, onResetPositionChange)}
        {renderPositionInputs("Settings Button", settingsPosition, onSettingsPositionChange)}
      </div>
    </FloatingWindowTemplate>
  );
}

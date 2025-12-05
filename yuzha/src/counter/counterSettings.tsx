import React from "react";
import FloatingWindowTemplate from "@shared/floating/FloatingWindowTemplate";

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
  messageColor: string;
  onMessageColorChange: (value: string) => void;
  hapticsEnabled: boolean;
  onHapticsToggle: (value: boolean) => void;
  soundEnabled: boolean;
  onSoundToggle: (value: boolean) => void;
  backPosition: { x: number; y: number };
  onBackPositionChange: (value: { x: number; y: number }) => void;
  resetPosition: { x: number; y: number };
  onResetPositionChange: (value: { x: number; y: number }) => void;
  settingsPosition: { x: number; y: number };
  onSettingsPositionChange: (value: { x: number; y: number }) => void;
  onOpenDemo?: () => void;
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
  messageColor,
  onMessageColorChange,
  hapticsEnabled,
  onHapticsToggle,
  soundEnabled,
  onSoundToggle,
  backPosition,
  onBackPositionChange,
  resetPosition,
  onResetPositionChange,
  settingsPosition,
  onSettingsPositionChange,
  onOpenDemo,
  onClose,
}: CounterSettingsProps) {
  const clampStage = (value: number) => Math.min(2048, Math.max(0, value));

  const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (!Number.isNaN(next)) onSizeChange(next);
  };

  const handleMessageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (!Number.isNaN(next)) onMessageSizeChange(next);
  };

  const handlePositionChange =
    (setter: (value: { x: number; y: number }) => void, current: { x: number; y: number }) =>
    (axis: "x" | "y") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.target.value);
      if (Number.isNaN(next)) return;
      setter({ ...current, [axis]: clampStage(next) });
    };

  const handleMessageFontChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (!Number.isNaN(next)) onMessageFontSizeChange(next);
  };

  const renderPositionInputs = (
    label: string,
    value: { x: number; y: number },
    setter: (val: { x: number; y: number }) => void,
  ) => (
    <div>
      <p className="text-sm font-semibold text-slate-800">{label} (stage 0-2048)</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
        <label className="flex items-center gap-2">
          <span className="w-4 text-right">X</span>
          <input
            type="number"
            min={0}
            max={2048}
            value={value.x}
            onChange={handlePositionChange(setter, value)("x")}
            className="w-full rounded border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-4 text-right">Y</span>
          <input
            type="number"
            min={0}
            max={2048}
            value={value.y}
            onChange={handlePositionChange(setter, value)("y")}
            className="w-full rounded border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>
    </div>
  );

  return (
    <FloatingWindowTemplate
      title="Settings"
      initialPos={{ x: 24, y: 24 }}
      initialSize={{ width: 420, height: 520 }}
      minWidth={360}
      minHeight={360}
      onClose={onClose}
    >
      <div className="relative space-y-4 text-slate-800">
        {onOpenDemo && (
          <button
            type="button"
            onClick={onOpenDemo}
            className="absolute right-0 top-0 rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-500"
          >
            Effect Demo
          </button>
        )}
        <div>
          <p className="text-sm font-semibold">Floating Button Size</p>
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

        {renderPositionInputs("Position", position, onPositionChange)}

        <div>
          <p className="text-sm font-semibold">Message Size</p>
          <input
            type="range"
            min={200}
            max={900}
            step={10}
            value={messageSize}
            onChange={handleMessageSizeChange}
            className="mt-2 w-full"
            aria-label="Message size"
          />
          <div className="mt-1 text-xs text-slate-600">Current: {messageSize}px</div>
        </div>

        {renderPositionInputs("Message Position", messagePosition, onMessagePositionChange)}

        <div>
          <p className="text-sm font-semibold">Message Font Size</p>
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
          <p className="text-sm font-semibold">Message Color</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-700">
            <input
              type="color"
              value={messageColor}
              onChange={(e) => onMessageColorChange(e.target.value)}
              className="h-8 w-12 rounded border border-slate-300 bg-white"
              aria-label="Message color"
            />
            <span className="text-slate-600">{messageColor}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hapticsEnabled}
              onChange={(e) => onHapticsToggle(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm font-semibold text-slate-800">Haptics</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => onSoundToggle(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm font-semibold text-slate-800">Sound</span>
          </label>
        </div>

        {renderPositionInputs("Back Button Position", backPosition, onBackPositionChange)}
        {renderPositionInputs("Reset Button Position", resetPosition, onResetPositionChange)}
        {renderPositionInputs(
          "Settings Button Position",
          settingsPosition,
          onSettingsPositionChange,
        )}
      </div>
    </FloatingWindowTemplate>
  );
}

import React, { useState } from "react";

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
}: Counter2SettingsProps) {
  const [lowEndMode, setLowEndMode] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [fpsLimit, setFpsLimit] = useState<30 | 60>(60);

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

          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 mt-6">Renderer Settings</div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <div>
              <h3 className="text-sm font-medium text-slate-200">Low-End Mode</h3>
              <p className="text-xs text-slate-400 mt-0.5">Force Canvas2D renderer</p>
            </div>
            <button
              type="button"
              onClick={() => setLowEndMode(!lowEndMode)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                lowEndMode ? "bg-teal-600" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  lowEndMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <div>
              <h3 className="text-sm font-medium text-slate-200">Show Debug Info</h3>
              <p className="text-xs text-slate-400 mt-0.5">Display FPS and layer count</p>
            </div>
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                showDebug ? "bg-teal-600" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  showDebug ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <h3 className="text-sm font-medium text-slate-200 mb-2">FPS Limit</h3>
            <div className="flex gap-2">
              {(["30", "60"] as const).map((fps) => (
                <button
                  key={fps}
                  type="button"
                  onClick={() => setFpsLimit(fps === "30" ? 30 : 60)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    fpsLimit === (fps === "30" ? 30 : 60)
                      ? "bg-teal-600 text-white"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                  }`}
                >
                  {fps} FPS
                </button>
              ))}
            </div>
          </div>
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

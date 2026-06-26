import React from "react";

type Counter2ControlsProps = {
  onToggleSettings?: () => void;
  onToggleFloating?: () => void;
  onReset?: () => void;
  onBack?: () => void;
  backScreenPosition?: { x: number; y: number };
  resetScreenPosition?: { x: number; y: number };
  settingsScreenPosition?: { x: number; y: number };
};

export function Counter2Controls({
  onToggleSettings,
  onToggleFloating,
  onReset,
  onBack,
  backScreenPosition,
  resetScreenPosition,
  settingsScreenPosition,
}: Counter2ControlsProps) {
  const btnBase = "p-3 text-white rounded-full shadow-lg transition-colors";

  return (
    <>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className={`fixed z-50 ${btnBase} bg-slate-700/80 hover:bg-slate-600/80`}
          title="Back"
          style={
            backScreenPosition
              ? { left: backScreenPosition.x, top: backScreenPosition.y }
              : { left: 12, top: 12 }
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className={`fixed z-50 ${btnBase} bg-orange-600/80 hover:bg-orange-500/80`}
          title="Reset Counter"
          style={
            resetScreenPosition
              ? { left: resetScreenPosition.x, top: resetScreenPosition.y }
              : { right: 12, bottom: 76, left: "auto", top: "auto" }
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      )}

      <button
        type="button"
        onClick={onToggleFloating}
        className={`fixed z-50 ${btnBase} bg-teal-600/80 hover:bg-teal-500/80`}
        title="Info"
        style={{ right: 12, bottom: 76 }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={onToggleSettings}
        className={`fixed z-50 ${btnBase} bg-slate-700/80 hover:bg-slate-600/80`}
        title="Settings"
        style={
          settingsScreenPosition
            ? { left: settingsScreenPosition.x, top: settingsScreenPosition.y }
            : { right: 12, bottom: 12 }
        }
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </>
  );
}

import React, { forwardRef, useState, useEffect } from "react";
import { requireAssetUrl } from "@shared/asset/assetResolver";
import { loadPresets, deletePreset, type TimestampPreset } from "./PresetManager";

const lobbyBack = requireAssetUrl("lobby_cust_44");
const diplo = requireAssetUrl("diplo1");
const diplo2 = requireAssetUrl("diplo2");
const btnUndo = requireAssetUrl("btnUndo");
const btnRedo = requireAssetUrl("btnRedo");

export type TimestampHeaderProps = {
  onBack?: () => void;
  hInput: string;
  wInput: string;
  onHInputChange: (value: string) => void;
  onWInputChange: (value: string) => void;
  onHInputBlur: () => void;
  onWInputBlur: () => void;
  onHIncrement: () => void;
  onHDecrement: () => void;
  onWIncrement: () => void;
  onWDecrement: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSettings?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSavePreset?: (name: string) => void;
  onLoadPreset?: (preset: TimestampPreset) => void;
};

const TimestampHeader = forwardRef<HTMLDivElement, TimestampHeaderProps>(
  (
    {
      onBack,
      hInput,
      wInput,
      onHInputChange,
      onWInputChange,
      onHInputBlur,
      onWInputBlur,
      onHIncrement,
      onHDecrement,
      onWIncrement,
      onWDecrement,
      onOpen,
      onSettings,
      onSave,
      onUndo,
      onRedo,
      canUndo = false,
      canRedo = false,
      onSavePreset,
      onLoadPreset,
    },
    ref
  ) => {
    const [presets, setPresets] = useState<TimestampPreset[]>([]);
    const [presetName, setPresetName] = useState("");
    const [selectedPresetId, setSelectedPresetId] = useState<string>("");
    const [showPresetDropdown, setShowPresetDropdown] = useState(false);

    useEffect(() => {
      setPresets(loadPresets());
    }, []);

    const refreshPresets = () => setPresets(loadPresets());

    const handleSavePreset = () => {
      if (!presetName.trim() || !onSavePreset) return;
      onSavePreset(presetName.trim());
      setPresetName("");
      refreshPresets();
    };

    const handleLoadPreset = (presetId: string) => {
      const preset = presets.find((p) => p.id === presetId);
      if (preset && onLoadPreset) {
        onLoadPreset(preset);
        setSelectedPresetId(presetId);
        setShowPresetDropdown(false);
      }
    };

    const handleDeletePreset = (presetId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deletePreset(presetId);
      if (selectedPresetId === presetId) {
        setSelectedPresetId("");
      }
      refreshPresets();
    };

    return (
      <div
        ref={ref}
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-900"
      >
        <div className="flex flex-wrap items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 px-4 items-center justify-center rounded-md bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.98] transition-transform text-sm font-semibold"
              style={{
                backgroundImage: `url(${lobbyBack})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                color: "#fff",
                fontFamily: "Taimingda, sans-serif",
              }}
            >
              Back
            </button>
          )}
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="flex h-10 px-4 items-center justify-center rounded-md bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.98] transition-transform text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `url(${lobbyBack})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                color: "#fff",
                fontFamily: "Taimingda, sans-serif",
              }}
              title="Undo"
              aria-label="Undo"
            >
              Undo
            </button>
          )}
          {onRedo && (
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="flex h-10 px-4 items-center justify-center rounded-md bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.98] transition-transform text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `url(${lobbyBack})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                color: "#fff",
                fontFamily: "Taimingda, sans-serif",
              }}
              title="Redo"
              aria-label="Redo"
            >
              Redo
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1 group/h">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800/60 text-white font-semibold text-sm"
                style={{
                  backgroundImage: `url(${diplo})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  fontFamily: "Taimingda, sans-serif",
                }}
              >
                H
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800/60 text-white font-semibold text-sm"
                style={{
                  backgroundImage: `url(${diplo2})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="Input H"
                  className="w-full bg-transparent text-center font-semibold text-white outline-none placeholder:text-white/70 border-none focus:ring-0"
                  style={{ fontFamily: "Taimingda, sans-serif" }}
                  value={hInput}
                  onChange={(e) =>
                    onHInputChange(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  onBlur={onHInputBlur}
                />
              </div>
              <div className="flex flex-col opacity-0 group-hover/h:opacity-100 group-focus-within/h:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={onHIncrement}
                  className="flex h-5 w-5 items-center justify-center bg-slate-700/80 hover:bg-slate-600 text-white text-xs rounded-sm"
                >
                  ƒ-ı
                </button>
                <button
                  type="button"
                  onClick={onHDecrement}
                  className="flex h-5 w-5 items-center justify-center bg-slate-700/80 hover:bg-slate-600 text-white text-xs rounded-sm"
                >
                  ƒ-¬
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 group/w">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800/60 text-white font-semibold text-sm"
                style={{
                  backgroundImage: `url(${diplo})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  fontFamily: "Taimingda, sans-serif",
                }}
              >
                W
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800/60 text-white font-semibold text-sm"
                style={{
                  backgroundImage: `url(${diplo2})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="Input W"
                  className="w-full bg-transparent text-center font-semibold text-white outline-none placeholder:text-white/70 border-none focus:ring-0"
                  style={{ fontFamily: "Taimingda, sans-serif" }}
                  value={wInput}
                  onChange={(e) =>
                    onWInputChange(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  onBlur={onWInputBlur}
                />
              </div>
              <div className="flex flex-col opacity-0 group-hover/w:opacity-100 group-focus-within/w:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={onWIncrement}
                  className="flex h-5 w-5 items-center justify-center bg-slate-700/80 hover:bg-slate-600 text-white text-xs rounded-sm"
                >
                  ƒ-ı
                </button>
                <button
                  type="button"
                  onClick={onWDecrement}
                  className="flex h-5 w-5 items-center justify-center bg-slate-700/80 hover:bg-slate-600 text-white text-xs rounded-sm"
                >
                  ƒ-¬
                </button>
              </div>
            </div>
          </div>
        </div>

        {(onSavePreset || onLoadPreset) && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.98] transition-transform"
                style={{
                  backgroundImage: `url(${lobbyBack})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
                title="Presets"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              {showPresetDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 rounded-md shadow-lg border border-slate-700 z-50">
                  <div className="p-2 border-b border-slate-700">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Preset name..."
                        className="flex-1 rounded border border-slate-600 bg-slate-700 px-2 py-1 text-sm text-white placeholder:text-slate-400"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSavePreset();
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSavePreset}
                        disabled={!presetName.trim()}
                        className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {presets.length === 0 ? (
                      <div className="p-2 text-xs text-slate-400 italic">No presets saved</div>
                    ) : (
                      presets.map((preset) => (
                        <div
                          key={preset.id}
                          className={`flex items-center justify-between px-2 py-1.5 hover:bg-slate-700 cursor-pointer ${
                            selectedPresetId === preset.id ? "bg-slate-700" : ""
                          }`}
                          onClick={() => handleLoadPreset(preset.id)}
                        >
                          <span className="text-sm text-white truncate flex-1">{preset.name}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePreset(preset.id, e)}
                            className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                            title="Delete"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="flex h-10 px-4 items-center justify-center rounded-md bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.98] transition-transform text-sm font-semibold"
            style={{
              backgroundImage: `url(${lobbyBack})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              color: "#fff",
              fontFamily: "Taimingda, sans-serif",
            }}
          >
            Open
          </button>
          {onSettings && (
            <button
              type="button"
              onClick={onSettings}
              className="flex h-10 px-4 items-center justify-center rounded-md bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.98] transition-transform text-sm font-semibold"
              style={{
                backgroundImage: `url(${lobbyBack})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                color: "#fff",
                fontFamily: "Taimingda, sans-serif",
              }}
            >
              Settings
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            className="flex h-10 px-4 items-center justify-center rounded-md bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.98] transition-transform text-sm font-semibold"
            style={{
              backgroundImage: `url(${lobbyBack})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              color: "#fff",
              fontFamily: "Taimingda, sans-serif",
            }}
          >
            Save
          </button>
        </div>
      </div>
    );
  }
);

TimestampHeader.displayName = "TimestampHeader";

export default TimestampHeader;

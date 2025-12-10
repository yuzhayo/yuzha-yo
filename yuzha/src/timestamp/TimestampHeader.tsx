import React, { forwardRef } from "react";
import { requireAssetUrl } from "@shared/asset/assetResolver";

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
    },
    ref
  ) => {
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

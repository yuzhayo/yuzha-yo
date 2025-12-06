import React, { useEffect, useState } from "react";
import StageThree from "@shared/layer/StageThree";
import lobbyBack from "@shared/asset/lobby_cust_44.png";
import diplo from "@shared/asset/diplo1.png";
import diplo2 from "@shared/asset/diplo2.png";

export type TimestampScreenProps = {
  onBack?: () => void;
};

/**
 * TimestampScreen - emptied scaffold per request.
 */
export default function TimestampScreen({ onBack }: TimestampScreenProps) {
  const [hValue, setHValue] = useState(512);
  const [wValue, setWValue] = useState(512);
  const [viewport, setViewport] = useState<{ vw: number; vh: number }>({
    vw: typeof window !== "undefined" ? window.innerWidth : 1024,
    vh: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handle = () => setViewport({ vw: window.innerWidth, vh: window.innerHeight });
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const clampSize = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max));
  const maxWidth = Math.min(1024, viewport.vw * 0.9);
  const maxHeight = Math.min(1024, viewport.vh * 0.8);
  const widthPx = clampSize(wValue, 128, maxWidth);
  const heightPx = clampSize(hValue, 128, maxHeight);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-white">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 px-3 items-center justify-center rounded-md bg-slate-800/80 hover:bg-slate-700/80 active:scale-[0.98] transition-transform text-sm font-semibold"
              style={{
                backgroundImage: `url(${lobbyBack})`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                color: "#fff",
              }}
            >
              Back
            </button>
          )}
          {/* Header placeholder */}
          <div className="flex items-center gap-0 text-xs text-slate-300">
            <div className="flex items-center gap-1">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800/60 text-white font-semibold"
                style={{
                  backgroundImage: `url(${diplo})`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              >
                H
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800/60 text-white font-semibold"
                style={{
                  backgroundImage: `url(${diplo2})`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              >
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Input H"
                  className="w-full bg-transparent text-center font-semibold text-white outline-none placeholder:text-white/70 border-none focus:ring-0"
                  style={{ appearance: "none" } as React.CSSProperties}
                  value={hValue}
                  onChange={(e) => setHValue(Number(e.target.value) || 0)}
                  placeholder=""
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800/60 text-white font-semibold"
                style={{
                  backgroundImage: `url(${diplo})`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              >
                W
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800/60 text-white font-semibold"
                style={{
                  backgroundImage: `url(${diplo2})`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              >
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Input W"
                  className="w-full bg-transparent text-center font-semibold text-white outline-none placeholder:text-white/70 border-none focus:ring-0"
                  style={{ appearance: "none" } as React.CSSProperties}
                  value={wValue}
                  onChange={(e) => setWValue(Number(e.target.value) || 0)}
                  placeholder=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-start justify-center p-4">
        <div
          className="relative border-2 border-emerald-400/70 rounded-xl shadow-xl overflow-hidden bg-slate-900"
          style={{
            width: `${widthPx}px`,
            height: `${heightPx}px`,
          }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <StageThree />
          </div>
        </div>
      </div>
    </div>
  );
}

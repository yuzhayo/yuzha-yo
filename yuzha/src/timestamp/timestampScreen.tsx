import React from "react";
import StageThree from "@shared/layer/StageThree";

export type TimestampScreenProps = {
  onBack?: () => void;
};

/**
 * TimestampScreen - emptied scaffold per request.
 */
export default function TimestampScreen({ onBack }: TimestampScreenProps) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-700"
            >
              Back
            </button>
          )}
          <div className="text-sm text-slate-300">Timestamp</div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <div
          className="relative w-full max-w-[1024px] border-2 border-emerald-400/70 rounded-xl shadow-xl overflow-hidden bg-slate-900"
          style={{ height: 0, paddingBottom: "100%" }} // 1:1 aspect, scales with viewport
        >
          <div className="absolute inset-0 pointer-events-none">
            <StageThree />
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import StageCanvas from "../../../shared/stage/StageCanvas";
import { createTestStagePipeline } from "./testStagePipeline";

export type TestScreenProps = {
  onBack?: () => void;
};

export default function TestScreen({ onBack }: TestScreenProps) {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-950 text-white">
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className="absolute right-6 top-6 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-blue-500 active:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Back
      </button>
      <div className="absolute left-6 top-6 z-10 max-w-xs space-y-2 rounded bg-black/40 p-4 text-xs">
        <p className="font-semibold uppercase tracking-wide text-slate-200">Test Stage</p>
        <p className="text-slate-300">
          Layers load from <code>src/test/test.json</code>. Adjust <code>ImageScale</code> and{" "}
          <code>LayerOrder</code> to verify rendering.
        </p>
      </div>
      <StageCanvas loadPipeline={createTestStagePipeline} />
    </div>
  );
}

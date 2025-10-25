import React from "react";
import layoutData from "./struck.json";

export type StruckBlock = {
  id: string;
  label: string;
  hint?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
};

export type StruckLayout = {
  canvas?: {
    size?: number;
    background?: string;
    grid?: {
      step?: number;
      color?: string;
    };
  };
  blocks: StruckBlock[];
};

export type StruckScreenProps = {
  onBack?: () => void;
};

const layout: StruckLayout = layoutData;
const DEFAULT_CANVAS_SIZE = 2048;

function percent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

export default function StruckScreen(props: StruckScreenProps) {
  const canvasSize = layout.canvas?.size ?? DEFAULT_CANVAS_SIZE;
  const canvasBackground = layout.canvas?.background ?? "#020617";
  const gridStep = layout.canvas?.grid?.step ?? 0;
  const gridColor = layout.canvas?.grid?.color ?? "rgba(255,255,255,0.05)";

  const gridBackground =
    gridStep > 0
      ? `repeating-linear-gradient(0deg, ${gridColor} 0px, ${gridColor} 1px, transparent 1px, transparent ${gridStep}px),
         repeating-linear-gradient(90deg, ${gridColor} 0px, ${gridColor} 1px, transparent 1px, transparent ${gridStep}px)`
      : undefined;

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-950 text-white">
      <div
        className="relative aspect-square overflow-hidden rounded-lg shadow-[0_0_60px_rgba(15,23,42,0.6)]"
        style={{
          width: "max(100vw, 100vh)",
          height: "max(100vw, 100vh)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: canvasBackground,
            backgroundImage: gridBackground,
          }}
        />
        <div className="absolute inset-0">
          {layout.blocks.map((block) => {
            const left = percent(block.x, canvasSize);
            const top = percent(block.y, canvasSize);
            const width = percent(block.width, canvasSize);
            const height = percent(block.height, canvasSize);

            return (
              <div
                key={block.id}
                className="absolute rounded-lg border border-white/15 bg-white/5 p-3 text-xs uppercase tracking-wide"
                style={{
                  left,
                  top,
                  width,
                  height,
                  backgroundColor: `${block.color ?? "rgba(15, 23, 42, 0.7)"}`,
                  color: "#020617",
                }}
              >
                <div className="flex flex-col gap-1 text-[10px] font-semibold">
                  <span className="text-base font-bold text-white">{block.label}</span>
                  {block.hint && <span className="text-xs text-white/70">{block.hint}</span>}
                  <span className="font-mono text-[11px] text-white/60">
                    {block.width}x{block.height} @ ({block.x},{block.y})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {props.onBack && (
        <button
          type="button"
          onClick={props.onBack}
          className="absolute right-6 top-6 rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-slate-700 active:bg-slate-800"
        >
          Back
        </button>
      )}
    </div>
  );
}

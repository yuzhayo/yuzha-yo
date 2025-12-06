import React from "react";
import StageThree from "@shared/layer/StageThree";
import FloatingBorderless from "@shared/floating/FloatingBorderless";

export type TimestampScreenProps = {
  onBack?: () => void;
};

type BlockId = "time" | "date" | "location";
type Align = "left" | "center" | "right";

type BlockState = {
  id: BlockId;
  label: string;
  text: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: Align;
  pos: { x: number; y: number };
  size: { width: number; height: number };
};

const DEFAULT_BLOCKS: BlockState[] = [
  {
    id: "time",
    label: "Time",
    text: "03:53",
    fontSize: 42,
    fontWeight: 700,
    color: "#f8fafc",
    align: "left",
    pos: { x: 40, y: 60 },
    size: { width: 200, height: 80 },
  },
  {
    id: "date",
    label: "Date",
    text: "06/12/2025 · Fri",
    fontSize: 18,
    fontWeight: 600,
    color: "#e2e8f0",
    align: "left",
    pos: { x: 40, y: 120 },
    size: { width: 260, height: 60 },
  },
  {
    id: "location",
    label: "Location",
    text: "Jl. Raya Mulyosari Blok B7/A7\nDukuh Sutorejo, Surabaya\nJawa Timur 60113",
    fontSize: 18,
    fontWeight: 600,
    color: "#f8fafc",
    align: "left",
    pos: { x: 40, y: 180 },
    size: { width: 320, height: 140 },
  },
];

export default function TimestampScreen({ onBack }: TimestampScreenProps) {
  const [blocks, setBlocks] = React.useState<BlockState[]>(DEFAULT_BLOCKS);
  const [selectedId, setSelectedId] = React.useState<BlockId>("time");

  const selected = React.useMemo(
    () => blocks.find((b) => b.id === selectedId) ?? blocks[0],
    [blocks, selectedId],
  );

  const updateBlock = (id: BlockId, patch: Partial<BlockState>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const handlePosSizeChange = (id: BlockId, pos: { x: number; y: number }, size: { width: number; height: number }) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, pos: { x: Math.round(pos.x), y: Math.round(pos.y) }, size } : b)),
    );
  };

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
          <div className="text-sm text-slate-300">Timestamp Preview</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden lg:flex-row">
        <div className="relative flex-1 min-h-[520px] rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <StageThree />
          </div>

          <div className="absolute inset-0">
            {blocks.map((block) => (
              <FloatingBorderless
                key={block.id}
                initialPos={block.pos}
                initialSize={block.size}
                minWidth={80}
                minHeight={50}
                zIndex={10}
                onChange={(pos, size) => handlePosSizeChange(block.id, pos, size)}
                style={{ pointerEvents: "auto" }}
              >
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedId(block.id);
                  }}
                  className={`h-full w-full rounded-lg border ${
                    selectedId === block.id ? "border-emerald-400/70" : "border-white/15"
                  } bg-black/30 backdrop-blur-sm p-2`}
                  style={{
                    color: block.color,
                    fontSize: block.fontSize,
                    fontWeight: block.fontWeight,
                    textAlign: block.align,
                    whiteSpace: "pre-line",
                  }}
                >
                  {block.text}
                </div>
              </FloatingBorderless>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-80 rounded-xl border border-white/10 bg-slate-900/70 p-4 space-y-3">
          <div className="text-sm font-semibold text-white">Block settings</div>
          {selected ? (
            <div className="space-y-3 text-sm">
              <div className="text-xs text-slate-300">Editing: {selected.label}</div>
              <label className="space-y-1 block">
                <span className="text-slate-300">Text</span>
                <textarea
                  value={selected.text}
                  onChange={(e) => updateBlock(selected.id, { text: e.target.value })}
                  rows={3}
                  className="w-full rounded bg-slate-800 border border-white/10 px-2 py-1 text-white"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-slate-300">Font size ({selected.fontSize}px)</span>
                <input
                  type="range"
                  min={10}
                  max={72}
                  value={selected.fontSize}
                  onChange={(e) => updateBlock(selected.id, { fontSize: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-slate-300">Font weight ({selected.fontWeight})</span>
                <input
                  type="range"
                  min={300}
                  max={900}
                  step={50}
                  value={selected.fontWeight}
                  onChange={(e) => updateBlock(selected.id, { fontWeight: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-slate-300">Color</span>
                <input
                  type="color"
                  value={selected.color}
                  onChange={(e) => updateBlock(selected.id, { color: e.target.value })}
                  className="h-9 w-full rounded bg-slate-800 border border-white/10"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-slate-300">Align</span>
                <select
                  value={selected.align}
                  onChange={(e) => updateBlock(selected.id, { align: e.target.value as Align })}
                  className="w-full rounded bg-slate-800 border border-white/10 px-2 py-1"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <div className="text-xs text-slate-400">
                Tip: Drag/resize blocks directly on the preview. Settings update live.
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-300">Select a block to edit.</div>
          )}
        </div>
      </div>
    </div>
  );
}

import type { LayerConfigEntry } from "../config/Config";

export type Layer2DTransform = {
  position: { x: number; y: number };
  scale: { x: number; y: number };
};

export function compute2DTransform(entry: LayerConfigEntry, stageSize: number): Layer2DTransform {
  const [sxPercent, syPercent] = normalizePair(entry.scale, 100, 100);
  const sx = clampedPercentToScale(sxPercent);
  const sy = clampedPercentToScale(syPercent);
  const defaultCenter = stageSize / 2;
  const [px, py] = normalizePair(entry.position, defaultCenter, defaultCenter);
  return {
    position: { x: px, y: py },
    scale: { x: sx, y: sy },
  };
}

function clampedPercentToScale(percent: number): number {
  const clamped = Math.max(10, Math.min(500, percent));
  return clamped / 100;
}

function normalizePair(
  value: number[] | undefined,
  fallbackX: number,
  fallbackY: number,
): [number, number] {
  if (!Array.isArray(value) || value.length === 0) return [fallbackX, fallbackY];
  const [first, second] = value;
  const x = typeof first === "number" && Number.isFinite(first) ? first : fallbackX;
  const y = typeof second === "number" && Number.isFinite(second) ? second : fallbackY;
  return [x, y];
}

export function is2DLayer(entry: LayerConfigEntry): boolean {
  return entry.renderer === "2D";
}

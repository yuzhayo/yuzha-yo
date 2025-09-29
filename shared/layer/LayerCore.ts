import type { LayerConfigEntry } from "../config/Config";

export type Layer2DTransform = {
  position: { x: number; y: number };
  scale: { x: number; y: number };
};

export function compute2DTransform(entry: LayerConfigEntry, stageSize: number): Layer2DTransform {
  const [sx, sy] = normalizePair(entry.scale, 1, 1);
  const defaultCenter = stageSize / 2;
  const [px, py] = normalizePair(entry.position, defaultCenter, defaultCenter);
  return {
    position: { x: px, y: py },
    scale: { x: sx, y: sy },
  };
}

function normalizePair(value: number[] | undefined, fallbackX: number, fallbackY: number): [number, number] {
  if (!Array.isArray(value) || value.length === 0) return [fallbackX, fallbackY];
  const [first, second] = value;
  const x = typeof first === "number" && Number.isFinite(first) ? first : fallbackX;
  const y = typeof second === "number" && Number.isFinite(second) ? second : fallbackY;
  return [x, y];
}

export function is2DLayer(entry: LayerConfigEntry): boolean {
  return entry.renderer === "2D";
}

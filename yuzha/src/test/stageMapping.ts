/**
 * Minimal helpers for working inside the 2048x2048 stage space.
 * Converts between pixel coordinates and 0-100% values without
 * depending on the production stage system.
 */

export const TEST_STAGE_SIZE = 2048;

export type StagePoint = { x: number; y: number };
export type StagePercent = { x: number; y: number };

const FALLBACK_POINT: StagePoint = { x: 0, y: 0 };

function safeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamp coordinates to the stage bounds.
 */
export function clampStagePoint(point: StagePoint, stageSize = TEST_STAGE_SIZE): StagePoint {
  const safeX = safeNumber(point.x, FALLBACK_POINT.x);
  const safeY = safeNumber(point.y, FALLBACK_POINT.y);
  return {
    x: clamp(safeX, 0, stageSize),
    y: clamp(safeY, 0, stageSize),
  };
}

/**
 * Convert stage pixel coordinates into percentage values relative to the stage size.
 */
export function stagePointToPercent(point: StagePoint, stageSize = TEST_STAGE_SIZE): StagePercent {
  const { x, y } = clampStagePoint(point, stageSize);
  return {
    x: (x / stageSize) * 100,
    y: (y / stageSize) * 100,
  };
}

/**
 * Convert 0-100% coordinates into stage pixel coordinates.
 * Percent values outside 0-100 are allowed and extrapolate linearly.
 */
export function percentToStagePoint(
  percent: StagePercent,
  stageSize = TEST_STAGE_SIZE,
): StagePoint {
  const xPercent = safeNumber(percent.x, 0);
  const yPercent = safeNumber(percent.y, 0);
  return {
    x: (xPercent / 100) * stageSize,
    y: (yPercent / 100) * stageSize,
  };
}

/**
 * Convenience helper returning the stage centre coordinates.
 */
export function getStageCenter(stageSize = TEST_STAGE_SIZE): StagePoint {
  const half = stageSize / 2;
  return { x: half, y: half };
}

/**
 * Combined helpers for image-space and stage-space mapping inside the test harness.
 * Keeps the math self-contained so we don't touch the shared layer modules.
 */

export const TEST_STAGE_SIZE = 2048;

// ---------------------------------------------------------------------------
// Image mapping utilities
// ---------------------------------------------------------------------------

export type ImageDimensions = { width: number; height: number };

export type ImageMapping = {
  width: number;
  height: number;
  center: { x: number; y: number };
};

export type PercentPoint = { x: number; y: number };
type Point2D = { x: number; y: number };
export type ScaleVector = { x: number; y: number };

const FALLBACK_IMAGE_DIMENSIONS: ImageDimensions = { width: 100, height: 100 };

function safeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function normaliseImageDimensions(dimensions: ImageDimensions): ImageDimensions {
  const width = safeNumber(dimensions.width, FALLBACK_IMAGE_DIMENSIONS.width);
  const height = safeNumber(dimensions.height, FALLBACK_IMAGE_DIMENSIONS.height);
  return {
    width: width > 0 ? width : FALLBACK_IMAGE_DIMENSIONS.width,
    height: height > 0 ? height : FALLBACK_IMAGE_DIMENSIONS.height,
  };
}

export function createImageMapping(dimensions: ImageDimensions): ImageMapping {
  const { width, height } = normaliseImageDimensions(dimensions);
  return {
    width,
    height,
    center: { x: width / 2, y: height / 2 },
  };
}

export function calculateImageCenter(dimensions: ImageDimensions): Point2D {
  const { width, height } = normaliseImageDimensions(dimensions);
  return { x: width / 2, y: height / 2 };
}

function normalisePercent(value: number): number {
  return safeNumber(value, 0);
}

export function percentToImagePoint(percent: PercentPoint, mapping: ImageMapping): Point2D {
  const xPercent = normalisePercent(percent.x);
  const yPercent = normalisePercent(percent.y);
  return {
    x: (xPercent / 100) * mapping.width,
    y: (yPercent / 100) * mapping.height,
  };
}

export function imagePointToPercent(point: Point2D, mapping: ImageMapping): PercentPoint {
  const x = safeNumber(point.x, 0);
  const y = safeNumber(point.y, 0);
  return {
    x: (x / mapping.width) * 100,
    y: (y / mapping.height) * 100,
  };
}

// ---------------------------------------------------------------------------
// Stage mapping utilities
// ---------------------------------------------------------------------------

export type StagePoint = { x: number; y: number };
export type StagePercent = { x: number; y: number };

const FALLBACK_STAGE_POINT: StagePoint = { x: 0, y: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clampStagePoint(point: StagePoint, stageSize = TEST_STAGE_SIZE): StagePoint {
  const safeX = safeNumber(point.x, FALLBACK_STAGE_POINT.x);
  const safeY = safeNumber(point.y, FALLBACK_STAGE_POINT.y);
  return {
    x: clamp(safeX, 0, stageSize),
    y: clamp(safeY, 0, stageSize),
  };
}

export function stagePointToPercent(point: StagePoint, stageSize = TEST_STAGE_SIZE): StagePercent {
  const { x, y } = clampStagePoint(point, stageSize);
  return {
    x: (x / stageSize) * 100,
    y: (y / stageSize) * 100,
  };
}

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

export function getStageCenter(stageSize = TEST_STAGE_SIZE): StagePoint {
  const half = stageSize / 2;
  return { x: half, y: half };
}

export function computePositionForPivot(
  stageAnchor: StagePoint,
  pivotPercent: PercentPoint,
  imageDimensions: ImageDimensions,
  scale: ScaleVector,
  rotationDeg: number,
): StagePoint {
  const mapping = createImageMapping(imageDimensions);
  const pivotPoint = percentToImagePoint(pivotPercent, mapping);
  const offsetFromCenter = {
    x: (pivotPoint.x - mapping.center.x) * scale.x,
    y: (pivotPoint.y - mapping.center.y) * scale.y,
  };

  const rotationRad = (rotationDeg * Math.PI) / 180;
  const cosR = Math.cos(rotationRad);
  const sinR = Math.sin(rotationRad);

  const rotatedOffset = {
    x: offsetFromCenter.x * cosR - offsetFromCenter.y * sinR,
    y: offsetFromCenter.x * sinR + offsetFromCenter.y * cosR,
  };

  return {
    x: stageAnchor.x - rotatedOffset.x,
    y: stageAnchor.y - rotatedOffset.y,
  };
}

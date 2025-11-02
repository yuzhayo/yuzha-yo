/**
 * Minimal helpers for calculating image dimensions and picking points by percentage.
 * This mirrors the essential math from the shared layer modules without the extras.
 */

export type ImageDimensions = { width: number; height: number };

export type ImageMapping = {
  width: number;
  height: number;
  center: { x: number; y: number };
};

export type PercentPoint = { x: number; y: number };

type Point2D = { x: number; y: number };

const FALLBACK_DIMENSIONS: ImageDimensions = { width: 100, height: 100 };

function safeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function normaliseDimensions(dimensions: ImageDimensions): ImageDimensions {
  const width = safeNumber(dimensions.width, FALLBACK_DIMENSIONS.width);
  const height = safeNumber(dimensions.height, FALLBACK_DIMENSIONS.height);
  return {
    width: width > 0 ? width : FALLBACK_DIMENSIONS.width,
    height: height > 0 ? height : FALLBACK_DIMENSIONS.height,
  };
}

/**
 * Build a simple mapping object that captures width, height and the geometric centre.
 */
export function createImageMapping(dimensions: ImageDimensions): ImageMapping {
  const { width, height } = normaliseDimensions(dimensions);
  return {
    width,
    height,
    center: { x: width / 2, y: height / 2 },
  };
}

/**
 * Calculate image centre from raw dimensions.
 */
export function calculateImageCenter(dimensions: ImageDimensions): Point2D {
  const { width, height } = normaliseDimensions(dimensions);
  return { x: width / 2, y: height / 2 };
}

function normalisePercent(value: number): number {
  return safeNumber(value, 0);
}

/**
 * Convert a 0-100 percent coordinate into pixel space using an image mapping.
 * Values outside 0-100 are allowed (they simply extrapolate).
 */
export function percentToImagePoint(percent: PercentPoint, mapping: ImageMapping): Point2D {
  const xPercent = normalisePercent(percent.x);
  const yPercent = normalisePercent(percent.y);
  return {
    x: (xPercent / 100) * mapping.width,
    y: (yPercent / 100) * mapping.height,
  };
}

/**
 * Convert a pixel coordinate back into percentage space relative to the image mapping.
 */
export function imagePointToPercent(point: Point2D, mapping: ImageMapping): PercentPoint {
  const x = safeNumber(point.x, 0);
  const y = safeNumber(point.y, 0);
  return {
    x: (x / mapping.width) * 100,
    y: (y / mapping.height) * 100,
  };
}

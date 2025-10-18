/**
 * ============================================================================
 * LAYER BASIC - Coordinate Transformations & Math Utilities
 * ============================================================================
 *
 * This module provides fundamental mathematical utilities for the layer system.
 * It contains pure functions with NO side effects and NO dependencies on other
 * layer modules (layerCore, layerSpin, layerOrbit, etc.).
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This is the MATH LIBRARY for the layer system. All coordinate transformations,
 * validations, and geometric calculations live here. Think of it as the
 * "utility belt" that all other layer modules use.
 *
 * RESPONSIBILITIES:
 * -----------------
 * 1. Coordinate System Conversions
 *    - Image space (pixels) ↔ Stage space (pixels)
 *    - Percent coordinates (0-100%) ↔ Pixel coordinates
 *    - Point conversions between different spaces
 *
 * 2. Geometric Calculations
 *    - Pivot-based positioning (anchor any point on image to any point on stage)
 *    - Scale transformations
 *    - Coordinate bundles and dual-space coordinates
 *
 * 3. Validation & Clamping
 *    - Validate and sanitize points, scales, dimensions
 *    - Clamp values to safe ranges
 *    - Normalize arrays and tuples
 *
 * COORDINATE SYSTEMS EXPLAINED:
 * ------------------------------
 * - **Image Space**: Pixels within an image (0,0 = top-left of image)
 * - **Stage Space**: Pixels on the 2048x2048 stage (0,0 = top-left of stage)
 * - **Percent Space**: Percentage coordinates (0-100% in both x and y)
 *
 * USED BY:
 * --------
 * - layerCore.ts (for prepareLayer calculations)
 * - layerSpin.ts (for spin pivot calculations)
 * - layerOrbit.ts (for orbital positioning)
 *
 * @module layer/layerBasic
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
// These types are used throughout the layer system for type safety and clarity.
// FOR FUTURE AI AGENTS: These are the fundamental geometric primitives.
// ============================================================================

/**
 * 2D point in pixel space
 * Used for both image space and stage space coordinates
 */
export type Point2D = { x: number; y: number };

/**
 * 2D point in percentage space (0-100% in both dimensions)
 * Used for relative positioning independent of absolute dimensions
 */
export type PercentPoint = { x: number; y: number };

/**
 * A point represented in both pixel and percentage coordinates
 * Useful for maintaining dual representations
 */
export type CoordinateBundle = {
  point: Point2D;
  percent: PercentPoint;
};

/**
 * A point represented in both image space and stage space
 * Essential for coordinate transformations between the two systems
 */
export type DualSpaceCoordinate = {
  image: CoordinateBundle;
  stage: CoordinateBundle;
};

/**
 * Extended coordinate for orbital calculations
 * Includes the stage anchor point for orbit center
 */
export type OrbitCoordinate = DualSpaceCoordinate & {
  stageAnchor: CoordinateBundle;
};

/**
 * 2D transformation (position + scale)
 * Complete specification for placing and sizing a layer
 */
export type Layer2DTransform = {
  position: Point2D;
  scale: Point2D;
};

// ============================================================================
// COORDINATE TRANSFORMATION FUNCTIONS
// ============================================================================
// These functions convert coordinates between different spaces.
// FOR FUTURE AI AGENTS: Use these instead of reimplementing the math.
// ============================================================================

/**
 * Transform a point from image space to stage space
 *
 * ALGORITHM:
 * 1. Calculate offset from image center to the point
 * 2. Apply scale to the offset
 * 3. Add scaled offset to layer position
 *
 * USAGE: When you have a point on an image and need to know where it appears on the stage
 *
 * @param imagePoint - Point in image pixel coordinates (0,0 = image top-left)
 * @param imageDimensions - Image width and height in pixels
 * @param scale - Scale factors (1.0 = no scaling)
 * @param position - Layer position on stage (where image center is placed)
 * @returns Point in stage pixel coordinates (0,0 = stage top-left)
 */
export function imagePointToStagePoint(
  imagePoint: Point2D,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
  position: Point2D,
): Point2D {
  const validImagePoint = validatePoint(imagePoint);
  const validDimensions = validateDimensions(imageDimensions);
  const validScale = validateScale(scale);
  const validPosition = validatePoint(position);

  const halfWidth = validDimensions.width / 2;
  const halfHeight = validDimensions.height / 2;

  const result = {
    x: validPosition.x + (validImagePoint.x - halfWidth) * validScale.x,
    y: validPosition.y + (validImagePoint.y - halfHeight) * validScale.y,
  };

  return validatePoint(result);
}

/**
 * Transform a point from stage space to image space
 *
 * ALGORITHM:
 * 1. Calculate offset from layer position to stage point
 * 2. Divide by scale (inverse transform)
 * 3. Add to image center
 *
 * USAGE: When you have a point on the stage and need to find corresponding point on image
 *
 * @param stagePoint - Point in stage pixel coordinates
 * @param imageDimensions - Image width and height in pixels
 * @param scale - Scale factors
 * @param position - Layer position on stage
 * @returns Point in image pixel coordinates
 */
export function stagePointToImagePoint(
  stagePoint: Point2D,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
  position: Point2D,
): Point2D {
  const validStagePoint = validatePoint(stagePoint);
  const validDimensions = validateDimensions(imageDimensions);
  const validScale = validateScale(scale);
  const validPosition = validatePoint(position);

  const halfWidth = validDimensions.width / 2;
  const halfHeight = validDimensions.height / 2;

  // Prevent division by zero
  const safeScaleX = validScale.x !== 0 ? validScale.x : 1;
  const safeScaleY = validScale.y !== 0 ? validScale.y : 1;

  const result = {
    x: (validStagePoint.x - validPosition.x) / safeScaleX + halfWidth,
    y: (validStagePoint.y - validPosition.y) / safeScaleY + halfHeight,
  };

  return validatePoint(result);
}

/**
 * Convert image point (pixels) to percentage coordinates
 *
 * USAGE: When you need relative coordinates independent of image size
 *
 * @param imagePoint - Point in image pixel coordinates
 * @param imageDimensions - Image width and height
 * @returns Point in percentage coordinates (0-100%)
 */
export function imagePointToPercent(
  imagePoint: Point2D,
  imageDimensions: { width: number; height: number },
): PercentPoint {
  return {
    x: (imagePoint.x / imageDimensions.width) * 100,
    y: (imagePoint.y / imageDimensions.height) * 100,
  };
}

/**
 * Convert percentage coordinates to image point (pixels)
 *
 * USAGE: When you have relative coordinates and need absolute pixel position
 *
 * @param imagePercent - Point in percentage coordinates (0-100%)
 * @param imageDimensions - Image width and height
 * @returns Point in image pixel coordinates
 */
export function imagePercentToImagePoint(
  imagePercent: PercentPoint,
  imageDimensions: { width: number; height: number },
): Point2D {
  const validPercent = {
    x: clampPercent(imagePercent.x),
    y: clampPercent(imagePercent.y),
  };
  const validDimensions = validateDimensions(imageDimensions);

  const result = {
    x: (validPercent.x / 100) * validDimensions.width,
    y: (validPercent.y / 100) * validDimensions.height,
  };

  return validatePoint(result);
}

/**
 * Convert stage point to percentage coordinates
 *
 * @param stagePoint - Point in stage pixel coordinates
 * @param stageSize - Stage size (usually 2048)
 * @returns Point in percentage coordinates (0-100%)
 */
export function stagePointToPercent(stagePoint: Point2D, stageSize: number): PercentPoint {
  return {
    x: (stagePoint.x / stageSize) * 100,
    y: (stagePoint.y / stageSize) * 100,
  };
}

/**
 * Convert percentage coordinates to stage point
 *
 * @param stagePercent - Point in percentage coordinates (0-100%)
 * @param stageSize - Stage size (usually 2048)
 * @returns Point in stage pixel coordinates
 */
export function stagePercentToStagePoint(stagePercent: PercentPoint, stageSize: number): Point2D {
  return {
    x: (stagePercent.x / 100) * stageSize,
    y: (stagePercent.y / 100) * stageSize,
  };
}

// ============================================================================
// PIVOT-BASED POSITIONING
// ============================================================================
// This is the CORE positioning algorithm that enables flexible layer placement.
// FOR FUTURE AI AGENTS: This function is crucial - it allows anchoring ANY point
// on an image to ANY point on the stage.
// ============================================================================

/**
 * Calculate layer position for pivot-based anchoring
 *
 * PROBLEM: We want a specific point on an image (e.g., 75%, 30%) to appear at
 * a specific point on the stage (e.g., 1200, 800).
 *
 * SOLUTION: Calculate where the image CENTER should be positioned so that
 * when the rendering engine places it, the desired image point ends up at
 * the desired stage point.
 *
 * ALGORITHM:
 * 1. Convert image percent to image pixels
 * 2. Calculate offset from image center to that point
 * 3. Apply scale to the offset
 * 4. Subtract scaled offset from stage anchor to get final position
 *
 * USAGE: Used by layerCore.compute2DTransform() for BasicStagePoint/BasicImagePoint system
 *
 * @param stageAnchor - Where we want the image point to appear on stage
 * @param imagePercent - Which point on image (0-100%) to anchor
 * @param imageDimensions - Image width and height
 * @param scale - Scale factors
 * @returns Position where image center should be placed for rendering
 *
 * @example
 * // Anchor the image's top-right corner (100%, 0%) to stage point (1500, 500)
 * const position = calculatePositionForPivot(
 *   { x: 1500, y: 500 },
 *   { x: 100, y: 0 },
 *   { width: 400, height: 300 },
 *   { x: 1.0, y: 1.0 }
 * );
 * // position will be { x: 1300, y: 650 } (image center position)
 */
export function calculatePositionForPivot(
  stageAnchor: Point2D,
  imagePercent: PercentPoint,
  imageDimensions: { width: number; height: number },
  scale: Point2D,
): Point2D {
  // Convert percent to image pixels
  const imagePointPixels: Point2D = {
    x: (imagePercent.x / 100) * imageDimensions.width,
    y: (imagePercent.y / 100) * imageDimensions.height,
  };

  // Image center in pixels
  const imageCenter: Point2D = {
    x: imageDimensions.width / 2,
    y: imageDimensions.height / 2,
  };

  // Offset from center to desired point (in pixels)
  const offsetFromCenter: Point2D = {
    x: imagePointPixels.x - imageCenter.x,
    y: imagePointPixels.y - imageCenter.y,
  };

  // Apply scale to offset
  const scaledOffset: Point2D = {
    x: offsetFromCenter.x * scale.x,
    y: offsetFromCenter.y * scale.y,
  };

  // Calculate position: stageAnchor - scaledOffset
  // This ensures when rendering engines place image center at position,
  // the desired image point ends up at the stage anchor
  const position: Point2D = {
    x: stageAnchor.x - scaledOffset.x,
    y: stageAnchor.y - scaledOffset.y,
  };

  return validatePoint(position);
}

// ============================================================================
// COORDINATE BUNDLE HELPERS
// ============================================================================
// These create structured coordinate objects with both pixel and percent values.
// FOR FUTURE AI AGENTS: Used by layerCore to build comprehensive layer data.
// ============================================================================

/**
 * Create a coordinate bundle (point + percent representation)
 *
 * @param point - Point in pixel coordinates
 * @param percent - Point in percentage coordinates
 * @returns Coordinate bundle with both representations
 */
export function createCoordinateBundle(point: Point2D, percent: PercentPoint): CoordinateBundle {
  return { point, percent };
}

/**
 * Create a dual-space coordinate (image + stage representations)
 *
 * @param imagePoint - Point in image pixel coordinates
 * @param imagePercent - Point in image percentage coordinates
 * @param stagePoint - Point in stage pixel coordinates
 * @param stagePercent - Point in stage percentage coordinates
 * @returns Dual-space coordinate with all representations
 */
export function createDualSpaceCoordinate(
  imagePoint: Point2D,
  imagePercent: PercentPoint,
  stagePoint: Point2D,
  stagePercent: PercentPoint,
): DualSpaceCoordinate {
  return {
    image: createCoordinateBundle(imagePoint, imagePercent),
    stage: createCoordinateBundle(stagePoint, stagePercent),
  };
}

// ============================================================================
// VALIDATION & SANITIZATION FUNCTIONS
// ============================================================================
// These ensure all values are safe, finite, and within expected ranges.
// FOR FUTURE AI AGENTS: Use these to prevent NaN, Infinity, and out-of-range bugs.
// ============================================================================

/**
 * Validate and sanitize a 2D point
 *
 * Ensures both x and y are finite numbers. If not, uses fallback values.
 *
 * @param point - Point to validate
 * @param fallback - Fallback point if validation fails (default: {0, 0})
 * @returns Validated point with finite coordinates
 */
export function validatePoint(point: Point2D, fallback: Point2D = { x: 0, y: 0 }): Point2D {
  const x = Number.isFinite(point.x) ? point.x : fallback.x;
  const y = Number.isFinite(point.y) ? point.y : fallback.y;
  return { x, y };
}

/**
 * Validate and sanitize scale values
 *
 * Ensures scale is positive, finite, and within reasonable range (0.01 to 10)
 *
 * @param scale - Scale to validate
 * @param fallback - Fallback scale if validation fails (default: {1, 1})
 * @returns Validated scale with safe values
 */
export function validateScale(scale: Point2D, fallback: Point2D = { x: 1, y: 1 }): Point2D {
  let x = Number.isFinite(scale.x) && scale.x > 0 ? scale.x : fallback.x;
  let y = Number.isFinite(scale.y) && scale.y > 0 ? scale.y : fallback.y;

  // Clamp to reasonable range (0.01 to 10)
  x = Math.max(0.01, Math.min(10, x));
  y = Math.max(0.01, Math.min(10, y));

  return { x, y };
}

/**
 * Validate dimensions object
 *
 * Ensures width and height are positive finite numbers
 *
 * @param dimensions - Dimensions to validate
 * @param fallback - Fallback dimensions if validation fails (default: {100, 100})
 * @returns Validated dimensions
 */
export function validateDimensions(
  dimensions: { width: number; height: number },
  fallback: { width: number; height: number } = { width: 100, height: 100 },
): { width: number; height: number } {
  const width =
    Number.isFinite(dimensions.width) && dimensions.width > 0 ? dimensions.width : fallback.width;
  const height =
    Number.isFinite(dimensions.height) && dimensions.height > 0
      ? dimensions.height
      : fallback.height;
  return { width, height };
}

// ============================================================================
// CLAMPING & NORMALIZATION UTILITIES
// ============================================================================
// These constrain values to valid ranges and normalize different input formats.
// FOR FUTURE AI AGENTS: Use these for safe value handling.
// ============================================================================

/**
 * Clamp percentage value to 0-100 range
 *
 * @param value - Value to clamp
 * @returns Clamped value (0-100)
 */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * Clamp stage coordinate to valid range
 *
 * @param value - Value to clamp
 * @param stageSize - Stage size (usually 2048)
 * @returns Clamped value (0-stageSize)
 */
export function clampStage(value: number, stageSize: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(stageSize, value));
}

/**
 * Convert percentage to scale factor with clamping
 *
 * Config uses percentage (10-500), this converts to scale (0.1-5.0)
 *
 * @param percent - Percentage value (10-500)
 * @returns Scale factor (0.1-5.0)
 */
export function clampedPercentToScale(percent: number): number {
  const clamped = Math.max(10, Math.min(500, percent));
  return clamped / 100;
}

/**
 * Normalize array input to [x, y] pair
 *
 * Handles undefined, empty arrays, and provides fallback values
 *
 * @param value - Input array
 * @param fallbackX - Fallback for x if missing
 * @param fallbackY - Fallback for y if missing
 * @returns Normalized [x, y] tuple
 */
export function normalizePair(
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

/**
 * Normalize various input formats to PercentPoint
 *
 * Handles array [x, y] or object {x, y} inputs
 *
 * @param value - Input value (array or PercentPoint object)
 * @param fallbackX - Fallback x value
 * @param fallbackY - Fallback y value
 * @returns Normalized PercentPoint
 */
export function normalizePercentInput(
  value: number[] | PercentPoint | undefined,
  fallbackX: number,
  fallbackY: number,
): PercentPoint {
  if (Array.isArray(value) && value.length >= 2) {
    return {
      x: clampPercent(value[0] ?? fallbackX),
      y: clampPercent(value[1] ?? fallbackY),
    };
  }
  if (value && typeof value === "object" && "x" in value && "y" in value) {
    const { x, y } = value as PercentPoint;
    return {
      x: clampPercent(x),
      y: clampPercent(y),
    };
  }
  return {
    x: clampPercent(fallbackX),
    y: clampPercent(fallbackY),
  };
}

/**
 * Normalize array input to stage Point2D
 *
 * @param value - Input array
 * @param fallback - Fallback point if input invalid
 * @param stageSize - Stage size for clamping
 * @returns Normalized Point2D
 */
export function normalizeStagePointInput(
  value: number[] | undefined,
  fallback: Point2D,
  stageSize: number,
): Point2D {
  if (Array.isArray(value) && value.length >= 2) {
    return {
      x: clampStage(value[0] ?? fallback.x, stageSize),
      y: clampStage(value[1] ?? fallback.y, stageSize),
    };
  }
  return fallback;
}

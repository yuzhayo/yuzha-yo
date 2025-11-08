/**
 * ============================================================================
 * LAYER MATH - Pure Calculation Functions
 * ============================================================================
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This is the MATH LIBRARY for the layer system. All coordinate transformations,
 * angle calculations, time/clock calculations, and validation functions live here.
 *
 * CRITICAL ARCHITECTURAL PRINCIPLE:
 * ----------------------------------
 * ALL functions in this file are PURE - no side effects, no state, no dependencies
 * on runtime values. Given the same inputs, they always return the same outputs.
 * This makes them:
 * - Easily testable
 * - Safe to parallelize
 * - Simple to understand and debug
 *
 * WHAT THIS FILE CONTAINS:
 * ------------------------
 * 1. Coordinate Transformations (image ↔ stage, pixel ↔ percent)
 * 2. Pivot-Based Positioning (rotation-aware for extended range support)
 * 3. Angle & Rotation Math (normalization, conversions, orbital calculations)
 * 4. Time & Clock Calculations (timezone parsing, clock speed resolution)
 * 5. Validation & Sanitization (bounds checking, safe value handling)
 * 6. Helper Utilities (distance, easing functions)
 *
 * DEPENDENCY RULES:
 * -----------------
 * - THIS FILE: Imports only types from model.ts (no runtime dependencies)
 * - engine.ts: Imports functions from THIS FILE
 * - Other modules: Import from THIS FILE for any math operations
 *
 * @module layer/math
 */

import type {
  Point2D,
  PercentPoint,
  CoordinateBundle,
  DualSpaceCoordinate,
  ImageMapping,
  RotationDirection,
  ClockSpeedAlias,
  TimeFormat,
  DirectionSign,
  ClockSpeedSetting,
  ClockSpeedValue,
  ClockMotionConfig,
  ResolvedClockSpeed,
} from "./model";

import { CLOCK_DEFAULTS, CLOCK_SPEED_ALIASES } from "./model";

// ============================================================================
// SECTION 1: COORDINATE TRANSFORMATIONS
// ============================================================================
// Convert coordinates between different spaces (image/stage, pixel/percent)
// FOR FUTURE AI AGENTS: Use these for all coordinate conversions.
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
 * FOR FUTURE AI AGENTS: This function SUPPORTS EXTENDED RANGE.
 * Allows coordinates outside 0-100% to support external pivot points.
 *
 * USAGE: When you have relative coordinates and need absolute pixel position
 * - Normal range (0-100%): Points within image bounds
 * - Negative values: Points left/above image
 * - Values >100%: Points right/below image
 *
 * Example: imagePercent {x: 50, y: 118} → Point 18% below bottom edge (minute hand)
 *
 * @param imagePercent - Point in percentage coordinates (can be <0 or >100)
 * @param imageDimensions - Image width and height
 * @returns Point in image pixel coordinates (can be outside image bounds)
 */
export function imagePercentToImagePoint(
  imagePercent: PercentPoint,
  imageDimensions: { width: number; height: number },
): Point2D {
  const validDimensions = validateDimensions(imageDimensions);

  const result = {
    x: (imagePercent.x / 100) * validDimensions.width,
    y: (imagePercent.y / 100) * validDimensions.height,
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
// SECTION 2: PIVOT-BASED POSITIONING
// ============================================================================
// Core positioning algorithm with rotation support for extended range pivots
// FOR FUTURE AI AGENTS: This is THE most important positioning function.
// ============================================================================

/**
 * Get image center from ImageMapping
 *
 * FOR FUTURE AI AGENTS: Image center is always the geometric center (width/2, height/2).
 * This helper avoids recalculating it multiple times.
 *
 * @param mapping - ImageMapping containing dimensions
 * @returns Point2D representing image center in pixels
 */
export function getImageCenter(mapping: ImageMapping): Point2D {
  return {
    x: mapping.imageDimensions.width / 2,
    y: mapping.imageDimensions.height / 2,
  };
}

/**
 * Calculate layer position for pivot-based anchoring WITH ROTATION SUPPORT
 *
 * FOR FUTURE AI AGENTS: This is the ROTATION-AWARE version from layerMotion.ts.
 * Use this instead of the basic version for all pivot calculations.
 *
 * CRITICAL FOR EXTENDED RANGE: This function handles pivot points outside
 * the image bounds (e.g., spinImagePoint: [50, 118] for minute hand).
 *
 * PROBLEM: We want a specific point on an image (e.g., 50%, 118%) to appear at
 * a specific point on the stage (e.g., 1024, 1024), even when image is rotated.
 *
 * SOLUTION: Calculate where the image CENTER should be positioned accounting for:
 * 1. The offset from center to pivot point
 * 2. The scale applied to the image
 * 3. The rotation of the image
 *
 * ALGORITHM:
 * 1. Convert pivot percent to image pixels
 * 2. Calculate offset from image center to pivot point
 * 3. Apply scale to the offset
 * 4. Rotate the scaled offset by the given rotation angle
 * 5. Subtract rotated offset from stage anchor to get final position
 *
 * @param stageAnchor - Where we want the pivot point to appear on stage
 * @param pivotPercent - Which point on image (percent, can be <0 or >100) to anchor
 * @param imageMapping - Image geometry information
 * @param scale - Scale factors
 * @param rotationDeg - Current rotation of image in degrees
 * @returns Position where image center should be placed for rendering
 *
 * @example
 * // Minute hand: Pivot 18% below bottom edge to center of clock
 * const position = calculatePositionForPivot(
 *   { x: 1024, y: 1024 },  // Clock center
 *   { x: 50, y: 118 },     // 118% = 18% below bottom edge
 *   imageMapping,
 *   { x: 1.0, y: 1.28 },
 *   90                     // Rotated 90 degrees
 * );
 */
export function calculatePositionForPivot(
  stageAnchor: Point2D,
  pivotPercent: PercentPoint,
  imageMapping: ImageMapping,
  scale: Point2D,
  rotationDeg: number = 0,
): Point2D {
  const rotationRad = degreesToRadians(rotationDeg);
  const imageCenter = getImageCenter(imageMapping);

  // Convert pivot percent to image pixels (supports extended range)
  const pivotPoint: Point2D = {
    x: (pivotPercent.x / 100) * imageMapping.imageDimensions.width,
    y: (pivotPercent.y / 100) * imageMapping.imageDimensions.height,
  };

  // Calculate offset from center to pivot point and apply scale
  const offsetFromCenter: Point2D = {
    x: (pivotPoint.x - imageCenter.x) * scale.x,
    y: (pivotPoint.y - imageCenter.y) * scale.y,
  };

  // Rotate the scaled offset
  const cosR = Math.cos(rotationRad);
  const sinR = Math.sin(rotationRad);

  const rotatedOffset: Point2D = {
    x: offsetFromCenter.x * cosR - offsetFromCenter.y * sinR,
    y: offsetFromCenter.x * sinR + offsetFromCenter.y * cosR,
  };

  // Calculate final position: stageAnchor - rotatedOffset
  return {
    x: stageAnchor.x - rotatedOffset.x,
    y: stageAnchor.y - rotatedOffset.y,
  };
}

// ============================================================================
// SECTION 3: COORDINATE BUNDLE HELPERS
// ============================================================================
// Create structured coordinate objects with both pixel and percent values
// FOR FUTURE AI AGENTS: Used by engine.ts to build comprehensive layer data.
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
// SECTION 4: ANGLE & ROTATION MATH
// ============================================================================
// Angle conversions, normalization, and orbital calculations
// FOR FUTURE AI AGENTS: All angles in degrees unless specified (radians for Math functions).
// ============================================================================

/**
 * Animation constants for common calculations
 *
 * FOR FUTURE AI AGENTS: Use these instead of Math.PI directly for clarity.
 */
export const AnimationConstants = {
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,
  TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2,
  QUARTER_PI: Math.PI / 4,
} as const;

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * AnimationConstants.DEG_TO_RAD;
}

/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * AnimationConstants.RAD_TO_DEG;
}

/**
 * Normalize angle to 0-360 range
 *
 * FOR FUTURE AI AGENTS: This is the STANDARD normalization function.
 * Use American spelling "normalize" throughout the codebase.
 *
 * Converts any angle to equivalent angle in 0-360 range.
 * Handles negative angles and angles > 360.
 *
 * @param angle - Angle in degrees (can be any value)
 * @returns Normalized angle in 0-360 range
 *
 * @example
 * normalizeAngle(450) // returns 90
 * normalizeAngle(-45) // returns 315
 */
export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Apply rotation direction to angle
 *
 * Converts clockwise/counter-clockwise to positive/negative angle.
 * CW = positive (standard), CCW = negative
 *
 * @param angle - Angle in degrees
 * @param direction - "cw" (clockwise) or "ccw" (counter-clockwise)
 * @returns Signed angle (positive for CW, negative for CCW)
 */
export function applyRotationDirection(angle: number, direction: "cw" | "ccw"): number {
  return direction === "ccw" ? -angle : angle;
}

/**
 * Calculate position on circular orbit
 *
 * Given a center point, radius, and angle, calculates the position
 * on the circle. Used for orbital motion.
 *
 * COORDINATE SYSTEM:
 * - 0° = right (positive X)
 * - 90° = down (positive Y)
 * - 180° = left (negative X)
 * - 270° = up (negative Y)
 *
 * @param center - Center point of orbit
 * @param radius - Orbit radius in pixels
 * @param angleInDegrees - Angle in degrees (0 = right)
 * @returns Position on orbit circle
 *
 * @example
 * calculateOrbitPosition({ x: 1024, y: 1024 }, 200, 90)
 * // returns { x: 1024, y: 1224 } (200 pixels down from center)
 */
export function calculateOrbitPosition(
  center: { x: number; y: number },
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } {
  const angleRad = degreesToRadians(angleInDegrees);
  return {
    x: center.x + radius * Math.cos(angleRad),
    y: center.y + radius * Math.sin(angleRad),
  };
}

/**
 * Calculate angle from center to point
 *
 * Inverse of calculateOrbitPosition. Given a center and a point,
 * calculates the angle from center to point.
 *
 * @param center - Center point
 * @param point - Target point
 * @returns Angle in degrees (0 = right, 90 = down)
 *
 * @example
 * calculateAngleToPoint({ x: 1024, y: 1024 }, { x: 1224, y: 1024 })
 * // returns 0 (point is to the right)
 */
export function calculateAngleToPoint(
  center: { x: number; y: number },
  point: { x: number; y: number },
): number {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return radiansToDegrees(Math.atan2(dy, dx));
}

/**
 * Check if point is within bounds (with optional margin)
 *
 * @param point - Point to check
 * @param bounds - Bounds (min and max for both x and y)
 * @param margin - Optional margin for bounds checking
 * @returns true if point is within bounds
 */
export function isPointInBounds(
  point: { x: number; y: number },
  bounds: { min: number; max: number },
  margin: number = 0,
): boolean {
  return (
    point.x >= bounds.min - margin &&
    point.x <= bounds.max + margin &&
    point.y >= bounds.min - margin &&
    point.y <= bounds.max + margin
  );
}

/**
 * Calculate if orbital layer is visible on stage
 *
 * Checks if layer's bounding box intersects with stage bounds.
 * Used to skip rendering off-screen orbital elements.
 *
 * @param position - Layer center position
 * @param dimensions - Layer dimensions (width, height)
 * @param stageBounds - Stage bounds (min and max)
 * @returns true if layer is visible on stage
 */
export function calculateOrbitalVisibility(
  position: { x: number; y: number },
  dimensions: { width: number; height: number },
  stageBounds: { min: number; max: number },
): boolean {
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;

  return !(
    position.x + halfWidth < stageBounds.min ||
    position.x - halfWidth > stageBounds.max ||
    position.y + halfHeight < stageBounds.min ||
    position.y - halfHeight > stageBounds.max
  );
}

/**
 * Calculate distance between two points
 *
 * FOR FUTURE AI AGENTS: Use this for radius calculations and collision detection.
 *
 * @param a - First point
 * @param b - Second point
 * @returns Distance in pixels
 */
export function distanceBetween(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

// ============================================================================
// SECTION 5: TIME & CLOCK CALCULATIONS
// ============================================================================
// Timezone parsing, clock speed resolution, rotation calculations
// FOR FUTURE AI AGENTS: This handles all time-based rotation logic.
// ============================================================================

// Constants for time calculations
const MILLIS_PER_MINUTE = 60_000;
const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;
const TIMEZONE_REGEX = /^UTC(?:(?<sign>[+-])(?<hours>\d{1,2})(?::?(?<minutes>\d{2}))?)?$/i;

// Check if running in development environment (for warnings)
const metaEnv = (import.meta as any)?.env;
const IS_DEV_ENV = Boolean(metaEnv?.DEV);

/**
 * Convert a rotation direction literal into a numeric sign (1 = CW, -1 = CCW)
 *
 * @param direction - Rotation direction
 * @returns 1 for clockwise, -1 for counter-clockwise
 */
export function toDirectionSign(direction: RotationDirection): DirectionSign {
  return direction === "ccw" ? -1 : 1;
}

/**
 * Parse a timezone string in the form "UTC", "UTC+8", "UTC-05", "UTC+05:30"
 *
 * FOR FUTURE AI AGENTS: This supports offset-based timezones only (UTC±HH[:MM]).
 * Does NOT support named timezones like "America/New_York" or "Asia/Tokyo".
 * To add named timezone support, integrate a timezone library.
 *
 * Returns the offset in minutes east of UTC. Invalid inputs fall back to 0.
 *
 * @param input - Timezone string (e.g., "UTC+7", "UTC-05:30")
 * @returns Offset in minutes east of UTC (negative for west)
 *
 * @example
 * parseTimezoneOffset("UTC+7") // returns 420 (7 hours * 60 minutes)
 * parseTimezoneOffset("UTC-05:30") // returns -330 (5.5 hours west)
 */
export function parseTimezoneOffset(input?: string | null): number {
  if (!input) return 0;

  const match = TIMEZONE_REGEX.exec(input.trim());
  if (!match) {
    if (IS_DEV_ENV) {
      console.warn(`[math] Unsupported timezone format "${input}". Falling back to UTC.`);
    }
    return 0;
  }

  const sign = match.groups?.sign === "-" ? -1 : 1;
  const hours = Number(match.groups?.hours ?? "0");
  const minutes = Number(match.groups?.minutes ?? "0");

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return sign * (hours * 60 + minutes);
}

/**
 * Resolve timezone offset for a motion config, falling back to stage default
 *
 * @param motion - Clock motion configuration
 * @param defaultTimezoneOffset - Default offset if motion has no timezone
 * @returns Resolved timezone offset in minutes
 */
export function resolveTimezoneOffset(
  motion: ClockMotionConfig | undefined,
  defaultTimezoneOffset: number,
): number {
  if (!motion?.timezone) return defaultTimezoneOffset;
  const offset = parseTimezoneOffset(motion.timezone);
  return Number.isFinite(offset) ? offset : defaultTimezoneOffset;
}

/**
 * Determine whether the speed setting references a real-time alias
 *
 * @param speed - Speed setting
 * @returns true if speed is a clock alias ("second", "minute", "hour")
 */
function isAliasSpeed(speed?: ClockSpeedSetting): speed is ClockSpeedAlias {
  return typeof speed === "string" && CLOCK_SPEED_ALIASES.includes(speed as ClockSpeedAlias);
}

/**
 * Extract numeric value from the speed setting when it is not an alias
 *
 * @param speed - Speed setting
 * @returns Numeric speed value or undefined
 */
function resolveNumericValue(speed?: ClockSpeedSetting): number | undefined {
  if (typeof speed === "number") return speed;
  if (typeof speed === "object" && speed !== null && "value" in speed) {
    const value = (speed as ClockSpeedValue).value;
    return Number.isFinite(value) ? value : undefined;
  }
  return undefined;
}

/**
 * Resolve direction preference from config with fallbacks
 *
 * @param speed - Speed setting (may contain direction override)
 * @param motion - Motion config (may contain direction)
 * @returns Resolved rotation direction
 */
function resolveDirection(
  speed: ClockSpeedSetting | undefined,
  motion: ClockMotionConfig | undefined,
): RotationDirection {
  if (typeof speed === "object" && speed !== null && "direction" in speed && speed.direction) {
    return speed.direction;
  }
  if (motion?.direction) return motion.direction;
  return CLOCK_DEFAULTS.direction;
}

/**
 * Resolve time format preference with fallback to defaults
 *
 * @param motion - Motion config
 * @returns Resolved time format ("12" or "24")
 */
function resolveFormat(motion?: ClockMotionConfig): TimeFormat {
  const format = motion?.format;
  return format === "12" || format === "24" ? format : CLOCK_DEFAULTS.timeFormat;
}

/**
 * Resolve motion configuration into runtime structure
 *
 * FOR FUTURE AI AGENTS: This is the CORE clock resolution function.
 * It takes raw config and returns a discriminated union you can switch on.
 *
 * RETURN TYPES (use .kind to discriminate):
 * - kind: "static" - No motion (speed = 0 or undefined)
 * - kind: "alias" - Clock-based motion ("second", "minute", "hour")
 * - kind: "numeric" - Custom rotation speed (rotations per hour)
 *
 * @param motion - Clock motion configuration from config
 * @param defaultTimezoneOffset - Default timezone offset in minutes
 * @param fallbackNumericSpeed - Fallback speed if no speed specified (default: 1)
 * @returns Resolved clock speed (discriminated union)
 *
 * @example
 * const resolved = resolveClockSpeed({ speed: "hour", timezone: "UTC+7" }, 0);
 * if (resolved.kind === "alias") {
 *   // resolved.alias === "hour"
 *   // resolved.timezoneOffsetMinutes === 420
 * }
 */
export function resolveClockSpeed(
  motion: ClockMotionConfig | undefined,
  defaultTimezoneOffset: number,
  fallbackNumericSpeed: number = CLOCK_DEFAULTS.numericSpeed,
): ResolvedClockSpeed {
  const format = resolveFormat(motion);
  const timezoneOffset = resolveTimezoneOffset(motion, defaultTimezoneOffset);
  const speed = motion?.speed;

  // Alias speeds (second, minute, hour) - always follow real time
  if (isAliasSpeed(speed)) {
    return {
      kind: "alias",
      alias: speed,
      format,
      timezoneOffsetMinutes: timezoneOffset,
    };
  }

  // Numeric speeds (rotations per hour)
  const numericValue = resolveNumericValue(speed);
  const value = numericValue !== undefined ? numericValue : fallbackNumericSpeed;

  // Warn about negative speeds in development
  if (numericValue !== undefined && numericValue < 0 && IS_DEV_ENV) {
    console.warn(
      `[math] Negative speed "${numericValue}" detected. Using absolute value for rotations per hour.`,
    );
  }

  // Static (no rotation)
  if (!Number.isFinite(value) || value === 0) {
    return {
      kind: "static",
      format,
      timezoneOffsetMinutes: timezoneOffset,
    };
  }

  // Numeric rotation
  const direction = resolveDirection(speed, motion);
  return {
    kind: "numeric",
    rotationsPerHour: Math.abs(value),
    directionSign: toDirectionSign(direction),
    format,
    timezoneOffsetMinutes: timezoneOffset,
  };
}

/**
 * Get a cached Date instance shifted by timezone offset
 *
 * FOR FUTURE AI AGENTS: This avoids allocating new Date objects every frame.
 * The cache map is mutated in-place for performance.
 *
 * @param baseDate - Base date (usually current time)
 * @param offsetMinutes - Timezone offset in minutes
 * @param cache - Cache map for Date instances
 * @returns Date instance adjusted for timezone
 */
function getZonedDate(baseDate: Date, offsetMinutes: number, cache: Map<number, Date>): Date {
  let cached = cache.get(offsetMinutes);
  const targetTime = baseDate.getTime() + offsetMinutes * MILLIS_PER_MINUTE;

  if (!cached) {
    cached = new Date(targetTime);
    cache.set(offsetMinutes, cached);
  } else {
    cached.setTime(targetTime);
  }

  return cached;
}

/**
 * Calculate rotation degrees for alias speeds using clock semantics
 *
 * FOR FUTURE AI AGENTS: This implements real-time clock behavior.
 * - "second": Completes 1 rotation per minute (60/hour)
 * - "minute": Completes 1 rotation per hour
 * - "hour": Completes 1/12 rotation per hour (12-hour) or 1/24 (24-hour)
 *
 * @param alias - Clock alias ("second", "minute", "hour")
 * @param format - Time format ("12" or "24")
 * @param date - Current date/time (already timezone-adjusted)
 * @returns Rotation angle in degrees (0-360)
 */
function calculateAliasAngleDegrees(
  alias: ClockSpeedAlias,
  format: TimeFormat,
  date: Date,
): number {
  const seconds = date.getUTCSeconds() + date.getUTCMilliseconds() / 1000;
  const minutes = date.getUTCMinutes() + seconds / 60;
  const hours24 = date.getUTCHours() + minutes / 60;

  switch (alias) {
    case "second": {
      const fraction = seconds / 60;
      return (fraction % 1) * 360;
    }
    case "minute": {
      const fraction = minutes / 60;
      return (fraction % 1) * 360;
    }
    case "hour": {
      if (format === "24") {
        // 24-hour format: 0-24 hours maps to full circle
        const hours = hours24 % 24;
        // Offset by 12 hours so 12:00 is at top (270°)
        const adjusted = ((hours - 12 + 24) % 24) / 24;
        return (adjusted % 1) * 360;
      }
      // 12-hour format: 0-12 hours maps to full circle
      const hours = hours24 % 12;
      const fraction = hours / 12;
      return (fraction % 1) * 360;
    }
    default:
      return 0;
  }
}

/**
 * Calculate rotation degrees for numeric speeds (rotations per hour)
 *
 * FOR FUTURE AI AGENTS: This implements custom rotation speeds.
 * Speed is in rotations per hour: 1.0 = complete one rotation in one hour.
 *
 * @param rotationsPerHour - Rotation speed (rotations per hour)
 * @param directionSign - Direction sign (1 for CW, -1 for CCW)
 * @param elapsedMs - Elapsed time since start in milliseconds
 * @returns Rotation angle in degrees (0-360)
 */
function calculateNumericAngleDegrees(
  rotationsPerHour: number,
  directionSign: DirectionSign,
  elapsedMs: number,
): number {
  if (rotationsPerHour === 0) return 0;

  const elapsedHours = elapsedMs / MILLIS_PER_HOUR;
  const rotations = (elapsedHours * rotationsPerHour) % 1;
  const degrees = rotations * 360 * directionSign;

  // Normalize to 0-360 range
  return normalizeAngle(degrees);
}

/**
 * Compute rotation angle in degrees for a resolved speed
 *
 * FOR FUTURE AI AGENTS: This is the MAIN rotation calculation function.
 * Use this in motion processors to get current rotation angle.
 *
 * BEHAVIOR BY TYPE:
 * - "static": Returns 0 (no rotation)
 * - "alias": Uses current time to calculate clock-based angle
 * - "numeric": Uses elapsed time to calculate custom rotation
 *
 * @param resolved - Resolved speed from resolveClockSpeed()
 * @param baseDate - Current timestamp (usually new Date())
 * @param cache - Cache map for Date instances (performance optimization)
 * @param startTimestampMs - Start time for numeric rotations (optional)
 * @returns Rotation angle in degrees (0-360)
 *
 * @example
 * const resolved = resolveClockSpeed({ speed: "hour", timezone: "UTC+7" }, 0);
 * const cache = new Map<number, Date>();
 * const angle = calculateRotationDegrees(resolved, new Date(), cache);
 * // Returns current hour hand angle for UTC+7 timezone
 */
export function calculateRotationDegrees(
  resolved: ResolvedClockSpeed,
  baseDate: Date,
  cache: Map<number, Date>,
  startTimestampMs?: number,
): number {
  if (resolved.kind === "static") {
    return 0;
  }

  if (resolved.kind === "numeric") {
    const elapsedMs =
      startTimestampMs !== undefined ? Math.max(0, baseDate.getTime() - startTimestampMs) : 0;
    return calculateNumericAngleDegrees(
      resolved.rotationsPerHour,
      resolved.directionSign,
      elapsedMs,
    );
  }

  // Alias - use timezone-adjusted date
  const date = getZonedDate(baseDate, resolved.timezoneOffsetMinutes, cache);
  return calculateAliasAngleDegrees(resolved.alias, resolved.format, date);
}

// ============================================================================
// SECTION 6: VALIDATION & SANITIZATION
// ============================================================================
// Ensure all values are safe, finite, and within expected ranges
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

/**
 * Clamp percentage value to 0-100 range
 *
 * FOR FUTURE AI AGENTS: This function is DEPRECATED for coordinate inputs.
 * Use normalizePercent() instead for image point coordinates to support
 * extended ranges (negative values and >100%).
 * Keep this only for scale/size validation where clamping is needed.
 *
 * @param value - Value to clamp
 * @returns Clamped value (0-100)
 */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * Normalize percentage value (supports extended range for external points)
 *
 * FOR FUTURE AI AGENTS: Use this instead of clampPercent() for coordinate inputs.
 * This function allows coordinates OUTSIDE the 0-100% range, enabling:
 * - Negative values: Points left/above the image
 * - Values >100: Points right/below the image
 *
 * Example from ConfigYuzha.json: spinImagePoint: [50, 118] (minute hand)
 * This places the pivot point 18% BELOW the bottom edge of the image.
 *
 * CHANGE FROM clampPercent: Removes 0-100 clamping to support coordinates
 * outside image bounds. Only validates for NaN/Infinity.
 *
 * @param value - Percentage value (can be negative or >100)
 * @returns Normalized value (NaN/Infinity converted to 0)
 */
export function normalizePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
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
 * Normalize percentage input to PercentPoint
 *
 * FOR FUTURE AI AGENTS: Updated to use normalizePercent() to support
 * extended coordinate range (negative values and >100%).
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
      x: normalizePercent(value[0] ?? fallbackX),
      y: normalizePercent(value[1] ?? fallbackY),
    };
  }
  if (value && typeof value === "object" && "x" in value && "y" in value) {
    const { x, y } = value as PercentPoint;
    return {
      x: normalizePercent(x),
      y: normalizePercent(y),
    };
  }
  return {
    x: normalizePercent(fallbackX),
    y: normalizePercent(fallbackY),
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

// ============================================================================
// SECTION 7: EASING FUNCTIONS
// ============================================================================
// Smooth animation curves for transitions and effects
// FOR FUTURE AI AGENTS: Use these for non-linear animations.
// ============================================================================

/**
 * Ease-in-out quadratic easing function
 *
 * Smooth acceleration and deceleration.
 * @param t - Progress (0 to 1)
 * @returns Eased value (0 to 1)
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Elastic easing out function
 *
 * Creates a bouncy/elastic effect at the end.
 * @param t - Progress (0 to 1)
 * @returns Eased value (0 to 1)
 */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Bounce easing out function
 *
 * Creates a bouncing effect at the end.
 * @param t - Progress (0 to 1)
 * @returns Eased value (0 to 1)
 */
export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  }
  if (t < 2 / d1) {
    const p = t - 1.5 / d1;
    return n1 * p * p + 0.75;
  }
  if (t < 2.5 / d1) {
    const p = t - 2.25 / d1;
    return n1 * p * p + 0.9375;
  }
  const p = t - 2.625 / d1;
  return n1 * p * p + 0.984375;
}

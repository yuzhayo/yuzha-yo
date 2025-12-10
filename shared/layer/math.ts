/** LAYER MATH - Pure Calculation Functions. */

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

// Convert coordinates between different spaces (image/stage, pixel/percent)

/** Transform a point from image space to stage space. */
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

/** Transform a point from stage space to image space. */
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

/** Convert image point (pixels) to percentage coordinates. */
export function imagePointToPercent(
  imagePoint: Point2D,
  imageDimensions: { width: number; height: number },
): PercentPoint {
  const invWidth = 100 / imageDimensions.width;
  const invHeight = 100 / imageDimensions.height;
  return {
    x: imagePoint.x * invWidth,
    y: imagePoint.y * invHeight,
  };
}

/** Convert percentage coordinates to image point (pixels). */
export function imagePercentToImagePoint(
  imagePercent: PercentPoint,
  imageDimensions: { width: number; height: number },
): Point2D {
  const validDimensions = validateDimensions(imageDimensions);
  const widthFactor = validDimensions.width / 100;
  const heightFactor = validDimensions.height / 100;

  const result = {
    x: imagePercent.x * widthFactor,
    y: imagePercent.y * heightFactor,
  };

  return validatePoint(result);
}

/** Convert stage point to percentage coordinates. */
export function stagePointToPercent(stagePoint: Point2D, stageSize: number): PercentPoint {
  const invStage = 100 / stageSize;
  return {
    x: stagePoint.x * invStage,
    y: stagePoint.y * invStage,
  };
}

/** Convert percentage coordinates to stage point. */
export function stagePercentToStagePoint(stagePercent: PercentPoint, stageSize: number): Point2D {
  const stageFactor = stageSize / 100;
  return {
    x: stagePercent.x * stageFactor,
    y: stagePercent.y * stageFactor,
  };
}

// Core positioning algorithm with rotation support for extended range pivots

/** Get image center from ImageMapping. */
export function getImageCenter(mapping: ImageMapping): Point2D {
  return {
    x: mapping.imageDimensions.width / 2,
    y: mapping.imageDimensions.height / 2,
  };
}

/** Calculate layer position for pivot-based anchoring WITH ROTATION SUPPORT. */
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

// Create structured coordinate objects with both pixel and percent values

/** Create a coordinate bundle (point + percent representation). */
export function createCoordinateBundle(point: Point2D, percent: PercentPoint): CoordinateBundle {
  return { point, percent };
}

/** Create a dual-space coordinate (image + stage representations). */
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

// Angle conversions, normalization, and orbital calculations

/** Animation constants for common calculations. */
export const AnimationConstants = {
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,
  TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2,
  QUARTER_PI: Math.PI / 4,
} as const;

/** Convert degrees to radians. */
export function degreesToRadians(degrees: number): number {
  return degrees * AnimationConstants.DEG_TO_RAD;
}

/** Convert radians to degrees. */
export function radiansToDegrees(radians: number): number {
  return radians * AnimationConstants.RAD_TO_DEG;
}

/** Normalize angle to 0-360 range. */
export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/** Apply rotation direction to angle. */
export function applyRotationDirection(angle: number, direction: "cw" | "ccw"): number {
  return direction === "ccw" ? -angle : angle;
}

/** Calculate position on circular orbit. */
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

/** Calculate angle from center to point. */
export function calculateAngleToPoint(
  center: { x: number; y: number },
  point: { x: number; y: number },
): number {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return radiansToDegrees(Math.atan2(dy, dx));
}

/** Check if point is within bounds (with optional margin). */
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

/** Calculate if orbital layer is visible on stage. */
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

/** Calculate distance between two points. */
export function distanceBetween(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

// Timezone parsing, clock speed resolution, rotation calculations

// Constants for time calculations
const MILLIS_PER_MINUTE = 60_000;
const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;
const TIMEZONE_REGEX = /^UTC(?:(?<sign>[+-])(?<hours>\d{1,2})(?::?(?<minutes>\d{2}))?)?$/i;

// Check if running in development environment (for warnings)
const metaEnv = (import.meta as any)?.env;
const IS_DEV_ENV = Boolean(metaEnv?.DEV);

/** Convert a rotation direction literal into a numeric sign (1 = CW, -1 = CCW). */
export function toDirectionSign(direction: RotationDirection): DirectionSign {
  return direction === "ccw" ? -1 : 1;
}

/** Parse a timezone string in the form "UTC", "UTC+8", "UTC-05", "UTC+05:30". */
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

/** Resolve timezone offset for a motion config, falling back to stage default. */
export function resolveTimezoneOffset(
  motion: ClockMotionConfig | undefined,
  defaultTimezoneOffset: number,
): number {
  if (!motion?.timezone) return defaultTimezoneOffset;
  const offset = parseTimezoneOffset(motion.timezone);
  return Number.isFinite(offset) ? offset : defaultTimezoneOffset;
}

/** Determine whether the speed setting references a real-time alias. */
function isAliasSpeed(speed?: ClockSpeedSetting): speed is ClockSpeedAlias {
  return typeof speed === "string" && CLOCK_SPEED_ALIASES.includes(speed as ClockSpeedAlias);
}

/** Extract numeric value from the speed setting when it is not an alias. */
function resolveNumericValue(speed?: ClockSpeedSetting): number | undefined {
  if (typeof speed === "number") return speed;
  if (typeof speed === "object" && speed !== null && "value" in speed) {
    const value = (speed as ClockSpeedValue).value;
    return Number.isFinite(value) ? value : undefined;
  }
  return undefined;
}

/** Resolve direction preference from config with fallbacks. */
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

/** Resolve time format preference with fallback to defaults. */
function resolveFormat(motion?: ClockMotionConfig): TimeFormat {
  const format = motion?.format;
  return format === "12" || format === "24" ? format : CLOCK_DEFAULTS.timeFormat;
}

/** Resolve motion configuration into runtime structure. */
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

/** Get a cached Date instance shifted by timezone offset. */
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

/** Calculate rotation degrees for alias speeds using clock semantics. */
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

/** Calculate rotation degrees for numeric speeds (rotations per hour). */
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

/** Compute rotation angle in degrees for a resolved speed. */
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

// Ensure all values are safe, finite, and within expected ranges

/** Validate and sanitize a 2D point. */
export function validatePoint(point: Point2D, fallback: Point2D = { x: 0, y: 0 }): Point2D {
  const x = Number.isFinite(point.x) ? point.x : fallback.x;
  const y = Number.isFinite(point.y) ? point.y : fallback.y;
  return { x, y };
}

/** Validate and sanitize scale values. */
export function validateScale(scale: Point2D, fallback: Point2D = { x: 1, y: 1 }): Point2D {
  let x = Number.isFinite(scale.x) && scale.x > 0 ? scale.x : fallback.x;
  let y = Number.isFinite(scale.y) && scale.y > 0 ? scale.y : fallback.y;

  // Clamp to reasonable range (0.01 to 10)
  x = Math.max(0.01, Math.min(10, x));
  y = Math.max(0.01, Math.min(10, y));

  return { x, y };
}

/** Validate dimensions object. */
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

/** Clamp percentage value to 0-100 range. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/** Normalize percentage value (supports extended range for external points). */
export function normalizePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

/** Clamp stage coordinate to valid range. */
export function clampStage(value: number, stageSize: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(stageSize, value));
}

/** Convert percentage to scale factor with clamping. */
export function clampedPercentToScale(percent: number): number {
  const clamped = Math.max(10, Math.min(500, percent));
  return clamped / 100;
}

/** Normalize array input to [x, y] pair. */
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

/** Normalize percentage input to PercentPoint. */
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

/** Normalize array input to stage Point2D. */
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

// Smooth animation curves for transitions and effects

/** Ease-in-out quadratic easing function. */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Elastic easing out function. */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/** Bounce easing out function. */
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

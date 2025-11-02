/**
 * ============================================================================
 * CLOCK TIME UTILITIES - Timezone & Speed Resolution Helpers
 * ============================================================================
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * The clock stage needs to map configuration values (like `"minute"` speed or
 * `"UTC+8"` timezone strings) into precise angular positions for every frame.
 * This file centralises that logic so the rest of the system can stay focused
 * on geometry and rendering.
 *
 * KEY CAPABILITIES:
 * -----------------
 * - Parses timezone strings (UTC±HH[:MM]) into minute offsets.
 * - Resolves motion blocks into discriminated union objects so downstream code
 *   can switch on `kind` instead of juggling loosely-typed inputs.
 * - Computes rotation angles in degrees given the resolved speed and a base
 *   timestamp.
 *
 * EXTENSION NOTE:
 * ---------------
 * If you need new aliases (e.g., `"day"`) or support for region names
 * (`"Asia/Tokyo"`), extend this module and keep the rest of the code untouched.
 *
 * @module shared/layer/clockTime
 */

export type RotationDirection = "cw" | "ccw";
export type ClockSpeedAlias = "second" | "minute" | "hour";
export type TimeFormat = "12" | "24";
export type DirectionSign = 1 | -1;

export type ClockSpeedValue = {
  value: number;
  direction?: RotationDirection;
};

export type ClockSpeedSetting = ClockSpeedAlias | ClockSpeedValue | number;

export type ClockMotionConfig = {
  speed?: ClockSpeedSetting;
  direction?: RotationDirection;
  format?: TimeFormat;
  timezone?: string;
};

export type ResolvedClockSpeed =
  | {
      kind: "static";
      timezoneOffsetMinutes: number;
      format: TimeFormat;
    }
  | {
      kind: "alias";
      alias: ClockSpeedAlias;
      timezoneOffsetMinutes: number;
      format: TimeFormat;
    }
  | {
      kind: "numeric";
      rotationsPerHour: number;
      directionSign: DirectionSign;
      timezoneOffsetMinutes: number;
      format: TimeFormat;
    };

export const CLOCK_DEFAULTS = {
  timeFormat: "24" as TimeFormat,
  direction: "cw" as RotationDirection,
  numericSpeed: 1,
};

export const CLOCK_SPEED_ALIASES: ClockSpeedAlias[] = ["second", "minute", "hour"];

const MILLIS_PER_MINUTE = 60_000;
const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;

const TIMEZONE_REGEX = /^UTC(?:(?<sign>[+-])(?<hours>\d{1,2})(?::?(?<minutes>\d{2}))?)?$/i;
const metaEnv = (import.meta as any)?.env;
const IS_DEV_ENV = Boolean(metaEnv?.DEV);

/**
 * Convert a rotation direction literal into a numeric sign (1 = CW, -1 = CCW).
 */
export function toDirectionSign(direction: RotationDirection): DirectionSign {
  return direction === "ccw" ? -1 : 1;
}

/**
 * Parse a timezone string in the form "UTC", "UTC+8", "UTC-05", "UTC+05:30".
 *
 * Returns the offset in minutes east of UTC. Invalid inputs fall back to 0.
 */
export function parseTimezoneOffset(input?: string | null): number {
  if (!input) return 0;
  const match = TIMEZONE_REGEX.exec(input.trim());
  if (!match) {
    if (IS_DEV_ENV) {
      console.warn(`[clockTime] Unsupported timezone format "${input}". Falling back to UTC.`);
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
 * Resolve timezone offset for a motion config, falling back to stage default.
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
 * Determine whether the speed setting references a real-time alias.
 */
function isAliasSpeed(speed?: ClockSpeedSetting): speed is ClockSpeedAlias {
  return typeof speed === "string" && CLOCK_SPEED_ALIASES.includes(speed as ClockSpeedAlias);
}

/**
 * Extract numeric value from the speed setting when it is not an alias.
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
 * Resolve direction preference from config with fallbacks.
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
 * Resolve time format preference with fallback to defaults.
 */
function resolveFormat(motion?: ClockMotionConfig): TimeFormat {
  const format = motion?.format;
  return format === "12" || format === "24" ? format : CLOCK_DEFAULTS.timeFormat;
}

/**
 * Resolve motion configuration into runtime structure.
 */
export function resolveClockSpeed(
  motion: ClockMotionConfig | undefined,
  defaultTimezoneOffset: number,
  fallbackNumericSpeed: number = CLOCK_DEFAULTS.numericSpeed,
): ResolvedClockSpeed {
  const format = resolveFormat(motion);
  const timezoneOffset = resolveTimezoneOffset(motion, defaultTimezoneOffset);
  const speed = motion?.speed;

  if (isAliasSpeed(speed)) {
    // Alias speeds always follow real time and spin clockwise.
    return {
      kind: "alias",
      alias: speed,
      format,
      timezoneOffsetMinutes: timezoneOffset,
    };
  }

  const numericValue = resolveNumericValue(speed);
  const value = numericValue !== undefined ? numericValue : fallbackNumericSpeed;

  if (numericValue !== undefined && numericValue < 0 && IS_DEV_ENV) {
    console.warn(
      `[clockTime] Negative speed "${numericValue}" detected. Using absolute value for rotations per hour.`,
    );
  }

  if (!Number.isFinite(value) || value === 0) {
    return {
      kind: "static",
      format,
      timezoneOffsetMinutes: timezoneOffset,
    };
  }

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
 * Get a cached Date instance shifted by timezone offset.
 *
 * NOTE: The cache map is mutated in-place to avoid allocations per frame.
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
 * Calculate rotation degrees for alias speeds using clock semantics.
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
        const hours = hours24 % 24;
        const adjusted = ((hours - 12 + 24) % 24) / 24;
        return (adjusted % 1) * 360;
      }
      const hours = hours24 % 12;
      const fraction = hours / 12;
      return (fraction % 1) * 360;
    }
    default:
      return 0;
  }
}

/**
 * Calculate rotation degrees for numeric speeds (rotations per hour).
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
  // Normalise to 0-360 range
  const normalised = ((degrees % 360) + 360) % 360;
  return normalised;
}

/**
 * Compute rotation angle in degrees for a resolved speed.
 *
 * @param resolved - Resolved speed descriptor
 * @param baseDate - Base timestamp (usually new Date())
 * @param cache - Map used to re-use Date instances per timezone offset
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

  const date = getZonedDate(baseDate, resolved.timezoneOffsetMinutes, cache);

  return calculateAliasAngleDegrees(resolved.alias, resolved.format, date);
}

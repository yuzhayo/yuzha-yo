/**
 * ============================================================================
 * CLOCK TYPES - Shared Runtime Types for Clock Stage Rendering
 * ============================================================================
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This module defines the type system used by the clock stage pipeline. All
 * other clock modules (`clockTime`, `clockGeometry`, `ClockProcessor`, etc.)
 * depend on these aliases to communicate about configuration, resolved assets,
 * and per-frame render states.
 *
 * KEEP IN MIND:
 * -------------
 * - The virtual stage is a fixed 2048x2048 square.
 * - Coordinates in config are expressed in absolute stage pixels (0-2048).
 * - Image pivots are expressed in percentages relative to the source image.
 *   We intentionally allow values outside 0-100 to support overshoot anchors.
 *
 * EXTENSION GUIDELINES:
 * ---------------------
 * - Add new fields to `ClockElementConfig` only when the config schema grows.
 * - Prefer augmenting `ClockElementRuntime` for derived data instead of
 *   recalculating expensive values every frame.
 * - Use the discriminated unions (`ResolvedClockSpeed`, etc.) to avoid
 *   spreading conditional logic across the codebase.
 *
 * @module shared/clock/clockTypes
 */

export const CLOCK_STAGE_SIZE = 2048;

/**
 * Stage-space coordinate in the 2048x2048 virtual stage.
 */
export type StagePoint = {
  x: number;
  y: number;
};

/**
 * Alias for orbit path definition coordinate.
 * The vector stageLine - stagePoint defines the orbit radius and base angle.
 */
export type StageLine = StagePoint;

/**
 * Image pivot expressed as percentage coordinates.
 * Values can be outside the 0-100 range to allow anchors beyond image bounds.
 */
export type SpinImagePointPercent = {
  xPercent: number;
  yPercent: number;
};

/**
 * Independent X/Y scaling as percentages.
 */
export type SizePercent = {
  x: number;
  y: number;
};

/**
 * Supported clock formats.
 * "12" = full rotation corresponds to 12 hours, "24" = 24 hours.
 */
export type TimeFormat = "12" | "24";

/**
 * Rotation direction literals.
 */
export type RotationDirection = "cw" | "ccw";

/**
 * Spin/orbit alias keywords that map to real-time clock behaviour.
 */
export type ClockSpeedAlias = "second" | "minute" | "hour";

/**
 * Numeric speed envelope used in config when a custom value is required.
 * Value is in rotations per hour (same unit used across the stage system).
 */
export type ClockSpeedValue = {
  value: number;
  direction?: RotationDirection;
};

/**
 * Union covering all supported speed inputs.
 */
export type ClockSpeedSetting = ClockSpeedAlias | ClockSpeedValue | number;

/**
 * Shared spin/orbit configuration block used by the JSON config.
 */
export type ClockMotionConfig = {
  speed?: ClockSpeedSetting;
  direction?: RotationDirection;
  format?: TimeFormat;
  timezone?: string;
};

/**
 * Element definition in ClockStageConfig.json.
 */
export type ClockElementConfig = {
  id: string;
  imageId: string;
  layer: number;
  stagePoint: StagePoint;
  stageLine: StageLine;
  spinImagePoint: SpinImagePointPercent;
  sizePercent: SizePercent;
  spin: ClockMotionConfig;
  orbit: ClockMotionConfig;
};

/**
 * Top-level clock stage configuration.
 */
export type ClockStageConfig = {
  stageSize: number;
  defaultTimezone: string;
  elements: ClockElementConfig[];
};

/**
 * Image asset metadata resolved at runtime.
 */
export type ClockImageAsset = {
  id: string;
  src: string;
  width: number;
  height: number;
};

/**
 * Helper describing the orbit geometry derived from stagePoint/stageLine.
 */
export type OrbitGeometry = {
  radius: number;
  baseAngleDegrees: number;
};

/**
 * Runtime interpretation of a clock speed.
 */
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
      directionSign: 1 | -1;
      timezoneOffsetMinutes: number;
      format: TimeFormat;
    };

/**
 * Derived, runtime-ready element information.
 */
export type ClockElementRuntime = {
  id: string;
  layer: number;
  image: ClockImageAsset;
  stagePoint: StagePoint;
  orbit: {
    linePoint: StageLine;
    geometry: OrbitGeometry;
    speed: ResolvedClockSpeed;
  };
  spin: {
    pivotPercent: SpinImagePointPercent;
    speed: ResolvedClockSpeed;
  };
  sizePercent: SizePercent;
};

/**
 * Runtime container for the entire stage.
 */
export type ClockStageRuntime = {
  stageSize: number;
  defaultTimezoneOffsetMinutes: number;
  startTimestampMs: number;
  elements: ClockElementRuntime[];
};

/**
 * Final per-frame render instruction for a single element.
 */
export type ClockRenderElementState = {
  id: string;
  orderIndex: number;
  imageSrc: string;
  width: number;
  height: number;
  layer: number;
  transform: {
    translateX: number;
    translateY: number;
    rotationDegrees: number;
    pivotPercentX: number;
    pivotPercentY: number;
  };
  orbit: {
    pivotStageX: number;
    pivotStageY: number;
    radius: number;
    angleDegrees: number;
  };
};

/**
 * Frame render output (already sorted by layer).
 */
export type ClockRenderFrame = {
  stageSize: number;
  elements: ClockRenderElementState[];
};

/**
 * Lightweight error descriptor for config validation.
 */
export type ClockConfigError = {
  elementId: string;
  message: string;
};

/**
 * Helper describing the resolved direction of travel.
 */
export type DirectionSign = 1 | -1;

/**
 * Default motion settings used when config leaves fields empty.
 */
export const CLOCK_DEFAULTS = {
  timeFormat: "24" as TimeFormat,
  direction: "cw" as RotationDirection,
  numericSpeed: 1, // 1 rotation per hour
};

/**
 * Alias mapping for convenience when checking if a speed input is alias-based.
 */
export const CLOCK_SPEED_ALIASES: ClockSpeedAlias[] = ["second", "minute", "hour"];

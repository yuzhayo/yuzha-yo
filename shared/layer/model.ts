/** LAYER MODEL - Single Source of Truth for Types & Configuration. */

import rawConfig from "./ConfigYuzha.json";

// Basic geometric types used throughout the layer system.

/** 2D point in pixel space. */
export type Point2D = { x: number; y: number };

/** 2D point in percentage space (0-100% in both dimensions). */
export type PercentPoint = { x: number; y: number };

/** A point represented in both pixel and percentage coordinates. */
export type CoordinateBundle = {
  point: Point2D;
  percent: PercentPoint;
};

/** A point represented in both image space and stage space. */
export type DualSpaceCoordinate = {
  image: CoordinateBundle;
  stage: CoordinateBundle;
};

/** Extended coordinate for orbital calculations. */
export type OrbitCoordinate = DualSpaceCoordinate & {
  stageAnchor: CoordinateBundle;
};

/** 2D transformation (position + scale). */
export type Layer2DTransform = {
  position: Point2D;
  scale: Point2D;
};

// Types for clock-based animations and time calculations.

/** Rotation direction. */
export type RotationDirection = "cw" | "ccw";

/** Clock speed aliases for common time units. */
export type ClockSpeedAlias = "second" | "minute" | "hour";

/** Time format for clock calculations. */
export type TimeFormat = "12" | "24";

/** Direction sign for calculations. */
export type DirectionSign = 1 | -1;

/** Clock speed value object. */
export type ClockSpeedValue = {
  value: number;
  direction?: RotationDirection;
};

/** Union type for all clock speed specifications. */
export type ClockSpeedSetting = ClockSpeedAlias | ClockSpeedValue | number;

/** Clock motion configuration. */
export type ClockMotionConfig = {
  speed?: ClockSpeedSetting;
  direction?: RotationDirection;
  format?: TimeFormat;
  timezone?: string;
};

/** Resolved clock speed (discriminated union). */
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

/** Clock defaults. */
export const CLOCK_DEFAULTS = {
  timeFormat: "24" as TimeFormat,
  direction: "cw" as RotationDirection,
  numericSpeed: 1,
};

/** Available clock speed aliases. */
export const CLOCK_SPEED_ALIASES: ClockSpeedAlias[] = ["second", "minute", "hour"];

// Configuration structure loaded from ConfigYuzha.json

/** Layer Renderer Type. */
export type LayerRenderer = "2D" | "3D";

/** LayerConfigEntry - Complete layer configuration. */
export type LayerConfigEntry = {
  // ===== CORE PROPERTIES (Required) =====
  LayerID: string;
  ImageID: string;
  renderer: LayerRenderer;
  LayerOrder: number;
  /** Optional blend mode for rendering (Three.js renderer). Defaults to "normal". */
  BlendMode?: "additive" | "normal";
  /** Optional per-layer opacity (0-1). */
  Opacity?: number;
  /** Optional pulse period in seconds; 0 or undefined disables pulse. */
  PulseSeconds?: number;
  /** Optional pulse amplitude (0-1) applied to opacity; defaults to 0.15 if PulseSeconds > 0. */
  PulseAmplitude?: number;
  ImageScale?: number[];

  // ===== BASIC CONFIG (Static Positioning) =====
  /** @deprecated Use BasicStagePoint and BasicImagePoint instead. */
  position?: number[];
  BasicStagePoint?: number[];
  BasicImagePoint?: number[];
  BasicImageAngle?: number;

  // ===== SPIN CONFIG (Rotation Animation) =====
  spinStagePoint?: number[];
  spinImagePoint?: number[];
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";
  spinSpeedAlias?: "second" | "minute" | "hour";
  spinFormat?: "12" | "24";
  spinTimezone?: string;

  // ===== ORBITAL CONFIG (Orbital Motion) =====
  orbitStagePoint?: number[];
  orbitLinePoint?: number[];
  orbitImagePoint?: number[];
  orbitLine?: boolean;
  orbitOrient?: boolean;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
  orbitSpeedAlias?: "second" | "minute" | "hour";
  orbitFormat?: "12" | "24";
  orbitTimezone?: string;
};

/** Array of layer configuration entries. */
export type LayerConfig = LayerConfigEntry[];

// Runtime layer data structures after configuration is processed

/** Image mapping information. */
export type ImageMapping = {
  imageDimensions: { width: number; height: number };
};

/** Precomputed calculation points for a layer. */
export type LayerCalculationPoints = {
  stageCenter: CoordinateBundle;
  imageCenter: DualSpaceCoordinate;
  spinPoint: DualSpaceCoordinate;
  orbitPoint: OrbitCoordinate;
  orbitLine?: CoordinateBundle;
};

/** Universal layer data structure (base layer data before processors). */
export type UniversalLayerData = {
  LayerID: string;
  ImageID: string;
  imageUrl: string;
  imagePath: string;
  blendMode?: "additive" | "normal";
  opacity?: number;
  pulseSeconds?: number;
  pulseAmplitude?: number;
  position: Point2D;
  scale: Point2D;
  imageMapping: ImageMapping;
  calculation: LayerCalculationPoints;
  rotation?: number;
  spinStagePoint?: Point2D;
  spinStagePercent?: PercentPoint;
  spinPercent?: PercentPoint;
  spinImagePoint?: Point2D;
  orbitStagePoint?: Point2D;
  orbitLinePoint?: Point2D;
  orbitLineVisible?: boolean;
  orbitRadius?: number;
  orbitImagePercent?: PercentPoint;
  orbitImagePoint?: Point2D;
  orbitOrient?: boolean;
};

/** Enhanced universal layer data with processor-added properties. */
export type EnhancedLayerData = UniversalLayerData & {
  // Spin properties (added by motion processor)
  spinSpeed?: number; // rotations per hour (1 = 1 full rotation in 1 hour)
  spinDirection?: "cw" | "ccw";
  spinSpeedAlias?: ClockSpeedAlias;
  spinFormat?: TimeFormat;
  spinTimezone?: string;
  currentRotation?: number;
  hasSpinAnimation?: boolean;
  spinStagePoint?: Point2D;
  spinPercent?: PercentPoint;

  // Orbital properties (added by motion processor)
  orbitSpeed?: number; // rotations per hour (1 = 1 full orbit in 1 hour)
  orbitSpeedAlias?: ClockSpeedAlias;
  orbitFormat?: TimeFormat;
  orbitTimezone?: string;
  orbitDirection?: "cw" | "ccw";
  currentOrbitAngle?: number;
  hasOrbitalAnimation?: boolean;
  visible?: boolean;
  orbitPoint?: Point2D;
  orbitLineStyle?: {
    radius: number;
    visible: boolean;
  };

  // Future properties added by other processors
  opacity?: number;
  filters?: string[];
};

/** Modular preparation states. */
export type BaseLayerState = {
  baseData: {
    LayerID: string;
    ImageID: string;
    imageUrl: string;
    imagePath: string;
    blendMode?: "additive" | "normal";
    opacity?: number;
    pulseSeconds?: number;
    pulseAmplitude?: number;
    position: Point2D;
    scale: Point2D;
    imageMapping: ImageMapping;
    rotation: number;
    orbitOrient: boolean;
  };
  stageSize: number;
  stageCenter: CoordinateBundle;
  imageCenter: DualSpaceCoordinate;
};

export type SpinPreparationState = {
  hasSpin: boolean;
  calculation: {
    spinPoint: DualSpaceCoordinate;
  };
  spinStagePoint: Point2D;
  spinStagePercent: PercentPoint;
  spinImagePercent: PercentPoint;
  spinImagePoint: Point2D;
};

export type OrbitPreparationState = {
  hasOrbit: boolean;
  calculation: {
    orbitPoint: OrbitCoordinate;
    orbitLine: CoordinateBundle;
  };
  orbitStagePoint: Point2D;
  orbitLinePoint: Point2D;
  orbitLineVisible: boolean;
  orbitRadius: number;
  orbitImagePercent: PercentPoint;
  orbitImagePoint: Point2D;
};

// Types for the layer processor pipeline system

/** Layer processor function type. */
export type LayerProcessor = (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;

/** Context for processor attachment decisions. */
export type ProcessorContext = {
  force?: Record<string, unknown>;
};

/** Processor plugin definition. */
export type ProcessorPlugin = {
  /** Unique name for this processor (e.g., "spin", "orbital", "blur"). */
  name: string;

  /** Determines if this processor should be attached to a layer. */
  shouldAttach(entry: LayerConfigEntry, context?: ProcessorContext): boolean;

  /** Creates the processor function for this layer. */
  create(entry: LayerConfigEntry, context?: ProcessorContext): LayerProcessor;
};

// Types for layer motion artifacts (markers and processors)

/** Visual marker for layer motion debugging. */
export type LayerMotionMarker = {
  id: string;
  x: number;
  y: number;
  color: string;
  radius: number;
  kind?: "point" | "circle";
  lineWidth?: number;
  motion?: {
    type: "orbit";
    centerX: number;
    centerY: number;
    radius: number;
    rotationsPerHour: number;
    direction: RotationDirection;
    initialAngleDeg: number;
  };
};

/** Motion artifacts returned by buildLayerMotion. */
export type LayerMotionArtifacts = {
  processor?: (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;
  markers?: LayerMotionMarker[];
};

// Functions for loading and validating layer configuration

/** Clock alias configuration defaults. */
const CLOCK_ALIAS_DEFAULT_FORMAT = "24";
const CLOCK_ALIAS_DEFAULT_TIMEZONE = "UTC";
const CLOCK_ALIAS_VALUES = new Set(["second", "minute", "hour"]);

/** Normalize motion configuration for clock aliases. */
function normalizeMotionAlias(entry: LayerConfigEntry, prefix: "spin" | "orbit"): void {
  const speedKey = `${prefix}Speed` as keyof LayerConfigEntry;
  const aliasKey = `${prefix}SpeedAlias` as keyof LayerConfigEntry;
  const formatKey = `${prefix}Format` as keyof LayerConfigEntry;
  const timezoneKey = `${prefix}Timezone` as keyof LayerConfigEntry;

  const rawSpeed = entry[speedKey];

  // Already an alias or number - nothing to normalize
  if (typeof rawSpeed !== "string") return;

  // Try parsing as number first
  const numericValue = Number(rawSpeed);
  if (!isNaN(numericValue) && isFinite(numericValue)) {
    (entry[speedKey] as any) = numericValue;
    return;
  }

  // Check if it's a clock alias
  if (CLOCK_ALIAS_VALUES.has(rawSpeed)) {
    // Move to alias field (only if not already set to avoid overwriting)
    if (!entry[aliasKey]) {
      (entry[aliasKey] as any) = rawSpeed as ClockSpeedAlias;
    }
    delete entry[speedKey];

    // Set defaults if not provided
    if (!entry[formatKey]) {
      (entry[formatKey] as any) = CLOCK_ALIAS_DEFAULT_FORMAT;
    }
    if (!entry[timezoneKey]) {
      (entry[timezoneKey] as any) = CLOCK_ALIAS_DEFAULT_TIMEZONE;
    }
  }
  // Invalid string - remove it
  else {
    delete entry[speedKey];
  }
}

/** Validate layer config entry. */
export function validateLayerConfig(entry: LayerConfigEntry): string[] {
  const errors: string[] = [];

  // Validate core properties
  if (!entry.LayerID || typeof entry.LayerID !== "string") {
    errors.push("LayerID is required and must be a string");
  }
  if (!entry.ImageID || typeof entry.ImageID !== "string") {
    errors.push("ImageID is required and must be a string");
  }
  if (typeof entry.LayerOrder !== "number" || !isFinite(entry.LayerOrder)) {
    errors.push("LayerOrder is required and must be a finite number");
  }
  if (entry.renderer !== "2D" && entry.renderer !== "3D") {
    errors.push('Renderer must be "2D" or "3D"');
  }

  // Validate ImageScale if provided
  if (entry.ImageScale !== undefined) {
    if (!Array.isArray(entry.ImageScale) || entry.ImageScale.length !== 2) {
      errors.push("ImageScale must be an array of 2 numbers [x, y]");
    } else {
      const [x, y] = entry.ImageScale;
      if (typeof x !== "number" || typeof y !== "number" || x <= 0 || y <= 0) {
        errors.push("ImageScale values must be positive numbers");
      }
    }
  }

  return errors;
}

/** Load layer configuration from ConfigYuzha.json. */
export function loadLayerConfig(): LayerConfig {
  // Cast raw JSON to our type
  const entries = rawConfig as LayerConfigEntry[];

  // Normalize and validate each entry
  entries.forEach((entry, index) => {
    // Normalize clock aliases for spin and orbit
    normalizeMotionAlias(entry, "spin");
    normalizeMotionAlias(entry, "orbit");

    // Validate entry (development only)
    const errors = validateLayerConfig(entry);
    if (errors.length > 0 && typeof console !== "undefined") {
      console.error(
        `[LayerConfig] Validation errors for entry #${index} (${entry.LayerID}):`,
        errors,
      );
    }
  });

  // Sort by LayerOrder (background to foreground)
  entries.sort((a, b) => a.LayerOrder - b.LayerOrder);

  return entries;
}

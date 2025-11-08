/**
 * ============================================================================
 * LAYER MODEL - Single Source of Truth for Types & Configuration
 * ============================================================================
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This is the MASTER CONTRACT for the layer system. All types live here.
 * Think of this as the "schema" or "data model" for the entire layer system.
 *
 * WHAT THIS FILE CONTAINS:
 * ------------------------
 * 1. Geometric Primitives (Point2D, PercentPoint, etc.)
 * 2. Layer Configuration Types (LayerConfigEntry, LayerConfig)
 * 3. Layer Data Types (UniversalLayerData, EnhancedLayerData)
 * 4. Clock/Time Types (RotationDirection, ClockSpeedAlias, etc.)
 * 5. Processor Types (LayerProcessor, ProcessorPlugin)
 * 6. Motion Types (LayerMotionMarker, LayerMotionArtifacts)
 * 7. Configuration Loading (loadLayerConfig function)
 *
 * DEPENDENCY RULES FOR FUTURE AI AGENTS:
 * ---------------------------------------
 * - THIS FILE: Has NO code dependencies (only JSON imports)
 * - math.ts: Imports types from THIS FILE
 * - engine.ts: Imports types from THIS FILE
 * - index.ts: Re-exports types from THIS FILE
 *
 * This ensures model.ts is the single source of truth for all contracts.
 *
 * @module layer/model
 */

import rawConfig from "./ConfigYuzha.json";

// ============================================================================
// SECTION 1: GEOMETRIC PRIMITIVES
// ============================================================================
// Basic geometric types used throughout the layer system.
// FOR FUTURE AI AGENTS: These are the fundamental building blocks.
// ============================================================================

/**
 * 2D point in pixel space
 * Used for both image space (0,0 = image top-left) and stage space (0,0 = stage top-left)
 */
export type Point2D = { x: number; y: number };

/**
 * 2D point in percentage space (0-100% in both dimensions)
 * Used for relative positioning independent of absolute dimensions
 *
 * IMPORTANT: Values can exceed 100% for extended range pivot points
 * Example: {x: 50, y: 118} means 50% horizontally, 18% below bottom edge
 */
export type PercentPoint = { x: number; y: number };

/**
 * A point represented in both pixel and percentage coordinates
 * Maintains dual representations for convenience
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
// SECTION 2: CLOCK & TIME TYPES
// ============================================================================
// Types for clock-based animations and time calculations.
// FOR FUTURE AI AGENTS: Used for time-based rotations (second/minute/hour hands).
// ============================================================================

/**
 * Rotation direction
 * - "cw": Clockwise (positive angle increase)
 * - "ccw": Counter-clockwise (negative angle increase)
 */
export type RotationDirection = "cw" | "ccw";

/**
 * Clock speed aliases for common time units
 * - "second": 60 rotations per hour (completes 1 rotation per minute)
 * - "minute": 1 rotation per hour (completes 1 rotation per hour)
 * - "hour": 1/12 rotation per hour in 12-hour format, 1/24 in 24-hour format
 */
export type ClockSpeedAlias = "second" | "minute" | "hour";

/**
 * Time format for clock calculations
 * - "12": 12-hour clock (hour hand makes 2 rotations per day)
 * - "24": 24-hour clock (hour hand makes 1 rotation per day)
 */
export type TimeFormat = "12" | "24";

/**
 * Direction sign for calculations
 * - 1: Clockwise direction
 * - -1: Counter-clockwise direction
 */
export type DirectionSign = 1 | -1;

/**
 * Clock speed value object
 * Allows specifying rotation speed with optional direction override
 */
export type ClockSpeedValue = {
  value: number;
  direction?: RotationDirection;
};

/**
 * Union type for all clock speed specifications
 * Can be: "second" | "minute" | "hour" | numeric | {value, direction}
 */
export type ClockSpeedSetting = ClockSpeedAlias | ClockSpeedValue | number;

/**
 * Clock motion configuration
 * Defines how a layer rotates based on time
 */
export type ClockMotionConfig = {
  speed?: ClockSpeedSetting;
  direction?: RotationDirection;
  format?: TimeFormat;
  timezone?: string;
};

/**
 * Resolved clock speed (discriminated union)
 * Result of processing ClockMotionConfig into specific motion type
 *
 * FOR FUTURE AI AGENTS: Use the "kind" field to determine which type:
 * - "static": No motion (speed not specified)
 * - "alias": Clock-based motion ("second", "minute", "hour")
 * - "numeric": Custom rotation speed (rotations per hour)
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
      directionSign: DirectionSign;
      timezoneOffsetMinutes: number;
      format: TimeFormat;
    };

/**
 * Clock defaults
 */
export const CLOCK_DEFAULTS = {
  timeFormat: "24" as TimeFormat,
  direction: "cw" as RotationDirection,
  numericSpeed: 1,
};

/**
 * Available clock speed aliases
 */
export const CLOCK_SPEED_ALIASES: ClockSpeedAlias[] = ["second", "minute", "hour"];

// ============================================================================
// SECTION 3: LAYER CONFIGURATION TYPES
// ============================================================================
// Configuration structure loaded from ConfigYuzha.json
// FOR FUTURE AI AGENTS: This defines what a layer looks like in the config file.
// ============================================================================

/**
 * Layer Renderer Type
 * - "2D": Canvas 2D renderer (most layers use this)
 * - "3D": Three.js WebGL renderer (for 3D objects, not currently used)
 */
export type LayerRenderer = "2D" | "3D";

/**
 * LayerConfigEntry - Complete layer configuration
 *
 * FOR FUTURE AI AGENTS:
 * ---------------------
 * This type defines ALL possible properties a layer can have in ConfigYuzha.json.
 * Properties are organized into logical groups:
 *
 * CORE PROPERTIES (always required):
 * - LayerID: Unique identifier for this layer instance
 * - ImageID: Asset reference from ImageRegistry.json
 * - renderer: Which rendering system ("2D" or "3D")
 * - LayerOrder: Draw order (lower = background, higher = foreground)
 * - ImageScale: Size scaling as [x%, y%] percentage (10-500, default 100)
 *
 * BASIC POSITIONING (optional, for static layers):
 * - BasicStagePoint: Stage anchor position [x, y] in pixels (0-2048)
 * - BasicImagePoint: Image anchor point [x%, y%] as percentage (can exceed 100!)
 * - BasicImageAngle: Static rotation in degrees (0-360)
 *
 * SPIN ANIMATION (optional, for rotating layers):
 * - spinStagePoint: Pivot point on stage [x, y] pixels
 * - spinImagePoint: Pivot point on image [x%, y%] percentage (extended range supported!)
 * - spinSpeed: Rotation speed (rotations/hour) or undefined if using alias
 * - spinSpeedAlias: Clock alias ("second", "minute", "hour")
 * - spinDirection: "cw" (clockwise) or "ccw" (counter-clockwise)
 * - spinFormat: Clock format ("12" or "24") for alias speeds
 * - spinTimezone: Timezone string ("UTC±HH[:MM]") for alias speeds
 *
 * ORBITAL ANIMATION (optional, for orbiting layers):
 * - orbitStagePoint: Orbit center [x, y] stage pixels
 * - orbitLinePoint: Point defining orbit radius [x, y]
 * - orbitImagePoint: Which image point follows orbit [x%, y%]
 * - orbitLine: Whether to draw orbit path circle
 * - orbitOrient: Auto-rotate image to face orbit direction
 * - orbitSpeed: Orbital speed (rotations/hour) or undefined if using alias
 * - orbitSpeedAlias: Clock alias for orbital motion
 * - orbitDirection: "cw" or "ccw"
 * - orbitFormat: Clock format for orbital alias speeds
 * - orbitTimezone: Timezone for orbital alias speeds
 *
 * EXAMPLE FROM ConfigYuzha.json:
 * {
 *   "LayerID": "clock-minute-hand",
 *   "ImageID": "sprite_005-",
 *   "renderer": "2D",
 *   "LayerOrder": 900,
 *   "ImageScale": [100, 128],
 *   "spinStagePoint": [1024, 1024],
 *   "spinImagePoint": [50, 118],  // Extended range! 18% below bottom edge
 *   "spinSpeed": "hour",
 *   "spinDirection": "cw",
 *   "spinFormat": "12",
 *   "spinTimezone": "UTC+7"
 * }
 */
export type LayerConfigEntry = {
  // ===== CORE PROPERTIES (Required) =====
  LayerID: string;
  ImageID: string;
  renderer: LayerRenderer;
  LayerOrder: number;
  ImageScale?: number[];

  // ===== BASIC CONFIG (Static Positioning) =====
  /** @deprecated Use BasicStagePoint and BasicImagePoint instead */
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

/**
 * Array of layer configuration entries
 */
export type LayerConfig = LayerConfigEntry[];

// ============================================================================
// SECTION 4: LAYER DATA TYPES
// ============================================================================
// Runtime layer data structures after configuration is processed
// FOR FUTURE AI AGENTS: These are what you work with at runtime.
// ============================================================================

/**
 * Image mapping information
 * Defines the core geometry of an image needed for positioning
 *
 * FOR FUTURE AI AGENTS: Image center is calculated as (width/2, height/2).
 * Use getImageCenter() helper from math.ts to retrieve the center.
 */
export type ImageMapping = {
  imageDimensions: { width: number; height: number };
};

/**
 * Precomputed calculation points for a layer
 *
 * This structure caches commonly used coordinate transformations to avoid
 * recalculating them in processors and renderers.
 *
 * FOR FUTURE AI AGENTS: These bundles are calculated during layer preparation
 * and stored here for efficient access. Use them instead of recalculating.
 */
export type LayerCalculationPoints = {
  stageCenter: CoordinateBundle;
  imageCenter: DualSpaceCoordinate;
  spinPoint: DualSpaceCoordinate;
  orbitPoint: OrbitCoordinate;
  orbitLine?: CoordinateBundle;
};

/**
 * Universal layer data structure (base layer data before processors)
 *
 * This is the output of layer preparation and input to the processor pipeline.
 * Contains everything needed to render a static layer.
 *
 * IMPORTANT FOR FUTURE AI AGENTS:
 * - This is the BASE layer data (no animations yet)
 * - Processors enhance this with additional properties
 * - All coordinate calculations are precomputed in `calculation`
 * - Image mapping provides geometry information
 */
export type UniversalLayerData = {
  LayerID: string;
  ImageID: string;
  imageUrl: string;
  imagePath: string;
  position: Point2D;
  scale: Point2D;
  imageMapping: ImageMapping;
  calculation: LayerCalculationPoints;
  rotation?: number;
  orbitStagePoint?: Point2D;
  orbitLinePoint?: Point2D;
  orbitLineVisible?: boolean;
  orbitRadius?: number;
  orbitImagePercent?: PercentPoint;
  orbitImagePoint?: Point2D;
  orbitOrient?: boolean;
};

/**
 * Enhanced universal layer data with processor-added properties
 *
 * Base properties (from UniversalLayerData):
 * - imageMapping: Image geometry (center point and native dimensions)
 * - calculation: Precomputed coordinate bundles (stage/image/percent) for points
 * - position: Layer position on stage
 * - scale: Layer scale factor
 * - rotation: Base rotation angle
 * - LayerID: Unique layer identifier
 *
 * Processor-added properties:
 * - Spin properties: spinSpeed, currentRotation, hasSpinAnimation, etc.
 * - Orbital properties: orbitSpeed, orbitRadius, currentOrbitAngle, etc.
 * - Future processors can add more properties here
 *
 * FOR FUTURE AI AGENTS:
 * When adding a new processor that adds properties, add those property types here
 * so TypeScript knows they exist on EnhancedLayerData.
 */
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

/**
 * Modular preparation states
 *
 * These break the layer preparation into composable pieces.
 * Future AI agents can evolve each module independently.
 */
export type BaseLayerState = {
  baseData: {
    LayerID: string;
    ImageID: string;
    imageUrl: string;
    imagePath: string;
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

// ============================================================================
// SECTION 5: PROCESSOR TYPES
// ============================================================================
// Types for the layer processor pipeline system
// FOR FUTURE AI AGENTS: Processors transform layer data (add animations, effects, etc.)
// ============================================================================

/**
 * Layer processor function type
 *
 * Processors transform UniversalLayerData into EnhancedLayerData by:
 * - Adding new properties (spin rotation, orbital position, custom state)
 * - Modifying existing properties (position, rotation, visibility)
 * - Using timestamp for time-based animations
 *
 * @param layer - Base or enhanced layer data
 * @param timestamp - Optional timestamp in milliseconds for animations
 * @returns Enhanced layer data with added/modified properties
 */
export type LayerProcessor = (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;

/**
 * Context for processor attachment decisions
 *
 * Allows runtime overrides and customization of processor behavior.
 *
 * FUTURE USE CASES (for AI agents):
 * - Force a processor to attach even if config says no
 * - Pass renderer-specific settings (Canvas vs DOM vs Three.js)
 * - Provide global animation state (paused, speed multiplier)
 */
export type ProcessorContext = {
  force?: Record<string, unknown>;
};

/**
 * Processor plugin definition
 *
 * FOR FUTURE AI AGENTS:
 * This is the interface for registering new processors. When you want to add
 * a new behavior (blur, particles, glow, etc.), create an object matching this
 * type and pass it to registerProcessor().
 *
 * @example
 * registerProcessor({
 *   name: "blur",
 *   shouldAttach(entry) {
 *     return entry.blurAmount !== undefined && entry.blurAmount > 0;
 *   },
 *   create(entry) {
 *     return (layer, timestamp) => ({
 *       ...layer,
 *       blurAmount: entry.blurAmount,
 *       hasBlur: true,
 *     });
 *   },
 * });
 */
export type ProcessorPlugin = {
  /** Unique name for this processor (e.g., "spin", "orbital", "blur") */
  name: string;

  /**
   * Determines if this processor should be attached to a layer
   * @param entry - Layer configuration from ConfigYuzha.json
   * @param context - Optional runtime context
   * @returns true if processor should be attached, false otherwise
   */
  shouldAttach(entry: LayerConfigEntry, context?: ProcessorContext): boolean;

  /**
   * Creates the processor function for this layer
   * @param entry - Layer configuration from ConfigYuzha.json
   * @param context - Optional runtime context
   * @returns LayerProcessor function that will process this layer
   */
  create(entry: LayerConfigEntry, context?: ProcessorContext): LayerProcessor;
};

// ============================================================================
// SECTION 6: MOTION TYPES
// ============================================================================
// Types for layer motion artifacts (markers and processors)
// FOR FUTURE AI AGENTS: Used by motion system for debug visualization and animation
// ============================================================================

/**
 * Visual marker for layer motion debugging
 *
 * FOR FUTURE AI AGENTS: These are debug visualization helpers.
 * They show pivot points, orbit centers, and motion paths.
 */
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

/**
 * Motion artifacts returned by buildLayerMotion
 *
 * Contains:
 * - processor: Function to animate the layer each frame
 * - markers: Debug visualization markers (optional)
 */
export type LayerMotionArtifacts = {
  processor?: (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;
  markers?: LayerMotionMarker[];
};

// ============================================================================
// SECTION 7: CONFIGURATION LOADING
// ============================================================================
// Functions for loading and validating layer configuration
// FOR FUTURE AI AGENTS: This is how ConfigYuzha.json gets loaded into memory.
// ============================================================================

/**
 * Clock alias configuration defaults
 * When a layer uses clock alias (e.g., spinSpeed: "hour"), these defaults apply
 * if format/timezone are not explicitly specified.
 */
const CLOCK_ALIAS_DEFAULT_FORMAT = "24";
const CLOCK_ALIAS_DEFAULT_TIMEZONE = "UTC";
const CLOCK_ALIAS_VALUES = new Set(["second", "minute", "hour"]);

/**
 * Normalize motion configuration for clock aliases
 *
 * FOR FUTURE AI AGENTS:
 * ---------------------
 * This function handles the special case where speed is a string:
 *
 * CASE 1: Numeric string (e.g., "60")
 * - Convert to number: entry.spinSpeed = 60
 *
 * CASE 2: Clock alias (e.g., "second", "minute", "hour")
 * - Move to alias field: entry.spinSpeedAlias = "second"
 * - Remove speed field: delete entry.spinSpeed
 * - Set defaults: spinFormat="24", spinTimezone="UTC" (if not provided)
 *
 * CASE 3: Already a number
 * - No transformation needed
 *
 * @param entry - Mutable config entry to normalize
 * @param prefix - "spin" or "orbit" (determines which fields to process)
 */
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

/**
 * Validate layer config entry
 *
 * FOR FUTURE AI AGENTS:
 * ---------------------
 * Checks for common configuration errors and returns array of error messages.
 * Empty array means validation passed.
 *
 * VALIDATION RULES:
 * - LayerID and ImageID must be non-empty strings
 * - LayerOrder must be a valid number
 * - ImageScale must be [x, y] with positive numbers
 * - Renderer must be "2D" or "3D"
 *
 * @param entry - Config entry to validate
 * @returns Array of error messages (empty if valid)
 */
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

/**
 * Load layer configuration from ConfigYuzha.json
 *
 * FOR FUTURE AI AGENTS:
 * ---------------------
 * This is the MAIN ENTRY POINT for loading layer configuration.
 *
 * PROCESS:
 * 1. Load ConfigYuzha.json
 * 2. Normalize clock aliases (convert string speeds to alias fields)
 * 3. Validate each entry
 * 4. Sort by LayerOrder (background to foreground)
 * 5. Return validated config array
 *
 * ERROR HANDLING:
 * - Logs validation errors to console (development only)
 * - Invalid entries are still returned (rendering system handles gracefully)
 *
 * @returns Array of layer configuration entries sorted by LayerOrder
 */
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

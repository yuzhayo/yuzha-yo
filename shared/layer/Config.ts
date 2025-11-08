/**
 * ============================================================================
 * LAYER CONFIG - Flat Configuration System
 * ============================================================================
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This module loads and validates layer configuration from ConfigYuzha.json.
 * The config uses a FLAT structure (no groups) for simplicity.
 *
 * SIMPLIFIED ARCHITECTURE (2025):
 * -------------------------------
 * - ConfigYuzha.json uses flat properties (no "groups" nesting)
 * - Direct loading: JSON → LayerConfigEntry[] → validation → sorted by LayerOrder
 * - Clock alias normalization: "second"/"minute"/"hour" → spinSpeedAlias/orbitSpeedAlias
 *
 * WHAT THIS MODULE DOES:
 * -----------------------
 * 1. Define LayerConfigEntry type (flat runtime structure)
 * 2. Load ConfigYuzha.json
 * 3. Normalize clock aliases (string speeds → alias fields)
 * 4. Validate config entries (ranges, required fields)
 * 5. Sort by LayerOrder (background to foreground)
 * 6. Export via loadLayerConfig()
 *
 * CONFIG STRUCTURE:
 * -----------------
 * Each layer has:
 * - CORE (required): LayerID, ImageID, renderer, LayerOrder, ImageScale
 * - POSITIONING (optional): BasicStagePoint, BasicImagePoint, BasicImageAngle
 * - SPIN (optional): spinStagePoint, spinImagePoint, spinSpeed, spinDirection, spinFormat, spinTimezone
 * - ORBIT (optional): orbitStagePoint, orbitLinePoint, orbitSpeed, orbitDirection, orbitFormat, orbitTimezone
 *
 * Example flat config entry:
 * {
 *   "LayerID": "hour-hand",
 *   "ImageID": "HOUR_HAND",
 *   "renderer": "2D",
 *   "LayerOrder": 900,
 *   "ImageScale": [100, 100],
 *   "BasicStagePoint": [1024, 1024],
 *   "BasicImagePoint": [50, 50],
 *   "spinStagePoint": [1024, 1024],
 *   "spinImagePoint": [50, 80],
 *   "spinSpeed": "hour",        // Clock alias (converted to spinSpeedAlias)
 *   "spinDirection": "cw",
 *   "spinFormat": "24",
 *   "spinTimezone": "UTC+7"
 * }
 *
 * CLOCK ALIASES:
 * --------------
 * Speed values can be:
 * - Numeric: rotations per hour (1.0 = 1 full rotation in 1 hour)
 * - Alias: "second" (60/hour), "minute" (1/hour), "hour" (1/12 or 1/24 per hour)
 *
 * When alias is used:
 * - spinSpeed: "hour" → sets spinSpeedAlias: "hour", removes spinSpeed
 * - Defaults: spinFormat="24", spinTimezone="UTC" (if not provided)
 *
 * USED BY:
 * --------
 * - StageSystem.ts (loads config and creates layers)
 * - layerCore.ts (prepares layer data from config entries)
 * - layerMotion.ts (reads spin/orbit properties for animation)
 *
 * @module layer/Config
 */

import rawConfig from "./ConfigYuzha.json";

/**
 * Layer Renderer Type
 * - "2D": Canvas 2D renderer (most layers use this)
 * - "3D": Three.js WebGL renderer (for 3D objects, not currently used)
 */
export type LayerRenderer = "2D" | "3D";

/**
 * LayerConfigEntry - Flat layer configuration (runtime format)
 *
 * FOR FUTURE AI AGENTS:
 * ---------------------
 * This is the ONLY config type. JSON uses this structure directly (no transformation).
 * All properties are at the top level - no nested groups.
 *
 * PROPERTY GROUPS (logical organization, not code structure):
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
 * - BasicImagePoint: Image anchor point [x%, y%] as percentage (0-100)
 * - BasicImageAngle: Static rotation in degrees (0-360)
 *
 * SPIN ANIMATION (optional, for rotating layers):
 * - spinStagePoint: Pivot point on stage [x, y] pixels
 * - spinImagePoint: Pivot point on image [x%, y%] percentage
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
 * COMBINING PROPERTIES:
 * ---------------------
 * - Core only: Static positioned layer (no animation)
 * - Core + Spin: Rotating layer
 * - Core + Orbit: Orbiting layer
 * - Core + Spin + Orbit: Layer spins while orbiting (like Earth)
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

export type LayerConfig = LayerConfigEntry[];

/**
 * Clock alias configuration defaults
 *
 * FOR FUTURE AI AGENTS:
 * ---------------------
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
 * - No changes
 *
 * Example transformations:
 * - spinSpeed: "60" → spinSpeed: 60
 * - spinSpeed: "hour" → spinSpeedAlias: "hour", spinFormat: "24", spinTimezone: "UTC"
 * - spinSpeed: 1.5 → no change
 *
 * This modifies the entry object in-place.
 *
 * @param entry - Config entry to normalize (modified in-place)
 * @param speedKey - Which speed field to check ("spinSpeed" or "orbitSpeed")
 * @param aliasKey - Where to store alias ("spinSpeedAlias" or "orbitSpeedAlias")
 * @param formatKey - Where to store format ("spinFormat" or "orbitFormat")
 * @param timezoneKey - Where to store timezone ("spinTimezone" or "orbitTimezone")
 */
function normalizeMotionGroup(
  entry: Record<string, unknown>,
  speedKey: "spinSpeed" | "orbitSpeed",
  aliasKey: "spinSpeedAlias" | "orbitSpeedAlias",
  formatKey: "spinFormat" | "orbitFormat",
  timezoneKey: "spinTimezone" | "orbitTimezone",
): void {
  const rawSpeed = entry[speedKey];

  // Handle string speed values
  if (typeof rawSpeed === "string") {
    const numeric = Number(rawSpeed);

    // Try parsing as number
    if (!Number.isNaN(numeric)) {
      entry[speedKey] = numeric;
    }
    // Check if it's a clock alias
    else if (CLOCK_ALIAS_VALUES.has(rawSpeed)) {
      if (!entry[aliasKey]) {
        entry[aliasKey] = rawSpeed;
      }
      delete entry[speedKey];
    }
  }

  // If alias is set, ensure format and timezone have defaults
  if (entry[aliasKey]) {
    if (!entry[formatKey]) {
      entry[formatKey] = CLOCK_ALIAS_DEFAULT_FORMAT;
    }
    if (!entry[timezoneKey]) {
      entry[timezoneKey] = CLOCK_ALIAS_DEFAULT_TIMEZONE;
    }
  }
}

/**
 * Normalize config entries for clock aliases
 *
 * FOR FUTURE AI AGENTS:
 * ---------------------
 * Processes the raw JSON config to handle clock alias strings.
 * Each entry is normalized in-place for both spin and orbit motion.
 *
 * This is the transformation step between JSON loading and validation.
 *
 * @param config - Array of config entries from JSON
 * @returns Same array (entries modified in-place)
 */
function normalizeConfig(config: LayerConfigEntry[]): LayerConfig {
  config.forEach((entry) => {
    // Normalize spin motion aliases
    normalizeMotionGroup(
      entry as Record<string, unknown>,
      "spinSpeed",
      "spinSpeedAlias",
      "spinFormat",
      "spinTimezone",
    );

    // Normalize orbit motion aliases
    normalizeMotionGroup(
      entry as Record<string, unknown>,
      "orbitSpeed",
      "orbitSpeedAlias",
      "orbitFormat",
      "orbitTimezone",
    );
  });

  return config;
}

/**
 * Validate layer configuration entry for common errors
 *
 * FOR FUTURE AI AGENTS:
 * ---------------------
 * Checks a single config entry for:
 * - Required core properties (LayerID, ImageID, renderer, LayerOrder)
 * - Valid numeric ranges (ImageScale: 10-500%, angles: 0-360°)
 * - Non-negative speeds
 *
 * Returns array of error messages (empty if valid).
 * Errors are logged to console in development but don't block loading.
 *
 * To add new validations:
 * 1. Check property value
 * 2. Push descriptive error message to errors array
 * 3. Return errors array
 *
 * @param entry - Layer config to validate
 * @returns Array of error messages (empty if valid)
 */
export function validateLayerConfig(entry: LayerConfigEntry): string[] {
  const errors: string[] = [];

  // Required core fields
  if (!entry.LayerID) errors.push(`Missing LayerID`);
  if (!entry.ImageID) errors.push(`Missing ImageID`);
  if (!entry.renderer) errors.push(`Missing renderer`);
  if (entry.LayerOrder === undefined) errors.push(`Missing LayerOrder`);

  // ImageScale range validation (10-500%)
  if (entry.ImageScale) {
    const [sx, sy] = entry.ImageScale;
    if (sx !== undefined && (sx < 10 || sx > 500)) {
      errors.push(`ImageScale X out of range (10-500): ${sx}`);
    }
    if (sy !== undefined && (sy < 10 || sy > 500)) {
      errors.push(`ImageScale Y out of range (10-500): ${sy}`);
    }
  }

  // Angle validation (0-360 degrees)
  if (entry.BasicImageAngle !== undefined) {
    if (entry.BasicImageAngle < 0 || entry.BasicImageAngle > 360) {
      errors.push(`BasicImageAngle out of range (0-360): ${entry.BasicImageAngle}`);
    }
  }

  // Speed validation (should be non-negative)
  if (entry.spinSpeed !== undefined && entry.spinSpeed < 0) {
    errors.push(`Negative spinSpeed: ${entry.spinSpeed}`);
  }
  if (entry.orbitSpeed !== undefined && entry.orbitSpeed < 0) {
    errors.push(`Negative orbitSpeed: ${entry.orbitSpeed}`);
  }

  return errors;
}

/**
 * Validate entire config and log warnings for any issues
 *
 * FOR FUTURE AI AGENTS:
 * ---------------------
 * Validates all config entries and logs errors to console.
 * Only runs in development mode for performance.
 *
 * Validation errors are warnings - they don't block config loading.
 * This allows partial configs to work while highlighting issues.
 *
 * @param config - Full layer config array
 * @returns Same config (for chaining)
 */
function validateConfig(config: LayerConfig): LayerConfig {
  const IS_DEV =
    typeof import.meta !== "undefined" && typeof (import.meta as any).env !== "undefined"
      ? (import.meta as any).env.DEV
      : true;

  if (!IS_DEV) return config; // Skip validation in production

  config.forEach((entry, index) => {
    const errors = validateLayerConfig(entry);
    if (errors.length > 0) {
      console.warn(
        `[Config] Validation errors for layer #${index} (${entry.LayerID || "unknown"}):`,
        errors,
      );
    }
  });

  return config;
}

/**
 * Main config pipeline
 *
 * FOR FUTURE AI AGENTS:
 * ---------------------
 * The complete loading and processing pipeline:
 *
 * 1. Load ConfigYuzha.json (raw flat structure)
 * 2. Normalize clock aliases (string → alias fields)
 * 3. Validate entries (development only)
 * 4. Sort by LayerOrder (ascending = background to foreground)
 *
 * This executes once at module initialization.
 * The result is cached and returned by loadLayerConfig().
 *
 * PIPELINE FLOW:
 * rawConfig → normalizeConfig() → validateConfig() → sort by LayerOrder → config
 */
const config: LayerConfig = validateConfig(
  normalizeConfig(rawConfig as unknown as LayerConfigEntry[]),
).sort((a, b) => (a.LayerOrder ?? 0) - (b.LayerOrder ?? 0));

/**
 * Get the loaded and processed layer configuration
 *
 * FOR FUTURE AI AGENTS:
 * ---------------------
 * This is the MAIN ENTRY POINT used by the layer system.
 *
 * What you get:
 * - Flat config entries (no groups)
 * - Clock aliases normalized (spinSpeedAlias, orbitSpeedAlias)
 * - Validated (warnings logged in dev)
 * - Sorted by LayerOrder (background to foreground)
 *
 * The config is loaded once at module initialization.
 * Subsequent calls return the same cached array.
 *
 * Usage:
 * ```typescript
 * import { loadLayerConfig } from "./Config";
 *
 * const layers = loadLayerConfig();
 * layers.forEach(layer => {
 *   // Each layer is a LayerConfigEntry with flat properties
 *   console.log(layer.LayerID, layer.spinSpeed, layer.spinSpeedAlias);
 * });
 * ```
 *
 * @returns Sorted array of layer configurations
 */
export function loadLayerConfig(): LayerConfig {
  console.log("[Config] Loaded flat config with", config.length, "layers");
  return config;
}

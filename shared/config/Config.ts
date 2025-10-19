import rawConfig from "./ConfigYuzha.json";

/**
 * Layer Renderer Type
 * - "2D": Canvas 2D renderer (most layers use this)
 * - "3D": Three.js WebGL renderer (for 3D objects)
 */
export type LayerRenderer = "2D" | "3D";

/**
 * LayerConfigEntry - Flattened runtime layer configuration
 *
 * This is the final structure used by the layer system after JSON transformation.
 * Properties are organized into logical groups:
 *
 * CORE PROPERTIES (always required):
 * - LayerID: Unique identifier for this layer instance
 * - ImageID: Asset reference from the asset registry
 * - LayerOrder: Draw order (lower = background, higher = foreground)
 * - renderer: Which rendering system to use ("2D" or "3D")
 * - ImageScale: Size scaling as [x%, y%] percentage (10-500, default 100)
 *
 * BASIC CONFIG (optional, for static positioning):
 * - BasicStagePoint: Stage anchor position [x, y] in pixels (0-2048)
 * - BasicImagePoint: Image anchor point [x%, y%] as percentage (0-100)
 * - BasicImageAngle: Static rotation in degrees (0-360)
 *
 * SPIN CONFIG (optional, for rotation animation):
 * - spinStagePoint: Pivot point on stage [x, y] pixels
 * - spinImagePoint: Pivot point on image [x%, y%] percentage
 * - spinSpeed: Rotation speed in degrees/second (0 = no spin)
 * - spinDirection: "cw" (clockwise) or "ccw" (counter-clockwise)
 *
 * ORBITAL CONFIG (optional, for orbital motion):
 * - orbitStagePoint: Orbit center [x, y] stage pixels
 * - orbitLinePoint: Point defining orbit radius [x, y]
 * - orbitImagePoint: Which image point follows the orbit [x%, y%]
 * - orbitLine: Whether to draw the orbit path circle
 * - orbitOrient: Auto-rotate image to face orbit direction
 * - orbitSpeed: Orbital rotation speed degrees/second
 * - orbitDirection: "cw" or "ccw"
 *
 * For future AI agents:
 * - A layer needs CORE properties always
 * - Add Basic Config for static positioned layers
 * - Add Spin Config for rotating layers (can work without Basic Config)
 * - Add Orbital Config for orbiting layers (can work without Basic Config)
 * - Spin + Orbital = object spins while orbiting (like Earth)
 */
export type LayerConfigEntry = {
  // ===== CORE PROPERTIES (Required) =====
  /** Unique layer instance identifier (e.g., "GEAR1", "stars-background") */
  LayerID: string;
  /** Asset ID from asset registry (e.g., "GEAR1", "STARBG") */
  ImageID: string;
  /** Rendering system: "2D" for canvas, "3D" for Three.js */
  renderer: LayerRenderer;
  /** Draw order: lower values = drawn first (background), higher = drawn later (foreground) */
  LayerOrder: number;
  /** Image scale as [xPercent, yPercent] (10-500, default 100). Applied uniformly. */
  ImageScale?: number[];

  // ===== BASIC CONFIG (Static Positioning) =====
  /** @deprecated Use BasicStagePoint and BasicImagePoint instead */
  position?: number[];
  /** Stage anchor point [x, y] in pixels (0-2048). The BasicImagePoint will be placed here. */
  BasicStagePoint?: number[];
  /** Image anchor point [x, y] as percentage (0-100). This point aligns with BasicStagePoint. */
  BasicImagePoint?: number[];
  /**
   * Static rotation angle in degrees (0-360, default 0°).
   * - 0° = original orientation (no rotation)
   * - 90° = rotated 90° counter-clockwise
   * - 180° = upside down
   * - 270° = rotated 90° clockwise
   * Note: Rotates around image center (50%, 50%). Separate from position.
   * Note: When spin animation is active (spinSpeed > 0), this is reset to 0.
   */
  BasicImageAngle?: number;

  // ===== SPIN CONFIG (Rotation Animation) =====
  /** Pivot point on stage [x, y] in absolute pixels (0-2048). Image rotates around this point. */
  spinStagePoint?: number[];
  /** Pivot point on image [x%, y%] in percentage (0-100). This point aligns with spinStagePoint. */
  spinImagePoint?: number[];
  /** Rotation speed in degrees per second. 0 or undefined = no rotation. */
  spinSpeed?: number;
  /** Rotation direction: "cw" (clockwise) or "ccw" (counter-clockwise) */
  spinDirection?: "cw" | "ccw";

  // ===== ORBITAL CONFIG (Orbital Motion) =====
  /** Orbit center [x, y] in stage coordinates (0-2048), default [1024, 1024] */
  orbitStagePoint?: number[];
  /** Point [x, y] defining the orbit radius (distance from orbitStagePoint) */
  orbitLinePoint?: number[];
  /** Image point [x%, y%] (0-100) that follows the orbital path */
  orbitImagePoint?: number[];
  /** Whether to render the orbit path circle (visual orbit indicator) */
  orbitLine?: boolean;
  /** Auto-orient image to face along the orbit radius direction */
  orbitOrient?: boolean;
  /** Orbital rotation speed in degrees per second (0 = static position) */
  orbitSpeed?: number;
  /** Orbital direction: "cw" (clockwise) or "ccw" (counter-clockwise) */
  orbitDirection?: "cw" | "ccw";

};

export type LayerConfig = LayerConfigEntry[];

/**
 * ConfigYuzhaEntry - JSON structure from ConfigYuzha.json
 *
 * The JSON file uses a grouped structure for better organization:
 * - Core properties (LayerID, ImageID, etc.) are at top level
 * - ImageScale is at top level (moved from Basic Config for clarity)
 * - Related settings are grouped ("Basic Config", "Spin Config", etc.)
 *
 * Example minimal layer (Core only):
 * {
 *   "LayerID": "my-layer",
 *   "ImageID": "MY_ASSET",
 *   "renderer": "2D",
 *   "LayerOrder": 100,
 *   "ImageScale": [100, 100]
 * }
 *
 * Example with Spin (Core + Spin Config):
 * {
 *   "LayerID": "spinning-gear",
 *   "ImageID": "GEAR1",
 *   "renderer": "2D",
 *   "LayerOrder": 200,
 *   "ImageScale": [80, 80],
 *   "groups": {
 *     "Spin Config": {
 *       "spinStagePoint": [1024, 1024],
 *       "spinImagePoint": [50, 50],
 *       "spinSpeed": 10,
 *       "spinDirection": "cw"
 *     }
 *   }
 * }
 *
 * For future AI agents:
 * - groups are OPTIONAL - a layer can have just Core properties
 * - Groups can be mixed: Basic + Spin, Core + Orbit, Core + Spin + Orbit, etc.
 * - transformConfig() below flattens this structure into LayerConfigEntry
 */
type ConfigYuzhaEntry = {
  // Core properties (always at top level)
  LayerID: string;
  ImageID: string;
  renderer: "2D" | "3D";
  LayerOrder: number;
  ImageScale?: number[]; // Moved to top level (was in Basic Config)

  // Optional grouped configurations
  groups?: {
    [groupName: string]: {
      // Basic Config properties
      position?: number[];
      BasicStagePoint?: number[];
      BasicImagePoint?: number[];
      BasicImageAngle?: number; // Renamed from BasicAngleImage

      // Spin Config properties
      spinStagePoint?: number[];
      spinImagePoint?: number[];
      spinSpeed?: number;
      spinDirection?: "cw" | "ccw";

      // Orbital Config properties
      orbitStagePoint?: number[];
      orbitLinePoint?: number[];
      orbitImagePoint?: number[];
      orbitLine?: boolean;
      orbitOrient?: boolean;
      orbitSpeed?: number;
      orbitDirection?: "cw" | "ccw";

    };
  };
};

/**
 * Transform grouped JSON structure to flat LayerConfigEntry format
 *
 * This function:
 * 1. Extracts core properties from top level (LayerID, ImageID, LayerOrder, ImageScale, renderer)
 * 2. Merges group properties in priority order: Basic ? Spin ? Orbital
 * 3. Applies special merge rules (e.g., Spin overrides Basic positioning when active)
 *
 * Merge Priority (later groups override earlier ones):
 * 1. Core (LayerID, ImageID, LayerOrder, ImageScale, renderer) - always present
 * 2. Basic Config - static positioning and rotation
 * 3. Spin Config - overrides BasicStagePoint/BasicImagePoint when spinSpeed > 0
 * 4. Orbital Config - orbital motion settings
 *
 * Special Rules:
 * - When spinSpeed > 0: Spin positioning replaces Basic positioning, BasicImageAngle resets to 0
 * - When spinSpeed = 0 or undefined: Spin config is stored but doesn't override Basic positioning
 * - Groups are optional: a layer with only Core properties is valid
 *
 * For future AI agents:
 * - If you add new properties, add them to both types and this merge function
 * - Preserve the merge order to maintain config priority behavior
 * - Test with layers that have: Core only, Core+Spin, Core+Orbital, Core+Spin+Orbital
 *
 * @param raw - Array of ConfigYuzhaEntry from JSON file
 * @returns Array of flattened LayerConfigEntry for runtime use
 */
function transformConfig(raw: ConfigYuzhaEntry[]): LayerConfig {
  return raw.map((entry) => {
    // Step 1: Start with Core properties (always required)
    const merged: Partial<LayerConfigEntry> = {
      LayerID: entry.LayerID,
      ImageID: entry.ImageID,
      renderer: entry.renderer as LayerRenderer,
      LayerOrder: entry.LayerOrder,
      ImageScale: entry.ImageScale, // Now at top level
    };

    // Step 2: Extract config groups (all are optional)
    const groups = entry.groups || {};
    const basic = groups["Basic Config"] || {};
    const spin = groups["Spin Config"] || {};
    const orbital = groups["Orbital Config"] || {};

    // Step 3: Merge Basic Config (static positioning and rotation)
    // These provide default positioning when no animation is active
    Object.assign(merged, basic);

    // Step 4: Merge Spin Config with special rules
    if (spin.spinSpeed && spin.spinSpeed > 0) {
      // Active spin: override positioning and reset static rotation
      Object.assign(merged, spin);

      // Spin positioning replaces Basic positioning
      if (spin.spinStagePoint) merged.BasicStagePoint = spin.spinStagePoint;
      if (spin.spinImagePoint) merged.BasicImagePoint = spin.spinImagePoint;

      // Reset static rotation: spin controls rotation dynamically
      merged.BasicImageAngle = 0;
    } else {
      // Inactive spin: just store spin config for potential future use
      Object.assign(merged, spin);
    }

    // Step 5: Merge Orbital Config
    // Orbital properties are independent and don't override Basic/Spin
    if (orbital.orbitStagePoint) merged.orbitStagePoint = orbital.orbitStagePoint;
    if (orbital.orbitLinePoint) merged.orbitLinePoint = orbital.orbitLinePoint;
    if (orbital.orbitImagePoint) merged.orbitImagePoint = orbital.orbitImagePoint;
    if (orbital.orbitLine !== undefined) merged.orbitLine = orbital.orbitLine;
    if (orbital.orbitOrient !== undefined) merged.orbitOrient = orbital.orbitOrient;
    if (orbital.orbitSpeed !== undefined) merged.orbitSpeed = orbital.orbitSpeed;
    if (orbital.orbitDirection) merged.orbitDirection = orbital.orbitDirection;


    return merged as LayerConfigEntry;
  });
}

/**
 * Validate layer configuration entry for common errors
 *
 * Checks:
 * - Required core properties are present
 * - Numeric values are in valid ranges
 * - No invalid enum values
 *
 * For future AI agents:
 * - Add validation when you add new properties with constraints
 * - Return descriptive error messages (shown in console during dev)
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
 * Only runs in development mode for performance.
 * Logs validation errors to console but doesn't block loading.
 *
 * @param config - Full layer config array
 * @returns Same config (for chaining)
 */
function validateConfig(config: LayerConfig): LayerConfig {
  const IS_DEV = import.meta.env?.DEV ?? true;
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
 * Main config pipeline:
 * 1. Load raw JSON (ConfigYuzhaEntry[])
 * 2. Transform to flat structure (LayerConfigEntry[])
 * 3. Validate entries (development only)
 * 4. Sort by LayerOrder (ascending = background to foreground)
 */
const config: LayerConfig = validateConfig(
  transformConfig(rawConfig as unknown as ConfigYuzhaEntry[])
    .slice()
    .sort((a, b) => (a.LayerOrder ?? 0) - (b.LayerOrder ?? 0)),
);

/**
 * Get the loaded and processed layer configuration
 *
 * For future AI agents:
 * - This is the main entry point used by the layer system
 * - Config is loaded once at module initialization
 * - Returns sorted, validated, flattened config ready for rendering
 *
 * @returns Sorted array of layer configurations
 */
export function loadLayerConfig(): LayerConfig {
  return config;
}

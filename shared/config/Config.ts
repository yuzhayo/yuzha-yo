import rawConfig from "./ConfigYuzha.json";

export type LayerRenderer = "2D" | "3D";

export type LayerConfigEntry = {
  layerId: string;
  renderer: LayerRenderer;
  order: number;
  imageId: string;
  /** Scale as percentage [x, y] (10-500, default 100). Values outside range are clamped. */
  scale?: number[];
  /** @deprecated Use BasicStagePoint and BasicImagePoint instead */
  position?: number[];
  /** Stage anchor point [x, y] in pixels (0-2048). Point on image will be placed here. */
  BasicStagePoint?: number[];
  /** Image point [x, y] as percentage (0-100). This point will be placed at BasicStagePoint. */
  BasicImagePoint?: number[];
  /**
   * Rotation angle in degrees (0-360, default 0°).
   * 0° = original image orientation (no rotation)
   * 90° = rotated 90° counter-clockwise
   * 180° = upside down
   * 270° = rotated 90° clockwise
   * Rotates image around its center (50%, 50%). Separate from position calculation.
   */
  BasicAngleImage?: number;

  // Image mapping config
  /**
   * Angle in degrees defining the "tip" direction of the image (default 90°).
   * Screen-space angle convention: 0° = right, 90° = top, 180° = left, 270° = bottom.
   */
  imageTip?: number;
  /**
   * Angle in degrees defining the "base" direction of the image (default 270°).
   * Can be set independently from imageTip for asymmetric image orientation.
   */
  imageBase?: number;

  // Spin config
  spinStagePoint?: number[]; // [x, y] absolute pixels in stage space (0-2048)
  spinImagePoint?: number[]; // [x, y] percent in image space (0-100)
  spinSpeed?: number; // Degrees per second (0 = no spin)
  spinDirection?: "cw" | "ccw";

  // Orbital config
  orbitCenter?: number[]; // [x, y] stage coordinates (0-2048), default [1024, 1024]
  orbitImagePoint?: number[]; // [x, y] in 0-100% coordinates, default [50, 50]
  orbitRadius?: number; // Pixels (0-2048)
  orbitSpeed?: number; // Degrees per second (0 = no orbit)
  orbitDirection?: "cw" | "ccw";

  // Image Mapping Debug config
  showCenter?: boolean;
  showTip?: boolean;
  showBase?: boolean;
  showStageCenter?: boolean;
  showAxisLine?: boolean;
  showRotation?: boolean;
  showTipRay?: boolean;
  showBaseRay?: boolean;
  showBoundingBox?: boolean;
  centerStyle?: "dot" | "crosshair";
  tipStyle?: "circle" | "arrow";
  baseStyle?: "circle" | "square";
  stageCenterStyle?: "dot" | "crosshair" | "star";
  debugColors?: {
    center?: string;
    tip?: string;
    base?: string;
    stageCenter?: string;
    axisLine?: string;
    rotation?: string;
    tipRay?: string;
    baseRay?: string;
    boundingBox?: string;
  };
};

export type LayerConfig = LayerConfigEntry[];

// New grouped JSON structure
type ConfigYuzhaEntry = {
  layerId: string;
  imageId: string;
  renderer: "2D" | "3D";
  order: number;
  groups: {
    [groupName: string]: {
      scale?: number[];
      position?: number[];
      BasicStagePoint?: number[];
      BasicImagePoint?: number[];
      BasicAngleImage?: number;
      imageTip?: number;
      imageBase?: number;
      spinStagePoint?: number[];
      spinImagePoint?: number[];
      spinSpeed?: number;
      spinDirection?: "cw" | "ccw";
      orbitCenter?: number[];
      orbitImagePoint?: number[];
      orbitRadius?: number;
      orbitSpeed?: number;
      orbitDirection?: "cw" | "ccw";
      showCenter?: boolean;
      showTip?: boolean;
      showBase?: boolean;
      showStageCenter?: boolean;
      showAxisLine?: boolean;
      showRotation?: boolean;
      showTipRay?: boolean;
      showBaseRay?: boolean;
      showBoundingBox?: boolean;
      centerStyle?: "dot" | "crosshair";
      tipStyle?: "circle" | "arrow";
      baseStyle?: "circle" | "square";
      stageCenterStyle?: "dot" | "crosshair" | "star";
      debugColors?: {
        center?: string;
        tip?: string;
        base?: string;
        stageCenter?: string;
        axisLine?: string;
        rotation?: string;
        tipRay?: string;
        baseRay?: string;
        boundingBox?: string;
      };
    };
  };
};

// Transform grouped structure to flat LayerConfigEntry format
function transformConfig(raw: ConfigYuzhaEntry[]): LayerConfig {
  return raw.map((entry) => {
    // Start with top-level identity properties
    const merged: Partial<LayerConfigEntry> = {
      layerId: entry.layerId,
      imageId: entry.imageId,
      renderer: entry.renderer as LayerRenderer,
      order: entry.order,
    };

    // Extract config groups
    const {
      imageTip: _basicImageTip,
      imageBase: _basicImageBase,
      ...basic
    } = entry.groups["Basic Config"] || {};
    const spin = entry.groups["Spin Config"] || {};
    const {
      imageTip: orbitalImageTip,
      imageBase: orbitalImageBase,
      ...orbital
    } = entry.groups["Orbital Config"] || {};
    const debug = entry.groups["Image Mapping Debug"] || {};

    // Start with Basic Config (static positioning and rotation)
    Object.assign(merged, basic);

    // Spin Config overrides when active (spinSpeed > 0)
    if (spin.spinSpeed && spin.spinSpeed > 0) {
      // Merge all spin properties
      Object.assign(merged, spin);
      // Override position: spin positioning replaces basic positioning
      if (spin.spinStagePoint) merged.BasicStagePoint = spin.spinStagePoint;
      if (spin.spinImagePoint) merged.BasicImagePoint = spin.spinImagePoint;
      // Reset static rotation: spin controls rotation (clean slate)
      merged.BasicAngleImage = 0;
    } else {
      // Spin inactive: just copy spin config properties for reference
      Object.assign(merged, spin);
    }

    // Orbital Config
    Object.assign(merged, orbital);

    if (orbitalImageTip !== undefined) {
      merged.imageTip = orbitalImageTip;
    }
    if (orbitalImageBase !== undefined) {
      merged.imageBase = orbitalImageBase;
    }

    // Image Mapping Debug Config (lowest priority, never overrides)
    Object.assign(merged, debug);

    return merged as LayerConfigEntry;
  });
}

/**
 * Validate layer configuration entry for common errors
 * @returns Array of error messages (empty if valid)
 */
export function validateLayerConfig(entry: LayerConfigEntry): string[] {
  const errors: string[] = [];

  // Required fields
  if (!entry.layerId) errors.push(`Missing layerId`);
  if (!entry.imageId) errors.push(`Missing imageId`);
  if (!entry.renderer) errors.push(`Missing renderer`);
  if (entry.order === undefined) errors.push(`Missing order`);

  // Scale range validation
  if (entry.scale) {
    const [sx, sy] = entry.scale;
    if (sx !== undefined && (sx < 10 || sx > 500)) {
      errors.push(`Scale X out of range (10-500): ${sx}`);
    }
    if (sy !== undefined && (sy < 10 || sy > 500)) {
      errors.push(`Scale Y out of range (10-500): ${sy}`);
    }
  }

  // Angle validation
  if (entry.BasicAngleImage !== undefined) {
    if (entry.BasicAngleImage < 0 || entry.BasicAngleImage > 360) {
      errors.push(`BasicAngleImage out of range (0-360): ${entry.BasicAngleImage}`);
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
 */
function validateConfig(config: LayerConfig): LayerConfig {
  const IS_DEV = import.meta.env.DEV;
  if (!IS_DEV) return config; // Skip validation in production for performance

  config.forEach((entry, index) => {
    const errors = validateLayerConfig(entry);
    if (errors.length > 0) {
      console.warn(
        `[Config] Validation errors for layer #${index} (${entry.layerId || "unknown"}):`,
        errors,
      );
    }
  });

  return config;
}

const config: LayerConfig = validateConfig(
  transformConfig(rawConfig as ConfigYuzhaEntry[])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
);

export function loadLayerConfig(): LayerConfig {
  return config;
}

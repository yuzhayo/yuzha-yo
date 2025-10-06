import rawConfig from "./ConfigYuzha.json";

export type LayerRenderer = "2D" | "3D";

export type LayerConfigEntry = {
  layerId: string;
  renderer: LayerRenderer;
  order: number;
  imageId: string;
  /** Scale as percentage [x, y] (10-500, default 100). Values outside range are clamped. */
  scale?: number[];
  position?: number[];

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
  groups: {
    [groupName: string]: {
      renderer?: string;
      order?: number;
      imageId?: string;
      scale?: number[];
      position?: number[];
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
    // Merge all groups into a single config entry
    const merged: Partial<LayerConfigEntry> = { layerId: entry.layerId };

    Object.values(entry.groups).forEach((group) => {
      Object.assign(merged, group);
    });

    return merged as LayerConfigEntry;
  });
}

const config: LayerConfig = transformConfig(rawConfig as ConfigYuzhaEntry[])
  .slice()
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export function loadLayerConfig(): LayerConfig {
  return config;
}

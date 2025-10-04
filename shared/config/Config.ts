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
  angle?: number | number[] | null;

  // Image mapping config
  /**
   * Angle in degrees defining the "tip" direction of the image (default 90°).
   * Screen-space angle convention: 0° = right, 90° = top, 180° = left, 270° = bottom.
   * The "base" is automatically calculated as 180° opposite the tip.
   */
  imageTip?: number;

  // Spin config
  spinCenter?: number[]; // [x, y] in 0-100% coordinates
  spinSpeed?: number; // Degrees per second (0 = no spin)
  spinDirection?: "cw" | "ccw";
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
      angle?: number | number[] | null;
      imageTip?: number;
      spinCenter?: number[];
      spinSpeed?: number;
      spinDirection?: "cw" | "ccw";
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

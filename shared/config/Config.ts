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

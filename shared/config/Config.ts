import rawConfig from "./ConfigYuzha.json";

export type LayerRenderer = "2D" | "3D";

export type LayerConfigEntry = {
  layerId: string;
  renderer: LayerRenderer;
  order: number;
  imageId: string;
  scale?: number[];
  position?: number[];
  angle?: number | number[] | null;
};

export type LayerConfig = LayerConfigEntry[];

const config: LayerConfig = (rawConfig as LayerConfigEntry[]).slice().sort(
  (a, b) => (a.order ?? 0) - (b.order ?? 0),
);

export function loadLayerConfig(): LayerConfig {
  return config;
}

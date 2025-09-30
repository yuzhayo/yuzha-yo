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
export declare function loadLayerConfig(): LayerConfig;

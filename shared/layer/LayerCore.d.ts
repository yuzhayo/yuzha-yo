import type { LayerConfigEntry } from "../config/Config";
export type Layer2DTransform = {
    position: {
        x: number;
        y: number;
    };
    scale: {
        x: number;
        y: number;
    };
};
export declare function compute2DTransform(entry: LayerConfigEntry, stageSize: number): Layer2DTransform;
export declare function is2DLayer(entry: LayerConfigEntry): boolean;

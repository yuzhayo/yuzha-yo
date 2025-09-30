import type { LayerConfigEntry } from "../config/Config";
export declare function mountCanvasLayers(ctx: CanvasRenderingContext2D, entries: LayerConfigEntry[]): Promise<() => void>;

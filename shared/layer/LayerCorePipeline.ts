import type { UniversalLayerData } from "./LayerCore";

// Pipeline processor function type
export type LayerProcessor = (layer: UniversalLayerData) => UniversalLayerData;

/**
 * Enhanced universal layer data that can include additional properties from processors
 */
export type EnhancedLayerData = UniversalLayerData & {
  // Spin properties (added by LayerCorePipelineSpin)
  spinCenter?: { x: number; y: number };
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";
  currentRotation?: number;

  // Future properties will be added here by other processors
  opacity?: number;
  filters?: string[];
};

/**
 * Run layer data through a pipeline of processors
 * Each processor can add or modify properties
 */
export function runPipeline(
  baseLayer: UniversalLayerData,
  processors: LayerProcessor[],
): EnhancedLayerData {
  let enhanced: EnhancedLayerData = { ...baseLayer };

  for (const processor of processors) {
    enhanced = processor(enhanced) as EnhancedLayerData;
  }

  return enhanced;
}

/**
 * Process multiple layers through the same pipeline
 */
export function processBatch(
  baseLayers: UniversalLayerData[],
  processors: LayerProcessor[],
): EnhancedLayerData[] {
  return baseLayers.map((layer) => runPipeline(layer, processors));
}

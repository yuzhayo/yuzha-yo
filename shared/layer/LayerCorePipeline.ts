import type { UniversalLayerData } from "./LayerCore";

// Pipeline processor function type - now accepts optional timestamp and returns EnhancedLayerData
export type LayerProcessor = (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;

/**
 * Enhanced universal layer data that can include additional properties from processors
 *
 * Base properties (from UniversalLayerData):
 * - imageMapping: Calculated by LayerCorePipelineImageMapping.computeImageMapping() in LayerCore.prepareLayer()
 *   Contains image geometry (center, tip, base, dimensions, axis angle, rotation, center offset)
 *
 * Processor-added properties:
 */
export type EnhancedLayerData = UniversalLayerData & {
  // Spin properties (added by LayerCorePipelineSpin)
  spinCenter?: { x: number; y: number };
  spinSpeed?: number;
  spinDirection?: "cw" | "ccw";
  currentRotation?: number;
  hasSpinAnimation?: boolean;

  // Orbital properties (added by LayerCorePipelineOrbital)
  orbitCenter?: { x: number; y: number };
  orbitImagePoint?: { x: number; y: number };
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
  currentOrbitAngle?: number;
  orbitRotation?: number;
  hasOrbitalAnimation?: boolean;
  visible?: boolean;

  // Future properties will be added here by other processors
  opacity?: number;
  filters?: string[];
};

/**
 * Run layer data through a pipeline of processors
 * Each processor can add or modify properties
 * @param baseLayer - The base layer data
 * @param processors - Array of processors to apply
 * @param timestamp - Optional timestamp for time-based processors
 */
export function runPipeline(
  baseLayer: UniversalLayerData,
  processors: LayerProcessor[],
  timestamp?: number,
): EnhancedLayerData {
  let enhanced: EnhancedLayerData = { ...baseLayer };

  for (const processor of processors) {
    enhanced = processor(enhanced, timestamp);
  }

  return enhanced;
}

/**
 * Process multiple layers through the same pipeline
 */
export function processBatch(
  baseLayers: UniversalLayerData[],
  processors: LayerProcessor[],
  timestamp?: number,
): EnhancedLayerData[] {
  return baseLayers.map((layer) => runPipeline(layer, processors, timestamp));
}

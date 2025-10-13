import type { UniversalLayerData } from "./LayerCore";
import type {
  ImageMappingDebugVisuals,
  ImageMappingDebugConfig,
} from "./LayerCorePipelineImageMappingUtils";

// Pipeline processor function type - now accepts optional timestamp and returns EnhancedLayerData
export type LayerProcessor = (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;

/**
 * Enhanced universal layer data that can include additional properties from processors
 *
 * Base properties (from UniversalLayerData):
 * - imageMapping: Calculated by LayerCorePipelineImageMapping.computeImageMapping() in LayerCore.prepareLayer()
 *   Contains image geometry (center, tip, base, dimensions, axis angle, rotation, center offset)
 * - calculation: Precomputed coordinate aliases (stage/image/percent) for center, tip, base, spin, and orbit points
 *   - spinPoint resolved from config spinStagePoint (stage pixels) and spinImagePoint (image percent) with fallbacks
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
  spinStagePoint?: { x: number; y: number };
  spinPercent?: { x: number; y: number };

  // Orbital properties (added by LayerCorePipelineOrbital)
  orbitStagePoint?: { x: number; y: number };
  orbitLinePoint?: { x: number; y: number };
  orbitLineVisible?: boolean;
  orbitImagePoint?: { x: number; y: number };
  orbitRadius?: number;
  orbitOrient?: boolean;
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
  currentOrbitAngle?: number;
  hasOrbitalAnimation?: boolean;
  visible?: boolean;
  orbitPoint?: { x: number; y: number };
  orbitLineStyle?: {
    radius: number;
    visible: boolean;
  };

  // Image Mapping Debug properties (added by LayerCorePipelineImageMappingDebug)
  imageMappingDebugVisuals?: ImageMappingDebugVisuals;
  imageMappingDebugConfig?: Partial<ImageMappingDebugConfig>;

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

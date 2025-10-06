import type { UniversalLayerData } from "./LayerCore";
import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";
import {
  generateImageMappingDebugVisuals,
  type ImageMappingDebugConfig,
  type ImageMappingDebugVisuals,
} from "./LayerCorePipelineImageMappingUtils";

export type ImageMappingDebugProcessorConfig = ImageMappingDebugConfig;

/**
 * Create an Image Mapping Debug processor with the given configuration
 * This processor generates debug visuals for imageTip, imageBase, and imageCenter
 */
export function createImageMappingDebugProcessor(
  config: Partial<ImageMappingDebugProcessorConfig>,
): LayerProcessor {
  // If no debug options are enabled, return passthrough processor
  const hasAnyDebug =
    config.showCenter ||
    config.showTip ||
    config.showBase ||
    config.showStageCenter ||
    config.showAxisLine ||
    config.showRotation ||
    config.showTipRay ||
    config.showBaseRay ||
    config.showBoundingBox;

  if (!hasAnyDebug) {
    return (layer: UniversalLayerData): EnhancedLayerData => layer as EnhancedLayerData;
  }

  return (layer: UniversalLayerData): EnhancedLayerData => {
    // Generate debug visuals based on config
    const debugVisuals: ImageMappingDebugVisuals = generateImageMappingDebugVisuals(layer, config);

    return {
      ...layer,
      imageMappingDebugVisuals: debugVisuals,
      imageMappingDebugConfig: config,
    } as EnhancedLayerData;
  };
}

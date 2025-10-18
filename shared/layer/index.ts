/**
 * ============================================================================
 * LAYER MODULE EXPORTS
 * ============================================================================
 *
 * This file exports the core layer processing modules.
 *
 * NOTE FOR FUTURE AI AGENTS:
 * - LayerEngines.ts has been DELETED - rendering logic moved to stage renderers
 * - StagePipeline.ts has been DELETED - merged into StageSystem
 * - For stage rendering, import from @shared/stage/StageSystem instead
 *
 * @module layer/index
 */

export * from "./LayerCore";
export * from "./LayerCorePipeline";
export * from "./LayerCorePipelineSpin";
export * from "./LayerCorePipelineOrbital";
export * from "./LayerCorePipelineImageMappingUtils";
export * from "./pipeline/ProcessorRegistry";

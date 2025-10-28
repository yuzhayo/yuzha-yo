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
 * - LayerCorePipeline.ts and ProcessorRegistry.ts have been MERGED into layer.ts
 * - For stage rendering, import from @shared/stage/StageSystem instead
 *
 * @module layer/index
 */

export * from "./layerCore";
export * from "./layerBasic";
export * from "./layerSpin";
export * from "./layerOrbit";
export * from "./layer";
export * from "./clockTime";

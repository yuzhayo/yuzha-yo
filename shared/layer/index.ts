/**
 * ============================================================================
 * LAYER MODULE EXPORTS
 * ============================================================================
 *
 * This file exports ALL layer-related modules now consolidated under shared/layer/.
 *
 * IMPORTANT FOR FUTURE AI AGENTS:
 * -------------------------------
 * All layer-related functionality has been consolidated into shared/layer/:
 * - Config.ts (previously shared/config/) - Layer configuration
 * - StageSystem.ts (previously shared/stage/) - Coordinate system & pipeline
 * - StageCanvas.tsx (previously shared/stage/) - Canvas 2D renderer
 * - StageThree.tsx (previously shared/stage/) - Three.js WebGL renderer
 * - layerMotion.ts (previously shared/motion/) - Motion processing
 * - layerCore.ts - Layer data preparation
 * - layer.ts - Processor pipeline
 * - layerBasic.ts - Math utilities
 * - clockTime.ts - Time/clock calculations
 *
 * OLD STRUCTURE (deprecated):
 * - shared/config/Config.ts → shared/layer/Config.ts
 * - shared/stage/StageSystem.ts → shared/layer/StageSystem.ts
 * - shared/motion/layerMotion.ts → shared/layer/layerMotion.ts
 *
 * @module layer/index
 */

// Core layer types and data preparation
export * from "./layerCore";
export * from "./layerBasic";
export * from "./layer";
export * from "./clockTime";

// Configuration
export * from "./Config";

// Stage system and renderers
export * from "./StageSystem";
export { default as StageCanvas } from "./StageCanvas";
export { default as StageThree } from "./StageThree";

// Motion processing
export * from "./layerMotion";

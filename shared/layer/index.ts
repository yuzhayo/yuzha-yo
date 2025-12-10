/**
 * ============================================================================
 * LAYER MODULE - Barrel Export
 * ============================================================================
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This is the SINGLE ENTRY POINT for all layer system functionality.
 * Import from this file instead of individual modules to maintain clean
 * dependency boundaries and make refactoring easier.
 *
 * ARCHITECTURE AFTER REFACTORING (2025):
 * ---------------------------------------
 * The layer system is now organized into THREE focused modules:
 *
 * 1. model.ts - Types, interfaces, and configuration
 *    - All type definitions (Point2D, LayerConfig, etc.)
 *    - Configuration loading (loadLayerConfig)
 *    - Clock/time types and constants
 *    - NO runtime code, NO dependencies (except JSON imports)
 *
 * 2. math.ts - Pure calculation functions
 *    - Coordinate transformations (image ↔ stage, pixel ↔ percent)
 *    - Angle calculations and normalizations
 *    - Time/clock calculations
 *    - Validation and sanitization
 *    - Imports only types from model.ts
 *    - ALL functions are pure (no side effects)
 *
 * 3. engine.ts - Runtime execution and processing
 *    - Asset loading and resolution
 *    - Image mapping computation
 *    - Layer preparation (prepareLayer, etc.)
 *    - Motion processor building (buildLayerMotion)
 *    - Processor registry (registerProcessor, getProcessorsForEntry)
 *    - Pipeline execution (runPipeline, processBatch)
 *    - Animation utilities
 *    - Performance utilities (caching, batching)
 *    - Imports types from model.ts, functions from math.ts
 *
 * OLD STRUCTURE (DELETED):
 * -------------------------
 * - layerBasic.ts → math.ts (coordinate transformations)
 * - layerCore.ts → engine.ts (asset loading, layer preparation)
 * - layerMotion.ts → engine.ts (motion processing)
 * - layer.ts → engine.ts (processor registry, pipeline)
 *
 * HOW TO USE THIS MODULE:
 * -----------------------
 * ```typescript
 * // Import everything you need from the barrel export
 * import {
 *   // Types from model.ts
 *   Point2D,
 *   LayerConfig,
 *   UniversalLayerData,
 *
 *   // Config loading from model.ts
 *   loadLayerConfig,
 *
 *   // Math functions from math.ts
 *   imagePointToStagePoint,
 *   normalizeAngle,
 *
 *   // Runtime functions from engine.ts
 *   prepareLayer,
 *   buildLayerMotion,
 *   runPipeline,
 * } from "@shared/layer";
 * ```
 *
 * DEPENDENCY FLOW:
 * ----------------
 * model.ts ← math.ts ← engine.ts ← index.ts (this file) ← consumers
 *   ↑          ↑          ↑
 *   |          |          |
 * types    functions   runtime
 *
 * @module layer/index
 */

// ============================================================================
// MODEL EXPORTS - Types, Interfaces, and Configuration
// ============================================================================

export type {
  // Geometric primitives
  Point2D,
  PercentPoint,
  CoordinateBundle,
  DualSpaceCoordinate,
  OrbitCoordinate,
  Layer2DTransform,

  // Layer data types
  ImageMapping,
  LayerCalculationPoints,
  UniversalLayerData,
  BaseLayerState,
  SpinPreparationState,
  OrbitPreparationState,

  // Configuration types
  LayerRenderer,
  LayerConfigEntry,
  LayerConfig,

  // Clock/Time types
  RotationDirection,
  ClockSpeedAlias,
  TimeFormat,
  DirectionSign,
  ClockSpeedValue,
  ClockSpeedSetting,
  ClockMotionConfig,
  ResolvedClockSpeed,

  // Processor & motion types
  LayerProcessor,
  ProcessorContext,
  EnhancedLayerData,
  LayerMotionMarker,
  LayerMotionArtifacts,
} from "./model";

export {
  // Configuration loading
  loadLayerConfig,
  validateLayerConfig,

  // Clock constants
  CLOCK_DEFAULTS,
  CLOCK_SPEED_ALIASES,
} from "./model";

// ============================================================================
// MATH EXPORTS - Pure Calculation Functions
// ============================================================================

export {
  // Coordinate transformations
  imagePointToStagePoint,
  stagePointToImagePoint,
  imagePointToPercent,
  imagePercentToImagePoint,
  stagePointToPercent,
  stagePercentToStagePoint,
  getImageCenter,

  // Pivot-based positioning
  calculatePositionForPivot,

  // Coordinate bundles
  createCoordinateBundle,
  createDualSpaceCoordinate,

  // Validation & sanitization
  validatePoint,
  validateScale,
  validateDimensions,

  // Normalization utilities
  normalizePercent,
  normalizePair,
  normalizePercentInput,
  normalizeStagePointInput,
  clampedPercentToScale,

  // Angle & rotation math
  AnimationConstants,
  degreesToRadians,
  radiansToDegrees,
  normalizeAngle,
  applyRotationDirection,
  calculateAngleToPoint,
  calculateOrbitPosition,
  calculateOrbitalVisibility,
  isPointInBounds,

  // Clock/time functions
  toDirectionSign,
  parseTimezoneOffset,
  resolveTimezoneOffset,
  resolveClockSpeed,
  calculateRotationDegrees,

  // Easing utilities
  easeInOutQuad,
  easeOutElastic,
  easeOutBounce,
} from "./math";

// ============================================================================
// ENGINE EXPORTS - Runtime Execution & Processing
// ============================================================================

export type {
  // Performance types
  LayerBatch,
} from "./engine";

export {
  // Asset loading
  resolveAssetPath,
  resolveAssetUrl,
  preloadCriticalAssets,
  loadImage,

  // Image mapping
  computeImageMapping,

  // Layer preparation
  prepareBasicState,
  prepareSpinState,
  prepareOrbitState,
  prepareLayer,
  is2DLayer,
  compute2DTransform,

  // Processor registry
  registerProcessor,
  unregisterProcessor,
  clearProcessors,
  listRegisteredProcessors,
  resolveProcessorsForEntry,
  getProcessorsForEntry,

  // Pipeline execution
  runPipeline,
  processBatch,

  // Animation utilities
  calculateElapsedTime,

  // Performance utilities
  PipelineCache,
  createPipelineCache,
  StaticLayerBuffer,
  batchLayersByAnimation,
} from "./engine";

// ============================================================================
// MOTION EXPORTS - Motion builder utilities
// ============================================================================

export { buildLayerMotion } from "./motion";

// ============================================================================
// STAGE SYSTEM & RENDERERS
// ============================================================================
// These remain in separate files for size/complexity reasons but are
// re-exported here for convenience

export * from "./StageSystem";
export { default as StageCanvas } from "./StageCanvas";
export { default as StageThree } from "./StageThree";

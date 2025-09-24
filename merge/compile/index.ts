/**
 * index.ts - Animation Framework Main Export
 * Unified export from best-of-best implementations
 */

// Core Types
export type {
  Vec2,
  LibraryConfig,
  LibraryConfigNormalized,
  LayerConfig,
  LayerConfigNormalized,
  StageConfig,
  StageConfigNormalized,
  SpinConfig,
  OrbitConfig,
  ClockConfig,
  EffectConfig,
  ProcessingContext,
  LayerData,
  AssetRef,
  AssetMeta,
  RenderQuality,
  DeviceTier,
  PerformanceMetrics,
  StageObject,
  StageCoordinates,
  StageEvent,
} from "./LayerSystemTypes";

// Animation Logic Core
export {
  normalize360,
  clamp,
  clamp01,
  toRad,
  toDeg,
  computeBasicState,
  computeSpinState,
  getSpinAngleDeg,
  computeOrbitState,
  computeClockState,
  getClockDrivenImageAngle,
  resolveFinalAngle,
} from "./LayerLogicCore";

// Animation Pipeline
export type { Renderable, ProduceInput, ProduceOutput, EffectState } from "./LayerProducerMain";

export {
  produceFrame,
  produceLayers,
  produceBasic,
  produceBasicSpin,
  computeEffectState,
  applyEffectToRenderable,
} from "./LayerProducerMain";

// Validation and Normalization
export type { ValidationError, ValidationWarning, ValidationResult } from "./LayerValidatorUtils";

export {
  validateLibraryConfig,
  validateStageConfig,
  validateLayerConfig,
  validateOrThrow,
  createDefaultLayerConfig,
  createDefaultLibraryConfig,
} from "./LayerValidatorUtils";

// Rendering Engine
export { StagesEngineCore } from "./StagesEngineCore";

// Convenience re-exports for common use cases
import { produceFrame as pf, produceLayers as pl } from "./LayerProducerMain";

import {
  validateOrThrow as vo,
  createDefaultLayerConfig as cdlc,
  createDefaultLibraryConfig as cdlic,
} from "./LayerValidatorUtils";

import { normalize360 as n360, clamp as c, clamp01 as c01 } from "./LayerLogicCore";

import { StagesEngineCore as sec } from "./StagesEngineCore";

export const AnimationFramework = {
  // Core pipeline
  produceFrame: pf,
  produceLayers: pl,

  // Validation
  validateOrThrow: vo,

  // Engine
  StagesEngineCore: sec,

  // Utilities
  normalize360: n360,
  clamp: c,
  clamp01: c01,

  // Factory functions
  createDefaultLayerConfig: cdlc,
  createDefaultLibraryConfig: cdlic,
} as const;

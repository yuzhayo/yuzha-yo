/**
 * LayerValidatorUtils.ts - Configuration Validation and Normalization
 * Best implementation combining source2's validation with source3's comprehensive defaults
 */

import type {
  LibraryConfig,
  LibraryConfigNormalized,
  LayerConfig,
  LayerConfigNormalized,
  StageConfig,
  StageConfigNormalized,
  Vec2,
  AssetRef,
  BehaviorsConfigNormalized,
  EffectConfig,
} from "./LayerSystemTypes";

/* ==============================
 * Validation Results
 * ============================== */

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  normalized?: T | undefined;
  errors?: ValidationError[] | undefined;
  warnings?: ValidationWarning[] | undefined;
}

/* ==============================
 * Math Utilities
 * ============================== */

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value);
}

function normalize360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/* ==============================
 * Stage Validation
 * ============================== */

export function validateStageConfig(config: StageConfig): ValidationResult<StageConfigNormalized> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Default values
  const normalized: StageConfigNormalized = {
    width: 2048,
    height: 2048,
    origin: "center",
  };

  // Validate width
  if (config.width !== undefined) {
    if (!isFiniteNumber(config.width) || config.width <= 0) {
      errors.push({
        path: "stage.width",
        message: "Width must be a positive number",
        code: "INVALID_WIDTH",
      });
    } else {
      normalized.width = Math.round(config.width);
    }
  }

  // Validate height
  if (config.height !== undefined) {
    if (!isFiniteNumber(config.height) || config.height <= 0) {
      errors.push({
        path: "stage.height",
        message: "Height must be a positive number",
        code: "INVALID_HEIGHT",
      });
    } else {
      normalized.height = Math.round(config.height);
    }
  }

  // Validate origin
  if (config.origin !== undefined) {
    if (config.origin !== "center" && config.origin !== "top-left") {
      errors.push({
        path: "stage.origin",
        message: "Origin must be 'center' or 'top-left'",
        code: "INVALID_ORIGIN",
      });
    } else {
      normalized.origin = config.origin;
    }
  }

  return {
    ok: errors.length === 0,
    normalized: errors.length === 0 ? normalized : undefined,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/* ==============================
 * Layer Validation
 * ============================== */

function validateVec2(
  value: unknown,
  path: string,
  defaultValue: Vec2,
): { value: Vec2; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!value || typeof value !== "object") {
    return { value: defaultValue, errors };
  }

  const obj = value as any;
  const result: Vec2 = { ...defaultValue };

  if (obj.x !== undefined) {
    if (isFiniteNumber(obj.x)) {
      result.x = obj.x;
    } else {
      errors.push({
        path: `${path}.x`,
        message: "X coordinate must be a finite number",
        code: "INVALID_COORDINATE",
      });
    }
  }

  if (obj.y !== undefined) {
    if (isFiniteNumber(obj.y)) {
      result.y = obj.y;
    } else {
      errors.push({
        path: `${path}.y`,
        message: "Y coordinate must be a finite number",
        code: "INVALID_COORDINATE",
      });
    }
  }

  return { value: result, errors };
}

function normalizeAssetRef(config: LayerConfig): AssetRef {
  if (config.imagePath) {
    return { type: "path", path: config.imagePath };
  }
  if (config.registryKey) {
    return { type: "registry", key: config.registryKey };
  }
  return { type: "path", path: "" };
}

function normalizeBehaviors(config: LayerConfig): BehaviorsConfigNormalized {
  return {
    spin: {
      enabled: config.behaviors?.spin?.enabled ?? false,
      speedDegPerSec: config.behaviors?.spin?.speedDegPerSec ?? 0,
      periodSec: config.behaviors?.spin?.periodSec,
      direction: config.behaviors?.spin?.direction ?? "cw",
      offsetDeg: config.behaviors?.spin?.offsetDeg ?? 0,
      epochMs: config.behaviors?.spin?.epochMs ?? 0,
      startDelayMs: config.behaviors?.spin?.startDelayMs ?? 0,
      durationMs: config.behaviors?.spin?.durationMs,
    },
    orbit: {
      enabled: config.behaviors?.orbit?.enabled ?? false,
      orbitCenter: config.behaviors?.orbit?.orbitCenter,
      radiusPx: config.behaviors?.orbit?.radiusPx,
      startAngleDeg: config.behaviors?.orbit?.startAngleDeg,
      speedDegPerSec: config.behaviors?.orbit?.speedDegPerSec ?? 0,
      periodSec: config.behaviors?.orbit?.periodSec,
      direction: config.behaviors?.orbit?.direction ?? "cw",
      orbitAngleOffsetDeg: config.behaviors?.orbit?.orbitAngleOffsetDeg ?? 0,
      epochMs: config.behaviors?.orbit?.epochMs ?? 0,
      orientationMode: config.behaviors?.orbit?.orientationMode ?? "inheritSpin",
      startDelayMs: config.behaviors?.orbit?.startDelayMs ?? 0,
      durationMs: config.behaviors?.orbit?.durationMs,
    },
    pulse: {
      enabled: config.behaviors?.pulse?.enabled ?? false,
      amplitude: config.behaviors?.pulse?.amplitude ?? 0.1,
      rpm: config.behaviors?.pulse?.rpm ?? 60,
    },
    fade: {
      enabled: config.behaviors?.fade?.enabled ?? false,
      from: config.behaviors?.fade?.from ?? 0,
      to: config.behaviors?.fade?.to ?? 1,
      rpm: config.behaviors?.fade?.rpm ?? 60,
    },
    clock: {
      enabled: config.behaviors?.clock?.enabled ?? false,
      timezone: config.behaviors?.clock?.timezone,
      tickMode: config.behaviors?.clock?.tickMode ?? "smooth",
      timeFormat: config.behaviors?.clock?.timeFormat ?? 12,
      imageSpin: config.behaviors?.clock?.imageSpin ?? "none",
      imageTipAngle360: config.behaviors?.clock?.imageTipAngle360 ?? 0,
      imageBaseAngle360: config.behaviors?.clock?.imageBaseAngle360 ?? 180,
      clockCenter: config.behaviors?.clock?.clockCenter,
      centerBaseRadius: config.behaviors?.clock?.centerBaseRadius ?? 100,
    },
  };
}

function normalizeEffects(config: LayerConfig): EffectConfig {
  return {
    enabled: config.effects?.enabled ?? false,
    allowAngleNudge: config.effects?.allowAngleNudge ?? false,
    units: config.effects?.units ?? [],
  };
}

export function validateLayerConfig(
  config: LayerConfig,
  index: number,
): ValidationResult<LayerConfigNormalized> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const path = `layers[${index}]`;

  // Required fields
  if (!config.layerId || typeof config.layerId !== "string") {
    errors.push({
      path: `${path}.layerId`,
      message: "Layer ID is required and must be a string",
      code: "MISSING_LAYER_ID",
    });
  }

  // Asset reference validation
  const assetRef = normalizeAssetRef(config);
  if (assetRef.type === "path" && !assetRef.path) {
    warnings.push({
      path: `${path}.imagePath`,
      message: "No image path or registry key provided",
      code: "MISSING_ASSET",
    });
  }

  // Position validation
  const { value: position, errors: posErrors } = validateVec2(config.position, `${path}.position`, {
    x: 0,
    y: 0,
  });
  errors.push(...posErrors);

  // Scale validation
  let scale: Vec2 = { x: 1, y: 1 };
  if (config.scale !== undefined) {
    if (typeof config.scale === "number") {
      if (isFiniteNumber(config.scale)) {
        scale = { x: config.scale, y: config.scale };
      } else {
        errors.push({
          path: `${path}.scale`,
          message: "Scale must be a finite number",
          code: "INVALID_SCALE",
        });
      }
    } else {
      const { value: scaleVec, errors: scaleErrors } = validateVec2(config.scale, `${path}.scale`, {
        x: 1,
        y: 1,
      });
      scale = scaleVec;
      errors.push(...scaleErrors);
    }
  }

  // Build normalized config
  const normalized: LayerConfigNormalized = {
    layerId: config.layerId || `layer_${index}`,
    enabled: config.enabled ?? true,
    assetRef,

    position,
    scale,
    angle: normalize360(config.angle ?? 0),
    tilt: config.tilt ?? { x: 0, y: 0 },
    anchor: config.anchor ?? { x: 0.5, y: 0.5 },
    opacity: clamp01(config.opacity ?? 1),
    visible: config.visible ?? true,
    zIndex: config.zIndex ?? 0,
    imageTipAngle360: normalize360(config.imageTipAngle360 ?? 0),
    imageBaseAngle360: normalize360(config.imageBaseAngle360 ?? 180),

    behaviors: normalizeBehaviors(config),

    container:
      config.layerWidth || config.layerHeight
        ? {
            width: config.layerWidth,
            height: config.layerHeight,
            fitMode: config.fitMode ?? "contain",
            alignment: config.alignment ?? "center",
          }
        : undefined,

    effects: normalizeEffects(config),
  };

  return {
    ok: errors.length === 0,
    normalized: errors.length === 0 ? normalized : undefined,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/* ==============================
 * Library Validation
 * ============================== */

export function validateLibraryConfig(
  config: LibraryConfig,
): ValidationResult<LibraryConfigNormalized> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate stage
  const stageResult = validateStageConfig(config.stage ?? {});
  if (!stageResult.ok || !stageResult.normalized) {
    errors.push(...(stageResult.errors ?? []));
    return {
      ok: false,
      errors,
      warnings,
    };
  }

  // Validate layers
  if (!Array.isArray(config.layers)) {
    errors.push({
      path: "layers",
      message: "Layers must be an array",
      code: "INVALID_LAYERS",
    });
    return {
      ok: false,
      errors,
      warnings,
    };
  }

  const normalizedLayers: LayerConfigNormalized[] = [];
  for (let i = 0; i < config.layers.length; i++) {
    const layerConfig = config.layers[i];
    if (!layerConfig) continue;
    const layerResult = validateLayerConfig(layerConfig, i);

    if (layerResult.errors) {
      errors.push(...layerResult.errors);
    }
    if (layerResult.warnings) {
      warnings.push(...layerResult.warnings);
    }

    if (layerResult.normalized) {
      normalizedLayers.push(layerResult.normalized);
    }
  }

  // Check for duplicate layer IDs
  const layerIds = new Set<string>();
  for (const layer of normalizedLayers) {
    if (layerIds.has(layer.layerId)) {
      errors.push({
        path: `layers`,
        message: `Duplicate layer ID: ${layer.layerId}`,
        code: "DUPLICATE_LAYER_ID",
      });
    }
    layerIds.add(layer.layerId);
  }

  const normalized: LibraryConfigNormalized = {
    stage: stageResult.normalized,
    layers: normalizedLayers,
  };

  return {
    ok: errors.length === 0,
    normalized: errors.length === 0 ? normalized : undefined,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/* ==============================
 * Convenience Functions
 * ============================== */

/**
 * Validate and normalize configuration, throwing on errors
 */
export function validateOrThrow(config: LibraryConfig): LibraryConfigNormalized {
  const result = validateLibraryConfig(config);

  if (!result.ok || !result.normalized) {
    const errorMsg =
      result.errors?.map((e) => `${e.path}: ${e.message}`).join(", ") || "Validation failed";
    throw new Error(`Configuration validation failed: ${errorMsg}`);
  }

  if (result.warnings && result.warnings.length > 0) {
    console.warn("Configuration warnings:", result.warnings);
  }

  return result.normalized;
}

/**
 * Create a default layer configuration
 */
export function createDefaultLayerConfig(layerId: string): LayerConfig {
  return {
    layerId,
    enabled: true,
    imagePath: "",
    position: { x: 0, y: 0 },
    scale: 1,
    angle: 0,
    opacity: 1,
    visible: true,
    zIndex: 0,
    behaviors: {
      spin: { enabled: false },
      orbit: { enabled: false },
      pulse: { enabled: false },
      fade: { enabled: false },
      clock: { enabled: false },
    },
    effects: {
      enabled: false,
      units: [],
    },
  };
}

/**
 * Create a default library configuration
 */
export function createDefaultLibraryConfig(): LibraryConfig {
  return {
    stage: {
      width: 2048,
      height: 2048,
      origin: "center",
    },
    layers: [],
  };
}

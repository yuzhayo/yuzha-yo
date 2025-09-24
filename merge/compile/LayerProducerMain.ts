/**
 * LayerProducerMain.ts - Animation Pipeline Orchestrator
 * Best implementation from source3 with comprehensive pipeline integration
 */

import {
  computeBasicState,
  getSpinAngleDeg,
  computeOrbitState,
  getClockDrivenImageAngle,
  resolveFinalAngle,
} from "./LayerLogicCore";

import type {
  Vec2,
  LayerConfigNormalized,
  StageConfigNormalized,
  SpinConfig,
  OrbitConfig,
  ClockConfig,
  EffectConfig,
  ProcessingContext,
} from "./LayerSystemTypes";

/* ==============================
 * Output Types
 * ============================== */

export interface Renderable {
  imageUrl: string;
  zIndex: number;
  visible: boolean;
  anchor01: { x: number; y: number };
  imageTipAngle360: number;
  imageBaseAngle360: number;

  positionPx: Vec2;
  scale: Vec2;
  opacity: number;
  finalAngleDeg: number; // 0..360 up=90
  angleSource: "clock" | "spin" | "manual";
}

export interface ProduceInput {
  canvasSizePx: Vec2;
  basic: LayerConfigNormalized;
  behaviors: {
    spin: SpinConfig;
    orbit: OrbitConfig;
    clock: ClockConfig;
  };
  effects: EffectConfig;
}

export interface ProduceOutput {
  renderable: Renderable;
  meta: {
    spinAngle: number | null;
    clockAngle: number | null;
    orbit: {
      center: Vec2;
      radiusPx: number;
      orbitAngleDeg: number;
      orientationFromOrbit: number | null;
      orientationSource: "spin" | "radial" | "tangent" | "none";
    };
  };
}

/* ==============================
 * Effects Implementation
 * ============================== */

export interface EffectState {
  enabled: boolean;
  timeMs: number;
  opacityMul: number;
  scaleMul: Vec2;
  positionAddPx: Vec2;
  angleAddDeg: number;
}

function normalize360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function ease(easing: string | undefined, t: number): number {
  const t01 = clamp01(t);
  switch (easing) {
    case "easeInQuad":
      return t01 * t01;
    case "easeOutQuad":
      return t01 * (2 - t01);
    case "easeInCubic":
      return t01 * t01 * t01;
    case "easeOutCubic": {
      const u = t01 - 1;
      return u * u * u + 1;
    }
    default:
      return t01; // linear
  }
}

export function computeEffectState(cfg: EffectConfig): EffectState {
  const now = Date.now();
  const acc: EffectState = {
    enabled: true,
    timeMs: now,
    opacityMul: 1,
    scaleMul: { x: 1, y: 1 },
    positionAddPx: { x: 0, y: 0 },
    angleAddDeg: 0,
  };

  if (!cfg.enabled) {
    acc.enabled = false;
    return acc;
  }

  for (const unit of cfg.units ?? []) {
    if (unit.enable === false) continue;

    const start = unit.startDelayMs ?? 0;
    const dur = unit.durationMs ?? Number.POSITIVE_INFINITY;
    const t = now - start;
    if (t < 0 || t > dur) continue;

    const mix = unit.mix ?? 1;

    if (unit.type === "fade") {
      const from = unit.from ?? 1;
      const to = unit.to ?? 1;
      let k: number;

      if (dur === Number.POSITIVE_INFINITY) {
        k = clamp01(to);
      } else {
        const tt = clamp01(t / Math.max(1, dur));
        const v = from + (to - from) * ease(unit.easing, tt);
        k = clamp01(v);
      }

      acc.opacityMul *= 1 - mix + mix * k;
    } else if (unit.type === "shake") {
      const posAmp = unit.posAmp ?? { x: 2, y: 2 };
      const angleAmp = unit.angleAmpDeg ?? 0;
      const freq = unit.freqHz ?? 20;

      const bucket = Math.floor(now / (1000 / Math.max(1, freq)));

      // Simple deterministic random
      const rand = (seed: number) => {
        let x = (seed ^ 0x6d2b79f5) >>> 0;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        return (x >>> 0) / 0xffffffff;
      };

      const rx = (rand(bucket) * 2 - 1) * posAmp.x;
      const ry = (rand(bucket + 911) * 2 - 1) * posAmp.y;

      acc.positionAddPx.x += mix * rx;
      acc.positionAddPx.y += mix * ry;

      if (angleAmp !== 0) {
        const ra = (rand(bucket + 1777) * 2 - 1) * angleAmp;
        acc.angleAddDeg += mix * ra;
      }
    }
  }

  acc.opacityMul = Math.max(0, acc.opacityMul);
  return acc;
}

export function applyEffectToRenderable(
  input: {
    positionPx: Vec2;
    scale: Vec2;
    opacity: number;
    finalAngleDeg: number;
  },
  eff: EffectState,
  allowAngleNudge: boolean,
) {
  const outPos: Vec2 = {
    x: input.positionPx.x + eff.positionAddPx.x,
    y: input.positionPx.y + eff.positionAddPx.y,
  };

  const outScale: Vec2 = {
    x: input.scale.x * eff.scaleMul.x,
    y: input.scale.y * eff.scaleMul.y,
  };

  const outOpacity = input.opacity * eff.opacityMul;

  const outAngle = allowAngleNudge
    ? normalize360(input.finalAngleDeg + eff.angleAddDeg)
    : input.finalAngleDeg;

  return {
    positionPx: outPos,
    scale: outScale,
    opacity: outOpacity,
    finalAngleDeg: outAngle,
  };
}

/* ==============================
 * Main Pipeline
 * ============================== */

/**
 * Main animation pipeline that processes a single layer through all transform stages
 */
export function produceFrame(input: ProduceInput): ProduceOutput {
  const { canvasSizePx, basic, behaviors, effects } = input;

  // 1) Basic state computation
  const basicState = computeBasicState(basic, canvasSizePx);

  // 2) Spin calculation (null if not active)
  const spinAngle = getSpinAngleDeg(behaviors.spin);

  // 3) Orbit calculation (updates position + suggests orientation)
  const orbitState = computeOrbitState(behaviors.orbit, basicState.positionPx, {
    spinAngleDeg: spinAngle,
  });

  // 4) Clock calculation (can inherit spin if configured)
  const clockAngle = getClockDrivenImageAngle(behaviors.clock, { inheritSpinDeg: spinAngle });

  // 5) Final angle resolution (priority: Clock > Spin > Manual)
  const finalAngle = resolveFinalAngle(basicState.baseAngleDeg, {
    clockAngleDeg: clockAngle ?? orbitState.orientationDeg,
    spinAngleDeg: spinAngle,
  });

  // 6) Effects processing
  const effectState = computeEffectState(effects);
  const afterEffects = applyEffectToRenderable(
    {
      positionPx: orbitState.positionPx,
      scale: basicState.scale,
      opacity: basicState.opacity,
      finalAngleDeg: finalAngle.angleDeg,
    },
    effectState,
    effects.allowAngleNudge ?? false,
  );

  // 7) Build final renderable
  const renderable: Renderable = {
    imageUrl: basicState.imageUrl,
    zIndex: basicState.zIndex,
    visible: basicState.visible,
    anchor01: basicState.anchor01,
    imageTipAngle360: basicState.imageTipAngle360,
    imageBaseAngle360: basicState.imageBaseAngle360,
    positionPx: afterEffects.positionPx,
    scale: afterEffects.scale,
    opacity: afterEffects.opacity,
    finalAngleDeg: afterEffects.finalAngleDeg,
    angleSource: finalAngle.source,
  };

  return {
    renderable,
    meta: {
      spinAngle,
      clockAngle,
      orbit: {
        center: orbitState.center,
        radiusPx: orbitState.radiusPx,
        orbitAngleDeg: orbitState.orbitAngleDeg,
        orientationFromOrbit: orbitState.orientationDeg,
        orientationSource: orbitState.orientationSource,
      },
    },
  };
}

/* ==============================
 * Batch Processing
 * ============================== */

/**
 * Process multiple layers through the animation pipeline
 */
export function produceLayers(
  layers: LayerConfigNormalized[],
  context: ProcessingContext,
): { layers: ProduceOutput[]; warnings: string[] } {
  const results: ProduceOutput[] = [];
  const warnings: string[] = [];

  for (const layer of layers) {
    try {
      const input: ProduceInput = {
        canvasSizePx: { x: context.stage.width, y: context.stage.height },
        basic: layer,
        behaviors: layer.behaviors,
        effects: layer.effects,
      };

      const output = produceFrame(input);
      results.push(output);
    } catch (error) {
      warnings.push(
        `Layer ${layer.layerId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return { layers: results, warnings };
}

/* ==============================
 * Convenience Producers
 * ============================== */

/**
 * Process only basic transforms (no animations)
 */
export function produceBasic(
  layers: LayerConfigNormalized[],
  context: ProcessingContext,
): { layers: ProduceOutput[]; warnings: string[] } {
  const staticLayers = layers.map((layer) => ({
    ...layer,
    behaviors: {
      ...layer.behaviors,
      spin: { ...layer.behaviors.spin, enabled: false },
      orbit: { ...layer.behaviors.orbit, enabled: false },
      clock: { ...layer.behaviors.clock, enabled: false },
    },
    effects: { ...layer.effects, enabled: false },
  }));

  return produceLayers(staticLayers, context);
}

/**
 * Process with spin only
 */
export function produceBasicSpin(
  layers: LayerConfigNormalized[],
  context: ProcessingContext,
): { layers: ProduceOutput[]; warnings: string[] } {
  const spinOnlyLayers = layers.map((layer) => ({
    ...layer,
    behaviors: {
      ...layer.behaviors,
      orbit: { ...layer.behaviors.orbit, enabled: false },
      clock: { ...layer.behaviors.clock, enabled: false },
    },
    effects: { ...layer.effects, enabled: false },
  }));

  return produceLayers(spinOnlyLayers, context);
}

// LayerProducer.ts
// Compose: LayerBasic → LayerSpin → LayerOrbit → LayerClock → LayerEffect → renderable

import { computeBasicState, resolveFinalAngle, type BasicConfig } from "./LayerLogicBasicTransform";
import { getSpinAngleDeg, type SpinConfig } from "./LayerLogicSpinTransform";
import { computeOrbitState, type OrbitConfig } from "./LayerLogicOrbitTransform";
import { getClockDrivenImageAngle, type ClockConfig } from "./LayerLogicClockTransform";
import { computeEffectState, applyEffectToRenderable, type EffectConfig } from "./LayerLogicEffectTransform";

export type Vec2 = { x: number; y: number };

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
  basic: BasicConfig;
  spin: SpinConfig;
  orbit: OrbitConfig;
  clock: ClockConfig;
  effect: EffectConfig;
}

export interface ProduceOutput {
  renderable: Renderable;
  // telemetry optional (berguna untuk debug/overlay)
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

export function produceFrame(input: ProduceInput): ProduceOutput {
  const { canvasSizePx, basic: basicCfg, spin: spinCfg, orbit: orbitCfg, clock: clockCfg, effect: effectCfg } = input;

  // 1) Basic
  const basic = computeBasicState(basicCfg, canvasSizePx);

  // 2) Spin (null jika tidak aktif)
  const spinAngle = getSpinAngleDeg(spinCfg);

  // 3) Orbit (ubah posisi; juga bisa memberi saran orientasi saat Spin OFF)
  const orbit = computeOrbitState(orbitCfg, basic.positionPx, { spinAngleDeg: spinAngle });

  // 4) Clock (bisa inherit Spin bila imageSpin:"true")
  const clockAngle = getClockDrivenImageAngle(clockCfg, { inheritSpinDeg: spinAngle });

  // 5) Final angle (prioritas: Clock > Spin > Manual; Orbit boleh fallback orientasi)
  const finalAngle = resolveFinalAngle(basic.baseAngleDeg, {
    clockAngleDeg: clockAngle ?? orbit.orientationDeg,
    spinAngleDeg: spinAngle,
  });

  // 6) Effects (opacity/scale/pos/angle nudge optional)
  const eff = computeEffectState(effectCfg);
  const afterEff = applyEffectToRenderable(
    {
      positionPx: orbit.positionPx,
      scale: basic.scale,
      opacity: basic.opacity,
      finalAngleDeg: finalAngle.angleDeg,
    },
    eff,
    effectCfg.allowAngleNudge ?? false
  );

  const renderable: Renderable = {
    imageUrl: basic.imageUrl,
    zIndex: basic.zIndex,
    visible: basic.visible,
    anchor01: basic.anchor01,
    imageTipAngle360: basic.imageTipAngle360,
    imageBaseAngle360: basic.imageBaseAngle360,
    positionPx: afterEff.positionPx,
    scale: afterEff.scale,
    opacity: afterEff.opacity,
    finalAngleDeg: afterEff.finalAngleDeg,
    angleSource: finalAngle.source,
  };

  return {
    renderable,
    meta: {
      spinAngle,
      clockAngle,
      orbit: {
        center: orbit.center,
        radiusPx: orbit.radiusPx,
        orbitAngleDeg: orbit.orbitAngleDeg,
        orientationFromOrbit: orbit.orientationDeg,
        orientationSource: orbit.orientationSource,
      },
    },
  };
}
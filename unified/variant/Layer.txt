LayerProducer.ts — composer/pipeline siap pakai
// LayerProducer.ts
// Compose: LayerBasic → LayerSpin → LayerOrbit → LayerClock → LayerEffect → renderable

import { computeBasicState, resolveFinalAngle, type BasicConfig } from "./LayerLogicBasic";
import { getSpinAngleDeg, type SpinConfig } from "./LayerLogicSpin";
import { computeOrbitState, type OrbitConfig } from "./LayerLogicOrbit";
import { getClockDrivenImageAngle, type ClockConfig } from "./LayerLogicClock";
import { computeEffectState, applyEffectToRenderable, type EffectConfig } from "./LayerLogicEffect";

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

2) index.ts — barrel exports (biar import rapih)
// index.ts
export * from "./LayerLogicBasic";
export * from "./LayerLogicSpin";
export * from "./LayerLogicOrbit";
export * from "./LayerLogicClock";
export * from "./LayerLogicEffect";
export * from "./LayerProducer";

3) (Opsional) LayerConverter.ts — stub mapper JSON ↔ UI value
// LayerConverter.ts
// Simple helpers untuk map JSON ke tipe, tempat bagus untuk validasi ringan.

import type { BasicConfig } from "./LayerLogicBasic";
import type { SpinConfig } from "./LayerLogicSpin";
import type { OrbitConfig } from "./LayerLogicOrbit";
import type { ClockConfig } from "./LayerLogicClock";
import type { EffectConfig } from "./LayerLogicEffect";

export interface AllConfigs {
  basic: BasicConfig;
  spin: SpinConfig;
  orbit: OrbitConfig;
  clock: ClockConfig;
  effect: EffectConfig;
}

export function fromJson(raw: unknown): AllConfigs {
  // Di sini kamu bisa tambahkan zod/valibot kalau mau strict.
  const j = raw as any;
  return {
    basic: j.basic,
    spin: j.spin,
    orbit: j.orbit,
    clock: j.clock,
    effect: j.effect,
  };
}

export function toJson(cfg: AllConfigs): unknown {
  return {
    basic: cfg.basic,
    spin: cfg.spin,
    orbit: cfg.orbit,
    clock: cfg.clock,
    effect: cfg.effect,
  };
}

Cara pakai cepat
import { produceFrame } from "@/logic/LayerProducer";
import basicCfg from "@/config/basic.config.json";
import spinCfg from "@/config/spin.config.json";
import orbitCfg from "@/config/orbit.config.json";
import clockCfg from "@/config/clock.config.json";
import effectCfg from "@/config/effect.config.json";

const { renderable, meta } = produceFrame({
  canvasSizePx: { x: 512, y: 512 },
  basic: basicCfg.basic,
  spin: spinCfg.spin,
  orbit: orbitCfg.orbit,
  clock: clockCfg.clock,
  effect: effectCfg.effect,
});

// → kirim `renderable` ke renderer kamu (Pixi/Three/Canvas/SVG)

basic.config.json
{
  "version": 1,
  "basic": {
    "enable": true,
    "zIndex": 10,
    "imageUrl": "https://cdn.example.com/assets/needle.png",
    "position": { "x": 0.5, "y": 0.5 },
    "positionMode": "fraction",
    "scaleMode": "uniform",
    "scaleUniform": 1,
    "angleDeg": 90,
    "visible": true,
    "opacity": 1,
    "anchorMode": "center",
    "imageTipAngle360": 0,
    "imageBaseAngle360": 180
  },
  "presets": [
    {
      "name": "center-fraction",
      "basic": {
        "enable": true,
        "zIndex": 5,
        "imageUrl": "https://cdn.example.com/sprites/compass.png",
        "position": { "x": 0.5, "y": 0.5 },
        "positionMode": "fraction",
        "scaleMode": "uniform",
        "scaleUniform": 1.2,
        "angleDeg": 45,
        "visible": true,
        "opacity": 1,
        "anchorMode": "center",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180
      }
    },
    {
      "name": "absolute-top-left",
      "basic": {
        "enable": true,
        "zIndex": 1,
        "imageUrl": "/images/logo.png",
        "position": { "x": 32, "y": 32 },
        "positionMode": "absolute",
        "scaleMode": "xy",
        "scaleXY": { "x": 0.8, "y": 0.8 },
        "angleDeg": 0,
        "visible": true,
        "opacity": 0.95,
        "anchorMode": "top-left",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180
      }
    },
    {
      "name": "center-px",
      "basic": {
        "enable": true,
        "zIndex": 10,
        "imageUrl": "https://cdn.example.com/assets/needle.png",
        "position": { "x": 256, "y": 256 },
        "positionMode": "absolute",
        "scaleMode": "uniform",
        "scaleUniform": 1,
        "angleDeg": 90,
        "visible": true,
        "opacity": 1,
        "anchorMode": "center",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180
      }
    }
  ]
}

spin.config.json
{
  "version": 1,
  "spin": {
    "enable": true,
    "speedDegPerSec": 60,
    "direction": "cw",
    "offsetDeg": 0,
    "epochMs": 0,
    "startDelayMs": 0,
    "durationMs": 0
  },
  "presets": [
    {
      "name": "cw-60dps",
      "spin": {
        "enable": true,
        "speedDegPerSec": 60,
        "direction": "cw",
        "offsetDeg": 0
      }
    },
    {
      "name": "ccw-1rev-per-10s",
      "spin": {
        "enable": true,
        "periodSec": 10,
        "direction": "ccw",
        "offsetDeg": 0
      }
    },
    {
      "name": "delayed-5s-then-10s",
      "spin": {
        "enable": true,
        "speedDegPerSec": 90,
        "direction": "cw",
        "startDelayMs": 5000,
        "durationMs": 10000
      }
    },
    {
      "name": "static-enabled",
      "spin": {
        "enable": true,
        "speedDegPerSec": 0,
        "direction": "cw",
        "offsetDeg": 0
      }
    }
  ]
}

orbit.config.json
{
  "version": 1,
  "orbit": {
    "enable": true,
    "orbitCenter": { "x": 256, "y": 256 },
    "radiusPx": 120,
    "startAngleDeg": 90,
    "speedDegPerSec": 30,
    "direction": "cw",
    "orbitAngleOffsetDeg": 0,
    "epochMs": 0,
    "orientationMode": "inheritSpin",
    "startDelayMs": 0,
    "durationMs": 0
  },
  "presets": [
    {
      "name": "inherit-spin-orient",
      "orbit": {
        "enable": true,
        "orbitCenter": { "x": 256, "y": 256 },
        "radiusPx": 100,
        "speedDegPerSec": 45,
        "direction": "cw",
        "orientationMode": "inheritSpin"
      }
    },
    {
      "name": "radial-out-ccw",
      "orbit": {
        "enable": true,
        "orbitCenter": { "x": 320, "y": 240 },
        "radiusPx": 140,
        "periodSec": 8,
        "direction": "ccw",
        "orientationMode": "radial-out"
      }
    },
    {
      "name": "tangent-forward",
      "orbit": {
        "enable": true,
        "orbitCenter": { "x": 256, "y": 256 },
        "radiusPx": 90,
        "speedDegPerSec": 60,
        "direction": "cw",
        "orientationMode": "tangent"
      }
    },
    {
      "name": "auto-infer-center-and-start",
      "orbit": {
        "enable": true,
        "speedDegPerSec": 30,
        "direction": "cw",
        "orientationMode": "inheritSpin"
      }
    }
  ]
}

clock.config.json
{
  "version": 1,
  "clock": {
    "enable": true,
    "timezone": "Asia/Jakarta",
    "tickMode": "smooth",
    "timeFormat": 12,
    "imageSpin": "sec",
    "imageTipAngle360": 0,
    "imageBaseAngle360": 180,
    "clockCenter": { "x": 256, "y": 256 },
    "centerBaseRadius": 100
  },
  "presets": [
    {
      "name": "default-smooth-sec",
      "clock": {
        "enable": true,
        "timezone": "Asia/Jakarta",
        "tickMode": "smooth",
        "timeFormat": 12,
        "imageSpin": "sec",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180,
        "clockCenter": { "x": 256, "y": 256 },
        "centerBaseRadius": 100
      }
    },
    {
      "name": "tick-no-spin",
      "clock": {
        "enable": true,
        "timezone": "Asia/Jakarta",
        "tickMode": "tick",
        "timeFormat": 24,
        "imageSpin": "none",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180,
        "clockCenter": { "x": 200, "y": 200 },
        "centerBaseRadius": 80
      }
    },
    {
      "name": "inherit-spin-from-LayerSpin",
      "clock": {
        "enable": true,
        "timezone": "Asia/Jakarta",
        "tickMode": "smooth",
        "timeFormat": 24,
        "imageSpin": "true",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180,
        "clockCenter": { "x": 256, "y": 256 },
        "centerBaseRadius": 100
      }
    },
    {
      "name": "minute-hand-orientation",
      "clock": {
        "enable": true,
        "timezone": "UTC",
        "tickMode": "smooth",
        "timeFormat": 24,
        "imageSpin": "min",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180,
        "clockCenter": { "x": 320, "y": 240 },
        "centerBaseRadius": 120
      }
    }
  ]
}

effect.config.json
{
  "version": 1,
  "effect": {
    "enable": true,
    "allowAngleNudge": false,
    "units": [
      {
        "type": "fade",
        "from": 0.0,
        "to": 1.0,
        "durationMs": 800,
        "easing": "easeOutCubic",
        "mix": 1
      },
      {
        "type": "pulse",
        "freqHz": 0.8,
        "waveform": "sine",
        "scaleCenter": 1.0,
        "scaleAmp": 0.06,
        "opacityCenter": 1.0,
        "opacityAmp": 0.0,
        "mix": 0.6
      },
      {
        "type": "blink",
        "freqHz": 2,
        "duty": 0.08,
        "onOpacity": 1.0,
        "offOpacity": 0.0,
        "mix": 0.25,
        "startDelayMs": 2000,
        "durationMs": 1000
      },
      {
        "type": "shake",
        "posAmp": { "x": 1.5, "y": 1.5 },
        "angleAmpDeg": 0,
        "freqHz": 18,
        "mix": 0.7
      },
      {
        "type": "wiggle",
        "freqHz": 0.5,
        "waveform": "sine",
        "angleAmpDeg": 3,
        "posAmp": { "x": 0.0, "y": 0.0 },
        "mix": 0.4
      }
    ]
  },
  "presets": [
    {
      "name": "fade-in",
      "effect": {
        "enable": true,
        "allowAngleNudge": false,
        "units": [
          { "type": "fade", "from": 0, "to": 1, "durationMs": 600, "easing": "easeOutCubic" }
        ]
      }
    },
    {
      "name": "breathe",
      "effect": {
        "enable": true,
        "allowAngleNudge": false,
        "units": [
          { "type": "pulse", "freqHz": 0.6, "waveform": "sine", "scaleCenter": 1, "scaleAmp": 0.05, "mix": 1 }
        ]
      }
    },
    {
      "name": "flicker",
      "effect": {
        "enable": true,
        "allowAngleNudge": false,
        "units": [
          { "type": "blink", "freqHz": 8, "duty": 0.5, "onOpacity": 1, "offOpacity": 0.4, "mix": 0.5 }
        ]
      }
    },
    {
      "name": "shake-strong",
      "effect": {
        "enable": true,
        "allowAngleNudge": false,
        "units": [
          { "type": "shake", "posAmp": { "x": 4, "y": 4 }, "angleAmpDeg": 0, "freqHz": 24, "mix": 1 }
        ]
      }
    },
    {
      "name": "wiggle-rot",
      "effect": {
        "enable": true,
        "allowAngleNudge": true,
        "units": [
          { "type": "wiggle", "freqHz": 1, "waveform": "sine", "angleAmpDeg": 5, "mix": 1 }
        ]
      }
    }
  ]
}

(Bonus) configs.all.json — sekali load semua
{
  "version": 1,
  "basic": {
    "enable": true,
    "zIndex": 10,
    "imageUrl": "https://cdn.example.com/assets/needle.png",
    "position": { "x": 0.5, "y": 0.5 },
    "positionMode": "fraction",
    "scaleMode": "uniform",
    "scaleUniform": 1,
    "angleDeg": 90,
    "visible": true,
    "opacity": 1,
    "anchorMode": "center",
    "imageTipAngle360": 0,
    "imageBaseAngle360": 180
  },
  "spin": {
    "enable": true,
    "speedDegPerSec": 60,
    "direction": "cw",
    "offsetDeg": 0,
    "epochMs": 0,
    "startDelayMs": 0,
    "durationMs": 0
  },
  "orbit": {
    "enable": true,
    "orbitCenter": { "x": 256, "y": 256 },
    "radiusPx": 120,
    "startAngleDeg": 90,
    "speedDegPerSec": 30,
    "direction": "cw",
    "orbitAngleOffsetDeg": 0,
    "epochMs": 0,
    "orientationMode": "inheritSpin",
    "startDelayMs": 0,
    "durationMs": 0
  },
  "clock": {
    "enable": true,
    "timezone": "Asia/Jakarta",
    "tickMode": "smooth",
    "timeFormat": 12,
    "imageSpin": "sec",
    "imageTipAngle360": 0,
    "imageBaseAngle360": 180,
    "clockCenter": { "x": 256, "y": 256 },
    "centerBaseRadius": 100
  },
  "effect": {
    "enable": true,
    "allowAngleNudge": false,
    "units": [
      {
        "type": "fade",
        "from": 0.0,
        "to": 1.0,
        "durationMs": 800,
        "easing": "easeOutCubic",
        "mix": 1
      },
      {
        "type": "pulse",
        "freqHz": 0.8,
        "waveform": "sine",
        "scaleCenter": 1.0,
        "scaleAmp": 0.06,
        "opacityCenter": 1.0,
        "opacityAmp": 0.0,
        "mix": 0.6
      }
    ]
  }
}
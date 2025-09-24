// LayerConverter.ts
// Simple helpers untuk map JSON ke tipe, tempat bagus untuk validasi ringan.

import type { BasicConfig } from "./LayerLogicBasicTransform";
import type { SpinConfig } from "./LayerLogicSpinTransform";
import type { OrbitConfig } from "./LayerLogicOrbitTransform";
import type { ClockConfig } from "./LayerLogicClockTransform";
import type { EffectConfig } from "./LayerLogicEffectTransform";

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
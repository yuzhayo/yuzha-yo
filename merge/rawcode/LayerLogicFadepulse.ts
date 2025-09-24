// LayerLogicFade.ts
import type { FadeConfig } from "./LayerTypes";

/**
 * Animasi opacity bolak-balik (sinus) antara from..to.
 * timeSeconds dalam detik, rpm rotations/minute untuk siklus penuh.
 */
export function applyFade(
  prev: { opacity: number },
  cfg: FadeConfig,
  timeSeconds: number,
): { opacity: number } {
  if (!cfg.enabled || cfg.rpm <= 0 || !Number.isFinite(timeSeconds)) {
    return { opacity: prev.opacity };
  }

  const phase = (2 * Math.PI * cfg.rpm * timeSeconds) / 60;
  const t01 = (Math.sin(phase) + 1) / 2; // 0..1
  const value = cfg.from + (cfg.to - cfg.from) * t01;
  const clamped = Math.max(0, Math.min(1, value));
  return { opacity: clamped };
}



// LayerLogicPulse.ts
import type { PulseConfig } from "./LayerTypes";

/**
 * Wrapper behavior pulse: memberi osilasi uniform scale di atas scale dasar.
 */
export function applyPulse(
  prev: { scale: { x: number; y: number } },
  cfg: PulseConfig,
  timeSeconds: number,
): { scale: { x: number; y: number } } {
  if (!cfg.enabled || cfg.rpm <= 0 || cfg.amplitude <= 0 || !Number.isFinite(timeSeconds)) {
    return { scale: { ...prev.scale } };
  }

  const phase = (2 * Math.PI * cfg.rpm * timeSeconds) / 60;
  const s = 1 + cfg.amplitude * Math.sin(phase);

  return {
    scale: {
      x: prev.scale.x * s,
      y: prev.scale.y * s,
    },
  };
}

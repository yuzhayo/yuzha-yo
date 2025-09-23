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

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
  if (
    !cfg.enabled ||
    cfg.rpm <= 0 ||
    cfg.amplitude <= 0 ||
    !Number.isFinite(timeSeconds)
  ) {
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

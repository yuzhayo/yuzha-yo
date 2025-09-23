import type { SpinConfig } from "./LayerTypes";

export function applySpin(
  prev: { angle: number },
  cfg: SpinConfig,
  timeSeconds: number,
): { angle: number } {
  if (!cfg.enabled || cfg.rpm <= 0 || !Number.isFinite(timeSeconds)) {
    return { angle: prev.angle };
  }
  const deltaDeg = (cfg.rpm * 360 * timeSeconds) / 60;
  const signed = cfg.direction === "ccw" ? -deltaDeg : deltaDeg;
  return { angle: prev.angle + signed };
}

import type { ClockConfig } from "./LayerTypes";

export function applyClock(
  prev: { angle: number },
  cfg: ClockConfig,
  timeSeconds: number,
): { angle: number } {
  if (!cfg.enabled || !Number.isFinite(timeSeconds)) {
    return { angle: prev.angle };
  }

  const speed = cfg.speedMultiplier ?? 1;
  const seconds = timeSeconds * speed;

  const delta = (() => {
    switch (cfg.mode) {
      case "hour":
        return ((seconds / 3600) * 30) % 360;
      case "minute":
        return ((seconds / 60) * 6) % 360;
      case "second":
      default:
        return (seconds * 6) % 360;
    }
  })();

  return { angle: prev.angle + delta };
}

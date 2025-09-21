// LayerLogicOrbit.ts
import type { OrbitConfig, Vec2 } from "./LayerTypes";

/**
 * Memindahkan posisi pada lintasan lingkaran dengan radius konstan.
 * - timeSeconds dalam detik
 * - rpm (rotations per minute)
 * - direction: "cw" | "ccw" (fallback "cw")
 */
export function applyOrbit(
  prev: { position: Vec2 },
  cfg: OrbitConfig,
  timeSeconds: number,
  baseCenter: Vec2,
): { position: Vec2 } {
  if (
    !cfg.enabled ||
    cfg.rpm <= 0 ||
    cfg.radius <= 0 ||
    !Number.isFinite(timeSeconds)
  ) {
    return { position: { ...prev.position } };
  }

  const center = cfg.center ?? baseCenter;
  const thetaDeg = (cfg.rpm * 360 * timeSeconds) / 60;
  const dir = (cfg as { direction?: "cw" | "ccw" }).direction ?? "cw";
  const theta = (dir === "ccw" ? -thetaDeg : thetaDeg) * (Math.PI / 180);

  const x = center.x + Math.cos(theta) * cfg.radius;
  const y = center.y + Math.sin(theta) * cfg.radius;

  return { position: { x, y } };
}

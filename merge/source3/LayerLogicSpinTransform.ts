// LayerLogicSpin.ts
// Spin logic for wrapping LayerBasic.
// Angles in degrees 0–360 with "up = 90°", clockwise positive.

export type SpinDirection = "cw" | "ccw";

export interface SpinConfig {
  /** Master enable. If false, this module does nothing (manual angle applies). */
  enable: boolean;

  /**
   * Constant speed in degrees per second (dps).
   * If provided, it takes precedence over `periodSec`.
   */
  speedDegPerSec?: number;

  /**
   * Period in seconds for a full rotation (360°).
   * Used when `speedDegPerSec` is not provided.
   */
  periodSec?: number;

  /** Rotation direction: clockwise ("cw") or counter-clockwise ("ccw"). Default "cw". */
  direction?: SpinDirection;

  /**
   * A static offset added to the computed spin angle.
   * Useful to "point" the sprite initially.
   * Default 0.
   */
  offsetDeg?: number;

  /**
   * Reference epoch for angle=0 (before offset).
   * If omitted, assume 0 at UNIX epoch—doesn't matter as motion is continuous.
   */
  epochMs?: number;

  /**
   * Optional gating window:
   * - startDelayMs: spin starts after this delay
   * - durationMs: spin runs only for this duration (after start)
   * If omitted, spin is continuous when enabled.
   */
  startDelayMs?: number;
  durationMs?: number;
}

export interface SpinState {
  /** Whether the spin is logically enabled (cfg.enable) */
  enabled: boolean;
  /** Whether the spin is currently active considering delay/duration timing */
  active: boolean;
  /** Current spin angle (deg 0–360) if active; otherwise null */
  angleDeg: number | null;
  /** Signed angular velocity (deg/sec), positive for CW, negative for CCW (0 if inactive) */
  angularVelocityDps: number;
  /** Timestamp snapshot used for the computation */
  timeMs: number;
}

/* --------------------------------- Utils --------------------------------- */

export function normalize360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

function signForDir(dir?: SpinDirection): 1 | -1 {
  return dir === "ccw" ? -1 : 1;
}

function resolveSpeedDps(cfg: SpinConfig): number {
  if (typeof cfg.speedDegPerSec === "number" && isFinite(cfg.speedDegPerSec)) {
    return cfg.speedDegPerSec;
  }
  if (typeof cfg.periodSec === "number" && isFinite(cfg.periodSec) && cfg.periodSec > 0) {
    return 360 / cfg.periodSec;
  }
  // Default: stationary even if enabled
  return 0;
}

function isWithinActiveWindow(cfg: SpinConfig, nowMs: number, epochMs: number): boolean {
  const delay = cfg.startDelayMs ?? 0;
  const dur = cfg.durationMs ?? Number.POSITIVE_INFINITY;
  const t = nowMs - epochMs;
  if (t < delay) return false;
  return t < (delay + dur);
}

/* --------------------------------- Core ---------------------------------- */

/**
 * Compute current spin state.
 * The spin angle is:
 *   θ(t) = dirSign * speedDps * (t - epochMs - startDelayMs) + offsetDeg
 * and normalized to 0..360 when active. If outside active window → angle=null.
 */
export function computeSpinState(
  cfg: SpinConfig,
  options?: { nowMs?: number }
): SpinState {
  const nowMs = options?.nowMs ?? Date.now();
  const enabled = !!cfg.enable;
  const epoch = cfg.epochMs ?? 0;
  const dirSign = signForDir(cfg.direction);
  const speed = resolveSpeedDps(cfg) * dirSign;

  if (!enabled) {
    return {
      enabled,
      active: false,
      angleDeg: null,
      angularVelocityDps: 0,
      timeMs: nowMs,
    };
  }

  const active = isWithinActiveWindow(cfg, nowMs, epoch);
  if (!active || speed === 0) {
    // Active=false (window belum mulai / sudah selesai) → angle=null
    return {
      enabled,
      active,
      angleDeg: null,
      angularVelocityDps: 0,
      timeMs: nowMs,
    };
  }

  const delay = cfg.startDelayMs ?? 0;
  const t = Math.max(0, nowMs - epoch - delay); // elapsed since motion start
  const raw = speed * (t / 1000); // deg
  const withOffset = raw + (cfg.offsetDeg ?? 0);
  const angleDeg = normalize360(withOffset);

  return {
    enabled,
    active: true,
    angleDeg,
    angularVelocityDps: speed, // signed
    timeMs: nowMs,
  };
}

/**
 * Convenience: return just the current spin angle for pipeline override.
 * If spin is not active → returns null (use manual angle instead).
 */
export function getSpinAngleDeg(
  cfg: SpinConfig,
  options?: { nowMs?: number }
): number | null {
  return computeSpinState(cfg, options).angleDeg;
}

/**
 * Provide angle for Clock inheritance.
 * Same as getSpinAngleDeg, but named to make intent explicit.
 */
export function getAngleForClockInheritance(
  cfg: SpinConfig,
  options?: { nowMs?: number }
): number | null {
  return getSpinAngleDeg(cfg, options);
}
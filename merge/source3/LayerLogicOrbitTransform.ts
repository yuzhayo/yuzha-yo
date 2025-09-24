// LayerLogicOrbit.ts
// Orbit logic wrapping LayerBasic.
// Angles in degrees 0–360 with "up = 90°", clockwise positive.

export type OrbitDirection = "cw" | "ccw";
export type OrientationMode = "inheritSpin" | "radial-out" | "radial-in" | "tangent";

export interface Vec2 { x: number; y: number; }

export interface OrbitConfig {
  /** Master enable orbit */
  enable: boolean;

  /** Center of orbit. If omitted, we auto-infer from the image/base position on first compute. */
  orbitCenter?: Vec2;

  /** Radius in pixels. If omitted, inferred from base position to center. */
  radiusPx?: number;

  /**
   * Starting angle (deg) on the orbit path.
   * If omitted, inferred from base position relative to center.
   * Convention: 0..360, up = 90°, clockwise positive.
   */
  startAngleDeg?: number;

  /** Constant speed in deg/sec (takes precedence over periodSec if both provided). */
  speedDegPerSec?: number;

  /** Period in seconds per full revolution (used when speedDegPerSec is not set). */
  periodSec?: number;

  /** Direction of rotation; default "cw". */
  direction?: OrbitDirection;

  /** Fixed angle offset added to the orbit angle (before position mapping); default 0. */
  orbitAngleOffsetDeg?: number;

  /** Reference epoch in ms for t=0 (optional). */
  epochMs?: number;

  /**
   * Orientation of the image while orbiting:
   * - "inheritSpin": follow spin if provided; if no spin angle, fallback to radial-out
   * - "radial-out": face away from center
   * - "radial-in": face towards center
   * - "tangent": face along the path (CW tangent points forward)
   *
   * Default: "inheritSpin"
   */
  orientationMode?: OrientationMode;

  /** Optional gating window for motion */
  startDelayMs?: number;
  durationMs?: number;
}

export interface OrbitState {
  enabled: boolean;
  active: boolean;               // true if within time window
  timeMs: number;

  // Path params used:
  center: Vec2;
  radiusPx: number;
  startAngleDeg: number;
  direction: OrbitDirection;

  // Current path/angles:
  orbitAngleDeg: number;         // angle on the orbit path (0..360, CW+)
  positionPx: Vec2;              // computed orbital position (x,y)

  // Orientation result:
  orientationDeg: number | null; // final orientation suggestion (may be overridden upstream)
  orientationSource: "spin" | "radial" | "tangent" | "none";
}

/* ------------------------------ Utilities -------------------------------- */

export function normalize360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

function dirSign(dir?: OrbitDirection): 1 | -1 {
  return dir === "ccw" ? -1 : 1; // CW positive by convention
}

function resolveSpeedDps(cfg: OrbitConfig): number {
  if (typeof cfg.speedDegPerSec === "number" && isFinite(cfg.speedDegPerSec)) {
    return cfg.speedDegPerSec;
  }
  if (typeof cfg.periodSec === "number" && isFinite(cfg.periodSec) && cfg.periodSec > 0) {
    return 360 / cfg.periodSec;
  }
  return 0;
}

function isWithinActiveWindow(cfg: OrbitConfig, nowMs: number, epochMs: number): boolean {
  const delay = cfg.startDelayMs ?? 0;
  const dur = cfg.durationMs ?? Number.POSITIVE_INFINITY;
  const t = nowMs - epochMs;
  if (t < delay) return false;
  return t < (delay + dur);
}

/** Convert our CW angle (0 right, up=90, CW+) to screen X,Y with Y downwards. */
function polarToScreen(center: Vec2, radius: number, angleDegCW: number): Vec2 {
  const th = (angleDegCW * Math.PI) / 180; // treat as CW directly
  return {
    x: center.x + radius * Math.cos(th),
    y: center.y - radius * Math.sin(th), // minus because screen Y grows downward
  };
}

/** Infer CW angle from center -> point (screen coords, Y down) */
function screenVecToAngleCW(center: Vec2, p: Vec2): number {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  const thCCW = Math.atan2(dy, dx);        // CCW math
  const thCW = -thCCW;                      // convert to CW
  return normalize360((thCW * 180) / Math.PI);
}

/** Euclidean distance */
function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/* --------------------------------- Core ---------------------------------- */

/**
 * Compute OrbitState at a given time.
 * `basePositionPx` is the image's current position BEFORE orbit (e.g., from LayerBasic).
 * This lets us infer center/radius/start if user didn't set them.
 *
 * `spinAngleDeg` is optional current Spin angle for orientation inheritance.
 */
export function computeOrbitState(
  cfg: OrbitConfig,
  basePositionPx: Vec2,
  options?: {
    nowMs?: number;
    spinAngleDeg?: number | null;
  }
): OrbitState {
  const nowMs = options?.nowMs ?? Date.now();
  const spinAngleDeg = options?.spinAngleDeg ?? null;

  const enabled = !!cfg.enable;
  const epoch = cfg.epochMs ?? 0;

  // infer center / radius / startAngle if missing
  const center: Vec2 = cfg.orbitCenter ?? basePositionPx;
  const radiusPx =
    typeof cfg.radiusPx === "number" && isFinite(cfg.radiusPx)
      ? cfg.radiusPx
      : dist(center, basePositionPx);

  const inferredStart = screenVecToAngleCW(center, basePositionPx);
  const startAngleDeg = normalize360(
    typeof cfg.startAngleDeg === "number" ? cfg.startAngleDeg : inferredStart
  );

  const speedDps = resolveSpeedDps(cfg);
  const dir = cfg.direction ?? "cw";
  const signedSpeed = speedDps * dirSign(dir);

  if (!enabled) {
    // Not enabled → position remains basePosition; no orientation suggestion
    return {
      enabled,
      active: false,
      timeMs: nowMs,
      center,
      radiusPx,
      startAngleDeg,
      direction: dir,
      orbitAngleDeg: startAngleDeg,
      positionPx: basePositionPx,
      orientationDeg: null,
      orientationSource: "none",
    };
  }

  const active = isWithinActiveWindow(cfg, nowMs, epoch);
  const delay = cfg.startDelayMs ?? 0;
  const elapsedMs = Math.max(0, nowMs - epoch - delay);
  const traveledDeg = (active ? (elapsedMs / 1000) : 0) * signedSpeed;
  const orbitAngleDeg = normalize360(
    startAngleDeg + (cfg.orbitAngleOffsetDeg ?? 0) + traveledDeg
  );

  const positionPx = polarToScreen(center, radiusPx, orbitAngleDeg);

  // Orientation:
  const mode: OrientationMode = cfg.orientationMode ?? "inheritSpin";
  let orientationDeg: number | null = null;
  let orientationSource: OrbitState["orientationSource"] = "none";

  if (mode === "inheritSpin") {
    if (typeof spinAngleDeg === "number") {
      orientationDeg = normalize360(spinAngleDeg);
      orientationSource = "spin";
    } else {
      // fallback → radial-out
      orientationDeg = orbitAngleDeg;
      orientationSource = "radial";
    }
  } else if (mode === "radial-out") {
    orientationDeg = orbitAngleDeg;
    orientationSource = "radial";
  } else if (mode === "radial-in") {
    orientationDeg = normalize360(orbitAngleDeg + 180);
    orientationSource = "radial";
  } else if (mode === "tangent") {
    // tangent forward depends on direction: CW tangent is -90 from radial (since CW+)
    const tangentCW = normalize360(orbitAngleDeg - 90 * dirSign(dir));
    orientationDeg = tangentCW;
    orientationSource = "tangent";
  }

  return {
    enabled,
    active,
    timeMs: nowMs,
    center,
    radiusPx,
    startAngleDeg,
    direction: dir,
    orbitAngleDeg,
    positionPx,
    orientationDeg,
    orientationSource,
  };
}

/**
 * Convenience for pipeline:
 * Return only the suggested orientation (deg) for this frame.
 * (Null if orbit disabled → no override from orbit.)
 */
export function getOrbitOrientationDeg(
  cfg: OrbitConfig,
  basePositionPx: Vec2,
  options?: { nowMs?: number; spinAngleDeg?: number | null }
): number | null {
  return computeOrbitState(cfg, basePositionPx, options).orientationDeg;
}
gas—sekarang LayerOrbit. Ini modul TS “bersih” kayak Basic/Spin/Clock yang udah kita bikin. Menurut rule kamu:

LayerOrbit membungkus LayerBasic.

Pusat orbit dari user (orbitCenter) atau kalau kosong, dihitung dari posisi image (∴ radius dan sudut awal auto).

Gerak memutari center dengan speed (deg/sec) atau period (detik/putaran).

Arah: "cw" (searah jarum jam) / "ccw".

Orientasi image:

Jika Spin ON → orientasi ikut Spin (override).

Jika Spin OFF → menghadap keluar dari pusat orbit (radial-out).

(opsional: bisa pilih radial-in atau tangent kalau perlu.)

Konvensi tetap: sudut 0–360, “up = 90°”, clockwise positif.

LayerLogicOrbit.ts
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

Integrasi di pipeline (prioritas Clock > Spin > Manual, posisi dari Orbit)
import { computeBasicState, resolveFinalAngle, type BasicState } from "./LayerLogicBasic";
import { getSpinAngleDeg, type SpinConfig } from "./LayerLogicSpin";
import { getClockDrivenImageAngle, type ClockConfig } from "./LayerLogicClock";
import { computeOrbitState, type OrbitConfig } from "./LayerLogicOrbit";

function processLayer(
  basicCfg: Parameters<typeof computeBasicState>[0],
  canvas: { x: number; y: number },
  spinCfg: SpinConfig,
  orbitCfg: OrbitConfig,
  clockCfg: ClockConfig
) {
  // 1) Basic → state awal
  const basic = computeBasicState(basicCfg, canvas);

  // 2) Spin angle (null jika tidak aktif)
  const spinAngle = getSpinAngleDeg(spinCfg);

  // 3) Orbit → posisi bergerak + saran orientasi (berdasarkan rule orbit)
  const orbit = computeOrbitState(orbitCfg, basic.positionPx, { spinAngleDeg: spinAngle });

  // 4) Clock → bisa override orientasi (dan bisa inherit spin jika imageSpin:"true")
  const clockAngle = getClockDrivenImageAngle(clockCfg, { inheritSpinDeg: spinAngle });

  // 5) Final angle: Clock > Spin > Manual (konsisten dengan rule project)
  const final = resolveFinalAngle(basic.baseAngleDeg, {
    clockAngleDeg: clockAngle ?? orbit.orientationDeg, // Clock dulu; kalau Clock null, izinkan Orbit saranin
    spinAngleDeg: spinAngle,
  });

  return {
    // gabungkan untuk renderer
    ...basic,
    positionPx: orbit.positionPx,       // posisi hasil orbit
    finalAngleDeg: final.angleDeg,      // sudut akhir
    angleSource: final.source,          // "clock" | "spin" | "manual"
    orbitMeta: {
      center: orbit.center,
      radiusPx: orbit.radiusPx,
      orbitAngleDeg: orbit.orbitAngleDeg,
      orientationFromOrbit: orbit.orientationDeg,
      orientationSource: orbit.orientationSource,
    },
  };
}


Catatan keputusan: di baris clockAngle ?? orbit.orientationDeg, aku izinkan Orbit memberi fallback orientasi kalau Clock tidak aktif. Kalau kamu maunya Orbit tidak pernah override (kecuali Spin OFF), tinggal ubah prioritasnya — tapi ini sudah mengikuti narasi kamu: Spin ON → orientasi ikut Spin; kalau Spin OFF → menghadap keluar (diterapkan saat orientationMode: "inheritSpin").

orbit.config.json (siap pakai)
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

Cara pakai infer otomatis

Kalau kamu nggak set orbitCenter/radiusPx/startAngleDeg, modul akan:

pakai basePositionPx (posisi dari Basic) sebagai center (→ radius = 0, jadi objek diam di center; ini berguna buat kasus tertentu), atau

lebih umum: kamu biasanya set orbitCenter saja—lalu radiusPx & startAngleDeg akan otomatis diambil dari jarak/arah antara center dan basePositionPx (ini sesuai “orbit line from user input or image position (input overrides)”).
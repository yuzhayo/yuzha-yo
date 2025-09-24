/**
 * LayerLogicCore.ts - Pure Functional Animation Logic
 * Best implementation from source3 with enhanced features
 */

import type {
  Vec2,
  SpinConfig,
  OrbitConfig,
  ClockConfig,
  EffectConfig,
  LayerConfigNormalized,
  StageConfigNormalized,
} from "./LayerSystemTypes";

/* ==============================
 * Math Utilities
 * ============================== */

export function normalize360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/* ==============================
 * Basic Transform Logic
 * ============================== */

export interface BasicState {
  kind: "basic";
  enabled: boolean;
  zIndex: number;
  imageUrl: string;
  positionPx: Vec2;
  scale: Vec2;
  baseAngleDeg: number;
  visible: boolean;
  opacity: number;
  anchor01: Vec2;
  imageTipAngle360: number;
  imageBaseAngle360: number;
}

export interface FinalAngleDecision {
  angleDeg: number;
  source: "clock" | "spin" | "manual";
}

export function resolveAnchor01(cfg: LayerConfigNormalized): Vec2 {
  return { ...cfg.anchor };
}

export function resolveScale(cfg: LayerConfigNormalized): Vec2 {
  return { ...cfg.scale };
}

export function resolvePositionPx(cfg: LayerConfigNormalized, canvasSizePx: Vec2): Vec2 {
  return { ...cfg.position };
}

export function computeBasicState(cfg: LayerConfigNormalized, canvasSizePx: Vec2): BasicState {
  const enabled = cfg.enabled;
  const zIndex = cfg.zIndex;
  const imageUrl = cfg.assetRef.type === "path" ? cfg.assetRef.path : cfg.assetRef.key;
  const positionPx = resolvePositionPx(cfg, canvasSizePx);
  const scale = resolveScale(cfg);
  const baseAngleDeg = normalize360(cfg.angle);
  const visible = cfg.visible;
  const opacity = cfg.opacity;
  const anchor01 = resolveAnchor01(cfg);

  return {
    kind: "basic",
    enabled,
    zIndex,
    imageUrl,
    positionPx,
    scale,
    baseAngleDeg,
    visible,
    opacity,
    anchor01,
    imageTipAngle360: normalize360(cfg.imageTipAngle360),
    imageBaseAngle360: normalize360(cfg.imageBaseAngle360),
  };
}

export function resolveFinalAngle(
  baseAngleDeg: number,
  overrides: {
    clockAngleDeg?: number | null;
    spinAngleDeg?: number | null;
  },
): FinalAngleDecision {
  const c = overrides.clockAngleDeg;
  if (typeof c === "number") {
    return { angleDeg: normalize360(c), source: "clock" };
  }
  const s = overrides.spinAngleDeg;
  if (typeof s === "number") {
    return { angleDeg: normalize360(s), source: "spin" };
  }
  return { angleDeg: normalize360(baseAngleDeg), source: "manual" };
}

/* ==============================
 * Spin Logic
 * ============================== */

export interface SpinState {
  enabled: boolean;
  active: boolean;
  angleDeg: number | null;
  angularVelocityDps: number;
  timeMs: number;
}

function signForDir(dir?: "cw" | "ccw"): 1 | -1 {
  return dir === "ccw" ? -1 : 1;
}

function resolveSpeedDps(cfg: SpinConfig): number {
  if (typeof cfg.speedDegPerSec === "number" && isFinite(cfg.speedDegPerSec)) {
    return cfg.speedDegPerSec;
  }
  if (typeof cfg.periodSec === "number" && isFinite(cfg.periodSec) && cfg.periodSec > 0) {
    return 360 / cfg.periodSec;
  }
  return 0;
}

function isWithinActiveWindow(cfg: SpinConfig, nowMs: number, epochMs: number): boolean {
  const delay = cfg.startDelayMs ?? 0;
  const dur = cfg.durationMs ?? Number.POSITIVE_INFINITY;
  const t = nowMs - epochMs;
  if (t < delay) return false;
  return t < delay + dur;
}

export function computeSpinState(cfg: SpinConfig, options?: { nowMs?: number }): SpinState {
  const nowMs = options?.nowMs ?? Date.now();
  const enabled = cfg.enabled;
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
    return {
      enabled,
      active,
      angleDeg: null,
      angularVelocityDps: 0,
      timeMs: nowMs,
    };
  }

  const delay = cfg.startDelayMs ?? 0;
  const t = Math.max(0, nowMs - epoch - delay);
  const raw = speed * (t / 1000);
  const withOffset = raw + (cfg.offsetDeg ?? 0);
  const angleDeg = normalize360(withOffset);

  return {
    enabled,
    active: true,
    angleDeg,
    angularVelocityDps: speed,
    timeMs: nowMs,
  };
}

export function getSpinAngleDeg(cfg: SpinConfig, options?: { nowMs?: number }): number | null {
  return computeSpinState(cfg, options).angleDeg;
}

/* ==============================
 * Orbit Logic
 * ============================== */

export interface OrbitState {
  enabled: boolean;
  active: boolean;
  timeMs: number;
  center: Vec2;
  radiusPx: number;
  startAngleDeg: number;
  direction: "cw" | "ccw";
  orbitAngleDeg: number;
  positionPx: Vec2;
  orientationDeg: number | null;
  orientationSource: "spin" | "radial" | "tangent" | "none";
}

function polarToScreen(center: Vec2, radius: number, angleDegCW: number): Vec2 {
  const th = (angleDegCW * Math.PI) / 180;
  return {
    x: center.x + radius * Math.cos(th),
    y: center.y - radius * Math.sin(th),
  };
}

function screenVecToAngleCW(center: Vec2, p: Vec2): number {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  const thCCW = Math.atan2(dy, dx);
  const thCW = -thCCW;
  return normalize360((thCW * 180) / Math.PI);
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function computeOrbitState(
  cfg: OrbitConfig,
  basePositionPx: Vec2,
  options?: {
    nowMs?: number;
    spinAngleDeg?: number | null;
  },
): OrbitState {
  const nowMs = options?.nowMs ?? Date.now();
  const spinAngleDeg = options?.spinAngleDeg ?? null;

  const enabled = cfg.enabled;
  const epoch = cfg.epochMs ?? 0;

  const center: Vec2 = cfg.orbitCenter ?? basePositionPx;
  const radiusPx =
    typeof cfg.radiusPx === "number" && isFinite(cfg.radiusPx)
      ? cfg.radiusPx
      : dist(center, basePositionPx);

  const inferredStart = screenVecToAngleCW(center, basePositionPx);
  const startAngleDeg = normalize360(
    typeof cfg.startAngleDeg === "number" ? cfg.startAngleDeg : inferredStart,
  );

  const speedDps = resolveSpeedDps(cfg as any);
  const dir = cfg.direction ?? "cw";
  const signedSpeed = speedDps * signForDir(dir);

  if (!enabled) {
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

  const active = isWithinActiveWindow(cfg as any, nowMs, epoch);
  const delay = cfg.startDelayMs ?? 0;
  const elapsedMs = Math.max(0, nowMs - epoch - delay);
  const traveledDeg = (active ? elapsedMs / 1000 : 0) * signedSpeed;
  const orbitAngleDeg = normalize360(startAngleDeg + (cfg.orbitAngleOffsetDeg ?? 0) + traveledDeg);

  const positionPx = polarToScreen(center, radiusPx, orbitAngleDeg);

  const mode = cfg.orientationMode ?? "inheritSpin";
  let orientationDeg: number | null = null;
  let orientationSource: OrbitState["orientationSource"] = "none";

  if (mode === "inheritSpin") {
    if (typeof spinAngleDeg === "number") {
      orientationDeg = normalize360(spinAngleDeg);
      orientationSource = "spin";
    } else {
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
    const tangentCW = normalize360(orbitAngleDeg - 90 * signForDir(dir));
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

/* ==============================
 * Clock Logic
 * ============================== */

export interface ClockAngles {
  hour: number;
  min: number;
  sec: number;
}

export interface ClockState {
  timeISO: string;
  angles: ClockAngles;
  imageOrientation: {
    deg: number | null;
    source: "sec" | "min" | "hour" | "inherit" | "none";
  };
  clockCenter?: Vec2 | undefined;
  centerBaseRadius?: number | undefined;
}

function getZonedHMS(
  now: Date,
  timeZone?: string,
): { h: number; m: number; s: number; ms: number; iso: string } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    timeZone: timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = fmt.formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");

  const h = get("hour");
  const m = get("minute");
  const s = get("second");
  const ms = now.getMilliseconds();
  const iso = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .format(now)
    .replace(" ", "T");

  return { h, m, s, ms, iso };
}

export function computeClockAngles(
  time: { h: number; m: number; s: number; ms: number },
  tickMode: "smooth" | "tick" = "smooth",
): ClockAngles {
  const sFraction = tickMode === "smooth" ? time.s + time.ms / 1000 : time.s;
  const minTotal = time.m + sFraction / 60;
  const hourTotal = (time.h % 12) + minTotal / 60;

  const sec = normalize360(90 + 6 * sFraction);
  const min = normalize360(90 + 6 * minTotal);
  const hour = normalize360(90 + 30 * hourTotal);

  return { hour, min, sec };
}

export function computeClockState(
  cfg: ClockConfig,
  options?: { nowMs?: number; inheritSpinDeg?: number | null },
): ClockState {
  const { nowMs, inheritSpinDeg } = options ?? {};
  const now = new Date(nowMs ?? Date.now());

  if (!cfg.enabled) {
    return {
      timeISO: now.toISOString(),
      angles: { hour: 0, min: 0, sec: 0 },
      imageOrientation: { deg: null, source: "none" },
      clockCenter: cfg.clockCenter,
      centerBaseRadius: cfg.centerBaseRadius,
    };
  }

  const { h, m, s, ms, iso } = getZonedHMS(now, cfg.timezone);
  const angles = computeClockAngles({ h, m, s, ms }, cfg.tickMode ?? "smooth");

  const mode = cfg.imageSpin ?? "none";
  let imageOrientation: ClockState["imageOrientation"];

  switch (mode) {
    case "none":
      imageOrientation = { deg: null, source: "none" };
      break;
    case "true":
      if (typeof inheritSpinDeg === "number") {
        imageOrientation = { deg: normalize360(inheritSpinDeg), source: "inherit" };
      } else {
        imageOrientation = { deg: null, source: "inherit" };
      }
      break;
    case "sec":
      imageOrientation = { deg: angles.sec, source: "sec" };
      break;
    case "min":
      imageOrientation = { deg: angles.min, source: "min" };
      break;
    case "hour":
      imageOrientation = { deg: angles.hour, source: "hour" };
      break;
    default:
      imageOrientation = { deg: null, source: "none" };
  }

  return {
    timeISO: iso,
    angles,
    imageOrientation,
    clockCenter: cfg.clockCenter,
    centerBaseRadius: cfg.centerBaseRadius,
  };
}

export function getClockDrivenImageAngle(
  cfg: ClockConfig,
  options?: { nowMs?: number; inheritSpinDeg?: number | null },
): number | null {
  const state = computeClockState(cfg, options);
  return state.imageOrientation.deg;
}

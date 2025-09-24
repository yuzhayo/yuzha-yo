// LayerLogicEffect.ts
// Post-transform visual effects: opacity, scale, position, (optional) small angle nudge.
// No external deps. Pure functions.

export type Vec2 = { x: number; y: number };

export type Easing =
  | "linear"
  | "easeInQuad"
  | "easeOutQuad"
  | "easeInOutQuad"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInOutCubic";

export type Waveform =
  | "sine"
  | "triangle"
  | "square"
  | "saw"
  | "revSaw"
  | "noise"; // pseudo flicker

/** An individual effect unit */
export type EffectType = "fade" | "pulse" | "blink" | "shake" | "wiggle";

export interface BaseEffectUnit {
  type: EffectType;
  /** enable this unit */
  enable?: boolean;
  /** start delay (ms) */
  startDelayMs?: number;
  /** duration (ms); omit = infinite */
  durationMs?: number;
  /** easing for ramps etc (fade/pulse envelopes) */
  easing?: Easing;
  /**
   * mix [0..1] to blend this unit into the accumulated result.
   * 1 = full, 0.5 = half strength, etc.
   */
  mix?: number;
}

/** Fade (opacity multiplier 0..1) */
export interface FadeUnit extends BaseEffectUnit {
  type: "fade";
  /** 0..1 at start */
  from?: number;
  /** 0..1 at end */
  to?: number;
  /** if true, ping-pong between from↔to over duration (loop) */
  pingpong?: boolean;
}

/** Pulse: scale and/or opacity breathe by waveform */
export interface PulseUnit extends BaseEffectUnit {
  type: "pulse";
  /** Hz (cycles per second). Alt: periodSec. */
  freqHz?: number;
  periodSec?: number;
  waveform?: Waveform;
  /** scale multiplier center & amplitude */
  scaleCenter?: number;      // default 1
  scaleAmp?: number;         // default 0
  /** opacity multiplier center & amplitude (0..1 typical) */
  opacityCenter?: number;    // default 1
  opacityAmp?: number;       // default 0
  /** optional axis split for scale */
  scaleXYSplit?: boolean;    // if true, apply sin/cos to x/y
  /** phase offset (deg) */
  phaseDeg?: number;         // default 0
}

/** Blink: hard on/off opacity at given rate and duty cycle */
export interface BlinkUnit extends BaseEffectUnit {
  type: "blink";
  freqHz?: number;
  periodSec?: number;
  /** 0..1 proportion of time ON */
  duty?: number; // default 0.5
  /** opacity when ON/OFF */
  onOpacity?: number;  // default 1
  offOpacity?: number; // default 0
}

/** Shake: small random-ish position jitter (and/or angle nudge) */
export interface ShakeUnit extends BaseEffectUnit {
  type: "shake";
  /** px amplitude on x/y */
  posAmp?: Vec2; // default {x:2,y:2}
  /** deg amplitude for tiny angle nudge (optional) */
  angleAmpDeg?: number; // default 0
  /** Hz for noise refresh */
  freqHz?: number; // default 20
}

/** Wiggle: periodic small rotation (angle add), optional position orbit micro */
export interface WiggleUnit extends BaseEffectUnit {
  type: "wiggle";
  freqHz?: number;
  periodSec?: number;
  waveform?: Waveform; // usually "sine"
  angleAmpDeg?: number; // default 5
  /** tiny micro-orbit for position (px) */
  posAmp?: Vec2;        // default {x:0,y:0}
  phaseDeg?: number;    // default 0
}

export type EffectUnit = FadeUnit | PulseUnit | BlinkUnit | ShakeUnit | WiggleUnit;

export interface EffectConfig {
  enable: boolean;
  /** Whether angleAddDeg is allowed to affect orientation (default false). */
  allowAngleNudge?: boolean;
  /** combine multiple units */
  units?: EffectUnit[];
}

/** Accumulated effect output for this frame */
export interface EffectState {
  enabled: boolean;
  timeMs: number;
  /** multiply to base opacity */
  opacityMul: number;
  /** multiply to base scale (x,y) */
  scaleMul: Vec2;
  /** add to base position (px) */
  positionAddPx: Vec2;
  /** optional small angle addition (deg). Apply only if allowAngleNudge=true in config. */
  angleAddDeg: number;
}

/* ------------------------------ Utilities -------------------------------- */

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

function ease(e: Easing | undefined, t01: number): number {
  const t = clamp01(t01);
  switch (e) {
    case "easeInQuad": return t * t;
    case "easeOutQuad": return t * (2 - t);
    case "easeInOutQuad": return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
    case "easeInCubic": return t*t*t;
    case "easeOutCubic": { const u = t - 1; return u*u*u + 1; }
    case "easeInOutCubic":
      return t < 0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2) + 1;
    default: return t; // linear
  }
}

function wave(w: Waveform | undefined, phase: number): number {
  // phase in radians
  switch (w) {
    case "triangle": {
      // map [-pi,pi] to triangle [-1..1]
      const x = (phase / Math.PI) % 2; // [-∞..∞]
      const f = x < 0 ? x + Math.ceil(-x/2)*2 : x; // [0..2)
      return f < 1 ? (2*f - 1) : (1 - 2*(f - 1));
    }
    case "square":
      return Math.sign(Math.sin(phase)) || 1;
    case "saw": {
      // rising -1..1
      const x = (phase / (2*Math.PI)) % 1;
      const f = x < 0 ? x + 1 : x;
      return 2*f - 1;
    }
    case "revSaw": {
      const x = (phase / (2*Math.PI)) % 1;
      const f = x < 0 ? x + 1 : x;
      return 1 - 2*f;
    }
    case "noise":
      return (Math.random() * 2) - 1;
    case "sine":
    default:
      return Math.sin(phase);
  }
}

function nowMsOr(v?: number) { return typeof v === "number" ? v : Date.now(); }

function accumInit(now: number): EffectState {
  return {
    enabled: true,
    timeMs: now,
    opacityMul: 1,
    scaleMul: { x: 1, y: 1 },
    positionAddPx: { x: 0, y: 0 },
    angleAddDeg: 0,
  };
}

function normalize360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/* --------------------------------- Units --------------------------------- */

function applyFade(acc: EffectState, u: FadeUnit, tNow: number) {
  const start = u.startDelayMs ?? 0;
  const dur = u.durationMs;
  const mix = u.mix ?? 1;
  const from = (u.from ?? 1);
  const to = (u.to ?? 1);
  const easing = u.easing;

  const t = Math.max(0, tNow - start);
  if (dur === undefined) {
    // No duration → treat as constant at 'to'
    const val = clamp01(to);
    acc.opacityMul *= (1 - mix) + mix * val;
    return;
  }
  if (t < 0) return; // not started
  let k: number;
  if (u.pingpong) {
    const cycle = Math.max(1, dur);
    const m = Math.floor(t / cycle);
    const inHalf = (m % 2) === 0; // forward or backward
    const tt = (t % cycle) / cycle; // 0..1
    const eased = ease(easing, tt);
    const v = inHalf ? (from + (to - from) * eased)
                     : (to + (from - to) * eased);
    k = clamp01(v);
  } else {
    const tt = clamp01(t / Math.max(1, dur));
    const v = from + (to - from) * ease(easing, tt);
    k = clamp01(v);
  }
  acc.opacityMul *= (1 - mix) + mix * k;
}

function applyShake(acc: EffectState, u: ShakeUnit, tNow: number) {
  const mix = u.mix ?? 1;
  const posAmp = u.posAmp ?? { x: 2, y: 2 };
  const angleAmp = u.angleAmpDeg ?? 0;
  const freq = u.freqHz ?? 20; // refresh
  // simple time-quantized noise
  const bucket = Math.floor(tNow / (1000 / Math.max(1, freq)));
  // deterministic-ish per bucket:
  const rand = (seed: number) => {
    // xorshift-ish
    let x = (seed ^ 0x6D2B79F5) >>> 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
  const r1 = rand(bucket);
  const r2 = rand(bucket + 911);
  const rx = (r1 * 2 - 1) * posAmp.x;
  const ry = (r2 * 2 - 1) * posAmp.y;

  acc.positionAddPx.x += mix * rx;
  acc.positionAddPx.y += mix * ry;
  if (angleAmp !== 0) {
    const r3 = rand(bucket + 1777) * 2 - 1;
    acc.angleAddDeg += mix * (r3 * angleAmp);
  }
}

function applyUnit(acc: EffectState, unit: EffectUnit, timeMs: number) {
  if (unit.enable === false) return;

  const start = unit.startDelayMs ?? 0;
  const dur = unit.durationMs ?? Number.POSITIVE_INFINITY;
  const t = timeMs - start;
  if (t < 0 || t > dur) return;

  switch (unit.type) {
    case "fade":   applyFade(acc, unit, t); break;
    case "shake":  applyShake(acc, unit, t); break;
    // ... other units can be added
  }
}

/* --------------------------------- API ----------------------------------- */

/** Compute cumulative effect multipliers/additions for this frame. */
export function computeEffectState(
  cfg: EffectConfig
): EffectState {
  const now = nowMsOr();
  const acc = accumInit(now);

  if (!cfg.enable) {
    acc.enabled = false;
    return acc;
  }

  for (const u of (cfg.units ?? [])) {
    applyUnit(acc, u, now);
  }

  // guard values
  acc.opacityMul = Math.max(0, acc.opacityMul);
  return acc;
}

/** Merge effect onto renderable values */
export function applyEffectToRenderable(input: {
  positionPx: Vec2;
  scale: Vec2;
  opacity: number;
  finalAngleDeg: number; // already decided by Basic/Spin/Clock priority
}, eff: EffectState, allowAngleNudge: boolean) {

  const outPos: Vec2 = {
    x: input.positionPx.x + eff.positionAddPx.x,
    y: input.positionPx.y + eff.positionAddPx.y,
  };

  const outScale: Vec2 = {
    x: input.scale.x * eff.scaleMul.x,
    y: input.scale.y * eff.scaleMul.y,
  };

  const outOpacity = input.opacity * eff.opacityMul;

  const outAngle = allowAngleNudge
    ? normalize360(input.finalAngleDeg + eff.angleAddDeg)
    : input.finalAngleDeg;

  return {
    positionPx: outPos,
    scale: outScale,
    opacity: outOpacity,
    finalAngleDeg: outAngle,
  };
}
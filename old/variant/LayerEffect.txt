LayerEffect sebagai modul umum (tanpa dependency) yang bisa nambahin opacity/scale/posisi (dan opsional nudge kecil ke angle kalau kamu izinkan). Desainnya konsisten dengan pipeline kamu:

Urutan: LayerBasic → LayerSpin → LayerOrbit → LayerEffect → render

Effect TIDAK mengambil alih orientasi (spin/clock). Angle cuma boleh di-nudge kecil jika kamu izinkan (default: tidak).

Semua sudut tetap 0–360 (up = 90°) untuk konsistensi ketika dipakai (kalau angleAdd aktif).

Di bawah ini satu file siap pakai + contoh config JSON + cara integrasi.

LayerLogicEffect.ts
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

function applyPulse(acc: EffectState, u: PulseUnit, tNow: number) {
  const mix = u.mix ?? 1;
  const easing = u.easing; // used if we later add envelopes
  const freq = typeof u.freqHz === "number"
    ? u.freqHz
    : (typeof u.periodSec === "number" && u.periodSec > 0 ? 1 / u.periodSec : 1);
  const phase0 = (u.phaseDeg ?? 0) * Math.PI / 180;
  const w = u.waveform ?? "sine";
  const sCenter = u.scaleCenter ?? 1;
  const sAmp = u.scaleAmp ?? 0;
  const oCenter = u.opacityCenter ?? 1;
  const oAmp = u.opacityAmp ?? 0;

  const ph = 2 * Math.PI * freq * (tNow / 1000) + phase0;
  const v = wave(w, ph); // -1..1

  // scale
  if (u.scaleXYSplit) {
    // x uses sine, y uses cosine (90° phase shift)
    const vx = v;
    const vy = wave(w, ph + Math.PI / 2);
    const sx = sCenter + sAmp * vx;
    const sy = sCenter + sAmp * vy;
    acc.scaleMul.x *= (1 - mix) + mix * sx;
    acc.scaleMul.y *= (1 - mix) + mix * sy;
  } else {
    const s = sCenter + sAmp * v;
    acc.scaleMul.x *= (1 - mix) + mix * s;
    acc.scaleMul.y *= (1 - mix) + mix * s;
  }

  // opacity
  if (oAmp !== 0 || oCenter !== 1) {
    const o = oCenter + oAmp * v;
    acc.opacityMul *= (1 - mix) + mix * clamp01(o);
  }
}

function applyBlink(acc: EffectState, u: BlinkUnit, tNow: number) {
  const mix = u.mix ?? 1;
  const period = typeof u.periodSec === "number" && u.periodSec > 0 ? u.periodSec : (1 / (u.freqHz ?? 2));
  const duty = u.duty ?? 0.5;
  const onOpacity = clamp01(u.onOpacity ?? 1);
  const offOpacity = clamp01(u.offOpacity ?? 0);

  const t = (tNow / 1000) % period;
  const on = t < duty * period;
  const k = on ? onOpacity : offOpacity;

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

function applyWiggle(acc: EffectState, u: WiggleUnit, tNow: number) {
  const mix = u.mix ?? 1;
  const freq = typeof u.freqHz === "number"
    ? u.freqHz
    : (typeof u.periodSec === "number" && u.periodSec > 0 ? 1 / u.periodSec : 1);
  const w = u.waveform ?? "sine";
  const phase = (u.phaseDeg ?? 0) * Math.PI / 180;
  const posAmp = u.posAmp ?? { x: 0, y: 0 };
  const angleAmp = u.angleAmpDeg ?? 5;

  const ph = 2 * Math.PI * freq * (tNow / 1000) + phase;
  const v = wave(w, ph); // -1..1

  // angle nudge
  acc.angleAddDeg += mix * (v * angleAmp);

  // micro position wiggle
  if (posAmp.x !== 0 || posAmp.y !== 0) {
    acc.positionAddPx.x += mix * (v * posAmp.x);
    // 90° phase shift for y to make a tiny orbit
    const vy = wave(w, ph + Math.PI / 2);
    acc.positionAddPx.y += mix * (vy * posAmp.y);
  }
}

/* ------------------------------- Dispatcher ------------------------------ */

function applyUnit(acc: EffectState, unit: EffectUnit, timeMs: number) {
  if (unit.enable === false) return;

  const start = unit.startDelayMs ?? 0;
  const dur = unit.durationMs ?? Number.POSITIVE_INFINITY;
  const t = timeMs - start;
  if (t < 0 || t > dur) return;

  switch (unit.type) {
    case "fade":   applyFade(acc, unit, t); break;
    case "pulse":  applyPulse(acc, unit, t); break;
    case "blink":  applyBlink(acc, unit, t); break;
    case "shake":  applyShake(acc, unit, t); break;
    case "wiggle": applyWiggle(acc, unit, t); break;
  }
}

/* --------------------------------- API ----------------------------------- */

export interface EffectComputeOptions {
  nowMs?: number;
}

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

effect.config.json (siap pakai)
{
  "version": 1,
  "effect": {
    "enable": true,
    "allowAngleNudge": false,
    "units": [
      {
        "type": "fade",
        "from": 0.0,
        "to": 1.0,
        "durationMs": 800,
        "easing": "easeOutCubic",
        "mix": 1
      },
      {
        "type": "pulse",
        "freqHz": 0.8,
        "waveform": "sine",
        "scaleCenter": 1.0,
        "scaleAmp": 0.06,
        "opacityCenter": 1.0,
        "opacityAmp": 0.0,
        "mix": 0.6
      },
      {
        "type": "blink",
        "freqHz": 2,
        "duty": 0.08,
        "onOpacity": 1.0,
        "offOpacity": 0.0,
        "mix": 0.25,
        "startDelayMs": 2000,
        "durationMs": 1000
      },
      {
        "type": "shake",
        "posAmp": { "x": 1.5, "y": 1.5 },
        "angleAmpDeg": 0,
        "freqHz": 18,
        "mix": 0.7
      },
      {
        "type": "wiggle",
        "freqHz": 0.5,
        "waveform": "sine",
        "angleAmpDeg": 3,
        "posAmp": { "x": 0.0, "y": 0.0 },
        "mix": 0.4
      }
    ]
  },
  "presets": [
    {
      "name": "fade-in",
      "effect": {
        "enable": true,
        "allowAngleNudge": false,
        "units": [{ "type": "fade", "from": 0, "to": 1, "durationMs": 600, "easing": "easeOutCubic" }]
      }
    },
    {
      "name": "breathe",
      "effect": {
        "enable": true,
        "allowAngleNudge": false,
        "units": [{ "type": "pulse", "freqHz": 0.6, "waveform": "sine", "scaleCenter": 1, "scaleAmp": 0.05, "mix": 1 }]
      }
    },
    {
      "name": "flicker",
      "effect": {
        "enable": true,
        "allowAngleNudge": false,
        "units": [{ "type": "blink", "freqHz": 8, "duty": 0.5, "onOpacity": 1, "offOpacity": 0.4, "mix": 0.5 }]
      }
    },
    {
      "name": "shake-strong",
      "effect": {
        "enable": true,
        "allowAngleNudge": false,
        "units": [{ "type": "shake", "posAmp": { "x": 4, "y": 4 }, "angleAmpDeg": 0, "freqHz": 24, "mix": 1 }]
      }
    },
    {
      "name": "wiggle-rot",
      "effect": {
        "enable": true,
        "allowAngleNudge": true,
        "units": [{ "type": "wiggle", "freqHz": 1, "waveform": "sine", "angleAmpDeg": 5, "mix": 1 }]
      }
    }
    ]
}

Integrasi ke pipeline (1 blok, simpel)
import { computeBasicState, resolveFinalAngle } from "./LayerLogicBasic";
import { getSpinAngleDeg } from "./LayerLogicSpin";
import { computeOrbitState } from "./LayerLogicOrbit";
import { getClockDrivenImageAngle } from "./LayerLogicClock";
import { computeEffectState, applyEffectToRenderable, type EffectConfig } from "./LayerLogicEffect";

function renderableFromAll(
  basicCfg: any, canvas: {x:number;y:number},
  spinCfg: any, orbitCfg: any, clockCfg: any, effectCfg: EffectConfig
) {
  // 1) Basic
  const basic = computeBasicState(basicCfg, canvas);

  // 2) Spin
  const spinAngle = getSpinAngleDeg(spinCfg);

  // 3) Orbit (posisi + saran orientasi internal orbit)
  const orbit = computeOrbitState(orbitCfg, basic.positionPx, { spinAngleDeg: spinAngle });

  // 4) Clock (boleh inherit spin)
  const clockAngle = getClockDrivenImageAngle(clockCfg, { inheritSpinDeg: spinAngle });

  // 5) Final angle (prioritas: Clock > Spin > Manual; orbit boleh kasih fallback orientasi)
  const angleFinal = resolveFinalAngle(basic.baseAngleDeg, {
    clockAngleDeg: clockAngle ?? orbit.orientationDeg,
    spinAngleDeg: spinAngle,
  }).angleDeg;

  // 6) Effects (opacity/scale/pos/angle nudge)
  const eff = computeEffectState(effectCfg);
  const afterEff = applyEffectToRenderable(
    {
      positionPx: orbit.positionPx,
      scale: basic.scale,
      opacity: basic.opacity,
      finalAngleDeg: angleFinal,
    },
    eff,
    effectCfg.allowAngleNudge ?? false // default: tidak mengubah orientasi
  );

  // 7) Output siap render
  return {
    imageUrl: basic.imageUrl,
    zIndex: basic.zIndex,
    visible: basic.visible,
    anchor01: basic.anchor01,
    imageTipAngle360: basic.imageTipAngle360,
    imageBaseAngle360: basic.imageBaseAngle360,

    positionPx: afterEff.positionPx,
    scale: afterEff.scale,
    opacity: afterEff.opacity,
    finalAngleDeg: afterEff.finalAngleDeg
  };
}

“Tell it like it is”

Effect bukan pengganti Spin/Clock. Dia post-processing. Angle cuma boleh ditambah kecil kalau kamu set allowAngleNudge=true. Default-nya NO biar konsisten sama aturan “Spin OR manual; Clock bisa override”.

Semua fungsi pure; gampang dites; gak ada timer/raf di dalam modul.

Kalau kamu mau tambah blur, hue/brightness, atau envelope kompleks (attack/decay/sustain/release), tinggal bilang—gue tambah field di EffectState + helpernya, tanpa ngacak API yang udah kamu pakai.
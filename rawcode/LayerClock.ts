clock logic yang updated & lengkap. Ini modul TypeScript siap drop-in, pure logic (tanpa lib eksternal) dan patuh sama konvensi kamu: sudut 0–360, “up = 90°”, serta interplay dengan Spin (“Spin ON mengabaikan manual angle”, imageSpin: "none" | "true" | "sec" | "min" | "hour"). Juga dukung timezone, tick vs smooth, dan anchor tip/base.

Taruh file ini sebagai LayerLogicClock.ts (atau nama yang kamu pakai untuk logic).
Tidak ada dependency selain TS/JS standard.

// LayerLogicClock.ts
// Clock logic: angles 0–360, with "up = 90°", clockwise positive.
// No external deps. Compatible with your LayerBasic → (LayerSpin) → render pipeline.

export type TickMode = "smooth" | "tick";
export type TimeFormat = 12 | 24;
export type ImageSpinMode = "none" | "true" | "sec" | "min" | "hour";

export interface ClockCenter {
  x: number;
  y: number;
}

export interface ClockConfig {
  /** Master enable. If false, this module does nothing. */
  enable: boolean;

  /** IANA timezone e.g., "Asia/Jakarta". If not provided, system timezone is used. */
  timezone?: string;

  /** "smooth": second hand moves continuously. "tick": second jumps per detik. */
  tickMode?: TickMode;

  /** 12 or 24 (for display formatting only, not used in angle math). */
  timeFormat?: TimeFormat;

  /**
   * Which motion source controls the image orientation:
   * - "none": no motion from clock.
   * - "true": inherit external Spin config (if any). If not available, fallback to "none".
   * - "sec" | "min" | "hour": bind orientation to that hand.
   */
  imageSpin?: ImageSpinMode;

  /**
   * Optional geometry helpers for your renderer:
   * Angles 0–360 with up = 90.
   * If you need to compute anchors for image tip/base relative to the clock,
   * these offsets help map sprite edges to angles.
   */
  imageTipAngle360?: number;
  imageBaseAngle360?: number;

  /** Visual placement hints (forwarded to renderer if needed) */
  clockCenter?: ClockCenter;
  centerBaseRadius?: number;
}

/** Resulting angles (deg), 0–360, up=90, clockwise positive. */
export interface ClockAngles {
  hour: number;
  min: number;
  sec: number;
}

/** Orientation chosen for the image (deg) if imageSpin is active, else null. */
export interface ImageOrientation {
  deg: number | null;
  source: "sec" | "min" | "hour" | "inherit" | "none";
}

/** Snapshot of computed clock state you can pass to renderer. */
export interface ClockState {
  timeISO: string;            // Zoned timestamp string for debugging/telemetry
  angles: ClockAngles;        // hour/min/sec angles (0–360, up=90)
  imageOrientation: ImageOrientation; // null if not controlled by clock
  // passthrough geometry to renderer if you use it
  clockCenter?: ClockCenter;
  centerBaseRadius?: number;
}

/** Utility: keep 0..360 */
export function normalize360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/**
 * Extracts zoned hours/minutes/seconds using Intl API.
 * For ms, we reuse local ms (minor drift on DST boundary is acceptable for UI).
 */
function getZonedHMS(now: Date, timeZone?: string): { h: number; m: number; s: number; ms: number; iso: string } {
  // Parts for hours/minutes/seconds in target timezone
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    timeZone: timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = fmt.formatToParts(now);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? "0");

  const h = get("hour");
  const m = get("minute");
  const s = get("second");
  const ms = now.getMilliseconds(); // approximate ms in target zone (good enough for smooth UI)
  // Build an ISO-like string for logging (not exact zone offset)
  const iso = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now).replace(" ", "T");

  return { h, m, s, ms, iso };
}

/**
 * Convert HMS to angles with convention:
 *   - 0° is "right", 90° is "up" (12 o'clock), clockwise positive.
 *   - secondAngle = 90 + 6 * seconds
 *   - minuteAngle = 90 + 6 * (minutes + seconds/60)
 *   - hourAngle   = 90 + 30 * (hours%12 + minutes/60 + seconds/3600)
 * If tickMode = "tick", seconds has no fractional ms (jumps per detik).
 */
export function computeClockAngles(
  time: { h: number; m: number; s: number; ms: number },
  tickMode: TickMode = "smooth"
): ClockAngles {
  const sFraction = tickMode === "smooth" ? time.s + time.ms / 1000 : time.s;
  const minTotal = time.m + sFraction / 60;
  const hourTotal = (time.h % 12) + minTotal / 60;

  const sec = normalize360(90 + 6 * sFraction);
  const min = normalize360(90 + 6 * minTotal);
  const hour = normalize360(90 + 30 * hourTotal);

  return { hour, min, sec };
}

/**
 * Decide image orientation from config + angles + optional inherited spin angle.
 * - "none"  → null
 * - "true"  → use inheritSpinDeg if provided, else null
 * - "sec"   → sec angle
 * - "min"   → min angle
 * - "hour"  → hour angle
 */
export function resolveImageOrientation(
  cfg: ClockConfig,
  angles: ClockAngles,
  inheritSpinDeg?: number | null
): ImageOrientation {
  const mode = cfg.imageSpin ?? "none";
  switch (mode) {
    case "none":
      return { deg: null, source: "none" };
    case "true":
      if (typeof inheritSpinDeg === "number") {
        return { deg: normalize360(inheritSpinDeg), source: "inherit" };
      }
      return { deg: null, source: "inherit" }; // no external spin available → no motion
    case "sec":
      return { deg: angles.sec, source: "sec" };
    case "min":
      return { deg: angles.min, source: "min" };
    case "hour":
      return { deg: angles.hour, source: "hour" };
    default:
      return { deg: null, source: "none" };
  }
}

/**
 * Main API: compute a full clock state snapshot.
 * - Pass `inheritSpinDeg` if Spin is active upstream; if you set imageSpin="true",
 *   this angle will be used. If Spin OFF, pass null/undefined.
 * - `nowMs` is optional (default Date.now()).
 */
export function computeClockState(
  cfg: ClockConfig,
  options?: { nowMs?: number; inheritSpinDeg?: number | null }
): ClockState {
  const { nowMs, inheritSpinDeg } = options ?? {};
  const now = new Date(nowMs ?? Date.now());

  if (!cfg.enable) {
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
  const imageOrientation = resolveImageOrientation(cfg, angles, inheritSpinDeg ?? null);

  return {
    timeISO: iso,
    angles,
    imageOrientation,
    clockCenter: cfg.clockCenter,
    centerBaseRadius: cfg.centerBaseRadius,
  };
}

/* -------------------------------------------------------------------------- */
/* Optional helpers for anchor geometry (Tip/Base)                            */
/* -------------------------------------------------------------------------- */

/**
 * Given an image pointing RIGHT at 0°, produce the derived angles for
 * its tip/base according to your config offsets (both 0–360 with up=90).
 * This lets renderer compute anchor points along the image border.
 */
export function getImageAnchorAngles(
  baseAngleDeg: number,
  cfg: Pick<ClockConfig, "imageTipAngle360" | "imageBaseAngle360">
): { tipDeg: number; baseDeg: number } {
  const tipOff = cfg.imageTipAngle360 ?? 0;
  const baseOff = cfg.imageBaseAngle360 ?? 180; // opposite by default
  return {
    tipDeg: normalize360(baseAngleDeg + tipOff),
    baseDeg: normalize360(baseAngleDeg + baseOff),
  };
}

/**
 * Convenience to collapse everything for your pipeline:
 * - If Spin is ON (upstream), pass its current angle via inheritSpinDeg.
 * - If Spin is OFF, pass inheritSpinDeg = null so "imageSpin: 'true'" becomes no-op.
 * - If imageSpin is "sec|min|hour", we return that angle to override manual image angle.
 */
export function getClockDrivenImageAngle(
  cfg: ClockConfig,
  options?: { nowMs?: number; inheritSpinDeg?: number | null }
): number | null {
  const state = computeClockState(cfg, options);
  return state.imageOrientation.deg;
}

Cara pakai di pipeline kamu (contoh cepat)
// Somewhere in your pipeline layer (pseudo)
import { computeClockState, getClockDrivenImageAngle, ClockConfig } from "./LayerLogicClock";

function applyClockLayer(
  baseImageAngleDeg: number,               // manual/default angle from LayerBasic
  clockCfg: ClockConfig,                   // your clock config
  inheritSpinDeg: number | null | undefined // Spin angle if Spin active; otherwise null
) {
  // Decide whether clock should override the image angle
  const clockAngle = getClockDrivenImageAngle(clockCfg, { inheritSpinDeg });

  // Rule: if Spin ON or imageSpin used → manual angle ignored
  const finalAngle = (typeof clockAngle === "number")
    ? clockAngle
    : (typeof inheritSpinDeg === "number")
      ? inheritSpinDeg
      : baseImageAngleDeg;

  const state = computeClockState(clockCfg, { inheritSpinDeg });
  return {
    finalAngleDeg: finalAngle, // use this for render
    clockState: state,         // pass to any UI/overlay if you display hands
  };
}

Catatan penting (biar selaras sama rule kamu)

Spin vs manual angle: di atas, kalau imageSpin menghasilkan sudut (atau Spin aktif dan imageSpin: "true" + inheritSpinDeg tersedia), manual angle otomatis diabaikan (sesuai rule kamu).

imageSpin: "true" → hanya jalan kalau kamu memang meneruskan inheritSpinDeg (Spin aktif). Kalau tidak, dia jadi no-op (sesuai spesifikasi “true uses spin config; if missing spin config then default to no motion”).

tick vs smooth:

"smooth": detik bergerak halus (pakai ms).

"tick": detik lompat per detik (tanpa fraksi ms). Minute/hour tetap halus mengikuti detik—kalau mau lock total di “tick jam dinding” (minute cuma lompat saat detik = 0), tinggal set minTotal = time.m & hourTotal = (time.h%12) + time.m/60 di mode tick.

gas. ini clock.config.json siap pakai (tanpa komentar). Struktur sesuai tipe yg tadi kita bikin: enable, timezone, tickMode, timeFormat, imageSpin, imageTipAngle360, imageBaseAngle360, clockCenter, centerBaseRadius. Aku sekalian taruh beberapa preset biar kamu cepat switch.

{
  "version": 1,
  "clock": {
    "enable": true,
    "timezone": "Asia/Jakarta",
    "tickMode": "smooth",
    "timeFormat": 12,
    "imageSpin": "sec",
    "imageTipAngle360": 0,
    "imageBaseAngle360": 180,
    "clockCenter": { "x": 256, "y": 256 },
    "centerBaseRadius": 100
  },
  "presets": [
    {
      "name": "default-smooth-sec",
      "clock": {
        "enable": true,
        "timezone": "Asia/Jakarta",
        "tickMode": "smooth",
        "timeFormat": 12,
        "imageSpin": "sec",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180,
        "clockCenter": { "x": 256, "y": 256 },
        "centerBaseRadius": 100
      }
    },
    {
      "name": "tick-no-spin",
      "clock": {
        "enable": true,
        "timezone": "Asia/Jakarta",
        "tickMode": "tick",
        "timeFormat": 24,
        "imageSpin": "none",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180,
        "clockCenter": { "x": 200, "y": 200 },
        "centerBaseRadius": 80
      }
    },
    {
      "name": "inherit-spin-from-LayerSpin",
      "clock": {
        "enable": true,
        "timezone": "Asia/Jakarta",
        "tickMode": "smooth",
        "timeFormat": 24,
        "imageSpin": "true",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180,
        "clockCenter": { "x": 256, "y": 256 },
        "centerBaseRadius": 100
      }
    },
    {
      "name": "minute-hand-orientation",
      "clock": {
        "enable": true,
        "timezone": "UTC",
        "tickMode": "smooth",
        "timeFormat": 24,
        "imageSpin": "min",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180,
        "clockCenter": { "x": 320, "y": 240 },
        "centerBaseRadius": 120
      }
    }
  ]
}

Pakai di pipeline

Simpan sebagai yuzha/config/clock.config.json (atau lokasi kamu).

Load di TS:

import cfg from "@/config/clock.config.json";
import { computeClockState, getClockDrivenImageAngle } from "@/logic/LayerLogicClock";
// contoh:
const state = computeClockState(cfg.clock, { inheritSpinDeg }); 
const finalAngle = getClockDrivenImageAngle(cfg.clock, { inheritSpinDeg }) ?? manualAngle;


Ganti clockCenter/centerBaseRadius sesuai koordinat canvas kamu.

imageSpin: "true" akan pakai sudut dari LayerSpin jika kamu pass inheritSpinDeg; kalau tidak ada, dia no-op (sesuai aturan kamu).
gas—aku bikinin LayerBasic versi “rapi & lengkap” dengan pola yang sama kayak clock tadi: pure TypeScript, gak ada dependency, patuh konvensi angle 0–360 (up = 90°), output langsung renderable (path, posisi, scale, z-order, opacity, visibility, dst). Juga aku sediain util buat final angle resolution kalau nanti di pipeline kamu mau “override” oleh Spin/Clock.

LayerLogicBasic.ts
// LayerLogicBasic.ts
// Basic layer: path, position, scale, angle, zIndex, opacity, visibility.
// Konvensi sudut: 0–360°, "up = 90°", clockwise positif. No external deps.

export type Vec2 = { x: number; y: number };

export type AnchorMode = "center" | "top-left" | "custom";

/** Bagaimana menafsirkan position: absolute px atau fraction (0..1 dari canvas) */
export type PositionMode = "absolute" | "fraction";

/** Mode scaling: uniform (satu angka) atau XY */
export type ScaleMode = "uniform" | "xy";

export interface BasicConfig {
  /** Master enable untuk layer ini */
  enable: boolean;

  /** Urutan layer (semakin besar, semakin di depan) */
  zIndex?: number;

  /** Path gambar/asset (URL absolut/relatif) */
  imageUrl: string;

  /** Posisi di canvas */
  position: Vec2;

  /** Interpretasi posisi: absolute pixels atau fraction 0..1 */
  positionMode?: PositionMode;

  /**
   * Skala:
   * - scaleMode "uniform": pakai scaleUniform
   * - scaleMode "xy": pakai scaleXY
   */
  scaleMode?: ScaleMode;
  scaleUniform?: number;   // default 1
  scaleXY?: Vec2;          // default {1,1}

  /** Sudut manual 0–360, up=90. Hanya dipakai jika tidak di-override Spin/Clock. */
  angleDeg?: number;

  /** Visibilitas & opacity */
  visible?: boolean;       // default true
  opacity?: number;        // 0..1, default 1

  /** Anchor/pivot untuk rotasi & penempatan */
  anchorMode?: AnchorMode; // default "center"
  anchorCustom?: Vec2;     // dipakai jika anchorMode = "custom" (0..1 relatif ukuran image)

  /**
   * Opsi bantuan untuk geometri pointer (opsional):
   * dipakai renderer jika butuh orientasi ujung & pangkal sprite.
   */
  imageTipAngle360?: number;   // default 0
  imageBaseAngle360?: number;  // default 180
}

/** Data siap render dari Basic layer (belum termasuk efek/Spin/Clock/Orbit) */
export interface BasicState {
  kind: "basic";
  enabled: boolean;
  zIndex: number;
  imageUrl: string;
  // posisi absolut (px) setelah interpretasi positionMode
  positionPx: Vec2;
  // skala akhir
  scale: Vec2; // {sx, sy}
  // sudut dasar (sebelum override Spin/Clock)
  baseAngleDeg: number;
  // visibilitas
  visible: boolean;
  opacity: number;
  // anchor untuk rotasi/penempatan di renderer (0..1 relatif ukuran image)
  anchor01: Vec2;
  // helpers orientasi
  imageTipAngle360: number;
  imageBaseAngle360: number;
}

/** Hasil final angle setelah mempertimbangkan override */
export interface FinalAngleDecision {
  angleDeg: number;
  source: "clock" | "spin" | "manual";
}

/** Clamp ke 0..1  */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function normalize360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/** Hitung anchor (pivot) 0..1 berdasarkan mode */
export function resolveAnchor01(cfg: BasicConfig): Vec2 {
  const mode = cfg.anchorMode ?? "center";
  if (mode === "top-left") return { x: 0, y: 0 };
  if (mode === "custom") {
    const a = cfg.anchorCustom ?? { x: 0.5, y: 0.5 };
    return { x: clamp01(a.x), y: clamp01(a.y) };
  }
  // center
  return { x: 0.5, y: 0.5 };
}

/** Hitung skala akhir */
export function resolveScale(cfg: BasicConfig): Vec2 {
  const mode = cfg.scaleMode ?? "uniform";
  if (mode === "xy") {
    const s = cfg.scaleXY ?? { x: 1, y: 1 };
    return { x: s.x, y: s.y };
  }
  const k = cfg.scaleUniform ?? 1;
  return { x: k, y: k };
}

/** Konversi posisi ke px (kalau fraction, butuh canvas size) */
export function resolvePositionPx(
  cfg: BasicConfig,
  canvasSizePx: Vec2
): Vec2 {
  const mode = cfg.positionMode ?? "absolute";
  const p = cfg.position;
  if (mode === "fraction") {
    return {
      x: p.x * canvasSizePx.x,
      y: p.y * canvasSizePx.y,
    };
  }
  return p;
}

/** Build BasicState siap render (belum override Spin/Clock) */
export function computeBasicState(
  cfg: BasicConfig,
  canvasSizePx: Vec2
): BasicState {
  const enabled = !!cfg.enable;
  const zIndex = cfg.zIndex ?? 0;
  const imageUrl = cfg.imageUrl;
  const positionPx = resolvePositionPx(cfg, canvasSizePx);
  const scale = resolveScale(cfg);
  const baseAngleDeg = normalize360(cfg.angleDeg ?? 0);
  const visible = cfg.visible ?? true;
  const opacity = cfg.opacity ?? 1;
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
    imageTipAngle360: normalize360(cfg.imageTipAngle360 ?? 0),
    imageBaseAngle360: normalize360(cfg.imageBaseAngle360 ?? 180),
  };
}

/**
 * Putuskan sudut final dengan prioritas:
 * 1) clockAngleDeg (jika ada) → override manual & spin (sesuai rule kamu saat Clock memegang orientasi)
 * 2) spinAngleDeg (jika ada)  → override manual
 * 3) manual (baseAngleDeg)
 *
 * Kalau kamu ingin "clock mengikuti spin saat Spin ON", panggil fungsi ini
 * dengan clockAngleDeg = null, dan atur rule itu di modul Clock/Orbit.
 */
export function resolveFinalAngle(
  baseAngleDeg: number,
  overrides: {
    clockAngleDeg?: number | null;
    spinAngleDeg?: number | null;
  }
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

/** Helper opsional: hitung sudut tip/base relatif dari sudut tertentu */
export function getImageAnchorAngles(
  baseAngleDeg: number,
  cfg: Pick<BasicConfig, "imageTipAngle360" | "imageBaseAngle360">
): { tipDeg: number; baseDeg: number } {
  const tipOff = cfg.imageTipAngle360 ?? 0;
  const baseOff = cfg.imageBaseAngle360 ?? 180;
  return {
    tipDeg: normalize360(baseAngleDeg + tipOff),
    baseDeg: normalize360(baseAngleDeg + baseOff),
  };
}

Cara pakai di pipeline (contoh singkat)
import {
  computeBasicState,
  resolveFinalAngle,
  type BasicConfig,
} from "./LayerLogicBasic";

import { getClockDrivenImageAngle } from "./LayerLogicClock"; // dari modul clock kamu

function processLayerBasic(
  cfg: BasicConfig,
  canvasSize: { x: number; y: number },
  spinAngleDeg: number | null,      // dari LayerSpin kalau aktif; kalau OFF = null
  clockAngleDeg: number | null      // dari Clock kalau kamu putuskan override; kalau tidak = null
) {
  const basic = computeBasicState(cfg, canvasSize);

  // aturan prioritas: Clock > Spin > Manual
  const final = resolveFinalAngle(basic.baseAngleDeg, { clockAngleDeg, spinAngleDeg });

  return {
    ...basic,
    finalAngleDeg: final.angleDeg,    // INI yang dipakai renderer
    angleSource: final.source,        // "clock" | "spin" | "manual"
  };
}

basic.config.json (contoh)
{
  "version": 1,
  "basic": {
    "enable": true,
    "zIndex": 10,
    "imageUrl": "https://cdn.example.com/assets/needle.png",
    "position": { "x": 0.5, "y": 0.5 },
    "positionMode": "fraction",
    "scaleMode": "uniform",
    "scaleUniform": 1,
    "angleDeg": 90,
    "visible": true,
    "opacity": 1,
    "anchorMode": "center",
    "imageTipAngle360": 0,
    "imageBaseAngle360": 180
  },
  "presets": [
    {
      "name": "center-px",
      "basic": {
        "enable": true,
        "zIndex": 1,
        "imageUrl": "/images/logo.png",
        "position": { "x": 256, "y": 256 },
        "positionMode": "absolute",
        "scaleMode": "xy",
        "scaleXY": { "x": 0.8, "y": 0.8 },
        "angleDeg": 0,
        "visible": true,
        "opacity": 0.95,
        "anchorMode": "top-left",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180
      }
    },
    {
      "name": "fraction-center-rotated",
      "basic": {
        "enable": true,
        "zIndex": 5,
        "imageUrl": "https://cdn.example.com/sprites/compass.png",
        "position": { "x": 0.5, "y": 0.5 },
        "positionMode": "fraction",
        "scaleMode": "uniform",
        "scaleUniform": 1.2,
        "angleDeg": 45,
        "visible": true,
        "opacity": 1,
        "anchorMode": "center",
        "imageTipAngle360": 0,
        "imageBaseAngle360": 180
      }
    }
  ]
}

Integrasi cepat (loading JSON di TS)
// misal di loader kamu
import basicCfgFile from "@/config/basic.config.json";
import { computeBasicState } from "@/logic/LayerLogicBasic";

const canvas = { x: 512, y: 512 };
const basicState = computeBasicState(basicCfgFile.basic, canvas);

Kenapa desainnya begini (jujur & to-the-point)

LayerBasic harus “self-contained renderable” → makanya aku keluarkan BasicState yang sudah absolute (px), sudah scale final, sudah ada baseAngle, anchor, zIndex, visibility.

Override angle gak ditanam di Basic supaya tetap single-responsibility. Kamu override via resolveFinalAngle() di step setelah Spin/Clock (sesuai urutan pipeline kamu).

Konvensi up = 90° dijaga konsisten, termasuk helper getImageAnchorAngles() kalau kamu butuh menghitung orientasi ujung/pangkal sprite.
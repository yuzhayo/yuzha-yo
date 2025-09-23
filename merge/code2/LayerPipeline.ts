// LayerPipeline.ts
// Composer untuk jalur parsial tanpa mengubah pipeline inti.
// Pure, deterministic, ES2020, tanpa I/O atau side-effects.

import type {
  LibraryConfig,
  ProcessingContext,
  LayerData,
  LayerConfigNormalized,
  StageConfigNormalized,
} from "./LayerTypes";
import { validateLibraryConfig } from "./LayerValidator";
import { applyBasicTransform } from "./LayerLogicBasic";
import { applySpin } from "./LayerLogicSpin";
import { applyOrbit } from "./LayerLogicOrbit";
import { applyPulse } from "./LayerLogicPulse";
import { applyFade } from "./LayerLogicFade";
import { produceLayers } from "./LayerProducer";

/**
 * Helper: validasi + normalisasi, kembalikan stage & layers normalized.
 * Melempar error jika invalid (konsisten dengan Producer).
 */
function normalizeInput(input: LibraryConfig) {
  const res = validateLibraryConfig(input);
  if (!res.ok || !res.normalized) {
    const reason =
      (res as any).errors?.map((e: any) => `${e.path}: ${e.message}`).join("; ") ||
      "invalid config";
    throw new Error(`LayerPipeline: validation failed: ${reason}`);
  }
  return {
    stage: res.normalized.stage,
    layers: res.normalized.layers,
    warnings: res.warnings?.map((w) => `${w.path}: ${w.message}`) ?? [],
  };
}

/**
 * Helper: build LayerData untuk satu layer normalized dengan wrapper terpilih.
 * Urutan wrapper mengikuti pipeline utama:
 *   spin → orbit → pulse → fade
 * Hanya wrapper yang di-enable oleh composer yang diaplikasikan (behavior.enabled tetap dihormati).
 */
function buildLayerData(
  norm: LayerConfigNormalized,
  idx: number,
  ctx: ProcessingContext,
  options: {
    doSpin: boolean;
    doOrbit: boolean;
    doPulse: boolean;
    doFade: boolean;
  },
  stage: StageConfigNormalized,
): LayerData {
  // 1) basic transform (pass-through normalized ke bentuk dasar)
  const basic = applyBasicTransform(norm, stage);

  // 2) wrappers sesuai pilihan composer
  const spinRes = options.doSpin
    ? applySpin({ angle: basic.angle }, norm.behaviors.spin, ctx.time)
    : { angle: basic.angle };

  const orbitRes = options.doOrbit
    ? applyOrbit({ position: basic.position }, norm.behaviors.orbit, ctx.time, basic.position)
    : { position: basic.position };

  const pulseRes = options.doPulse
    ? applyPulse({ scale: basic.scale }, norm.behaviors.pulse, ctx.time)
    : { scale: basic.scale };

  const fadeRes = options.doFade
    ? applyFade({ opacity: basic.opacity }, norm.behaviors.fade, ctx.time)
    : { opacity: basic.opacity };

  // 3) final transform
  const finalTransform = {
    position: orbitRes.position,
    scale: pulseRes.scale,
    angle: spinRes.angle,
    tilt: basic.tilt,
    anchor: basic.anchor,
    opacity: fadeRes.opacity,
  };

  // 4) bentuk LayerData (konsisten dengan SPEC v0.2)
  const ld: LayerData = {
    id: norm.layerId,
    zIndex: idx, // stabil: fallback urutan input
    asset: norm.assetRef,
    transform: finalTransform,
    container: norm.container
      ? {
          width: norm.container.width,
          height: norm.container.height,
          fitMode: norm.container.fitMode,
          alignment: norm.container.alignment,
        }
      : undefined,
    behaviors: norm.behaviors,
    events: norm.events,
    state: {
      isHovered: false,
      isPressed: false,
      isActive: false,
      isVisible: finalTransform.opacity > 0,
    },
  };

  return ld;
}

/**
 * Generic composer: pilih wrapper yang aktif.
 */
export function compose(wrappers: Array<"spin" | "orbit" | "pulse" | "fade">) {
  const set = new Set(wrappers);
  const opts = {
    doSpin: set.has("spin"),
    doOrbit: set.has("orbit"),
    doPulse: set.has("pulse"),
    doFade: set.has("fade"),
  };
  return (
    input: LibraryConfig,
    ctx: ProcessingContext,
  ): { layers: LayerData[]; warnings: string[] } => {
    const { stage, layers, warnings } = normalizeInput(input);
    const out = layers.map((norm, idx) => buildLayerData(norm, idx, ctx, opts, stage));
    return { layers: out, warnings };
  };
}

/**
 * Jalur convenience — sesuai yang kamu mau (basic > render, dst).
 * Semua mengembalikan { layers, warnings } agar konsisten dengan produceLayers.
 */

export function produceBasic(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  // no wrappers
  const { stage, layers, warnings } = normalizeInput(input);
  const out = layers.map((norm, idx) =>
    buildLayerData(
      norm,
      idx,
      ctx,
      { doSpin: false, doOrbit: false, doPulse: false, doFade: false },
      stage,
    ),
  );
  return { layers: out, warnings };
}

export function produceBasicSpin(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  const { stage, layers, warnings } = normalizeInput(input);
  const out = layers.map((norm, idx) =>
    buildLayerData(
      norm,
      idx,
      ctx,
      { doSpin: true, doOrbit: false, doPulse: false, doFade: false },
      stage,
    ),
  );
  return { layers: out, warnings };
}

export function produceBasicOrbit(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  const { stage, layers, warnings } = normalizeInput(input);
  const out = layers.map((norm, idx) =>
    buildLayerData(
      norm,
      idx,
      ctx,
      { doSpin: false, doOrbit: true, doPulse: false, doFade: false },
      stage,
    ),
  );
  return { layers: out, warnings };
}

export function produceBasicPulse(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  const { stage, layers, warnings } = normalizeInput(input);
  const out = layers.map((norm, idx) =>
    buildLayerData(
      norm,
      idx,
      ctx,
      { doSpin: false, doOrbit: false, doPulse: true, doFade: false },
      stage,
    ),
  );
  return { layers: out, warnings };
}

export function produceBasicFade(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  const { stage, layers, warnings } = normalizeInput(input);
  const out = layers.map((norm, idx) =>
    buildLayerData(
      norm,
      idx,
      ctx,
      { doSpin: false, doOrbit: false, doPulse: false, doFade: true },
      stage,
    ),
  );
  return { layers: out, warnings };
}

/**
 * Alias ke pipeline penuh yang sudah ada.
 * Ini cuma mem-forward ke LayerProducer.produceLayers agar tidak duplikasi logic.
 */
export const produceFull = produceLayers;

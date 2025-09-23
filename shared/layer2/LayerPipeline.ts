import type {
  LayerConfigNormalized,
  LayerData,
  LibraryConfig,
  ProcessingContext,
  StageConfigNormalized,
} from "./LayerTypes";
import { validateLibraryConfig } from "./LayerValidator";
import { applyBasicTransform } from "./LayerLogicBasic";
import { applySpin } from "./LayerLogicSpin";
import { applyOrbit } from "./LayerLogicOrbit";
import { applyClock } from "./LayerLogicClock";

interface WrapperOptions {
  doSpin: boolean;
  doOrbit: boolean;
  doClock: boolean;
}

function normalizeInput(input: LibraryConfig) {
  const res = validateLibraryConfig(input);
  if (!res.ok || !res.normalized) {
    const reason =
      (res as any).errors?.map((e: any) => `${e.path}: ${e.message}`).join("; ") ||
      "invalid config";
    throw new Error(`LayerPipeline(layer2): validation failed: ${reason}`);
  }
  return {
    stage: res.normalized.stage,
    layers: res.normalized.layers,
    warnings: res.warnings?.map((w) => `${w.path}: ${w.message}`) ?? [],
  };
}

function buildLayerData(
  norm: LayerConfigNormalized,
  idx: number,
  ctx: ProcessingContext,
  options: WrapperOptions,
  stage: StageConfigNormalized,
): LayerData {
  const basic = applyBasicTransform(norm, stage);

  const spinRes = options.doSpin
    ? applySpin({ angle: basic.angle }, norm.behaviors.spin, ctx.time)
    : { angle: basic.angle };

  const orbitRes = options.doOrbit
    ? applyOrbit({ position: basic.position }, norm.behaviors.orbit, ctx.time, basic.position)
    : { position: basic.position };

  const clockRes = options.doClock
    ? applyClock({ angle: spinRes.angle }, norm.behaviors.clock, ctx.time)
    : { angle: spinRes.angle };

  const finalTransform = {
    position: orbitRes.position,
    scale: basic.scale,
    angle: clockRes.angle,
    tilt: basic.tilt,
    anchor: basic.anchor,
    opacity: basic.opacity,
  };

  return {
    id: norm.layerId,
    zIndex: idx,
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
}

export function compose(wrappers: Array<"spin" | "orbit" | "clock">) {
  const set = new Set(wrappers);
  const opts: WrapperOptions = {
    doSpin: set.has("spin"),
    doOrbit: set.has("orbit"),
    doClock: set.has("clock"),
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

export function produceBasic(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  const { stage, layers, warnings } = normalizeInput(input);
  const out = layers.map((norm, idx) =>
    buildLayerData(norm, idx, ctx, { doSpin: false, doOrbit: false, doClock: false }, stage),
  );
  return { layers: out, warnings };
}

export function produceBasicSpin(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  const { stage, layers, warnings } = normalizeInput(input);
  const out = layers.map((norm, idx) =>
    buildLayerData(norm, idx, ctx, { doSpin: true, doOrbit: false, doClock: false }, stage),
  );
  return { layers: out, warnings };
}

export function produceBasicOrbit(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  const { stage, layers, warnings } = normalizeInput(input);
  const out = layers.map((norm, idx) =>
    buildLayerData(norm, idx, ctx, { doSpin: false, doOrbit: true, doClock: false }, stage),
  );
  return { layers: out, warnings };
}

export function produceBasicClock(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  const { stage, layers, warnings } = normalizeInput(input);
  const out = layers.map((norm, idx) =>
    buildLayerData(norm, idx, ctx, { doSpin: false, doOrbit: false, doClock: true }, stage),
  );
  return { layers: out, warnings };
}

export function produceBasicSpinOrbitClock(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  const { stage, layers, warnings } = normalizeInput(input);
  const opts: WrapperOptions = { doSpin: true, doOrbit: true, doClock: true };
  const out = layers.map((norm, idx) => buildLayerData(norm, idx, ctx, opts, stage));
  return { layers: out, warnings };
}

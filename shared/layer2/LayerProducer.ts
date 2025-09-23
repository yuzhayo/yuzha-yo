import type {
  LayerConfigNormalized,
  LayerData,
  LibraryConfig,
  ProcessingContext,
} from "./LayerTypes";
import { validateLibraryConfig } from "./LayerValidator";
import { applyBasicTransform } from "./LayerLogicBasic";
import { applySpin } from "./LayerLogicSpin";
import { applyOrbit } from "./LayerLogicOrbit";
import { applyClock } from "./LayerLogicClock";
import { resolveAsset } from "./LayerLogicBasicScreenMapping";

export function produceLayers(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  const res = validateLibraryConfig(input);
  if (!res.ok || !res.normalized) {
    const reason =
      (res as any).errors?.map((e: any) => `${e.path}: ${e.message}`).join("; ") ||
      "invalid config";
    throw new Error(`LayerProducer(layer2): validation failed: ${reason}`);
  }

  const { stage, layers } = res.normalized;
  const warnings = res.warnings?.map((w) => `${w.path}: ${w.message}`) ?? [];

  const out: LayerData[] = layers.map((norm: LayerConfigNormalized, idx: number) => {
    resolveAsset(norm.assetRef, ctx.registry);

    const basic = applyBasicTransform(norm, stage);
    const spinRes = applySpin({ angle: basic.angle }, norm.behaviors.spin, ctx.time);
    const orbitRes = applyOrbit(
      { position: basic.position },
      norm.behaviors.orbit,
      ctx.time,
      basic.position,
    );
    const clockRes = applyClock({ angle: spinRes.angle }, norm.behaviors.clock, ctx.time);

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
  });

  return { layers: out, warnings };
}

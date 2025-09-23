// LayerProducer.ts
import type {
  LibraryConfig,
  LayerData,
  ProcessingContext,
  LayerConfigNormalized,
} from "./LayerTypes";
import { validateLibraryConfig } from "./LayerValidator";
import { resolveAsset } from "./LayerImageResolver";
import { applyBasicTransform } from "./LayerLogicBasic";
import { applySpin } from "./LayerLogicSpin";
import { applyOrbit } from "./LayerLogicOrbit";
import { applyPulse } from "./LayerLogicPulse";
import { applyFade } from "./LayerLogicFade";

/**
 * Orkestrasi end-to-end: JSON → normalized → transforms → wrappers → LayerData[].
 * - Tidak melakukan rendering atau I/O.
 * - ZIndex mengikuti urutan input (fallback stabil).
 * - Asumsi: ctx.time dalam detik (seconds).
 * - Urutan wrapper: spin → orbit → pulse → fade
 */
export function produceLayers(
  input: LibraryConfig,
  ctx: ProcessingContext,
): { layers: LayerData[]; warnings: string[] } {
  const res = validateLibraryConfig(input);
  if (!res.ok || !res.normalized) {
    const reason =
      (res as any).errors?.map((e: any) => `${e.path}: ${e.message}`).join("; ") ||
      "invalid config";
    throw new Error(`produceLayers: validation failed: ${reason}`);
  }

  const { stage, layers } = res.normalized;
  const warnings = res.warnings?.map((w) => `${w.path}: ${w.message}`) ?? [];

  const out: LayerData[] = layers.map((norm: LayerConfigNormalized, idx: number) => {
    // Resolve asset untuk memastikan registryKey valid (akan throw jika tidak ketemu).
    resolveAsset(norm.assetRef, ctx.registry);

    // Basic transform (pass-through normalized)
    const basic = applyBasicTransform(norm, stage);

    // Wrappers: spin -> orbit -> pulse -> fade
    const spinRes = applySpin({ angle: basic.angle }, norm.behaviors.spin, ctx.time);
    const orbitRes = applyOrbit(
      { position: basic.position },
      norm.behaviors.orbit,
      ctx.time,
      basic.position,
    );
    const pulseRes = applyPulse({ scale: basic.scale }, norm.behaviors.pulse, ctx.time);
    const fadeRes = applyFade({ opacity: basic.opacity }, norm.behaviors.fade, ctx.time);

    const finalTransform = {
      position: orbitRes.position,
      scale: pulseRes.scale,
      angle: spinRes.angle,
      tilt: basic.tilt,
      anchor: basic.anchor,
      opacity: fadeRes.opacity,
    };

    const ld: LayerData = {
      id: norm.layerId,
      zIndex: idx, // stabil: mengikuti urutan input
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
        isVisible: true,
      },
    };

    return ld;
  });

  return { layers: out, warnings };
}

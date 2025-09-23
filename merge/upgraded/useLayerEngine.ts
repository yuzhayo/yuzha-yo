// React glue to run the pure logic pipeline each frame and feed StagesEngine.
// NEW file. No code copied from legacy folders.

import { useEffect, useMemo, useRef } from "react";
import { produceFull } from "../../shared/layer/LayerPipeline";
import { layersToStageObjects } from "../../shared/layer/LayerAdapterStages";
import type { LibraryConfig, ProcessingContext, StageConfigNormalized } from "../../shared/layer/LayerTypes";
import type { RenderQuality } from "../../shared/stages/StagesTypes";
import { useStages } from "./useStages";

/** Build a minimal ProcessingContext each frame. Extend here if you add more runtime data. */
function makeProcessingContext(
  tMs: number,
  stage: StageConfigNormalized,
): ProcessingContext {
  // NOTE: Keep this in sync with your actual ProcessingContext definition.
  // If your ProcessingContext has more fields, extend below accordingly.
  return {
    time: {
      ms: tMs,
      s: tMs / 1000,
    },
    stage,
    registry: {
      // asset/texture registry placeholder; if you maintain a real registry elsewhere,
      // reference it here (still pure-readable from the hook).
      get: (_id: string) => undefined,
      has: (_id: string) => false,
    },
    // add other deterministic references if your types require them
  } as unknown as ProcessingContext;
}

export function useLayerEngine({
  config,
  quality,
  onError,
}: {
  config: LibraryConfig;
  quality?: Partial<RenderQuality>;
  onError?: (msg: string) => void;
}) {
  // Mount Stages engine (assumes existing hook in your codebase)
  const { engine, canvasRef } = useStages({ quality });

  // Keep last good StageConfig to tolerate transient nulls during mount
  const stageRef = useRef<StageConfigNormalized | null>(null);

  // Stable config reference (avoid mutation)
  const stableConfig = useMemo(() => config, [config]);

  useEffect(() => {
    if (!engine) return;

    let raf = 0;
    const loop = (tMs: number) => {
      try {
        const stage = (engine as any).getStage?.() as StageConfigNormalized | undefined;
        if (!stage) {
          raf = requestAnimationFrame(loop);
          return;
        }
        stageRef.current = stage;

        const ctx = makeProcessingContext(tMs, stage);
        const { layers/*, warnings*/ } = produceFull(ctx, stableConfig, stage);
        const objects = layersToStageObjects(layers, stage);

        // Push into renderer (Stages)
        (engine as any).updateObjects?.(objects);
      } catch (e: any) {
        onError?.(String(e?.message ?? e));
        // continue loop even after error to avoid freeze
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine, stableConfig, onError]);

  return { canvasRef, engine };
}

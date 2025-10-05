import React, { useEffect, useRef } from "react";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer, prepareLayer } from "../layer/LayerCore";
import { mountDOMLayers } from "../layer/LayerEngineDOM";
import type { EnhancedLayerData, LayerProcessor } from "../layer/LayerCorePipeline";
import { STAGE_SIZE, createStageTransformer } from "../utils/stage2048";

export default function StageDOM() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    let cleanupLayers: (() => void) | undefined;
    let cleanupTransform: (() => void) | undefined;

    const run = async () => {
      const config = loadLayerConfig();
      const twoDLayers = config.filter(is2DLayer);

      const layersWithProcessors: Array<{
        data: EnhancedLayerData;
        processors: LayerProcessor[];
      }> = [];

      for (const entry of twoDLayers) {
        const layer = await prepareLayer(entry, STAGE_SIZE);
        if (!layer) {
          console.warn(`[StageDOM] Skipping layer ${entry.layerId} - failed to prepare`);
          continue;
        }

        const processors: LayerProcessor[] = [];

        layersWithProcessors.push({
          data: { ...layer, imageTip: entry.imageTip, imageBase: entry.imageBase } as any,
          processors,
        });
      }

      cleanupLayers = await mountDOMLayers(stage, layersWithProcessors);
    };

    run().catch((error) => {
      console.error("Failed to initialise DOM stage", error);
    });

    cleanupTransform = createStageTransformer(stage, container, {
      resizeDebounce: 100,
    });

    return () => {
      cleanupTransform?.();
      cleanupLayers?.();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      <div ref={stageRef} className="block" />
    </div>
  );
}

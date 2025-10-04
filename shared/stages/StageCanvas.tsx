import React, { useEffect, useRef } from "react";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer, prepareLayer, type UniversalLayerData } from "../layer/LayerCore";
import { mountCanvasLayers } from "../layer/LayerEngineCanvas";
import { type LayerProcessor } from "../layer/LayerCorePipeline";
import { createSpinProcessor } from "../layer/LayerCorePipelineSpin";
import { STAGE_SIZE, createStageTransformer } from "../utils/stage2048";

export default function StageCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }

    canvas.width = STAGE_SIZE;
    canvas.height = STAGE_SIZE;

    let cleanupLayers: (() => void) | undefined;
    let cleanupTransform: (() => void) | undefined;

    const run = async () => {
      const config = loadLayerConfig();
      const twoDLayers = config.filter(is2DLayer);

      // Prepare base layers and create processors for each
      const layersWithProcessors: Array<{
        baseLayer: UniversalLayerData;
        processors: LayerProcessor[];
      }> = [];

      for (const entry of twoDLayers) {
        const baseLayer = await prepareLayer(entry, STAGE_SIZE);
        if (!baseLayer) {
          console.warn(`[StageCanvas] Skipping layer ${entry.layerId} - failed to prepare`);
          continue;
        }

        // Create spin processor for this layer
        const spinProcessor = createSpinProcessor({
          spinCenter:
            entry.spinCenter &&
            entry.spinCenter.length >= 2 &&
            typeof entry.spinCenter[0] === "number" &&
            typeof entry.spinCenter[1] === "number"
              ? { x: entry.spinCenter[0], y: entry.spinCenter[1] }
              : undefined,
          spinSpeed: entry.spinSpeed,
          spinDirection: entry.spinDirection,
        });

        layersWithProcessors.push({
          baseLayer,
          processors: [spinProcessor],
        });
      }

      // Mount to canvas engine with base layers and processors
      cleanupLayers = await mountCanvasLayers(ctx, layersWithProcessors);
    };

    run().catch((error) => {
      console.error("Failed to initialise Canvas stage", error);
    });

    cleanupTransform = createStageTransformer(canvas, container, {
      resizeDebounce: 100,
    });

    return () => {
      cleanupTransform?.();
      cleanupLayers?.();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

import React, { useEffect, useRef } from "react";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer, prepareLayer } from "../layer/LayerCore";
import { mountCanvasLayers } from "../layer/LayerEngineCanvas";
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

      const layers = [];
      for (const entry of twoDLayers) {
        const layer = await prepareLayer(entry, STAGE_SIZE);
        if (!layer) {
          console.warn(`[StageCanvas] Skipping layer ${entry.layerId} - failed to prepare`);
          continue;
        }
        layers.push(layer);
      }

      cleanupLayers = await mountCanvasLayers(ctx, layers);
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

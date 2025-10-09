import React, { useEffect, useRef } from "react";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer, prepareLayer } from "../layer/LayerCore";
import { mountCanvasLayers } from "../layer/LayerEngineCanvas";
import type { EnhancedLayerData, LayerProcessor } from "../layer/LayerCorePipeline";
import { createImageMappingDebugProcessor } from "../layer/LayerCorePipelineImageMappingDebug";
import { createSpinProcessor } from "../layer/LayerCorePipelineSpin";
import { STAGE_SIZE, createStageTransformer } from "../utils/stage2048";

function StageCanvas() {
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

      const layersWithProcessors: Array<{
        data: EnhancedLayerData;
        processors: LayerProcessor[];
      }> = [];
      for (const entry of twoDLayers) {
        const layer = await prepareLayer(entry, STAGE_SIZE);
        if (!layer) {
          console.warn(`[StageCanvas] Skipping layer ${entry.layerId} - failed to prepare`);
          continue;
        }

        const processors: LayerProcessor[] = [];

        // Add Image Mapping Debug processor if configured
        const hasDebugConfig =
          entry.showCenter ||
          entry.showTip ||
          entry.showBase ||
          entry.showStageCenter ||
          entry.showAxisLine ||
          entry.showRotation ||
          entry.showTipRay ||
          entry.showBaseRay ||
          entry.showBoundingBox;

        if (hasDebugConfig) {
          processors.push(
            createImageMappingDebugProcessor({
              showCenter: entry.showCenter,
              showTip: entry.showTip,
              showBase: entry.showBase,
              showStageCenter: entry.showStageCenter,
              showAxisLine: entry.showAxisLine,
              showRotation: entry.showRotation,
              showTipRay: entry.showTipRay,
              showBaseRay: entry.showBaseRay,
              showBoundingBox: entry.showBoundingBox,
              centerStyle: entry.centerStyle,
              tipStyle: entry.tipStyle,
              baseStyle: entry.baseStyle,
              stageCenterStyle: entry.stageCenterStyle,
              colors: entry.debugColors,
            }),
          );
        }

        if (entry.spinSpeed && entry.spinSpeed > 0) {
          processors.push(
            createSpinProcessor({
              spinSpeed: entry.spinSpeed,
              spinDirection: entry.spinDirection,
            }),
          );
        }

        layersWithProcessors.push({
          data: layer,
          processors,
        });
      }

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

// Memoize to prevent unnecessary re-renders when parent re-renders
export default React.memo(StageCanvas);

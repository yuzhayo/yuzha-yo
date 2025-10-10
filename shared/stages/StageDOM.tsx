import React, { useEffect, useRef } from "react";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer, prepareLayer } from "../layer/LayerCore";
import { mountDOMLayers } from "../layer/LayerEngineDOM";
import type { EnhancedLayerData, LayerProcessor } from "../layer/LayerCorePipeline";
import { createImageMappingDebugProcessor } from "../layer/LayerCorePipelineImageMappingDebug";
import { createSpinProcessor } from "../layer/LayerCorePipelineSpin";
import { createOrbitalProcessor } from "../layer/LayerCorePipelineOrbital";
import { createBaseTipRotationProcessor } from "../layer/LayerCorePipelineBaseTipRotation";
import { STAGE_SIZE, createStageTransformer } from "../utils/stage2048";

function StageDOM() {
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

        // Add Orbital processor if orbital motion is configured
        if (entry.orbitSpeed && entry.orbitSpeed > 0) {
          processors.push(
            createOrbitalProcessor({
              orbitCenter: entry.orbitCenter as [number, number] | undefined,
              orbitImagePoint: entry.orbitImagePoint as [number, number] | undefined,
              orbitRadius: entry.orbitRadius,
              orbitSpeed: entry.orbitSpeed,
              orbitDirection: entry.orbitDirection,
            }),
          );

          // Add BaseTip processor (only when orbital is active)
          // This makes imageTip point outward from orbit center
          processors.push(createBaseTipRotationProcessor());
        }

        layersWithProcessors.push({
          data: layer,
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

// Memoize to prevent unnecessary re-renders when parent re-renders
export default React.memo(StageDOM);

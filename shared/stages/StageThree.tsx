import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer, prepareLayer } from "../layer/LayerCore";
import { mountThreeLayers } from "../layer/LayerEngineThree";
import type { EnhancedLayerData, LayerProcessor } from "../layer/LayerCorePipeline";
import { createImageMappingDebugProcessor } from "../layer/LayerCorePipelineImageMappingDebug";
import { createSpinProcessor } from "../layer/LayerCorePipelineSpin";
import { createOrbitalProcessor } from "../layer/LayerCorePipelineOrbital";
import { STAGE_SIZE, createStageTransformer } from "../utils/stage2048";
import { getDeviceCapability } from "../utils/DeviceCapability";

function StageThree() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const deviceCap = getDeviceCapability();

    canvas.width = STAGE_SIZE;
    canvas.height = STAGE_SIZE;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: deviceCap.enableAntialiasing,
      powerPreference: deviceCap.isLowEndDevice ? "low-power" : "default",
    });
    renderer.setPixelRatio(deviceCap.pixelRatio);
    renderer.setSize(STAGE_SIZE, STAGE_SIZE, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const camera = new THREE.OrthographicCamera(
      -STAGE_SIZE / 2,
      STAGE_SIZE / 2,
      STAGE_SIZE / 2,
      -STAGE_SIZE / 2,
      0.1,
      2000,
    );
    camera.position.z = 1000;

    const scene = new THREE.Scene();

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
          console.warn(`[StageThree] Skipping layer ${entry.layerId} - failed to prepare`);
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

        // Add Orbital processor if orbital motion is configured
        const hasOrbitalConfig =
          entry.orbitStagePoint !== undefined ||
          entry.orbitOrient === true ||
          (entry.orbitSpeed !== undefined && entry.orbitSpeed !== 0) ||
          entry.orbitLine === true ||
          entry.orbitLinePoint !== undefined ||
          entry.orbitImagePoint !== undefined;
        if (hasOrbitalConfig) {
          processors.push(
            createOrbitalProcessor({
              orbitStagePoint: entry.orbitStagePoint as [number, number] | undefined,
              orbitLinePoint: entry.orbitLinePoint as [number, number] | undefined,
              orbitImagePoint: entry.orbitImagePoint as [number, number] | undefined,
              orbitLine: entry.orbitLine,
              orbitSpeed: entry.orbitSpeed,
              orbitDirection: entry.orbitDirection,
            }),
          );
        }

        layersWithProcessors.push({
          data: layer,
          processors,
        });
      }

      cleanupLayers = await mountThreeLayers(scene, renderer, camera, layersWithProcessors);
    };

    run().catch((error) => {
      console.error("Failed to initialise Three.js stage", error);
    });

    cleanupTransform = createStageTransformer(canvas, container, {
      resizeDebounce: 100,
    });

    return () => {
      cleanupTransform?.();
      cleanupLayers?.();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export default React.memo(StageThree);

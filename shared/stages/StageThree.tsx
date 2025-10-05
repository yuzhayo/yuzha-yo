import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer, prepareLayer } from "../layer/LayerCore";
import { mountThreeLayers } from "../layer/LayerEngineThree";
import type { EnhancedLayerData, LayerProcessor } from "../layer/LayerCorePipeline";
import { createImageMappingDebugProcessor } from "../layer/LayerCorePipelineImageMappingDebug";
import { STAGE_SIZE, createStageTransformer } from "../utils/stage2048";
import { getDeviceCapability } from "../utils/DeviceCapability";

export default function StageThree() {
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
              showAxisLine: entry.showAxisLine,
              showRotation: entry.showRotation,
              showTipRay: entry.showTipRay,
              showBaseRay: entry.showBaseRay,
              showBoundingBox: entry.showBoundingBox,
              centerStyle: entry.centerStyle,
              tipStyle: entry.tipStyle,
              baseStyle: entry.baseStyle,
              colors: entry.debugColors,
            }),
          );
        }

        layersWithProcessors.push({
          data: { ...layer, imageTip: entry.imageTip, imageBase: entry.imageBase } as any,
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

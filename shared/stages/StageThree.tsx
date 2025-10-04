import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer, prepareLayer, type UniversalLayerData } from "../layer/LayerCore";
import { mountThreeLayers } from "../layer/LayerEngineThree";
import { type LayerProcessor } from "../layer/LayerCorePipeline";
import { createSpinProcessor } from "../layer/LayerCorePipelineSpin";
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
    let resizeTimeoutId: number | undefined;

    const render = () => {
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (resizeTimeoutId) clearTimeout(resizeTimeoutId);
      resizeTimeoutId = window.setTimeout(() => {
        render();
      }, 150);
    };

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
          console.warn(`[StageThree] Skipping layer ${entry.layerId} - failed to prepare`);
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

      // Mount to Three.js engine with base layers and processors
      cleanupLayers = await mountThreeLayers(scene, layersWithProcessors);

      window.addEventListener("resize", handleResize);

      render();
    };

    run().catch((error) => {
      console.error("Failed to initialise Three.js stage", error);
    });

    cleanupTransform = createStageTransformer(canvas, container, {
      resizeDebounce: 100,
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutId) clearTimeout(resizeTimeoutId);
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

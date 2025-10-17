import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStagePipeline, toRendererInput, type StagePipeline } from "../layer/pipeline/StagePipeline";
import { createStageTransformer } from "../utils/stage2048";
import { getDeviceCapability } from "../utils/DeviceCapability";
import { mountThreeLayers } from "../layer/LayerEngines";

async function mountThreeRenderer(
  container: HTMLDivElement,
  canvas: HTMLCanvasElement,
  pipeline: StagePipeline,
): Promise<() => void> {
  const deviceCap = getDeviceCapability();

  canvas.width = pipeline.stageSize;
  canvas.height = pipeline.stageSize;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: deviceCap.enableAntialiasing,
    powerPreference: deviceCap.isLowEndDevice ? "low-power" : "default",
  });
  renderer.setPixelRatio(deviceCap.pixelRatio);
  renderer.setSize(pipeline.stageSize, pipeline.stageSize, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const half = pipeline.stageSize / 2;

  const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 2000);
  camera.position.z = 1000;

  const scene = new THREE.Scene();

  const cleanupTransform = createStageTransformer(canvas, container, {
    resizeDebounce: 100,
  });

  const cleanupLayers = await mountThreeLayers(scene, renderer, camera, toRendererInput(pipeline));

  return () => {
    cleanupTransform?.();
    cleanupLayers?.();
    renderer.dispose();
  };
}

function StageThree() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let cleanup: (() => void) | undefined;
    let active = true;

    (async () => {
      const pipeline = await createStagePipeline();
      if (!active) return;
      cleanup = await mountThreeRenderer(container, canvas, pipeline);
    })().catch((error) => {
      console.error("Failed to initialise Three.js stage", error);
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

export default React.memo(StageThree);

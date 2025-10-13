import * as THREE from "three";
import { createStageTransformer } from "../../../utils/stage2048";
import { getDeviceCapability } from "../../../utils/DeviceCapability";
import { mountThreeLayers } from "../../LayerEngines";
import { toRendererInput, type StagePipeline } from "../StagePipeline";

export type ThreeRendererElements = {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
};

export async function mountThreeRenderer(
  elements: ThreeRendererElements,
  pipeline: StagePipeline,
): Promise<() => void> {
  const { container, canvas } = elements;
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

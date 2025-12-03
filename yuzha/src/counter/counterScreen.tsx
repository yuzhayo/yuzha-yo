import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { createCounterPipeline } from "./createCounterPipeline";
import {
  createStageTransformer,
  toRendererInput,
  roundStagePoint,
  computeLayerBounds,
  isLayerWithinStageBounds,
  runPipeline,
  createPipelineCache,
  AnimationConstants,
  type StagePipeline,
  type LayerMetadata,
  type EnhancedLayerData,
  type LayerProcessor,
  type LayerBounds,
  computeCoverTransform,
  stageToViewportCoords,
  type StageTransform,
} from "@shared/layer";
import { getDeviceCapability } from "@shared/utils/DeviceCapability";
import CounterFloating from "./counterFloating";
import CounterFloatingMessage from "./counterFloatingMessage";
import CounterSettings from "./counterSettings";

if (import.meta.hot) {
  import.meta.hot.accept();
}

type ThreeTransformCache = {
  scaledWidth: number;
  scaledHeight: number;
  hasRotation: boolean;
};

type ThreeMeshEntry = {
  mesh: THREE.Mesh;
  group: THREE.Group;
  orbitLine?: THREE.Line;
  baseData: EnhancedLayerData;
  processors: LayerProcessor[];
  transformCache: ThreeTransformCache;
  isStatic: boolean;
  hasAnimation: boolean;
  baseBounds: LayerBounds;
  geometryKey: string;
};

type PlaneGeometryEntry = {
  geometry: THREE.PlaneGeometry;
  refCount: number;
};

const planeGeometryCache = new Map<string, PlaneGeometryEntry>();
const orbitLineGeometryCache = new Map<number, THREE.BufferGeometry>();

const planeGeometryKey = (width: number, height: number): string =>
  `${width.toFixed(3)}x${height.toFixed(3)}`;

const acquirePlaneGeometry = (
  width: number,
  height: number,
): { geometry: THREE.PlaneGeometry; key: string } => {
  const key = planeGeometryKey(width, height);
  const cached = planeGeometryCache.get(key);
  if (cached) {
    cached.refCount += 1;
    return { geometry: cached.geometry, key };
  }
  const geometry = new THREE.PlaneGeometry(width, height);
  planeGeometryCache.set(key, { geometry, refCount: 1 });
  return { geometry, key };
};

const releasePlaneGeometry = (key: string): void => {
  const cached = planeGeometryCache.get(key);
  if (!cached) return;
  cached.refCount -= 1;
  if (cached.refCount <= 0) {
    cached.geometry.dispose();
    planeGeometryCache.delete(key);
  }
};

const getOrbitLineGeometry = (segments: number): THREE.BufferGeometry => {
  const cached = orbitLineGeometryCache.get(segments);
  if (cached) return cached;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  orbitLineGeometryCache.set(segments, geometry);
  return geometry;
};

async function mountThreeLayers(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  layersWithProcessors: Array<{
    data: EnhancedLayerData;
    processors: LayerProcessor[];
    metadata: LayerMetadata;
  }>,
  stageSize: number,
): Promise<() => void> {
  const meshData: ThreeMeshEntry[] = [];
  const textureLoader = new THREE.TextureLoader();
  const pipelineCache = createPipelineCache<EnhancedLayerData>();
  const halfStage = stageSize / 2;
  const computeRuntimeBounds = (data: EnhancedLayerData): LayerBounds =>
    computeLayerBounds(data.position, data.scale, data.imageMapping);
  const shouldRenderEntry = (entry: ThreeMeshEntry, enhanced: EnhancedLayerData): boolean => {
    if (enhanced.visible === false) return false;
    const padding = entry.hasAnimation ? 96 : 40;
    return isLayerWithinStageBounds(computeRuntimeBounds(enhanced), stageSize, padding);
  };

  const texturePromises = layersWithProcessors.map(async (item) => {
    try {
      const texture = await textureLoader.loadAsync(item.data.imageUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 1;
      texture.generateMipmaps = false;
      return { item, texture };
    } catch (error) {
      console.error(`[CounterStageThree] Failed to load texture for "${item.data.ImageID}"`, error);
      return null;
    }
  });

  const results = await Promise.all(texturePromises);

  for (const result of results) {
    if (!result) continue;

    const { item, texture } = result;
    const { data, processors, metadata } = item;
    const { isStatic, hasAnimation, baseBounds, visibleByDefault } = metadata;

    const scaledWidth = texture.image.width * data.scale.x;
    const scaledHeight = texture.image.height * data.scale.y;

    const transformCache: ThreeTransformCache = {
      scaledWidth,
      scaledHeight,
      hasRotation: (data.rotation ?? 0) !== 0,
    };
    const offscreenStatic =
      isStatic && visibleByDefault && !isLayerWithinStageBounds(baseBounds, stageSize);
    if (offscreenStatic) {
      if (typeof texture.dispose === "function") {
        texture.dispose();
      }
      continue;
    }

    const { geometry: planeGeometry, key: geometryKey } = acquirePlaneGeometry(
      scaledWidth,
      scaledHeight,
    );
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    const group = new THREE.Group();

    const initialPosition = roundStagePoint(data.position);
    group.position.set(initialPosition.x - halfStage, halfStage - initialPosition.y, 0);
    group.add(mesh);
    scene.add(group);

    let orbitLine: THREE.Line | undefined;
    const baseRadiusRounded = Math.max(0, Math.round(data.orbitRadius ?? 0));
    if (data.orbitLineVisible && baseRadiusRounded > 0 && data.orbitStagePoint) {
      const circleGeometry = getOrbitLineGeometry(64);
      const circleMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.25,
      });
      orbitLine = new THREE.LineLoop(circleGeometry, circleMaterial);
      orbitLine.userData = { baseRadius: Math.max(baseRadiusRounded, 1) };
      const roundedStagePoint = roundStagePoint(data.orbitStagePoint);
      orbitLine.position.set(roundedStagePoint.x - halfStage, halfStage - roundedStagePoint.y, 0);
      orbitLine.scale.set(baseRadiusRounded, baseRadiusRounded, 1);
      scene.add(orbitLine);
    }

    meshData.push({
      mesh,
      group,
      orbitLine,
      baseData: data,
      processors,
      transformCache,
      isStatic,
      hasAnimation,
      baseBounds,
      geometryKey,
    });
  }

  let animationFrameId: number | null = null;
  const animate = (timestamp: number) => {
    for (const entry of meshData) {
      const enhanced =
        entry.hasAnimation && entry.processors.length > 0
          ? pipelineCache.get(entry.baseData.LayerID, () =>
              runPipeline(entry.baseData, entry.processors, timestamp),
            )
          : entry.baseData;

      const isVisible = shouldRenderEntry(entry, enhanced);
      entry.group.visible = isVisible;
      entry.mesh.visible = isVisible;
      if (!isVisible) {
        if (entry.orbitLine) {
          entry.orbitLine.visible = false;
        }
        continue;
      }

      const position =
        enhanced.hasOrbitalAnimation || enhanced.hasSpinAnimation
          ? enhanced.position
          : roundStagePoint(enhanced.position);
      entry.group.position.set(position.x - halfStage, halfStage - position.y, 0);

      const rotation =
        enhanced.currentRotation ?? enhanced.rotation ?? entry.baseData.rotation ?? 0;
      entry.group.rotation.z = -(rotation * AnimationConstants.DEG_TO_RAD);

      if (entry.orbitLine) {
        const roundedStagePoint = enhanced.orbitStagePoint
          ? roundStagePoint(enhanced.orbitStagePoint)
          : undefined;
        const roundedRadius = Math.max(0, Math.round(enhanced.orbitLineStyle?.radius ?? 0));
        if (
          enhanced.orbitLineStyle?.visible &&
          roundedStagePoint &&
          roundedRadius > 0 &&
          enhanced.visible !== false
        ) {
          const baseRadius = entry.orbitLine.userData?.baseRadius ?? 1;
          const scale = baseRadius > 0 ? roundedRadius / baseRadius : 1;
          entry.orbitLine.visible = true;
          entry.orbitLine.position.set(
            roundedStagePoint.x - halfStage,
            -(roundedStagePoint.y - halfStage),
            0,
          );
          entry.orbitLine.scale.set(baseRadius * scale, baseRadius * scale, 1);
        } else {
          entry.orbitLine.visible = false;
        }
      }
    }

    renderer.render(scene, camera);
    pipelineCache.nextFrame();
    animationFrameId = requestAnimationFrame(animate);
  };

  animationFrameId = requestAnimationFrame(animate);

  return () => {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);

    meshData.forEach((entry) => {
      scene.remove(entry.group);
      releasePlaneGeometry(entry.geometryKey);
      if (entry.mesh.material instanceof THREE.Material) {
        entry.mesh.material.dispose();
      }
      if (entry.orbitLine) {
        scene.remove(entry.orbitLine);
        if (entry.orbitLine.material instanceof THREE.Material) {
          entry.orbitLine.material.dispose();
        }
      }
    });

    pipelineCache.clear();
    meshData.length = 0;
    renderer.dispose();
  };
}

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

  const cleanupTransform = createStageTransformer(canvas, container, { resizeDebounce: 100 });

  const cleanupLayers = await mountThreeLayers(
    scene,
    renderer,
    camera,
    toRendererInput(pipeline),
    pipeline.stageSize,
  );

  return () => {
    cleanupTransform?.();
    cleanupLayers?.();
    renderer.dispose();
  };
}

function CounterStageThree() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let cleanup: (() => void) | undefined;
    let active = true;

    (async () => {
      const pipeline = await createCounterPipeline();
      if (!active) return;
      cleanup = await mountThreeRenderer(container, canvas, pipeline);
    })().catch((error) => {
      console.error("[CounterStageThree] Failed to initialize Three.js stage", error);
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

export type CounterScreenProps = {
  onBack?: () => void;
};

export default function CounterScreen({ onBack }: CounterScreenProps) {
  const [count, setCount] = useState(0);
  const [floatingSize, setFloatingSize] = useState(250);
  const [messageSize, setMessageSize] = useState(240);
  const [messageFontSize, setMessageFontSize] = useState(48);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [stagePosition, setStagePosition] = useState({ x: 1024, y: 1024 });
  const [messageStagePosition, setMessageStagePosition] = useState({ x: 1024, y: 400 });

  const [transform, setTransform] = useState<StageTransform>(() =>
    typeof window !== "undefined"
      ? computeCoverTransform(window.innerWidth, window.innerHeight)
      : { scale: 1, offsetX: 0, offsetY: 0, width: 2048, height: 2048 },
  );

  useEffect(() => {
    const handleResize = () => {
      setTransform(computeCoverTransform(window.innerWidth, window.innerHeight));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const floatingScreenPosition = useMemo(() => {
    const { x, y } = stageToViewportCoords(stagePosition.x, stagePosition.y, transform);
    const half = floatingSize / 2;
    return { x: x - half, y: y - half };
  }, [stagePosition, transform, floatingSize]);

  const messageScreenPosition = useMemo(() => {
    const { x, y } = stageToViewportCoords(messageStagePosition.x, messageStagePosition.y, transform);
    const half = messageSize / 2;
    return { x: x - half, y: y - half };
  }, [messageStagePosition, transform, messageSize]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white">
      <CounterStageThree />
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute left-6 top-6 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-blue-500 active:bg-blue-600"
        >
          Back
        </button>
      )}
      <button
        type="button"
        onClick={() => setCount(0)}
        className="absolute left-24 top-6 rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-slate-600 active:bg-slate-700"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={() => setShowSettings((prev) => !prev)}
        className="absolute left-6 top-16 rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-slate-700 active:bg-slate-800"
      >
        {showSettings ? "Hide Settings" : "Settings"}
      </button>
      {showSettings && (
        <CounterSettings
          size={floatingSize}
          onSizeChange={setFloatingSize}
          position={stagePosition}
          onPositionChange={setStagePosition}
          messageSize={messageSize}
          onMessageSizeChange={setMessageSize}
          messagePosition={messageStagePosition}
          onMessagePositionChange={setMessageStagePosition}
          messageFontSize={messageFontSize}
          onMessageFontSizeChange={setMessageFontSize}
          backgroundOpacity={backgroundOpacity}
          onBackgroundOpacityChange={setBackgroundOpacity}
          onClose={() => setShowSettings(false)}
        />
      )}
      <CounterFloating
        size={floatingSize}
        screenPosition={floatingScreenPosition}
        backgroundOpacity={backgroundOpacity}
        onActivate={() => setCount((prev) => prev + 1)}
      />
      <CounterFloatingMessage
        size={messageSize}
        screenPosition={messageScreenPosition}
        backgroundOpacity={backgroundOpacity}
      >
        <div
          className="flex w-full items-center justify-center text-white drop-shadow"
          style={{ fontFamily: "Taimingda, sans-serif", fontSize: messageFontSize }}
        >
          {count}
        </div>
      </CounterFloatingMessage>
    </div>
  );
}

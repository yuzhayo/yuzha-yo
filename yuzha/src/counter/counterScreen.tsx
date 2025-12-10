import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { CounterControls } from "./counterButtons";
import CounterEffectDemo from "./counterEffectDemo";

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

type WebGLAttributes = NonNullable<ReturnType<WebGLRenderingContext["getContextAttributes"]>>;

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
      texture.flipY = false;
      texture.premultiplyAlpha = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 1;
      texture.generateMipmaps = false;
      if (item.data.blendMode === "additive") {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
      }
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
    const opacity = data.opacity ?? 1;
    const blendMode =
      data.blendMode === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending;
    const useLuminanceAlpha = data.blendMode === "additive";
    const alphaTestValue = useLuminanceAlpha ? 0.1 : 0;

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
    const materialConfig: THREE.MeshBasicMaterialParameters = {
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: blendMode,
      opacity,
    };
    if (useLuminanceAlpha) {
      materialConfig.alphaMap = texture;
      materialConfig.alphaTest = alphaTestValue;
    }
    const planeMaterial = new THREE.MeshBasicMaterial(materialConfig);

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
      const currentOpacity = enhanced.opacity ?? 1;
      if (entry.mesh.material instanceof THREE.Material) {
        entry.mesh.material.opacity = currentOpacity;
      }

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

  const webglAttributes: WebGLAttributes = {
    alpha: true,
    antialias: deviceCap.enableAntialiasing,
    premultipliedAlpha: true,
    powerPreference: deviceCap.isLowEndDevice ? "low-power" : "default",
  };

  const webglContext =
    (canvas.getContext("webgl2", webglAttributes) as WebGL2RenderingContext | null) ??
    (canvas.getContext("webgl", webglAttributes) as WebGLRenderingContext | null);

  if (webglContext) {
    // texImage3D in WebGL2 rejects flipY/premultiplied uploads, so clear the flags up front.
    webglContext.pixelStorei(webglContext.UNPACK_FLIP_Y_WEBGL, 0);
    webglContext.pixelStorei(webglContext.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: webglContext ?? undefined,
    alpha: true,
    antialias: deviceCap.enableAntialiasing,
    powerPreference: webglAttributes.powerPreference,
    premultipliedAlpha: true,
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

const COUNT_STORAGE_KEY = "counter/progress/v1";
const INITIAL_TRANSFORM: StageTransform = { scale: 1, offsetX: 0, offsetY: 0, width: 2048, height: 2048 };

function useStageTransform() {
  const [transform, setTransform] = useState<StageTransform>(() =>
    typeof window !== "undefined"
      ? computeCoverTransform(window.innerWidth, window.innerHeight)
      : INITIAL_TRANSFORM,
  );

  useEffect(() => {
    const handleResize = () => {
      setTransform(computeCoverTransform(window.innerWidth, window.innerHeight));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const clampToViewport = useCallback((pos: { x: number; y: number }, size: number) => {
    if (typeof window === "undefined") return pos;
    const margin = 8;
    const maxX = Math.max(margin, window.innerWidth - size - margin);
    const maxY = Math.max(margin, window.innerHeight - size - margin);
    return {
      x: Math.min(maxX, Math.max(margin, pos.x)),
      y: Math.min(maxY, Math.max(margin, pos.y)),
    };
  }, []);

  const toScreenPosition = useCallback(
    (stagePos: { x: number; y: number }, size: number) => {
      const { x, y } = stageToViewportCoords(stagePos.x, stagePos.y, transform);
      const half = size / 2;
      return clampToViewport({ x: x - half, y: y - half }, size);
    },
    [clampToViewport, transform],
  );

  return { transform, toScreenPosition };
}

function useCounterActions(hapticsEnabled: boolean, soundEnabled: boolean) {
  const [count, setCount] = useState(0);
  const [isBumping, setIsBumping] = useState(false);
  const bumpTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const saved = window.localStorage.getItem(COUNT_STORAGE_KEY);
    if (saved !== null) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed)) {
        setCount(parsed);
      }
    }
    return () => {
      if (bumpTimeoutRef.current !== undefined) {
        clearTimeout(bumpTimeoutRef.current);
      }
    };
  }, []);

  const triggerFeedback = useCallback(() => {
    setIsBumping(true);
    if (bumpTimeoutRef.current !== undefined) {
      clearTimeout(bumpTimeoutRef.current);
    }
    bumpTimeoutRef.current = window.setTimeout(() => setIsBumping(false), 250);

    if (hapticsEnabled && "vibrate" in navigator) {
      navigator.vibrate(20);
    }
    if (soundEnabled) {
      const audio = new Audio("/sound/dice.wav");
      audio.volume = 0.2;
      audio.play().catch(() => {});
    }
  }, [hapticsEnabled, soundEnabled]);

  const increment = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      window.localStorage.setItem(COUNT_STORAGE_KEY, String(next));
      return next;
    });
    triggerFeedback();
  }, [triggerFeedback]);

  const reset = useCallback(() => {
    setCount(0);
    window.localStorage.setItem(COUNT_STORAGE_KEY, "0");
    triggerFeedback();
  }, [triggerFeedback]);

  return { count, isBumping, increment, reset };
}

export default function CounterScreen({ onBack }: CounterScreenProps) {
  const [floatingSize, setFloatingSize] = useState(250);
  const [messageSize, setMessageSize] = useState(240);
  const [messageFontSize, setMessageFontSize] = useState(90);
  const [messageColor, setMessageColor] = useState("#ffffff");
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEffectDemo, setShowEffectDemo] = useState(false);
  const [stagePosition, setStagePosition] = useState({ x: 1024, y: 1300 });
  const [messageStagePosition, setMessageStagePosition] = useState({ x: 1024, y: 400 });
  const [backStagePosition, setBackStagePosition] = useState({ x: 180, y: 180 });
  const [resetStagePosition, setResetStagePosition] = useState({ x: 280, y: 180 });
  const [settingsStagePosition, setSettingsStagePosition] = useState({ x: 380, y: 180 });

  const { transform, toScreenPosition } = useStageTransform();
  const { count, isBumping, increment, reset } = useCounterActions(hapticsEnabled, soundEnabled);

  const floatingScreenPosition = useMemo(
    () => toScreenPosition(stagePosition, floatingSize),
    [floatingSize, stagePosition, toScreenPosition],
  );

  const messageScreenPosition = useMemo(
    () => toScreenPosition(messageStagePosition, messageSize),
    [messageSize, messageStagePosition, toScreenPosition],
  );

  const handleContextMenu = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div
      className="counter-no-context relative h-screen w-screen overflow-hidden bg-slate-950 text-white"
      onContextMenu={handleContextMenu}
    >
      <CounterStageThree />
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
          messageColor={messageColor}
          onMessageColorChange={setMessageColor}
          hapticsEnabled={hapticsEnabled}
          onHapticsToggle={setHapticsEnabled}
          soundEnabled={soundEnabled}
          onSoundToggle={setSoundEnabled}
          backPosition={backStagePosition}
          onBackPositionChange={setBackStagePosition}
          resetPosition={resetStagePosition}
          onResetPositionChange={setResetStagePosition}
          settingsPosition={settingsStagePosition}
          onSettingsPositionChange={setSettingsStagePosition}
          onOpenDemo={() => setShowEffectDemo(true)}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showEffectDemo && <CounterEffectDemo onClose={() => setShowEffectDemo(false)} />}
      <CounterControls
        transform={transform}
        backStagePosition={backStagePosition}
        resetStagePosition={resetStagePosition}
        settingsStagePosition={settingsStagePosition}
        onBack={onBack}
        onReset={reset}
        onToggleSettings={() => setShowSettings((prev) => !prev)}
        showSettings={showSettings}
      />
      <CounterFloating
        size={floatingSize}
        screenPosition={floatingScreenPosition}
        onActivate={increment}
      />
      <CounterFloatingMessage size={messageSize} screenPosition={messageScreenPosition}>
        <div
          className={`flex w-full items-center justify-center text-white drop-shadow ${
            isBumping ? "count-bump" : ""
          }`}
          style={{
            fontFamily: "Taimingda, sans-serif",
            fontSize: messageFontSize,
            color: messageColor,
            WebkitTextStroke: "1px rgba(0,0,0,0.6)", //stroke for better visibility
            textShadow: "0 0 5px rgba(0,0,0,0.8)",
          }}
        >
          {count}
        </div>
      </CounterFloatingMessage>
    </div>
  );
}

import * as THREE from "three";
import type { EnhancedLayerData } from "./LayerCorePipeline";
import type { LayerProcessor } from "./LayerCorePipeline";
import { runPipeline, AnimationConstants, createPipelineCache } from "./LayerCorePipeline";
import { loadImage } from "./LayerCore";
import { CanvasDebugRenderer, ThreeDebugRenderer } from "./LayerCorePipelineImageMappingUtils";
import { roundStagePoint } from "../utils/stage2048";

const STAGE_SIZE = 2048;

// ---------------------------------------------------------------------------
// DOM Renderer
// ---------------------------------------------------------------------------

type DomLayerEntry = {
  container: HTMLDivElement;
  img: HTMLImageElement;
  orbitLineEl?: HTMLDivElement;
  baseData: EnhancedLayerData;
  processors: LayerProcessor[];
  isStatic: boolean;
  hasAnimation: boolean;
};

export async function mountDomLayers(
  containerEl: HTMLDivElement,
  layersWithProcessors: Array<{ data: EnhancedLayerData; processors: LayerProcessor[] }>,
): Promise<() => void> {
  const layers: DomLayerEntry[] = [];

  containerEl.innerHTML = "";
  containerEl.style.position = "relative";
  containerEl.style.width = `${STAGE_SIZE}px`;
  containerEl.style.height = `${STAGE_SIZE}px`;

  for (const item of layersWithProcessors) {
    try {
      const img = await loadImage(item.data.imageUrl);

      const layerDiv = document.createElement("div");
      layerDiv.style.position = "absolute";
      layerDiv.style.pointerEvents = "none";

      const { position, scale, rotation } = item.data;
      const displayRotation = rotation ?? 0;
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      img.style.width = `${naturalWidth}px`;
      img.style.height = `${naturalHeight}px`;
      img.style.maxWidth = "none";
      img.style.maxHeight = "none";
      img.style.display = "block";
      img.style.position = "absolute";
      img.style.transformOrigin = "center center";

      const roundedPosition = roundStagePoint(position);
      const left = roundedPosition.x - naturalWidth / 2;
      const top = roundedPosition.y - naturalHeight / 2;
      img.style.left = `${left}px`;
      img.style.top = `${top}px`;

      const initialOrbitRadius = Math.max(0, Math.round(item.data.orbitRadius ?? 0));
      let orbitLineEl: HTMLDivElement | undefined;
      if (item.data.orbitLineVisible && initialOrbitRadius > 0) {
        orbitLineEl = document.createElement("div");
        orbitLineEl.style.position = "absolute";
        orbitLineEl.style.border = "1px dashed rgba(255,255,255,0.25)";
        orbitLineEl.style.borderRadius = "50%";
        orbitLineEl.style.pointerEvents = "none";
        orbitLineEl.style.display = "none";
        layerDiv.appendChild(orbitLineEl);
      }

      const transforms: string[] = [];
      if (scale.x !== 1 || scale.y !== 1) transforms.push(`scale(${scale.x}, ${scale.y})`);
      if (displayRotation !== 0) transforms.push(`rotate(${displayRotation}deg)`);
      if (transforms.length > 0) img.style.transform = transforms.join(" ");

      layerDiv.appendChild(img);

      if (
        orbitLineEl &&
        item.data.orbitLineVisible &&
        initialOrbitRadius > 0 &&
        item.data.orbitStagePoint
      ) {
        const roundedOrbitPoint = roundStagePoint(item.data.orbitStagePoint);
        const diameter = initialOrbitRadius * 2;
        orbitLineEl.style.display = "block";
        orbitLineEl.style.width = `${diameter}px`;
        orbitLineEl.style.height = `${diameter}px`;
        orbitLineEl.style.left = `${roundedOrbitPoint.x - diameter / 2}px`;
        orbitLineEl.style.top = `${roundedOrbitPoint.y - diameter / 2}px`;
      }

      containerEl.appendChild(layerDiv);

      const isStatic = item.processors.length === 0;
      const hasAnimation = !isStatic;

      layers.push({
        container: layerDiv,
        img,
        orbitLineEl,
        baseData: item.data,
        processors: item.processors,
        isStatic,
        hasAnimation,
      });
    } catch (error) {
      console.error(`[LayerEngineDOM] Failed to load image for "${item.data.imageId}"`, error);
    }
  }

  const hasAnyAnimation = layers.some((layer) => layer.hasAnimation);

  if (!hasAnyAnimation) {
    return () => {
      containerEl.innerHTML = "";
    };
  }

  let animationFrameId: number | null = null;
  const pipelineCache = createPipelineCache<EnhancedLayerData>();

  const animate = (timestamp: number) => {
    for (const layer of layers) {
      if (!layer.hasAnimation || layer.processors.length === 0) continue;

      const enhancedData = pipelineCache.get(layer.baseData.layerId, () =>
        runPipeline(layer.baseData, layer.processors, timestamp),
      );

      const transforms: string[] = [];
      if (enhancedData.scale.x !== 1 || enhancedData.scale.y !== 1) {
        transforms.push(`scale(${enhancedData.scale.x}, ${enhancedData.scale.y})`);
      }
      const rotation = enhancedData.currentRotation ?? enhancedData.rotation ?? 0;
      if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
      if (transforms.length > 0) layer.img.style.transform = transforms.join(" ");

      const naturalWidth = layer.img.naturalWidth;
      const naturalHeight = layer.img.naturalHeight;
      const roundedPosition = roundStagePoint(enhancedData.position);
      const left = roundedPosition.x - naturalWidth / 2;
      const top = roundedPosition.y - naturalHeight / 2;
      layer.img.style.left = `${left}px`;
      layer.img.style.top = `${top}px`;

      if (layer.orbitLineEl) {
        const roundedStagePoint = enhancedData.orbitStagePoint
          ? roundStagePoint(enhancedData.orbitStagePoint)
          : undefined;
        const radius = Math.max(0, Math.round(enhancedData.orbitLineStyle?.radius ?? 0));
        if (
          enhancedData.orbitLineStyle?.visible &&
          roundedStagePoint &&
          radius > 0 &&
          enhancedData.visible !== false
        ) {
          const diameter = radius * 2;
          layer.orbitLineEl.style.display = "block";
          layer.orbitLineEl.style.width = `${diameter}px`;
          layer.orbitLineEl.style.height = `${diameter}px`;
          layer.orbitLineEl.style.left = `${roundedStagePoint.x - diameter / 2}px`;
          layer.orbitLineEl.style.top = `${roundedStagePoint.y - diameter / 2}px`;
        } else {
          layer.orbitLineEl.style.display = "none";
        }
      }

      if (enhancedData.visible !== undefined) {
        layer.img.style.display = enhancedData.visible ? "block" : "none";
        if (!enhancedData.visible && layer.orbitLineEl) {
          layer.orbitLineEl.style.display = "none";
        }
      }
    }

    pipelineCache.nextFrame();
    animationFrameId = requestAnimationFrame(animate);
  };

  animationFrameId = requestAnimationFrame(animate);

  return () => {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    containerEl.innerHTML = "";
  };
}

// ---------------------------------------------------------------------------
// Canvas Renderer
// ---------------------------------------------------------------------------

type CanvasTransformCache = {
  scaledWidth: number;
  scaledHeight: number;
  centerX: number;
  centerY: number;
  pivotX: number;
  pivotY: number;
  dx: number;
  dy: number;
  hasRotation: boolean;
};

type CanvasLayerEntry = {
  image: HTMLImageElement;
  baseData: EnhancedLayerData;
  processors: LayerProcessor[];
  transformCache: CanvasTransformCache;
  isStatic: boolean;
  hasAnimation: boolean;
};

export async function mountCanvasLayers(
  ctx: CanvasRenderingContext2D,
  layersWithProcessors: Array<{ data: EnhancedLayerData; processors: LayerProcessor[] }>,
): Promise<() => void> {
  const layers: CanvasLayerEntry[] = [];

  for (const item of layersWithProcessors) {
    try {
      const image = await loadImage(item.data.imageUrl);

      const isStatic = item.processors.length === 0;
      const hasAnimation = !isStatic;

      const scaledWidth = image.width * item.data.scale.x;
      const scaledHeight = image.height * item.data.scale.y;
      const centerX = (image.width / 2) * item.data.scale.x;
      const centerY = (image.height / 2) * item.data.scale.y;
      const pivot = item.data.imageMapping.imageCenter;
      const pivotX = pivot.x * item.data.scale.x;
      const pivotY = pivot.y * item.data.scale.y;
      const dx = centerX - pivotX;
      const dy = centerY - pivotY;

      const transformCache: CanvasTransformCache = {
        scaledWidth,
        scaledHeight,
        centerX,
        centerY,
        pivotX,
        pivotY,
        dx,
        dy,
        hasRotation: (item.data.rotation ?? 0) !== 0,
      };

      layers.push({
        image,
        baseData: item.data,
        processors: item.processors,
        transformCache,
        isStatic,
        hasAnimation,
      });
    } catch (error) {
      console.error(`[LayerEngineCanvas] Failed to load image for "${item.data.imageId}"`, error);
    }
  }

  const hasAnyAnimation = layers.some((layer) => layer.hasAnimation);
  const pipelineCache = createPipelineCache<EnhancedLayerData>();

  const renderLayer = (layer: CanvasLayerEntry, enhancedData: EnhancedLayerData) => {
    if (enhancedData.visible === false) return;

    const { transformCache } = layer;
    const rotation =
      enhancedData.currentRotation ?? enhancedData.rotation ?? layer.baseData.rotation ?? 0;

    ctx.save();
    const roundedPosition = roundStagePoint(enhancedData.position);
    ctx.translate(roundedPosition.x, roundedPosition.y);

    if (rotation !== 0) {
      ctx.translate(-transformCache.dx, -transformCache.dy);
      ctx.rotate(rotation * AnimationConstants.DEG_TO_RAD);
      ctx.translate(transformCache.dx, transformCache.dy);
    }

    ctx.drawImage(
      layer.image,
      -transformCache.centerX,
      -transformCache.centerY,
      transformCache.scaledWidth,
      transformCache.scaledHeight,
    );
    ctx.restore();
  };

  const renderFrame = (timestamp: number) => {
    ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);
    const frameData = new Map<string, EnhancedLayerData>();

    for (const layer of layers) {
      const enhancedData =
        layer.hasAnimation && layer.processors.length > 0
          ? pipelineCache.get(layer.baseData.layerId, () =>
              runPipeline(layer.baseData, layer.processors, timestamp),
            )
          : layer.baseData;

      frameData.set(layer.baseData.layerId, enhancedData);
      renderLayer(layer, enhancedData);
    }

    for (const layer of layers) {
      const enhancedData = frameData.get(layer.baseData.layerId) ?? layer.baseData;
      if (enhancedData.imageMappingDebugVisuals) {
        CanvasDebugRenderer.drawAll(ctx, enhancedData.imageMappingDebugVisuals, STAGE_SIZE);
      }
    }

    pipelineCache.nextFrame();
    requestAnimationFrame(renderFrame);
  };

  if (hasAnyAnimation) {
    requestAnimationFrame(renderFrame);
    return () => {
      pipelineCache.clear();
    };
  }

  const frameData = new Map<string, EnhancedLayerData>();
  const renderStaticLayer = (layer: CanvasLayerEntry) => {
    const enhancedData =
      layer.processors.length > 0 ? runPipeline(layer.baseData, layer.processors) : layer.baseData;
    renderLayer(layer, enhancedData);
    return enhancedData;
  };

  for (const layer of layers) {
    frameData.set(layer.baseData.layerId, renderStaticLayer(layer));
  }

  for (const layer of layers) {
    const enhancedData = frameData.get(layer.baseData.layerId) ?? layer.baseData;
    if (enhancedData.imageMappingDebugVisuals) {
      CanvasDebugRenderer.drawAll(ctx, enhancedData.imageMappingDebugVisuals, STAGE_SIZE);
    }
  }

  return () => {};
}

// ---------------------------------------------------------------------------
// Three.js Renderer
// ---------------------------------------------------------------------------

type ThreeTransformCache = {
  scaledWidth: number;
  scaledHeight: number;
  imageCenter: { x: number; y: number };
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
};

export async function mountThreeLayers(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  layersWithProcessors: Array<{ data: EnhancedLayerData; processors: LayerProcessor[] }>,
): Promise<() => void> {
  const meshData: ThreeMeshEntry[] = [];
  const textureLoader = new THREE.TextureLoader();
  const pipelineCache = createPipelineCache<EnhancedLayerData>();

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
      console.error(`[LayerEngineThree] Failed to load texture for "${item.data.imageId}"`, error);
      return null;
    }
  });

  const results = await Promise.all(texturePromises);

  for (const result of results) {
    if (!result) continue;

    const { item, texture } = result;
    const { data, processors } = item;
    const isStatic = processors.length === 0;
    const hasAnimation = !isStatic;

    const scaledWidth = texture.image.width * data.scale.x;
    const scaledHeight = texture.image.height * data.scale.y;
    const imageCenter = { ...data.imageMapping.imageCenter };

    const transformCache: ThreeTransformCache = {
      scaledWidth,
      scaledHeight,
      imageCenter,
      hasRotation: (data.rotation ?? 0) !== 0,
    };

    const planeGeometry = new THREE.PlaneGeometry(scaledWidth, scaledHeight);
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    const group = new THREE.Group();
    const initialPosition = roundStagePoint(data.position);
    group.position.set(
      initialPosition.x - STAGE_SIZE / 2,
      STAGE_SIZE / 2 - initialPosition.y,
      0,
    );
    group.add(mesh);
    scene.add(group);

    let orbitLine: THREE.Line | undefined;
    const baseRadiusRounded = Math.max(0, Math.round(data.orbitRadius ?? 0));
    if (data.orbitLineVisible && baseRadiusRounded > 0 && data.orbitStagePoint) {
      const segments = 64;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i += 1) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
      }
      const circleGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const circleMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.25,
      });
      orbitLine = new THREE.LineLoop(circleGeometry, circleMaterial);
      orbitLine.userData = { baseRadius: Math.max(baseRadiusRounded, 1) };
      const roundedStagePoint = roundStagePoint(data.orbitStagePoint);
      orbitLine.position.set(
        roundedStagePoint.x - STAGE_SIZE / 2,
        STAGE_SIZE / 2 - roundedStagePoint.y,
        0,
      );
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
    });
  }

  const debugMeshes: THREE.Object3D[] = [];

  let animationFrameId: number | null = null;
  const animate = (timestamp: number) => {
    for (const entry of meshData) {
      const enhanced =
        entry.hasAnimation && entry.processors.length > 0
          ? pipelineCache.get(entry.baseData.layerId, () =>
              runPipeline(entry.baseData, entry.processors, timestamp),
            )
          : entry.baseData;

      entry.group.visible = enhanced.visible !== false;
      if (!entry.group.visible) continue;

      const roundedPosition = roundStagePoint(enhanced.position);
      entry.group.position.set(
        roundedPosition.x - STAGE_SIZE / 2,
        STAGE_SIZE / 2 - roundedPosition.y,
        0,
      );

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
            roundedStagePoint.x - STAGE_SIZE / 2,
            -(roundedStagePoint.y - STAGE_SIZE / 2),
            0,
          );
          entry.orbitLine.scale.set(baseRadius * scale, baseRadius * scale, 1);
        } else {
          entry.orbitLine.visible = false;
        }
      }

      if (enhanced.imageMappingDebugVisuals) {
        const meshes = ThreeDebugRenderer.addAllToScene(
          enhanced.imageMappingDebugVisuals,
          scene,
          STAGE_SIZE,
          THREE,
        );
        debugMeshes.push(...meshes);
      }
    }

    renderer.render(scene, camera);
    pipelineCache.nextFrame();
    animationFrameId = requestAnimationFrame(animate);
  };

  animationFrameId = requestAnimationFrame(animate);

  return () => {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);

    debugMeshes.forEach((mesh) => {
      scene.remove(mesh);
      if ((mesh as THREE.Mesh).geometry) {
        (mesh as THREE.Mesh).geometry.dispose();
      }
      if ((mesh as THREE.Mesh).material) {
        const material = (mesh as THREE.Mesh).material;
        if (Array.isArray(material)) {
          material.forEach((mat) => mat.dispose());
        } else {
          material.dispose();
        }
      }
    });

    meshData.forEach((entry) => {
      scene.remove(entry.group);
      entry.mesh.geometry.dispose();
      if (entry.mesh.material instanceof THREE.Material) {
        entry.mesh.material.dispose();
      }
      if (entry.orbitLine) {
        scene.remove(entry.orbitLine);
        entry.orbitLine.geometry.dispose();
        if (entry.orbitLine.material instanceof THREE.Material) {
          entry.orbitLine.material.dispose();
        }
      }
    });

    renderer.dispose();
  };
}

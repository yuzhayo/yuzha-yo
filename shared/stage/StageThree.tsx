/**
 * ============================================================================
 * STAGE THREE.JS WEBGL RENDERER
 * ============================================================================
 *
 * This is a COMPLETE SELF-CONTAINED RENDERER that uses Three.js WebGL
 * to render the stage. It's one of three rendering engines:
 * - StageDOM.tsx - Uses HTML divs + CSS transforms
 * - StageCanvas.tsx - Uses Canvas 2D API
 * - StageThree.tsx (this file) - Uses Three.js WebGL
 *
 * ARCHITECTURE FOR FUTURE AI AGENTS:
 * -----------------------------------
 * 1. React component mounts and calls createStagePipeline() from StageSystem
 * 2. Pipeline contains all prepared layers with positions, scales, processors
 * 3. mountThreeRenderer() sets up WebGL renderer, camera, scene, and transformer
 * 4. mountThreeLayers() creates Three.js meshes for each layer
 * 5. Animation loop runs processors and updates mesh transforms each frame
 *
 * WHY THREE.JS RENDERER:
 * - Best performance for many layers and complex scenes
 * - Hardware-accelerated WebGL rendering
 * - Advanced visual effects (shaders, post-processing, etc.)
 * - 3D capabilities (when needed in future)
 *
 * WHEN TO USE:
 * - Maximum performance needed
 * - Many animated layers (>100)
 * - Complex visual effects
 * - Modern browsers with WebGL support
 *
 * @module StageThree
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  createStagePipeline,
  toRendererInput,
  createStageTransformer,
  roundStagePoint,
  STAGE_SIZE,
  type StagePipeline,
  type EnhancedLayerData,
  type LayerProcessor,
} from "./StageSystem";
import { runPipeline, AnimationConstants, createPipelineCache } from "../layer/layer";
import { getDeviceCapability } from "../utils/DeviceCapability";

const IS_DEV = import.meta.env?.DEV ?? false;

// ============================================================================
// THREE.JS LAYER RENDERING ENGINE
// ============================================================================
// This section contains the actual Three.js WebGL rendering logic. It creates
// meshes for each layer and renders them using the WebGL API.
// ============================================================================

/**
 * Pre-calculated transform values for efficient Three.js rendering.
 * These values are computed once per layer and reused every frame.
 *
 * FOR FUTURE AI AGENTS: imageCenter was removed from cache.
 * Use getImageCenter(imageMapping) to calculate on-demand.
 */
type ThreeTransformCache = {
  /** Plane width after scaling */
  scaledWidth: number;
  /** Plane height after scaling */
  scaledHeight: number;
  /** Whether this layer has rotation */
  hasRotation: boolean;
};

/**
 * Internal representation of a Three.js layer.
 * Contains the mesh, group, and data needed for rendering.
 */
type ThreeMeshEntry = {
  /** Plane mesh displaying the layer texture */
  mesh: THREE.Mesh;
  /** Group containing the mesh (used for transforms) */
  group: THREE.Group;
  /** Optional orbit path visualization line */
  orbitLine?: THREE.Line;
  /** Base layer data (unchanging) */
  baseData: EnhancedLayerData;
  /** Processors that animate this layer */
  processors: LayerProcessor[];
  /** Pre-calculated transform values for performance */
  transformCache: ThreeTransformCache;
  /** Whether this layer has no animation */
  isStatic: boolean;
  /** Whether this layer has animation */
  hasAnimation: boolean;
};

/**
 * Mounts Three.js layers and sets up rendering loop.
 *
 * RENDERING PROCESS:
 * 1. Load all textures in parallel
 * 2. Create plane geometry + material for each layer
 * 3. Create Three.js Group to hold mesh (for positioning/rotation)
 * 4. Convert stage coordinates (0-2048) to Three.js world space (centered at 0,0)
 * 5. Create orbit line visualization if needed
 * 6. Start requestAnimationFrame loop:
 *    - Run processors for each layer
 *    - Update group position/rotation
 *    - Update orbit line if present
 *    - Hook in optional diagnostics if reintroduced
 *    - Render scene to canvas
 *
 * COORDINATE SYSTEM CONVERSION:
 * - Stage: (0,0) = top-left, (2048,2048) = bottom-right
 * - Three.js: (0,0) = center, Y-axis flipped (positive = up)
 * - Conversion: x = stageX - 1024, y = 1024 - stageY
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Transform cache prevents repeated calculations
 * - Pipeline cache prevents re-running processors
 * - Sub-pixel precision preserved for smooth orbital animations
 * - Texture settings optimized for 2D rendering (no mipmaps, linear filtering)
 *
 * @param scene - Three.js scene to add meshes to
 * @param renderer - WebGL renderer instance
 * @param camera - Orthographic camera for 2D rendering
 * @param layersWithProcessors - Prepared layers from pipeline
 * @returns Cleanup function to stop animation and dispose resources
 */
async function mountThreeLayers(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  layersWithProcessors: Array<{ data: EnhancedLayerData; processors: LayerProcessor[] }>,
): Promise<() => void> {
  const meshData: ThreeMeshEntry[] = [];
  const textureLoader = new THREE.TextureLoader();
  const pipelineCache = createPipelineCache<EnhancedLayerData>();

  // Load all textures in parallel
  const texturePromises = layersWithProcessors.map(async (item) => {
    try {
      const texture = await textureLoader.loadAsync(item.data.imageUrl);
      // Configure texture for 2D rendering (no mipmaps, linear filtering)
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 1;
      texture.generateMipmaps = false;
      return { item, texture };
    } catch (error) {
      if (IS_DEV) {
        console.error(`[StageThree] Failed to load texture for "${item.data.ImageID}"`, error);
      }
      return null;
    }
  });

  const results = await Promise.all(texturePromises);

  // Create meshes for each loaded texture
  for (const result of results) {
    if (!result) continue;

    const { item, texture } = result;
    const { data, processors } = item;
    const isStatic = processors.length === 0;
    const hasAnimation = !isStatic;

    // Calculate scaled dimensions
    const scaledWidth = texture.image.width * data.scale.x;
    const scaledHeight = texture.image.height * data.scale.y;

    const transformCache: ThreeTransformCache = {
      scaledWidth,
      scaledHeight,
      hasRotation: (data.rotation ?? 0) !== 0,
    };

    // Create plane geometry and material
    const planeGeometry = new THREE.PlaneGeometry(scaledWidth, scaledHeight);
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    const group = new THREE.Group();

    // Convert stage coordinates to Three.js world space
    const initialPosition = roundStagePoint(data.position);
    group.position.set(initialPosition.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - initialPosition.y, 0);
    group.add(mesh);
    scene.add(group);

    // Create orbit line visualization if needed
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

  /**
   * Main animation loop.
   * Runs processors, updates meshes, and renders the scene.
   */
  let animationFrameId: number | null = null;
  const animate = (timestamp: number) => {
    for (const entry of meshData) {
      // Run processors to get updated layer data
      const enhanced =
        entry.hasAnimation && entry.processors.length > 0
          ? pipelineCache.get(entry.baseData.LayerID, () =>
              runPipeline(entry.baseData, entry.processors, timestamp),
            )
          : entry.baseData;

      // Update visibility
      entry.group.visible = enhanced.visible !== false;
      if (!entry.group.visible) continue;

      // Update position (convert stage coords to Three.js world space)
      // Preserve sub-pixel precision for orbital animation to prevent jitter at low speeds
      const position =
        enhanced.hasOrbitalAnimation || enhanced.hasSpinAnimation
          ? enhanced.position
          : roundStagePoint(enhanced.position);
      entry.group.position.set(position.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - position.y, 0);

      // Update rotation (negative because Three.js Y-axis is flipped)
      const rotation =
        enhanced.currentRotation ?? enhanced.rotation ?? entry.baseData.rotation ?? 0;
      entry.group.rotation.z = -(rotation * AnimationConstants.DEG_TO_RAD);

      // Update orbit line if present
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
    }

    // Render the scene
    renderer.render(scene, camera);
    pipelineCache.nextFrame();
    animationFrameId = requestAnimationFrame(animate);
  };

  animationFrameId = requestAnimationFrame(animate);

  // Cleanup function - disposes all Three.js resources
  return () => {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);

    // Dispose layer meshes
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

// ============================================================================
// THREE.JS RENDERER COMPONENT
// ============================================================================
// React component that orchestrates the Three.js rendering pipeline
// ============================================================================

/**
 * Mounts the complete Three.js renderer with auto-scaling transformer.
 *
 * WHAT IT DOES:
 * 1. Detects device capabilities (performance optimization)
 * 2. Creates WebGL renderer with optimized settings
 * 3. Sets up orthographic camera for 2D rendering
 * 4. Creates Three.js scene
 * 5. Sets up the stage transformer (handles viewport resize/scaling)
 * 6. Mounts the Three.js layers (creates meshes, starts rendering)
 * 7. Returns cleanup function
 *
 * DEVICE OPTIMIZATION:
 * - Low-end devices: low-power mode, no antialiasing, lower pixel ratio
 * - High-end devices: full quality, antialiasing, high pixel ratio
 *
 * @param container - Container element for the stage
 * @param canvas - Canvas element (will be 2048x2048, then scaled)
 * @param pipeline - Complete prepared pipeline from StageSystem
 * @returns Cleanup function
 */
async function mountThreeRenderer(
  container: HTMLDivElement,
  canvas: HTMLCanvasElement,
  pipeline: StagePipeline,
): Promise<() => void> {
  const deviceCap = getDeviceCapability();

  // Set canvas size
  canvas.width = pipeline.stageSize;
  canvas.height = pipeline.stageSize;

  // Create WebGL renderer with device-optimized settings
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

  // Create orthographic camera for 2D rendering
  const half = pipeline.stageSize / 2;
  const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 2000);
  camera.position.z = 1000;

  const scene = new THREE.Scene();

  // Setup auto-scaling transformer (handles window resize)
  const cleanupTransform = createStageTransformer(canvas, container, {
    resizeDebounce: 100,
  });

  // Mount layers and start rendering
  const cleanupLayers = await mountThreeLayers(scene, renderer, camera, toRendererInput(pipeline));

  return () => {
    cleanupTransform?.();
    cleanupLayers?.();
    renderer.dispose();
  };
}

/**
 * StageThree React Component
 *
 * LIFECYCLE:
 * 1. Component mounts
 * 2. useEffect creates pipeline from StageSystem
 * 3. mountThreeRenderer sets up WebGL rendering
 * 4. Component unmounts → cleanup is called
 *
 * USAGE: Just render <StageThree /> and it handles everything
 */
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
      // Load and prepare all layers
      const pipeline = await createStagePipeline();
      if (!active) return;
      // Mount renderer
      cleanup = await mountThreeRenderer(container, canvas, pipeline);
    })().catch((error) => {
      console.error("[StageThree] Failed to initialize Three.js stage", error);
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

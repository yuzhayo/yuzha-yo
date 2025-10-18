/**
 * ============================================================================
 * STAGE CANVAS RENDERER
 * ============================================================================
 *
 * This is a COMPLETE SELF-CONTAINED RENDERER that uses HTML Canvas 2D API
 * to render the stage. It's one of three rendering engines:
 * - StageDOM.tsx - Uses HTML divs + CSS transforms
 * - StageCanvas.tsx (this file) - Uses Canvas 2D API
 * - StageThree.tsx - Uses Three.js WebGL
 *
 * ARCHITECTURE FOR FUTURE AI AGENTS:
 * -----------------------------------
 * 1. React component mounts and calls createStagePipeline() from StageSystem
 * 2. Pipeline contains all prepared layers with positions, scales, processors
 * 3. mountCanvasRenderer() sets up the stage transformer (auto-scaling)
 * 4. mountCanvasLayers() loads images and renders to canvas every frame
 * 5. Animation loop runs processors and redraws canvas each frame
 *
 * WHY CANVAS RENDERER:
 * - Better performance than DOM for many layers
 * - Full pixel control (custom effects, filters)
 * - Consistent rendering across browsers
 * - Fallback for AI agents (no WebGL needed)
 *
 * WHEN TO USE:
 * - Many layers (>50)
 * - Custom visual effects needed
 * - WebGL not available or has issues
 * - Consistent pixel-perfect rendering required
 *
 * @module StageCanvas
 */

import React, { useEffect, useRef } from "react";
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
import { loadImage } from "../layer/layerCore";
import { runPipeline, AnimationConstants, createPipelineCache } from "../layer/layer";
import { CanvasDebugRenderer } from "../layer/layerDebug";

const IS_DEV = import.meta.env.DEV;

// ============================================================================
// CANVAS LAYER RENDERING ENGINE
// ============================================================================
// This section contains the actual Canvas 2D rendering logic. It loads images
// and draws them to a canvas using the 2D context API.
// ============================================================================

/**
 * Pre-calculated transform values for efficient canvas rendering.
 * These values are computed once per layer and reused every frame.
 */
type CanvasTransformCache = {
  /** Image width after scaling */
  scaledWidth: number;
  /** Image height after scaling */
  scaledHeight: number;
  /** X position of image center after scaling */
  centerX: number;
  /** Y position of image center after scaling */
  centerY: number;
  /** X position of pivot point after scaling */
  pivotX: number;
  /** Y position of pivot point after scaling */
  pivotY: number;
  /** Horizontal offset from center to pivot */
  dx: number;
  /** Vertical offset from center to pivot */
  dy: number;
  /** Whether this layer has rotation */
  hasRotation: boolean;
};

/**
 * Internal representation of a Canvas layer.
 * Contains the image and data needed for rendering.
 */
type CanvasLayerEntry = {
  /** Loaded image to draw */
  image: HTMLImageElement;
  /** Base layer data (unchanging) */
  baseData: EnhancedLayerData;
  /** Processors that animate this layer */
  processors: LayerProcessor[];
  /** Pre-calculated transform values for performance */
  transformCache: CanvasTransformCache;
  /** Whether this layer has no animation */
  isStatic: boolean;
  /** Whether this layer has animation */
  hasAnimation: boolean;
};

/**
 * Mounts Canvas layers and sets up rendering loop.
 *
 * RENDERING PROCESS:
 * 1. Load all images
 * 2. Pre-calculate transform caches for performance
 * 3. If animated: start requestAnimationFrame loop
 *    - Clear canvas
 *    - Run processors for each layer
 *    - Draw updated layers
 *    - Render debug visualizations if enabled
 * 4. If static: render once and return
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Transform cache prevents repeated calculations
 * - Pipeline cache prevents re-running processors
 * - Sub-pixel precision preserved for smooth orbital animations
 * - Static layers rendered once, never updated
 *
 * CANVAS DRAWING TECHNIQUE:
 * - save() → translate to layer position → rotate if needed → drawImage → restore()
 * - Rotation happens around pivot point (not center) for proper spin behavior
 *
 * @param ctx - Canvas 2D rendering context
 * @param layersWithProcessors - Prepared layers from pipeline
 * @returns Cleanup function to stop animation
 */
async function mountCanvasLayers(
  ctx: CanvasRenderingContext2D,
  layersWithProcessors: Array<{ data: EnhancedLayerData; processors: LayerProcessor[] }>,
): Promise<() => void> {
  const layers: CanvasLayerEntry[] = [];

  // Load images and setup transform caches
  for (const item of layersWithProcessors) {
    try {
      const image = await loadImage(item.data.imageUrl);

      const isStatic = item.processors.length === 0;
      const hasAnimation = !isStatic;

      // Pre-calculate transform values for performance
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
      if (IS_DEV) {
        console.error(`[StageCanvas] Failed to load image for "${item.data.imageId}"`, error);
      }
    }
  }

  const hasAnyAnimation = layers.some((layer) => layer.hasAnimation);
  const pipelineCache = createPipelineCache<EnhancedLayerData>();

  /**
   * Renders a single layer to the canvas.
   * Handles positioning, rotation, and scaling.
   */
  const renderLayer = (layer: CanvasLayerEntry, enhancedData: EnhancedLayerData) => {
    if (enhancedData.visible === false) return;

    const { transformCache } = layer;
    const rotation =
      enhancedData.currentRotation ?? enhancedData.rotation ?? layer.baseData.rotation ?? 0;

    ctx.save();
    // Preserve sub-pixel precision for orbital animation to prevent jitter at low speeds
    const position = enhancedData.hasOrbitalAnimation
      ? enhancedData.position
      : roundStagePoint(enhancedData.position);
    ctx.translate(position.x, position.y);

    // Apply rotation around pivot point
    if (rotation !== 0) {
      ctx.translate(-transformCache.dx, -transformCache.dy);
      ctx.rotate(rotation * AnimationConstants.DEG_TO_RAD);
      ctx.translate(transformCache.dx, transformCache.dy);
    }

    // Draw the image
    ctx.drawImage(
      layer.image,
      -transformCache.centerX,
      -transformCache.centerY,
      transformCache.scaledWidth,
      transformCache.scaledHeight,
    );
    ctx.restore();
  };

  /**
   * Main render loop for animated layers.
   * Clears canvas, updates all layers, renders debug visuals.
   */
  const renderFrame = (timestamp: number) => {
    ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);
    const frameData = new Map<string, EnhancedLayerData>();

    // Render all layers
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

    // Render debug visualizations (if enabled in config)
    for (const layer of layers) {
      const enhancedData = frameData.get(layer.baseData.layerId) ?? layer.baseData;
      if (enhancedData.imageMappingDebugVisuals) {
        CanvasDebugRenderer.drawAll(ctx, enhancedData.imageMappingDebugVisuals, STAGE_SIZE);
      }
    }

    pipelineCache.nextFrame();
    requestAnimationFrame(renderFrame);
  };

  // If any layers are animated, start the render loop
  if (hasAnyAnimation) {
    requestAnimationFrame(renderFrame);
    return () => {
      pipelineCache.clear();
    };
  }

  // For static scenes, render once
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

  // Render debug visualizations for static scene
  for (const layer of layers) {
    const enhancedData = frameData.get(layer.baseData.layerId) ?? layer.baseData;
    if (enhancedData.imageMappingDebugVisuals) {
      CanvasDebugRenderer.drawAll(ctx, enhancedData.imageMappingDebugVisuals, STAGE_SIZE);
    }
  }

  return () => {};
}

// ============================================================================
// CANVAS RENDERER COMPONENT
// ============================================================================
// React component that orchestrates the Canvas rendering pipeline
// ============================================================================

/**
 * Mounts the complete Canvas renderer with auto-scaling transformer.
 *
 * WHAT IT DOES:
 * 1. Gets 2D context from canvas element
 * 2. Sets canvas size to STAGE_SIZE (2048x2048)
 * 3. Sets up the stage transformer (handles viewport resize/scaling)
 * 4. Mounts the canvas layers (loads images, starts rendering)
 * 5. Returns cleanup function
 *
 * @param container - Container element for the stage
 * @param canvas - Canvas element (will be 2048x2048, then scaled)
 * @param pipeline - Complete prepared pipeline from StageSystem
 * @returns Cleanup function
 */
async function mountCanvasRenderer(
  container: HTMLDivElement,
  canvas: HTMLCanvasElement,
  pipeline: StagePipeline,
): Promise<() => void> {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("[StageCanvas] Failed to acquire 2D context");
  }

  // Set canvas to stage size
  canvas.width = pipeline.stageSize;
  canvas.height = pipeline.stageSize;

  // Setup auto-scaling transformer (handles window resize)
  const cleanupTransform = createStageTransformer(canvas, container, {
    resizeDebounce: 100,
  });

  // Mount layers and start rendering
  const cleanupLayers = await mountCanvasLayers(context, toRendererInput(pipeline));

  return () => {
    cleanupTransform?.();
    cleanupLayers?.();
  };
}

/**
 * StageCanvas React Component
 *
 * LIFECYCLE:
 * 1. Component mounts
 * 2. useEffect creates pipeline from StageSystem
 * 3. mountCanvasRenderer sets up rendering
 * 4. Component unmounts → cleanup is called
 *
 * USAGE: Just render <StageCanvas /> and it handles everything
 */
function StageCanvas() {
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
      cleanup = await mountCanvasRenderer(container, canvas, pipeline);
    })().catch((error) => {
      console.error("[StageCanvas] Failed to initialize Canvas stage", error);
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

export default React.memo(StageCanvas);

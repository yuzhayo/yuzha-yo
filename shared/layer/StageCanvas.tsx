/**
 * ============================================================================
 * STAGE CANVAS RENDERER
 * ============================================================================
 *
 * This is a COMPLETE SELF-CONTAINED RENDERER that uses HTML Canvas 2D API
 * to render the stage. It's one of two rendering engines:
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
  type StagePipeline,
  type StageMarker,
  type LayerBounds,
  type LayerMetadata,
  type EnhancedLayerData,
  type LayerProcessor,
  computeLayerBounds,
  isLayerWithinStageBounds,
} from "./StageSystem";
import { loadImage, runPipeline, createPipelineCache } from "./engine";
import { getImageCenter, AnimationConstants } from "./math";

const IS_DEV = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

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

const transformCachePool: CanvasTransformCache[] = [];
const STATIC_CULL_PADDING = 4;
const DYNAMIC_CULL_PADDING = 48;
const acquireTransformCache = (): CanvasTransformCache =>
  transformCachePool.pop() ?? {
    scaledWidth: 0,
    scaledHeight: 0,
    centerX: 0,
    centerY: 0,
    pivotX: 0,
    pivotY: 0,
    dx: 0,
    dy: 0,
    hasRotation: false,
  };

const releaseTransformCache = (cache: CanvasTransformCache): void => {
  transformCachePool.push(cache);
};

type PreparedMarker =
  | {
      marker: StageMarker;
      motion?: undefined;
    }
  | {
      marker: StageMarker;
      motion: {
        angularVelocityDegPerMs: number;
        initialAngleDeg: number;
        centerX: number;
        centerY: number;
        radius: number;
      };
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
  /** Precomputed bounds for the base layer state */
  baseBounds: LayerBounds;
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
  layersWithProcessors: Array<{
    data: EnhancedLayerData;
    processors: LayerProcessor[];
    metadata: LayerMetadata;
  }>,
  markers: StageMarker[] = [],
  stageSize: number,
): Promise<() => void> {
  const layers: CanvasLayerEntry[] = [];

  // Load images and setup transform caches
  for (const item of layersWithProcessors) {
    try {
      const { data, processors, metadata } = item;
      const image = await loadImage(data.imageUrl);
      const { isStatic, hasAnimation, baseBounds, visibleByDefault } = metadata;

      // Pre-calculate transform values for performance
      const transformCache = acquireTransformCache();
      transformCache.scaledWidth = image.width * data.scale.x;
      transformCache.scaledHeight = image.height * data.scale.y;
      transformCache.centerX = (image.width / 2) * data.scale.x;
      transformCache.centerY = (image.height / 2) * data.scale.y;
      const pivot = getImageCenter(data.imageMapping);
      transformCache.pivotX = pivot.x * data.scale.x;
      transformCache.pivotY = pivot.y * data.scale.y;
      transformCache.dx = transformCache.centerX - transformCache.pivotX;
      transformCache.dy = transformCache.centerY - transformCache.pivotY;
      transformCache.hasRotation = (data.rotation ?? 0) !== 0;

      if (isStatic && visibleByDefault && !isLayerWithinStageBounds(baseBounds, stageSize)) {
        releaseTransformCache(transformCache);
        if (IS_DEV) {
          console.info(`[StageCanvas] Skipping offscreen static layer "${data.LayerID}"`);
        }
        continue;
      }

      layers.push({
        image,
        baseData: data,
        processors,
        transformCache,
        isStatic,
        hasAnimation,
        baseBounds,
      });
    } catch (error) {
      if (IS_DEV) {
        console.error(`[StageCanvas] Failed to load image for "${item.data.ImageID}"`, error);
      }
    }
  }

  const preparedMarkers: PreparedMarker[] = markers.map((marker) => {
    if (marker.motion?.type === "orbit") {
      const directionSign = marker.motion.direction === "ccw" ? 1 : -1;
      const angularVelocityDegPerMs =
        (marker.motion.rotationsPerHour * 360 * directionSign) / 3600000;
      return {
        marker,
        motion: {
          angularVelocityDegPerMs,
          initialAngleDeg: marker.motion.initialAngleDeg,
          centerX: marker.motion.centerX,
          centerY: marker.motion.centerY,
          radius: marker.motion.radius,
        },
      };
    }
    return { marker };
  });

  const hasMarkerAnimation = preparedMarkers.some((entry) => entry.motion !== undefined);
  const hasAnyAnimation = layers.some((layer) => layer.hasAnimation) || hasMarkerAnimation;

  let markerStartTime: number | undefined;

  const renderMarkers = (timestamp?: number) => {
    if (preparedMarkers.length === 0) return;
    const elapsedMs =
      timestamp !== undefined
        ? (() => {
            if (markerStartTime === undefined) {
              markerStartTime = timestamp;
              return 0;
            }
            return timestamp - markerStartTime;
          })()
        : 0;
    ctx.save();
    for (const entry of preparedMarkers) {
      const marker = entry.marker;
      let drawX = marker.x;
      let drawY = marker.y;

      if (entry.motion) {
        const angleDeg =
          entry.motion.initialAngleDeg + elapsedMs * entry.motion.angularVelocityDegPerMs;
        const angleRad = (angleDeg * Math.PI) / 180;
        drawX = entry.motion.centerX + entry.motion.radius * Math.cos(angleRad);
        drawY = entry.motion.centerY - entry.motion.radius * Math.sin(angleRad);
      }

      if (marker.kind === "circle") {
        const radius = marker.radius ?? 0;
        if (radius <= 0) continue;
        ctx.beginPath();
        ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
        ctx.lineWidth = marker.lineWidth ?? 1;
        ctx.strokeStyle = marker.color ?? "rgba(255, 255, 255, 0.9)";
        ctx.stroke();
        continue;
      }

      const radius = marker.radius ?? 6;
      ctx.beginPath();
      ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
      ctx.fillStyle = marker.color ?? "rgba(255, 255, 255, 0.9)";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
      ctx.stroke();
    }
    ctx.restore();
  };

  const pipelineCache = createPipelineCache<EnhancedLayerData>();
  const releaseCaches = (): void => {
    for (const layer of layers) {
      releaseTransformCache(layer.transformCache);
    }
    layers.length = 0;
  };

  const computeRuntimeBounds = (data: EnhancedLayerData): LayerBounds =>
    computeLayerBounds(data.position, data.scale, data.imageMapping);

  const shouldRenderLayer = (layer: CanvasLayerEntry, enhancedData: EnhancedLayerData): boolean => {
    if (enhancedData.visible === false) return false;
    const padding = layer.hasAnimation ? DYNAMIC_CULL_PADDING : STATIC_CULL_PADDING;
    return isLayerWithinStageBounds(computeRuntimeBounds(enhancedData), stageSize, padding);
  };

  /**
   * Renders a single layer to the canvas.
   * Handles positioning, rotation, and scaling.
   */
  const renderLayer = (layer: CanvasLayerEntry, enhancedData: EnhancedLayerData) => {
    if (!shouldRenderLayer(layer, enhancedData)) return;

    const { transformCache } = layer;
    const rotation =
      enhancedData.currentRotation ?? enhancedData.rotation ?? layer.baseData.rotation ?? 0;

    ctx.save();
    // Preserve spin/orbit sub-pixel precision to avoid wobble when pivot isn't centered
    const position =
      enhancedData.hasOrbitalAnimation || enhancedData.hasSpinAnimation
        ? enhancedData.position
        : roundStagePoint(enhancedData.position);
    ctx.translate(position.x, position.y);
    const alpha = enhancedData.opacity ?? 1;
    ctx.globalAlpha = alpha;

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
   * Clears canvas, updates all layers, renders composited pixels.
   */
  const renderFrame = (timestamp: number) => {
    ctx.clearRect(0, 0, stageSize, stageSize);
    // Render all layers
    for (const layer of layers) {
      const enhancedData =
        layer.hasAnimation && layer.processors.length > 0
          ? pipelineCache.get(layer.baseData.LayerID, () =>
              runPipeline(layer.baseData, layer.processors, timestamp),
            )
          : layer.baseData;

      renderLayer(layer, enhancedData);
    }

    renderMarkers(timestamp);

    pipelineCache.nextFrame();
    requestAnimationFrame(renderFrame);
  };

  // If any layers are animated, start the render loop
  if (hasAnyAnimation) {
    requestAnimationFrame(renderFrame);
    return () => {
      pipelineCache.clear();
      releaseCaches();
    };
  }

  // For static scenes, render once
  ctx.clearRect(0, 0, stageSize, stageSize);
  const renderStaticLayer = (layer: CanvasLayerEntry) => {
    const enhancedData =
      layer.processors.length > 0 ? runPipeline(layer.baseData, layer.processors) : layer.baseData;
    renderLayer(layer, enhancedData);
    return enhancedData;
  };

  for (const layer of layers) {
    renderStaticLayer(layer);
  }

  renderMarkers();

  return () => {
    releaseCaches();
  };
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
  const cleanupLayers = await mountCanvasLayers(
    context,
    toRendererInput(pipeline),
    pipeline.markers ?? [],
    pipeline.stageSize,
  );

  return () => {
    cleanupTransform?.();
    cleanupLayers?.();
  };
}

export type StageCanvasProps = {
  loadPipeline?: () => Promise<StagePipeline>;
};

/**
 * StageCanvas React Component
 *
 * LIFECYCLE:
 * 1. Component mounts
 * 2. useEffect creates pipeline from StageSystem (or custom loader)
 * 3. mountCanvasRenderer sets up rendering
 * 4. Component unmounts → cleanup is called
 *
 * USAGE: Just render <StageCanvas />. Provide `loadPipeline` to override data source.
 */
function StageCanvas({ loadPipeline = createStagePipeline }: StageCanvasProps) {
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
      const pipeline = await loadPipeline();
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
  }, [loadPipeline]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

export default React.memo(StageCanvas);

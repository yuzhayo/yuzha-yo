/**
 * ============================================================================
 * STAGE DOM RENDERER
 * ============================================================================
 *
 * This is a COMPLETE SELF-CONTAINED RENDERER that uses DOM elements and CSS
 * transforms to render the stage. It's one of three rendering engines:
 * - StageDOM.tsx (this file) - Uses HTML divs + CSS transforms
 * - StageCanvas.tsx - Uses Canvas 2D API
 * - StageThree.tsx - Uses Three.js WebGL
 *
 * ARCHITECTURE FOR FUTURE AI AGENTS:
 * -----------------------------------
 * 1. React component mounts and calls createStagePipeline() from StageSystem
 * 2. Pipeline contains all prepared layers with positions, scales, processors
 * 3. mountDomRenderer() sets up the stage transformer (auto-scaling)
 * 4. mountDomLayers() loads images and creates DOM elements for each layer
 * 5. Animation loop runs processors and updates DOM element styles every frame
 *
 * WHY DOM RENDERER:
 * - Lightest weight (no canvas/WebGL overhead)
 * - Best for simple 2D animations
 * - Easy to debug in browser DevTools
 * - CSS hardware acceleration on most devices
 *
 * WHEN TO USE:
 * - Simple layer animations (spin, orbit)
 * - Limited number of layers (<50)
 * - Good browser support needed
 *
 * @module StageDOM
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
import { runPipeline, createPipelineCache } from "../layer/layer";

const IS_DEV = import.meta.env?.DEV ?? false;

// ============================================================================
// DOM LAYER RENDERING ENGINE
// ============================================================================
// This section contains the actual DOM rendering logic. It creates HTML
// elements for each layer and animates them using CSS transforms.
// ============================================================================

/**
 * Internal representation of a DOM layer.
 * Contains the DOM elements and data needed for rendering and animation.
 */
type DomLayerEntry = {
  /** Container div for this layer */
  container: HTMLDivElement;
  /** Image element displaying the layer's texture */
  img: HTMLImageElement;
  /** Optional orbit path visualization */
  orbitLineEl?: HTMLDivElement;
  /** Base layer data (unchanging) */
  baseData: EnhancedLayerData;
  /** Processors that animate this layer (spin, orbit, etc.) */
  processors: LayerProcessor[];
  /** Whether this layer has no animation */
  isStatic: boolean;
  /** Whether this layer has animation */
  hasAnimation: boolean;
};

/**
 * Mounts DOM layers into the container and sets up animation loop.
 *
 * RENDERING PROCESS:
 * 1. Creates a div container for each layer
 * 2. Loads the image and sets initial position/rotation/scale
 * 3. Creates orbit line visualization if needed
 * 4. If any layers have animation, starts requestAnimationFrame loop
 * 5. Each frame: runs processors → updates CSS transforms
 *
 * PERFORMANCE NOTES:
 * - Static layers (no processors) are positioned once and never updated
 * - Animated layers use CSS transforms (GPU accelerated)
 * - Sub-pixel precision preserved for smooth orbital animations
 * - Pipeline cache prevents re-running processors multiple times per frame
 *
 * @param containerEl - The stage container element (2048x2048)
 * @param layersWithProcessors - Prepared layers from pipeline
 * @returns Cleanup function to stop animation and clear DOM
 */
async function mountDomLayers(
  containerEl: HTMLDivElement,
  layersWithProcessors: Array<{ data: EnhancedLayerData; processors: LayerProcessor[] }>,
): Promise<() => void> {
  const layers: DomLayerEntry[] = [];

  // Setup container
  containerEl.innerHTML = "";
  containerEl.style.position = "relative";
  containerEl.style.width = `${STAGE_SIZE}px`;
  containerEl.style.height = `${STAGE_SIZE}px`;

  // Create DOM elements for each layer
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

      // Setup image element
      img.style.width = `${naturalWidth}px`;
      img.style.height = `${naturalHeight}px`;
      img.style.maxWidth = "none";
      img.style.maxHeight = "none";
      img.style.display = "block";
      img.style.position = "absolute";
      img.style.transformOrigin = "center center";

      // Position image (centered on position point)
      const roundedPosition = roundStagePoint(position);
      const left = roundedPosition.x - naturalWidth / 2;
      const top = roundedPosition.y - naturalHeight / 2;
      img.style.left = `${left}px`;
      img.style.top = `${top}px`;

      // Create orbit line visualization if needed
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

      // Apply initial transforms (scale + rotation)
      const transforms: string[] = [];
      if (scale.x !== 1 || scale.y !== 1) transforms.push(`scale(${scale.x}, ${scale.y})`);
      if (displayRotation !== 0) transforms.push(`rotate(${displayRotation}deg)`);
      if (transforms.length > 0) img.style.transform = transforms.join(" ");

      layerDiv.appendChild(img);

      // Position orbit line if visible
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
      if (IS_DEV) {
        console.error(`[StageDOM] Failed to load image for "${item.data.ImageID}"`, error);
      }
    }
  }

  const hasAnyAnimation = layers.some((layer) => layer.hasAnimation);

  // If no animations, just return cleanup
  if (!hasAnyAnimation) {
    return () => {
      containerEl.innerHTML = "";
    };
  }

  // Setup animation loop for animated layers
  let animationFrameId: number | null = null;
  const pipelineCache = createPipelineCache<EnhancedLayerData>();

  const animate = (timestamp: number) => {
    for (const layer of layers) {
      if (!layer.hasAnimation || layer.processors.length === 0) continue;

      // Run processors to get updated layer data
      const enhancedData = pipelineCache.get(layer.baseData.LayerID, () =>
        runPipeline(layer.baseData, layer.processors, timestamp),
      );

      // Update CSS transforms (scale + rotation)
      const transforms: string[] = [];
      if (enhancedData.scale.x !== 1 || enhancedData.scale.y !== 1) {
        transforms.push(`scale(${enhancedData.scale.x}, ${enhancedData.scale.y})`);
      }
      const rotation = enhancedData.currentRotation ?? enhancedData.rotation ?? 0;
      if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
      if (transforms.length > 0) layer.img.style.transform = transforms.join(" ");

      // Update position
      const naturalWidth = layer.img.naturalWidth;
      const naturalHeight = layer.img.naturalHeight;
      // Preserve sub-pixel precision for orbital animation to prevent jitter at low speeds
      const position = enhancedData.hasOrbitalAnimation
        ? enhancedData.position
        : roundStagePoint(enhancedData.position);
      const left = position.x - naturalWidth / 2;
      const top = position.y - naturalHeight / 2;
      layer.img.style.left = `${left}px`;
      layer.img.style.top = `${top}px`;

      // Update orbit line if present
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

      // Update visibility
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

// ============================================================================
// DOM RENDERER COMPONENT
// ============================================================================
// React component that orchestrates the DOM rendering pipeline
// ============================================================================

/**
 * Mounts the complete DOM renderer with auto-scaling transformer.
 *
 * WHAT IT DOES:
 * 1. Sets up the stage transformer (handles viewport resize/scaling)
 * 2. Mounts the DOM layers (creates elements, starts animation)
 * 3. Returns cleanup function
 *
 * @param container - Container element for the stage
 * @param stage - Stage element (will be 2048x2048, then scaled)
 * @param pipeline - Complete prepared pipeline from StageSystem
 * @returns Cleanup function
 */
async function mountDomRenderer(
  container: HTMLDivElement,
  stage: HTMLDivElement,
  pipeline: StagePipeline,
): Promise<() => void> {
  // Setup auto-scaling transformer (handles window resize)
  const cleanupTransform = createStageTransformer(stage, container, {
    resizeDebounce: 100,
  });

  // Mount layers and start animation
  const cleanupLayers = await mountDomLayers(stage, toRendererInput(pipeline));

  return () => {
    cleanupTransform?.();
    cleanupLayers?.();
  };
}

/**
 * StageDOM React Component
 *
 * LIFECYCLE:
 * 1. Component mounts
 * 2. useEffect creates pipeline from StageSystem
 * 3. mountDomRenderer sets up rendering
 * 4. Component unmounts → cleanup is called
 *
 * USAGE: Just render <StageDOM /> and it handles everything
 */
function StageDOM() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    let cleanup: (() => void) | undefined;
    let active = true;

    (async () => {
      // Load and prepare all layers
      const pipeline = await createStagePipeline();
      if (!active) return;
      // Mount renderer
      cleanup = await mountDomRenderer(container, stage, pipeline);
    })().catch((error) => {
      console.error("[StageDOM] Failed to initialize DOM stage", error);
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      <div ref={stageRef} className="block" />
    </div>
  );
}

export default React.memo(StageDOM);

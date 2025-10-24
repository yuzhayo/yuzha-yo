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
  createStageTransformer,
  roundStagePoint,
  STAGE_SIZE,
  type StagePipeline,
  type EnhancedLayerData,
  type LayerProcessor,
  type PreparedLayer,
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

const CSS_SPIN_ANIMATION = "stage-spin";
const CSS_ORBIT_ANIMATION = "stage-orbit";

type CssAnimationParams = {
  containerEl: HTMLDivElement;
  layerDiv: HTMLDivElement;
  img: HTMLImageElement;
  naturalWidth: number;
  naturalHeight: number;
  preparedLayer: PreparedLayer;
  initialData: EnhancedLayerData;
};

/**
 * Attempt to render a layer using pure CSS animations (GPU accelerated).
 *
 * Returns true when the layer was fully handled through CSS (no JS updates needed).
 * Falls back to imperative updates when the layer uses behaviours that require
 * per-frame calculations (e.g. orbit orient, custom processors).
 */
function trySetupCssAnimation({
  layerDiv,
  img,
  naturalWidth,
  naturalHeight,
  preparedLayer,
  initialData,
}: CssAnimationParams): boolean {
  const { entry } = preparedLayer;
  const spinSpeed = Math.abs(initialData.spinSpeed ?? entry.spinSpeed ?? 0);
  const orbitSpeed = Math.abs(initialData.orbitSpeed ?? entry.orbitSpeed ?? 0);
  const orbitRadius = initialData.orbitLineStyle?.radius ?? initialData.orbitRadius ?? 0;
  const hasSpin = spinSpeed > 0;
  const hasOrbit = orbitSpeed > 0 && orbitRadius > 0;

  // Only target the simple constant-speed orbit/spin cases
  if (!hasSpin && !hasOrbit) {
    return false;
  }

  // Behaviours we cannot currently express with pure CSS fall back to JS
  if (initialData.orbitOrient || entry.orbitOrient) {
    return false;
  }

  const allowedProcessors = (hasSpin ? 1 : 0) + (hasOrbit ? 1 : 0);
  if (preparedLayer.processors.length > allowedProcessors) {
    return false;
  }

  const scale = initialData.scale;
  const scaledWidth = naturalWidth * scale.x;
  const scaledHeight = naturalHeight * scale.y;
  if (!Number.isFinite(scaledWidth) || !Number.isFinite(scaledHeight)) {
    return false;
  }

  // Ensure consistent stacking regardless of render order
  layerDiv.style.width = "0";
  layerDiv.style.height = "0";
  const visibility = initialData.visible;
  if (visibility === false) {
    layerDiv.style.display = "none";
  }
  if (initialData.opacity !== undefined) {
    layerDiv.style.opacity = `${initialData.opacity}`;
  }
  if (initialData.filters && initialData.filters.length > 0) {
    layerDiv.style.filter = initialData.filters.join(" ");
  }

  img.style.display = "block";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.maxWidth = "none";
  img.style.maxHeight = "none";
  img.style.pointerEvents = "none";
  img.decoding = "async";

  const baseRotation = initialData.rotation ?? 0;
  const spinDirection = initialData.spinDirection ?? entry.spinDirection ?? "cw";
  const spinDuration = hasSpin && spinSpeed > 0 ? 360 / spinSpeed : undefined;
  const pivotPercent = extractPivotPercent(initialData, naturalWidth, naturalHeight);

  if (!hasOrbit) {
    const placement = computeLayerPlacement(initialData, scaledWidth, scaledHeight);

    layerDiv.style.left = `${placement.left}px`;
    layerDiv.style.top = `${placement.top}px`;
    layerDiv.style.width = `${scaledWidth}px`;
    layerDiv.style.height = `${scaledHeight}px`;

    const spinHierarchy = createSpinHierarchy({
      scaledWidth,
      scaledHeight,
      pivotPercent,
      baseRotation,
      spinDuration,
      spinDirection,
      img,
    });
    layerDiv.appendChild(spinHierarchy);
    return true;
  }

  const orbitCenter =
    initialData.orbitStagePoint ??
    toStagePoint(entry.orbitStagePoint) ??
    initialData.calculation.stageCenter.point;
  const orbitLinePoint =
    initialData.orbitLinePoint ?? toStagePoint(entry.orbitLinePoint) ?? orbitCenter;
  const orbitImagePercent = extractOrbitPercent(initialData, entry);

  if (!orbitCenter) {
    return false;
  }

  const orbitDuration = orbitSpeed > 0 ? 360 / orbitSpeed : undefined;
  if (!orbitDuration || !Number.isFinite(orbitDuration)) {
    return false;
  }

  const orbitWrapper = document.createElement("div");
  orbitWrapper.style.position = "absolute";
  orbitWrapper.style.left = `${orbitCenter.x - orbitRadius}px`;
  orbitWrapper.style.top = `${orbitCenter.y - orbitRadius}px`;
  orbitWrapper.style.width = `${orbitRadius * 2}px`;
  orbitWrapper.style.height = `${orbitRadius * 2}px`;
  orbitWrapper.style.transformOrigin = "50% 50%";
  orbitWrapper.style.animationName = CSS_ORBIT_ANIMATION;
  orbitWrapper.style.animationDuration = `${orbitDuration}s`;
  orbitWrapper.style.animationTimingFunction = "linear";
  orbitWrapper.style.animationIterationCount = "infinite";
  orbitWrapper.style.animationDirection =
    (initialData.orbitDirection ?? entry.orbitDirection ?? "cw") === "ccw"
      ? "reverse"
      : "normal";
  const initialAngle = calculateInitialOrbitAngle(orbitCenter, orbitLinePoint);
  if (initialAngle !== 0) {
    const normalized = ((initialAngle % 360) + 360) % 360;
    const progress = normalized / 360;
    orbitWrapper.style.animationDelay = `${-orbitDuration * progress}s`;
  }
  orbitWrapper.style.willChange = "transform";

  const orbitPositioner = document.createElement("div");
  orbitPositioner.style.position = "absolute";
  orbitPositioner.style.left = "50%";
  orbitPositioner.style.top = "50%";
  orbitPositioner.style.width = "0";
  orbitPositioner.style.height = "0";
  orbitPositioner.style.transform = `translate(-50%, -50%) translateY(-${orbitRadius}px)`;
  orbitWrapper.appendChild(orbitPositioner);

  const orbitAnchor = document.createElement("div");
  orbitAnchor.style.position = "absolute";
  orbitAnchor.style.left = "0";
  orbitAnchor.style.top = "0";
  orbitAnchor.style.width = `${scaledWidth}px`;
  orbitAnchor.style.height = `${scaledHeight}px`;
  const anchorX = (orbitImagePercent.x / 100) * scaledWidth;
  const anchorY = (orbitImagePercent.y / 100) * scaledHeight;
  orbitAnchor.style.transform = `translate(${-anchorX}px, ${-anchorY}px)`;
  orbitPositioner.appendChild(orbitAnchor);

  const spinHierarchy = createSpinHierarchy({
    scaledWidth,
    scaledHeight,
    pivotPercent,
    baseRotation,
    spinDuration,
    spinDirection,
    img,
  });
  orbitAnchor.appendChild(spinHierarchy);

  if (initialData.orbitLineStyle?.visible && orbitRadius > 0) {
    const orbitLineEl = document.createElement("div");
    orbitLineEl.style.position = "absolute";
    orbitLineEl.style.pointerEvents = "none";
    orbitLineEl.style.border = "1px dashed rgba(255,255,255,0.25)";
    orbitLineEl.style.borderRadius = "50%";
    orbitLineEl.style.width = `${orbitRadius * 2}px`;
    orbitLineEl.style.height = `${orbitRadius * 2}px`;
    orbitLineEl.style.left = `${orbitCenter.x - orbitRadius}px`;
    orbitLineEl.style.top = `${orbitCenter.y - orbitRadius}px`;
    orbitLineEl.classList.add("stage-orbit-line");
    layerDiv.appendChild(orbitLineEl);
  }

  layerDiv.appendChild(orbitWrapper);
  return true;
}

type SpinHierarchyOptions = {
  scaledWidth: number;
  scaledHeight: number;
  pivotPercent: { x: number; y: number };
  baseRotation: number;
  spinDuration?: number;
  spinDirection: "cw" | "ccw";
  img: HTMLImageElement;
};

function createSpinHierarchy({
  scaledWidth,
  scaledHeight,
  pivotPercent,
  baseRotation,
  spinDuration,
  spinDirection,
  img,
}: SpinHierarchyOptions): HTMLDivElement {
  const baseWrapper = document.createElement("div");
  baseWrapper.style.position = "absolute";
  baseWrapper.style.left = "0";
  baseWrapper.style.top = "0";
  baseWrapper.style.width = `${scaledWidth}px`;
  baseWrapper.style.height = `${scaledHeight}px`;
  const pivotOrigin = `${pivotPercent.x}% ${pivotPercent.y}%`;
  baseWrapper.style.transformOrigin = pivotOrigin;
  if (baseRotation !== 0) {
    baseWrapper.style.transform = `rotate(${baseRotation}deg)`;
  }

  const spinWrapper = document.createElement("div");
  spinWrapper.style.width = "100%";
  spinWrapper.style.height = "100%";
  spinWrapper.style.transformOrigin = pivotOrigin;
  if (spinDuration && Number.isFinite(spinDuration) && spinDuration > 0) {
    spinWrapper.style.animationName = CSS_SPIN_ANIMATION;
    spinWrapper.style.animationDuration = `${spinDuration}s`;
    spinWrapper.style.animationTimingFunction = "linear";
    spinWrapper.style.animationIterationCount = "infinite";
    if (spinDirection === "ccw") {
      spinWrapper.style.animationDirection = "reverse";
    }
    spinWrapper.style.willChange = "transform";
  }

  spinWrapper.appendChild(img);
  baseWrapper.appendChild(spinWrapper);
  return baseWrapper;
}

function computeLayerPlacement(
  data: EnhancedLayerData,
  scaledWidth: number,
  scaledHeight: number,
): { left: number; top: number } {
  const basePosition = data.position ?? { x: 0, y: 0 };
  const centerX = scaledWidth / 2;
  const centerY = scaledHeight / 2;
  const pivot = data.imageMapping.imageCenter;
  const pivotX = pivot.x * data.scale.x;
  const pivotY = pivot.y * data.scale.y;
  const dx = centerX - pivotX;
  const dy = centerY - pivotY;
  const position = roundStagePoint(basePosition);
  return {
    left: position.x - centerX + dx,
    top: position.y - centerY + dy,
  };
}

function extractPivotPercent(
  data: EnhancedLayerData,
  naturalWidth: number,
  naturalHeight: number,
): { x: number; y: number } {
  if (data.calculation?.spinPoint?.image?.percent) {
    return {
      x: data.calculation.spinPoint.image.percent.x,
      y: data.calculation.spinPoint.image.percent.y,
    };
  }
  const imageCenter = data.imageMapping.imageCenter;
  return {
    x: (imageCenter.x / naturalWidth) * 100,
    y: (imageCenter.y / naturalHeight) * 100,
  };
}

function extractOrbitPercent(
  data: EnhancedLayerData,
  entry: PreparedLayer["entry"],
): { x: number; y: number } {
  if (data.orbitImagePercent) {
    return data.orbitImagePercent;
  }
  if (Array.isArray(entry.orbitImagePoint) && entry.orbitImagePoint.length >= 2) {
    return { x: entry.orbitImagePoint[0] ?? 50, y: entry.orbitImagePoint[1] ?? 50 };
  }
  return { x: 50, y: 50 };
}

function toStagePoint(value?: number[]): { x: number; y: number } | undefined {
  if (!Array.isArray(value) || value.length < 2) return undefined;
  const [x, y] = value;
  if (typeof x !== "number" || typeof y !== "number") return undefined;
  return { x, y };
}

function calculateInitialOrbitAngle(
  center: { x: number; y: number },
  point: { x: number; y: number },
): number {
  const dx = point.x - center.x;
  const angle = (Math.atan2(-(point.y - center.y), dx) * 180) / Math.PI;
  return Number.isFinite(angle) ? angle : 0;
}

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
  layersWithProcessors: PreparedLayer[],
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
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      const initialData =
        item.processors.length > 0
          ? runPipeline(item.data, item.processors, performance.now())
          : (item.data as EnhancedLayerData);

      const layerDiv = document.createElement("div");
      layerDiv.style.position = "absolute";
      layerDiv.style.pointerEvents = "none";
      layerDiv.style.left = "0";
      layerDiv.style.top = "0";
      layerDiv.dataset.layerId = item.entry.LayerID;
      if (typeof item.entry.LayerOrder === "number") {
        layerDiv.style.zIndex = `${item.entry.LayerOrder}`;
      }

      const cssHandled = trySetupCssAnimation({
        containerEl,
        layerDiv,
        img,
        naturalWidth,
        naturalHeight,
        preparedLayer: item,
        initialData,
      });

      if (cssHandled) {
        containerEl.appendChild(layerDiv);
        continue;
      }

      const { position, scale, rotation } = item.data;
      const displayRotation = rotation ?? 0;

      // Calculate scaled dimensions (matches Canvas/Three.js)
      const scaledWidth = naturalWidth * scale.x;
      const scaledHeight = naturalHeight * scale.y;

      // Calculate center and pivot in scaled space (matches Canvas)
      const centerX = scaledWidth / 2;
      const centerY = scaledHeight / 2;
      const pivot = item.data.imageMapping.imageCenter;
      const pivotX = pivot.x * scale.x;
      const pivotY = pivot.y * scale.y;

      // Calculate offset from center to pivot (matches Canvas dx/dy)
      const dx = centerX - pivotX;
      const dy = centerY - pivotY;

      // Setup image element with scaled dimensions
      img.style.width = `${scaledWidth}px`;
      img.style.height = `${scaledHeight}px`;
      img.style.maxWidth = "none";
      img.style.maxHeight = "none";
      img.style.display = "block";
      img.style.position = "absolute";

      // Transform origin should be at the pivot point (as percentage of scaled image)
      const pivotPercentX = (pivotX / scaledWidth) * 100;
      const pivotPercentY = (pivotY / scaledHeight) * 100;
      img.style.transformOrigin = `${pivotPercentX}% ${pivotPercentY}%`;

      // Position: layer position is where the image CENTER should be (matches Canvas/Three.js)
      // Then offset by dx/dy to make the PIVOT align with layer position
      const basePosition =
        item.data.hasOrbitalAnimation || item.data.spinSpeed !== undefined
          ? item.data.position
          : roundStagePoint(position);
      const left = basePosition.x - centerX + dx;
      const top = basePosition.y - centerY + dy;
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

      // Apply transforms (rotation only - scale already applied to dimensions)
      const transforms: string[] = [];
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

      // Get scaled dimensions (scale from enhanced data)
      const naturalWidth = layer.img.naturalWidth;
      const naturalHeight = layer.img.naturalHeight;
      const scale = enhancedData.scale;
      const scaledWidth = naturalWidth * scale.x;
      const scaledHeight = naturalHeight * scale.y;
      
      // Calculate center and pivot in scaled space
      const centerX = scaledWidth / 2;
      const centerY = scaledHeight / 2;
      const pivot = layer.baseData.imageMapping.imageCenter;
      const pivotX = pivot.x * scale.x;
      const pivotY = pivot.y * scale.y;
      const dx = centerX - pivotX;
      const dy = centerY - pivotY;

      // Update image dimensions if scale changed
      layer.img.style.width = `${scaledWidth}px`;
      layer.img.style.height = `${scaledHeight}px`;
      
      // Update transform origin
      const pivotPercentX = (pivotX / scaledWidth) * 100;
      const pivotPercentY = (pivotY / scaledHeight) * 100;
      layer.img.style.transformOrigin = `${pivotPercentX}% ${pivotPercentY}%`;

      // Update rotation (only rotation, scale applied to dimensions)
      const transforms: string[] = [];
      const rotation = enhancedData.currentRotation ?? enhancedData.rotation ?? 0;
      if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
      if (transforms.length > 0) layer.img.style.transform = transforms.join(" ");

      // Update position: layer position is where center should be, offset by dx/dy for pivot
      // Preserve sub-pixel precision for orbital animation to prevent jitter at low speeds
      const position =
        enhancedData.hasOrbitalAnimation || enhancedData.hasSpinAnimation
          ? enhancedData.position
          : roundStagePoint(enhancedData.position);
      const left = position.x - centerX + dx;
      const top = position.y - centerY + dy;
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
  const cleanupLayers = await mountDomLayers(stage, pipeline.layers);

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

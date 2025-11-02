/**
 * ============================================================================
 * STAGE SYSTEM - Unified Stage Management for Yuzha Application
 * ============================================================================
 *
 * This module is the CORE of the stage rendering system. It combines two
 * essential functionalities:
 *
 * 1. COORDINATE SYSTEM - Managing the 2048x2048 fixed coordinate space
 * 2. DATA PIPELINE - Loading and preparing layers for rendering
 *
 * ARCHITECTURE FLOW (for future AI agents):
 * ------------------------------------------
 * ConfigYuzha.json (layer definitions)
 *   ↓
 * Config.ts (loads, transforms, validates)
 *   ↓
 * StageSystem.ts (THIS FILE - prepares coordinate system + layer pipeline)
 *   ↓
 * Renderers (StageCanvas/StageThree - render to screen)
 *   ↓
 * MainScreen.tsx (displays final result)
 *
 * HOW TO USE THIS MODULE:
 * -----------------------
 * For any new screen/module that needs stage rendering:
 *
 * import {
 *   STAGE_SIZE,              // The fixed 2048x2048 size
 *   createStageTransformer,  // Auto-scales stage to viewport
 *   createStagePipeline,     // Loads & prepares all layers
 *   toRendererInput,         // Formats pipeline for renderer
 * } from "@shared/stage/StageSystem";
 *
 * @module StageSystem
 */

import { loadLayerConfig, type LayerConfigEntry } from "../config/Config";
import { is2DLayer, prepareLayer } from "../layer/layerCore";
import {
  getProcessorsForEntry,
  type ProcessorContext,
  type EnhancedLayerData,
  type LayerProcessor,
} from "../layer/layer";

// ============================================================================
// SECTION 1: COORDINATE SYSTEM
// ============================================================================
// This section manages the fixed 2048x2048 coordinate space and provides
// utilities to transform it to any viewport size. Think of it like a virtual
// canvas that scales to fit any screen while maintaining aspect ratio.
//
// KEY CONCEPT: All layers are positioned in 2048x2048 space, then this system
// scales everything to fit the user's actual screen size (like CSS background-size: cover)
// ============================================================================

/**
 * The fixed stage size - all layers are positioned within this coordinate system.
 * This ensures consistent rendering across all devices regardless of screen size.
 */
export const STAGE_SIZE = 2048;

/**
 * Transform result for positioning and scaling a stage.
 * Contains all the math needed to scale the 2048x2048 stage to fit a viewport.
 */
export interface StageTransform {
  /** Scale factor to apply to the stage */
  scale: number;
  /** Horizontal offset in pixels for centering */
  offsetX: number;
  /** Vertical offset in pixels for centering */
  offsetY: number;
  /** Final width after scaling */
  width: number;
  /** Final height after scaling */
  height: number;
}

/**
 * Computes the transform needed to display a 2048x2048 stage in a given viewport
 * using "cover" behavior (fills viewport, may overflow).
 *
 * ALGORITHM: Uses the larger of width/height scale to ensure full coverage,
 * similar to CSS background-size: cover.
 *
 * @param viewportWidth - Width of the viewport in pixels
 * @param viewportHeight - Height of the viewport in pixels
 * @returns Transform parameters for scaling and positioning
 *
 * @example
 * const transform = computeCoverTransform(1920, 1080);
 * // { scale: 0.9375, offsetX: 0, offsetY: -480, width: 1920, height: 1920 }
 */
export function computeCoverTransform(
  viewportWidth: number,
  viewportHeight: number,
): StageTransform {
  // Cover behavior: scale to fill viewport (use larger scale to cover)
  const scaleX = viewportWidth / STAGE_SIZE;
  const scaleY = viewportHeight / STAGE_SIZE;
  const scale = Math.max(scaleX, scaleY); // Use larger scale for cover

  const width = STAGE_SIZE * scale;
  const height = STAGE_SIZE * scale;

  return {
    scale,
    offsetX: (viewportWidth - width) / 2,
    offsetY: (viewportHeight - height) / 2,
    width,
    height,
  };
}

/**
 * Options for stage transformer
 */
export interface StageTransformerOptions {
  /**
   * Debounce delay for resize events in milliseconds (0 = no debounce)
   * @default 0
   */
  resizeDebounce?: number;

  /**
   * Custom resize handler to use instead of window resize
   */
  onResize?: (callback: () => void) => () => void;
}

/**
 * Creates a stage transformer that automatically handles stage element and container sizing.
 * This is the AUTO-SCALING ENGINE - it watches window resize events and keeps the stage
 * properly scaled and centered.
 *
 * WHAT IT DOES:
 * - Sets stage element to 2048x2048px
 * - Applies CSS transform to scale and center it in viewport
 * - Listens for window resize and re-calculates transform
 * - Returns cleanup function to remove listeners
 *
 * Returns a cleanup function to remove event listeners.
 *
 * @param stageElement - The stage element to transform (canvas, div, etc)
 * @param container - The container element to transform
 * @param options - Optional configuration
 * @returns Cleanup function to remove event listeners
 *
 * @example
 * const cleanup = createStageTransformer(canvasEl, containerEl);
 * // Later when component unmounts: cleanup();
 */
export function createStageTransformer(
  stageElement: HTMLElement,
  container: HTMLElement,
  options: StageTransformerOptions = {},
): () => void {
  const { resizeDebounce = 0, onResize } = options;

  let timeoutId: number | undefined;

  const applyTransform = () => {
    const { innerWidth, innerHeight } = window;
    const { scale, offsetX, offsetY } = computeCoverTransform(innerWidth, innerHeight);

    // Set stage element size to fixed 2048x2048
    stageElement.style.width = `${STAGE_SIZE}px`;
    stageElement.style.height = `${STAGE_SIZE}px`;

    // Set container size and apply scaling transform
    container.style.width = `${STAGE_SIZE}px`;
    container.style.height = `${STAGE_SIZE}px`;
    container.style.position = "absolute";
    container.style.left = "0";
    container.style.top = "0";
    container.style.transformOrigin = "top left";
    container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  };

  const handleResize = () => {
    if (resizeDebounce > 0) {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(applyTransform, resizeDebounce);
    } else {
      applyTransform();
    }
  };

  // Initial application
  applyTransform();

  // Setup resize handling
  let cleanup: (() => void) | undefined;

  if (onResize) {
    cleanup = onResize(handleResize);
  } else {
    window.addEventListener("resize", handleResize);
    cleanup = () => {
      window.removeEventListener("resize", handleResize);
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }

  return cleanup;
}

/**
 * Applies transform to any element using the stage2048 system.
 * Useful for positioning UI elements in stage coordinates.
 *
 * @param element - Element to transform
 * @param stageX - X position in stage coordinates (0-2048)
 * @param stageY - Y position in stage coordinates (0-2048)
 *
 * @example
 * applyStagePosition(buttonEl, 1024, 1024); // Center of stage
 */
export function applyStagePosition(element: HTMLElement, stageX: number, stageY: number): void {
  element.style.position = "absolute";
  element.style.left = `${stageX}px`;
  element.style.top = `${stageY}px`;
}

/**
 * Converts viewport coordinates to stage coordinates.
 * Useful for handling mouse/touch input - converts screen pixels to stage position.
 *
 * @param viewportX - X position in viewport (screen pixels)
 * @param viewportY - Y position in viewport (screen pixels)
 * @param transform - Current stage transform (from computeCoverTransform)
 * @returns Stage coordinates (0-2048 range)
 *
 * @example
 * const stageCoords = viewportToStageCoords(100, 100, transform);
 */
export function viewportToStageCoords(
  viewportX: number,
  viewportY: number,
  transform: StageTransform,
): { x: number; y: number } {
  return {
    x: (viewportX - transform.offsetX) / transform.scale,
    y: (viewportY - transform.offsetY) / transform.scale,
  };
}

/**
 * Converts stage coordinates to viewport coordinates.
 * Inverse of viewportToStageCoords - converts stage position to screen pixels.
 *
 * @param stageX - X position in stage (0-2048)
 * @param stageY - Y position in stage (0-2048)
 * @param transform - Current stage transform
 * @returns Viewport coordinates (screen pixels)
 *
 * @example
 * const viewportCoords = stageToViewportCoords(1024, 1024, transform);
 */
export function stageToViewportCoords(
  stageX: number,
  stageY: number,
  transform: StageTransform,
): { x: number; y: number } {
  return {
    x: stageX * transform.scale + transform.offsetX,
    y: stageY * transform.scale + transform.offsetY,
  };
}

/**
 * Rounds stage coordinates to the nearest whole pixel.
 * Useful for preventing sub-pixel jitter when positioning render elements.
 *
 * NOTE: For smooth orbital animations, sub-pixel precision should be preserved,
 * so use this selectively.
 */
export function roundStagePoint<T extends { x: number; y: number }>(point: T): T {
  return {
    ...point,
    x: Math.round(point.x),
    y: Math.round(point.y),
  };
}

// ============================================================================
// SECTION 2: DATA PIPELINE
// ============================================================================
// This section handles loading layer configurations and preparing them for
// rendering. It's the "data processing" part of the stage system.
//
// PIPELINE FLOW:
// 1. loadLayerConfig() - loads from ConfigYuzha.json via Config.ts
// 2. is2DLayer() - filters for 2D renderable layers
// 3. prepareLayer() - processes each layer (positions, scales, etc.)
// 4. getProcessorsForEntry() - attaches behaviors (spin, orbit, etc.)
// 5. Returns StagePipeline - complete package ready for rendering
//
// FOR FUTURE AI AGENTS:
// - To add new layer types, modify Config.ts and LayerCore.ts
// - To add new behaviors, modify ProcessorRegistry.ts
// - This file just orchestrates - actual logic is in those modules
// ============================================================================

/**
 * Options for creating a stage pipeline
 */
export type StagePipelineOptions = {
  /** Override the default stage size (defaults to STAGE_SIZE = 2048) */
  stageSize?: number;
  /** Context for processor attachment (advanced usage) */
  processorContext?: ProcessorContext;
};

/**
 * A prepared layer ready for rendering.
 * Contains the original config entry, processed layer data, and attached processors.
 */
export type PreparedLayer = {
  /** Original configuration entry from ConfigYuzha.json */
  entry: LayerConfigEntry;
  /** Processed layer data with positions, scales, rotations calculated */
  data: EnhancedLayerData;
  /** Behavior processors (spin, orbit, debug visualizations, etc.) */
  processors: LayerProcessor[];
};

/**
 * Optional stage marker primitive for overlay-style drawing within the renderer.
 */
export type StageMarker = {
  /** Unique identifier for the marker */
  id: string;
  /** X coordinate in stage space (0-2048) */
  x: number;
  /** Y coordinate in stage space (0-2048) */
  y: number;
  /** Display color (CSS color string) */
  color?: string;
  /** Radius in stage pixels */
  radius?: number;
  /** Optional shape hint (default: point) */
  kind?: "point" | "circle";
  /** Stroke width (used for circle) */
  lineWidth?: number;
};

/**
 * Complete stage pipeline - all layers prepared and ready for rendering.
 * This is what gets passed to renderers (DOM, Canvas, Three.js).
 */
export type StagePipeline = {
  /** The stage size used for this pipeline (usually 2048) */
  stageSize: number;
  /** All prepared layers in render order */
  layers: PreparedLayer[];
  /** Optional stage markers rendered alongside layers */
  markers?: StageMarker[];
};

/**
 * Converts pipeline format to renderer input format.
 * Strips out the original config entry, leaving only data + processors.
 *
 * WHY: Renderers don't need the original config, just the processed data.
 *
 * @param pipeline - Complete stage pipeline
 * @returns Array of layer data + processors for renderer consumption
 */
export function toRendererInput(
  pipeline: StagePipeline,
): Array<{ data: EnhancedLayerData; processors: LayerProcessor[] }> {
  return pipeline.layers.map(({ data, processors }) => ({
    data,
    processors,
  }));
}

/**
 * Creates a complete stage pipeline from configuration.
 *
 * THIS IS THE MAIN ENTRY POINT for setting up stage rendering.
 *
 * WHAT IT DOES:
 * 1. Loads layer configuration from ConfigYuzha.json (via Config.ts)
 * 2. Filters for 2D layers (3D not yet implemented)
 * 3. Prepares each layer (calculates positions, loads images, etc.)
 * 4. Attaches processors for animations/behaviors (spin, orbit, etc.)
 * 5. Returns complete pipeline ready for rendering
 *
 * USAGE IN RENDERERS:
 * const pipeline = await createStagePipeline();
 * const rendererData = toRendererInput(pipeline);
 * // Then pass rendererData to your rendering engine
 *
 * @param options - Optional configuration for pipeline creation
 * @returns Promise<StagePipeline> - Complete prepared pipeline
 *
 * @example
 * // In a renderer component:
 * const pipeline = await createStagePipeline();
 * const layers = toRendererInput(pipeline);
 * // Now render the layers...
 */
export async function createStagePipeline(
  options: StagePipelineOptions = {},
): Promise<StagePipeline> {
  const stageSize = options.stageSize ?? STAGE_SIZE;
  const processorContext = options.processorContext;

  // Load configuration from ConfigYuzha.json (via Config.ts)
  const config = loadLayerConfig();
  const twoDLayers = config.filter(is2DLayer);

  // Prepare all layers in parallel
  const prepared = (
    await Promise.all(
      twoDLayers.map(async (entry) => {
        try {
          const layer = await prepareLayer(entry, stageSize);
          if (!layer) {
            console.warn(
              `[StageSystem] Skipping layer "${entry.LayerID}" - prepareLayer returned null`,
            );
            return null;
          }

          // Attach processors (spin, orbit, debug, etc.)
          const processors = getProcessorsForEntry(entry, processorContext);
          return {
            entry,
            data: layer as EnhancedLayerData,
            processors,
          } satisfies PreparedLayer;
        } catch (error) {
          console.error(
            `[StageSystem] Failed to prepare layer "${entry.LayerID}" (renderer=${entry.renderer})`,
            error,
          );
          return null;
        }
      }),
    )
  ).filter((layer): layer is PreparedLayer => layer !== null);

  return {
    stageSize,
    layers: prepared,
  };
}

// ============================================================================
// SECTION 3: RE-EXPORTS FOR CONVENIENCE
// ============================================================================
// Re-export types and functions that are commonly used together with this module
// ============================================================================

export type { ProcessorContext, EnhancedLayerData, LayerProcessor } from "../layer/layer";
export type { LayerConfigEntry } from "../config/Config";

/**
 * Stage2048 - Consistent 2048x2048 stage rendering across all devices
 * 
 * This module provides utilities for managing a fixed 2048x2048 coordinate system
 * that scales and centers properly on any viewport size, similar to CSS background-size: cover.
 * 
 * @module stage2048
 */

export const STAGE_SIZE = 2048;

/**
 * Transform result for positioning and scaling a stage
 */
export interface StageTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

/**
 * Computes the transform needed to display a 2048x2048 stage in a given viewport
 * using "cover" behavior (fills viewport, may overflow).
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
  viewportHeight: number
): StageTransform {
  const scale = Math.max(viewportWidth / STAGE_SIZE, viewportHeight / STAGE_SIZE);
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
 * Creates a stage transformer that automatically handles canvas and container sizing.
 * Returns a cleanup function to remove event listeners.
 * 
 * @param canvas - The canvas element to transform
 * @param container - The container element to transform
 * @param options - Optional configuration
 * @returns Cleanup function to remove event listeners
 * 
 * @example
 * const cleanup = createStageTransformer(canvasEl, containerEl);
 * // Later: cleanup();
 */
export function createStageTransformer(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  options: StageTransformerOptions = {}
): () => void {
  const { resizeDebounce = 0, onResize } = options;
  
  let timeoutId: number | undefined;
  
  const applyTransform = () => {
    const { innerWidth, innerHeight } = window;
    const { scale, offsetX, offsetY } = computeCoverTransform(innerWidth, innerHeight);
    
    // Set canvas size
    canvas.style.width = `${STAGE_SIZE}px`;
    canvas.style.height = `${STAGE_SIZE}px`;
    
    // Set container size and transform
    container.style.width = `${STAGE_SIZE}px`;
    container.style.height = `${STAGE_SIZE}px`;
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
export function applyStagePosition(
  element: HTMLElement,
  stageX: number,
  stageY: number
): void {
  element.style.position = "absolute";
  element.style.left = `${stageX}px`;
  element.style.top = `${stageY}px`;
}

/**
 * Converts viewport coordinates to stage coordinates
 * 
 * @param viewportX - X position in viewport
 * @param viewportY - Y position in viewport
 * @param transform - Current stage transform
 * @returns Stage coordinates
 * 
 * @example
 * const stageCoords = viewportToStageCoords(100, 100, transform);
 */
export function viewportToStageCoords(
  viewportX: number,
  viewportY: number,
  transform: StageTransform
): { x: number; y: number } {
  return {
    x: (viewportX - transform.offsetX) / transform.scale,
    y: (viewportY - transform.offsetY) / transform.scale,
  };
}

/**
 * Converts stage coordinates to viewport coordinates
 * 
 * @param stageX - X position in stage (0-2048)
 * @param stageY - Y position in stage (0-2048)
 * @param transform - Current stage transform
 * @returns Viewport coordinates
 * 
 * @example
 * const viewportCoords = stageToViewportCoords(1024, 1024, transform);
 */
export function stageToViewportCoords(
  stageX: number,
  stageY: number,
  transform: StageTransform
): { x: number; y: number } {
  return {
    x: stageX * transform.scale + transform.offsetX,
    y: stageY * transform.scale + transform.offsetY,
  };
}

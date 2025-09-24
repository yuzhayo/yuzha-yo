import type {
  PointerEvent as ReactPointerEvent,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from "react";

import { STAGE_WIDTH, STAGE_HEIGHT, STAGE_CLASSES } from "./StageConstants";
import type { StageTransform, StageCoordinates } from "./StageTypes";

/**
 * Stage Transform Utilities
 * Handles 2048×2048 stage scaling and coordinate transformation
 * Upgraded from 1024x1024 to 2048x2048 for high-DPI compatibility
 */

/**
 * Calculate stage transform for cover behavior
 * Fills viewport while maintaining aspect ratio
 */
export function calculateStageTransform(
  viewportWidth: number,
  viewportHeight: number,
): StageTransform {
  // Cover behavior: scale to fill viewport, crop what doesn't fit
  const scaleX = viewportWidth / STAGE_WIDTH;
  const scaleY = viewportHeight / STAGE_HEIGHT;
  const scale = Math.max(scaleX, scaleY); // Use larger scale for cover

  const scaledWidth = STAGE_WIDTH * scale;
  const scaledHeight = STAGE_HEIGHT * scale;

  // Center the scaled stage
  const offsetX = (viewportWidth - scaledWidth) / 2;
  const offsetY = (viewportHeight - scaledHeight) / 2;

  return {
    scale,
    offsetX,
    offsetY,
    containerWidth: scaledWidth,
    containerHeight: scaledHeight,
  };
}

/**
 * Transform viewport coordinates to stage coordinates
 * Essential for making gestures work with scaled canvas
 */
export function transformCoordinatesToStage(
  clientX: number,
  clientY: number,
  transform: StageTransform,
): StageCoordinates {
  // Convert from viewport coordinates to stage coordinates
  const stageX = (clientX - transform.offsetX) / transform.scale;
  const stageY = (clientY - transform.offsetY) / transform.scale;

  return { stageX, stageY };
}

/**
 * Check if coordinates are within the stage bounds
 */
export function isWithinStage(stageX: number, stageY: number): boolean {
  return stageX >= 0 && stageX <= STAGE_WIDTH && stageY >= 0 && stageY <= STAGE_HEIGHT;
}

/**
 * Convert percentage coordinates to stage pixels
 * Useful for responsive positioning within the 2048x2048 space
 */
export function percentageToStagePixels(xPct: number, yPct: number): StageCoordinates {
  return {
    stageX: (xPct / 100) * STAGE_WIDTH,
    stageY: (yPct / 100) * STAGE_HEIGHT,
  };
}

/**
 * Stage transform manager class
 * Handles DOM manipulation and coordinate transformation
 */
export class StageTransformManager {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private overlay: HTMLElement | null = null;
  private transform: StageTransform | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private debugElement: HTMLElement | null = null;

  constructor(private debug = false) {
    // Initialize resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.updateTransform();
    });
  }

  /**
   * Initialize the stage transform system
   */
  initialize(container: HTMLElement, canvas: HTMLCanvasElement, overlay?: HTMLElement) {
    this.container = container;
    this.canvas = canvas;
    this.overlay = overlay || null;

    // Apply CSS classes
    container.classList.add(STAGE_CLASSES.CONTAINER);
    canvas.classList.add(STAGE_CLASSES.CANVAS);
    if (overlay) {
      overlay.classList.add(STAGE_CLASSES.OVERLAY);
    }

    // Start observing resize events
    this.resizeObserver?.observe(document.body);

    // Setup debug if enabled
    if (this.debug) {
      this.setupDebug();
    }

    // Initial transform
    this.updateTransform();

    return this;
  }

  /**
   * Update transform based on current viewport size
   */
  updateTransform() {
    if (!this.container || !this.canvas) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    this.transform = calculateStageTransform(viewportWidth, viewportHeight);

    // Apply CSS transforms
    this.canvas.style.transform = `scale(${this.transform.scale})`;
    this.container.style.width = `${this.transform.containerWidth}px`;
    this.container.style.height = `${this.transform.containerHeight}px`;

    // Update debug info
    if (this.debug && this.debugElement) {
      this.updateDebugInfo();
    }
  }

  /**
   * Transform event coordinates to stage coordinates
   */
  transformEventCoordinates(
    event: PointerEvent | MouseEvent | TouchEvent,
  ): StageCoordinates | null {
    if (!this.transform) return null;

    let clientX: number, clientY: number;

    if ("touches" in event && event.touches.length > 0) {
      // Touch event
      const firstTouch = event.touches.item(0);
      if (!firstTouch) return null;
      clientX = firstTouch.clientX;
      clientY = firstTouch.clientY;
    } else if ("clientX" in event) {
      // Mouse or pointer event
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return null;
    }

    return transformCoordinatesToStage(clientX, clientY, this.transform);
  }

  /**
   * Get current transform data
   */
  getTransform(): StageTransform | null {
    return this.transform;
  }

  /**
   * Setup debug overlay
   */
  private setupDebug() {
    this.debugElement = document.createElement("div");
    this.debugElement.classList.add(STAGE_CLASSES.DEBUG);
    document.body.appendChild(this.debugElement);
    this.updateDebugInfo();
  }

  /**
   * Update debug information
   */
  private updateDebugInfo() {
    if (!this.debugElement || !this.transform) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const aspectRatio = (vw / vh).toFixed(2);

    this.debugElement.innerHTML = `
      Stage: ${STAGE_WIDTH}×${STAGE_HEIGHT}<br>
      Viewport: ${vw}×${vh} (${aspectRatio}:1)<br>
      Scale: ${this.transform.scale.toFixed(3)}<br>
      Container: ${Math.round(this.transform.containerWidth)}×${Math.round(this.transform.containerHeight)}<br>
      Offset: ${Math.round(this.transform.offsetX)}, ${Math.round(this.transform.offsetY)}
    `.trim();
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.resizeObserver?.disconnect();
    if (this.debugElement) {
      document.body.removeChild(this.debugElement);
    }
    this.container = null;
    this.canvas = null;
    this.overlay = null;
    this.transform = null;
    this.debugElement = null;
  }
}

/**
 * Create a coordinate transformer hook for React components
 */
export function createCoordinateTransformer(manager: StageTransformManager) {
  return {
    /**
     * Transform pointer event coordinates to stage coordinates
     */
    transformPointerEvent: (event: ReactPointerEvent<HTMLElement>): StageCoordinates | null => {
      return manager.transformEventCoordinates(event.nativeEvent);
    },

    /**
     * Transform mouse event coordinates to stage coordinates
     */
    transformMouseEvent: (event: ReactMouseEvent<HTMLElement>): StageCoordinates | null => {
      return manager.transformEventCoordinates(event.nativeEvent);
    },

    /**
     * Transform touch event coordinates to stage coordinates
     */
    transformTouchEvent: (event: ReactTouchEvent<HTMLElement>): StageCoordinates | null => {
      return manager.transformEventCoordinates(event.nativeEvent);
    },
  };
}

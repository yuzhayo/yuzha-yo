/**
 * Transform utilities for 2048×2048 stage scaling and coordinate transformation
 * Adapted from yuzha reference implementation
 */

export interface StageTransform {
  scale: number
  offsetX: number
  offsetY: number
  containerWidth: number
  containerHeight: number
}

export interface StageCoordinates {
  stageX: number
  stageY: number
}

// Fixed stage dimensions - never change these
export const STAGE_WIDTH = 2048
export const STAGE_HEIGHT = 2048

/**
 * Calculate stage transform for cover behavior
 * Fills viewport while maintaining aspect ratio
 */
export function calculateStageTransform(viewportWidth: number, viewportHeight: number): StageTransform {
  // Cover behavior: scale to fill viewport, crop what doesn't fit
  const scaleX = viewportWidth / STAGE_WIDTH
  const scaleY = viewportHeight / STAGE_HEIGHT
  const scale = Math.max(scaleX, scaleY) // Use larger scale for cover
  
  const scaledWidth = STAGE_WIDTH * scale
  const scaledHeight = STAGE_HEIGHT * scale
  
  // Center the scaled stage
  const offsetX = (viewportWidth - scaledWidth) / 2
  const offsetY = (viewportHeight - scaledHeight) / 2
  
  return {
    scale,
    offsetX,
    offsetY,
    containerWidth: scaledWidth,
    containerHeight: scaledHeight
  }
}

/**
 * Transform viewport coordinates to stage coordinates
 * Essential for making gestures work with scaled canvas
 */
export function transformCoordinatesToStage(
  clientX: number,
  clientY: number,
  transform: StageTransform
): StageCoordinates {
  // Convert from viewport coordinates to stage coordinates
  const stageX = (clientX - transform.offsetX) / transform.scale
  const stageY = (clientY - transform.offsetY) / transform.scale
  
  return { stageX, stageY }
}

/**
 * Check if coordinates are within the stage bounds
 */
export function isWithinStage(stageX: number, stageY: number): boolean {
  return stageX >= 0 && stageX <= STAGE_WIDTH && stageY >= 0 && stageY <= STAGE_HEIGHT
}

/**
 * Stage transform manager class
 * Handles DOM manipulation and coordinate transformation
 */
export class StageTransformManager {
  private container: HTMLElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private overlay: HTMLElement | null = null
  private transform: StageTransform | null = null
  private resizeObserver: ResizeObserver | null = null
  
  constructor() {
    // Initialize resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.updateTransform()
    })
  }

  /**
   * Initialize the stage transform system
   */
  initialize(container: HTMLElement, canvas: HTMLCanvasElement, overlay?: HTMLElement) {
    this.container = container
    this.canvas = canvas
    this.overlay = overlay || null
    
    // Start observing resize events
    this.resizeObserver?.observe(container)
    
    // Initial transform
    this.updateTransform()
    
    return this
  }

  /**
   * Update transform based on current viewport size
   */
  updateTransform() {
    if (!this.container || !this.canvas) return
    
    const rect = this.container.getBoundingClientRect()
    const viewportWidth = rect.width
    const viewportHeight = rect.height
    
    this.transform = calculateStageTransform(viewportWidth, viewportHeight)
    
    // Apply CSS transforms
    this.canvas.style.transform = `translate(-50%, -50%) scale(${this.transform.scale})`
  }

  /**
   * Transform event coordinates to stage coordinates
   */
  transformEventCoordinates(event: PointerEvent | MouseEvent | TouchEvent): StageCoordinates | null {
    if (!this.transform || !this.container) return null
    
    const rect = this.container.getBoundingClientRect()
    let clientX: number, clientY: number
    
    if ('touches' in event && event.touches.length > 0) {
      // Touch event
      const firstTouch = event.touches[0]
      if (!firstTouch) return null
      clientX = firstTouch.clientX - rect.left
      clientY = firstTouch.clientY - rect.top
    } else if ('clientX' in event) {
      // Mouse or pointer event
      clientX = event.clientX - rect.left
      clientY = event.clientY - rect.top
    } else {
      return null
    }
    
    return transformCoordinatesToStage(clientX, clientY, this.transform)
  }

  /**
   * Get current transform data
   */
  getTransform(): StageTransform | null {
    return this.transform
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.resizeObserver?.disconnect()
    this.container = null
    this.canvas = null
    this.overlay = null
    this.transform = null
  }
}
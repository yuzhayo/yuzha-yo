/**
 * Fixed Canvas System
 * 
 * Provides a 2048×2048 fixed-dimension canvas that scales responsively
 * to any viewport while maintaining design integrity.
 * 
 * This is a renderer-agnostic canvas system that can be used with:
 * - WebGL contexts
 * - Canvas 2D contexts
 * - Any other rendering system
 */

export interface CanvasTransform {
  /** Scale factor applied to the canvas */
  scale: number
  /** Horizontal offset for centering */
  offsetX: number
  /** Vertical offset for centering */
  offsetY: number
  /** Actual container width after scaling */
  containerWidth: number
  /** Actual container height after scaling */
  containerHeight: number
}

export interface CanvasCoordinates {
  /** X coordinate in canvas space (0-2048) */
  canvasX: number
  /** Y coordinate in canvas space (0-2048) */
  canvasY: number
}

export interface FixedCanvasOptions {
  /** Enable debug overlay showing transform info */
  debug?: boolean
  /** Background color (CSS format) */
  backgroundColor?: string
  /** Canvas container class name */
  containerClassName?: string
  /** Canvas element class name */
  canvasClassName?: string
}

// Design canvas dimensions (fixed)
export const CANVAS_WIDTH = 2048
export const CANVAS_HEIGHT = 2048

/**
 * Calculate canvas transform for cover behavior
 * Scales 2048×2048 canvas to fill viewport while maintaining aspect ratio
 */
export function calculateCanvasTransform(viewportWidth: number, viewportHeight: number): CanvasTransform {
  // Cover behavior: scale to fill viewport, crop what doesn't fit
  const scaleX = viewportWidth / CANVAS_WIDTH
  const scaleY = viewportHeight / CANVAS_HEIGHT
  const scale = Math.max(scaleX, scaleY) // Use larger scale for cover
  
  const scaledWidth = CANVAS_WIDTH * scale
  const scaledHeight = CANVAS_HEIGHT * scale
  
  // Center the scaled canvas
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
 * Transform viewport coordinates to canvas coordinates
 * Essential for making interactions work with scaled canvas
 */
export function transformCoordinatesToCanvas(
  clientX: number,
  clientY: number,
  transform: CanvasTransform
): CanvasCoordinates {
  // Convert from viewport coordinates to canvas coordinates
  const canvasX = (clientX - transform.offsetX) / transform.scale
  const canvasY = (clientY - transform.offsetY) / transform.scale
  
  return { canvasX, canvasY }
}

/**
 * Check if coordinates are within the canvas bounds
 */
export function isWithinCanvas(canvasX: number, canvasY: number): boolean {
  return canvasX >= 0 && canvasX <= CANVAS_WIDTH && canvasY >= 0 && canvasY <= CANVAS_HEIGHT
}

/**
 * Fixed Canvas Manager
 * 
 * Creates and manages a 2048×2048 canvas with responsive scaling.
 * Renderer-agnostic - provides the canvas element and transform utilities
 * for any rendering system to use.
 */
export class FixedCanvasManager {
  private container: HTMLElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private overlay: HTMLElement | null = null
  private transform: CanvasTransform | null = null
  private resizeObserver: ResizeObserver | null = null
  private debugElement: HTMLElement | null = null
  
  constructor(private options: FixedCanvasOptions = {}) {
    // Initialize resize observer
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === document.body || entry.target === document.documentElement) {
          this.updateTransform()
        }
      }
    })
  }

  /**
   * Initialize the fixed canvas system
   * Returns the canvas element ready for any renderer to use
   */
  initialize(rootElement: HTMLElement): {
    canvas: HTMLCanvasElement
    container: HTMLElement
    overlay: HTMLElement
    getTransform: () => CanvasTransform | null
  } {
    // Create DOM structure
    this.container = document.createElement('div')
    this.canvas = document.createElement('canvas')
    this.overlay = document.createElement('div')
    
    // Set fixed canvas dimensions
    this.canvas.width = CANVAS_WIDTH
    this.canvas.height = CANVAS_HEIGHT
    
    // Apply CSS classes
    this.container.className = this.options.containerClassName || 'fixed-canvas-container'
    this.canvas.className = this.options.canvasClassName || 'fixed-canvas-element'
    this.overlay.className = 'fixed-canvas-overlay'
    
    // Apply default styles
    this.applyDefaultStyles()
    
    // Setup DOM structure
    rootElement.classList.add('fixed-canvas-root')
    rootElement.appendChild(this.container)
    this.container.appendChild(this.canvas)
    this.container.appendChild(this.overlay)
    
    // Start observing resize events
    this.resizeObserver?.observe(document.body)
    
    // Setup debug if enabled
    if (this.options.debug) {
      this.setupDebug()
    }
    
    // Initial transform
    this.updateTransform()
    
    return {
      canvas: this.canvas,
      container: this.container,
      overlay: this.overlay,
      getTransform: () => this.transform
    }
  }

  /**
   * Apply default styles to ensure proper 2048×2048 behavior
   */
  private applyDefaultStyles() {
    if (!this.container || !this.canvas || !this.overlay) return

    // Root styles
    const rootStyles = `
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    `

    // Container styles
    const containerStyles = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transform-origin: center center;
      overflow: hidden;
      width: ${CANVAS_WIDTH}px;
      height: ${CANVAS_HEIGHT}px;
    `

    // Canvas styles
    const canvasStyles = `
      display: block;
      transform-origin: 0 0;
      width: ${CANVAS_WIDTH}px !important;
      height: ${CANVAS_HEIGHT}px !important;
      max-width: none !important;
      max-height: none !important;
      min-width: ${CANVAS_WIDTH}px !important;
      min-height: ${CANVAS_HEIGHT}px !important;
      will-change: transform;
      pointer-events: none;
      background-color: ${this.options.backgroundColor || 'transparent'};
    `

    // Overlay styles
    const overlayStyles = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: auto;
      z-index: 1;
      background: transparent;
    `

    // Apply styles
    if (this.container.parentElement) {
      this.container.parentElement.style.cssText += rootStyles
    }
    this.container.style.cssText += containerStyles
    this.canvas.style.cssText += canvasStyles
    this.overlay.style.cssText += overlayStyles
  }

  /**
   * Update transform based on current viewport size
   */
  updateTransform() {
    if (!this.container || !this.canvas) return
    
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    this.transform = calculateCanvasTransform(viewportWidth, viewportHeight)
    
    // Apply CSS transforms
    this.canvas.style.transform = `scale(${this.transform.scale})`
    this.container.style.width = `${this.transform.containerWidth}px`
    this.container.style.height = `${this.transform.containerHeight}px`
    
    // Update debug info
    if (this.options.debug && this.debugElement) {
      this.updateDebugInfo()
    }
  }

  /**
   * Transform event coordinates to canvas coordinates
   */
  transformEventCoordinates(event: PointerEvent | MouseEvent | TouchEvent): CanvasCoordinates | null {
    if (!this.transform) return null
    
    let clientX: number, clientY: number
    
    if ('touches' in event && event.touches.length > 0) {
      // Touch event
      const firstTouch = event.touches.item(0)
      if (!firstTouch) return null
      clientX = firstTouch.clientX
      clientY = firstTouch.clientY
    } else if ('clientX' in event) {
      // Mouse or pointer event
      clientX = event.clientX
      clientY = event.clientY
    } else {
      return null
    }
    
    return transformCoordinatesToCanvas(clientX, clientY, this.transform)
  }

  /**
   * Get the overlay element for interaction handling
   */
  getOverlay(): HTMLElement | null {
    return this.overlay
  }

  /**
   * Get the canvas element for rendering
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas
  }

  /**
   * Get the container element
   */
  getContainer(): HTMLElement | null {
    return this.container
  }

  /**
   * Get current transform data
   */
  getTransform(): CanvasTransform | null {
    return this.transform
  }

  /**
   * Setup debug overlay
   */
  private setupDebug() {
    this.debugElement = document.createElement('div')
    this.debugElement.className = 'fixed-canvas-debug'
    this.debugElement.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      font-size: 12px;
      border-radius: 4px;
      z-index: 9999;
      pointer-events: none;
    `
    document.body.appendChild(this.debugElement)
    this.updateDebugInfo()
  }

  /**
   * Update debug information
   */
  private updateDebugInfo() {
    if (!this.debugElement || !this.transform) return
    
    const vw = window.innerWidth
    const vh = window.innerHeight
    const aspectRatio = (vw / vh).toFixed(2)
    
    this.debugElement.innerHTML = `
      Canvas: ${CANVAS_WIDTH}×${CANVAS_HEIGHT}<br>
      Viewport: ${vw}×${vh} (${aspectRatio}:1)<br>
      Scale: ${this.transform.scale.toFixed(3)}<br>
      Container: ${Math.round(this.transform.containerWidth)}×${Math.round(this.transform.containerHeight)}<br>
      Offset: ${Math.round(this.transform.offsetX)}, ${Math.round(this.transform.offsetY)}
    `.trim()
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.resizeObserver?.disconnect()
    if (this.debugElement) {
      document.body.removeChild(this.debugElement)
    }
    
    // Clean up container
    if (this.container?.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }
    
    this.container = null
    this.canvas = null
    this.overlay = null
    this.transform = null
    this.debugElement = null
  }
}

/**
 * Create a coordinate transformer utility
 */
export function createCoordinateTransformer(manager: FixedCanvasManager) {
  return {
    /**
     * Transform pointer event coordinates to canvas coordinates
     */
    transformPointerEvent: (event: PointerEvent): CanvasCoordinates | null => {
      return manager.transformEventCoordinates(event)
    },
    
    /**
     * Transform mouse event coordinates to canvas coordinates
     */
    transformMouseEvent: (event: MouseEvent): CanvasCoordinates | null => {
      return manager.transformEventCoordinates(event)
    },
    
    /**
     * Transform touch event coordinates to canvas coordinates
     */
    transformTouchEvent: (event: TouchEvent): CanvasCoordinates | null => {
      return manager.transformEventCoordinates(event)
    },
    
    /**
     * Get current transform data
     */
    getTransform: () => manager.getTransform(),
    
    /**
     * Check if canvas coordinates are within bounds
     */
    isWithinCanvas: (canvasX: number, canvasY: number) => {
      return isWithinCanvas(canvasX, canvasY)
    }
  }
}
/**
 * DOM Renderer Adapter
 * 
 * Manages DOM elements in the 1024×1024 coordinate space.
 */

import { BaseAdapter } from './BaseAdapter'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../FixedCanvas'
import type { RendererContext } from '../CanvasAdapterManager'

export interface DOMAdapterOptions {
  /** Container class name for styling */
  containerClassName?: string
  /** Enable CSS transforms acceleration */
  enableAcceleration?: boolean
}

export interface DOMElementPosition {
  /** X position as percentage (0-100) */
  xPct: number
  /** Y position as percentage (0-100) */
  yPct: number
  /** Scale factor (1 = 100%) */
  scale?: number
  /** Rotation in degrees */
  rotation?: number
  /** Z-index for layering */
  zIndex?: number
}

export interface DOMRenderer {
  /** Add element to the renderer */
  addElement(id: string, element: HTMLElement, position: DOMElementPosition): void
  /** Update element position */
  updateElement(id: string, position: DOMElementPosition): void
  /** Remove element */
  removeElement(id: string): void
  /** Get element by id */
  getElement(id: string): HTMLElement | undefined
  /** Convert percentage to pixel coordinates */
  convertToPixelCoordinates(xPct: number, yPct: number): { x: number; y: number }
  /** Refresh all elements */
  refreshAllElements(): void
}

export class DOMAdapter extends BaseAdapter<DOMRenderer> implements DOMRenderer {
  readonly name = 'dom'
  private elements = new Map<string, HTMLElement>()
  private container: HTMLElement | null = null

  constructor(options: DOMAdapterOptions = {}) {
    super(options)
  }

  /**
   * DOM rendering is always available
   */
  canRun(): boolean {
    return typeof document !== 'undefined'
  }

  /**
   * Initialize DOM renderer
   */
  initialize(context: RendererContext): DOMRenderer {
    this.validateContext(context)
    
    this.container = context.container
    
    // Apply container styling if specified
    if (this.options.containerClassName) {
      this.container.classList.add(this.options.containerClassName)
    }

    // Enable GPU acceleration if requested
    if (this.options.enableAcceleration !== false) {
      this.container.style.transform = this.container.style.transform || ''
      this.container.style.willChange = 'transform'
    }

    // Return renderer interface
    this.renderer = this
    this.setInitialized()
    return this.renderer
  }

  /**
   * Add element to DOM renderer
   */
  addElement(id: string, element: HTMLElement, position: DOMElementPosition): void {
    if (!this.container) {
      throw new Error('DOM adapter not initialized')
    }

    // Apply default styles for canvas positioning
    element.style.position = 'absolute'
    element.style.left = '0px'
    element.style.top = '0px'
    element.style.transformOrigin = 'center center'
    element.style.pointerEvents = 'none'
    element.style.willChange = 'transform'
    
    // Apply transform based on position
    this.updateElementTransform(element, position)
    
    // Add to container
    this.container.appendChild(element)
    this.elements.set(id, element)
  }

  /**
   * Update element position
   */
  updateElement(id: string, position: DOMElementPosition): void {
    const element = this.elements.get(id)
    if (!element) {
      throw new Error(`Element with id '${id}' not found`)
    }

    this.updateElementTransform(element, position)
  }

  /**
   * Remove element
   */
  removeElement(id: string): void {
    const element = this.elements.get(id)
    if (element && element.parentElement) {
      element.parentElement.removeChild(element)
    }
    this.elements.delete(id)
  }

  /**
   * Get element by id
   */
  getElement(id: string): HTMLElement | undefined {
    return this.elements.get(id)
  }

  /**
   * Convert percentage coordinates to pixel coordinates
   */
  convertToPixelCoordinates(xPct: number, yPct: number): { x: number; y: number } {
    return {
      x: (xPct / 100) * CANVAS_WIDTH,
      y: (yPct / 100) * CANVAS_HEIGHT
    }
  }

  /**
   * Refresh all elements
   */
  refreshAllElements(): void {
    // Elements automatically adjust due to the percentage-based coordinate system
    // This method is here for future extensions
  }

  /**
   * Update element transform
   */
  private updateElementTransform(element: HTMLElement, position: DOMElementPosition): void {
    const { x, y } = this.convertToPixelCoordinates(position.xPct, position.yPct)
    const scale = position.scale ?? 1
    const rotation = position.rotation ?? 0
    
    // Apply transform
    element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`
    
    // Apply z-index if specified
    if (position.zIndex !== undefined) {
      element.style.zIndex = String(position.zIndex)
    }
  }

  /**
   * Dispose DOM renderer
   */
  dispose(): void {
    // Remove all elements
    this.elements.forEach((element, id) => {
      this.removeElement(id)
    })
    this.elements.clear()
    this.container = null
    this.renderer = null
    this.isInitialized = false
  }
}
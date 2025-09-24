/**
 * Canvas 2D Renderer Adapter
 * 
 * Provides Canvas 2D rendering context for the fixed canvas system.
 */

import { BaseAdapter } from './BaseAdapter'
import type { RendererContext } from '../CanvasAdapterManager'

export interface Canvas2DAdapterOptions {
  /** Enable image smoothing */
  imageSmoothingEnabled?: boolean
  /** Image smoothing quality */
  imageSmoothingQuality?: 'low' | 'medium' | 'high'
  /** Global alpha value */
  globalAlpha?: number
  /** Global composite operation */
  globalCompositeOperation?: string
}

export class Canvas2DAdapter extends BaseAdapter<CanvasRenderingContext2D> {
  readonly name = 'canvas2d'

  constructor(options: Canvas2DAdapterOptions = {}) {
    super(options)
  }

  /**
   * Check if Canvas 2D is available
   */
  canRun(): boolean {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      return ctx !== null
    } catch {
      return false
    }
  }

  /**
   * Initialize Canvas 2D context
   */
  initialize(context: RendererContext): CanvasRenderingContext2D {
    this.validateContext(context)

    const ctx = context.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context')
    }

    // Apply options
    if (this.options.imageSmoothingEnabled !== undefined) {
      ctx.imageSmoothingEnabled = this.options.imageSmoothingEnabled
    }
    if (this.options.imageSmoothingQuality !== undefined) {
      ctx.imageSmoothingQuality = this.options.imageSmoothingQuality
    }
    if (this.options.globalAlpha !== undefined) {
      ctx.globalAlpha = this.options.globalAlpha
    }
    if (this.options.globalCompositeOperation !== undefined) {
      ctx.globalCompositeOperation = this.options.globalCompositeOperation
    }

    this.renderer = ctx
    this.setInitialized()
    return this.renderer
  }

  /**
   * Update Canvas 2D context
   */
  update(context: RendererContext): void {
    // Canvas 2D context doesn't need updates for resize
    // The fixed canvas system handles scaling automatically
  }

  /**
   * Dispose Canvas 2D context
   */
  dispose(): void {
    if (this.renderer) {
      // Clear the canvas
      this.renderer.clearRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height)
      this.renderer = null
    }
    this.isInitialized = false
  }
}
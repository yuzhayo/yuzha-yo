/**
 * Pixi.js Renderer Adapter
 * 
 * Integrates Pixi.js with the Canvas Adapter Manager system.
 */

import { Application } from 'pixi.js'
import { BaseAdapter } from './BaseAdapter'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../FixedCanvas'
import type { RendererContext } from '../CanvasAdapterManager'

export interface PixiAdapterOptions {
  /** Device pixel ratio cap */
  dprCap?: number
  /** Background alpha (0-1) */
  backgroundAlpha?: number
  /** Enable antialiasing */
  antialias?: boolean
  /** Background color */
  backgroundColor?: number
}

export class PixiAdapter extends BaseAdapter<Application> {
  readonly name = 'pixi'

  constructor(options: PixiAdapterOptions = {}) {
    super(options)
  }

  /**
   * Check if Pixi.js can run
   */
  canRun(): boolean {
    // Check if Pixi is available
    try {
      return typeof Application !== 'undefined'
    } catch {
      return false
    }
  }

  /**
   * Initialize Pixi.js application
   */
  async initialize(context: RendererContext): Promise<Application> {
    this.validateContext(context)

    const dpr = Math.min(this.options.dprCap ?? 2, window.devicePixelRatio || 1)
    
    // Create Pixi application with the managed canvas
    this.renderer = new Application({
      view: context.canvas,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundAlpha: this.options.backgroundAlpha ?? 0,
      backgroundColor: this.options.backgroundColor ?? 0x000000,
      antialias: this.options.antialias ?? true,
      autoDensity: true,
      resolution: dpr
    })

    this.setInitialized()
    return this.renderer
  }

  /**
   * Update Pixi renderer
   */
  update(context: RendererContext): void {
    if (!this.renderer) return
    
    // Pixi handles resize automatically with the fixed canvas system
    // Additional update logic can be added here if needed
  }

  /**
   * Dispose Pixi application
   */
  dispose(): void {
    if (this.renderer) {
      this.renderer.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true
      })
      this.renderer = null
    }
    this.isInitialized = false
  }
}
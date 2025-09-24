/**
 * WebGL Renderer Adapter
 * 
 * Provides WebGL rendering context for the fixed canvas system.
 */

import { BaseAdapter } from './BaseAdapter'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../FixedCanvas'
import type { RendererContext } from '../CanvasAdapterManager'

export interface WebGLAdapterOptions {
  /** Use WebGL2 if available */
  preferWebGL2?: boolean
  /** Enable alpha blending */
  alpha?: boolean
  /** Enable depth buffer */
  depth?: boolean
  /** Enable stencil buffer */
  stencil?: boolean
  /** Enable antialiasing */
  antialias?: boolean
  /** Premultiplied alpha */
  premultipliedAlpha?: boolean
  /** Preserve drawing buffer */
  preserveDrawingBuffer?: boolean
}

export class WebGLAdapter extends BaseAdapter<WebGLRenderingContext | WebGL2RenderingContext> {
  readonly name = 'webgl'

  constructor(options: WebGLAdapterOptions = {}) {
    super(options)
  }

  /**
   * Check if WebGL is available
   */
  canRun(): boolean {
    try {
      const canvas = document.createElement('canvas')
      const contextNames = this.options.preferWebGL2 !== false 
        ? ['webgl2', 'webgl'] 
        : ['webgl', 'webgl2']
      
      for (const name of contextNames) {
        if (canvas.getContext(name)) {
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Initialize WebGL context
   */
  initialize(context: RendererContext): WebGLRenderingContext | WebGL2RenderingContext {
    this.validateContext(context)

    const contextAttributes: WebGLContextAttributes = {
      alpha: this.options.alpha ?? true,
      depth: this.options.depth ?? true,
      stencil: this.options.stencil ?? false,
      antialias: this.options.antialias ?? true,
      premultipliedAlpha: this.options.premultipliedAlpha ?? true,
      preserveDrawingBuffer: this.options.preserveDrawingBuffer ?? false
    }

    const contextNames = this.options.preferWebGL2 !== false 
      ? ['webgl2', 'webgl'] 
      : ['webgl', 'webgl2']

    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null

    for (const name of contextNames) {
      gl = context.canvas.getContext(name, contextAttributes) as WebGLRenderingContext | WebGL2RenderingContext
      if (gl) break
    }

    if (!gl) {
      throw new Error('Failed to get WebGL rendering context')
    }

    // Setup viewport
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Enable depth testing if depth buffer is available
    if (this.options.depth !== false) {
      gl.enable(gl.DEPTH_TEST)
    }

    this.renderer = gl
    this.setInitialized()
    return this.renderer
  }

  /**
   * Update WebGL context
   */
  update(context: RendererContext): void {
    if (this.renderer) {
      // Update viewport (though it should remain constant with fixed canvas)
      this.renderer.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
  }

  /**
   * Dispose WebGL context
   */
  dispose(): void {
    if (this.renderer) {
      // Clear the WebGL context
      this.renderer.clear(this.renderer.COLOR_BUFFER_BIT | this.renderer.DEPTH_BUFFER_BIT)
      
      // Note: WebGL context cannot be explicitly destroyed
      // The browser will handle cleanup when the canvas is removed
      this.renderer = null
    }
    this.isInitialized = false
  }
}
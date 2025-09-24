/**
 * Three.js Renderer Adapter
 *
 * Wraps Three.js WebGLRenderer so it integrates with the fixed canvas system.
 */

import * as THREE from 'three'
import type { ColorRepresentation } from 'three'

import { BaseAdapter } from './BaseAdapter'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../FixedCanvas'
import type { RendererContext } from '../CanvasAdapterManager'

export interface ThreeAdapterOptions {
  /** Whether to create the renderer with alpha enabled */
  alpha?: boolean
  /** Enable antialiasing */
  antialias?: boolean
  /** Preserve drawing buffer for screenshots */
  preserveDrawingBuffer?: boolean
  /** Override clear color (CSS string or numeric hex) */
  clearColor?: number | string
  /** Override clear alpha */
  clearAlpha?: number
  /** Custom pixel ratio */
  pixelRatio?: number
}

export class ThreeAdapter extends BaseAdapter<THREE.WebGLRenderer> {
  readonly name = 'three'

  constructor(options: ThreeAdapterOptions = {}) {
    super(options)
  }

  canRun(): boolean {
    if (typeof window === 'undefined') return false

    try {
      const probe = document.createElement('canvas')
      return !!(probe.getContext('webgl2') || probe.getContext('webgl'))
    } catch {
      return false
    }
  }

  initialize(context: RendererContext): THREE.WebGLRenderer {
    this.validateContext(context)

    const renderer = new THREE.WebGLRenderer({
      canvas: context.canvas,
      alpha: this.options.alpha ?? true,
      antialias: this.options.antialias ?? true,
      preserveDrawingBuffer: this.options.preserveDrawingBuffer ?? false,
    })

    const pixelRatio = this.options.pixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1)
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT, false)

    const clearColor = this.options.clearColor ?? 0x000000
    const clearAlpha = this.options.clearAlpha ?? 0

    renderer.setClearColor(clearColor as ColorRepresentation, clearAlpha)

    this.renderer = renderer
    this.setInitialized()
    return renderer
  }

  update(): void {
    if (!this.renderer) return
    this.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT, false)
  }

  dispose(): void {
    if (this.renderer) {
      this.renderer.dispose()
      if (typeof (this.renderer as any).forceContextLoss === 'function') {
        (this.renderer as any).forceContextLoss()
      }
      const canvas = this.renderer.domElement as HTMLCanvasElement
      canvas.width = CANVAS_WIDTH
      canvas.height = CANVAS_HEIGHT
      this.renderer = null
    }
    this.isInitialized = false
  }
}

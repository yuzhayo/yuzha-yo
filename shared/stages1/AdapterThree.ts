/**
 * Three.js Renderer Adapter
 * 
 * Provides Three.js WebGL rendering context for the fixed canvas system.
 * Compatible with Three.js ^0.180.0
 */

import { BaseAdapter } from './CanvasAdapter'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './Canvas'
import type { RendererContext } from './CanvasAdapter'

// Three.js v0.180.0 imports
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  OrthographicCamera,
  Color,
  type Camera
} from 'three'

export interface ThreeAdapterOptions {
  /** Enable antialiasing */
  antialias?: boolean
  /** Enable alpha blending */
  alpha?: boolean
  /** Premultiplied alpha */
  premultipliedAlpha?: boolean
  /** Preserve drawing buffer */
  preserveDrawingBuffer?: boolean
  /** Background color */
  backgroundColor?: number | string
  /** Background alpha */
  backgroundAlpha?: number
  /** Camera type: 'perspective' or 'orthographic' */
  cameraType?: 'perspective' | 'orthographic'
  /** Camera field of view (for perspective camera) */
  fov?: number
  /** Camera near plane */
  near?: number
  /** Camera far plane */
  far?: number
  /** Enable shadows */
  enableShadows?: boolean
}

export interface ThreeRenderer {
  /** Three.js WebGL renderer */
  renderer: WebGLRenderer
  /** Three.js scene */
  scene: Scene
  /** Three.js camera */
  camera: Camera
  /** Render the scene */
  render(): void
  /** Resize handler (automatically handled by adapter) */
  resize(width: number, height: number): void
}

export class ThreeAdapter extends BaseAdapter<ThreeRenderer> {
  readonly name = 'three'
  private threeRenderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: Camera | null = null

  constructor(options: ThreeAdapterOptions = {}) {
    super(options)
  }

  /**
   * Check if Three.js is available
   */
  canRun(): boolean {
    try {
      // Check if Three.js WebGLRenderer is available
      return typeof WebGLRenderer !== 'undefined' && typeof Scene !== 'undefined'
    } catch {
      return false
    }
  }

  /**
   * Initialize Three.js renderer, scene, and camera
   */
  initialize(context: RendererContext): ThreeRenderer {
    this.validateContext(context)

    // Create Three.js WebGL renderer using the managed canvas
    this.threeRenderer = new WebGLRenderer({
      canvas: context.canvas,
      antialias: this.options.antialias ?? true,
      alpha: this.options.alpha ?? true,
      premultipliedAlpha: this.options.premultipliedAlpha ?? true,
      preserveDrawingBuffer: this.options.preserveDrawingBuffer ?? false
    })

    // Set renderer size to fixed canvas dimensions
    this.threeRenderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT, false)
    this.threeRenderer.setPixelRatio(window.devicePixelRatio || 1)

    // Set background color and alpha
    if (this.options.backgroundColor !== undefined) {
      this.threeRenderer.setClearColor(
        new Color(this.options.backgroundColor), 
        this.options.backgroundAlpha ?? 1
      )
    }

    // Enable shadows if requested
    if (this.options.enableShadows) {
      this.threeRenderer.shadowMap.enabled = true
    }

    // Create scene
    this.scene = new Scene()

    // Create camera based on type
    this.camera = this.createCamera()

    // Create renderer interface
    const rendererInterface: ThreeRenderer = {
      renderer: this.threeRenderer,
      scene: this.scene,
      camera: this.camera,
      render: () => {
        if (this.threeRenderer && this.scene && this.camera) {
          this.threeRenderer.render(this.scene, this.camera)
        }
      },
      resize: (width: number, height: number) => {
        if (this.threeRenderer && this.camera) {
          this.threeRenderer.setSize(width, height, false)
          this.updateCameraAspect(width / height)
        }
      }
    }

    this.renderer = rendererInterface
    this.setInitialized()
    return this.renderer
  }

  /**
   * Create camera based on options
   */
  private createCamera(): Camera {
    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT // Always 1:1 for square canvas
    const near = this.options.near ?? 0.1
    const far = this.options.far ?? 1000

    if (this.options.cameraType === 'orthographic') {
      const size = 1024 // Half of canvas size for reasonable orthographic view
      return new OrthographicCamera(
        -size, size,  // left, right
        size, -size,  // top, bottom
        near, far
      )
    } else {
      // Default to perspective camera
      const fov = this.options.fov ?? 75
      return new PerspectiveCamera(fov, aspect, near, far)
    }
  }

  /**
   * Update camera aspect ratio
   */
  private updateCameraAspect(aspect: number): void {
    if (!this.camera) return

    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = aspect
      this.camera.updateProjectionMatrix()
    } else if (this.camera instanceof OrthographicCamera) {
      // For orthographic camera, maintain size proportions
      const size = 1024
      const halfWidth = size * aspect
      const halfHeight = size
      
      this.camera.left = -halfWidth
      this.camera.right = halfWidth
      this.camera.top = halfHeight
      this.camera.bottom = -halfHeight
      this.camera.updateProjectionMatrix()
    }
  }

  /**
   * Update Three.js renderer
   */
  update(context: RendererContext): void {
    if (this.renderer && context.getTransform) {
      const transform = context.getTransform()
      if (transform) {
        // Three.js automatically handles the canvas scaling via CSS
        // The renderer size should remain at CANVAS_WIDTH x CANVAS_HEIGHT
        this.renderer.resize(CANVAS_WIDTH, CANVAS_HEIGHT)
      }
    }
  }

  /**
   * Dispose Three.js resources
   */
  dispose(): void {
    if (this.threeRenderer) {
      // Dispose of Three.js renderer resources
      this.threeRenderer.dispose()
      this.threeRenderer = null
    }

    if (this.scene) {
      // Dispose of scene resources
      this.scene.clear()
      this.scene = null
    }

    this.camera = null
    this.renderer = null
    this.isInitialized = false
  }
}
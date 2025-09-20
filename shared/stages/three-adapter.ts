import * as THREE from 'three'
import { StageAdapter, EngineConfig, PerformanceMetrics, EngineStatus } from './adapter'

export class ThreeStageAdapter implements StageAdapter {
  private renderer: THREE.WebGLRenderer | null = null
  private camera: THREE.OrthographicCamera | null = null
  private scene: THREE.Scene | null = null
  private canvas: HTMLCanvasElement | null = null
  private overlay: HTMLElement | null = null
  private container: HTMLElement | null = null
  private animationId: number | null = null
  private paused = false
  
  private config: EngineConfig = {
    stage: { width: 2048, height: 2048 },
    performance: {
      dprCap: 1.5,
      antialias: true,
      shadowsEnabled: false
    },
    debug: false
  }

  async mount(element: HTMLElement): Promise<void> {
    // Create Three.js renderer with performance settings
    const dpr = Math.min(this.config.performance.dprCap, window.devicePixelRatio || 1)
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.performance.antialias,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    })
    
    this.renderer.setSize(this.config.stage.width, this.config.stage.height)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setClearColor(0x000000, 0)
    
    // Create orthographic camera for 2D-like 3D rendering
    const { width, height } = this.config.stage
    this.camera = new THREE.OrthographicCamera(
      -width / 2, width / 2,
      height / 2, -height / 2,
      0.1, 1000
    )
    this.camera.position.z = 100
    
    // Create scene
    this.scene = new THREE.Scene()
    
    // Add demo content - a rotating cube
    const geometry = new THREE.BoxGeometry(200, 200, 200)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    const cube = new THREE.Mesh(geometry, material)
    this.scene.add(cube)
    
    // Setup DOM structure
    this.container = document.createElement('div')
    this.overlay = document.createElement('div')
    this.canvas = this.renderer.domElement
    
    // Style container for responsive overlay
    this.container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `
    
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    `
    
    this.canvas.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: 100%;
      max-height: 100%;
    `
    
    // Mount to DOM
    element.appendChild(this.container)
    this.container.appendChild(this.canvas)
    this.container.appendChild(this.overlay)
    
    // Start render loop
    this.startRenderLoop()
    
    // Handle visibility changes for performance
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause()
      } else {
        this.resume()
      }
    })
  }

  private startRenderLoop(): void {
    const animate = (time: number) => {
      if (!this.paused && this.renderer && this.scene && this.camera) {
        // Rotate the demo cube
        const cube = this.scene.children[0]
        if (cube) {
          cube.rotation.x = time * 0.0005
          cube.rotation.y = time * 0.001
        }
        
        this.renderer.render(this.scene, this.camera)
      }
      this.animationId = requestAnimationFrame(animate)
    }
    animate(0)
  }

  resize(): void {
    if (!this.renderer || !this.camera || !this.canvas) return
    
    // Keep fixed stage size, adjust container sizing via CSS
    const container = this.container
    if (container) {
      const rect = container.getBoundingClientRect()
      const scale = Math.min(rect.width / this.config.stage.width, rect.height / this.config.stage.height)
      
      this.canvas.style.transform = `translate(-50%, -50%) scale(${scale})`
    }
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }
    
    this.camera = null
    this.scene = null
    this.canvas = null
    this.overlay = null
    this.container = null
  }

  getOverlay(): HTMLElement {
    if (!this.overlay) throw new Error('Engine not mounted')
    return this.overlay
  }

  getCanvas(): HTMLCanvasElement {
    if (!this.canvas) throw new Error('Engine not mounted')
    return this.canvas
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
  }

  getMetrics(): PerformanceMetrics {
    return {
      fps: 60, // Placeholder
      memoryUsage: 0,
      drawCalls: 1,
      triangles: 12
    }
  }

  configure(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getStatus(): EngineStatus {
    return {
      ready: this.renderer !== null,
      paused: this.paused
    }
  }
}
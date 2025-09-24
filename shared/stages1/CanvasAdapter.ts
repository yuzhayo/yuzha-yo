/**
 * Canvas Adapter System - Stable Parent Components
 * 
 * This file contains the stable core components that rarely change:
 * - Canvas Adapter Manager (orchestrates the system)
 * - Base Adapter Interface (contract for all adapters)
 * 
 * Dynamic child adapters (WebGL, etc.) are kept in separate files
 * for independent updates without touching the stable parent system.
 * 
 * Features:
 * - Dynamic renderer registration
 * - Automatic adapter selection
 * - Unified API across all renderers
 * - Plugin-based architecture
 * - Hot-swappable renderers
 */

import { FixedCanvasManager, createCoordinateTransformer, type CanvasTransform, type CanvasCoordinates } from './Canvas'

// ===========================================================================================
// SECTION 1: TYPE DEFINITIONS & INTERFACES (Stable)
// ===========================================================================================

export type RendererType = 'webgl' | 'three' | string

export interface CanvasAdapterOptions {
  /** Renderer type to use */
  renderer: RendererType
  /** Enable debug mode */
  debug?: boolean
  /** Additional renderer-specific options */
  rendererOptions?: Record<string, any>
  /** Auto-detect best renderer if specified renderer fails */
  autoFallback?: boolean
  /** Fallback order if auto-detect is enabled */
  fallbackOrder?: RendererType[]
}

export interface RendererContext {
  /** The managed canvas element */
  canvas: HTMLCanvasElement
  /** Canvas container element */
  container: HTMLElement
  /** Interaction overlay element */
  overlay: HTMLElement
  /** Canvas manager instance */
  canvasManager: FixedCanvasManager
  /** Coordinate transformer utility */
  coordinateTransformer: ReturnType<typeof createCoordinateTransformer>
  /** Current transform data */
  getTransform: () => CanvasTransform | null
}

export interface RendererAdapter<T = any> {
  /** Adapter name/type */
  readonly name: string
  /** Check if this adapter can run in current environment */
  canRun(): boolean
  /** Initialize the renderer with the canvas context */
  initialize(context: RendererContext, options?: any): Promise<T> | T
  /** Get the renderer instance */
  getRenderer(): T | null
  /** Update renderer (called on resize, etc.) */
  update?(context: RendererContext): void
  /** Clean up renderer resources */
  dispose(): void
}

export interface AdapterManagerResult<T = any> {
  /** The adapter manager instance */
  manager: CanvasAdapterManager
  /** The active renderer adapter */
  adapter: RendererAdapter<T>
  /** The renderer instance */
  renderer: T
  /** Canvas context utilities */
  context: RendererContext
}

// ===========================================================================================
// SECTION 2: BASE ADAPTER ABSTRACT CLASS (Stable)
// ===========================================================================================

/**
 * Base Adapter Interface
 * 
 * Abstract base class that all renderer adapters must extend.
 * Provides common functionality and enforces adapter contract.
 * This is stable and should rarely change.
 */
export abstract class BaseAdapter<T = any> implements RendererAdapter<T> {
  protected renderer: T | null = null
  protected isInitialized = false
  
  constructor(protected options: any = {}) {}

  abstract readonly name: string

  /**
   * Check if this adapter can run in current environment
   * Override this method to add specific capability checks
   */
  canRun(): boolean {
    return true
  }

  /**
   * Initialize the renderer with canvas context
   * Override this method to implement renderer-specific initialization
   */
  abstract initialize(context: RendererContext, options?: any): Promise<T> | T

  /**
   * Get the renderer instance
   */
  getRenderer(): T | null {
    return this.renderer
  }

  /**
   * Update renderer (called on resize, etc.)
   * Override if renderer needs updates
   */
  update?(context: RendererContext): void

  /**
   * Clean up renderer resources
   * Override this method to implement renderer-specific cleanup
   */
  abstract dispose(): void

  /**
   * Mark adapter as initialized
   */
  protected setInitialized(): void {
    this.isInitialized = true
  }

  /**
   * Check if adapter is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.renderer !== null
  }

  /**
   * Validate context before use
   */
  protected validateContext(context: RendererContext): void {
    if (!context.canvas) {
      throw new Error(`${this.name} adapter: Canvas element not found in context`)
    }
    if (!context.container) {
      throw new Error(`${this.name} adapter: Container element not found in context`)
    }
  }
}

// ===========================================================================================
// SECTION 3: CANVAS ADAPTER MANAGER (Stable Parent)
// ===========================================================================================

/**
 * Canvas Adapter Manager
 * 
 * Central manager that handles multiple renderer adapters dynamically.
 * Provides a stable API while allowing hot-swappable renderer backends.
 * This is the main parent class that orchestrates everything.
 */
export class CanvasAdapterManager {
  private static adapters = new Map<string, new (...args: any[]) => RendererAdapter>()
  private canvasManager: FixedCanvasManager
  private activeAdapter: RendererAdapter | null = null
  private context: RendererContext | null = null
  
  constructor(private options: CanvasAdapterOptions) {
    this.canvasManager = new FixedCanvasManager({
      debug: options.debug
    })
  }

  /**
   * Register a new renderer adapter (static method)
   */
  static registerAdapter<T extends RendererAdapter>(
    name: string, 
    adapterClass: new (...args: any[]) => T
  ): void {
    this.adapters.set(name.toLowerCase(), adapterClass)
  }

  /**
   * Get list of registered adapters
   */
  static getRegisteredAdapters(): string[] {
    return Array.from(this.adapters.keys())
  }

  /**
   * Check if adapter is registered
   */
  static hasAdapter(name: string): boolean {
    return this.adapters.has(name.toLowerCase())
  }

  /**
   * Initialize the canvas system with selected renderer
   */
  async mount<T = any>(rootElement: HTMLElement): Promise<AdapterManagerResult<T>> {
    // Initialize the canvas system
    const canvasSetup = this.canvasManager.initialize(rootElement)
    
    // Create context
    this.context = {
      ...canvasSetup,
      coordinateTransformer: createCoordinateTransformer(this.canvasManager),
      getTransform: () => this.canvasManager.getTransform()
    }

    // Find and initialize adapter
    const adapter = await this.findAndInitializeAdapter()
    
    return {
      manager: this,
      adapter,
      renderer: adapter.getRenderer() as T,
      context: this.context
    }
  }

  /**
   * Switch to a different renderer dynamically
   */
  async switchRenderer<T = any>(newRenderer: RendererType, options?: any): Promise<AdapterManagerResult<T>> {
    if (!this.context) {
      throw new Error('Canvas not initialized. Call mount() first.')
    }

    // Dispose current adapter
    if (this.activeAdapter) {
      this.activeAdapter.dispose()
    }

    // Update options
    this.options.renderer = newRenderer
    if (options) {
      this.options.rendererOptions = { ...this.options.rendererOptions, ...options }
    }

    // Find and initialize new adapter
    const adapter = await this.findAndInitializeAdapter()
    
    return {
      manager: this,
      adapter,
      renderer: adapter.getRenderer() as T,
      context: this.context
    }
  }

  /**
   * Get current active adapter
   */
  getActiveAdapter(): RendererAdapter | null {
    return this.activeAdapter
  }

  /**
   * Get canvas context
   */
  getContext(): RendererContext | null {
    return this.context
  }

  /**
   * Get canvas manager
   */
  getCanvasManager(): FixedCanvasManager {
    return this.canvasManager
  }

  /**
   * Find and initialize the best adapter
   */
  private async findAndInitializeAdapter(): Promise<RendererAdapter> {
    if (!this.context) {
      throw new Error('Context not initialized')
    }

    const renderersToTry = this.getRenderersToTry()
    
    for (const rendererName of renderersToTry) {
      const AdapterClass = CanvasAdapterManager.adapters.get(rendererName.toLowerCase())
      
      if (!AdapterClass) {
        console.warn(`[CanvasAdapter] Adapter '${rendererName}' not registered`)
        continue
      }

      try {
        const adapter = new AdapterClass(this.options.rendererOptions)
        
        // Check if adapter can run
        if (!adapter.canRun()) {
          console.warn(`[CanvasAdapter] Adapter '${rendererName}' cannot run in this environment`)
          continue
        }

        // Initialize adapter
        await adapter.initialize(this.context, this.options.rendererOptions)
        
        console.log(`[CanvasAdapter] Successfully initialized '${rendererName}' renderer`)
        this.activeAdapter = adapter
        return adapter
        
      } catch (error) {
        console.warn(`[CanvasAdapter] Failed to initialize '${rendererName}':`, error)
        continue
      }
    }

    throw new Error(`No suitable renderer adapter found. Tried: ${renderersToTry.join(', ')}`)
  }

  /**
   * Get list of renderers to try in order
   */
  private getRenderersToTry(): string[] {
    const renderers = [this.options.renderer]
    
    if (this.options.autoFallback) {
      const fallbacks = this.options.fallbackOrder || ['three', 'webgl']
      renderers.push(...fallbacks.filter(r => r !== this.options.renderer))
    }
    
    return renderers
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    if (this.activeAdapter) {
      this.activeAdapter.dispose()
      this.activeAdapter = null
    }
    
    this.canvasManager.dispose()
    this.context = null
  }
}

// ===========================================================================================
// SECTION 4: UTILITY FUNCTIONS (Stable)
// ===========================================================================================

/**
 * Create canvas adapter manager with automatic setup
 */
export async function createCanvasAdapter<T = any>(
  rootElement: HTMLElement,
  options: CanvasAdapterOptions
): Promise<AdapterManagerResult<T>> {
  const manager = new CanvasAdapterManager(options)
  return await manager.mount<T>(rootElement)
}

/**
 * Auto-detect best available renderer
 */
export function detectBestRenderer(): RendererType {
  const canvas = document.createElement('canvas')
  
  // Check WebGL support (prefer Three.js if available)
  try {
    if (canvas.getContext('webgl2') || canvas.getContext('webgl')) {
      // Check if Three.js is available
      if (typeof window !== 'undefined' && (window as any).THREE) {
        return 'three'
      }
      return 'webgl'
    }
  } catch {}
  
  // Fallback to WebGL
  return 'webgl'
}
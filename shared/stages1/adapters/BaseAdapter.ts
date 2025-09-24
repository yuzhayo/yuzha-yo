/**
 * Base Adapter Interface
 * 
 * Abstract base class that all renderer adapters must extend.
 * Provides common functionality and enforces adapter contract.
 */

import type { RendererAdapter, RendererContext } from '../CanvasAdapterManager'

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
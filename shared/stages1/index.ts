/**
 * Fixed Canvas System - Entry Point
 * 
 * A WebGL-focused 2048×2048 fixed canvas system with responsive scaling.
 * 
 * Core Features:
 * - Fixed 2048×2048 design coordinate system
 * - Responsive scaling with "cover" behavior  
 * - WebGL renderer system
 * - Auto-fallback system
 * 
 * Usage:
 * ```typescript
 * import { createCanvasAdapter, CanvasAdapterManager } from '@/stages'
 * 
 * // Simple usage with auto-registration
 * const { renderer, context } = await createCanvasAdapter(rootElement, {
 *   renderer: 'webgl',
 *   autoFallback: true,
 *   debug: true
 * })
 * 
 * // Manual manager usage
 * const manager = new CanvasAdapterManager({ 
 *   renderer: 'webgl',
 *   autoFallback: true 
 * })
 * const result = await manager.mount(rootElement)
 * ```
 */

// Core canvas system
export {
  FixedCanvasManager,
  calculateCanvasTransform,
  transformCoordinatesToCanvas,
  isWithinCanvas,
  createCoordinateTransformer,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './Canvas'

// Adapter system (stable parent)
export {
  CanvasAdapterManager,
  BaseAdapter,
  createCanvasAdapter,
  detectBestRenderer
} from './CanvasAdapter'

// Auto-register default adapters and export utilities
export {
  registerDefaultAdapters
} from './CanvasAdapterRegister'

// Built-in adapters (dynamic children)
export { WebGLAdapter } from './AdapterWebGL'
export { ThreeAdapter } from './AdapterThree'

// Type definitions
export type {
  CanvasTransform,
  CanvasCoordinates,
  FixedCanvasOptions
} from './Canvas'

export type {
  RendererType,
  CanvasAdapterOptions,
  RendererContext,
  RendererAdapter,
  AdapterManagerResult
} from './CanvasAdapter'

export type {
  WebGLAdapterOptions
} from './AdapterWebGL'

export type {
  ThreeAdapterOptions,
  ThreeRenderer
} from './AdapterThree'
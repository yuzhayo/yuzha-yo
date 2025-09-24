/**
 * Fixed Canvas System - Entry Point
 * 
 * A renderer-agnostic 2048×2048 fixed canvas system with plugin-based architecture.
 * 
 * Core Features:
 * - Fixed 2048×2048 design coordinate system
 * - Responsive scaling with "cover" behavior  
 * - Plugin-based renderer system
 * - Dynamic renderer switching
 * - Multiple built-in adapters (Pixi.js, DOM, WebGL, Canvas2D)
 * - Hot-swappable renderers
 * - Auto-fallback system
 * 
 * Usage:
 * ```typescript
 * import { createCanvasAdapter, CanvasAdapterManager } from '@/stages'
 * 
 * // Simple usage with auto-registration
 * const { renderer, context } = await createCanvasAdapter(rootElement, {
 *   renderer: 'pixi',
 *   autoFallback: true,
 *   debug: true
 * })
 * 
 * // Manual manager usage
 * const manager = new CanvasAdapterManager({ 
 *   renderer: 'pixi',
 *   autoFallback: true 
 * })
 * const result = await manager.mount(rootElement)
 * 
 * // Register custom adapter
 * CanvasAdapterManager.registerAdapter('custom', MyCustomAdapter)
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
} from './FixedCanvas'

// Plugin system
export {
  CanvasAdapterManager,
  createCanvasAdapter,
  detectBestRenderer
} from './CanvasAdapterManager'

// Auto-register default adapters and export utilities
export {
  registerDefaultAdapters
} from './registerDefaultAdapters'

// Built-in adapters
export {
  BaseAdapter,
  PixiAdapter,
  DOMAdapter,
  Canvas2DAdapter,
  WebGLAdapter
} from './adapters'

// Type definitions
export type {
  CanvasTransform,
  CanvasCoordinates,
  FixedCanvasOptions
} from './FixedCanvas'

export type {
  RendererType,
  CanvasAdapterOptions,
  RendererContext,
  RendererAdapter,
  AdapterManagerResult
} from './CanvasAdapterManager'

export type {
  PixiAdapterOptions,
  DOMAdapterOptions,
  DOMElementPosition,
  DOMRenderer,
  Canvas2DAdapterOptions,
  WebGLAdapterOptions
} from './adapters'
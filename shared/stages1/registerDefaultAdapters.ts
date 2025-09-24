/**
 * Register Default Adapters
 * 
 * Automatically registers all built-in adapters with the Canvas Adapter Manager.
 * Import this file to have all default adapters available.
 */

import { CanvasAdapterManager } from './CanvasAdapterManager'
import { PixiAdapter, DOMAdapter, Canvas2DAdapter, WebGLAdapter } from './adapters'

/**
 * Register all default adapters
 */
export function registerDefaultAdapters(): void {
  CanvasAdapterManager.registerAdapter('pixi', PixiAdapter)
  CanvasAdapterManager.registerAdapter('dom', DOMAdapter)
  CanvasAdapterManager.registerAdapter('canvas2d', Canvas2DAdapter)
  CanvasAdapterManager.registerAdapter('webgl', WebGLAdapter)
}

/**
 * Auto-register default adapters when this module is imported
 */
registerDefaultAdapters()

export { CanvasAdapterManager, createCanvasAdapter, detectBestRenderer } from './CanvasAdapterManager'
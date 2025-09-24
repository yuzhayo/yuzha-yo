/**
 * Register Default Adapters
 *
 * Automatically registers the built-in adapters with the Canvas Adapter Manager.
 */

import { CanvasAdapterManager } from './CanvasAdapterManager'
import { WebGLAdapter, ThreeAdapter } from './adapters'

/**
 * Register built-in adapters
 */
export function registerDefaultAdapters(): void {
  CanvasAdapterManager.registerAdapter('webgl', WebGLAdapter)
  CanvasAdapterManager.registerAdapter('three', ThreeAdapter)
}

/**
 * Auto-register default adapters when this module is imported
 */
registerDefaultAdapters()

export { CanvasAdapterManager, createCanvasAdapter, detectBestRenderer } from './CanvasAdapterManager'

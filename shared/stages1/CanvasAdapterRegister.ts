/**
 * Canvas Adapter Registration
 * 
 * Automatically registers WebGL adapter with the Canvas Adapter Manager.
 * Import this file to have the default WebGL adapter available.
 */

import { CanvasAdapterManager } from './CanvasAdapter'
import { WebGLAdapter } from './AdapterWebGL'
import { ThreeAdapter } from './AdapterThree'

/**
 * Register default adapters
 */
export function registerDefaultAdapters(): void {
  CanvasAdapterManager.registerAdapter('webgl', WebGLAdapter)
  CanvasAdapterManager.registerAdapter('three', ThreeAdapter)
}

/**
 * Auto-register default adapter when this module is imported
 */
registerDefaultAdapters()

export { CanvasAdapterManager, createCanvasAdapter, detectBestRenderer } from './CanvasAdapter'
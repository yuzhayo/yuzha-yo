/**
 * Fixed Canvas System - Entry Point
 *
 * A renderer-agnostic 2048x2048 fixed canvas with a pluggable adapter system.
 *
 * Bundled adapters:
 * - WebGL: lightweight access to raw WebGL contexts
 * - Three.js: higher-level rendering via THREE.WebGLRenderer
 *
 * Register your own adapters with CanvasAdapterManager.registerAdapter().
 */

// Core canvas system
export {
  FixedCanvasManager,
  calculateCanvasTransform,
  transformCoordinatesToCanvas,
  isWithinCanvas,
  createCoordinateTransformer,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './FixedCanvas'

// Adapter manager
export {
  CanvasAdapterManager,
  createCanvasAdapter,
  detectBestRenderer,
} from './CanvasAdapterManager'

// Register built-in adapters
export { registerDefaultAdapters } from './registerDefaultAdapters'

// Built-in adapters
export {
  BaseAdapter,
  WebGLAdapter,
  ThreeAdapter,
} from './adapters'

// Type definitions
export type {
  CanvasTransform,
  CanvasCoordinates,
  FixedCanvasOptions,
} from './FixedCanvas'

export type {
  RendererType,
  CanvasAdapterOptions,
  RendererContext,
  RendererAdapter,
  AdapterManagerResult,
} from './CanvasAdapterManager'

export type {
  WebGLAdapterOptions,
  ThreeAdapterOptions,
} from './adapters'

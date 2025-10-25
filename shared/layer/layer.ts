/**
 * ============================================================================
 * LAYER PIPELINE SYSTEM - Unified Layer Processing for Yuzha Application
 * ============================================================================
 *
 * This module is the CORE of the layer rendering pipeline. It combines three
 * essential functionalities:
 *
 * 1. TYPES & PIPELINE - Layer data types and pipeline execution
 * 2. PROCESSOR REGISTRY - Plugin system for layer behaviors (spin and orbit)
 * 3. ANIMATION UTILITIES - Helper functions for animations and performance
 *
 * ARCHITECTURE FLOW (for future AI agents):
 * ------------------------------------------
 * ConfigYuzha.json (layer definitions)
 *   ↓
 * Config.ts (loads, transforms, validates)
 *   ↓
 * LayerCore.ts (prepares base layer data from config)
 *   ↓
 * layer.ts (THIS FILE - attaches processors and runs pipeline)
 *   ↓
 * Renderers (StageDOM/Canvas/Three - render to screen)
 *   ↓
 * MainScreen.tsx (displays final result)
 *
 * HOW TO USE THIS MODULE:
 * -----------------------
 * For adding new layer behaviors/processors:
 *
 * import {
 *   registerProcessor,      // Register a new processor plugin
 *   getProcessorsForEntry,  // Get processors for a layer
 *   runPipeline,            // Run processors on layer data
 *   type LayerProcessor,    // Type for processor functions
 * } from "@shared/layer/layer";
 *
 * For animation utilities:
 *
 * import {
 *   normalizeAngle,         // Angle utilities
 *   calculateOrbitPosition, // Orbital calculations
 *   createPipelineCache,    // Performance caching
 * } from "@shared/layer/layer";
 *
 * KEY CONCEPTS FOR AI AGENTS:
 * ---------------------------
 * 1. UniversalLayerData - Base layer data prepared by LayerCore
 * 2. LayerProcessor - Function that enhances layer data (adds properties)
 * 3. EnhancedLayerData - Layer data after processors have run
 * 4. ProcessorPlugin - Registration info for a processor (when to attach, how to create)
 * 5. Pipeline - Sequential execution of processors on layer data
 *
 * ADDING NEW PROCESSORS (for future AI agents):
 * ---------------------------------------------
 * 1. Create processor function that matches LayerProcessor type
 * 2. Register it with registerProcessor() with shouldAttach condition
 * 3. Add any new properties to EnhancedLayerData type
 * 4. Processor will automatically attach when shouldAttach returns true
 *
 * EXAMPLE - Adding a blur processor:
 *
 * registerProcessor({
 *   name: "blur",
 *   shouldAttach(entry) {
 *     return entry.blurAmount !== undefined && entry.blurAmount > 0;
 *   },
 *   create(entry) {
 *     return (layer, timestamp) => ({
 *       ...layer,
 *       blurAmount: entry.blurAmount,
 *       hasBlur: true,
 *     });
 *   },
 * });
 *
 * @module layer
 */

import type { UniversalLayerData } from "./layerCore";
import type { LayerConfigEntry } from "../config/Config";
import { createSpinProcessor } from "./layerSpin";
import { createOrbitalProcessor } from "./layerOrbit";

// ============================================================================
// SECTION 1: TYPES & CORE PIPELINE
// ============================================================================
// This section defines the core types and pipeline execution logic.
//
// PIPELINE FLOW:
// 1. Start with UniversalLayerData (from LayerCore)
// 2. Run through LayerProcessor functions (each adds/modifies properties)
// 3. End with EnhancedLayerData (ready for rendering)
//
// FOR FUTURE AI AGENTS:
// - LayerProcessor is a function: (layer, timestamp?) => enhancedLayer
// - Processors can add any properties to the layer data
// - runPipeline() executes processors sequentially
// - Each processor builds on the previous processor's output
// ============================================================================

/**
 * Layer processor function type - transforms UniversalLayerData into EnhancedLayerData
 *
 * Processors can:
 * - Add new properties (spin rotation, orbital position, or other custom state)
 * - Modify existing properties (position, rotation, visibility)
 * - Use timestamp for time-based animations
 *
 * @param layer - Base or enhanced layer data
 * @param timestamp - Optional timestamp in milliseconds for animations
 * @returns Enhanced layer data with added/modified properties
 *
 * @example
 * const myProcessor: LayerProcessor = (layer, timestamp) => ({
 *   ...layer,
 *   myCustomProperty: calculateSomething(layer, timestamp),
 * });
 */
export type LayerProcessor = (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;

/**
 * Enhanced universal layer data that can include additional properties from processors
 *
 * Base properties (from UniversalLayerData - prepared by LayerCore.prepareLayer()):
 * - imageMapping: Image geometry (center point and native dimensions)
 * - calculation: Precomputed coordinate aliases (stage/image/percent) for points
 * - position: Layer position on stage
 * - scale: Layer scale factor
 * - rotation: Base rotation angle
 * - layerId: Unique layer identifier
 *
 * Processor-added properties (added by various processors):
 * - Spin properties: spinSpeed (rotations/hour), currentRotation, pivot metadata, etc.
 * - Orbital properties: orbitSpeed (rotations/hour), orbitRadius, currentOrbitAngle, etc.
 * - Future processors can add more properties here
 *
 * FOR FUTURE AI AGENTS:
 * When adding a new processor that adds properties, add those property types here
 * so TypeScript knows they exist on EnhancedLayerData.
 */
export type EnhancedLayerData = UniversalLayerData & {
  // Spin properties (added by LayerCorePipelineSpin)
  spinSpeed?: number; // rotations per hour (1 = 1 full rotation in 1 hour)
  spinDirection?: "cw" | "ccw";
  currentRotation?: number;
  hasSpinAnimation?: boolean;
  spinStagePoint?: { x: number; y: number };
  spinPercent?: { x: number; y: number };

  // Orbital properties (added by LayerCorePipelineOrbital)
  orbitStagePoint?: { x: number; y: number };
  orbitLinePoint?: { x: number; y: number };
  orbitLineVisible?: boolean;
  orbitImagePoint?: { x: number; y: number };
  orbitRadius?: number;
  orbitOrient?: boolean;
  orbitSpeed?: number; // rotations per hour (1 = 1 full orbit in 1 hour)
  orbitDirection?: "cw" | "ccw";
  currentOrbitAngle?: number;
  hasOrbitalAnimation?: boolean;
  visible?: boolean;
  orbitPoint?: { x: number; y: number };
  orbitLineStyle?: {
    radius: number;
    visible: boolean;
  };

  // Future properties will be added here by other processors
  // For example, if you add a blur processor, add: blurAmount?: number;
  opacity?: number;
  filters?: string[];
};

/**
 * Run layer data through a pipeline of processors
 *
 * ALGORITHM:
 * 1. Start with base layer data
 * 2. Pass through each processor sequentially
 * 3. Each processor receives output from previous processor
 * 4. Return final enhanced layer data
 *
 * This is the CORE execution function - all layer enhancements flow through here.
 *
 * @param baseLayer - The base layer data from LayerCore
 * @param processors - Array of processors to apply in sequence
 * @param timestamp - Optional timestamp for time-based processors
 * @returns Enhanced layer data with all processor modifications applied
 *
 * @example
 * const enhanced = runPipeline(
 *   baseLayer,
 *   [spinProcessor, orbitalProcessor],
 *   performance.now()
 * );
 */
export function runPipeline(
  baseLayer: UniversalLayerData,
  processors: LayerProcessor[],
  timestamp?: number,
): EnhancedLayerData {
  let enhanced: EnhancedLayerData = { ...baseLayer };

  for (const processor of processors) {
    enhanced = processor(enhanced, timestamp);
  }

  return enhanced;
}

/**
 * Process multiple layers through the same pipeline
 *
 * Convenience function for batch processing. Useful when you have multiple layers
 * that need the same processors applied.
 *
 * @param baseLayers - Array of base layers to process
 * @param processors - Array of processors to apply to each layer
 * @param timestamp - Optional timestamp for time-based processors
 * @returns Array of enhanced layers
 */
export function processBatch(
  baseLayers: UniversalLayerData[],
  processors: LayerProcessor[],
  timestamp?: number,
): EnhancedLayerData[] {
  return baseLayers.map((layer) => runPipeline(layer, processors, timestamp));
}

// ============================================================================
// SECTION 2: PROCESSOR REGISTRY
// ============================================================================
// This section manages the processor plugin system.
//
// PLUGIN SYSTEM FLOW:
// 1. Processors are registered with registerProcessor()
// 2. Each processor has a shouldAttach() condition
// 3. getProcessorsForEntry() checks all plugins and returns matching ones
// 4. Processors are created and attached to layers automatically
//
// FOR FUTURE AI AGENTS:
// - To add a new processor: call registerProcessor() with name, shouldAttach, create
// - shouldAttach() decides if processor applies to a layer (checks config)
// - create() builds the actual processor function
// - ProcessorContext allows runtime overrides (currently unused but available)
// ============================================================================

/**
 * Context for processor attachment decisions
 *
 * Allows runtime overrides and customization of processor behavior.
 * Currently unused but kept for future extensions.
 *
 * FUTURE USE CASES (for AI agents):
 * - Force a processor to attach even if config says no
 * - Pass renderer-specific settings (Canvas vs DOM vs Three.js)
 * - Provide global animation state (paused, speed multiplier)
 */
export type ProcessorContext = {
  /**
   * Allows runtime overrides (e.g., forcing a processor even when config is false).
   * Currently unused but kept for future extensions.
   */
  force?: Record<string, unknown>;
};

/**
 * Processor plugin definition
 *
 * A plugin defines:
 * - name: Unique identifier for the processor
 * - shouldAttach: Function that determines if processor applies to a layer
 * - create: Factory function that creates the processor
 *
 * FOR FUTURE AI AGENTS:
 * This is the interface for registering new processors. When you want to add
 * a new behavior (blur, particles, glow, etc.), create an object matching this
 * type and pass it to registerProcessor().
 */
type ProcessorPlugin = {
  /** Unique name for this processor (e.g., "spin", "orbital", "blur") */
  name: string;

  /**
   * Determines if this processor should be attached to a layer
   * @param entry - Layer configuration from ConfigYuzha.json
   * @param context - Optional runtime context
   * @returns true if processor should be attached, false otherwise
   */
  shouldAttach(entry: LayerConfigEntry, context?: ProcessorContext): boolean;

  /**
   * Creates the processor function for this layer
   * @param entry - Layer configuration from ConfigYuzha.json
   * @param context - Optional runtime context
   * @returns LayerProcessor function that will process this layer
   */
  create(entry: LayerConfigEntry, context?: ProcessorContext): LayerProcessor;
};

/**
 * Internal registry of all processor plugins
 * Stored as array to preserve registration order
 */
const plugins: ProcessorPlugin[] = [];

/**
 * Register a processor plugin
 *
 * Adds a new processor to the registry. If a processor with the same name
 * already exists, it will be replaced.
 *
 * FOR FUTURE AI AGENTS:
 * This is THE function to call when adding new layer behaviors. See example
 * at top of file for how to register a blur processor.
 *
 * @param plugin - Processor plugin definition
 *
 * @example
 * registerProcessor({
 *   name: "particles",
 *   shouldAttach(entry) {
 *     return entry.particleCount !== undefined && entry.particleCount > 0;
 *   },
 *   create(entry) {
 *     return (layer, timestamp) => ({
 *       ...layer,
 *       particles: generateParticles(layer, entry.particleCount, timestamp),
 *     });
 *   },
 * });
 */
export function registerProcessor(plugin: ProcessorPlugin): void {
  const existingIndex = plugins.findIndex((p) => p.name === plugin.name);
  if (existingIndex >= 0) {
    // Replace existing plugin
    plugins.splice(existingIndex, 1, plugin);
  } else {
    // Add new plugin
    plugins.push(plugin);
  }
}

/**
 * Get all processors that should be attached to a layer
 *
 * Iterates through all registered plugins and attaches those where
 * shouldAttach() returns true.
 *
 * This is called by StageSystem.createStagePipeline() for each layer
 * during pipeline preparation.
 *
 * @param entry - Layer configuration from ConfigYuzha.json
 * @param context - Optional runtime context
 * @returns Array of processor functions to apply to this layer
 *
 * @example
 * const processors = getProcessorsForEntry(layerConfig);
 * // processors might contain: [spinProcessor, orbitalProcessor]
 */
export function getProcessorsForEntry(
  entry: LayerConfigEntry,
  context?: ProcessorContext,
): LayerProcessor[] {
  const attached: LayerProcessor[] = [];
  for (const plugin of plugins) {
    try {
      if (plugin.shouldAttach(entry, context)) {
        attached.push(plugin.create(entry, context));
      }
    } catch (error) {
      console.warn(
        `[ProcessorRegistry] Failed to attach processor "${plugin.name}" for layer "${entry.LayerID}":`,
        error,
      );
    }
  }
  return attached;
}

// ============================================================================
// DEFAULT PROCESSOR REGISTRATIONS
// ============================================================================
// These processors are registered by default when this module loads.
// They handle the core layer behaviors: spin and orbital motion.
//
// FOR FUTURE AI AGENTS:
// - These are examples of how to register processors
// - Copy this pattern when adding new processors
// - The actual processor logic is in separate files (LayerCorePipelineSpin, etc.)
// - shouldAttach() checks config properties to decide if processor is needed
// ============================================================================

/**
 * Spin Processor
 *
 * Attaches spin animation to layers with spinSpeed > 0
 * Rotates layers around a pivot point at constant angular velocity
 */
registerProcessor({
  name: "spin",
  shouldAttach(entry) {
    return typeof entry.spinSpeed === "number" && entry.spinSpeed > 0;
  },
  create(entry) {
    return createSpinProcessor({
      spinSpeed: entry.spinSpeed,
      spinDirection: entry.spinDirection,
    });
  },
});

/**
 * Orbital Processor
 *
 * Attaches orbital motion and orientation to layers
 * Moves layers in circular paths around a center point
 * Can also orient layers to face the center (like a clock hand)
 */
registerProcessor({
  name: "orbital",
  shouldAttach(entry) {
    return Boolean(
      entry.orbitStagePoint !== undefined ||
        entry.orbitOrient === true ||
        (entry.orbitSpeed !== undefined && entry.orbitSpeed !== 0) ||
        entry.orbitLine === true ||
        entry.orbitLinePoint !== undefined ||
        entry.orbitImagePoint !== undefined,
    );
  },
  create(entry) {
    return createOrbitalProcessor({
      orbitStagePoint: entry.orbitStagePoint as [number, number] | undefined,
      orbitLinePoint: entry.orbitLinePoint as [number, number] | undefined,
      orbitImagePoint: entry.orbitImagePoint as [number, number] | undefined,
      orbitLine: entry.orbitLine,
      orbitSpeed: entry.orbitSpeed,
      orbitDirection: entry.orbitDirection,
    });
  },
});

// ============================================================================
// SECTION 3: ANIMATION UTILITIES
// ============================================================================
// This section contains helper functions for animations and calculations.
//
// CATEGORIES:
// - Constants: Math constants for angle conversions
// - Angle utilities: Conversion, normalization, direction
// - Orbital calculations: Position, angle, visibility
// - Easing functions: For smooth animations
//
// FOR FUTURE AI AGENTS:
// - Use these functions in your processors instead of reimplementing
// - All angles in degrees unless specified (radians only for Math functions)
// - Coordinate system: 0° = right, 90° = down, 180° = left, 270° = up
// ============================================================================

/**
 * Animation constants for common calculations
 *
 * FOR FUTURE AI AGENTS:
 * Use these instead of Math.PI directly for clarity and consistency.
 */
export const AnimationConstants = {
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,
  TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2,
  QUARTER_PI: Math.PI / 4,
} as const;

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * AnimationConstants.DEG_TO_RAD;
}

/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * AnimationConstants.RAD_TO_DEG;
}

/**
 * Normalize angle to 0-360 range
 *
 * Converts any angle to equivalent angle in 0-360 range.
 * Handles negative angles and angles > 360.
 *
 * @param angle - Angle in degrees (can be any value)
 * @returns Normalized angle in 0-360 range
 *
 * @example
 * normalizeAngle(450) // returns 90
 * normalizeAngle(-45) // returns 315
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate elapsed time from timestamp and start time
 *
 * Helper for time-based animations. If startTime is undefined,
 * treats timestamp as elapsed time.
 *
 * @param timestamp - Current timestamp in milliseconds
 * @param startTime - Animation start timestamp (optional)
 * @returns Object with elapsed time and effective start time
 */
export function calculateElapsedTime(
  timestamp: number,
  startTime?: number,
): { elapsed: number; effectiveStartTime: number } {
  if (startTime === undefined) {
    return { elapsed: timestamp, effectiveStartTime: 0 };
  }
  const elapsed = timestamp - startTime;
  return { elapsed, effectiveStartTime: startTime };
}

/**
 * Apply rotation direction to angle
 *
 * Converts clockwise/counter-clockwise to positive/negative angle.
 * CW = positive (standard), CCW = negative
 *
 * @param angle - Angle in degrees
 * @param direction - "cw" (clockwise) or "ccw" (counter-clockwise)
 * @returns Signed angle (positive for CW, negative for CCW)
 */
export function applyRotationDirection(angle: number, direction: "cw" | "ccw"): number {
  return direction === "ccw" ? -angle : angle;
}

/**
 * Calculate position on circular orbit
 *
 * Given a center point, radius, and angle, calculates the position
 * on the circle. Used for orbital motion.
 *
 * COORDINATE SYSTEM:
 * - 0° = right (positive X)
 * - 90° = down (positive Y)
 * - 180° = left (negative X)
 * - 270° = up (negative Y)
 *
 * @param center - Center point of orbit
 * @param radius - Orbit radius in pixels
 * @param angleInDegrees - Angle in degrees (0 = right)
 * @returns Position on orbit circle
 *
 * @example
 * calculateOrbitPosition({ x: 1024, y: 1024 }, 200, 90)
 * // returns { x: 1024, y: 1224 } (200 pixels down from center)
 */
export function calculateOrbitPosition(
  center: { x: number; y: number },
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } {
  const angleRad = degreesToRadians(angleInDegrees);
  return {
    x: center.x + radius * Math.cos(angleRad),
    y: center.y + radius * Math.sin(angleRad),
  };
}

/**
 * Calculate angle from center to point
 *
 * Inverse of calculateOrbitPosition. Given a center and a point,
 * calculates the angle from center to point.
 *
 * @param center - Center point
 * @param point - Target point
 * @returns Angle in degrees (0 = right, 90 = down)
 *
 * @example
 * calculateAngleToPoint({ x: 1024, y: 1024 }, { x: 1224, y: 1024 })
 * // returns 0 (point is to the right)
 */
export function calculateAngleToPoint(
  center: { x: number; y: number },
  point: { x: number; y: number },
): number {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return radiansToDegrees(Math.atan2(dy, dx));
}

/**
 * Check if point is within bounds (with optional margin)
 *
 * @param point - Point to check
 * @param bounds - Bounds (min and max for both x and y)
 * @param margin - Optional margin for bounds checking
 * @returns true if point is within bounds
 */
export function isPointInBounds(
  point: { x: number; y: number },
  bounds: { min: number; max: number },
  margin: number = 0,
): boolean {
  return (
    point.x >= bounds.min - margin &&
    point.x <= bounds.max + margin &&
    point.y >= bounds.min - margin &&
    point.y <= bounds.max + margin
  );
}

/**
 * Calculate if orbital layer is visible on stage
 *
 * Checks if layer's bounding box intersects with stage bounds.
 * Used to skip rendering off-screen orbital elements.
 *
 * @param position - Layer center position
 * @param dimensions - Layer dimensions (width, height)
 * @param stageBounds - Stage bounds (min and max)
 * @returns true if layer is visible on stage
 */
export function calculateOrbitalVisibility(
  position: { x: number; y: number },
  dimensions: { width: number; height: number },
  stageBounds: { min: number; max: number },
): boolean {
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;

  return !(
    position.x + halfWidth < stageBounds.min ||
    position.x - halfWidth > stageBounds.max ||
    position.y + halfHeight < stageBounds.min ||
    position.y - halfHeight > stageBounds.max
  );
}

/**
 * Ease-in-out quadratic easing function
 *
 * Smooth acceleration and deceleration.
 * @param t - Progress (0 to 1)
 * @returns Eased value (0 to 1)
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Elastic easing out function
 *
 * Creates a bouncy/elastic effect at the end.
 * @param t - Progress (0 to 1)
 * @returns Eased value (0 to 1)
 */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Bounce easing out function
 *
 * Creates a bouncing effect at the end.
 * @param t - Progress (0 to 1)
 * @returns Eased value (0 to 1)
 */
export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  }
  if (t < 2 / d1) {
    const p = t - 1.5 / d1;
    return n1 * p * p + 0.75;
  }
  if (t < 2.5 / d1) {
    const p = t - 2.25 / d1;
    return n1 * p * p + 0.9375;
  }
  const p = t - 2.625 / d1;
  return n1 * p * p + 0.984375;
}

// ============================================================================
// SECTION 4: PERFORMANCE UTILITIES
// ============================================================================
// This section contains utilities for optimizing layer rendering performance.
//
// UTILITIES:
// - PipelineCache: Frame-based caching to avoid redundant calculations
// - StaticLayerBuffer: Offscreen canvas for static (non-animated) layers
// - Layer batching: Groups layers by animation type for optimized rendering
//
// FOR FUTURE AI AGENTS:
// - Use PipelineCache in renderers to cache layer processing results per frame
// - Use StaticLayerBuffer for layers that don't animate (saves CPU/GPU)
// - Use batchLayersByAnimation to optimize rendering order
// ============================================================================

/**
 * Frame-based cache for pipeline results
 *
 * Caches layer processing results per frame. Useful when the same layer
 * might be processed multiple times in one frame (avoid redundant work).
 *
 * USAGE IN RENDERERS:
 * - Call nextFrame() at start of each render frame
 * - Use get() with factory function to cache expensive calculations
 * - Cache automatically invalidates on nextFrame()
 *
 * @template T - Type of cached value (defaults to EnhancedLayerData)
 *
 * @example
 * const cache = new PipelineCache<EnhancedLayerData>();
 *
 * function renderFrame() {
 *   cache.nextFrame(); // Invalidate previous frame's cache
 *
 *   for (const layer of layers) {
 *     const enhanced = cache.get(layer.LayerID, () =>
 *       runPipeline(layer.data, layer.processors, timestamp)
 *     );
 *     renderLayer(enhanced);
 *   }
 * }
 */
export class PipelineCache<T = EnhancedLayerData> {
  private frameId: number = 0;
  private cache = new Map<string, { frameId: number; value: T }>();

  /**
   * Get cached value or compute it using factory
   * @param layerId - Unique identifier for this layer
   * @param factory - Function to compute value if not cached
   * @returns Cached or newly computed value
   */
  get(layerId: string, factory: () => T): T {
    const cached = this.cache.get(layerId);
    if (cached && cached.frameId === this.frameId) {
      return cached.value;
    }
    const value = factory();
    this.cache.set(layerId, { frameId: this.frameId, value });
    return value;
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Move to next frame (invalidates all cached values)
   * Call this at the start of each render frame
   */
  nextFrame(): void {
    this.clear();
    this.frameId++;
  }

  /**
   * Get current frame ID
   */
  getFrameId(): number {
    return this.frameId;
  }
}

/**
 * Create a new pipeline cache
 *
 * Convenience function for creating typed caches.
 *
 * @template T - Type of cached value
 * @returns New PipelineCache instance
 *
 * @example
 * const cache = createPipelineCache<EnhancedLayerData>();
 */
export function createPipelineCache<T = EnhancedLayerData>(): PipelineCache<T> {
  return new PipelineCache<T>();
}

/**
 * Offscreen canvas buffer for static layers
 *
 * Renders static (non-animated) layers once to an offscreen canvas,
 * then composites the result in each frame. Much faster than re-rendering
 * static layers every frame.
 *
 * USAGE:
 * 1. Create buffer with layer dimensions
 * 2. Render layer to buffer.getContext() once
 * 3. Call buffer.markRendered()
 * 4. Each frame, call buffer.compositeTo(mainCanvas)
 *
 * FOR FUTURE AI AGENTS:
 * Only use this for truly static layers (no spin, orbit, or animation).
 * Animated layers should be rendered directly each frame.
 */
export class StaticLayerBuffer {
  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  private isRendered = false;

  constructor(width: number, height: number) {
    if (typeof OffscreenCanvas !== "undefined") {
      this.offscreenCanvas = new OffscreenCanvas(width, height);
      this.offscreenCtx = this.offscreenCanvas.getContext("2d");
    }
  }

  /**
   * Get the offscreen canvas context for rendering
   * @returns 2D rendering context or null if not supported
   */
  getContext(): OffscreenCanvasRenderingContext2D | null {
    return this.offscreenCtx;
  }

  /**
   * Mark this buffer as rendered (contains valid content)
   */
  markRendered(): void {
    this.isRendered = true;
  }

  /**
   * Check if buffer has been rendered
   */
  isAlreadyRendered(): boolean {
    return this.isRendered;
  }

  /**
   * Composite this buffer onto a main canvas
   * @param ctx - Main canvas 2D context
   * @param x - X position to composite at
   * @param y - Y position to composite at
   */
  compositeTo(ctx: CanvasRenderingContext2D, x: number = 0, y: number = 0): void {
    if (this.offscreenCanvas && this.isRendered) {
      ctx.drawImage(this.offscreenCanvas, x, y);
    }
  }

  /**
   * Check if OffscreenCanvas is supported in this environment
   */
  static isSupported(): boolean {
    return typeof OffscreenCanvas !== "undefined";
  }
}

/**
 * Batched layers by animation type
 *
 * Groups layers into categories for optimized rendering:
 * - static: No animation (can be cached/buffered)
 * - spinOnly: Only spin animation
 * - orbital: Orbital motion (with or without spin)
 * - complex: Multiple animations
 */
export type LayerBatch<T> = {
  static: T[];
  spinOnly: T[];
  orbital: T[];
  complex: T[];
};

/**
 * Batch layers by animation type
 *
 * Groups layers for optimized rendering. Renderers can use this to:
 * - Render static layers once and cache
 * - Optimize transformation matrices per animation type
 * - Schedule updates based on animation complexity
 *
 * @param layers - Array of enhanced layers
 * @returns Batched layers grouped by animation type
 *
 * @example
 * const batches = batchLayersByAnimation(enhancedLayers);
 * renderStaticLayers(batches.static); // Render once, cache
 * batches.orbital.forEach(renderOrbitalLayer); // Update position each frame
 */
export function batchLayersByAnimation<
  T extends {
    hasSpinAnimation?: boolean;
    hasOrbitalAnimation?: boolean;
    isStatic?: boolean;
  },
>(layers: T[]): LayerBatch<T> {
  const batched: LayerBatch<T> = {
    static: [],
    spinOnly: [],
    orbital: [],
    complex: [],
  };

  for (const layer of layers) {
    if (layer.isStatic) {
      batched.static.push(layer);
    } else if (layer.hasOrbitalAnimation) {
      if (layer.hasSpinAnimation) {
        batched.complex.push(layer);
      } else {
        batched.orbital.push(layer);
      }
    } else if (layer.hasSpinAnimation) {
      batched.spinOnly.push(layer);
    } else {
      batched.static.push(layer);
    }
  }

  return batched;
}

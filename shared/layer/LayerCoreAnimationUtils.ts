/**
 * ============================================================================
 * ANIMATION UTILITIES
 * Shared functions for animation processors and rendering engines
 * ============================================================================
 */

// ============================================================================
// SECTION 1: MATH CONSTANTS & CONVERSIONS
// ============================================================================

/**
 * Pre-calculated constants for performance
 * Use these instead of calculating Math.PI / 180 every frame
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
 */
export function degreesToRadians(degrees: number): number {
  return degrees * AnimationConstants.DEG_TO_RAD;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * AnimationConstants.RAD_TO_DEG;
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate elapsed time with optional start time
 * For continuous animations without a start time, use timestamp directly as elapsed time
 */
export function calculateElapsedTime(
  timestamp: number,
  startTime?: number,
): { elapsed: number; effectiveStartTime: number } {
  if (startTime === undefined) {
    // For continuous animations, use timestamp directly as elapsed time
    return { elapsed: timestamp, effectiveStartTime: 0 };
  }
  const elapsed = timestamp - startTime;
  return { elapsed, effectiveStartTime: startTime };
}

/**
 * Apply rotation direction multiplier
 */
export function applyRotationDirection(angle: number, direction: "cw" | "ccw"): number {
  return direction === "ccw" ? -angle : angle;
}

/**
 * Calculate position on circular orbit
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
 * Check if point is within bounds
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
 * Calculate visibility for orbital animations
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
 * Smooth animation easing (optional)
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Frame rate calculation helper
 */
export class FrameRateTracker {
  private frameTimes: number[] = [];
  private maxSamples: number = 60;

  addFrame(timestamp: number): void {
    this.frameTimes.push(timestamp);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }

  getCurrentFPS(): number {
    if (this.frameTimes.length < 2) return 0;

    const lastTime = this.frameTimes[this.frameTimes.length - 1];
    const firstTime = this.frameTimes[0];

    if (lastTime === undefined || firstTime === undefined) return 0;

    const timeSpan = lastTime - firstTime;
    const frameCount = this.frameTimes.length - 1;

    return Math.round((frameCount / timeSpan) * 1000);
  }

  reset(): void {
    this.frameTimes = [];
  }
}

// ============================================================================
// SECTION 2: PERFORMANCE UTILITIES - PIPELINE CACHING
// ============================================================================

/**
 * Pipeline result cache for reducing duplicate calculations per frame
 * Use this to cache runPipeline() results when the same layer is processed multiple times
 */
export class PipelineCache {
  private cache = new Map<string, unknown>();
  private frameId: number = 0;

  get<T>(key: string, computeFn: () => T): T {
    if (!this.cache.has(key)) {
      this.cache.set(key, computeFn());
    }
    return this.cache.get(key) as T;
  }

  clear(): void {
    this.cache.clear();
  }

  nextFrame(): void {
    this.clear();
    this.frameId++;
  }

  getFrameId(): number {
    return this.frameId;
  }
}

export function createPipelineCache(): PipelineCache {
  return new PipelineCache();
}

// ============================================================================
// SECTION 3: PERFORMANCE UTILITIES - STATIC LAYER OPTIMIZATION
// ============================================================================

/**
 * OffscreenCanvas helper for rendering static layers once
 */
export class StaticLayerBuffer {
  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  private isRendered: boolean = false;

  constructor(width: number, height: number) {
    if (typeof OffscreenCanvas !== "undefined") {
      this.offscreenCanvas = new OffscreenCanvas(width, height);
      this.offscreenCtx = this.offscreenCanvas.getContext("2d");
    }
  }

  getContext(): OffscreenCanvasRenderingContext2D | null {
    return this.offscreenCtx;
  }

  markRendered(): void {
    this.isRendered = true;
  }

  isAlreadyRendered(): boolean {
    return this.isRendered;
  }

  compositeTo(ctx: CanvasRenderingContext2D, x: number = 0, y: number = 0): void {
    if (this.offscreenCanvas && this.isRendered) {
      ctx.drawImage(this.offscreenCanvas, x, y);
    }
  }

  static isSupported(): boolean {
    return typeof OffscreenCanvas !== "undefined";
  }
}

// ============================================================================
// SECTION 4: PERFORMANCE UTILITIES - RENDER OPTIMIZATION
// ============================================================================

/**
 * Throttled debug renderer - renders debug visuals at lower FPS
 */
export class ThrottledDebugRenderer {
  private frameCounter: number = 0;
  private throttleFactor: number;

  constructor(throttleFactor: number = 2) {
    this.throttleFactor = Math.max(1, Math.floor(throttleFactor));
  }

  shouldRender(): boolean {
    this.frameCounter++;
    return this.frameCounter % this.throttleFactor === 0;
  }

  reset(): void {
    this.frameCounter = 0;
  }

  setThrottleFactor(factor: number): void {
    this.throttleFactor = Math.max(1, Math.floor(factor));
  }
}

export type LayerBatch<T> = {
  static: T[];
  spinOnly: T[];
  orbital: T[];
  complex: T[];
};

/**
 * Batch layers by animation type for optimized rendering
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

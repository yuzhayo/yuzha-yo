import type { UniversalLayerData } from "./LayerCore";
import type {
  ImageMappingDebugVisuals,
  ImageMappingDebugConfig,
} from "./LayerCorePipelineImageMappingUtils";

// Pipeline processor function type - now accepts optional timestamp and returns EnhancedLayerData
export type LayerProcessor = (layer: UniversalLayerData, timestamp?: number) => EnhancedLayerData;

/**
 * Enhanced universal layer data that can include additional properties from processors
 *
 * Base properties (from UniversalLayerData):
 * - imageMapping: Calculated by LayerCorePipelineImageMapping.computeImageMapping() in LayerCore.prepareLayer()
 *   Contains image geometry (center, tip, base, dimensions, axis angle, rotation, center offset)
 * - calculation: Precomputed coordinate aliases (stage/image/percent) for center, tip, base, spin, and orbit points
 *   - spinPoint resolved from config spinStagePoint (stage pixels) and spinImagePoint (image percent) with fallbacks
 *
 * Processor-added properties:
 */
export type EnhancedLayerData = UniversalLayerData & {
  // Spin properties (added by LayerCorePipelineSpin)
  spinCenter?: { x: number; y: number };
  spinSpeed?: number;
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
  orbitSpeed?: number;
  orbitDirection?: "cw" | "ccw";
  currentOrbitAngle?: number;
  hasOrbitalAnimation?: boolean;
  visible?: boolean;
  orbitPoint?: { x: number; y: number };
  orbitLineStyle?: {
    radius: number;
    visible: boolean;
  };

  // Image Mapping Debug properties (added by LayerCorePipelineImageMappingDebug)
  imageMappingDebugVisuals?: ImageMappingDebugVisuals;
  imageMappingDebugConfig?: Partial<ImageMappingDebugConfig>;

  // Future properties will be added here by other processors
  opacity?: number;
  filters?: string[];
};

/**
 * Run layer data through a pipeline of processors
 * Each processor can add or modify properties
 * @param baseLayer - The base layer data
 * @param processors - Array of processors to apply
 * @param timestamp - Optional timestamp for time-based processors
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
 */
export function processBatch(
  baseLayers: UniversalLayerData[],
  processors: LayerProcessor[],
  timestamp?: number,
): EnhancedLayerData[] {
  return baseLayers.map((layer) => runPipeline(layer, processors, timestamp));
}

// ============================================================================
// Animation utilities (migrated from LayerCoreAnimationUtils.ts)
// ============================================================================

export const AnimationConstants = {
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,
  TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2,
  QUARTER_PI: Math.PI / 4,
} as const;

export function degreesToRadians(degrees: number): number {
  return degrees * AnimationConstants.DEG_TO_RAD;
}

export function radiansToDegrees(radians: number): number {
  return radians * AnimationConstants.RAD_TO_DEG;
}

export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

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

export function applyRotationDirection(angle: number, direction: "cw" | "ccw"): number {
  return direction === "ccw" ? -angle : angle;
}

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

export function calculateAngleToPoint(
  center: { x: number; y: number },
  point: { x: number; y: number },
): number {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return radiansToDegrees(Math.atan2(dy, dx));
}

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

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

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

export class PipelineCache<T = EnhancedLayerData> {
  private frameId: number = 0;
  private cache = new Map<string, { frameId: number; value: T }>();

  get(layerId: string, factory: () => T): T {
    const cached = this.cache.get(layerId);
    if (cached && cached.frameId === this.frameId) {
      return cached.value;
    }
    const value = factory();
    this.cache.set(layerId, { frameId: this.frameId, value });
    return value;
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

export function createPipelineCache<T = EnhancedLayerData>(): PipelineCache<T> {
  return new PipelineCache<T>();
}

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

export class ThrottledDebugRenderer {
  private frameCounter = 0;
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

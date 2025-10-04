import type { UniversalLayerData } from "./LayerCore";
import type { EnhancedLayerData, LayerProcessor } from "./LayerCorePipeline";

export type SpinConfig = {
  spinCenter?: [number, number] | { x: number; y: number }; // 0-100% relative to image dimensions
  spinSpeed?: number; // degrees per second, 0 = no spin
  spinDirection?: "cw" | "ccw";
};

/**
 * Create a spin processor with the given configuration
 * spinCenter: [x, y] array or {x, y} object in 0-100% coordinates relative to image dimensions
 * spinSpeed: degrees per second (0 = no spin, default = 0)
 * spinDirection: "cw" (clockwise) or "ccw" (counter-clockwise), default = "cw"
 */
export function createSpinProcessor(config: SpinConfig): LayerProcessor {
  const spinSpeed = config.spinSpeed ?? 0;
  const spinDirection = config.spinDirection ?? "cw";

  // Normalize spinCenter to {x, y} format (accept both array and object)
  let spinCenter: { x: number; y: number } | undefined;
  if (config.spinCenter) {
    if (Array.isArray(config.spinCenter)) {
      spinCenter = { x: config.spinCenter[0], y: config.spinCenter[1] };
    } else {
      spinCenter = config.spinCenter;
    }

    // Validate and clamp spinCenter to 0-100 range
    if (spinCenter.x < 0 || spinCenter.x > 100 || spinCenter.y < 0 || spinCenter.y > 100) {
      console.warn(
        `[SpinProcessor] spinCenter out of range (0-100): {x: ${spinCenter.x}, y: ${spinCenter.y}}. Clamping.`,
      );
      spinCenter = {
        x: Math.max(0, Math.min(100, spinCenter.x)),
        y: Math.max(0, Math.min(100, spinCenter.y)),
      };
    }
  }

  // Track start time for this processor instance
  let startTime: number | null = null;

  return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
    // STATIC MODE: No spin speed - return layer as-is (cast to EnhancedLayerData)
    // hasSpinAnimation is undefined, which is falsy - same behavior, no allocation
    if (spinSpeed === 0) {
      return layer as EnhancedLayerData;
    }

    // SPIN MODE: Calculate time-based rotation
    // Initialize start time on first call with timestamp
    const currentTime = timestamp ?? performance.now();
    if (startTime === null) {
      startTime = currentTime;
    }

    // Calculate rotation based on elapsed time
    const elapsed = currentTime - startTime;
    const elapsedSeconds = elapsed / 1000;
    let rotation = (elapsedSeconds * spinSpeed) % 360;

    // Apply direction
    if (spinDirection === "ccw") {
      rotation = -rotation;
    }

    // Calculate spin center position in pixel coordinates
    // Default to image center if not specified
    let spinCenterPixels = {
      x: layer.imageMapping.imageCenter.x,
      y: layer.imageMapping.imageCenter.y,
    };

    if (spinCenter) {
      // Convert 0-100% to absolute pixel coordinates relative to image
      const { width, height } = layer.imageMapping.imageDimensions;
      spinCenterPixels = {
        x: (spinCenter.x / 100) * width,
        y: (spinCenter.y / 100) * height,
      };
    }

    return {
      ...layer,
      spinCenter: spinCenterPixels,
      spinSpeed,
      spinDirection,
      currentRotation: rotation,
      hasSpinAnimation: true,
    };
  };
}

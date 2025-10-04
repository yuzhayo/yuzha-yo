import type { UniversalLayerData } from "./LayerCore";
import type { LayerProcessor } from "./LayerCorePipeline";

export type SpinConfig = {
  spinCenter?: { x: number; y: number }; // 0-100% relative to image dimensions
  spinSpeed?: number; // degrees per second, 0 = no spin
  spinDirection?: "cw" | "ccw";
};

/**
 * Create a spin processor with the given configuration
 * spinCenter: { x, y } in 0-100% coordinates relative to image dimensions
 * spinSpeed: degrees per second (0 = no spin, default = 0)
 * spinDirection: "cw" (clockwise) or "ccw" (counter-clockwise), default = "cw"
 */
export function createSpinProcessor(config: SpinConfig): LayerProcessor {
  const spinSpeed = config.spinSpeed ?? 0;
  const spinDirection = config.spinDirection ?? "cw";
  const spinCenter = config.spinCenter;

  return (layer: UniversalLayerData) => {
    // If spinSpeed is 0, no spinning - return layer as-is
    if (spinSpeed === 0) {
      return layer;
    }

    // Calculate spin center position
    // Default to image center if not specified
    let spinCenterAbsolute = {
      x: layer.imageMapping.imageCenter.x,
      y: layer.imageMapping.imageCenter.y,
    };

    if (spinCenter) {
      // Convert 0-100% to absolute pixel coordinates
      const { width, height } = layer.imageMapping.imageDimensions;
      spinCenterAbsolute = {
        x: (spinCenter.x / 100) * width,
        y: (spinCenter.y / 100) * height,
      };
    }

    // Calculate current rotation based on time
    // This will be used by the renderer to apply rotation
    const now = performance.now();
    const elapsedSeconds = now / 1000;

    let rotation = (elapsedSeconds * spinSpeed) % 360;

    // Reverse direction if counter-clockwise
    if (spinDirection === "ccw") {
      rotation = -rotation;
    }

    return {
      ...layer,
      spinCenter: spinCenterAbsolute,
      spinSpeed,
      spinDirection,
      currentRotation: rotation,
    };
  };
}

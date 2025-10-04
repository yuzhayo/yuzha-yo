import type { EnhancedLayerData } from "./LayerCorePipeline";
import type { LayerProcessor } from "./LayerCorePipeline";
import { runPipeline } from "./LayerCorePipeline";

const STAGE_SIZE = 2048;

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

type TransformCache = {
  scaledWidth: number;
  scaledHeight: number;
  centerX: number;
  centerY: number;
  pivotX: number;
  pivotY: number;
  dx: number;
  dy: number;
  hasRotation: boolean;
};

type LayerRenderData = {
  image: HTMLImageElement;
  baseData: EnhancedLayerData;
  processors: LayerProcessor[];
  transformCache: TransformCache;
  isStatic: boolean;
};

export async function mountCanvasLayers(
  ctx: CanvasRenderingContext2D,
  layersWithProcessors: Array<{
    data: EnhancedLayerData;
    processors: LayerProcessor[];
  }>,
): Promise<() => void> {
  const layers: LayerRenderData[] = [];

  // Load all images and pre-calculate transforms
  for (const item of layersWithProcessors) {
    try {
      const image = await loadImage(item.data.imageUrl);

      // Determine if layer is static by running processors once and checking result
      // A layer is static if it has no processors OR if running processors yields no animation flags
      let isStatic = item.processors.length === 0;
      if (!isStatic && item.processors.length > 0) {
        // Run pipeline once to check if it produces animation
        const testData = runPipeline(item.data, item.processors, 0);
        isStatic = !testData.hasSpinAnimation; // Static if no spin animation flag
      }

      // Pre-calculate transform constants
      const scaledWidth = image.width * item.data.scale.x;
      const scaledHeight = image.height * item.data.scale.y;
      const centerX = (image.width / 2) * item.data.scale.x;
      const centerY = (image.height / 2) * item.data.scale.y;

      // Use imageMapping for static rotation pivot
      const pivot = item.data.imageMapping.imageCenter;
      const pivotX = pivot.x * item.data.scale.x;
      const pivotY = pivot.y * item.data.scale.y;
      const dx = centerX - pivotX;
      const dy = centerY - pivotY;

      const displayRotation = item.data.imageMapping.displayRotation ?? 0;
      const hasRotation = displayRotation !== 0;

      const transformCache: TransformCache = {
        scaledWidth,
        scaledHeight,
        centerX,
        centerY,
        pivotX,
        pivotY,
        dx,
        dy,
        hasRotation,
      };

      console.log(`[LayerEngineCanvas] Loaded layer "${item.data.layerId}":`, {
        imageId: item.data.imageId,
        imageDimensions: `${image.width}x${image.height}`,
        position: item.data.position,
        scale: item.data.scale,
        isStatic,
      });

      layers.push({
        image,
        baseData: item.data,
        processors: item.processors,
        transformCache,
        isStatic,
      });
    } catch (error) {
      console.error(`[LayerEngineCanvas] Failed to load image for "${item.data.imageId}"`, error);
    }
  }

  const staticCount = layers.filter((l) => l.isStatic).length;
  const animatedCount = layers.length - staticCount;
  console.log(
    `[LayerEngineCanvas] Total layers loaded: ${layers.length} (${staticCount} static, ${animatedCount} animated)`,
  );

  // Cache for static layers - calculate once, reuse forever
  const staticLayerCache = new Map<string, EnhancedLayerData>();

  for (const layer of layers) {
    if (layer.isStatic) {
      // Pre-calculate static layer data once
      const staticData =
        layer.processors.length > 0
          ? runPipeline(layer.baseData, layer.processors, 0)
          : layer.baseData;
      staticLayerCache.set(layer.baseData.layerId, staticData);
    }
  }

  const render = (timestamp: number) => {
    ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);

    for (const layer of layers) {
      const { image, baseData, processors, transformCache, isStatic } = layer;

      // Use cached data for static layers, calculate for animated layers
      const layerData: EnhancedLayerData = isStatic
        ? (staticLayerCache.get(baseData.layerId) ?? baseData)
        : processors.length > 0
          ? runPipeline(baseData, processors, timestamp)
          : baseData;

      // Determine rotation mode
      const isSpinning = layerData.hasSpinAnimation === true;
      const rotation = isSpinning
        ? (layerData.currentRotation ?? 0)
        : (layerData.imageMapping.displayRotation ?? 0);

      if (rotation !== 0) {
        // Rotating layer - use transform cache for constants, calculate pivot
        ctx.save();

        const pivot = isSpinning
          ? (layerData.spinCenter ?? layerData.imageMapping.imageCenter)
          : layerData.imageMapping.imageCenter;

        // Re-calculate pivot offset only if spinning (pivot may change)
        const pivotX = pivot.x * layerData.scale.x;
        const pivotY = pivot.y * layerData.scale.y;
        const dx = transformCache.centerX - pivotX;
        const dy = transformCache.centerY - pivotY;

        // Transform: move to image center, offset to pivot, rotate, offset back, draw centered
        ctx.translate(layerData.position.x, layerData.position.y);
        ctx.translate(-dx, -dy);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(dx, dy);
        ctx.drawImage(
          image,
          -transformCache.centerX,
          -transformCache.centerY,
          transformCache.scaledWidth,
          transformCache.scaledHeight,
        );

        ctx.restore();
      } else {
        // No rotation - draw centered at position (no save/restore needed)
        const x = layerData.position.x - transformCache.scaledWidth / 2;
        const y = layerData.position.y - transformCache.scaledHeight / 2;
        ctx.drawImage(image, x, y, transformCache.scaledWidth, transformCache.scaledHeight);
      }
    }
  };

  // Check if any layers need animation
  const hasAnimatedLayers = animatedCount > 0;

  let animationId: number | undefined;

  if (hasAnimatedLayers) {
    // Continuous animation for animated layers
    const animate = (timestamp: number) => {
      render(timestamp);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    console.log(`[LayerEngineCanvas] Starting animation loop (${animatedCount} animated layers)`);
  } else {
    // Static scene - render once
    render(0);
    console.log("[LayerEngineCanvas] Static scene - rendered once, no animation loop");
  }

  return () => {
    if (animationId !== undefined) {
      cancelAnimationFrame(animationId);
    }
  };
}

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

type LayerRenderData = {
  image: HTMLImageElement;
  baseData: EnhancedLayerData;
  processors: LayerProcessor[];
};

export async function mountCanvasLayers(
  ctx: CanvasRenderingContext2D,
  layersWithProcessors: Array<{
    data: EnhancedLayerData;
    processors: LayerProcessor[];
  }>,
): Promise<() => void> {
  const layers: LayerRenderData[] = [];

  // Load all images
  for (const item of layersWithProcessors) {
    try {
      const image = await loadImage(item.data.imageUrl);

      console.log(`[LayerEngineCanvas] Loaded layer "${item.data.layerId}":`, {
        imageId: item.data.imageId,
        imageDimensions: `${image.width}x${image.height}`,
        position: item.data.position,
        scale: item.data.scale,
      });

      layers.push({
        image,
        baseData: item.data,
        processors: item.processors,
      });
    } catch (error) {
      console.error(`[LayerEngineCanvas] Failed to load image for "${item.data.imageId}"`, error);
    }
  }

  console.log(`[LayerEngineCanvas] Total layers loaded: ${layers.length}`);

  const render = (timestamp: number) => {
    ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);

    for (const layer of layers) {
      const { image, baseData, processors } = layer;

      // Run pipeline to get enhanced data with current rotation
      const layerData: EnhancedLayerData =
        processors.length > 0 ? runPipeline(baseData, processors, timestamp) : baseData;

      const width = image.width * layerData.scale.x;
      const height = image.height * layerData.scale.y;

      ctx.save();

      // Determine rotation mode
      const isSpinning = layerData.hasSpinAnimation === true;
      const rotation = isSpinning
        ? (layerData.currentRotation ?? 0)
        : (layerData.imageMapping.displayRotation ?? 0);

      const pivot = isSpinning
        ? (layerData.spinCenter ?? layerData.imageMapping.imageCenter)
        : layerData.imageMapping.imageCenter;

      if (rotation !== 0) {
        // Rotate around pivot point while keeping image visually centered
        // Calculate image center and pivot in scaled coordinates
        const centerX = (image.width / 2) * layerData.scale.x;
        const centerY = (image.height / 2) * layerData.scale.y;
        const pivotX = pivot.x * layerData.scale.x;
        const pivotY = pivot.y * layerData.scale.y;

        // Offset from image center to pivot
        const dx = centerX - pivotX;
        const dy = centerY - pivotY;

        // Transform: move to image center, offset to pivot, rotate, offset back, draw centered
        ctx.translate(layerData.position.x, layerData.position.y); // Move to image center position
        ctx.translate(-dx, -dy); // Move to pivot position
        ctx.rotate((rotation * Math.PI) / 180); // Rotate around pivot
        ctx.translate(dx, dy); // Move back to center
        ctx.drawImage(image, -centerX, -centerY, width, height); // Draw centered
      } else {
        // No rotation - draw centered at position
        const x = layerData.position.x - width / 2;
        const y = layerData.position.y - height / 2;
        ctx.drawImage(image, x, y, width, height);
      }

      ctx.restore();
    }
  };

  let animationId: number;
  const animate = (timestamp: number) => {
    render(timestamp);
    animationId = requestAnimationFrame(animate);
  };
  animationId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animationId);
  };
}

import type { UniversalLayerData } from "./LayerCore";
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

type LayerWithProcessors = {
  baseLayer: UniversalLayerData;
  processors: LayerProcessor[];
};

export async function mountCanvasLayers(
  ctx: CanvasRenderingContext2D,
  layersWithProcessors: LayerWithProcessors[],
): Promise<() => void> {
  const layers: Array<{
    image: HTMLImageElement;
    baseLayer: UniversalLayerData;
    processors: LayerProcessor[];
  }> = [];

  // Load all images
  for (const item of layersWithProcessors) {
    try {
      const image = await loadImage(item.baseLayer.imageUrl);

      console.log(`[LayerEngineCanvas] Loaded layer "${item.baseLayer.layerId}":`, {
        imageId: item.baseLayer.imageId,
        imageDimensions: `${image.width}x${image.height}`,
        position: item.baseLayer.position,
        scale: item.baseLayer.scale,
      });

      layers.push({
        image,
        baseLayer: item.baseLayer,
        processors: item.processors,
      });
    } catch (error) {
      console.error(
        `[LayerEngineCanvas] Failed to load image for "${item.baseLayer.imageId}"`,
        error,
      );
    }
  }

  console.log(`[LayerEngineCanvas] Total layers loaded: ${layers.length}`);

  const render = (timestamp: number) => {
    ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);

    for (const layer of layers) {
      const { image, baseLayer, processors } = layer;

      // Run pipeline with current timestamp to get enhanced data
      const data = runPipeline(baseLayer, processors, timestamp);

      const width = image.width * data.scale.x;
      const height = image.height * data.scale.y;

      ctx.save();

      // Combine display rotation (from base→tip axis) with spin rotation
      const displayRotation = baseLayer.imageMapping.displayRotation ?? 0;
      const spinRotation = data.currentRotation ?? 0;
      const totalRotation = displayRotation + spinRotation;

      if (totalRotation !== 0 && data.spinCenter) {
        // Rotate around custom spin center
        // spinCenter is already in pixel coordinates relative to image
        const spinCenterScaled = {
          x: data.spinCenter.x * data.scale.x,
          y: data.spinCenter.y * data.scale.y,
        };

        // Translate to world position of spin center
        ctx.translate(
          data.position.x - width / 2 + spinCenterScaled.x,
          data.position.y - height / 2 + spinCenterScaled.y,
        );

        // Rotate around this point
        ctx.rotate((totalRotation * Math.PI) / 180);

        // Translate back so image draws from correct position
        ctx.translate(-spinCenterScaled.x, -spinCenterScaled.y);

        // Draw image
        ctx.drawImage(image, 0, 0, width, height);
      } else if (totalRotation !== 0) {
        // Rotation without custom spin center - rotate around image center
        ctx.translate(data.position.x, data.position.y);
        ctx.rotate((totalRotation * Math.PI) / 180);
        ctx.translate(-width / 2, -height / 2);
        ctx.drawImage(image, 0, 0, width, height);
      } else {
        // No rotation - draw centered at position
        const x = data.position.x - width / 2;
        const y = data.position.y - height / 2;
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

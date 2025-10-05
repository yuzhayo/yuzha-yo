import type { EnhancedLayerData } from "./LayerCorePipeline";
import type { LayerProcessor } from "./LayerCorePipeline";
import { runPipeline } from "./LayerCorePipeline";
import { CanvasDebugRenderer } from "./LayerCorePipelineImageMappingUtils";

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

      // All layers are static since processors are empty
      const isStatic = item.processors.length === 0;

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

  console.log(`[LayerEngineCanvas] Total layers loaded: ${layers.length} (all static)`);

  // Split layers by rotation for optimal rendering
  const noRotationLayers: LayerRenderData[] = [];
  const withRotationLayers: LayerRenderData[] = [];

  for (const layer of layers) {
    if (layer.transformCache.hasRotation) {
      withRotationLayers.push(layer);
    } else {
      noRotationLayers.push(layer);
    }
  }

  // Static scene - render once
  ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);

  // Render layers without rotation
  for (const layer of noRotationLayers) {
    const { image, baseData, transformCache } = layer;
    const x = baseData.position.x - transformCache.scaledWidth / 2;
    const y = baseData.position.y - transformCache.scaledHeight / 2;
    ctx.drawImage(image, x, y, transformCache.scaledWidth, transformCache.scaledHeight);
  }

  // Render layers with rotation
  for (const layer of withRotationLayers) {
    const { image, baseData, transformCache } = layer;
    const rotation = baseData.imageMapping.displayRotation ?? 0;

    ctx.save();
    const dx = transformCache.dx;
    const dy = transformCache.dy;

    ctx.translate(baseData.position.x, baseData.position.y);
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
  }

  console.log("[LayerEngineCanvas] Static scene - rendered once");

  // Render debug visuals after all layers
  for (const layer of layers) {
    if (layer.processors.length > 0) {
      const enhancedData = runPipeline(layer.baseData, layer.processors);
      if (enhancedData.imageMappingDebugVisuals) {
        CanvasDebugRenderer.drawAll(ctx, enhancedData.imageMappingDebugVisuals);
      }
    }
  }

  return () => {};
}

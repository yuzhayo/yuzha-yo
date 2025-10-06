import type { EnhancedLayerData } from "./LayerCorePipeline";
import type { LayerProcessor } from "./LayerCorePipeline";
import { runPipeline } from "./LayerCorePipeline";
import { CanvasDebugRenderer } from "./LayerCorePipelineImageMappingUtils";
import { loadImage } from "./LayerCore";

const STAGE_SIZE = 2048;

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
  hasAnimation: boolean;
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
      const hasAnimation = !isStatic; // Track if layer needs animation loop

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
        hasAnimation,
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

  // Determine if we need animation loop
  const hasAnyAnimation = layers.some((layer) => layer.hasAnimation);

  if (hasAnyAnimation) {
    console.log("[LayerEngineCanvas] Starting 60fps animation loop for dynamic layers");

    let animationFrameId: number | null = null;

    const renderFrame = (timestamp: number) => {
      // Clear canvas
      ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);

      // Render all layers (static and animated)
      for (const layer of noRotationLayers) {
        if (layer.hasAnimation) {
          // Process through pipeline with current timestamp
          const enhancedData = runPipeline(layer.baseData, layer.processors, timestamp);

          // Render with updated position/rotation
          const x = enhancedData.position.x - layer.transformCache.scaledWidth / 2;
          const y = enhancedData.position.y - layer.transformCache.scaledHeight / 2;

          // Check if layer has animation rotation
          if (enhancedData.currentRotation !== undefined) {
            ctx.save();
            ctx.translate(enhancedData.position.x, enhancedData.position.y);
            ctx.rotate((enhancedData.currentRotation * Math.PI) / 180);
            ctx.drawImage(
              layer.image,
              -layer.transformCache.centerX,
              -layer.transformCache.centerY,
              layer.transformCache.scaledWidth,
              layer.transformCache.scaledHeight,
            );
            ctx.restore();
          } else {
            ctx.drawImage(
              layer.image,
              x,
              y,
              layer.transformCache.scaledWidth,
              layer.transformCache.scaledHeight,
            );
          }
        } else {
          // Static layer - simple render
          const { image, baseData, transformCache } = layer;
          const x = baseData.position.x - transformCache.scaledWidth / 2;
          const y = baseData.position.y - transformCache.scaledHeight / 2;
          ctx.drawImage(image, x, y, transformCache.scaledWidth, transformCache.scaledHeight);
        }
      }

      // Render layers with rotation (similar logic)
      for (const layer of withRotationLayers) {
        if (layer.hasAnimation) {
          const enhancedData = runPipeline(layer.baseData, layer.processors, timestamp);
          const rotation =
            enhancedData.currentRotation ?? layer.baseData.imageMapping.displayRotation ?? 0;

          ctx.save();
          const dx = layer.transformCache.dx;
          const dy = layer.transformCache.dy;

          ctx.translate(enhancedData.position.x, enhancedData.position.y);
          ctx.translate(-dx, -dy);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(dx, dy);
          ctx.drawImage(
            layer.image,
            -layer.transformCache.centerX,
            -layer.transformCache.centerY,
            layer.transformCache.scaledWidth,
            layer.transformCache.scaledHeight,
          );
          ctx.restore();
        } else {
          // Static layer with rotation
          const { image, baseData, transformCache } = layer;
          const rotation = baseData.imageMapping.displayRotation ?? 0;

          ctx.save();
          ctx.translate(baseData.position.x, baseData.position.y);
          ctx.translate(-transformCache.dx, -transformCache.dy);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(transformCache.dx, transformCache.dy);
          ctx.drawImage(
            image,
            -transformCache.centerX,
            -transformCache.centerY,
            transformCache.scaledWidth,
            transformCache.scaledHeight,
          );
          ctx.restore();
        }
      }

      // Render debug visuals
      for (const layer of layers) {
        if (layer.hasAnimation) {
          const enhancedData = runPipeline(layer.baseData, layer.processors, timestamp);
          if (enhancedData.imageMappingDebugVisuals) {
            CanvasDebugRenderer.drawAll(ctx, enhancedData.imageMappingDebugVisuals, STAGE_SIZE);
          }
        }
      }

      // Continue animation loop
      animationFrameId = requestAnimationFrame(renderFrame);
    };

    // Start animation loop
    animationFrameId = requestAnimationFrame(renderFrame);

    // Return cleanup function
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        console.log("[LayerEngineCanvas] Animation loop stopped");
      }
    };
  } else {
    // Static scene rendering (existing code)
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
      // Always run pipeline if there are processors (to generate debug visuals)
      const enhancedData =
        layer.processors.length > 0
          ? runPipeline(layer.baseData, layer.processors)
          : layer.baseData;

      if (enhancedData.imageMappingDebugVisuals) {
        CanvasDebugRenderer.drawAll(ctx, enhancedData.imageMappingDebugVisuals);
      }
    }

    return () => {};
  }
}

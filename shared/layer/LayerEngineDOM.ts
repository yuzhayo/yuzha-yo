import type { EnhancedLayerData } from "./LayerCorePipeline";
import type { LayerProcessor } from "./LayerCorePipeline";
import { runPipeline } from "./LayerCorePipeline";
import { loadImage } from "./LayerCore";
import { AnimationConstants, createPipelineCache } from "./LayerCoreAnimationUtils";

const STAGE_SIZE = 2048;

type LayerElement = {
  container: HTMLDivElement;
  img: HTMLImageElement;
  baseData: EnhancedLayerData;
  processors: LayerProcessor[];
  isStatic: boolean;
  hasAnimation: boolean;
};

export async function mountDOMLayers(
  containerEl: HTMLDivElement,
  layersWithProcessors: Array<{
    data: EnhancedLayerData;
    processors: LayerProcessor[];
  }>,
): Promise<() => void> {
  const layers: LayerElement[] = [];

  // Clear container
  containerEl.innerHTML = "";
  containerEl.style.position = "relative";
  containerEl.style.width = `${STAGE_SIZE}px`;
  containerEl.style.height = `${STAGE_SIZE}px`;

  // Load all images and create DOM elements
  for (const item of layersWithProcessors) {
    try {
      const img = await loadImage(item.data.imageUrl);

      // Create container div for this layer
      const layerDiv = document.createElement("div");
      layerDiv.style.position = "absolute";
      layerDiv.style.pointerEvents = "none";

      // Calculate transform based on imageMapping
      const { position, scale, rotation } = item.data;
      const displayRotation = rotation ?? 0;

      // Get the natural image dimensions
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      // Apply image to layer - use natural dimensions
      img.style.width = `${naturalWidth}px`;
      img.style.height = `${naturalHeight}px`;
      img.style.maxWidth = "none";
      img.style.maxHeight = "none";
      img.style.display = "block";
      img.style.position = "absolute";

      // Transform origin is the center for both scaling and rotation
      img.style.transformOrigin = "center center";

      // Position the image using natural dimensions (CSS transform will handle scaling from center)
      // Since transform-origin is center, the element scales from its center point
      const left = position.x - naturalWidth / 2;
      const top = position.y - naturalHeight / 2;

      img.style.left = `${left}px`;
      img.style.top = `${top}px`;

      // Apply both scale and rotation transforms
      const transforms: string[] = [];
      if (scale.x !== 1 || scale.y !== 1) {
        transforms.push(`scale(${scale.x}, ${scale.y})`);
      }
      if (displayRotation !== 0) {
        transforms.push(`rotate(${displayRotation}deg)`);
      }
      if (transforms.length > 0) {
        img.style.transform = transforms.join(" ");
      }

      layerDiv.appendChild(img);
      containerEl.appendChild(layerDiv);

      const isStatic = item.processors.length === 0;
      const hasAnimation = !isStatic;

      console.log(`[LayerEngineDOM] Loaded layer "${item.data.layerId}":`, {
        imageId: item.data.imageId,
        imageDimensions: `${naturalWidth}x${naturalHeight}`,
        position: item.data.position,
        scale: item.data.scale,
        rotation: displayRotation,
        isStatic,
      });

      layers.push({
        container: layerDiv,
        img,
        baseData: item.data,
        processors: item.processors,
        isStatic,
        hasAnimation,
      });
    } catch (error) {
      console.error(`[LayerEngineDOM] Failed to load image for "${item.data.imageId}"`, error);
    }
  }

  const staticCount = layers.filter((l) => l.isStatic).length;
  const animatedCount = layers.length - staticCount;

  console.log(
    `[LayerEngineDOM] Total layers loaded: ${layers.length} (${staticCount} static, ${animatedCount} animated)`,
  );

  const hasAnyAnimation = layers.some((layer) => layer.hasAnimation);

  if (hasAnyAnimation) {
    console.log("[LayerEngineDOM] Starting 60fps animation loop for dynamic layers");

    let animationFrameId: number | null = null;
    const pipelineCache = createPipelineCache();

    const animate = (timestamp: number) => {
      for (const layer of layers) {
        if (layer.hasAnimation && layer.processors.length > 0) {
          const enhancedData = pipelineCache.get(layer.baseData.layerId, () =>
            runPipeline(layer.baseData, layer.processors, timestamp),
          );

          const transforms: string[] = [];
          if (enhancedData.scale.x !== 1 || enhancedData.scale.y !== 1) {
            transforms.push(`scale(${enhancedData.scale.x}, ${enhancedData.scale.y})`);
          }

          const rotation = enhancedData.currentRotation ?? enhancedData.rotation ?? 0;
          if (rotation !== 0) {
            transforms.push(`rotate(${rotation}deg)`);
          }

          if (transforms.length > 0) {
            layer.img.style.transform = transforms.join(" ");
          }

          const naturalWidth = layer.img.naturalWidth;
          const naturalHeight = layer.img.naturalHeight;
          const left = enhancedData.position.x - naturalWidth / 2;
          const top = enhancedData.position.y - naturalHeight / 2;

          layer.img.style.left = `${left}px`;
          layer.img.style.top = `${top}px`;

          if (enhancedData.visible !== undefined) {
            layer.img.style.display = enhancedData.visible ? "block" : "none";
          }
        }
      }

      pipelineCache.nextFrame();
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        console.log("[LayerEngineDOM] Animation loop stopped");
      }
      containerEl.innerHTML = "";
    };
  } else {
    console.log("[LayerEngineDOM] Static scene - no animation loop");

    return () => {
      containerEl.innerHTML = "";
    };
  }
}

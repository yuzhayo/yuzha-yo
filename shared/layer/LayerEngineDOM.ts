import type { EnhancedLayerData } from "./LayerCorePipeline";
import type { LayerProcessor } from "./LayerCorePipeline";

const STAGE_SIZE = 2048;

type LayerElement = {
  container: HTMLDivElement;
  img: HTMLImageElement;
  baseData: EnhancedLayerData;
  processors: LayerProcessor[];
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
      const { position, scale, imageMapping } = item.data;
      const displayRotation = imageMapping.displayRotation ?? 0;

      // Get the natural image dimensions
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      // Apply image to layer - use natural dimensions
      img.style.width = `${naturalWidth}px`;
      img.style.height = `${naturalHeight}px`;
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
      const transforms = [];
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

      console.log(`[LayerEngineDOM] Loaded layer "${item.data.layerId}":`, {
        imageId: item.data.imageId,
        imageDimensions: `${naturalWidth}x${naturalHeight}`,
        position: item.data.position,
        scale: item.data.scale,
        rotation: displayRotation,
      });

      layers.push({
        container: layerDiv,
        img,
        baseData: item.data,
        processors: item.processors,
      });
    } catch (error) {
      console.error(`[LayerEngineDOM] Failed to load image for "${item.data.imageId}"`, error);
    }
  }

  console.log(`[LayerEngineDOM] Total layers loaded: ${layers.length}`);

  // Cleanup function
  return () => {
    containerEl.innerHTML = "";
  };
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

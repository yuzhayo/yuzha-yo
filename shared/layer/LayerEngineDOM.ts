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

      // Calculate the position to place the image
      // Position is where we want the image center to be
      const scaledWidth = img.width * scale.x;
      const scaledHeight = img.height * scale.y;

      // Apply image to layer
      img.style.width = `${scaledWidth}px`;
      img.style.height = `${scaledHeight}px`;
      img.style.display = "block";
      img.style.position = "absolute";

      // Transform origin is the image center (default)
      img.style.transformOrigin = "center center";

      // Position the image so its center is at the desired position
      const left = position.x - scaledWidth / 2;
      const top = position.y - scaledHeight / 2;

      img.style.left = `${left}px`;
      img.style.top = `${top}px`;

      // Apply rotation
      if (displayRotation !== 0) {
        img.style.transform = `rotate(${displayRotation}deg)`;
      }

      layerDiv.appendChild(img);
      containerEl.appendChild(layerDiv);

      console.log(`[LayerEngineDOM] Loaded layer "${item.data.layerId}":`, {
        imageId: item.data.imageId,
        imageDimensions: `${img.width}x${img.height}`,
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

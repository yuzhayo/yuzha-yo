import type { UniversalLayerData } from "./LayerCore";

const STAGE_SIZE = 2048;

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function mountCanvasLayers(
  ctx: CanvasRenderingContext2D,
  layerDataArray: UniversalLayerData[],
): Promise<() => void> {
  const layers: Array<{
    image: HTMLImageElement;
    data: UniversalLayerData;
  }> = [];

  // Load all images
  for (const layerData of layerDataArray) {
    try {
      const image = await loadImage(layerData.imageUrl);

      console.log(`[LayerEngineCanvas] Loaded layer "${layerData.layerId}":`, {
        imageId: layerData.imageId,
        imageDimensions: `${image.width}x${image.height}`,
        position: layerData.position,
        scale: layerData.scale,
      });

      layers.push({
        image,
        data: layerData,
      });
    } catch (error) {
      console.error(
        `[LayerEngineCanvas] Failed to load image for "${layerData.imageId}"`,
        error,
      );
    }
  }

  console.log(`[LayerEngineCanvas] Total layers loaded: ${layers.length}`);

  const render = () => {
    ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);

    for (const layer of layers) {
      const { image, data } = layer;

      const width = image.width * data.scale.x;
      const height = image.height * data.scale.y;

      ctx.save();

      const displayRotation = data.imageMapping.displayRotation ?? 0;

      if (displayRotation !== 0) {
        // Rotate around image center
        ctx.translate(data.position.x, data.position.y);
        ctx.rotate((displayRotation * Math.PI) / 180);
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
  const animate = () => {
    render();
    animationId = requestAnimationFrame(animate);
  };
  animationId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animationId);
  };
}

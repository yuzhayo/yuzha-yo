import type { EnhancedLayerData } from "./LayerCorePipeline";

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
  layersData: EnhancedLayerData[],
): Promise<() => void> {
  const layers: Array<{
    image: HTMLImageElement;
    data: EnhancedLayerData;
  }> = [];

  // Load all images
  for (const data of layersData) {
    try {
      const image = await loadImage(data.imageUrl);

      console.log(`[LayerEngineCanvas] Loaded layer "${data.layerId}":`, {
        imageId: data.imageId,
        imageDimensions: `${image.width}x${image.height}`,
        position: data.position,
        scale: data.scale,
        spinSpeed: data.spinSpeed,
      });

      layers.push({ image, data });
    } catch (error) {
      console.error(`[LayerEngineCanvas] Failed to load image for "${data.imageId}"`, error);
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

      // Calculate current rotation if spin is enabled
      const spinSpeed = data.spinSpeed ?? 0;
      if (spinSpeed > 0) {
        // Calculate rotation based on current time
        const now = performance.now();
        const elapsedSeconds = now / 1000;
        let rotation = (elapsedSeconds * spinSpeed) % 360;

        // Reverse direction if counter-clockwise
        if (data.spinDirection === "ccw") {
          rotation = -rotation;
        }

        // Translate to spin center
        const spinCenterX = data.spinCenter?.x ?? image.width / 2;
        const spinCenterY = data.spinCenter?.y ?? image.height / 2;

        ctx.translate(data.position.x, data.position.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-spinCenterX * data.scale.x, -spinCenterY * data.scale.y);

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
  animate();

  return () => {
    cancelAnimationFrame(animationId);
  };
}

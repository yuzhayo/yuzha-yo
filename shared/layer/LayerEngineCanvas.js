import { compute2DTransform } from "./LayerCore";
import registryData from "../config/ImageRegistry.json" assert { type: "json" };
const STAGE_SIZE = 2048;
const registry = registryData;
const pathMap = new Map(registry.map((entry) => [entry.id, entry.path]));
function resolveAssetUrl(path) {
    if (!path.toLowerCase().startsWith("shared/asset/")) {
        throw new Error(`Unsupported asset path: ${path}`);
    }
    const relative = path.replace(/^shared\/asset\//i, "../Asset/");
    return new URL(relative, import.meta.url).href;
}
async function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
export async function mountCanvasLayers(ctx, entries) {
    const layers = [];
    for (const entry of entries) {
        const assetPath = pathMap.get(entry.imageId);
        if (!assetPath) {
            console.warn(`[LayerEngineCanvas] Missing asset for imageId "${entry.imageId}"`);
            continue;
        }
        try {
            const image = await loadImage(resolveAssetUrl(assetPath));
            const { position, scale } = compute2DTransform(entry, STAGE_SIZE);
            console.log(`[LayerEngineCanvas] Loaded layer "${entry.layerId}" (order: ${entry.order}):`, {
                imageId: entry.imageId,
                imageDimensions: `${image.width}x${image.height}`,
                position,
                scale,
            });
            layers.push({ image, position, scale });
        }
        catch (error) {
            console.error(`[LayerEngineCanvas] Failed to load image for "${entry.imageId}"`, error);
        }
    }
    console.log(`[LayerEngineCanvas] Total layers loaded: ${layers.length}`);
    const render = () => {
        ctx.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);
        for (const layer of layers) {
            const width = layer.image.width * layer.scale.x;
            const height = layer.image.height * layer.scale.y;
            const x = layer.position.x - width / 2;
            const y = layer.position.y - height / 2;
            ctx.drawImage(layer.image, x, y, width, height);
        }
    };
    let animationId;
    const animate = () => {
        render();
        animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
        cancelAnimationFrame(animationId);
    };
}

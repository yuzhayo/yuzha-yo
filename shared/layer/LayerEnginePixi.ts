import { Assets, Sprite } from "pixi.js";
import type { Application as PixiApplication } from "pixi.js";
import type { LayerConfigEntry } from "../config/Config";
import { compute2DTransform } from "./LayerCore";
import registryData from "../config/ImageRegistry.json" assert { type: "json" };

const STAGE_SIZE = 2048;

const registry = registryData as Array<{ id: string; path: string }>;
const pathMap = new Map(registry.map((entry) => [entry.id, entry.path]));

function resolveAssetUrl(path: string): string {
  if (!path.startsWith("shared/asset/")) {
    throw new Error(`Unsupported asset path: ${path}`);
  }
  const relative = path.replace(/^shared\//, "../");
  return new URL(relative, import.meta.url).href;
}

export async function mountPixiLayers(app: PixiApplication, entries: LayerConfigEntry[]): Promise<() => void> {
  const sprites: Sprite[] = [];
  for (const entry of entries) {
    const assetPath = pathMap.get(entry.imageId);
    if (!assetPath) {
      console.warn(`[LayerEnginePixi] Missing asset for imageId "${entry.imageId}"`);
      continue;
    }

    const texture = await Assets.load(resolveAssetUrl(assetPath));
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);

    const { position, scale } = compute2DTransform(entry, STAGE_SIZE);
    sprite.position.set(position.x, position.y);
    sprite.scale.set(scale.x, scale.y);

    app.stage.addChild(sprite);
    sprites.push(sprite);
  }

  return () => {
    for (const sprite of sprites) {
      sprite.destroy();
    }
  };
}

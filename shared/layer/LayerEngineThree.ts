import * as THREE from "three";
import type { LayerConfigEntry } from "../config/Config";
import { compute2DTransform } from "./LayerCore";
import registryData from "../config/ImageRegistry.json" assert { type: "json" };

const STAGE_SIZE = 2048;

const registry = registryData as Array<{ id: string; path: string }>;
const pathMap = new Map(registry.map((entry) => [entry.id, entry.path]));

function resolveAssetUrl(path: string): string {
  if (!path.toLowerCase().startsWith("shared/asset/")) {
    throw new Error(`Unsupported asset path: ${path}`);
  }
  const relative = path.replace(/^shared\/asset\//i, "../Asset/");
  return new URL(relative, import.meta.url).href;
}

export async function mountThreeLayers(
  scene: THREE.Scene,
  entries: LayerConfigEntry[],
): Promise<() => void> {
  const meshes: THREE.Mesh[] = [];
  const textureLoader = new THREE.TextureLoader();

  for (const entry of entries) {
    const assetPath = pathMap.get(entry.imageId);
    if (!assetPath) {
      console.warn(`[LayerEngineThree] Missing asset for imageId "${entry.imageId}"`);
      continue;
    }

    const texture = await textureLoader.loadAsync(resolveAssetUrl(assetPath));
    texture.colorSpace = THREE.SRGBColorSpace;
    const { position, scale } = compute2DTransform(entry, STAGE_SIZE);

    const planeGeometry = new THREE.PlaneGeometry(
      texture.image.width * scale.x,
      texture.image.height * scale.y,
    );

    const planeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    mesh.position.set(position.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - position.y, 0);

    scene.add(mesh);
    meshes.push(mesh);
  }

  return () => {
    for (const mesh of meshes) {
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
      scene.remove(mesh);
    }
  };
}

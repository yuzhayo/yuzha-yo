import * as THREE from "three";
import type { UniversalLayerData } from "./LayerCore";

const STAGE_SIZE = 2048;

export async function mountThreeLayers(
  scene: THREE.Scene,
  layerDataArray: UniversalLayerData[],
): Promise<() => void> {
  const meshes: THREE.Mesh[] = [];
  const textureLoader = new THREE.TextureLoader();

  // Load all textures in parallel
  const texturePromises = layerDataArray.map(async (layerData) => {
    try {
      const texture = await textureLoader.loadAsync(layerData.imageUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 1;
      texture.generateMipmaps = false;

      return { layerData, texture };
    } catch (error) {
      console.error(`[LayerEngineThree] Failed to load texture for "${layerData.imageId}"`, error);
      return null;
    }
  });

  const results = await Promise.all(texturePromises);

  // Create meshes
  for (const result of results) {
    if (!result) continue;

    const { layerData, texture } = result;

    const width = texture.image.width * layerData.scale.x;
    const height = texture.image.height * layerData.scale.y;

    const planeGeometry = new THREE.PlaneGeometry(width, height);

    const planeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(planeGeometry, planeMaterial);

    // Position the mesh in Three.js coordinate system
    mesh.position.set(
      layerData.position.x - STAGE_SIZE / 2,
      STAGE_SIZE / 2 - layerData.position.y,
      0,
    );

    // Apply display rotation from base→tip axis
    const displayRotation = layerData.imageMapping.displayRotation ?? 0;
    if (displayRotation !== 0) {
      mesh.rotation.z = (displayRotation * Math.PI) / 180;
    }

    scene.add(mesh);
    meshes.push(mesh);
  }

  return () => {
    for (const mesh of meshes) {
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        const material = mesh.material as THREE.MeshBasicMaterial;
        if (material.map) {
          material.map.dispose();
        }
        material.dispose();
      }
      scene.remove(mesh);
    }
  };
}

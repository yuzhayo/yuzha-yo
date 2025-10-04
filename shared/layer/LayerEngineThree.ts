import * as THREE from "three";
import type { EnhancedLayerData } from "./LayerCorePipeline";

const STAGE_SIZE = 2048;

export async function mountThreeLayers(
  scene: THREE.Scene,
  layersData: EnhancedLayerData[],
): Promise<() => void> {
  const meshes: THREE.Mesh[] = [];
  const meshData: Array<{ mesh: THREE.Mesh; data: EnhancedLayerData }> = [];
  const textureLoader = new THREE.TextureLoader();

  // Check if any layer has spin enabled
  const hasSpinningLayers = layersData.some((data) => (data.spinSpeed ?? 0) > 0);

  // Load all textures in parallel
  const texturePromises = layersData.map(async (data) => {
    try {
      const texture = await textureLoader.loadAsync(data.imageUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 1;
      texture.generateMipmaps = false;

      return { data, texture };
    } catch (error) {
      console.error(`[LayerEngineThree] Failed to load texture for "${data.imageId}"`, error);
      return null;
    }
  });

  const results = await Promise.all(texturePromises);

  // Create meshes
  for (const result of results) {
    if (!result) continue;

    const { data, texture } = result;

    const width = texture.image.width * data.scale.x;
    const height = texture.image.height * data.scale.y;

    const planeGeometry = new THREE.PlaneGeometry(width, height);

    const planeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(planeGeometry, planeMaterial);

    // Position the mesh
    mesh.position.set(data.position.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - data.position.y, 0);

    scene.add(mesh);
    meshes.push(mesh);
    meshData.push({ mesh, data });
  }

  // Animation loop for spinning layers
  let animationId: number | null = null;

  if (hasSpinningLayers) {
    const animate = () => {
      // Update rotation for spinning meshes
      for (const { mesh, data } of meshData) {
        const spinSpeed = data.spinSpeed ?? 0;
        if (spinSpeed > 0) {
          const now = performance.now();
          const elapsedSeconds = now / 1000;
          let rotation = (elapsedSeconds * spinSpeed) % 360;

          // Reverse direction if counter-clockwise
          if (data.spinDirection === "ccw") {
            rotation = -rotation;
          }

          mesh.rotation.z = (rotation * Math.PI) / 180;
        }
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  return () => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }

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

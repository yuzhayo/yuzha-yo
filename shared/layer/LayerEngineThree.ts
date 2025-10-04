import * as THREE from "three";
import type { UniversalLayerData } from "./LayerCore";
import type { LayerProcessor } from "./LayerCorePipeline";
import { runPipeline } from "./LayerCorePipeline";

const STAGE_SIZE = 2048;

type LayerWithProcessors = {
  baseLayer: UniversalLayerData;
  processors: LayerProcessor[];
};

export async function mountThreeLayers(
  scene: THREE.Scene,
  layersWithProcessors: LayerWithProcessors[],
): Promise<() => void> {
  const meshes: THREE.Mesh[] = [];
  const layerData: Array<{
    mesh: THREE.Mesh;
    baseLayer: UniversalLayerData;
    processors: LayerProcessor[];
  }> = [];
  const textureLoader = new THREE.TextureLoader();

  // Always run animation loop to process pipeline per frame
  const hasSpinningLayers = true;

  // Load all textures in parallel
  const texturePromises = layersWithProcessors.map(async (item) => {
    try {
      const texture = await textureLoader.loadAsync(item.baseLayer.imageUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 1;
      texture.generateMipmaps = false;

      return { item, texture };
    } catch (error) {
      console.error(
        `[LayerEngineThree] Failed to load texture for "${item.baseLayer.imageId}"`,
        error,
      );
      return null;
    }
  });

  const results = await Promise.all(texturePromises);

  // Create meshes
  for (const result of results) {
    if (!result) continue;

    const { item, texture } = result;
    const { baseLayer } = item;

    const width = texture.image.width * baseLayer.scale.x;
    const height = texture.image.height * baseLayer.scale.y;

    const planeGeometry = new THREE.PlaneGeometry(width, height);

    const planeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(planeGeometry, planeMaterial);

    // Position the mesh
    mesh.position.set(
      baseLayer.position.x - STAGE_SIZE / 2,
      STAGE_SIZE / 2 - baseLayer.position.y,
      0,
    );

    scene.add(mesh);
    meshes.push(mesh);
    layerData.push({
      mesh,
      baseLayer: item.baseLayer,
      processors: item.processors,
    });
  }

  // Animation loop for spinning layers
  let animationId: number | null = null;

  if (hasSpinningLayers) {
    const animate = (timestamp: number) => {
      // Update rotation for meshes using pipeline
      for (const { mesh, baseLayer, processors } of layerData) {
        // Run pipeline with current timestamp
        const enhanced = runPipeline(baseLayer, processors, timestamp);

        const rotationDeg = enhanced.currentRotation ?? 0;

        if (rotationDeg !== 0) {
          // Apply rotation
          mesh.rotation.z = (rotationDeg * Math.PI) / 180;

          // If spinCenter is specified, adjust pivot point
          if (enhanced.spinCenter) {
            // In Three.js, we need to offset the mesh position to rotate around a custom point
            // The spinCenter is in pixel coordinates relative to image top-left
            const centerOffset = {
              x: enhanced.spinCenter.x - enhanced.imageMapping.imageCenter.x,
              y: enhanced.spinCenter.y - enhanced.imageMapping.imageCenter.y,
            };

            // Apply scale to the offset
            const scaledOffset = {
              x: centerOffset.x * baseLayer.scale.x,
              y: centerOffset.y * baseLayer.scale.y,
            };

            // Calculate rotated offset
            const angle = (rotationDeg * Math.PI) / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rotatedOffset = {
              x: scaledOffset.x * cos - scaledOffset.y * sin,
              y: scaledOffset.x * sin + scaledOffset.y * cos,
            };

            // Adjust position to rotate around spinCenter
            mesh.position.set(
              baseLayer.position.x - STAGE_SIZE / 2 - rotatedOffset.x + scaledOffset.x,
              STAGE_SIZE / 2 - baseLayer.position.y + rotatedOffset.y - scaledOffset.y,
              0,
            );
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
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

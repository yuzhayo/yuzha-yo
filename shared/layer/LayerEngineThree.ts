import * as THREE from "three";
import type { EnhancedLayerData } from "./LayerCorePipeline";
import type { LayerProcessor } from "./LayerCorePipeline";
import { runPipeline } from "./LayerCorePipeline";

const STAGE_SIZE = 2048;

type MeshRenderData = {
  mesh: THREE.Mesh;
  baseData: EnhancedLayerData;
  processors: LayerProcessor[];
};

export async function mountThreeLayers(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  layersWithProcessors: Array<{
    data: EnhancedLayerData;
    processors: LayerProcessor[];
  }>,
): Promise<() => void> {
  const meshData: MeshRenderData[] = [];
  const textureLoader = new THREE.TextureLoader();

  // Load all textures in parallel
  const texturePromises = layersWithProcessors.map(async (item) => {
    try {
      const texture = await textureLoader.loadAsync(item.data.imageUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 1;
      texture.generateMipmaps = false;

      return { item, texture };
    } catch (error) {
      console.error(
        `[LayerEngineThree] Failed to load texture for "${item.data.imageId}"`,
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
    const { data, processors } = item;

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

    // Position the mesh in Three.js coordinate system
    mesh.position.set(data.position.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - data.position.y, 0);

    console.log(`[LayerEngineThree] Loaded layer "${data.layerId}":`, {
      imageId: data.imageId,
      imageDimensions: `${texture.image.width}x${texture.image.height}`,
      position: data.position,
      scale: data.scale,
    });

    scene.add(mesh);
    meshData.push({
      mesh,
      baseData: data,
      processors,
    });
  }

  console.log(`[LayerEngineThree] Total layers loaded: ${meshData.length}`);

  // Animation loop
  let animationId: number;
  const animate = (timestamp: number) => {
    // Update each mesh based on pipeline output
    for (const item of meshData) {
      const { mesh, baseData, processors } = item;

      // Run pipeline to get enhanced data with current rotation
      const layerData: EnhancedLayerData =
        processors.length > 0 ? runPipeline(baseData, processors, timestamp) : baseData;

      // Determine rotation mode
      const isSpinning = layerData.hasSpinAnimation === true;

      if (isSpinning) {
        // SPIN MODE: Use currentRotation from processor
        const rotation = layerData.currentRotation ?? 0;
        mesh.rotation.z = (rotation * Math.PI) / 180;
      } else {
        // STATIC MODE: Use displayRotation from imageMapping
        const displayRotation = layerData.imageMapping.displayRotation ?? 0;
        mesh.rotation.z = (displayRotation * Math.PI) / 180;
      }
    }

    // Render the scene
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  };
  animationId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animationId);
    for (const item of meshData) {
      const { mesh } = item;
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

import * as THREE from "three";
import type { EnhancedLayerData } from "./LayerCorePipeline";
import type { LayerProcessor } from "./LayerCorePipeline";
import { runPipeline } from "./LayerCorePipeline";

const STAGE_SIZE = 2048;

type MeshRenderData = {
  mesh: THREE.Mesh;
  group: THREE.Group; // Group for handling off-center rotation
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
      console.error(`[LayerEngineThree] Failed to load texture for "${item.data.imageId}"`, error);
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

    // Create a group to handle rotation around off-center pivot
    const group = new THREE.Group();

    // Position the group at the layer position in Three.js coordinate system
    group.position.set(data.position.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - data.position.y, 0);

    // Mesh will be offset within the group for pivot rotation
    // Initially, mesh is at center (no offset)
    mesh.position.set(0, 0, 0);

    group.add(mesh);
    scene.add(group);

    console.log(`[LayerEngineThree] Loaded layer "${data.layerId}":`, {
      imageId: data.imageId,
      imageDimensions: `${texture.image.width}x${texture.image.height}`,
      position: data.position,
      scale: data.scale,
    });

    meshData.push({
      mesh,
      group,
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
      const { mesh, group, baseData, processors } = item;

      // Run pipeline to get enhanced data with current rotation
      const layerData: EnhancedLayerData =
        processors.length > 0 ? runPipeline(baseData, processors, timestamp) : baseData;

      // Determine rotation mode
      const isSpinning = layerData.hasSpinAnimation === true;
      const rotation = isSpinning
        ? (layerData.currentRotation ?? 0)
        : (layerData.imageMapping.displayRotation ?? 0);

      const pivot = isSpinning
        ? (layerData.spinCenter ?? layerData.imageMapping.imageCenter)
        : layerData.imageMapping.imageCenter;

      // Calculate offset for pivot rotation
      // In Three.js, we need to offset the mesh within the group
      const imageCenter = layerData.imageMapping.imageCenter;
      const centerX = imageCenter.x * layerData.scale.x;
      const centerY = imageCenter.y * layerData.scale.y;
      const pivotX = pivot.x * layerData.scale.x;
      const pivotY = pivot.y * layerData.scale.y;

      // Offset from center to pivot (in Three.js Y-up coordinates)
      const dx = centerX - pivotX;
      const dy = -(centerY - pivotY); // Negate Y for Three.js coordinate system

      // Position mesh offset within group so pivot is at origin
      mesh.position.set(dx, dy, 0);

      // Rotate the group around its origin (which is now at the pivot point)
      group.rotation.z = (rotation * Math.PI) / 180;
    }

    // Render the scene
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  };
  animationId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animationId);
    for (const item of meshData) {
      const { mesh, group } = item;
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        const material = mesh.material as THREE.MeshBasicMaterial;
        if (material.map) {
          material.map.dispose();
        }
        material.dispose();
      }
      group.remove(mesh);
      scene.remove(group);
    }
  };
}

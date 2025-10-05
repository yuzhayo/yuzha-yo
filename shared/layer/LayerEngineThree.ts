import * as THREE from "three";
import type { EnhancedLayerData } from "./LayerCorePipeline";
import type { LayerProcessor } from "./LayerCorePipeline";
import { runPipeline } from "./LayerCorePipeline";
import { ThreeDebugRenderer } from "./LayerCorePipelineImageMappingUtils";

const STAGE_SIZE = 2048;

type TransformCache = {
  scaledWidth: number;
  scaledHeight: number;
  imageCenter: { x: number; y: number };
  hasRotation: boolean;
};

type MeshRenderData = {
  mesh: THREE.Mesh;
  group: THREE.Group;
  baseData: EnhancedLayerData;
  processors: LayerProcessor[];
  transformCache: TransformCache;
  isStatic: boolean;
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

  // Create meshes and pre-calculate transforms
  for (const result of results) {
    if (!result) continue;

    const { item, texture } = result;
    const { data, processors } = item;

    // All layers are static since processors are empty
    const isStatic = processors.length === 0;

    // Pre-calculate transform constants
    const scaledWidth = texture.image.width * data.scale.x;
    const scaledHeight = texture.image.height * data.scale.y;
    const imageCenter = { ...data.imageMapping.imageCenter };
    const displayRotation = data.imageMapping.displayRotation ?? 0;
    const hasRotation = displayRotation !== 0;

    const transformCache: TransformCache = {
      scaledWidth,
      scaledHeight,
      imageCenter,
      hasRotation,
    };

    const planeGeometry = new THREE.PlaneGeometry(scaledWidth, scaledHeight);

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
      isStatic,
    });

    meshData.push({
      mesh,
      group,
      baseData: data,
      processors,
      transformCache,
      isStatic,
    });
  }

  const staticCount = meshData.filter((m) => m.isStatic).length;
  const animatedCount = meshData.length - staticCount;

  console.log(
    `[LayerEngineThree] Total layers loaded: ${meshData.length} (${staticCount} static, ${animatedCount} animated)`,
  );

  // Apply static transforms once
  for (const item of meshData) {
    const { mesh, group, baseData } = item;

    // Use only basic display rotation
    const rotation = baseData.imageMapping.displayRotation ?? 0;

    // No pivot offset needed for basic rotation - mesh stays centered in group
    mesh.position.set(0, 0, 0);

    // Rotate the group around its center
    group.rotation.z = (rotation * Math.PI) / 180;
  }

  // Add debug visuals to the scene
  const debugMeshes: THREE.Object3D[] = [];
  for (const item of meshData) {
    if (item.processors.length > 0) {
      const enhancedData = runPipeline(item.baseData, item.processors);
      if (enhancedData.imageMappingDebugVisuals) {
        const meshes = ThreeDebugRenderer.addAllToScene(
          enhancedData.imageMappingDebugVisuals,
          scene,
          STAGE_SIZE,
          THREE,
        );
        debugMeshes.push(...meshes);
      }
    }
  }

  // Static scene - render once
  renderer.render(scene, camera);
  console.log("[LayerEngineThree] Static scene - rendered once, no animation loop");

  return () => {
    // Clean up debug meshes
    for (const debugMesh of debugMeshes) {
      scene.remove(debugMesh);
      if (debugMesh instanceof THREE.Mesh) {
        debugMesh.geometry.dispose();
        if (debugMesh.material instanceof THREE.Material) {
          debugMesh.material.dispose();
        }
      }
    }
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

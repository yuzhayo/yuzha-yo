import * as THREE from "three";
import type { EnhancedLayerData } from "./LayerCorePipeline";
import type { LayerProcessor } from "./LayerCorePipeline";
import { runPipeline } from "./LayerCorePipeline";

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

    // Determine if layer is static by running processors once and checking result
    // A layer is static if it has no processors OR if running processors yields no animation flags
    let isStatic = processors.length === 0;
    if (!isStatic && processors.length > 0) {
      // Run pipeline once to check if it produces animation
      const testData = runPipeline(data, processors, 0);
      isStatic = !testData.hasSpinAnimation; // Static if no spin animation flag
    }

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

  // Cache for static layers - calculate once, reuse forever
  const staticLayerCache = new Map<string, EnhancedLayerData>();

  for (const item of meshData) {
    if (item.isStatic) {
      // Pre-calculate static layer data once
      const staticData =
        item.processors.length > 0 ? runPipeline(item.baseData, item.processors, 0) : item.baseData;
      staticLayerCache.set(item.baseData.layerId, staticData);
    }
  }

  // Track rotation state for render-on-demand optimization
  const lastRotations = new Map<string, number>();

  // Update mesh transforms and return whether any changes occurred
  const updateMeshes = (timestamp: number): boolean => {
    let needsRender = false;

    for (const item of meshData) {
      const { mesh, group, baseData, processors, transformCache, isStatic } = item;

      // Use cached data for static layers, calculate for animated layers
      const layerData: EnhancedLayerData = isStatic
        ? (staticLayerCache.get(baseData.layerId) ?? baseData)
        : processors.length > 0
          ? runPipeline(baseData, processors, timestamp)
          : baseData;

      // Determine rotation mode
      const isSpinning = layerData.hasSpinAnimation === true;
      const rotation = isSpinning
        ? (layerData.currentRotation ?? 0)
        : (layerData.imageMapping.displayRotation ?? 0);

      // Check if rotation changed (for render-on-demand)
      const lastRotation = lastRotations.get(baseData.layerId);
      if (lastRotation !== rotation) {
        needsRender = true;
        lastRotations.set(baseData.layerId, rotation);
      }

      const pivot = isSpinning
        ? (layerData.spinCenter ?? transformCache.imageCenter)
        : transformCache.imageCenter;

      // Calculate offset for pivot rotation using cached image center
      const centerX = transformCache.imageCenter.x * layerData.scale.x;
      const centerY = transformCache.imageCenter.y * layerData.scale.y;
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

    return needsRender;
  };

  // Check if any layers need animation
  const hasAnimatedLayers = animatedCount > 0;

  let animationId: number | undefined;

  if (hasAnimatedLayers) {
    // Continuous animation for animated layers with render-on-demand
    let firstFrame = true;
    const animate = (timestamp: number) => {
      const needsRender = updateMeshes(timestamp);
      // Always render first frame, then only when rotation changes
      if (firstFrame || needsRender) {
        renderer.render(scene, camera);
        firstFrame = false;
      }
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    console.log(
      `[LayerEngineThree] Starting animation loop with render-on-demand (${animatedCount} animated layers)`,
    );
  } else {
    // Static scene - render once
    updateMeshes(0);
    renderer.render(scene, camera);
    console.log("[LayerEngineThree] Static scene - rendered once, no animation loop");
  }

  return () => {
    if (animationId !== undefined) {
      cancelAnimationFrame(animationId);
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

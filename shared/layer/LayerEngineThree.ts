import * as THREE from "three";
import type { EnhancedLayerData } from "./LayerCorePipeline";
import type { LayerProcessor } from "./LayerCorePipeline";
import { runPipeline } from "./LayerCorePipeline";
import {
  generateOrbitalDebugVisuals as _generateOrbitalDebugVisuals,
  type OrbitalDebugConfig,
} from "./LayerCorePipelineOrbitalUtils";
import {
  generateImageMappingDebugVisuals,
  ThreeDebugRenderer as ImageMappingThreeDebugRenderer,
  type ImageMappingDebugConfig,
} from "./LayerCorePipelineImageMappingUtils";

const STAGE_SIZE = 2048;

// Enable orbital debug visuals (set to false to disable)
const ORBITAL_DEBUG_ENABLED = true;
const _ORBITAL_DEBUG_CONFIG: OrbitalDebugConfig = {
  showCenter: true,
  showOrbitLine: true,
  showRadiusLine: true,
  showOrbitPoint: true,
  centerStyle: "crosshair",
};

// Enable image mapping debug visuals
const IMAGE_MAPPING_DEBUG_ENABLED = true;
const IMAGE_MAPPING_DEBUG_CONFIG: ImageMappingDebugConfig = {
  showCenter: true,
  showTip: true,
  showBase: true,
  showAxisLine: true,
  showRotation: false,
  showBoundingBox: false,
};
const IMAGE_MAPPING_DEBUG_LAYER_IDS = ["orbiting-moon"]; // Only show for specific layers

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
  spinSpeed: number;
  debugObjects?: THREE.Group; // Group for debug visuals
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
    let spinSpeed = 0;
    if (!isStatic && processors.length > 0) {
      // Run pipeline once to check if it produces animation
      const testData = runPipeline(data, processors, 0);
      // Static if no spin AND no orbital animation
      isStatic = !testData.hasSpinAnimation && !testData.hasOrbitalAnimation;
      spinSpeed = testData.spinSpeed ?? 0; // Extract spin speed for render optimization
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
      spinSpeed,
    });

    meshData.push({
      mesh,
      group,
      baseData: data,
      processors,
      transformCache,
      isStatic,
      spinSpeed,
    });
  }

  const staticCount = meshData.filter((m) => m.isStatic).length;
  const animatedCount = meshData.length - staticCount;

  // Check if any animated layer has slow rotation (< 6 degrees/second)
  // Slow rotations need every frame rendered to avoid stuttering
  const SLOW_ROTATION_THRESHOLD = 6;
  const hasSlowRotation = meshData.some(
    (m) => !m.isStatic && m.spinSpeed > 0 && m.spinSpeed < SLOW_ROTATION_THRESHOLD,
  );

  console.log(
    `[LayerEngineThree] Total layers loaded: ${meshData.length} (${staticCount} static, ${animatedCount} animated)`,
  );

  if (hasSlowRotation) {
    const slowLayers = meshData.filter(
      (m) => !m.isStatic && m.spinSpeed > 0 && m.spinSpeed < SLOW_ROTATION_THRESHOLD,
    );
    console.log(
      `[LayerEngineThree] Detected slow rotation layers (always render): ${slowLayers.map((m) => `${m.baseData.layerId}@${m.spinSpeed}°/s`).join(", ")}`,
    );
  }

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

  // Helper function to create Three.js debug visuals for orbital motion
  function createOrbitalDebugObjects(
    orbitCenter: { x: number; y: number },
    orbitRadius: number,
    orbitPoint: { x: number; y: number },
  ): THREE.Group {
    const debugGroup = new THREE.Group();
    const zOffset = 500; // High Z to render on top

    // Create orbit center marker (crosshair)
    const centerSize = 15;
    const centerMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red
    const centerPoints = [
      new THREE.Vector3(orbitCenter.x - STAGE_SIZE / 2 - centerSize, STAGE_SIZE / 2 - orbitCenter.y, zOffset),
      new THREE.Vector3(orbitCenter.x - STAGE_SIZE / 2 + centerSize, STAGE_SIZE / 2 - orbitCenter.y, zOffset),
      new THREE.Vector3(orbitCenter.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - orbitCenter.y, zOffset),
      new THREE.Vector3(orbitCenter.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - orbitCenter.y - centerSize, zOffset),
      new THREE.Vector3(orbitCenter.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - orbitCenter.y + centerSize, zOffset),
    ];
    const centerGeometry = new THREE.BufferGeometry().setFromPoints([centerPoints[0]!, centerPoints[1]!]);
    const centerLine1 = new THREE.Line(centerGeometry, centerMaterial);
    const centerGeometry2 = new THREE.BufferGeometry().setFromPoints([centerPoints[3]!, centerPoints[4]!]);
    const centerLine2 = new THREE.Line(centerGeometry2, centerMaterial);
    debugGroup.add(centerLine1, centerLine2);

    // Create orbit line (circle)
    const orbitLineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff00, // Green
      transparent: true,
      opacity: 0.5,
    });
    const curvePoints: THREE.Vector3[] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = orbitCenter.x + orbitRadius * Math.cos(angle);
      const y = orbitCenter.y + orbitRadius * Math.sin(angle);
      curvePoints.push(new THREE.Vector3(x - STAGE_SIZE / 2, STAGE_SIZE / 2 - y, zOffset));
    }
    const orbitLineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const orbitLine = new THREE.Line(orbitLineGeometry, orbitLineMaterial);
    debugGroup.add(orbitLine);

    // Create radius line
    const radiusLineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffff00, // Yellow
      transparent: true,
      opacity: 0.7,
    });
    const radiusPoints = [
      new THREE.Vector3(orbitCenter.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - orbitCenter.y, zOffset),
      new THREE.Vector3(orbitPoint.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - orbitPoint.y, zOffset),
    ];
    const radiusLineGeometry = new THREE.BufferGeometry().setFromPoints(radiusPoints);
    const radiusLine = new THREE.Line(radiusLineGeometry, radiusLineMaterial);
    debugGroup.add(radiusLine);

    // Create orbit point marker
    const pointGeometry = new THREE.CircleGeometry(8, 16);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue
    const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    pointMesh.position.set(orbitPoint.x - STAGE_SIZE / 2, STAGE_SIZE / 2 - orbitPoint.y, zOffset);
    debugGroup.add(pointMesh);

    return debugGroup;
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

      // Skip rendering if layer is marked invisible (off-screen culling)
      if (layerData.visible === false) {
        // Hide the mesh
        group.visible = false;
        continue;
      } else {
        group.visible = true;
      }

      // Update position for orbital motion
      if (layerData.hasOrbitalAnimation && layerData.position) {
        group.position.set(
          layerData.position.x - STAGE_SIZE / 2,
          STAGE_SIZE / 2 - layerData.position.y,
          0,
        );
        needsRender = true;
      }

      // Determine rotation mode
      const isSpinning = layerData.hasSpinAnimation === true;
      const isOrbiting = layerData.hasOrbitalAnimation === true && !isSpinning;
      const rotation = isSpinning
        ? (layerData.currentRotation ?? 0)
        : isOrbiting
          ? (layerData.orbitRotation ?? 0)
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

      // Update or create orbital debug visuals
      if (ORBITAL_DEBUG_ENABLED && layerData.hasOrbitalAnimation && layerData.orbitCenter) {
        // Calculate current orbit point
        const orbitPoint = {
          x: layerData.orbitCenter.x + (layerData.orbitRadius || 0) * Math.cos(((layerData.currentOrbitAngle || 0) * Math.PI) / 180),
          y: layerData.orbitCenter.y + (layerData.orbitRadius || 0) * Math.sin(((layerData.currentOrbitAngle || 0) * Math.PI) / 180),
        };

        // Remove old debug objects if they exist
        if (item.debugObjects) {
          scene.remove(item.debugObjects);
          item.debugObjects.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (child.material instanceof THREE.Material) {
                child.material.dispose();
              }
            }
            if (child instanceof THREE.Line) {
              child.geometry.dispose();
              if (child.material instanceof THREE.Material) {
                child.material.dispose();
              }
            }
          });
        }

        // Create new debug objects
        item.debugObjects = createOrbitalDebugObjects(layerData.orbitCenter, layerData.orbitRadius || 0, orbitPoint);
        scene.add(item.debugObjects);
        needsRender = true;
      }

      // Update or create image mapping debug visuals for specific layers
      if (
        IMAGE_MAPPING_DEBUG_ENABLED &&
        IMAGE_MAPPING_DEBUG_LAYER_IDS.includes(layerData.layerId)
      ) {
        // Generate debug visuals
        const imageMappingDebugVisuals = generateImageMappingDebugVisuals(
          layerData,
          IMAGE_MAPPING_DEBUG_CONFIG,
        );

        // Add debug objects to scene (they will be cleaned up on unmount)
        const debugMeshes = ImageMappingThreeDebugRenderer.addAllToScene(
          imageMappingDebugVisuals,
          scene,
          STAGE_SIZE,
          THREE,
        );

        // Store for cleanup
        if (!item.debugObjects) {
          item.debugObjects = new THREE.Group();
          scene.add(item.debugObjects);
        }
        debugMeshes.forEach((mesh) => item.debugObjects?.add(mesh));

        needsRender = true;
      }
    }

    return needsRender;
  };

  // Check if any layers need animation
  const hasAnimatedLayers = animatedCount > 0;

  let animationId: number | undefined;

  if (hasAnimatedLayers) {
    // Smart render-on-demand: always render for slow rotations, optimize for fast rotations
    let firstFrame = true;
    const animate = (timestamp: number) => {
      const needsRender = updateMeshes(timestamp);
      // Always render if: first frame, slow rotation detected, or rotation changed
      if (firstFrame || hasSlowRotation || needsRender) {
        renderer.render(scene, camera);
        firstFrame = false;
      }
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    if (hasSlowRotation) {
      console.log(
        `[LayerEngineThree] Starting animation loop with always-render for slow rotations (${animatedCount} animated layers)`,
      );
    } else {
      console.log(
        `[LayerEngineThree] Starting animation loop with render-on-demand (${animatedCount} animated layers)`,
      );
    }
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

      // Clean up debug objects
      if (item.debugObjects) {
        scene.remove(item.debugObjects);
        item.debugObjects.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
          if (child instanceof THREE.Line) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
      }
    }
  };
}

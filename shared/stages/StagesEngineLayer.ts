// IMPORT SECTION
import { produceLayers } from "../layer2/LayerProducer";
import type { LibraryConfig, LayerData, ProcessingContext, AssetMeta } from "../layer2/LayerTypes";
import registryJson from "../layer2/LayerConfigRegistry.json";
import type { StageObject } from "./StagesTypes";

// STATE SECTION
const DEFAULT_TEXTURE_SIZE = 256;
const DEFAULT_COLOR = 0xffffff;

interface LayerRegistryFile {
  ASSET_BASE_PATH: string;
  registry: Record<string, string>;
}

const layerRegistryFile = registryJson as LayerRegistryFile;

const resolveRegistryTemplate = (template: string): string =>
  template.replace(/\$\{ASSET_BASE_PATH\}/g, layerRegistryFile.ASSET_BASE_PATH);

const STATIC_ASSET_REGISTRY = new Map<string, AssetMeta>(
  Object.entries(layerRegistryFile.registry).map(([key, template]) => [
    key,
    {
      src: resolveRegistryTemplate(template),
      width: Number.NaN,
      height: Number.NaN,
    },
  ]),
);

const resolveRegistryKey = (key: string): string | undefined => {
  const template = layerRegistryFile.registry[key];
  return template ? resolveRegistryTemplate(template) : undefined;
};

// LOGIC SECTION
/**
 * Convert LayerData position to StageObject position format
 */
function convertPosition(layerData: LayerData): [number, number, number] {
  return [
    layerData.transform.position.x,
    layerData.transform.position.y,
    0, // Z coordinate, always 0 for 2D layers
  ];
}

/**
 * Convert LayerData to StageObject metadata
 */
function createMetadataFromLayer(layerData: LayerData): any {
  const metadata: any = {
    type: "sprite",
    layerId: layerData.id,
    asset: layerData.asset,
    container: layerData.container,
    behaviors: layerData.behaviors,
    events: layerData.events,

    // Transform properties for rendering
    anchor: layerData.transform.anchor,
    tilt: layerData.transform.tilt,

    // Visual properties
    width: DEFAULT_TEXTURE_SIZE,
    height: DEFAULT_TEXTURE_SIZE,
    color: DEFAULT_COLOR,
  };

  // Add container dimensions if available
  if (layerData.container) {
    metadata.width = layerData.container.width || DEFAULT_TEXTURE_SIZE;
    metadata.height = layerData.container.height || DEFAULT_TEXTURE_SIZE;
    metadata.fitMode = layerData.container.fitMode;
    metadata.alignment = layerData.container.alignment;
  }

  return metadata;
}

/**
 * Convert single LayerData to StageObject
 */
function layerDataToStageObject(layerData: LayerData): StageObject {
  return {
    id: layerData.id,
    position: convertPosition(layerData),
    rotation: (layerData.transform.angle * Math.PI) / 180, // Convert degrees to radians
    scale: Math.max(layerData.transform.scale.x, layerData.transform.scale.y), // Use larger scale value
    visible: layerData.state.isVisible && layerData.transform.opacity > 0,
    metadata: createMetadataFromLayer(layerData),
  };
}

/**
 * Create asset registry from LibraryConfig layers
 */
function createAssetRegistry(config: LibraryConfig): Map<string, AssetMeta> {
  const registry = new Map<string, AssetMeta>();

  // Seed with static registry entries
  for (const [key, meta] of STATIC_ASSET_REGISTRY.entries()) {
    registry.set(key, { ...meta });
  }

  for (const layer of config.layers) {
    if ("registryKey" in layer && layer.registryKey) {
      const resolvedSrc = resolveRegistryKey(layer.registryKey);
      if (resolvedSrc) {
        registry.set(layer.registryKey, {
          src: resolvedSrc,
          width: Number.NaN,
          height: Number.NaN,
        });
      }
    }
  }

  return registry;
}

/**
 * Process LibraryConfig through layer system and convert to StageObjects
 */
export function processLibraryConfigToStageObjects(
  config: LibraryConfig,
  timeSeconds: number = 0,
): { objects: StageObject[]; warnings: string[] } {
  try {
    // Create processing context
    const assetRegistry = createAssetRegistry(config);
    const context: ProcessingContext = {
      stage: {
        width: config.stage?.width || 2048,
        height: config.stage?.height || 2048,
        origin: config.stage?.origin || "center",
      },
      time: timeSeconds,
      registry: assetRegistry,
    };

    // Process through layer system
    const layerResult = produceLayers(config, context);

    // Convert LayerData to StageObjects
    const stageObjects = layerResult.layers.map(layerDataToStageObject);

    return {
      objects: stageObjects,
      warnings: layerResult.warnings,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      objects: [],
      warnings: [`Failed to process library config: ${errorMessage}`],
    };
  }
}

/**
 * Update existing StageObjects with new animation state
 */
export function updateStageObjectsFromLayers(
  config: LibraryConfig,
  existingObjects: Map<string, StageObject>,
  timeSeconds: number,
): { updatedObjects: StageObject[]; warnings: string[] } {
  const result = processLibraryConfigToStageObjects(config, timeSeconds);

  // Update existing objects with new transform data
  const updatedObjects: StageObject[] = [];

  for (const newObject of result.objects) {
    const existing = existingObjects.get(newObject.id);
    if (existing) {
      // Preserve existing object but update transform properties
      const updated: StageObject = {
        ...existing,
        position: newObject.position,
        rotation: newObject.rotation,
        scale: newObject.scale,
        visible: newObject.visible,
        metadata: {
          ...existing.metadata,
          ...newObject.metadata,
        },
      };
      updatedObjects.push(updated);
    } else {
      // New object
      updatedObjects.push(newObject);
    }
  }

  return {
    updatedObjects,
    warnings: result.warnings,
  };
}

// CONFIG SECTION (unused)

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export default {
  processLibraryConfigToStageObjects,
  updateStageObjectsFromLayers,
};

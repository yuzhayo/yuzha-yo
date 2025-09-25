// IMPORT SECTION
import { LayerEngine, type LayerConfig, type Layer } from './EngineLayer-Parent.js';
import type { Vector3 } from './EngineLayer-Types.js';

// STYLE SECTION (unused)

// STATE SECTION
export interface AssetRegistry {
  [key: string]: string;
}

export interface LayerImageRef {
  kind: 'urlId';
  id: string;
}

export interface LayerPosition {
  xPct: number;
  yPct: number;
}

export interface LayerScale {
  pct: number;
}

export interface DynamicLayerConfig {
  id: string;
  imageRef: LayerImageRef;
  position: LayerPosition;
  scale: LayerScale;
  angleDeg: number;
}

export interface SceneConfig {
  layersID: string[];
  imageRegistry: AssetRegistry;
  layers: DynamicLayerConfig[];
}

// LOGIC SECTION
export class LayerSceneManager {
  private engine: LayerEngine;
  private assetRegistry: AssetRegistry;

  constructor(engine: LayerEngine, assetRegistry: AssetRegistry) {
    this.engine = engine;
    this.assetRegistry = assetRegistry;
  }

  /**
   * Load scene from configuration with shared assets
   */
  public loadScene(sceneConfig: SceneConfig): Layer[] {
    const layers: Layer[] = [];

    sceneConfig.layers.forEach(layerConfig => {
      const layer = this.createLayerFromConfig(layerConfig);
      if (layer) {
        layers.push(layer);
      }
    });

    return layers;
  }

  /**
   * Create layer from dynamic configuration
   */
  private createLayerFromConfig(config: DynamicLayerConfig): Layer | null {
    // Convert percentage position to world coordinates
    const worldPosition: Vector3 = {
      x: (config.position.xPct - 50) * 0.1, // Center at 0, scale down
      y: (50 - config.position.yPct) * 0.1, // Invert Y axis, center at 0
      z: 0
    };

    // Get texture URL from registry
    const textureUrl = this.assetRegistry[config.imageRef.id];
    if (!textureUrl) {
      console.warn(`Texture not found for ${config.imageRef.id}`);
      return null;
    }

    const layerConfig: LayerConfig = {
      id: config.id,
      type: 'mesh',
      position: worldPosition,
      properties: {
        texture: textureUrl,
        material: {
          type: 'basic',
          transparent: true
        },
        metadata: {
          scale: config.scale.pct / 100,
          rotation: (config.angleDeg * Math.PI) / 180, // Convert to radians
          originalConfig: config
        }
      },
      visible: true,
      zIndex: 0
    };

    return this.engine.addLayer(layerConfig);
  }

  /**
   * Update layer position with percentage-based coordinates
   */
  public updateLayerPosition(layerId: string, position: LayerPosition): boolean {
    const worldPosition: Vector3 = {
      x: (position.xPct - 50) * 0.1,
      y: (50 - position.yPct) * 0.1,
      z: 0
    };

    return this.engine.updateLayer(layerId, { position: worldPosition }) !== null;
  }

  /**
   * Update layer rotation with degrees
   */
  public updateLayerRotation(layerId: string, angleDeg: number): boolean {
    const radians = (angleDeg * Math.PI) / 180;
    return this.engine.updateLayer(layerId, {
      properties: {
        metadata: { rotation: radians }
      }
    }) !== null;
  }

  /**
   * Update layer scale with percentage
   */
  public updateLayerScale(layerId: string, scale: LayerScale): boolean {
    return this.engine.updateLayer(layerId, {
      properties: {
        metadata: { scale: scale.pct / 100 }
      }
    }) !== null;
  }

  /**
   * Create predefined gear scene using shared assets
   */
  public createGearScene(): SceneConfig {
    return {
      layersID: ['bg', 'gear1', 'gear2', 'gear3'],
      imageRegistry: {
        bg: '/shared/Asset/STARBG.png',
        gear1: '/shared/Asset/GEAR1.png',
        gear2: '/shared/Asset/GEAR2.png',
        gear3: '/shared/Asset/GEAR3.png'
      },
      layers: [
        {
          id: 'bg',
          imageRef: { kind: 'urlId', id: 'bg' },
          position: { xPct: 50, yPct: 50 },
          scale: { pct: 100 },
          angleDeg: 0
        },
        {
          id: 'gear1',
          imageRef: { kind: 'urlId', id: 'gear1' },
          position: { xPct: 30, yPct: 30 },
          scale: { pct: 50 },
          angleDeg: 0
        },
        {
          id: 'gear2',
          imageRef: { kind: 'urlId', id: 'gear2' },
          position: { xPct: 70, yPct: 30 },
          scale: { pct: 60 },
          angleDeg: 45
        },
        {
          id: 'gear3',
          imageRef: { kind: 'urlId', id: 'gear3' },
          position: { xPct: 50, yPct: 70 },
          scale: { pct: 40 },
          angleDeg: 90
        }
      ]
    };
  }

  /**
   * Create predefined clock scene using shared assets
   */
  public createClockScene(): SceneConfig {
    return {
      layersID: ['clockbg', 'clockglow', 'hour-hand', 'minute-hand'],
      imageRegistry: {
        clockbg: '/shared/Asset/CLOCKBG.png',
        clockglow: '/shared/Asset/CLOCKGLOW.png',
        'hour-hand': '/shared/Asset/UI_Clock_HourHand.png',
        'minute-hand': '/shared/Asset/UI_Clock_MinuteHand.png'
      },
      layers: [
        {
          id: 'clockbg',
          imageRef: { kind: 'urlId', id: 'clockbg' },
          position: { xPct: 50, yPct: 50 },
          scale: { pct: 100 },
          angleDeg: 0
        },
        {
          id: 'clockglow',
          imageRef: { kind: 'urlId', id: 'clockglow' },
          position: { xPct: 50, yPct: 50 },
          scale: { pct: 110 },
          angleDeg: 0
        },
        {
          id: 'hour-hand',
          imageRef: { kind: 'urlId', id: 'hour-hand' },
          position: { xPct: 50, yPct: 50 },
          scale: { pct: 80 },
          angleDeg: 0
        },
        {
          id: 'minute-hand',
          imageRef: { kind: 'urlId', id: 'minute-hand' },
          position: { xPct: 50, yPct: 50 },
          scale: { pct: 90 },
          angleDeg: 0
        }
      ]
    };
  }

  /**
   * Get all layer states for debugging
   */
  public getLayerStates(): Record<string, any> {
    const states: Record<string, any> = {};
    
    this.engine.getAllLayers().forEach(layer => {
      states[layer.id] = layer.getState();
    });

    return states;
  }
}

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export default LayerSceneManager;
// IMPORT SECTION
import type { Vector3, LayerType, LayerProperties } from './EngineLayer-Types.js';

// STYLE SECTION (unused)

// STATE SECTION
export interface LayerConfig {
  /** Unique identifier for the layer */
  id: string;
  
  /** Layer type determining processing behavior */
  type: LayerType;
  
  /** 3D position in world coordinates */
  position: Vector3;
  
  /** Layer-specific properties and configuration */
  properties: LayerProperties;
  
  /** Optional parent layer for hierarchical organization */
  parent?: string;
  
  /** Z-index for rendering order */
  zIndex?: number;
  
  /** Visibility flag */
  visible?: boolean;
}

export interface Layer {
  id: string;
  type: LayerType;
  position: Vector3;
  properties: LayerProperties;
  parent?: string;
  zIndex: number;
  visible: boolean;
  
  update(updates: Partial<LayerConfig>): void;
  dispose(): void;
  getState(): LayerState;
}

export interface LayerState {
  id: string;
  position: Vector3;
  visible: boolean;
  lastUpdate: number;
}

export interface LayerOperation {
  type: 'add' | 'update' | 'remove';
  id?: string;
  config?: LayerConfig;
  updates?: Partial<LayerConfig>;
}

export interface LayerOperationResult {
  operation: LayerOperation;
  success: boolean;
  result?: Layer;
  error?: Error;
}

export interface BatchResult {
  results: LayerOperationResult[];
  successCount: number;
}

// LOGIC SECTION
export class LayerEngine {
  private layers: Map<string, Layer> = new Map();
  private groups: Map<string, LayerGroup> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();

  /**
   * Add a new layer to the engine
   */
  public addLayer(config: LayerConfig): Layer {
    const layer = this.createLayer(config);
    this.layers.set(config.id, layer);
    this.emitEvent('layer:added', layer);
    return layer;
  }

  /**
   * Update an existing layer
   */
  public updateLayer(id: string, updates: Partial<LayerConfig>): Layer | null {
    const layer = this.layers.get(id);
    if (!layer) return null;
    
    layer.update(updates);
    this.emitEvent('layer:updated', layer);
    return layer;
  }

  /**
   * Remove layer from engine
   */
  public removeLayer(id: string): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    
    layer.dispose();
    this.layers.delete(id);
    this.emitEvent('layer:removed', { id });
    return true;
  }

  /**
   * Get layer by ID
   */
  public getLayer(id: string): Layer | undefined {
    return this.layers.get(id);
  }

  /**
   * Get all layers
   */
  public getAllLayers(): Layer[] {
    return Array.from(this.layers.values());
  }

  /**
   * Batch operations for performance
   */
  public batch(operations: LayerOperation[]): BatchResult {
    const results: LayerOperationResult[] = [];
    
    operations.forEach(op => {
      try {
        const result = this.executeOperation(op);
        results.push({ operation: op, success: true, result });
      } catch (error) {
        results.push({ operation: op, success: false, error: error as Error });
      }
    });
    
    return { results, successCount: results.filter(r => r.success).length };
  }

  private createLayer(config: LayerConfig): Layer {
    return new LayerImpl(config);
  }

  private executeOperation(op: LayerOperation): Layer {
    switch (op.type) {
      case 'add':
        if (!op.config) throw new Error('Config required for add operation');
        return this.addLayer(op.config);
      case 'update':
        if (!op.id || !op.updates) throw new Error('ID and updates required for update operation');
        const updated = this.updateLayer(op.id, op.updates);
        if (!updated) throw new Error(`Layer ${op.id} not found`);
        return updated;
      case 'remove':
        if (!op.id) throw new Error('ID required for remove operation');
        const success = this.removeLayer(op.id);
        if (!success) throw new Error(`Failed to remove layer ${op.id}`);
        // Return a dummy layer for type consistency
        return new LayerImpl({ id: op.id, type: 'mesh', position: { x: 0, y: 0, z: 0 }, properties: {} });
      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  }

  private emitEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }
}

class LayerImpl implements Layer {
  public id: string;
  public type: LayerType;
  public position: Vector3;
  public properties: LayerProperties;
  public parent?: string;
  public zIndex: number;
  public visible: boolean;

  constructor(config: LayerConfig) {
    this.id = config.id;
    this.type = config.type;
    this.position = config.position;
    this.properties = config.properties;
    this.parent = config.parent;
    this.zIndex = config.zIndex || 0;
    this.visible = config.visible !== false;
  }

  public update(updates: Partial<LayerConfig>): void {
    if (updates.position) this.position = updates.position;
    if (updates.properties) this.properties = { ...this.properties, ...updates.properties };
    if (updates.parent !== undefined) this.parent = updates.parent;
    if (updates.zIndex !== undefined) this.zIndex = updates.zIndex;
    if (updates.visible !== undefined) this.visible = updates.visible;
  }

  public dispose(): void {
    // Cleanup resources
  }

  public getState(): LayerState {
    return {
      id: this.id,
      position: { ...this.position },
      visible: this.visible,
      lastUpdate: Date.now()
    };
  }
}

interface LayerGroup {
  id: string;
  layers: string[];
}

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export default LayerEngine;
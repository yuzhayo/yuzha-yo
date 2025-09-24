/**
 * Object management logic - Child of StagesEngine
 * AI can modify this file to add new object processing logic
 */

import type { StageObject } from "./StagesTypes";

export class StagesEngineObjects {
  private objects = new Map<string, StageObject>();
  private dirtyObjects = new Set<string>();

  /**
   * Set object with metadata processing
   */
  setObject(id: string, objectData: Partial<StageObject>): StageObject {
    // Process metadata before storing
    const processedData = this.processMetadata(objectData);

    const newObject: StageObject = {
      id,
      position: [0, 0, 0],
      rotation: 0,
      scale: 1,
      visible: true,
      metadata: {},
      ...this.objects.get(id),
      ...processedData,
    };

    this.objects.set(id, newObject);
    this.markDirty(id);

    return newObject;
  }

  /**
   * Update object with smart metadata processing
   */
  updateObject(id: string, updates: Partial<StageObject>): StageObject | null {
    const existing = this.objects.get(id);
    if (!existing) return null;

    // Process updates through metadata system
    const processedUpdates = this.processMetadata(updates);

    const updated: StageObject = { ...existing, ...processedUpdates };
    this.objects.set(id, updated);
    this.markDirty(id);

    return updated;
  }

  /**
   * Process metadata into visual properties
   * AI can extend this method for new object types
   */
  private processMetadata(objectData: Partial<StageObject>): Partial<StageObject> {
    if (!objectData.metadata) return objectData;

    const { metadata } = objectData;
    const processed = { ...objectData };

    // Clock processing
    if (metadata.type === "clock") {
      processed.rotation = metadata.angle || 0;
      processed.position = metadata.center || processed.position;
    }

    // Sprite processing
    if (metadata.type === "sprite") {
      if (metadata.health !== undefined) {
        // Health affects color tint
        const healthPercent = metadata.health / (metadata.maxHealth || 100);
        if (healthPercent < 0.3) {
          processed.metadata = { ...metadata, color: 0xff0000 }; // Red tint
        }
      }
    }

    // Weather processing
    if (metadata.type === "weather") {
      if (metadata.weather === "rain") {
        processed.metadata = { ...metadata, particles: "rain", alpha: 0.7 };
      }
    }

    // Animation processing
    if (metadata.isAnimating) {
      this.handleAnimation(processed);
    }

    return processed;
  }

  /**
   * Handle object animations
   * AI can extend this for complex animations
   */
  private handleAnimation(object: Partial<StageObject>): void {
    const { metadata } = object;
    if (!metadata) return;

    // Rotation animation
    if (metadata.animationType === "rotate") {
      const speed = metadata.rotationSpeed || 0.01;
      const currentRotation = typeof object.rotation === "number" ? object.rotation : 0;
      object.rotation = currentRotation + speed;
    }

    // Pulsing scale animation
    if (metadata.animationType === "pulse") {
      const time = Date.now() * 0.001;
      const pulseAmount = metadata.pulseAmount || 0.1;
      const baseScale = typeof object.scale === "number" ? object.scale : 1;
      object.scale = baseScale + Math.sin(time * 2) * pulseAmount;
    }

    // Floating animation
    if (metadata.animationType === "float") {
      const time = Date.now() * 0.001;
      const floatAmount = metadata.floatAmount || 10;
      if (Array.isArray(object.position)) {
        object.position[1] += Math.sin(time) * floatAmount * 0.01;
      }
    }
  }

  /**
   * Get object by ID
   */
  getObject(id: string): StageObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Get all objects
   */
  getAllObjects(): Map<string, StageObject> {
    return new Map(this.objects);
  }

  /**
   * Get objects by type
   */
  getObjectsByType(type: string): StageObject[] {
    const results: StageObject[] = [];
    for (const object of this.objects.values()) {
      if (object.metadata?.type === type) {
        results.push(object);
      }
    }
    return results;
  }

  /**
   * Get objects in area
   */
  getObjectsInArea(x: number, y: number, width: number, height: number): StageObject[] {
    const results: StageObject[] = [];
    for (const object of this.objects.values()) {
      const [objX, objY] = object.position;
      if (objX >= x && objX <= x + width && objY >= y && objY <= y + height) {
        results.push(object);
      }
    }
    return results;
  }

  /**
   * Remove object
   */
  removeObject(id: string): boolean {
    const existed = this.objects.has(id);
    this.objects.delete(id);
    this.dirtyObjects.delete(id);
    return existed;
  }

  /**
   * Mark object as dirty (needs re-render)
   */
  markDirty(id: string): void {
    this.dirtyObjects.add(id);
  }

  /**
   * Get dirty objects and clear dirty state
   */
  getDirtyObjects(): StageObject[] {
    const dirty: StageObject[] = [];
    for (const id of this.dirtyObjects) {
      const object = this.objects.get(id);
      if (object) {
        dirty.push(object);
      }
    }
    this.dirtyObjects.clear();
    return dirty;
  }

  /**
   * Get object count
   */
  getCount(): number {
    return this.objects.size;
  }

  /**
   * Clear all objects
   */
  clear(): void {
    this.objects.clear();
    this.dirtyObjects.clear();
  }

  /**
   * Batch update multiple objects
   */
  batchUpdate(updates: Array<{ id: string; data: Partial<StageObject> }>): StageObject[] {
    const updatedObjects: StageObject[] = [];

    for (const update of updates) {
      const updated = this.updateObject(update.id, update.data);
      if (updated) {
        updatedObjects.push(updated);
      }
    }

    return updatedObjects;
  }

  /**
   * Process complex metadata transformations
   * AI can add new processors here
   */
  processComplexMetadata(
    id: string,
    processor: (metadata: any) => Partial<StageObject>,
  ): StageObject | null {
    const object = this.objects.get(id);
    if (!object || !object.metadata) return null;

    const updates = processor(object.metadata);
    return this.updateObject(id, updates);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalObjects: this.objects.size,
      dirtyObjects: this.dirtyObjects.size,
      visibleObjects: Array.from(this.objects.values()).filter((obj) => obj.visible).length,
      objectTypes: this.getObjectTypeStats(),
    };
  }

  /**
   * Get object type statistics
   */
  private getObjectTypeStats(): Record<string, number> {
    const types: Record<string, number> = {};

    for (const object of this.objects.values()) {
      const type = object.metadata?.type || "unknown";
      types[type] = (types[type] || 0) + 1;
    }

    return types;
  }
}

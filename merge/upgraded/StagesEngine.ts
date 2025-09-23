/**
 * Main Stages Engine - Public API Entry Point (PARENT - STABLE)
 * Refactored to use StagesLogic coordination layer
 * AI should not modify this file - modify child modules via StagesLogic instead
 */

import { StagesLogic } from "./StagesLogic";
import { StagesRenderer } from "./StagesRenderer";
import { StagesEngineObjects } from "./StagesEngineObjects";
import { StagesEngineEvents } from "./StagesEngineEvents";
import type {
  StageConfig,
  StageObject,
  StageEvent,
  PerformanceMetrics,
  StageCoordinates,
  RenderQuality,
  DeviceTier,
  ViewportTransform,
} from "./StagesTypes";

export class StagesEngine {
  // Single coordination point (replaces device/transform/performance)
  private logic: StagesLogic;

  // Core modules (stable)
  private renderer: StagesRenderer;

  // Logic modules (AI can modify these via child files)
  private objectManager: StagesEngineObjects;
  private eventManager: StagesEngineEvents;

  private container: HTMLElement | null = null;
  private mounted = false;
  private adaptiveQuality = true;
  private lastQualityCheck = 0;

  constructor(config: StageConfig = {}) {
    // Initialize coordination layer
    this.logic = new StagesLogic(config);

    // Initialize renderer with logic's performance module
    this.renderer = new StagesRenderer(this.logic);

    // Initialize logic modules (AI modifies these)
    this.objectManager = new StagesEngineObjects();
    this.eventManager = new StagesEngineEvents();

    // Setup update callbacks for dynamic changes
    this.setupLogicCallbacks();

    this.adaptiveQuality = config.debug !== true;
  }

  /**
   * Setup callbacks for StagesLogic to notify engine of changes
   */
  private setupLogicCallbacks(): void {
    this.logic.setUpdateCallback({
      onDeviceChange: (_tier: DeviceTier) => {
        // Device tier changed - update renderer quality
        const quality = this.logic.getRenderQuality();
        this.renderer.updateQuality(quality);
      },

      onTransformChange: (_transform: ViewportTransform) => {
        // Transform changed - renderer handles this automatically
        // Could add additional transform-based updates here if needed
      },

      onPerformanceChange: (adjustment: Partial<RenderQuality>) => {
        // Performance adjustment recommended - apply to renderer
        this.renderer.updateQuality(adjustment);

        if (this.adaptiveQuality) {
          console.log("StagesEngine: Adjusting quality", adjustment);
        }
      },
    });
  }

  /**
   * Mount stages to DOM element
   */
  async mount(container: HTMLElement): Promise<void> {
    if (this.mounted) {
      throw new Error("StagesEngine: Already mounted");
    }

    this.container = container;

    // Initialize renderer with device quality from logic
    const quality = this.logic.getRenderQuality();
    const canvas = await this.renderer.initialize(quality);

    // Setup container styles
    container.style.position = "relative";
    container.style.overflow = "hidden";
    container.style.width = "100%";
    container.style.height = "100%";

    // Add canvas to container
    container.appendChild(canvas);

    // Initialize transform system via logic
    this.logic.initializeTransform(container, canvas);

    // Setup event handlers (delegated to event manager)
    this.eventManager.setupEventHandlers(
      container,
      (event) => this.logic.transformEvent(event),
      (x, y) => this.objectManager.getObjectsInArea(x - 5, y - 5, 10, 10),
    );

    // Start render loop
    this.renderer.start();

    // Start adaptive quality monitoring
    if (this.adaptiveQuality) {
      this.startQualityMonitoring();
    }

    this.mounted = true;
  }

  /**
   * Add or update object (delegated to object manager)
   */
  setObject(id: string, objectData: Partial<StageObject>): void {
    const object = this.objectManager.setObject(id, objectData);
    this.renderer.setRenderObject(object);
    this.logic.setObjectCount(this.objectManager.getCount());
  }

  /**
   * Update existing object (delegated to object manager)
   */
  updateObject(id: string, updates: Partial<StageObject>): void {
    const object = this.objectManager.updateObject(id, updates);
    if (object) {
      this.renderer.updateRenderObject(object);
    }
  }

  /**
   * Remove object (delegated to object manager)
   */
  removeObject(id: string): void {
    const existed = this.objectManager.removeObject(id);
    if (existed) {
      this.renderer.removeRenderObject(id);
      this.logic.setObjectCount(this.objectManager.getCount());
    }
  }

  /**
   * Get object by id (delegated to object manager)
   */
  getObject(id: string): StageObject | undefined {
    return this.objectManager.getObject(id);
  }

  /**
   * Get all objects (delegated to object manager)
   */
  getAllObjects(): Map<string, StageObject> {
    return this.objectManager.getAllObjects();
  }

  /**
   * Transform screen coordinates to stage coordinates
   */
  transformCoordinates(event: PointerEvent | MouseEvent | TouchEvent): StageCoordinates | null {
    return this.logic.transformEvent(event);
  }

  /**
   * Transform screen coordinates (x, y) to stage coordinates
   */
  transformPoint(clientX: number, clientY: number): StageCoordinates | null {
    return this.logic.transformCoordinates(clientX, clientY);
  }

  /**
   * Check if coordinates are within stage
   */
  isWithinStage(stageX: number, stageY: number): boolean {
    return this.logic.isWithinStage(stageX, stageY);
  }

  /**
   * Get objects at specific coordinates (delegated to object manager)
   */
  getObjectsAt(stageX: number, stageY: number, tolerance = 10): StageObject[] {
    return this.objectManager.getObjectsInArea(
      stageX - tolerance,
      stageY - tolerance,
      tolerance * 2,
      tolerance * 2,
    );
  }

  /**
   * Add event listener (delegated to event manager)
   */
  addEventListener(type: string, listener: (event: StageEvent) => void): void {
    this.eventManager.addEventListener(type, listener);
  }

  /**
   * Remove event listener (delegated to event manager)
   */
  removeEventListener(type: string, listener: (event: StageEvent) => void): void {
    this.eventManager.removeEventListener(type, listener);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.logic.getPerformanceMetrics();
  }

  /**
   * Get Three.js scene (for advanced usage)
   */
  getScene() {
    return this.renderer.getScene();
  }

  /**
   * Get Three.js renderer (for advanced usage)
   */
  getRenderer() {
    return this.renderer.getRenderer();
  }

  /**
   * Force quality update
   */
  updateQuality(dprScale = 1.0, antialias?: boolean): void {
    const currentQuality = this.logic.getRenderQuality();
    const newQuality = {
      ...currentQuality,
      dpr: currentQuality.dpr * dprScale,
    };

    if (antialias !== undefined) {
      newQuality.antialias = antialias;
    }

    this.renderer.updateQuality(newQuality);
  }

  /**
   * Start adaptive quality monitoring
   */
  private startQualityMonitoring(): void {
    const monitor = () => {
      const now = Date.now();

      // Check quality every 2 seconds
      if (now - this.lastQualityCheck > 2000) {
        this.lastQualityCheck = now;

        const currentQuality = this.logic.getRenderQuality();
        const adjustment = this.logic.getQualityAdjustment(currentQuality);

        if (Object.keys(adjustment).length > 0) {
          console.log("StagesEngine: Adjusting quality", adjustment);
          this.renderer.updateQuality(adjustment);
        }
      }

      if (this.mounted) {
        setTimeout(monitor, 1000);
      }
    };

    setTimeout(monitor, 2000); // Start after 2 seconds
  }

  /**
   * Dispose engine and cleanup resources
   */
  dispose(): void {
    this.mounted = false;

    this.renderer.dispose();
    this.logic.dispose();
    this.objectManager.clear();
    this.eventManager.clearListeners();
    this.eventManager.clearHistory();

    if (this.container) {
      // Remove canvas from container
      const canvas = this.renderer.getCanvas();
      if (canvas && this.container.contains(canvas)) {
        this.container.removeChild(canvas);
      }
    }

    this.container = null;
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      mounted: this.mounted,
      objects: this.objectManager.getStats(),
      events: this.eventManager.getEventStats(),
      performance: this.logic.getPerformanceMetrics(),
      renderer: this.renderer.getStats(),
      logic: this.logic.getStats(),
    };
  }

  /**
   * Process metadata transformations (delegated to object manager)
   */
  processMetadata(id: string, processor: (metadata: any) => Partial<StageObject>): void {
    this.objectManager.processComplexMetadata(id, processor);
  }

  /**
   * Batch process multiple objects (delegated to object manager)
   */
  batchUpdate(updates: Array<{ id: string; data: Partial<StageObject> }>): void {
    const updatedObjects = this.objectManager.batchUpdate(updates);

    // Update renderer for all changed objects
    for (const object of updatedObjects) {
      this.renderer.updateRenderObject(object);
    }
  }
}

/**
 * StagesEngineCore.ts - High-Performance Three.js Rendering Engine
 * Best implementation from source2 with adaptive quality and coordinate transform
 */

import type {
  StageConfig,
  RenderQuality,
  DeviceTier,
  PerformanceMetrics,
  StageObject,
} from "./LayerSystemTypes";

export interface StageCoordinates {
  stageX: number;
  stageY: number;
}

export interface ViewportTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface StageEvent {
  type: "pointerdown" | "pointermove" | "pointerup" | "click";
  stageX: number;
  stageY: number;
  objectId?: string;
  originalEvent: PointerEvent | MouseEvent;
}

/**
 * Core Three.js Rendering Engine with adaptive quality and device optimization
 */
export class StagesEngineCore {
  private mounted = false;
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private renderer: any = null; // THREE.WebGLRenderer
  private scene: any = null; // THREE.Scene
  private camera: any = null; // THREE.Camera

  // Performance and quality management
  private deviceTier: DeviceTier;
  private currentQuality: RenderQuality;
  private adaptiveQuality = true;
  private lastQualityCheck = 0;

  // Transform and coordinate system
  private viewportTransform: ViewportTransform = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  };

  // Object management
  private objects = new Map<string, StageObject>();
  private renderObjects = new Map<string, any>(); // THREE objects

  // Event management
  private eventListeners = new Map<string, ((event: StageEvent) => void)[]>();

  // Performance tracking
  private performanceMetrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    renderCalls: 0,
    objectCount: 0,
  };

  constructor(config: StageConfig = {}) {
    this.deviceTier = this.detectDeviceTier(config.debug);
    this.currentQuality = this.getInitialQuality();
    this.adaptiveQuality = config.debug !== true;
  }

  /**
   * Mount the engine to a DOM element
   */
  async mount(container: HTMLElement): Promise<void> {
    if (this.mounted) {
      throw new Error("StagesEngine: Already mounted");
    }

    this.container = container;

    // Initialize Three.js renderer
    await this.initializeRenderer();

    // Setup container
    this.setupContainer();

    // Initialize coordinate transform system
    this.initializeTransform();

    // Setup event handling
    this.setupEventHandlers();

    // Start render loop
    this.startRenderLoop();

    // Start adaptive quality monitoring
    if (this.adaptiveQuality) {
      this.startQualityMonitoring();
    }

    this.mounted = true;
  }

  private async initializeRenderer(): Promise<void> {
    // Note: In a real implementation, this would import and use Three.js
    // For this template, we'll create a mock structure
    this.canvas = document.createElement("canvas");
    this.canvas.width = 2048;
    this.canvas.height = 2048;
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";

    // Mock Three.js objects - replace with actual Three.js imports
    this.renderer = {
      domElement: this.canvas,
      setSize: (width: number, height: number) => {
        this.canvas!.width = width;
        this.canvas!.height = height;
      },
      setPixelRatio: (dpr: number) => {
        // Set device pixel ratio
      },
      render: (scene: any, camera: any) => {
        // Render the scene
        this.performanceMetrics.renderCalls++;
      },
      dispose: () => {
        // Cleanup renderer resources
      },
    };

    this.scene = {
      add: (object: any) => {
        // Add object to scene
      },
      remove: (object: any) => {
        // Remove object from scene
      },
    };

    this.camera = {
      position: { x: 0, y: 0, z: 1000 },
      lookAt: (x: number, y: number, z: number) => {
        // Set camera look direction
      },
    };
  }

  private setupContainer(): void {
    if (!this.container || !this.canvas) return;

    this.container.style.position = "relative";
    this.container.style.overflow = "hidden";
    this.container.style.width = "100%";
    this.container.style.height = "100%";

    this.container.appendChild(this.canvas);
  }

  private initializeTransform(): void {
    if (!this.container || !this.canvas) return;

    // Setup coordinate transform system for 2048x2048 stage
    const updateTransform = () => {
      const rect = this.container!.getBoundingClientRect();
      const scale = Math.min(rect.width / 2048, rect.height / 2048);

      this.viewportTransform = {
        scale,
        offsetX: (rect.width - 2048 * scale) / 2,
        offsetY: (rect.height - 2048 * scale) / 2,
      };
    };

    updateTransform();
    window.addEventListener("resize", updateTransform);
  }

  private setupEventHandlers(): void {
    if (!this.canvas) return;

    const handlePointerEvent = (event: PointerEvent) => {
      const coords = this.transformCoordinates(event);
      if (!coords) return;

      const stageEvent: StageEvent = {
        type: event.type as any,
        stageX: coords.stageX,
        stageY: coords.stageY,
        originalEvent: event,
      };

      // Find object at coordinates
      const objects = this.getObjectsAt(coords.stageX, coords.stageY);
      if (objects.length > 0 && objects[0]) {
        stageEvent.objectId = objects[0].id;
      }

      // Dispatch to listeners
      const listeners = this.eventListeners.get(event.type) ?? [];
      for (const listener of listeners) {
        listener(stageEvent);
      }
    };

    this.canvas.addEventListener("pointerdown", handlePointerEvent);
    this.canvas.addEventListener("pointermove", handlePointerEvent);
    this.canvas.addEventListener("pointerup", handlePointerEvent);
    this.canvas.addEventListener("click", handlePointerEvent as any);
  }

  private startRenderLoop(): void {
    let lastTime = 0;

    const render = (currentTime: number) => {
      if (!this.mounted) return;

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update performance metrics
      this.updatePerformanceMetrics(deltaTime);

      // Render the scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  private startQualityMonitoring(): void {
    const monitor = () => {
      const now = Date.now();

      if (now - this.lastQualityCheck > 2000) {
        this.lastQualityCheck = now;

        const adjustment = this.getQualityAdjustment();
        if (Object.keys(adjustment).length > 0) {
          console.log("StagesEngine: Adjusting quality", adjustment);
          this.updateQuality(adjustment);
        }
      }

      if (this.mounted) {
        setTimeout(monitor, 1000);
      }
    };

    setTimeout(monitor, 2000);
  }

  /**
   * Transform screen coordinates to stage coordinates
   */
  transformCoordinates(event: PointerEvent | MouseEvent): StageCoordinates | null {
    if (!this.container) return null;

    const rect = this.container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const { scale, offsetX, offsetY } = this.viewportTransform;

    const stageX = (x - offsetX) / scale;
    const stageY = (y - offsetY) / scale;

    return { stageX, stageY };
  }

  /**
   * Check if coordinates are within stage bounds
   */
  isWithinStage(stageX: number, stageY: number): boolean {
    return stageX >= 0 && stageX <= 2048 && stageY >= 0 && stageY <= 2048;
  }

  /**
   * Add or update a stage object
   */
  setObject(id: string, objectData: Partial<StageObject>): void {
    const object: StageObject = {
      id,
      position: [0, 0, 0],
      rotation: 0,
      scale: 1,
      visible: true,
      ...this.objects.get(id),
      ...objectData,
    };

    this.objects.set(id, object);
    this.updateRenderObject(object);
    this.performanceMetrics.objectCount = this.objects.size;
  }

  /**
   * Remove a stage object
   */
  removeObject(id: string): void {
    const object = this.objects.get(id);
    if (!object) return;

    this.objects.delete(id);

    const renderObject = this.renderObjects.get(id);
    if (renderObject && this.scene) {
      this.scene.remove(renderObject);
    }
    this.renderObjects.delete(id);

    this.performanceMetrics.objectCount = this.objects.size;
  }

  /**
   * Get objects at specific coordinates
   */
  getObjectsAt(stageX: number, stageY: number, tolerance = 10): StageObject[] {
    const result: StageObject[] = [];

    for (const object of this.objects.values()) {
      const [x, y] = object.position;
      const distance = Math.hypot(x - stageX, y - stageY);
      if (distance <= tolerance) {
        result.push(object);
      }
    }

    return result.sort((a, b) => {
      const [ax, ay] = a.position;
      const [bx, by] = b.position;
      const distA = Math.hypot(ax - stageX, ay - stageY);
      const distB = Math.hypot(bx - stageX, by - stageY);
      return distA - distB;
    });
  }

  /**
   * Add event listener
   */
  addEventListener(type: string, listener: (event: StageEvent) => void): void {
    const listeners = this.eventListeners.get(type) ?? [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: string, listener: (event: StageEvent) => void): void {
    const listeners = this.eventListeners.get(type) ?? [];
    const index = listeners.indexOf(listener);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Update rendering quality
   */
  updateQuality(quality: Partial<RenderQuality>): void {
    this.currentQuality = { ...this.currentQuality, ...quality };

    if (this.renderer) {
      if (quality.dpr !== undefined) {
        this.renderer.setPixelRatio(quality.dpr);
      }
      // Apply other quality settings...
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Dispose engine and cleanup resources
   */
  dispose(): void {
    this.mounted = false;

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.canvas && this.container) {
      this.container.removeChild(this.canvas);
    }

    this.objects.clear();
    this.renderObjects.clear();
    this.eventListeners.clear();
  }

  // Private helper methods

  private detectDeviceTier(debug?: boolean): DeviceTier {
    if (debug) {
      return {
        tier: "high",
        maxDPR: 2,
        antialias: true,
        shadowsEnabled: true,
        textureQuality: 1,
        maxObjects: 1000,
      };
    }

    // Simple device detection
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency || 4;

    if (memory >= 8 && cores >= 8) {
      return {
        tier: "high",
        maxDPR: 2,
        antialias: true,
        shadowsEnabled: true,
        textureQuality: 1,
        maxObjects: 1000,
      };
    } else if (memory >= 4 && cores >= 4) {
      return {
        tier: "mid",
        maxDPR: 1.5,
        antialias: true,
        shadowsEnabled: false,
        textureQuality: 0.8,
        maxObjects: 500,
      };
    } else {
      return {
        tier: "low",
        maxDPR: 1,
        antialias: false,
        shadowsEnabled: false,
        textureQuality: 0.6,
        maxObjects: 200,
      };
    }
  }

  private getInitialQuality(): RenderQuality {
    return {
      dpr: Math.min(this.deviceTier.maxDPR, window.devicePixelRatio || 1),
      antialias: this.deviceTier.antialias,
      shadows: this.deviceTier.shadowsEnabled,
      textureScale: this.deviceTier.textureQuality,
    };
  }

  private updateRenderObject(object: StageObject): void {
    // In a real implementation, this would create/update Three.js objects
    // For now, we'll just store the object data
    this.renderObjects.set(object.id, object);
  }

  private updatePerformanceMetrics(deltaTime: number): void {
    this.performanceMetrics.frameTime = deltaTime;
    this.performanceMetrics.fps = 1000 / Math.max(deltaTime, 1);

    // Mock memory usage - in real implementation, use performance.memory
    this.performanceMetrics.memoryUsage = this.objects.size * 0.1;
  }

  private getQualityAdjustment(): Partial<RenderQuality> {
    const { fps } = this.performanceMetrics;
    const adjustment: Partial<RenderQuality> = {};

    if (fps < 30 && this.currentQuality.dpr > 1) {
      adjustment.dpr = Math.max(1, this.currentQuality.dpr - 0.25);
    } else if (fps > 55 && this.currentQuality.dpr < this.deviceTier.maxDPR) {
      adjustment.dpr = Math.min(this.deviceTier.maxDPR, this.currentQuality.dpr + 0.25);
    }

    return adjustment;
  }
}

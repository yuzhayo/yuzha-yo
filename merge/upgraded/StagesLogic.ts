/**
 * Stages Logic Coordination & Main Export - UNIFIED ENTRY POINT
 * Coordinates dynamic child modules AND serves as library's main export file
 * AI should not modify the coordination logic - modify child modules instead
 */

import { StagesLogicTransform, STAGE_WIDTH, STAGE_HEIGHT } from "./StagesLogicTransform";
import { StagesLogicDevice } from "./StagesLogicDevice";
import { StagesLogicPerformance } from "./StagesLogicPerformance";
import type {
  StageConfig,
  DeviceTier,
  RenderQuality,
  PerformanceMetrics,
  StageCoordinates,
  ViewportTransform,
} from "./StagesTypes";

// ==============================================================================
// LIBRARY EXPORTS - Unified Entry Point
// ==============================================================================

// Main engine (imported for re-export)
export { StagesEngine } from "./StagesEngine";

// Logic child modules (AI can modify these)
export { StagesLogicDevice } from "./StagesLogicDevice";
export { StagesLogicTransform } from "./StagesLogicTransform";
export { StagesLogicPerformance } from "./StagesLogicPerformance";

// Core modules (for advanced usage) - DEPRECATED: Use StagesLogic* modules instead
export { StagesRenderer } from "./StagesRenderer";

// Child modules (AI can modify these)
export { StagesEngineObjects } from "./StagesEngineObjects";
export { StagesEngineEvents } from "./StagesEngineEvents";
export { StagesRendererMesh } from "./StagesRendererMesh";
export { StagesRendererMaterial } from "./StagesRendererMaterial";

// Constants for backward compatibility
export { STAGE_WIDTH, STAGE_HEIGHT } from "./StagesLogicTransform";

// Types
export type {
  StageObject,
  StageConfig,
  DeviceTier,
  PerformanceMetrics,
  StageCoordinates,
  ViewportTransform,
  StageEvent,
  RenderQuality,
} from "./StagesTypes";

// ==============================================================================
// LIBRARY CONSTANTS AND FACTORY FUNCTIONS
// ==============================================================================

/**
 * Library version
 */
export const VERSION = "1.0.0";

/**
 * Library constants (exported from StagesLogicTransform for consistency)
 */
export const CONSTANTS = {
  STAGE_WIDTH,
  STAGE_HEIGHT,
  VERSION: "1.0.0",
} as const;

// Import StagesEngine for factory function
import { StagesEngine } from "./StagesEngine";

/**
 * Create a new Stages Engine instance
 */
export function createStages(config?: StageConfig): StagesEngine {
  return new StagesEngine(config);
}

// ==============================================================================
// COORDINATION INTERFACES - Original StagesLogic functionality
// ==============================================================================

export interface StagesLogicUpdateCallback {
  onDeviceChange?: (tier: DeviceTier) => void;
  onTransformChange?: (transform: ViewportTransform) => void;
  onPerformanceChange?: (adjustment: Partial<RenderQuality>) => void;
}

export class StagesLogic {
  // Dynamic child modules (AI can modify these)
  private transformRules: StagesLogicTransform;
  private deviceRules: StagesLogicDevice;
  private performanceRules: StagesLogicPerformance;

  // Update callback for notifying StagesEngine of changes
  private updateCallback: StagesLogicUpdateCallback | null = null;

  constructor(config: StageConfig = {}) {
    // Initialize child modules with configuration
    this.deviceRules = new StagesLogicDevice(config);
    this.transformRules = new StagesLogicTransform(config);
    this.performanceRules = new StagesLogicPerformance(config);

    // Setup inter-module communication
    this.setupUpdateHandlers();
  }

  /**
   * Setup update handlers for child modules to communicate changes
   */
  private setupUpdateHandlers(): void {
    // Device changes affect performance and transform
    this.deviceRules.onTierChange = (tier: DeviceTier) => {
      this.performanceRules.setDeviceTier(tier);
      this.updateCallback?.onDeviceChange?.(tier);
    };

    // Performance changes need to propagate to renderer
    this.performanceRules.onQualityAdjustment = (adjustment: Partial<RenderQuality>) => {
      this.updateCallback?.onPerformanceChange?.(adjustment);
    };

    // Transform changes need to propagate to renderer
    this.transformRules.onTransformChange = (transform: ViewportTransform) => {
      this.updateCallback?.onTransformChange?.(transform);
    };
  }

  /**
   * Set update callback for StagesEngine to receive notifications
   */
  setUpdateCallback(callback: StagesLogicUpdateCallback): void {
    this.updateCallback = callback;
  }

  /**
   * Get device performance tier
   */
  getDeviceTier(): DeviceTier {
    return this.deviceRules.detectTier();
  }

  /**
   * Get render quality settings for current device
   */
  getRenderQuality(): RenderQuality {
    return this.deviceRules.getRenderQuality();
  }

  /**
   * Force specific device tier
   */
  setDeviceTier(tier: "low" | "mid" | "high"): void {
    this.deviceRules.setDeviceTier(tier);
  }

  /**
   * Initialize transform system
   */
  initializeTransform(container: HTMLElement, canvas: HTMLCanvasElement): void {
    this.transformRules.initialize(container, canvas);
  }

  /**
   * Get current viewport transform
   */
  getTransform(): ViewportTransform | null {
    return this.transformRules.getTransform();
  }

  /**
   * Transform viewport coordinates to stage coordinates
   */
  transformCoordinates(clientX: number, clientY: number): StageCoordinates | null {
    return this.transformRules.transformCoordinates(clientX, clientY);
  }

  /**
   * Transform event to stage coordinates
   */
  transformEvent(event: PointerEvent | MouseEvent | TouchEvent): StageCoordinates | null {
    return this.transformRules.transformEvent(event);
  }

  /**
   * Check if coordinates are within stage
   */
  isWithinStage(stageX: number, stageY: number): boolean {
    return this.transformRules.isWithinStage(stageX, stageY);
  }

  /**
   * Update performance metrics (call every frame)
   */
  updatePerformance(): void {
    this.performanceRules.update();
  }

  /**
   * Track render call for performance monitoring
   */
  trackRenderCall(): void {
    this.performanceRules.trackRenderCall();
  }

  /**
   * Set object count for performance monitoring
   */
  setObjectCount(count: number): void {
    this.performanceRules.setObjectCount(count);
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceRules.getMetrics();
  }

  /**
   * Get recommended quality adjustment
   */
  getQualityAdjustment(currentQuality: RenderQuality): Partial<RenderQuality> {
    return this.performanceRules.getQualityAdjustment(currentQuality);
  }

  /**
   * Check if device can handle specific object count
   */
  canHandle(objectCount: number): boolean {
    const tier = this.getDeviceTier();
    return objectCount <= tier.maxObjects;
  }

  /**
   * Get comprehensive logic statistics
   */
  getStats() {
    return {
      device: this.deviceRules.getStats(),
      transform: this.transformRules.getStats(),
      performance: this.performanceRules.getStats(),
    };
  }

  /**
   * Reset all logic modules
   */
  reset(): void {
    this.performanceRules.reset();
    this.deviceRules.reset();
    // Transform system doesn't need reset as it's reactive
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.transformRules.dispose();
    this.deviceRules.dispose();
    this.performanceRules.dispose();
    this.updateCallback = null;
  }
}

// ==============================================================================
// DEFAULT EXPORT - Main library entry point
// ==============================================================================

// Default export - Main library entry point
export { StagesEngine as default } from "./StagesEngine";

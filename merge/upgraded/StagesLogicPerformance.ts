/**
 * Performance monitoring and adaptive quality system - CHILD of StagesLogic
 * AI can modify this file to adjust performance thresholds, monitoring rules, and quality adjustments
 */

import type { PerformanceMetrics, RenderQuality, DeviceTier, StageConfig } from "./StagesTypes";

export class StagesLogicPerformance {
  private frameCount = 0;
  private lastTime = 0;
  private fpsHistory: number[] = [];
  private renderCalls = 0;
  private objectCount = 0;
  private deviceTier: DeviceTier | null = null;
  private performanceRules: PerformanceRules;

  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    renderCalls: 0,
    objectCount: 0,
  };

  // Callback for notifying parent of quality adjustments
  public onQualityAdjustment: ((adjustment: Partial<RenderQuality>) => void) | null = null;

  constructor(config: StageConfig = {}) {
    this.performanceRules = new PerformanceRules(config);
  }

  /**
   * Set device tier for performance calculations
   */
  setDeviceTier(tier: DeviceTier): void {
    this.deviceTier = tier;
    this.performanceRules.setDeviceTier(tier);
  }

  /**
   * Update performance metrics (call every frame)
   * AI can modify performance calculation logic via PerformanceRules
   */
  update(): void {
    const now = performance.now();
    const deltaTime = now - this.lastTime;

    if (deltaTime >= 1000) {
      // Update every second
      const fps = (this.frameCount * 1000) / deltaTime;
      this.fpsHistory.push(fps);

      // Keep history size manageable (AI can modify this)
      const maxHistorySize = this.performanceRules.getMaxHistorySize();
      if (this.fpsHistory.length > maxHistorySize) {
        this.fpsHistory.shift();
      }

      this.updateMetrics(fps);
      this.checkPerformanceAdjustments();

      this.frameCount = 0;
      this.renderCalls = 0;
      this.lastTime = now;
    }

    this.frameCount++;
  }

  /**
   * Update internal metrics
   */
  private updateMetrics(fps: number): void {
    this.metrics.fps = fps;
    this.metrics.frameTime = 1000 / fps;
    this.metrics.renderCalls = this.renderCalls;
    this.metrics.objectCount = this.objectCount;

    // Update memory usage if available
    const memory = (performance as any).memory;
    if (memory) {
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  /**
   * Check if performance adjustments are needed
   * AI can modify adjustment logic via PerformanceRules
   */
  private checkPerformanceAdjustments(): void {
    if (!this.deviceTier || this.fpsHistory.length < 3) return;

    const currentQuality = this.getCurrentRenderQuality();
    const adjustment = this.performanceRules.calculateQualityAdjustment(
      this.fpsHistory,
      currentQuality,
      this.metrics,
    );

    if (Object.keys(adjustment).length > 0) {
      this.onQualityAdjustment?.(adjustment);
    }
  }

  /**
   * Get current render quality (placeholder - would come from renderer)
   */
  private getCurrentRenderQuality(): RenderQuality {
    if (!this.deviceTier) {
      return { dpr: 1.0, antialias: false, shadows: false, textureScale: 0.5 };
    }

    const actualDPR = Math.min(this.deviceTier.maxDPR, window.devicePixelRatio || 1);
    return {
      dpr: actualDPR,
      antialias: this.deviceTier.antialias,
      shadows: this.deviceTier.shadowsEnabled,
      textureScale: this.deviceTier.textureQuality,
    };
  }

  /**
   * Track render call for performance monitoring
   */
  trackRenderCall(): void {
    this.renderCalls++;
  }

  /**
   * Update object count for performance monitoring
   */
  setObjectCount(count: number): void {
    this.objectCount = count;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recommended quality adjustment
   * AI can modify adjustment algorithms via PerformanceRules
   */
  getQualityAdjustment(currentQuality: RenderQuality): Partial<RenderQuality> {
    return this.performanceRules.calculateQualityAdjustment(
      this.fpsHistory,
      currentQuality,
      this.metrics,
    );
  }

  /**
   * Get average FPS over time window
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      metrics: this.metrics,
      fpsHistory: [...this.fpsHistory],
      averageFPS: this.getAverageFPS(),
      performanceGrade: this.performanceRules.getPerformanceGrade(this.getAverageFPS()),
      rules: this.performanceRules.getStats(),
    };
  }

  /**
   * Reset performance history and metrics
   */
  reset(): void {
    this.frameCount = 0;
    this.lastTime = 0;
    this.fpsHistory = [];
    this.renderCalls = 0;
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      renderCalls: 0,
      objectCount: this.objectCount, // Keep object count
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.reset();
    this.deviceTier = null;
    this.onQualityAdjustment = null;
  }
}

/**
 * Performance calculation rules - AI can modify these rules
 */
class PerformanceRules {
  // AI can modify these performance thresholds
  private targetFPS: number = 60;
  private minFPS: number = 45; // Threshold for quality reduction
  private maxFPS: number = 55; // Threshold for quality increase
  private maxHistorySize: number = 30; // 30 seconds of samples
  private adjustmentCooldown: number = 5000; // 5 seconds between adjustments

  private lastAdjustmentTime: number = 0;
  private deviceTier: DeviceTier | null = null;

  constructor(config: StageConfig = {}) {
    // AI can make these configurable via config
    if (config.debug) {
      this.adjustmentCooldown = 1000; // Faster adjustments in debug mode
    }
  }

  /**
   * Set device tier for performance calculations
   */
  setDeviceTier(tier: DeviceTier): void {
    this.deviceTier = tier;
  }

  /**
   * Calculate quality adjustment based on performance metrics
   * AI can modify this core adjustment algorithm
   */
  calculateQualityAdjustment(
    fpsHistory: number[],
    currentQuality: RenderQuality,
    metrics: PerformanceMetrics,
  ): Partial<RenderQuality> {
    // Cooldown to prevent rapid adjustments
    const now = Date.now();
    if (now - this.lastAdjustmentTime < this.adjustmentCooldown) {
      return {};
    }

    const avgFPS = fpsHistory.reduce((sum, fps) => sum + fps, 0) / fpsHistory.length;

    // Check for quality reduction
    if (this.shouldReduceQuality(avgFPS, fpsHistory, metrics)) {
      this.lastAdjustmentTime = now;
      return this.calculateQualityReduction(currentQuality);
    }

    // Check for quality increase
    if (this.shouldIncreaseQuality(avgFPS, fpsHistory, metrics)) {
      this.lastAdjustmentTime = now;
      return this.calculateQualityIncrease(currentQuality);
    }

    return {};
  }

  /**
   * Determine if quality should be reduced
   * AI can modify reduction criteria
   */
  private shouldReduceQuality(
    avgFPS: number,
    fpsHistory: number[],
    metrics: PerformanceMetrics,
  ): boolean {
    // Multiple criteria for quality reduction
    const fpsLow = avgFPS < this.minFPS;
    const consistentlyLow = fpsHistory.slice(-5).every((fps) => fps < this.minFPS + 5);
    const memoryPressure = metrics.memoryUsage > 200; // 200MB threshold
    const highObjectCount = this.deviceTier
      ? metrics.objectCount > this.deviceTier.maxObjects * 0.8
      : false;

    return fpsLow && (consistentlyLow || memoryPressure || highObjectCount);
  }

  /**
   * Determine if quality can be increased
   * AI can modify increase criteria
   */
  private shouldIncreaseQuality(
    avgFPS: number,
    fpsHistory: number[],
    metrics: PerformanceMetrics,
  ): boolean {
    // Conservative criteria for quality increase
    const fpsHigh = avgFPS > this.maxFPS;
    const stablePerformance = fpsHistory.length >= 10 && this.isPerformanceStable(fpsHistory);
    const lowMemory = metrics.memoryUsage < 100; // Low memory usage
    const reasonableObjectCount = this.deviceTier
      ? metrics.objectCount < this.deviceTier.maxObjects * 0.6
      : true;

    return fpsHigh && stablePerformance && lowMemory && reasonableObjectCount;
  }

  /**
   * Calculate quality reduction adjustments
   * AI can modify reduction strategies
   */
  private calculateQualityReduction(currentQuality: RenderQuality): Partial<RenderQuality> {
    const adjustment: Partial<RenderQuality> = {};

    // Reduce DPR first (biggest performance impact)
    if (currentQuality.dpr > 1.0) {
      adjustment.dpr = Math.max(0.5, currentQuality.dpr * 0.8);
    }

    // Disable expensive features
    if (currentQuality.shadows) {
      adjustment.shadows = false;
    }

    if (currentQuality.antialias && currentQuality.dpr <= 1.0) {
      adjustment.antialias = false;
    }

    // Reduce texture quality
    if (currentQuality.textureScale > 0.3) {
      adjustment.textureScale = Math.max(0.3, currentQuality.textureScale * 0.8);
    }

    return adjustment;
  }

  /**
   * Calculate quality increase adjustments
   * AI can modify increase strategies
   */
  private calculateQualityIncrease(currentQuality: RenderQuality): Partial<RenderQuality> {
    const adjustment: Partial<RenderQuality> = {};
    const deviceLimits = this.deviceTier;

    if (!deviceLimits) return adjustment;

    // Increase texture quality first (least performance impact)
    if (currentQuality.textureScale < deviceLimits.textureQuality) {
      adjustment.textureScale = Math.min(
        deviceLimits.textureQuality,
        currentQuality.textureScale * 1.1,
      );
    }

    // Enable antialias if device supports it
    if (!currentQuality.antialias && deviceLimits.antialias) {
      adjustment.antialias = true;
    }

    // Increase DPR carefully
    if (currentQuality.dpr < deviceLimits.maxDPR) {
      adjustment.dpr = Math.min(deviceLimits.maxDPR, currentQuality.dpr * 1.1);
    }

    // Enable shadows last (highest performance impact)
    if (!currentQuality.shadows && deviceLimits.shadowsEnabled && currentQuality.dpr >= 1.5) {
      adjustment.shadows = true;
    }

    return adjustment;
  }

  /**
   * Check if performance is stable
   * AI can modify stability criteria
   */
  private isPerformanceStable(fpsHistory: number[]): boolean {
    if (fpsHistory.length < 5) return false;

    const recent = fpsHistory.slice(-5);
    const variance = this.calculateVariance(recent);
    return variance < 50; // Low variance means stable performance
  }

  /**
   * Calculate variance of FPS samples
   */
  private calculateVariance(samples: number[]): number {
    const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    const squaredDiffs = samples.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / samples.length;
  }

  /**
   * Get performance grade
   * AI can modify grading criteria
   */
  getPerformanceGrade(avgFPS: number): "excellent" | "good" | "fair" | "poor" {
    if (avgFPS >= 55) return "excellent";
    if (avgFPS >= 45) return "good";
    if (avgFPS >= 30) return "fair";
    return "poor";
  }

  /**
   * Get max history size
   */
  getMaxHistorySize(): number {
    return this.maxHistorySize;
  }

  /**
   * Get performance rules statistics
   */
  getStats() {
    return {
      thresholds: {
        targetFPS: this.targetFPS,
        minFPS: this.minFPS,
        maxFPS: this.maxFPS,
      },
      settings: {
        maxHistorySize: this.maxHistorySize,
        adjustmentCooldown: this.adjustmentCooldown,
      },
      deviceTier: this.deviceTier?.tier || "unknown",
    };
  }

  /**
   * AI can call these methods to modify thresholds dynamically
   */
  setFPSThresholds(target: number, min: number, max: number): void {
    this.targetFPS = target;
    this.minFPS = min;
    this.maxFPS = max;
  }

  setHistorySize(size: number): void {
    this.maxHistorySize = Math.max(5, size);
  }

  setAdjustmentCooldown(ms: number): void {
    this.adjustmentCooldown = Math.max(1000, ms);
  }
}

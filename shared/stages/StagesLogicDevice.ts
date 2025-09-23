/**
 * Device detection and performance tier management - CHILD of StagesLogic
 * AI can modify this file to adjust device detection rules and performance tiers
 */

import type { DeviceTier, RenderQuality, StageConfig } from "./StagesTypes";

export class StagesLogicDevice {
  private deviceTier: DeviceTier | null = null;
  private forcedTier: "low" | "mid" | "high" | null = null;
  private detectionRules: DeviceDetectionRules;

  // Callback for notifying parent of tier changes
  public onTierChange: ((tier: DeviceTier) => void) | null = null;

  constructor(config: StageConfig = {}) {
    this.detectionRules = new DeviceDetectionRules();

    // Apply forced tier from config
    if (config.deviceTier && config.deviceTier !== "auto") {
      this.setDeviceTier(config.deviceTier);
    } else {
      this.detectDevice();
    }
  }

  /**
   * Detect device performance tier
   * AI can modify detection logic by updating DeviceDetectionRules
   */
  detectDevice(): DeviceTier {
    if (this.forcedTier) {
      this.deviceTier = this.getTierConfig(this.forcedTier);
      return this.deviceTier;
    }

    const detectedTier = this.detectionRules.detectTier();
    this.deviceTier = this.getTierConfig(detectedTier);

    // Notify parent of tier change
    this.onTierChange?.(this.deviceTier);

    return this.deviceTier;
  }

  /**
   * Get device tier (detect if not already done)
   */
  detectTier(): DeviceTier {
    if (!this.deviceTier) {
      return this.detectDevice();
    }
    return this.deviceTier;
  }

  /**
   * Force specific device tier
   * AI can call this to override automatic detection
   */
  setDeviceTier(tier: "low" | "mid" | "high"): void {
    this.forcedTier = tier;
    const newTier = this.getTierConfig(tier);

    if (this.deviceTier?.tier !== newTier.tier) {
      this.deviceTier = newTier;
      this.onTierChange?.(this.deviceTier);
    }
  }

  /**
   * Get configuration for device tier
   * AI can modify these configurations to adjust performance parameters
   */
  private getTierConfig(tier: "low" | "mid" | "high"): DeviceTier {
    return this.detectionRules.getTierConfig(tier);
  }

  /**
   * Get render quality settings for current device
   */
  getRenderQuality(): RenderQuality {
    const tier = this.detectTier();
    const actualDPR = Math.min(tier.maxDPR, window.devicePixelRatio || 1);

    return {
      dpr: actualDPR,
      antialias: tier.antialias,
      shadows: tier.shadowsEnabled,
      textureScale: tier.textureQuality,
    };
  }

  /**
   * Get device statistics
   */
  getStats() {
    return {
      currentTier: this.deviceTier?.tier || "unknown",
      forced: this.forcedTier !== null,
      quality: this.getRenderQuality(),
      detectionRules: this.detectionRules.getStats(),
    };
  }

  /**
   * Reset device detection (re-detect)
   */
  reset(): void {
    if (!this.forcedTier) {
      this.deviceTier = null;
      this.detectDevice();
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.deviceTier = null;
    this.forcedTier = null;
    this.onTierChange = null;
  }
}

/**
 * Device detection rules class - AI can modify these rules
 */
class DeviceDetectionRules {
  // AI can modify these detection parameters
  private readonly GPU_HIGH_INDICATORS = ["NVIDIA", "AMD", "Intel Arc"];
  private readonly GPU_MID_INDICATORS = ["Intel", "Mali", "Adreno"];
  private readonly MEMORY_THRESHOLD_HIGH = 1000000000; // 1GB
  private readonly MEMORY_THRESHOLD_MID = 500000000; // 500MB

  // AI can modify these tier configurations
  private readonly TIER_CONFIGS = {
    high: {
      tier: "high" as const,
      maxDPR: 2.0,
      antialias: true,
      shadowsEnabled: true,
      textureQuality: 1.0,
      maxObjects: 1000,
    },
    mid: {
      tier: "mid" as const,
      maxDPR: 1.5,
      antialias: true,
      shadowsEnabled: false,
      textureQuality: 0.8,
      maxObjects: 500,
    },
    low: {
      tier: "low" as const,
      maxDPR: 1.0,
      antialias: false,
      shadowsEnabled: false,
      textureQuality: 0.5,
      maxObjects: 250,
    },
  };

  /**
   * Detect device tier using GPU and memory analysis
   * AI can modify this detection logic
   */
  detectTier(): "low" | "mid" | "high" {
    const gpuInfo = this.getGPUInfo();
    if (!gpuInfo) {
      return "low";
    }

    // Check for high-end GPU indicators
    if (this.isHighEndGPU(gpuInfo)) {
      return "high";
    }

    // Check for mid-tier GPU indicators
    if (this.isMidTierGPU(gpuInfo)) {
      return this.getMemoryBasedTier();
    }

    // Fallback to memory-based detection
    return this.getMemoryBasedTier();
  }

  /**
   * Get WebGL GPU information
   */
  private getGPUInfo(): { renderer: string; vendor: string } | null {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") ||
        (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

      if (!gl) return null;

      return {
        renderer: gl.getParameter(gl.RENDERER) as string,
        vendor: gl.getParameter(gl.VENDOR) as string,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if GPU indicates high-end device
   * AI can modify these detection rules
   */
  private isHighEndGPU(gpuInfo: { renderer: string; vendor: string }): boolean {
    return this.GPU_HIGH_INDICATORS.some(
      (indicator) => gpuInfo.renderer.includes(indicator) || gpuInfo.vendor.includes(indicator),
    );
  }

  /**
   * Check if GPU indicates mid-tier device
   * AI can modify these detection rules
   */
  private isMidTierGPU(gpuInfo: { renderer: string; vendor: string }): boolean {
    return this.GPU_MID_INDICATORS.some(
      (indicator) => gpuInfo.renderer.includes(indicator) || gpuInfo.vendor.includes(indicator),
    );
  }

  /**
   * Get tier based on memory availability
   * AI can modify memory thresholds
   */
  private getMemoryBasedTier(): "low" | "mid" | "high" {
    const memory = (performance as any).memory;
    if (!memory || !memory.jsHeapSizeLimit) {
      return "mid"; // Default fallback
    }

    if (memory.jsHeapSizeLimit > this.MEMORY_THRESHOLD_HIGH) {
      return "high";
    }

    if (memory.jsHeapSizeLimit > this.MEMORY_THRESHOLD_MID) {
      return "mid";
    }

    return "low";
  }

  /**
   * Get tier configuration
   * AI can modify tier parameters
   */
  getTierConfig(tier: "low" | "mid" | "high"): DeviceTier {
    return { ...this.TIER_CONFIGS[tier] };
  }

  /**
   * Get detection statistics
   */
  getStats() {
    const gpuInfo = this.getGPUInfo();
    const memory = (performance as any).memory;

    return {
      gpu: gpuInfo,
      memory: memory
        ? {
            limit: memory.jsHeapSizeLimit,
            used: memory.usedJSHeapSize,
          }
        : null,
      thresholds: {
        memoryHigh: this.MEMORY_THRESHOLD_HIGH,
        memoryMid: this.MEMORY_THRESHOLD_MID,
      },
    };
  }
}

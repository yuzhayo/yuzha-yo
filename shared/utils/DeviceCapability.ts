/**
 * Device capability detection for adaptive performance settings
 * Optimized for mid-low end Android devices
 */

export type DevicePerformanceLevel = "high" | "medium" | "low";

export interface DeviceCapability {
  performanceLevel: DevicePerformanceLevel;
  isMobile: boolean;
  isLowEndDevice: boolean;
  pixelRatio: number;
  enableAntialiasing: boolean;
  maxTextureSize: number;
}

function detectPerformanceLevel(): DevicePerformanceLevel {
  if (typeof navigator === "undefined") return "medium";

  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;

  if (cores <= 4 || memory <= 2) return "low";
  if (cores <= 6 || memory <= 4) return "medium";
  return "high";
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function getDeviceCapability(): DeviceCapability {
  const performanceLevel = detectPerformanceLevel();
  const isMobile = isMobileDevice();
  const isLowEndDevice = performanceLevel === "low" || (isMobile && performanceLevel === "medium");

  const pixelRatio = isLowEndDevice ? 1 : Math.min(window.devicePixelRatio || 1, 2);

  const enableAntialiasing = !isMobile && performanceLevel === "high";

  const maxTextureSize = isLowEndDevice ? 1024 : 2048;

  return {
    performanceLevel,
    isMobile,
    isLowEndDevice,
    pixelRatio,
    enableAntialiasing,
    maxTextureSize,
  };
}

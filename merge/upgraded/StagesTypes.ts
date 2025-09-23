/**
 * TypeScript interfaces for Stages Library
 */

export interface StageObject {
  id: string;
  position: [number, number, number?]; // x, y, z (z optional for 2D)
  rotation?: number | [number, number, number];
  scale?: number | [number, number, number];
  visible?: boolean;
  metadata?: Record<string, any>;
}

export interface StageConfig {
  width?: number; // Fixed 2048
  height?: number; // Fixed 2048
  debug?: boolean;
  deviceTier?: "auto" | "low" | "mid" | "high";
}

export interface DeviceTier {
  tier: "low" | "mid" | "high";
  maxDPR: number;
  antialias: boolean;
  shadowsEnabled: boolean;
  textureQuality: number;
  maxObjects: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCalls: number;
  objectCount: number;
}

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

export interface RenderQuality {
  dpr: number;
  antialias: boolean;
  shadows: boolean;
  textureScale: number;
}

/**
 * TypeScript interfaces for Fixed Canvas Stage System
 * Simplified version focused on coordinate transformation and canvas management
 */

export interface StageCoordinates {
  stageX: number;
  stageY: number;
}

export interface StageTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  containerWidth: number;
  containerHeight: number;
}

export interface ViewportTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface StageConfig {
  width?: number; // Fixed 2048
  height?: number; // Fixed 2048
  debug?: boolean;
}

export interface StageEvent {
  type: "pointerdown" | "pointermove" | "pointerup" | "click";
  stageX: number;
  stageY: number;
  originalEvent: PointerEvent | MouseEvent;
}

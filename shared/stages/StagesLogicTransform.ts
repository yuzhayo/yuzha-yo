/**
 * Stage coordinate transformation system - CHILD of StagesLogic
 * AI can modify this file to adjust dimensions, scaling behavior, and coordinate transformation
 */

import type { StageCoordinates, ViewportTransform, StageConfig } from "./StagesTypes";

// Export constants for backward compatibility
export const STAGE_WIDTH = 2048;
export const STAGE_HEIGHT = 2048;

export class StagesLogicTransform {
  private transform: ViewportTransform | null = null;
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private transformRules: TransformRules;

  // Callback for notifying parent of transform changes
  public onTransformChange: ((transform: ViewportTransform) => void) | null = null;

  constructor(config: StageConfig = {}) {
    this.transformRules = new TransformRules(config);

    this.resizeObserver = new ResizeObserver(() => {
      this.updateTransform();
    });
  }

  /**
   * Initialize transform system
   */
  initialize(container: HTMLElement, canvas: HTMLCanvasElement): void {
    this.container = container;
    this.canvas = canvas;

    // Start observing resize events
    this.resizeObserver?.observe(container);

    // Initial transform calculation
    this.updateTransform();
  }

  /**
   * Update transform based on current viewport size
   * AI can modify this by changing TransformRules
   */
  updateTransform(): void {
    if (!this.container || !this.canvas) return;

    const rect = this.container.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    const newTransform = this.transformRules.calculateTransform(viewportWidth, viewportHeight);

    // Only update if transform actually changed
    if (!this.transform || this.hasTransformChanged(this.transform, newTransform)) {
      this.transform = newTransform;
      this.applyTransformToCanvas();

      // Notify parent of transform change
      this.onTransformChange?.(this.transform);
    }
  }

  /**
   * Check if transform has meaningfully changed
   */
  private hasTransformChanged(old: ViewportTransform, new_: ViewportTransform): boolean {
    const threshold = 0.001;
    return (
      Math.abs(old.scale - new_.scale) > threshold ||
      Math.abs(old.offsetX - new_.offsetX) > 1 ||
      Math.abs(old.offsetY - new_.offsetY) > 1
    );
  }

  /**
   * Apply CSS transforms to canvas based on current transform
   */
  private applyTransformToCanvas(): void {
    if (!this.canvas || !this.transform) return;

    this.canvas.style.transform = `translate(-50%, -50%) scale(${this.transform.scale})`;
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "50%";
    this.canvas.style.left = "50%";
  }

  /**
   * Transform viewport coordinates to stage coordinates
   */
  transformCoordinates(clientX: number, clientY: number): StageCoordinates | null {
    if (!this.transform || !this.container) return null;

    const rect = this.container.getBoundingClientRect();
    const viewportX = clientX - rect.left;
    const viewportY = clientY - rect.top;

    return this.transformRules.transformCoordinates(viewportX, viewportY, this.transform);
  }

  /**
   * Transform event to stage coordinates
   */
  transformEvent(event: PointerEvent | MouseEvent | TouchEvent): StageCoordinates | null {
    let clientX: number, clientY: number;

    if ("touches" in event && event.touches.length > 0) {
      const touch = event.touches[0];
      if (!touch) return null;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else if ("clientX" in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return null;
    }

    return this.transformCoordinates(clientX, clientY);
  }

  /**
   * Check if coordinates are within stage bounds
   */
  isWithinStage(stageX: number, stageY: number): boolean {
    return this.transformRules.isWithinStage(stageX, stageY);
  }

  /**
   * Get current transform
   */
  getTransform(): ViewportTransform | null {
    return this.transform;
  }

  /**
   * Convert stage coordinates to world coordinates (for Three.js)
   */
  stageToWorld(stageX: number, stageY: number): [number, number] {
    return this.transformRules.stageToWorld(stageX, stageY);
  }

  /**
   * Convert world coordinates to stage coordinates
   */
  worldToStage(worldX: number, worldY: number): [number, number] {
    return this.transformRules.worldToStage(worldX, worldY);
  }

  /**
   * Get transform statistics
   */
  getStats() {
    return {
      initialized: this.container !== null && this.canvas !== null,
      currentTransform: this.transform,
      stageDimensions: this.transformRules.getStageDimensions(),
      transformRules: this.transformRules.getStats(),
    };
  }

  /**
   * Dispose transform system
   */
  dispose(): void {
    this.resizeObserver?.disconnect();
    this.container = null;
    this.canvas = null;
    this.transform = null;
    this.onTransformChange = null;
  }
}

/**
 * Transform calculation rules - AI can modify these rules
 */
class TransformRules {
  // AI can modify these stage dimensions
  private stageWidth: number;
  private stageHeight: number;
  private scalingBehavior: "cover" | "contain" | "fill";

  constructor(config: StageConfig = {}) {
    // AI can modify default dimensions
    this.stageWidth = config.width || STAGE_WIDTH;
    this.stageHeight = config.height || STAGE_HEIGHT;
    this.scalingBehavior = "cover"; // AI can make this configurable
  }

  /**
   * Calculate viewport transform for specified behavior
   * AI can modify scaling algorithms here
   */
  calculateTransform(viewportWidth: number, viewportHeight: number): ViewportTransform {
    switch (this.scalingBehavior) {
      case "cover":
        return this.calculateCoverTransform(viewportWidth, viewportHeight);
      case "contain":
        return this.calculateContainTransform(viewportWidth, viewportHeight);
      case "fill":
        return this.calculateFillTransform(viewportWidth, viewportHeight);
      default:
        return this.calculateCoverTransform(viewportWidth, viewportHeight);
    }
  }

  /**
   * Cover behavior: scale to fill viewport, maintain aspect ratio
   * AI can modify cover algorithm
   */
  private calculateCoverTransform(
    viewportWidth: number,
    viewportHeight: number,
  ): ViewportTransform {
    const scaleX = viewportWidth / this.stageWidth;
    const scaleY = viewportHeight / this.stageHeight;
    const scale = Math.max(scaleX, scaleY); // Use larger scale for cover

    const scaledWidth = this.stageWidth * scale;
    const scaledHeight = this.stageHeight * scale;

    // Center the scaled stage
    const offsetX = (viewportWidth - scaledWidth) / 2;
    const offsetY = (viewportHeight - scaledHeight) / 2;

    return { scale, offsetX, offsetY };
  }

  /**
   * Contain behavior: scale to fit viewport, maintain aspect ratio
   * AI can add this behavior
   */
  private calculateContainTransform(
    viewportWidth: number,
    viewportHeight: number,
  ): ViewportTransform {
    const scaleX = viewportWidth / this.stageWidth;
    const scaleY = viewportHeight / this.stageHeight;
    const scale = Math.min(scaleX, scaleY); // Use smaller scale for contain

    const scaledWidth = this.stageWidth * scale;
    const scaledHeight = this.stageHeight * scale;

    const offsetX = (viewportWidth - scaledWidth) / 2;
    const offsetY = (viewportHeight - scaledHeight) / 2;

    return { scale, offsetX, offsetY };
  }

  /**
   * Fill behavior: stretch to fill viewport exactly
   * AI can add this behavior
   */
  private calculateFillTransform(viewportWidth: number, viewportHeight: number): ViewportTransform {
    // For uniform scaling, use average of X and Y scales
    const scaleX = viewportWidth / this.stageWidth;
    const scaleY = viewportHeight / this.stageHeight;
    const scale = (scaleX + scaleY) / 2;

    const scaledWidth = this.stageWidth * scale;
    const scaledHeight = this.stageHeight * scale;

    const offsetX = (viewportWidth - scaledWidth) / 2;
    const offsetY = (viewportHeight - scaledHeight) / 2;

    return { scale, offsetX, offsetY };
  }

  /**
   * Transform viewport coordinates to stage coordinates
   * AI can modify coordinate transformation math
   */
  transformCoordinates(
    viewportX: number,
    viewportY: number,
    transform: ViewportTransform,
  ): StageCoordinates {
    const stageX = (viewportX - transform.offsetX) / transform.scale;
    const stageY = (viewportY - transform.offsetY) / transform.scale;

    return { stageX, stageY };
  }

  /**
   * Check if coordinates are within stage bounds
   * AI can modify stage boundary logic
   */
  isWithinStage(stageX: number, stageY: number): boolean {
    return stageX >= 0 && stageX <= this.stageWidth && stageY >= 0 && stageY <= this.stageHeight;
  }

  /**
   * Convert stage coordinates to world coordinates (for Three.js)
   * AI can modify coordinate system conversion
   */
  stageToWorld(stageX: number, stageY: number): [number, number] {
    // Convert from 0-stageWidth range to centered coordinate system
    const worldX = stageX - this.stageWidth / 2;
    const worldY = -(stageY - this.stageHeight / 2); // Flip Y for Three.js
    return [worldX, worldY];
  }

  /**
   * Convert world coordinates to stage coordinates
   * AI can modify coordinate system conversion
   */
  worldToStage(worldX: number, worldY: number): [number, number] {
    const stageX = worldX + this.stageWidth / 2;
    const stageY = -worldY + this.stageHeight / 2; // Flip Y back
    return [stageX, stageY];
  }

  /**
   * Get current stage dimensions
   * AI can add dynamic dimension changes
   */
  getStageDimensions(): { width: number; height: number } {
    return { width: this.stageWidth, height: this.stageHeight };
  }

  /**
   * Set stage dimensions (AI can call this to change dimensions dynamically)
   */
  setStageDimensions(width: number, height: number): void {
    this.stageWidth = width;
    this.stageHeight = height;
  }

  /**
   * Set scaling behavior (AI can call this to change scaling mode)
   */
  setScalingBehavior(behavior: "cover" | "contain" | "fill"): void {
    this.scalingBehavior = behavior;
  }

  /**
   * Get transform rules statistics
   */
  getStats() {
    return {
      dimensions: { width: this.stageWidth, height: this.stageHeight },
      scalingBehavior: this.scalingBehavior,
      aspectRatio: this.stageWidth / this.stageHeight,
    };
  }
}

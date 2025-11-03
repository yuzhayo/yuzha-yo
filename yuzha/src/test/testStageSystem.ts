/**
 * ============================================================================
 * TEST STAGE SYSTEM
 * ============================================================================
 *
 * Lightweight copy of the shared stage system that is fully isolated for the
 * test playground. It keeps the stage coordinate helpers (cover transform,
 * viewport conversion, etc.) while exposing test-specific pipeline types so
 * nothing in here collides with the production implementation.
 *
 * @module testStageSystem
 */

// ============================================================================
// SECTION 1: COORDINATE SYSTEM HELPERS
// ============================================================================

/**
 * Fixed stage size for the test harness (mirrors production 2048x2048 grid).
 */
export const TEST_STAGE_SIZE = 2048;

/**
 * Transform result for positioning and scaling the stage.
 */
export interface TestStageTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

/**
 * Compute a "cover" transform that fills the viewport while keeping aspect
 * ratio. Equivalent to CSS `background-size: cover`.
 */
export function computeTestCoverTransform(
  viewportWidth: number,
  viewportHeight: number,
): TestStageTransform {
  const scaleX = viewportWidth / TEST_STAGE_SIZE;
  const scaleY = viewportHeight / TEST_STAGE_SIZE;
  const scale = Math.max(scaleX, scaleY);

  const width = TEST_STAGE_SIZE * scale;
  const height = TEST_STAGE_SIZE * scale;

  return {
    scale,
    offsetX: (viewportWidth - width) / 2,
    offsetY: (viewportHeight - height) / 2,
    width,
    height,
  };
}

/**
 * Options for the auto-resizing stage transformer.
 */
export interface TestStageTransformerOptions {
  resizeDebounce?: number;
  onResize?: (callback: () => void) => () => void;
}

/**
 * Create a transformer that keeps the stage scaled and centered in the viewport.
 */
export function createTestStageTransformer(
  stageElement: HTMLElement,
  container: HTMLElement,
  options: TestStageTransformerOptions = {},
): () => void {
  const { resizeDebounce = 0, onResize } = options;
  let timeoutId: number | undefined;

  const applyTransform = () => {
    const transform = computeTestCoverTransform(window.innerWidth, window.innerHeight);

    stageElement.style.width = `${TEST_STAGE_SIZE}px`;
    stageElement.style.height = `${TEST_STAGE_SIZE}px`;

    container.style.width = `${TEST_STAGE_SIZE}px`;
    container.style.height = `${TEST_STAGE_SIZE}px`;
    container.style.position = "absolute";
    container.style.left = "0";
    container.style.top = "0";
    container.style.transformOrigin = "top left";
    container.style.transform = `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`;
  };

  const handleResize = () => {
    if (resizeDebounce > 0) {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(applyTransform, resizeDebounce);
    } else {
      applyTransform();
    }
  };

  applyTransform();

  let cleanup: (() => void) | undefined;
  if (onResize) {
    cleanup = onResize(handleResize);
  } else {
    window.addEventListener("resize", handleResize);
    cleanup = () => {
      window.removeEventListener("resize", handleResize);
    };
  }

  return () => {
    cleanup?.();
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Apply absolute positioning using stage coordinates.
 */
export function applyTestStagePosition(element: HTMLElement, stageX: number, stageY: number): void {
  element.style.position = "absolute";
  element.style.left = `${stageX}px`;
  element.style.top = `${stageY}px`;
}

/**
 * Convert viewport (screen) coordinates to stage coordinates.
 */
export function viewportToTestStageCoords(
  viewportX: number,
  viewportY: number,
  transform: TestStageTransform,
): { x: number; y: number } {
  return {
    x: (viewportX - transform.offsetX) / transform.scale,
    y: (viewportY - transform.offsetY) / transform.scale,
  };
}

/**
 * Convert stage coordinates back to viewport coordinates.
 */
export function testStageToViewportCoords(
  stageX: number,
  stageY: number,
  transform: TestStageTransform,
): { x: number; y: number } {
  return {
    x: stageX * transform.scale + transform.offsetX,
    y: stageY * transform.scale + transform.offsetY,
  };
}

/**
 * Utility to round stage points (useful for debug overlays).
 */
export function roundTestStagePoint<T extends { x: number; y: number }>(point: T): T {
  return {
    ...point,
    x: Math.round(point.x),
    y: Math.round(point.y),
  };
}

// ============================================================================
// SECTION 2: PIPELINE TYPES FOR THE TEST HARNESS
// ============================================================================

/**
 * Minimal layer config definition needed by the test pipeline.
 * (Matches the fields we normalise in testStagePipeline.ts.)
 */
export type TestLayerRenderer = "2D" | "3D";

export interface TestLayerConfigEntry {
  LayerID: string;
  ImageID: string;
  LayerOrder: number;
  renderer: TestLayerRenderer;
  ImageScale?: number[];
  BasicStagePoint?: number[];
  BasicImagePoint?: number[];
  BasicImageAngle?: number;
  [key: string]: unknown;
}

/**
 * Generic layer data produced by prepareLayer for the test harness.
 * We intentionally keep it as `any` to avoid coupling with shared layer types
 * while still allowing the test renderer to access known properties.
 */

export type TestLayerData = any;

export type TestLayerProcessor = (layer: TestLayerData, timestamp?: number) => TestLayerData;

export interface TestPreparedLayer {
  entry: TestLayerConfigEntry;
  data: TestLayerData;
  processors: TestLayerProcessor[];
}

export type TestMarkerMotion =
  | {
      type: "orbit";
      centerX: number;
      centerY: number;
      radius: number;
      rotationsPerHour: number;
      direction: "cw" | "ccw";
      initialAngleDeg: number;
    }
  | undefined;

export interface TestStageMarker {
  id: string;
  x: number;
  y: number;
  color: string;
  radius: number;
  kind?: "point" | "circle";
  lineWidth?: number;
  motion?: TestMarkerMotion;
}

export interface TestStagePipeline {
  stageSize: number;
  layers: TestPreparedLayer[];
  markers?: TestStageMarker[];
}

/**
 * Helper that converts the pipeline into the renderer-friendly shape.
 */
export function testToRendererInput(
  pipeline: TestStagePipeline,
): Array<{ data: TestLayerData; processors: TestLayerProcessor[] }> {
  return pipeline.layers.map(({ data, processors }) => ({
    data,
    processors,
  }));
}

// Re-export pipeline creator so consumers can import from this module alone.
export { createTestStagePipeline } from "./testStagePipeline";

/**
 * ============================================================================
 * StageSystemCover - cover-scaling helpers for new screens
 * ============================================================================
 *
 * Lightweight wrapper around the StageSystem transform utilities so any screen
 * can opt into the 2048x2048 "cover" behaviour without pulling in the pipeline.
 */

import {
  STAGE_SIZE,
  computeCoverTransform,
  createStageTransformer,
  viewportToStageCoords,
  stageToViewportCoords,
  type StageTransform,
  type StageTransformerOptions,
} from "./StageSystem";

/**
 * Options for attaching cover behaviour to a stage element.
 *
 * Extends StageTransformerOptions but injects a sensible default debounce to
 * avoid resize thrashing on new screens.
 */
export interface StageCoverOptions extends StageTransformerOptions {
  /**
   * Debounce delay for resize events (defaults to 100ms for general screens)
   */
  resizeDebounce?: number;
}

/**
 * Attaches cover-style scaling to a stage element.
 *
 * @param stageElement - Element sized at STAGE_SIZE that is being scaled
 * @param container - Outer container receiving the transform
 * @param options - Optional overrides (debounce, custom resize source)
 * @returns Cleanup function to remove listeners
 */
export function attachStageCover(
  stageElement: HTMLElement,
  container: HTMLElement,
  options: StageCoverOptions = {},
): () => void {
  const { resizeDebounce = 100, ...rest } = options;
  return createStageTransformer(stageElement, container, {
    resizeDebounce,
    ...rest,
  });
}

/**
 * Computes the cover transform for a viewport size.
 *
 * Useful when manual coordinate conversion is needed without attaching listeners.
 */
export function getStageCoverTransform(
  viewportWidth: number,
  viewportHeight: number,
): StageTransform {
  return computeCoverTransform(viewportWidth, viewportHeight);
}

/**
 * Converts from viewport coordinates to stage coordinates using a transform.
 */
export function viewportToStageCoverCoords(
  viewportX: number,
  viewportY: number,
  transform: StageTransform,
): { x: number; y: number } {
  return viewportToStageCoords(viewportX, viewportY, transform);
}

/**
 * Converts from stage coordinates to viewport coordinates using a transform.
 */
export function stageCoverToViewportCoords(
  stageX: number,
  stageY: number,
  transform: StageTransform,
): { x: number; y: number } {
  return stageToViewportCoords(stageX, stageY, transform);
}

export { STAGE_SIZE, type StageTransform } from "./StageSystem";

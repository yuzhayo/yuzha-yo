/**
 * ============================================================================
 * CLOCK LAYERING - Render Order Utilities
 * ============================================================================
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * The clock stage relies on a simple layering system (numeric z ordering).
 * This helper centralises the sorting rules so any renderer can consume the
 * processed frame data without duplicating comparison logic.
 *
 * CURRENT RULES:
 * --------------
 * 1. Lower `layer` values render first (background).
 * 2. When layers are equal, fallback to the original config order.
 * 3. Stable sort: we never reorder elements that compare equal.
 *
 * Feel free to extend this module if more advanced z-index semantics are
 * required (e.g., sub-layer buckets or dynamic runtime overrides).
 *
 * @module shared/clock/clockLayering
 */

import type { ClockRenderElementState } from "./clockTypes";

/**
 * Sort elements based on layer and original order while keeping stability.
 */
export function sortClockLayers(elements: ClockRenderElementState[]): ClockRenderElementState[] {
  return elements.slice().sort((a, b) => {
    if (a.layer !== b.layer) {
      return a.layer - b.layer;
    }
    return a.orderIndex - b.orderIndex;
  });
}

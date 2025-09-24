/**
 * Fixed Canvas Stage Constants
 * 2048x2048 design canvas for high-DPI compatibility
 */

// Fixed design canvas dimensions
export const STAGE_WIDTH = 2048;
export const STAGE_HEIGHT = 2048;

// Stage system configuration
export const STAGE_CONFIG = {
  WIDTH: STAGE_WIDTH,
  HEIGHT: STAGE_HEIGHT,
  ASPECT_RATIO: STAGE_WIDTH / STAGE_HEIGHT, // 1:1 for square canvas
} as const;

// CSS class names for stage elements
export const STAGE_CLASSES = {
  ROOT: "stage-cover-root",
  CONTAINER: "stage-cover-container",
  CANVAS: "stage-cover-canvas",
  OVERLAY: "stage-cover-overlay",
  DEBUG: "stage-cover-debug",
} as const;

/**
 * Shared Stages - Fixed Canvas System
 * 2048x2048 coordinate system with automatic scaling and transformation
 */

// Core types and interfaces
export type {
  StageCoordinates,
  StageTransform,
  ViewportTransform,
  StageConfig,
  StageEvent,
} from "./StageTypes";

// Constants
export { STAGE_WIDTH, STAGE_HEIGHT, STAGE_CONFIG, STAGE_CLASSES } from "./StageConstants";

// Transform utilities and manager
export {
  calculateStageTransform,
  transformCoordinatesToStage,
  isWithinStage,
  percentageToStagePixels,
  StageTransformManager,
  createCoordinateTransformer,
} from "./StageTransform";

// React components
export { StageContainer, type StageContainerProps } from "./StageContainer";
export { StageBackground, type StageBackgroundProps } from "./StageBackground";

// CSS styles are imported automatically by StageContainer

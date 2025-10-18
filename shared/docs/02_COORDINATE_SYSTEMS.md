# Coordinate Systems

Understanding the coordinate system is essential because every renderer, processor, and debug visual relies on the same math. This document explains the three coordinate spaces, the helper functions that convert between them, and the invariants you must preserve when extending the engine.

## Spaces at a Glance

| Space             | Range                              | Primary Users                         | Notes                                                                                          |
| ----------------- | ---------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Stage**         | 0-2048 on both axes (`STAGE_SIZE`) | Renderers, processors, debug visuals  | Absolute space for layout. Origin is top-left.                                                 |
| **Image pixels**  | 0-image width/height               | `prepareLayer()`, pipeline processors | Derived from the decoded image dimensions.                                                     |
| **Image percent** | 0-100 per axis                     | Config input, pivot calculations      | Used for user-friendly anchor points (`BasicImagePoint`, `spinImagePoint`, `orbitImagePoint`). |

## Key Helpers and Where They Live

- `shared/utils/stage2048.ts`
  - `STAGE_SIZE`: constant 2048.
  - `computeCoverTransform(viewportW, viewportH)`: calculates scale and offsets to center the stage.
  - `createStageTransformer(stageEl, containerEl, options)`: listens for viewport changes and updates transforms.
  - `viewportToStageCoords(x, y, transform)`: convert pointer coordinates to stage space.
  - `stageToViewportCoords(x, y, transform)`: project stage coordinates back to viewport pixels.
- `shared/layer/LayerCore.ts`
  - `compute2DTransform(entry, stageSize, imageDimensions)`: returns stage position and scale for the layer based on config.
  - `imagePointToStagePoint(imagePoint, imageDimensions, scale, position)`: project an image-space point into stage space.
  - `stagePointToImagePoint(stagePoint, imageDimensions, scale, position)`: inverse of the previous helper.
  - `imagePointToPercent(point, imageDimensions)` and `imagePercentToImagePoint(percent, imageDimensions)`: convert between pixels and percent.
  - `stagePointToPercent(point, stageSize)` and `stagePercentToStagePoint(percent, stageSize)`: convert between stage pixels and percentages.

## Anchor Calculation Flow

1. `prepareLayer()` normalises config values using `normalizePair`, `normalizeStagePointInput`, and `normalizePercentInput`.
2. If `BasicStagePoint` is present, it uses `calculatePositionForPivot()` to find the stage position that places `BasicImagePoint` (in percent) at the desired stage location. This method ensures any point on the image can be anchored to any stage coordinate.
3. The function always computes:
   - Image center in stage, image, and percent space.
   - Image tip/base vectors (used by debug and orbital processors).
   - Spin point (stage + percent) and orbit data when requested.
4. These results are stored in `layer.calculation`, so processors can read them without re-running geometry math.

## Stage Transform Contract

- Stage elements (`StageCanvas`, `StageDOM`, `StageThree`) always mount inside a container that the transformer controls.
- The transformer scales the container, not the canvas/DOM nodes individually. Rendering engines therefore continue to operate in 2048-space even when the viewport is much smaller or larger.
- Overlay elements (config popup hit area, debug markers, etc.) should use stage coordinates when possible, or call `stageToViewportCoords` for alignment with pointer events.

## Practical Examples

### Convert a stage click to image percent

```ts
const transform = computeCoverTransform(window.innerWidth, window.innerHeight);
const stagePoint = viewportToStageCoords(pointerX, pointerY, transform);

const imagePoint = stagePointToImagePoint(
  stagePoint,
  layer.imageMapping.imageDimensions,
  layer.scale,
  layer.position,
);

const imagePercent = imagePointToPercent(imagePoint, layer.imageMapping.imageDimensions);
```

### Place a UI marker at the layer tip

```ts
const tipStageCoords = layer.calculation.imageTip.stage.point;
markerEl.style.transform = `translate(${tipStageCoords.x}px, ${tipStageCoords.y}px)`;
```

## Invariants for Contributors

- `STAGE_SIZE` is a shared constant between renderers and helpers; do not hard-code 2048 elsewhere.
- Always clamp percents to [0, 100] and stage values to [0, STAGE_SIZE] using the utilities in `LayerCore.ts`.
- When introducing new processors, prefer reading from `layer.calculation` instead of recomputing geometry.
- If you introduce new coordinate spaces, update this document and expose helper functions so other modules can stay consistent.

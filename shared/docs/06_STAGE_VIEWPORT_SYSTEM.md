# Stage and Viewport System

All layers render in a fixed 2048 by 2048 stage. The viewport system ensures that stage coordinates remain consistent across different screen sizes, DPI settings, and renderer implementations. This document summarises the utilities in `shared/utils/stage2048.ts` and how renderers depend on them.

## Goals
- Keep layout math identical across DOM, Canvas, and Three.js.
- Maintain aspect-ratio independence - the stage should always be centered and scaled with "cover" behaviour.
- Provide reliable conversions for pointer interactions and overlay positioning.

## Core API (`shared/utils/stage2048.ts`)

| Function | Description |
| -------- | ----------- |
| `computeCoverTransform(viewportWidth, viewportHeight)` | Computes scale and offsets to fit the 2048 stage inside the viewport using cover mode. |
| `createStageTransformer(stageElement, containerElement, options)` | Applies transforms, listens to resize events, and keeps the stage centered. Returns a cleanup function. |
| `applyStagePosition(element, stageX, stageY)` | Positions any DOM element using stage coordinates. |
| `viewportToStageCoords(viewX, viewY, transform)` | Converts viewport coordinates (e.g., pointer positions) into stage coordinates. |
| `stageToViewportCoords(stageX, stageY, transform)` | Converts stage coordinates back to viewport space. |

### Transformer Lifecycle
1. Called inside each stage component after the canvas or root DOM node is available.
2. Immediately applies the correct scale, offset, and dimensions.
3. Registers a resize listener (or custom handler via `options.onResize`).
4. When unmounted, the cleanup function removes listeners and pending timers.

### Options
- `resizeDebounce` (milliseconds): prevents excessive recalculation on continuous resize events.
- `onResize(callback)`: supply a custom resize subscription (useful for tests or embedded contexts).

## Renderer Integration
- `StageDOM`, `StageCanvas`, `StageThree` call `createStageTransformer(canvas, container, { resizeDebounce: 100 })`.
- All renderer engines output coordinates relative to the stage, independent of viewport size.
- When computing pointer input (e.g., opening the overlay), `MainScreenUtils` can use `viewportToStageCoords` for hit testing.

## Overlay and UI Alignment
- For UI elements that must track stage positions (e.g., debug markers or configuration handles), call `applyStagePosition()` with stage coordinates.
- When mixing viewport-relative UI (like control panels) with stage-relative UI, remember that the container is transformed; use CSS `transform-origin: top left` consistent with the transformer.

## Testing Strategies
- Mock `computeCoverTransform()` in unit tests to ensure deterministic results.
- For end-to-end tests, record pointer positions in stage space so scenarios export cleanly across devices.

## AI Agent Notes
- Always use `STAGE_SIZE` constant instead of hard-coding 2048; future updates could change the stage dimensions.
- When adding new renderers or overlays, wire the transformer first, then layer in functionality. Without it, pointer math and drawing coordinates will be incorrect.
- If you add device-specific scaling rules, extend `createStageTransformer()` and update this document so other modules use the new behaviour correctly.

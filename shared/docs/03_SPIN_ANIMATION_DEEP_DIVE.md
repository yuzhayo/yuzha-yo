# Spin Animation Deep Dive

This document explains how spin animation is configured, calculated, and rendered across DOM, Canvas, and Three.js engines. Use it when tuning motion, debugging drift, or adding new features that depend on per-frame rotation data.

## Config Inputs

- `Spin Config` group in `ConfigYuzha.json`
  - `spinStagePoint`: Stage coordinates (pixels) that act as the pivot.
  - `spinImagePoint`: Image percent coordinates that should align with the pivot.
  - `spinSpeed`: Degrees per second (float). Values <= 0 disable dynamic rotation.
  - `spinDirection`: `"cw"` (clockwise) or `"ccw"` (counter-clockwise).
- When `spinSpeed > 0`:
  - `transformConfig()` copies the spin pivot into `BasicStagePoint`/`BasicImagePoint`.
  - `BasicAngleImage` is reset to `0` so runtime rotation is deterministic.

## Preparation (`LayerCore.prepareLayer`)

- Calculates base `position` and `scale`.
- Stores spin coordinates inside `layer.calculation.spinPoint` as both stage and image data.
- Ensures the spin pivot is valid even if config is missing values (defaults to image center).

## Processor Logic (`LayerCorePipelineSpin.ts`)

```ts
export function createSpinProcessor(config: SpinConfig): LayerProcessor;
```

- Merges overrides provided in `config` with per-layer defaults.
- Uses `AnimationConstants.DEG_TO_RAD` to convert degrees to radians only at draw time (DOM uses CSS degrees directly).
- Maintains `startTime` closure to calculate elapsed time when the processor first runs.
- On each frame:
  1. Compute `elapsed = (timestamp - startTime) / 1000`.
  2. Multiply by `spinSpeed` to get rotation amount in degrees.
  3. Apply direction via `applyRotationDirection(angle, spinDirection)`.
  4. Normalise the result to `[0, 360)` using `normalizeAngle`.
  5. Update `layer.currentRotation` and set `layer.hasSpinAnimation = true`.
  6. Expose `spinStagePoint`, `spinPercent`, and `spinCenter` for renderers.

## Renderer Handling

- **LayerEngines**
  - Injects inline CSS transforms: `translate -> rotate -> translate` around the calculated pivot.
  - Applies `currentRotation` if present, else falls back to `rotation` from config (static).
- **LayerEngines**
  - Performs `ctx.translate` to the pivot, `ctx.rotate(angleRadians)`, then draws the image.
  - Resets the context after each layer to avoid bleed.
- **LayerEngines**
  - Adjusts the mesh `rotation.z` to reflect the current spin angle in radians.

All engines test for `layer.hasSpinAnimation` to decide whether to keep a requestAnimationFrame loop alive.

## Debugging Checklist

- Confirm `spinSpeed` is positive. Zero disables the processor.
- Ensure the asset registry path exists; otherwise `prepareLayer()` returns `null` and the layer never reaches the renderer.
- Use the Image Mapping Debug overlay (`showRotation`, `showAxisLine`) to visualise pivot alignment.
- Compare DOM vs. Canvas vs. Three.js. If only one environment misbehaves, the issue is renderer-specific.

## Extending Spin Behaviour

- Override easing: wrap `createSpinProcessor()` and replace the linear `elapsed * spinSpeed` with any easing function (e.g., `easeInOutQuad` from `LayerCorePipeline.ts`).
- Sync with other processors: because processors run in order, you can add a follow-up processor that reads `layer.currentRotation` to spawn particle effects or debug trails.
- Persist rotation: if you need to resume from a given angle, inject a `startAngle` override via the processor config.

## AI Agent Notes

- Always pass the shared timestamp from the renderer into `runPipeline()` so spin animation stays smooth across layers.
- When unit testing, provide a mock timestamp to `createSpinProcessor` to verify angle calculations deterministically.
- Update this doc whenever new spin-related config fields or processor outputs are introduced.

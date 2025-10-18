# Orbital Animation System

This file replaces the previous TODO with a complete description of the orbital animation capabilities implemented in `LayerCorePipelineOrbital.ts`.

## Config Inputs

- `orbitStagePoint`: Stage coordinates of the orbit centre. Defaults to stage centre (1024, 1024).
- `orbitLinePoint`: Stage coordinates defining the orbit radius (distance from centre).
- `orbitImagePoint`: Image percent coordinates that should lie on the orbit path.
- `orbitLine`: Boolean to display the orbit trace.
- `orbitOrient`: Boolean to auto-align the layer's tip with the outward radius vector.
- `orbitSpeed`: Degrees per second (0 disables motion).
- `orbitDirection`: `"cw"` or `"ccw"`.

All fields live under the "Orbital Config" group inside `ConfigYuzha.json`.

## Processor (`LayerCorePipelineOrbital.ts`)

```ts
export function createOrbitalProcessor(config: OrbitalConfig): LayerProcessor;
```

- Normalises optional overrides passed at creation time.
- Early exits as a no-op if the layer does not request motion, auto-orientation, or line rendering.
- Maintains `startTime` to calculate elapsed time when motion is enabled.
- On each frame:
  1. Resolve orbit centre and line point from overrides or layer defaults.
  2. Calculate radius length and derived orbit angle.
  3. Evaluate motion:
     - If `orbitSpeed > 0`, advance angle based on elapsed time and direction.
     - Otherwise, treat the line point as the current orbit position.
  4. Compute new layer position by aligning the selected `orbitImagePoint` with the orbit path.
  5. Evaluate visibility using `calculateOrbitalVisibility()` (layers can disappear when orbiting beyond stage bounds).
  6. Update `layer.currentOrbitAngle`, `layer.position`, and `layer.visible`.
  7. When `orbitOrient` is true (and the layer is not already spinning), align `currentRotation` so the tip faces away from the orbit centre (radial alignment).
  8. Generate orbit line metadata (`orbitLineStyle`) for renderers that display circular traces.

## Renderers

- **DOM**: Uses CSS transforms to reposition the node and optional SVG-like orbit lines.
- **Canvas**: Draws the orbit circle with dashed strokes (`ctx.arc`) before drawing the layer.
- **Three.js**: Builds a `THREE.LineLoop` mesh to represent the orbit path; updates mesh position alongside the sprite.

## Debug Helpers

- `LayerCorePipelineOrbital.ts` now ships marker generators alongside the processor:
  - `generateOrbitCenterMarker`
  - `generateOrbitLineTrace`
  - `generateOrbitRadiusLine`
  - `generateOrbitPointMarker`
- These integrate with the general debug visualization system when `orbitLine` or other flags are enabled.

## Usage Patterns

- **Static orbit preview**: Set `orbitSpeed: 0` and `orbitLine: true` to visualise the path without movement.
- **Auto orientation**: Combine `orbitOrient: true` with `spinSpeed: 0` to let the orbit processor control rotation.
- **Spin + orbit**: Enable both `spinSpeed` and `orbitSpeed`; spin takes precedence for rotation, so the orbit processor will not overwrite `currentRotation`.
- **Variable radius**: Animate `orbitLinePoint` via config updates (requires page reload) or custom processors for dynamic radius changes.

## Troubleshooting Checklist

- If the layer disappears, check `layer.visible`. The processor hides layers that orbit completely outside the 2048 stage.
- Ensure `orbitLinePoint` is not identical to `orbitStagePoint`; zero radius results in no motion.
- When combining spin and orbit, confirm that `spinImagePoint` and `orbitImagePoint` do not conflict - typically both should be `[50, 50]`.

## AI Agent Notes

- When writing tests, set a deterministic `timestamp` to compute orbit positions reliably.
- To pause orbiting mid-scene, supply an override in `createOrbitalProcessor({ orbitSpeed: 0 })` while keeping line visibility for debugging.
- Update this document anytime new orbital behaviours or config fields are introduced.

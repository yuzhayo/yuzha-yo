# Orbital Base/Tip Rotation System

This document captures how `imageTip` and `imageBase` angles influence layer orientation, both at rest and while orbiting. The implementation lives in `LayerCore.ts` and `LayerCorePipelineOrbital.ts`.

## Terminology
- **Image tip/base angles**: Degrees measured from the image centre (`50%, 50%`). Default `imageTip = 90` (up) and `imageBase = 270` (down).
- **Display axis**: Vector from base to tip in image space. Calculated by `computeImageMapping()` and stored on the layer.
- **Orbit radius vector**: Vector from `orbitStagePoint` to the current orbit position.

## Static Orientation
- `prepareLayer()` sets `layer.rotation = BasicAngleImage` (or `0` if spin overrides were applied).
- Renderers use `layer.rotation` when no processor supplies `currentRotation`.
- The static rotation combines with the display axis to produce the final pose.

## Orbital Auto-Orientation
- When `orbitOrient` is `true` and the layer is **not** spinning:
  - `createOrbitalProcessor()` calculates the instantaneous orbit angle using `Math.atan2`.
  - Compares the orbit angle with the image display axis (`layer.imageMapping.displayAxisAngle`).
  - Sets `layer.currentRotation` so the tip points outward from the orbit centre.
- This behaviour keeps sprites aligned like clock hands while orbiting.

## Interaction with Spin
- If `spinSpeed > 0`, the spin processor sets `layer.hasSpinAnimation = true`.
- The orbital processor respects this flag and does **not** overwrite `currentRotation`.
- Result: spin animation takes precedence; auto-orientation is skipped.

## Configuration Summary

| Field | Description | Module |
| ----- | ----------- | ------ |
| `imageTip` | Angle (deg) pointing to the "front" of the image. | `Config.ts` -> `computeImageMapping()` |
| `imageBase` | Angle (deg) pointing to the "back" of the image. | Same as above |
| `orbitOrient` | Enable auto-orientation along orbit. | `LayerCorePipelineOrbital.ts` |
| `spinSpeed` | Spin animation speed in deg/s. Overrides orbital orientation when > 0. | `LayerCorePipelineSpin.ts` |

## Debugging Orientation
- Enable `showRotation`, `showAxisLine`, and `showTip` in the Image Mapping Debug group.
- Orbit-specific markers (`generateOrbitCenterMarker`, `generateOrbitRadiusLine`) help confirm that the tip points outward.
- Compare DOM, Canvas, and Three renderers to ensure consistent orientation handling.

## Extension Hooks
- To customise the alignment rule (e.g., tip facing inward), wrap `createOrbitalProcessor()` and adjust the rotation delta before returning the layer.
- When adding new config fields (like per-layer orientation offsets), update both `Config.ts` merge logic and this document.

## AI Agent Notes
- The processor contract guarantees tip alignment whenever `orbitOrient` is enabled and spin is inactive.
- For deterministic tests, supply a fixed timestamp to `runPipeline()`; the computed `currentRotation` will stay consistent.
- Keep this document updated if the orientation logic changes (for example, supporting positional offsets or easing).

# Orbital Image Tip System

This document explains how the orbital system interprets `imageTip`, `imageBase`, and `orbitImagePoint`. It complements `ORBITAL_BASETIP_ROTATION_SYSTEM.md` by focusing on how coordinates are chosen along the orbit path.

## Components

- **`imageTip` / `imageBase`**: Orientation definition in image space (see base-tip doc).
- **`orbitImagePoint`**: Percent coordinates on the image used to sit on the orbit path.
- **`orbitStagePoint`**: Stage coordinates of the orbit centre.
- **`orbitLinePoint`**: Stage coordinates defining the radius.

## How `orbitImagePoint` Works

1. `LayerCore.prepareLayer()` reads `orbitImagePoint`. If undefined, defaults to `[50, 50]` (image centre).
2. Converts that percent to image pixels via `imagePercentToImagePoint`.
3. Stores the result inside `layer.calculation.orbitPoint.image` and `layer.orbitImagePoint`.
4. During orbital updates, `createOrbitalProcessor()` projects the selected image point onto the orbit path, ensuring it stays aligned with the radius vector.

## Orbit Position Calculation

- The processor derives a base orbit vector from `orbitStagePoint` -> `orbitLinePoint`.
- When motion is enabled (`orbitSpeed > 0`), it advances the angle using elapsed time (`LayerCorePipelineOrbital.ts`).
- The chosen `orbitImagePoint` is mapped into stage space with current scale and position, then offset so that it sits exactly on the orbit circle.
- Results:
  - `layer.position` updates so the selected image point traces the orbit path.
  - `layer.orbitPoint` and `layer.orbitStagePoint` expose both image and stage coordinates for debug renderers.

## Selecting Points

- Use `[50, 50]` for centre alignment (common default).
- Use `[50, 0]` to place the top edge on the orbit circle, which pairs well with outward-facing tips.
- Any coordinate is accepted; values are clamped to [0, 100] per axis.

## Debugging

- Enable `showTip`, `showBase`, and `showAxisLine` to verify orientation relative to the orbit point.
- Enable `orbitLine` to draw the path and confirm the selected image point sits on it.
- Use `stagePercentToStagePoint()` in console helpers if you need to inspect positions numerically.

## Interaction with Other Systems

- Spin animation continues to operate independently; orbit position updates reposition the layer before spin rotation is applied.
- Auto-orientation uses the radius vector from `orbitStagePoint` to the computed orbit point. The processor compares that angle with `layer.imageMapping.displayAxisAngle` so the configured tip points outward when `orbitOrient` is true and spin is inactive.

## AI Agent Notes

- Adjusting orbit behaviour usually requires touching `ConfigYuzha.json` only; runtime transforms automatically update after reload.
- If you introduce new orbit path types (e.g., ellipse), update how `orbitImagePoint` is projected and document the new math here.

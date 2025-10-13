# Debug Visualization

The debug visualization system makes it easy to inspect layer alignment, pivots, and motion paths without modifying renderer code. It is driven entirely by configuration flags and a dedicated processor.

## Configuration Flags
Enable flags inside the "Image Mapping Debug" group of `ConfigYuzha.json`:
- `showCenter`, `showTip`, `showBase`
- `showStageCenter`
- `showAxisLine`, `showRotation`
- `showTipRay`, `showBaseRay`
- `showBoundingBox`
- `centerStyle`, `tipStyle`, `baseStyle`, `stageCenterStyle`
- `debugColors` (per marker type)

Any truthy flag causes the debug processor to be attached to that layer.

## Processor (`LayerCorePipelineImageMappingDebug.ts`)
```ts
export function createImageMappingDebugProcessor(config): LayerProcessor
```
- Reads `layer.calculation` values prepared by `LayerCore`.
- Generates geometric primitives (lines, circles, markers) via helpers in `LayerCorePipelineImageMappingUtils.ts`.
- Populates `layer.imageMappingDebugVisuals` with instructions for renderers.
- Does not mutate base layer data beyond adding the debug visuals.

## Renderer Support
- **DOM**: `LayerEngineDOM.ts` converts visuals into HTML elements styled with CSS (e.g., absolutely positioned divs, rotated lines).
- **Canvas**: `CanvasDebugRenderer.drawAll(ctx, visuals, stageSize)` draws markers directly on the canvas layer.
- **Three.js**: Uses line geometries and helper meshes to render markers in 3D space.

Renderers guard the debug pass so static layers without visuals incur no additional cost.

## Visual Primitives
- **Markers**: dots, rings, crosshairs, or arrows depending on configuration.
- **Rays**: line segments from pivots to tips/bases.
- **Axis Line**: orientation vector derived from `imageMapping.displayAxisAngle`.
- **Bounding box**: outlines the scaled image boundary.
- **Orbit helpers**: generated separately by `LayerCorePipelineOrbitalUtils.ts` when orbital config enables them.

## Usage Tips
- Combine debug flags with spin/orbit configs to verify that pivots follow the intended trajectories.
- Use distinct colours for multiple layers to avoid confusion.
- The `Config` popup exposes all flags so you can toggle them without rebuilding the app.

## Implementing New Visuals
1. Add generator helpers in `LayerCorePipelineImageMappingUtils.ts` (follow existing patterns).
2. Update `createImageMappingDebugProcessor()` to conditionally call the new helper.
3. Extend renderer-specific debug renderers if the new primitive requires bespoke drawing logic.
4. Document the new flag in `01_CONFIG_SYSTEM_GUIDE.md`.

## AI Agent Notes
- Debug visuals are non-destructive; they do not interfere with animation state.
- When writing automated inspections, you can read `layer.imageMappingDebugVisuals` directly instead of relying on render output.
- Keep performance in mind: generating visuals for many layers every frame can be expensive. Prefer enabling them only while debugging.

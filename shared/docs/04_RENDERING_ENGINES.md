# Rendering Engines

Yuzha ships three interchangeable renderers. Each mounts the same prepared layer data, attaches the same processor pipeline, and renders to the viewport in its own way. This document breaks down their responsibilities, lifecycle, and performance considerations.

## Selection Logic

- `yuzha/src/MainScreen.tsx` decides which renderer to mount.
- `shared/utils/RendererDetector.ts`
  - `isAIAgentEnvironment()`: returns `true` in headless, no-WebGL, or reduced capability contexts.
  - `getRendererType()`: defaults to `"three"` unless the device is low capability or explicitly set to `"canvas"` fallback for AI agents.
- Users (and tests) can force a renderer through the overlay (`MainScreenUpdater`).

## Shared Preparation Flow

1. Load config via `loadLayerConfig()`.
2. Filter 2D layers: `config.filter(is2DLayer)`.
3. For each entry, run `prepareLayer(entry, STAGE_SIZE)`.
4. Build a processor array per layer:
   - `createImageMappingDebugProcessor` when any debug flag is enabled.
   - `createSpinProcessor` when `spinSpeed > 0`.
   - `createOrbitalProcessor` when orbital settings are present.
5. Pass `{ data, processors }` to the renderer-specific mounting function.

## DOM Renderer (`shared/stage/StageDOM.tsx` + `LayerEngines.ts`)

- Creates absolutely positioned `<div>` elements per layer.
- Uses CSS transforms for translation, rotation, and scaling.
- Maintains GPU-friendly `transform` chains.
- Injects debug visuals as child DOM elements (SVG-like overlays).
- Suitable for rapid inspection and accessible DOM snapshots; heaviest CPU cost when many layers animate simultaneously.

## Canvas Renderer (`shared/stage/StageCanvas.tsx` + `LayerEngines.ts`)

- Draws rasterised layers into a `<canvas>` context.
- Keeps a transform cache (`scaledWidth`, `pivot`, etc.) to avoid recomputation.
- Uses `createPipelineCache()` to memoise processor output per frame.
- Only maintains an animation loop when at least one layer has animation or debug output.
- Ideal for headless rendering, AI regression testing, or environments without WebGL.

## Three.js Renderer (`shared/stage/StageThree.tsx` + `LayerEngines.ts`)

- Creates a WebGL renderer with device capability hints (`getDeviceCapability()`).
- Builds an orthographic camera covering the 2048 stage.
- For each layer:
  - Creates a textured plane (`THREE.Mesh`) with transparent material.
  - Applies spin/orbit updates every frame using the same processor output.
  - Optionally draws orbit lines via Three.js helper geometry.
- Most performant renderer for complex scenes; supports advanced effects if future processors output depth, lighting, or shader data.

## Lifecycle Hooks

- Each stage creates a `containerRef` and `canvasRef`.
- Runs an asynchronous `run()` effect to prepare layers and mount them.
- Registers a cleanup function that:
  - Stops animation loops.
  - Disposes DOM/Canvas/Three resources.
  - Calls `createStageTransformer(... )` cleanup to remove resize listeners.

## Debug Visualization Support

- Renderers check `layer.imageMappingDebugVisuals`.
- DOM: inserts overlay elements using `DomDebugRenderer`.
- Canvas: calls `CanvasDebugRenderer.drawAll`.
- Three.js: uses `ThreeDebugRenderer` utilities (part of `LayerEngines.ts`) to render lines and markers.

## Extending Renderers

- Add processors in the stage component; renderer engines expect `processors: LayerProcessor[]` and a root `EnhancedLayerData`.
- Keep renderers pure: all stateful animation logic lives in processors, not engines.
- When adding a new renderer (e.g., SVG), follow the same contract:
  - Accept prepared layers.
  - Honour `currentRotation`, `currentOrbitAngle`, `visible`.
  - Draw debug visuals.
  - Expose a cleanup function.

## Performance Considerations

- All renderers respect `AnimationConstants` for consistent timing.
- Canvas and Three.js maintain shared caches to avoid re-running processors if inputs have not changed.
- Use the `MainScreen` overlay to toggle renderers quickly during profiling.

## AI Agent Notes

- To emulate UI interactions, mount `MainScreen` and programmatically call `setRendererMode('canvas')` or similar from tests.
- When scripting screenshots for QA, use Canvas renderer to avoid GPU driver differences.
- Update this doc whenever new renderer-specific capabilities are added, such as lighting options or post-processing passes.

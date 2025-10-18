# Performance Optimisation

The Yuzha runtime targets smooth animation at 60 fps even with multiple layers. This document lists the built-in optimisations and guidance for keeping new features efficient.

## Built-in Strategies

### 1. Layer Preparation Cache

- `prepareLayer()` caches image dimensions in `IMAGE_DIMENSION_CACHE`.
- Asset lookups use `Map` structures for O(1) reads.
- Layers that fail preparation (missing assets) are skipped early, avoiding work downstream.

### 2. Processor Memoisation

- `createPipelineCache()` from `LayerCorePipeline.ts` stores per-layer processor output keyed by layer id and timestamp bucket.
- Canvas and Three renderers reuse cached results when no animated processors are attached.

### 3. Conditional Animation Loops

- Layer engines detect whether any layer has `hasSpinAnimation`, `hasOrbitalAnimation`, or debug visuals.
- If every layer is static, renderers perform a single draw and skip starting a requestAnimationFrame loop.

### 4. Lazy Calculations

- `prepareLayer()` checks whether debug or animation features are enabled (`needsFullCalculation`).
- If not, it avoids computing expensive coordinate bundles (tip/base/orbit points) and fills defaults instead.

### 5. Device Capability Detection

- `getDeviceCapability()` adjusts renderer options (pixel ratio, antialiasing) based on hardware.
- `RendererDetector` prefers Canvas in constrained environments to avoid WebGL overhead.

## Profiling Tips

- Use browser performance tools with the DOM renderer for readable flame charts.
- Compare Canvas vs. Three renderers to understand GPU vs. CPU costs.
- Toggle debug overlays off during production scenarios; they can add significant per-frame work.

## Guidelines for New Code

- Avoid recomputing geometry inside processors; rely on `layer.calculation`.
- When storing per-layer state, use closures inside processor factories rather than global maps.
- Throttle or debounce expensive operations when responding to user input (e.g., drag handles).
- For new renderers, batch draw calls where possible (e.g., merge meshes in Three.js).

## Memory Considerations

- Dispose WebGL resources (`renderer.dispose()`) in `StageThree` cleanup.
- Reuse DOM elements or use document fragments when adding new overlay features.
- Keep image formats compressed (PNG/WebP) and update the asset registry if you remove unused files.

## Testing Performance Regressions

- Add benchmark scripts or telemetry tests that mount scenes with representative layer counts.
- Record baseline FPS or frame times for each renderer.
- Include performance expectations in pull request descriptions when introducing heavy features.

## AI Agent Notes

- When writing automation steps, prefer Canvas renderer to avoid GPU-specific variance.
- If you need to evaluate performance programmatically, tap into renderer hooks to measure frame durations.
- Update this guide whenever new caches or optimisation toggles are introduced so other contributors understand the impact.

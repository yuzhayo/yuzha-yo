## Layer Animation Modernization Plan

This plan delivers smooth, compositor-driven animations for the config-based layer system while preserving existing behaviour and renderer compatibility. Work is grouped into phased milestones so we can ship incrementally and reduce risk.

---

### Phase 0 — Discovery & Guardrails
- **Inventory current usage**: catalogue all layer configs that rely on `spin` / `orbit` today (speed ranges, pivot overrides, orient flags, renderer targets).
- **Document timing assumptions**: confirm how StageDOM, StageCanvas, and StageThree schedule layer processing (requestAnimationFrame, tick loops, visibility throttling).
- **Add regression harness**: capture short screen recordings or frame dumps of representative scenes to compare before/after motion.
- **Decide feature flags**: agree on an opt-in switch (e.g. `renderAnimationsWithCss`) so we can flip layers or whole stages gradually.

### Phase 1 — Extract Animation Metadata
- **Refactor processors**: update `layerSpin.ts` and `layerOrbit.ts` to output an `animationDescriptor` object (pivot, radius, angular velocity, direction, orient requirements) instead of mutating `position` every frame.
- **Preserve legacy path**: keep the existing per-frame position update code gated behind the feature flag to safeguard current behaviour.
- **Normalise timestamps**: ensure descriptors include a deterministic `startTime` seeded from layer mounting so animation continuity survives hot reloads.
- **Extend typings**: teach `EnhancedLayerData` to carry both descriptor and legacy fields without breaking existing renderer consumers.

### Phase 2 — Renderer Implementation (DOM)
- **StageDOM wrapper rewrite**: render each layer with nested `<div>` shells mirroring the TestScreen structure—outer shell handles orbit translation, inner shell handles counter-rotation when required.
- **Emit CSS custom properties**: map descriptor data to `--orbit-radius`, `--orbit-duration`, etc., so we can express motion via reusable keyframes (`orbit`, `spin`).
- **Generate dynamic styles**: inject scoped styles (or Tailwind utilities) for arbitrary durations/radii; fall back to inline `style` when necessary.
- **Synchronise start times**: align CSS animations using `animation-delay` or CSS variables computed from the descriptor start time to avoid visible jumps.
- **Feature-flag roll-out**: allow per-layer opt-in so we can test individual assets in production.

### Phase 3 — Renderer Implementation (Canvas/WebGL)
- **StageCanvas integration**: implement a lightweight animation clock that reads descriptors and applies transforms directly in the drawing routine without recalculating geometry every tick.
- **StageThree shaders**: pass descriptor data to fragment/vertex shaders (or instanced buffers) so GPU handles orbit+spin with minimal CPU intervention.
- **Shared timing source**: expose a renderer-agnostic `AnimationClock` to keep DOM and WebGL outputs visually in sync when mixed on screen.

### Phase 4 — Migration & Validation
- **Pilot scenes**: select a few animated screens to switch to the new path, gathering qualitative feedback on smoothness and quantitative metrics (frame-time variance).
- **Performance profiling**: use Chrome Performance/RAIL traces to verify reduced main-thread work and compositor raster stability.
- **Back-compat review**: ensure features like pausing, scrubbing, or externally-set rotations still behave correctly by reconciling descriptor updates with CSS timelines.
- **Finalize documentation**: update `shared/layer` README and stage renderer docs to explain the new data flow and how to configure animations.

### Phase 5 — Cleanup & Enhancements
- **Retire legacy code**: once all layers migrate, remove the per-frame mutation path, keeping a compatibility shim for editor previews if required.
- **Reusable animation utilities**: package the CSS keyframes, descriptor parsers, and animation clock into a shared `layerAnimation` module.
- **Extended animation types**: leverage the descriptor model to add easing curves, elliptical orbits, or synchronized multi-asset choreography without revisiting architecture.
- **Regression suite**: automate visual diff tests (Playwright + snapshot videos) to detect future regressions in timing or smoothness.

---

**Success Criteria**
- Animations remain config-driven, renderer-agnostic, and device-proportional.
- DOM outputs match TestScreen smoothness across frame drops and tab backgrounding.
- Canvas/WebGL renderers gain equivalent visual fidelity without CPU-heavy loops.
- Team has tooling, docs, and tests to evolve animation behaviour safely post-migration.

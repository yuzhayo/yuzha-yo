# Modular Layer Pipeline Roadmap

Goal: decouple Basic, Spin, and Orbit calculations so each module can compute its own state without depending on hidden work done elsewhere. This document tracks the end-to-end tasks needed and highlights the spots future AI agents must touch.

## Phase 1 - Planning & Inventory

- [x] Describe the minimal `BaseLayerState` that basic preparation should output (position, scale, image center, asset info).
- [x] List every field the spin runtime processor consumes today (e.g., `spinPercent`, `spinStagePoint`) and where they originate.
  - Runtime spin processor (`shared/layer/layerSpin.ts:140-149`) reads `spinSpeed`, `spinDirection`, `calculation.spinPoint.image/stage`, `spinStagePoint`, and `spinPercent`. These now come from the new `prepareSpinState` helper, while `spinSpeed`/`spinDirection` still flow directly from config.
- [x] List every field the orbit runtime processor consumes today (e.g., `orbitRadius`, `orbitLineVisible`, `orbitPoint.stage`) and their sources.
  - Runtime orbit processor (`shared/layer/layerOrbit.ts:207-223`) relies on `orbitPoint`, `orbitStagePoint`, `orbitLinePoint`, `orbitLineVisible`, `orbitImagePoint`, `orbitRadius`, `orbitSpeed`, `orbitDirection`, `orbitOrient`, and `orbitLineStyle`. The geometry now comes from `prepareOrbitState`; speed/direction/orient remain config driven.

## Phase 2 - Module Extraction

- [x] Extract basic preparation into its own function (`prepareBasicState`) returning `BaseLayerState` (currently lives in `layerCore.ts` and can migrate to a module file later).
- [x] Extract spin-specific math into `prepareSpinState` that consumes only `BaseLayerState` and spin config.
- [x] Extract orbit-specific math into `prepareOrbitState` that consumes only `BaseLayerState` and orbit config.

## Phase 3 - Pipeline Composition

- [x] Refactor `prepareLayer` so it orchestrates the modular functions, merging results into `EnhancedLayerData`.
- [x] Update `layer.ts` processors to read the new state layout (ensure no fields are missing or renamed unexpectedly). _(Confirmed at `shared/layer/layerSpin.ts:118-149` and `shared/layer/layerOrbit.ts:207-225` � they consume the same fields emitted by the new helpers.)_
- [x] Adjust exports/index files so downstream imports stay consistent (add TODO notes if we introduce breaking changes). _(No changes required; `shared/layer/index.ts` already re-exports the updated layer core types.)_

## Phase 4 - Renderer & Test Updates

- [x] Verify StageDOM/StageCanvas/StageThree still read the same properties after the refactor. _(Checked in `shared/stage/StageDOM.tsx:216-239`, `shared/stage/StageCanvas.tsx:189-208`, and `shared/stage/StageThree.tsx:249-296`; all reference unchanged fields.)_
- [x] Update or create unit tests for each module (Basic, Spin, Orbit) covering edge cases (non-centered pivots, zero orbit radius, etc.). _(Added `shared/layer/layerCore.test.ts` to exercise spin/orbit preparation helpers.)_
- [ ] Update integration tests / sample configs to assert the composed pipeline matches current output.

## Phase 5 - Validation

- [x] Run `npm run typecheck` and `npm run lint` to confirm the codebase still passes static analysis. _(Executed after adding tests; both succeeded.)_
- [x] Run the available formatting or prettier check (when the project adds a script). _(Prettier fixed touched files; `npm run format` passes.)_
- [ ] Perform manual smoke tests on representative layers (static, spin-only, orbit-only, spin+orbit) to ensure visuals remain correct.
  - Launch the app via `npm run dev` and load each stage renderer variant (DOM, Canvas, Three).
  - Verify a static background layer still anchors correctly.
  - Confirm a spin-only layer (e.g., `test-sun-ray-1`) rotates smoothly without wobble.
  - Observe an orbit-only sample to ensure orbit radius and visibility are intact.
  - Check a combined spin+orbit layer for consistent orientation and pivot behavior.
  - Record results here when completed.

Keep this roadmap updated as each phase completes so future agents know exactly what has shipped and what remains.

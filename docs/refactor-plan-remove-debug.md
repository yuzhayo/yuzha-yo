# Pipeline Simplification Task List

This checklist tracks the removal of `imageTip`, `imageBase`, and `spinCenter` from the layer pipeline while deleting the legacy debug subsystem. Update the status as each phase completes so future AI agents understand where the refactor stands.

- [x] Identify math or cached structures in `layerCore` that become redundant once tip/base calculations disappear. *(The entire tip/base ray solver—`computeImageMappingInternal`, axis angle math, and the `calculation.imageTip/imageBase` bundles—only fed debug visuals, so we can drop them while keeping center/spin/orbit helpers.)*

## Phase 2 – Core Data Simplification
- [x] Refactor `layerCore` to stop computing/returning tip & base geometry; retain only the center, spin/orbit inputs, and existing normalized percent bundles.
- [x] Remove the `spinCenter` runtime field from `layerSpin` while keeping pivot alignment by reusing the precomputed `spinPoint`.
- [x] Drop obsolete types/exports and update `LayerCalculationPoints` to reflect the slimmer payload.

## Phase 3 – Processor & Renderer Cleanup
- [x] Delete the debug processor and rendering helpers (`layerDebug.ts`, debug caches, and registry wiring).
- [x] Update `layer.ts`, `Stage*` renderers, and any other consumers to work with the simplified layer shape.
- [x] Ensure the pipeline cache still runs for animated layers without introducing extra clones.

## Phase 4 – Config & Documentation Updates
- [x] Remove debug and tip/base related properties from `Config.ts`, sample JSON, and tests.
- [x] Update README/architecture notes to describe the new lean pipeline.
- [x] Add concise inline comments where logic changed so later agents know which data is now authoritative.

## Phase 5 – Validation
- [ ] Run `npm run lint`, `npm run typecheck`, and `npm run format:check` (or the project equivalents) to verify code quality.
- [ ] Launch the app (or available smoke test) to ensure visual output matches expectations without console errors.
- [ ] Document any follow-up work needed before re-introducing debug tooling in the future.

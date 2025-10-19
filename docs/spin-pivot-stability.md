# Spin Pivot Stability Checklist

Problem: Layers that spin around non-centered pivots (e.g., `spinImagePoint: [50, 0]`) jitter because the DOM/Canvas/Three renderers round the sub-pixel positions that the spin processor carefully computes. We need to preserve sub-pixel precision whenever a layer has spin animation.

## Phase 1 – Notes & Affected Files

- [x] StageDOM renderer (`shared/stage/StageDOM.tsx`) currently calls `roundStagePoint()` for every non-orbital layer.
- [x] StageCanvas renderer (`shared/stage/StageCanvas.tsx`) does the same before translating the canvas context.
- [x] StageThree renderer (`shared/stage/StageThree.tsx`) mirrors the rounding before converting to world space.

## Phase 2 – Implementation Steps

- [x] Update each renderer so the rounding step is skipped when `enhancedData.hasSpinAnimation` is true.
- [x] Leave rounding intact for static-only layers to avoid unnecessary float churn.
- [x] Double-check orbit code paths still use `roundStagePoint` (they already bypass the rounding when `hasOrbitalAnimation` is true).

## Phase 3 – Validation

- [ ] Smoke test a layer with `spinImagePoint: [50, 0]` (e.g., `test-sun-ray-1`) to confirm the wobble disappears.
- [ ] Run `npm run typecheck` and `npm run lint`.
- [ ] Run the formatter check (project currently lacks `format:check`; confirm status or run the equivalent if added later).

Keep this checklist updated as phases complete so future AI agents know what remains.\*\*\*

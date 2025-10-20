# Spin Drift Remediation Checklist

Problem: Active spin configs currently overwrite the Basic positioning fields during `transformConfig`, so layers end up offset twice. That causes the visible drift when `spinImagePoint` isn’t centered. This checklist tracks the steps to decouple the merge logic and validate the fix.

## Phase 1 – Analysis & Notes

- [x] Confirm where `transformConfig` copies `spinStagePoint`/`spinImagePoint` into `BasicStagePoint`/`BasicImagePoint`.
- [x] Identify any other consumers that rely on this override (search for code that expects Basic values to mirror spin values).

## Phase 2 – Refactor

- [x] Change the spin merge block so it no longer mutates the Basic fields; only reset `BasicImageAngle` and keep spin-specific data.
- [x] Update inline comments in `Config.ts` to reflect the new behavior for future agents.

## Phase 3 – Validation

- [x] Run `npm run typecheck`, `npm run lint`, and `npm run format`.
- [ ] Launch the app (`npm run dev`) and verify:
  - Static layer still anchors correctly.
  - Spin-only layer (`test-sun-ray-1` with `[50, 0]`) rotates without drift.
  - Spin+orbit combo still behaves.
- [ ] Document results (screenshots/logs) and mark this checklist complete.

Keep this file updated as you progress so anyone picking up the work knows exactly what remains.

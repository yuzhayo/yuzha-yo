
# AI Coding Guidelines

These rules apply to **any AI agent or human contributor** working on this project. They are mandatory and must be followed at all times.

---

## 1. Sectioned Layout (Mandatory)

Every source file must include the following sections in this exact order:

1. `// IMPORT SECTION`
2. `// STYLE SECTION`
3. `// STATE SECTION`
4. `// LOGIC SECTION`
5. `// UI SECTION`
6. `// EFFECT SECTION`
7. `// EXPORT SECTION`

**Requirements:**

* All sections must exist. If unused, mark with `(unused)`.
* Labels must be uppercase with the word `SECTION`.
* Component-specific styles go in **STYLE SECTION**.
* Constants/configs for UI go in **STATE** or **LOGIC**, not inline JSX.
* Inline comments allowed only if behavior is unclear.

**Tests:**

* May use reduced structure: `IMPORT`, `SETUP`, `ASSERT`, `EXPORT`.

---

## 2. Project Structure

* Must remain **flat**.
* **No subfolders** unless forced by tooling. Use naming patterns instead.
* Max \~300 lines per file. Split into smaller files if necessary.

---

## 3. File Naming

* Use **PascalCase**.
* Logic files: `LogicX_Description.ts` (e.g. `Logic1_LayerProducer.ts`).
* UI/Button files: `LauncherBtn.tsx`, `LauncherBtnConfig.ts`, `LauncherBtnEffect.ts`.
* Avoid vague abbreviations or unclear names.

---

## 4. Workflow for AI Agents

* **Plan-first protocol**: provide a plan before coding (summary, steps, tradeoffs, files, rollback).
* **Explicit approval** required before file changes.
* **No surprise alternatives**; only one fallback if blocked.
* **Commit hygiene**:

  * Respect `.gitignore` and lockfiles.
  * Conventional commit messages (`feat:`, `fix:`, `chore:`).
  * Freeze at safe checkpoints.
* Repo must always be **clone-and-run ready** with:

  ```bash
  git clone
  npm install/ci
  npm run dev
  ```
* Mandatory support files: `package.json` scripts, `.nvmrc` or engines, minimal configs, README.

---

## 5. Styling & Assets

* Tailwind classes must be **literal strings** (no runtime generation).
* Assets live in `/public/Asset/...` with a leading slash.
* Images default to `object-fill`; use `object-contain` only if requested.
* All sizes/behavior/styling must be **config-driven**, not inline hardcoded.

---

## 6. Logic & Layer Rules

* Logic modules are **versioned** (`Logic1`, `Logic2`, `Logic3`, …).
* Each module must handle one responsibility (layer, mapping, spin, orbit, clock, fallback).
* Always follow: **Config → Logic → Code**.

---

## 7. Legacy & Migration

* Legacy files must be migrated into this sectioned layout whenever touched.
* No mixing of old and new styles.

---

## 8. Enforcement

* Every change must be checked against these rules.
* If a user request conflicts with these rules, the AI must:

  1. Flag the conflict.
  2. Ask for confirmation before overriding.

---

---

# ✅ AI Coding Checklist

### Sectioned Layout

* [ ] File includes **all 7 sections** in order: IMPORT / STYLE / STATE / LOGIC / UI / EFFECT / EXPORT
* [ ] Unused sections explicitly marked `(unused)`
* [ ] Tests follow reduced layout: IMPORT / SETUP / ASSERT / EXPORT

### Project Structure

* [ ] Flat structure only — no subfolders, use naming patterns instead
* [ ] File ≤ 300 lines (split if larger)

### File Naming

* [ ] PascalCase filenames
* [ ] Logic files prefixed `LogicX_...` (e.g. `Logic1_LayerProducer.ts`)
* [ ] UI/Button files prefixed `LauncherBtn...`
* [ ] No vague abbreviations

### Workflow (for AI agents)

* [ ] Produce **plan first** (summary, steps, tradeoffs, files, rollback)
* [ ] Get **explicit approval** before changes
* [ ] No surprise alternatives; fallback only if blocked
* [ ] Commits clean: `.gitignore`, lockfiles, conventional messages
* [ ] Repo must be clone-and-run: `git clone`, `npm install/ci`, `npm run dev`

### Styling & Assets

* [ ] Tailwind classes are literal strings (no runtime generation)
* [ ] Assets served from `/public/Asset/...` with leading slash
* [ ] Images: `object-fill` by default, `object-contain` only if requested
* [ ] All sizes/behavior config-driven, not hardcoded

### Logic Rules

* [ ] Logic modules are versioned (`Logic1`, `Logic2`, …)
* [ ] Each module has single responsibility (layer, mapping, spin, orbit, clock, fallback)
* [ ] Always follow flow: **Config → Logic → Code**

### Legacy Migration

* [ ] Any legacy file touched must be migrated into sectioned layout
* [ ] Do not mix old and new styles

### Enforcement

* [ ] All changes checked against this checklist before acceptance
* [ ] If user request conflicts with rules → flag and confirm override

---

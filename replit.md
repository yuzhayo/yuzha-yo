# Yuzha Animation Framework

## User Preferences

- Communication: Simple, everyday language

---

## What This Project Is

A TypeScript monorepo with multiple apps built on React + Vite. The main app (`yuzha/`) is an animation framework that uses a JSON-driven "Layer System" to render animated visuals via Three.js (WebGL) or Canvas 2D as a fallback.

**Workspaces:**
- `yuzha/` — Main app, runs on port 5000. This is the primary workspace.
- `shared/` — Shared logic, components, and assets used by all workspaces.
- `counter2/` — Standalone counter app (port 3002).
- `manga/` — Electron-based manga reader (not used on Replit; Electron is incompatible).
- `meng/`, `alphaRemove/`, `componentViewer/` — Other standalone tools.

**Tech stack:** React 18, TypeScript, Vite 7, Three.js, Tailwind CSS, Radix UI.

No external auth. No paid API integrations. No database.

---

## Replit Setup — What to Do on First Import

This is a step-by-step record of what was done to get this project running on Replit. Follow these exactly if setting up from scratch.

### Step 1 — Install dependencies

Run from the project root:

```bash
npm install
npm install --workspaces
```

The root `node_modules/.bin/` contains the shared `vite` binary used by all workspaces. The workspace `node_modules` folders do NOT have their own copies. This is normal for npm workspaces — everything is hoisted to the root.

### Step 2 — Configure the workflow

Use the `configureWorkflow` tool (via `code_execution`) to set up the main workflow:

```javascript
await configureWorkflow({
    name: "Start application",
    command: "npm run dev:yuzha",
    waitForPort: 5000,
    outputType: "webview"
});
```

- `outputType: "webview"` is required for port 5000.
- The command `npm run dev:yuzha` delegates to `npm run dev --workspace yuzha`, which runs `vite` from the root `node_modules/.bin/`.

### Step 3 — Verify it works

Check logs with `refresh_all_logs`. You should see:

```
VITE v7.x.x  ready in NNN ms
➜  Local:   http://localhost:5000/
```

Take a screenshot with `screenshot({ type: "app_preview", path: "/", port: 5000 })`. The app should show the Yuzha main screen (a stellar/clock-style animation hub).

### Known Blocked Packages (do NOT add these back)

Replit's security policy blocks these — they will silently fail or break `npm install`:

- `concurrently` — blocked (depends on `shell-quote` which is blocked)
- `vitest` — blocked
- `@vitest/coverage-v8` — blocked

They were already removed from `package.json` before migration. If they reappear, remove them again.

### WebGL / Blank Screen Behavior

Three.js WebGL may fail in headless/preview environments. The app already handles this: it auto-detects a headless browser and falls back to Canvas 2D rendering. This is normal — Canvas 2D output is identical to WebGL output.

---

## Architecture Notes

### Dual Renderer

- **Three.js (WebGL):** Default for real browsers.
- **Canvas 2D:** Auto-fallback for AI agents, screenshots, headless environments.
- Detection lives in `shared/layer/engine.ts` and `yuzha/src/MainScreen.tsx`.

### Layer System

- Layers are defined in `shared/layer/ConfigYuzha.json` (and `ConfigCounter2.json` for counter2).
- `model.ts` — single source of truth for types + config loading.
- `math.ts` — single source of truth for all pure math/clock functions.
- `engine.ts` — runtime that reads from `model.ts` and `math.ts`.
- `index.ts` — barrel export.
- Asset loading uses `import.meta.glob` (required for Vite static analysis in production builds — do not use dynamic `new URL()` for assets).

### Coordinate System

All layout uses a 2048×2048 stage (`Stage2048`) that scales dynamically to the actual screen size.

### Vite Aliases

Every workspace maps:
- `@` → its own `src/`
- `@shared` → `../shared/`

### MangaDex Proxy (Yuzha only)

`yuzha/vite.config.ts` proxies:
- `/api/mangadex` → `https://api.mangadex.org`
- `/api/mangadex-cdn` → `https://uploads.mangadex.org`

---

## Key Files

| File | Purpose |
|---|---|
| `yuzha/src/App.tsx` | Root app, screen routing |
| `yuzha/src/MainScreen.tsx` | Main hub screen, renderer fallback logic |
| `yuzha/vite.config.ts` | Vite config, port, aliases, proxy |
| `shared/layer/model.ts` | Layer types + config loading |
| `shared/layer/math.ts` | All math/clock calculations |
| `shared/layer/engine.ts` | Runtime layer execution |
| `shared/layer/index.ts` | Barrel exports |
| `yuzha/src/manga/MangaReaderScreen.tsx` | Manga reader orchestrator |
| `yuzha/src/timestamp/timestampScreen.tsx` | Timestamp overlay screen |

---

## Scripts Reference

```bash
npm run dev:yuzha       # Start main app on port 5000
npm run build:yuzha     # Production build of main app
npm run dev:counter2    # Start counter2 on port 3002
npm run typecheck:yuzha # TypeScript check for yuzha
npm run lint            # ESLint (max-warnings=0)
```

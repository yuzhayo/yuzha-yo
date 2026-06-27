
Action: file_editor create /app/MANGA_ROOT_INTEGRATION.md --file-text 



"#MANGA ↔ ROOT INTEGRATION

> Companion to [`manga/DOCUMENTATION.md`](./manga/DOCUMENTATION.md).
> This document focuses **only** on the boundary between the monorepo root
> (`yuzha-yo`) and the `manga/` workspace — what is shared, what is not,
> and what wires them together.

---

## 1. The Monorepo at a Glance

`yuzha-yo` is an **npm workspaces** monorepo. The relevant root files for this analysis are:

```
/  (project root, package.json \"name\": \"yuzha-yo\")
├── package.json               ← workspace declarations + delegating scripts
├── package-lock.json
├── .npmrc                     ← workspaces-update=true
├── .replit                    ← Replit dev environment (does NOT run manga)
├── replit.md                  ← states manga is \"not used on Replit\"
├── netlify.toml               ← deploys yuzha/dist only
├── tsconfig.json              ← project references: yuzha + meng (NOT manga)
├── tsconfig.base.json         ← shared TS compiler options
├── eslint.config.ts           ← flat ESLint, scoped to yuzha + shared
├── tailwind.config.ts         ← root-level Tailwind preset (yuzha use)
├── postcss.config.ts
├── vitest.config.ts
├── components.json            ← shadcn registry config (yuzha-related)
├── env.local.example
│
├── yuzha/         ← main app, port 5000 (Vite browser SPA)
├── shared/        ← shared modules (layer engine, asset registry, etc.)
├── meng/          ← standalone tool
├── counter2/      ← standalone counter (port 3002 in .replit)
├── manga/         ← Electron Manga Reader  ← **subject of this doc**
├── alphaRemove/   ← standalone tool
└── componentViewer/ ← standalone tool
```

According to `replit.md`:

> *“`manga/` — Electron-based manga reader (not used on Replit; Electron is incompatible).”*

So `manga/` is a **first-class workspace** for `npm install` and `npm run …` purposes, but it is **operationally isolated** from the runtime that powers the rest of the repo.

---

## 2. The Three Layers of Coupling

### 2.1 Layer A — Workspace registration (the only hard binding)

**`package.json` (root)** declares `manga` as a workspace:

```json
{
  \"name\": \"yuzha-yo\",
  \"workspaces\": [
    \"yuzha\",
    \"meng\",
    \"counter2\",
    \"manga\",
    \"alphaRemove\",
    \"componentViewer\"
  ]
}
```

Effects when you run `npm install` at root:

1. npm reads `manga/package.json` and resolves its `dependencies` + `devDependencies` together with every other workspace.
2. Most packages are **hoisted** to root `node_modules/`. Only packages that conflict (same name, incompatible version) land inside `manga/node_modules/`.
3. `.npmrc` sets `workspaces-update=true`, ensuring lockfile/workspace state are recomputed on each install.
4. Binaries from any workspace (e.g. `electron-vite`, `electron-builder`) become available via `node_modules/.bin/` and are reachable from any subfolder script invocation through npm's PATH augmentation.

> **Practical consequence.** Several heavy dev tools that `manga/` needs are **already declared at the root** (`electron ^42.5.0`, `tailwindcss ^3.4.17`, `typescript ^5.6.3`, `@vitejs/plugin-react`, `postcss`, `autoprefixer`). They are re-declared in `manga/package.json` so the workspace works in isolation, but in practice npm dedupes them to root.

### 2.2 Layer B — Convenience scripts (root → workspace passthrough)

The root `package.json` exposes a stable, top-level interface for the manga app. Every script is a thin `--workspace manga` delegate:

| Root command | Internal delegation |
|---|---|
| `npm run dev:manga` | `npm run dev --workspace manga` → `electron-vite dev` |
| `npm run build:manga` | `npm run build --workspace manga` → `electron-vite build` |
| `npm run dist:manga` | `npm run dist --workspace manga` → `build` + `electron-builder` (current OS) |
| `npm run dist:manga:win` | `electron-builder --win` (nsis) |
| `npm run dist:manga:mac` | `electron-builder --mac` (dmg) |
| `npm run dist:manga:linux` | `electron-builder --linux` (AppImage) |
| `npm run typecheck:manga` | `tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json` |
| `npm run preview:manga` | `electron-vite preview` |

Why this matters: a developer who clones the repo at root never has to `cd manga`. All daily operations are reachable from the root.

What is **not** wired:

- `manga` is **not** in the global aggregate scripts (`npm run dev`, `npm run build`, `npm run start`, `npm run ci:verify`, `npm run typecheck`, `npm run lint`, `npm run test`). Those resolve to `yuzha` only. So a CI run of `npm run ci:verify` will **not** typecheck or build the manga workspace — this is intentional, because Electron is unavailable in the Replit/Netlify CI environments.

### 2.3 Layer C — TypeScript project references (NOT linked)

Root `tsconfig.json`:

```json
{
  \"extends\": \"./tsconfig.base.json\",
  \"compilerOptions\": {
    \"baseUrl\": \".\",
    \"paths\": { \"@shared/*\": [\"shared/*\"] }
  },
  \"include\": [\"shared\"],
  \"references\": [
    { \"path\": \"./yuzha\" },
    { \"path\": \"./meng\" }
  ]
}
```

`manga` is **deliberately absent** from `references`. Implication:

- Running `tsc -b` from the root **will not** compile or type-check `manga/`.
- The root-level `@shared/*` path alias has no effect inside `manga/` because `manga/tsconfig.web.json` does not extend or reference `tsconfig.base.json`. The manga TS projects are fully autonomous (their own `target`, `lib`, `module`, `paths`).

---

## 3. What Is Shared Between Root and `manga/`

| Asset | Shared with `manga/`? | Notes |
|---|---|---|
| `package-lock.json` | ✅ Yes (root file) | Single lockfile governs all workspaces |
| `node_modules/` (hoisted) | ✅ Yes | Most deps live here |
| `node_modules/.bin/electron-vite`, `…/electron-builder` | ✅ Yes | Hoisted bins resolve through PATH |
| `.editorconfig`, `.prettierrc`, `.prettierignore`, `.gitattributes`, `.gitignore` | ✅ Yes | Apply repo-wide |
| `eslint.config.ts` | ⚠️ Partial | Default block matches `**/*.{ts,tsx}`, but root `npm run lint` only globs `yuzha/**` and `shared/**`, so `manga/` is **not linted by root** by default |
| `tsconfig.base.json` | ❌ No | `manga/tsconfig.*` do not extend it |
| `tsconfig.json` references | ❌ No | `manga` excluded |
| `shared/` modules | ❌ No | `manga` does not import from `shared/`. There is no `@shared` alias in `manga/electron.vite.config.ts`. `grep -R \"@shared\" manga/src manga/electron` returns **zero matches** (BUG-13 invariant) |
| `tailwind.config.ts` (root) | ❌ No | `manga/tailwind.config.ts` is a separate, smaller config (`content: [\"./src/**/*.{ts,tsx,html}\", \"./electron/**/*.{ts,tsx}\"]`) |
| `postcss.config.ts` (root) | ❌ No | `manga/postcss.config.ts` is its own file |
| `vitest.config.ts` | ❌ No | manga has no tests; `vitest` is blocked on Replit anyway |
| `netlify.toml` | ❌ No | Netlify builds `yuzha/dist` only |
| `.replit` workflow | ❌ No | Replit's runButton runs `npm run dev:yuzha` only |

---

## 4. What Is **Not** Shared (and Why That's Deliberate)

### 4.1 No `shared/` imports

The original Yuzha-era manga reader (before the Electron migration) lived under `yuzha/src/manga/MangaReaderScreen.tsx` (still referenced in `replit.md` Key Files) and presumably reused `shared/` utilities. The migration plan (`manga/MANGA_ELECTRON_PLAN.md` BUG-13) explicitly mandates removing all `@shared` references — and the current code complies.

**Why:** Electron's main process is a Node runtime with no Vite preprocessing pipeline. Importing from `../shared/` would force adding a build alias to `electron.vite.config.ts`, complicating externalization and risking bundling browser-only code into the main process.

### 4.2 No proxy / no shared `vite.config.ts`

`yuzha/vite.config.ts` historically proxies `/api/mangadex*` to MangaDex's CDN (`replit.md` §“MangaDex Proxy (Yuzha only)”). That proxy is **not** used by the current `manga/` workspace; the MangaDex API was excised entirely during the Electron migration. All network calls in the Electron app originate from the main process and bypass CORS.

### 4.3 No Replit / Netlify / Docker integration

- `.replit` configures only port 5000 (Yuzha) and 3002 (counter2). Port 3003 is mapped externally but no workflow binds to it — vestigial from when manga was a browser app.
- `netlify.toml` publishes `yuzha/dist` exclusively.
- There is no Dockerfile in this repository. No CI workflow builds the Electron binaries.

The Electron app is **expected to be built and distributed locally by a developer**, not via the same pipeline that ships Yuzha to the web.

### 4.4 Distinct port behaviour

- Yuzha dev server: **5000** (mapped externalPort 80 on Replit, webview output).
- counter2 dev server: **3002**.
- meng / alphaRemove / componentViewer: their own Vite ports.
- manga: **no port at all** in the conventional sense. `electron-vite dev` spins up an internal Vite renderer dev server (HMR over `ws://localhost:*`) but the only consumer is the Electron `BrowserWindow.loadURL(process.env.ELECTRON_RENDERER_URL)`. No human visits a port; no proxy is involved.

---

## 5. Data Flow Diagram — From Root to a Running Manga App

```
┌─────────────────────────── repo root ────────────────────────────┐
│                                                                  │
│  package.json   (workspaces: [..., \"manga\", ...])                │
│  package-lock.json                                               │
│  .npmrc         (workspaces-update=true)                         │
│                                                                  │
│  $ npm install                                                   │
│       │                                                          │
│       ▼                                                          │
│  node_modules/  ← hoisted: react, electron, electron-vite,       │
│                  electron-builder, tailwindcss, typescript, …    │
│                                                                  │
│  $ npm run dev:manga    (root script)                            │
│       │                                                          │
│       │  delegates to: npm run dev --workspace manga             │
│       ▼                                                          │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────── manga/ ──────────────────────────────┐
│  package.json  \"main\": \"out/main/index.js\"                       │
│  package.json  scripts.dev = \"electron-vite dev\"                 │
│                                                                  │
│   electron-vite dev                                              │
│     ├── builds  electron/main/index.ts        → out/main/        │
│     ├── builds  electron/preload/index.ts     → out/preload/     │
│     ├── starts  Vite dev server (root=src/)   → ELECTRON_RENDERER_URL
│     └── spawns  Electron → loads out/main/index.js               │
│                                  │                               │
│                                  ▼                               │
│            BrowserWindow.loadURL($ELECTRON_RENDERER_URL)         │
│                                  │                               │
│                                  ▼                               │
│        ┌─────────────────────────────────────────────┐           │
│        │ Renderer (Chromium): src/main.tsx → App.tsx │           │
│        │   ├── reader/  (offline CBZ reader)         │           │
│        │   └── downloader/  (talks to window.api)    │           │
│        └─────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

The root provides: **workspace declaration**, **hoisted dependencies**, **passthrough scripts**, and a **uniform development experience**. It provides **no runtime code**, **no proxy**, **no aliases**, and **no shared library** to the manga app.

---

## 6. Build / Distribution Path

```
$ npm run build:manga                  (root)
    └─ npm run build --workspace manga
        └─ electron-vite build
            ├─ out/main/index.js
            ├─ out/preload/index.mjs
            └─ out/renderer/*  (HTML + hashed assets)

$ npm run dist:manga[:win|:mac|:linux] (root)
    └─ npm run dist:* --workspace manga
        └─ npm run build && electron-builder [--win|--mac|--linux]
            └─ release/
                ├─ Manga Reader Setup x.y.z.exe   (Windows / nsis)
                ├─ Manga Reader-x.y.z.dmg         (macOS / dmg)
                └─ Manga Reader-x.y.z.AppImage    (Linux / AppImage)
```

`electron-builder` reads its `build` block from `manga/package.json` (appId `com.yuzha.manga`, productName `\"Manga Reader\"`, `directories.output: \"release\"`). Icons are expected at `manga/assets/icon.{ico,icns,png}` — currently **absent** in this checkout; packaging will use Electron's default icon until they are added.

The output `release/` is **not** consumed by any other workspace, by Netlify, or by Replit. It is a standalone artifact for end users.

---

## 7. Lifecycle Comparison — manga vs other workspaces

| Concern | `yuzha` | `counter2` | `meng` / `alphaRemove` / `componentViewer` | **`manga`** |
|---|---|---|---|---|
| Runtime | Browser SPA (Vite) | Browser SPA | Browser SPAs | Electron desktop app |
| Dev command from root | `npm run dev` | `npm run dev:counter2` | `npm run dev:<name>` | `npm run dev:manga` |
| Listens on a port? | Yes (5000) | Yes (3002) | Yes | No (Electron window) |
| Uses `shared/`? | Yes (heavily) | Yes (`ConfigCounter2.json`) | Varies | **No** |
| Uses `@shared` alias? | Yes | Yes | Varies | **No** |
| In root `tsconfig.json` refs? | Yes | No | No | **No** |
| In root `lint` glob? | Yes | No | No | **No** |
| Deployed by `netlify.toml`? | Yes | No | No | **No** |
| Run by `.replit` workflow? | Yes | No | No | **No** (incompatible) |
| Build artefact | `yuzha/dist/` (static site) | own `dist/` | own `dist/` | `manga/release/*.exe \| dmg \| AppImage` |

This table makes the asymmetry explicit: every other workspace is a web app sharing the root's ecosystem; `manga/` is a **desktop-app island** that only depends on the root for **package management** and **command ergonomics**.

---

## 8. Touchpoints to Be Aware Of When Changing Things

1. **Adding a dependency to `manga/`**. Use `npm install <pkg> --workspace manga`. Lockfile updates land at root. If the dep is used at runtime in `electron/main/*`, put it in `dependencies`, not `devDependencies`, or `electron-builder` will ship a broken bundle (BUG-01).
2. **Renaming workspaces**. The root `package.json` `workspaces` array, the root scripts (`dev:manga`, etc.), `replit.md`, and this document all reference the literal string `\"manga\"`.
3. **Adding shared code**. If you ever introduce a `manga ↔ shared/` import, you must also:
   - Add an `@shared` alias to `manga/electron.vite.config.ts → renderer.resolve.alias`.
   - Make sure the import is **renderer-side only** unless `shared/` files are also valid Node ESM (electron-vite's `externalizeDepsPlugin()` does not bundle them).
   - Reconsider whether you actually want to break the isolation invariant documented above.
4. **Adding `manga` to root `lint`/`typecheck`/`ci:verify`**. Currently the root `npm run ci:verify` does **not** verify the manga workspace. To wire it in:
   - Add `\"manga/**/*.{ts,tsx}\"` to the `lint` script's glob.
   - Add `&& npm run typecheck:manga` to the root `typecheck` script.
   - But: be aware Electron is unavailable on Replit (`replit.md`), so anything that actually instantiates Electron will fail there.

---

## 9. TL;DR

- `manga/` is a **fully self-contained Electron desktop app** living inside an npm workspaces monorepo.
- The root contributes exactly three things: (1) workspace registration, (2) hoisted shared dependencies, (3) convenience scripts (`dev:manga`, `build:manga`, `dist:manga[:os]`, `typecheck:manga`, `preview:manga`).
- The root contributes **no runtime code, no aliases, no shared modules, no proxy, no deployment pipeline, no CI verification** to `manga/`.
- The manga app builds to `manga/release/` as platform-native installers (`.exe`, `.dmg`, `.AppImage`) and is distributed independently of Yuzha's web deployment.
- For internal manga details (process model, IPC, downloader engine, reader hooks, file-by-file responsibilities), see [`manga/DOCUMENTATION.md`](./manga/DOCUMENTATION.md). For the original migration playbook with bug catalog, see [`manga/MANGA_ELECTRON_PLAN.md`](./manga/MANGA_ELECTRON_PLAN.md).
"
Observation: Create successful: /app/MANGA_ROOT_INTEGRATION.md
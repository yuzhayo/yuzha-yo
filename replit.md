# Yuzha Animation Framework

## Overview

Modern TypeScript animation framework with a JSON-based "Layer System" that creates animated visual outputs. Built as a monorepo using React, Vite, Three.js (WebGL), and Canvas 2D with intelligent dual-renderer system.

## Project Structure

**Monorepo with single workspace:**

- `yuzha/` - Main application (template launcher)
- `shared/` - Animation logic, rendering engines, utilities

## Tech Stack

- React 18 + TypeScript + Vite 7
- Three.js (WebGL renderer for production)
- Canvas 2D (fallback for AI agents/screenshots)
- Tailwind CSS

---

## 🚀 First Time Setup (New Agent)

**IMPORTANT:** This project is pre-configured. Just install and run:

```bash
npm install
npm run dev:5000
```

**DO NOT:**

- Run tests (`npm test`) - Skip all testing during setup
- Run builds - Only if specifically requested
- Modify Vite config - Already configured correctly
- Change workflows - Already set up

**Configuration Status:**

- ✅ Vite: host 0.0.0.0, allowedHosts: true, port 5000
- ✅ Workflow: "Frontend" runs `npm run dev:5000`
- ✅ Deployment: Autoscale with `npm run build` → `npm run start`

---

## Development

**Run locally:**

```bash
npm run dev:5000
```

Server runs on port 5000 at http://localhost:5000

**Build for production:**

```bash
npm run build
npm run start
```

**Type checking only (no tests):**

```bash
npm run typecheck
```

---

## Architecture Quick Reference

### Dual Renderer System

- **Production:** Three.js WebGL (StageThree.tsx)
- **AI/Screenshots:** Canvas 2D (StageCanvas.tsx)
- Auto-detects headless browsers and falls back appropriately

### Layer System Flow

```
JSON Config → LayerCore (basic logic)
  → Spin Processor (rotation)
  → [Future processors...]
  → Rendering Engine
  → Screen
```

**Key Files:**

- `shared/config/ConfigYuzha.json` - Layer definitions
- `shared/layer/LayerCore.ts` - Core transform logic
- `shared/layer/LayerCorePipelineImageMapping.ts` - Image geometry calculation
- `shared/layer/LayerCorePipelineSpin.ts` - Spin animation
- `shared/stages/StageThree.tsx` - Three.js renderer
- `shared/stages/StageCanvas.tsx` - Canvas 2D renderer

### Stage2048 System

- Fixed 2048×2048 coordinate system
- Scales to any screen size (like CSS background-size: cover)
- Renderer-agnostic

---

## TypeScript Compilation

**✅ Use Vite, not tsc directly**

- Development: `npm run dev` (Vite compiles in-memory)
- Type check: `npm run typecheck` (tsc --noEmit)
- Build: `npm run build` (tsc --noEmit + vite build)

**❌ Never run:**

- `tsc` without --noEmit (creates .js files in source)

---

## User Preferences

Communication: Simple, everyday language

---

## Recent Changes

**October 5, 2025 - Ray Helper Debug Visualization**

- ✅ Added ray helper visualization to `LayerCorePipelineImageMappingUtils.ts`
- ✅ Created `ImageRay` type for ray visualization data
- ✅ Implemented `generateImageRay()` function using exact computeImageMapping logic
- ✅ Added Canvas 2D rendering support for ray helpers (dotted lines)
- ✅ Added Three.js rendering support for ray helpers
- ✅ Extended debug configuration with `showTipRay` and `showBaseRay` options
- ✅ Ray colors: Orange for tip ray, Purple for base ray
- ✅ Rays visualize center-to-border calculation path for imageTip/imageBase

**Architecture Notes:**

- Ray helpers use identical calculation as `computeImageMapping()` for accuracy
- Rays show the actual geometric path from imageCenter to border intersection
- Debug visualization layers: bounding box → rays → axis line → markers
- Both Canvas and Three.js renderers support ray visualization

**October 5, 2025 - ImageMapping Refactoring**

- ✅ Refactored imageMapping calculation into separate processor file
- ✅ Created `LayerCorePipelineImageMapping.ts` with `computeImageMapping()` function
- ✅ Updated `LayerCore.ts` to import from new processor file (maintains backward compatibility)
- ✅ Enhanced documentation in `LayerCorePipeline.ts` to clarify imageMapping calculation flow
- ✅ All code passes TypeScript type checking, ESLint linting, and Prettier formatting
- ✅ Display functionality verified - all 5 layers rendering correctly (stars, GEARMOON, clock, hand, orbital moon)
- ✅ Cleaned up duplicate "Start Game" workflow

**Architecture Notes:**

- ImageMapping calculation remains in `LayerCore.prepareLayer()` (not in pipeline processors)
- Separation of concerns: geometry calculation logic isolated in dedicated file
- Pipeline processors (spin, orbital) add optional animation properties only

**October 4, 2025 - GitHub Import Configured for Replit**

- ✅ Fresh GitHub repository imported successfully
- ✅ Dependencies verified (502 packages already installed)
- ✅ Workflow configured: "Frontend" runs `npm run dev:5000` on port 5000
- ✅ Vite dev server running successfully (host: 0.0.0.0, allowedHosts: true)
- ✅ Deployment configured: Autoscale mode with `npm run build` → `npm run start`
- ✅ Application verified: Animated clock interface rendering correctly
- ✅ Dual-renderer system working: Canvas 2D for screenshots, Three.js for browser
- ✅ All 4 layers loading correctly (stars background, GEARMOON, clock face, hour hand)
- ✅ Performance optimizations intact and functional

**Project Import Notes:**

- This is a monorepo with npm workspaces (root + `yuzha/` workspace)
- Vite is hoisted to root node_modules and accessible via npm scripts
- Configuration already optimized for Replit environment (no changes needed)
- All previous optimizations preserved (render-on-demand, smart rendering, etc.)

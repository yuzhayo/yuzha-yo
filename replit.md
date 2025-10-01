# Yuzha Animation Framework

## Overview

This is a modern TypeScript animation framework built around a "Layer System" that processes JSON configurations into animated visual outputs. The project uses a monorepo structure with workspaces, combining a pure functional animation logic library with Canvas 2D rendering. The main application "Yuzha" serves as a template launcher showcasing various animation presets and configurations.

## Project Structure

This is a **monorepo** with a single workspace:

- **yuzha**: Main application workspace containing the template launcher
- **shared**: Shared animation logic, rendering engines, and utilities

## Core Technologies

- **React 18**: UI framework
- **TypeScript**: Type safety and development experience
- **Vite 7**: Build tool and development server
- **Three.js**: 3D/WebGL rendering engine (main renderer)
- **Canvas 2D**: 2D rendering engine (AI agent fallback)
- **Tailwind CSS**: Styling

## Development

### Running Locally

```bash
npm install
npm run dev:5000
```

The dev server runs on port 5000 and is accessible at http://localhost:5000

### Building for Production

```bash
npm run build
npm run start
```

## Replit Environment Setup

### Configuration

- ✅ **Dev Server**: Runs on port 5000 (Replit standard)
- ✅ **Vite Config**: Pre-configured with host 0.0.0.0 and allowedHosts enabled
- ✅ **Workflow**: Single "Frontend" workflow running `npm run dev:5000`
- ✅ **TypeScript**: Configured to include shared folder in compilation
- ✅ **Deployment**: Autoscale deployment with build and preview commands

### Import Setup Summary (For Next Agent)

**This project is fully configured and ready to run. Follow these steps only:**

1. **Install dependencies** (if not already installed):

   ```bash
   npm install
   ```

2. **Start the app**:
   ```bash
   npm run dev:5000
   ```

**DO NOT:**

- Run unnecessary tests or log checks during initial setup
- Modify Vite config (already configured: host 0.0.0.0, allowedHosts: true, port 5000)
- Change workflow settings (already configured correctly)
- Run builds unless specifically requested

**Configuration Summary:**

- ✅ Monorepo with single workspace (yuzha)
- ✅ Dependencies installed
- ✅ Workflow: "Frontend" runs `npm run dev:5000` on port 5000
- ✅ Deployment: Autoscale with `npm run build` and `npm run start`
- ✅ Favicon: Added to prevent 404 errors
- ✅ Vite already configured for Replit proxy (host: 0.0.0.0, allowedHosts: true)

## TypeScript Compilation Strategy

**This project uses Vite for compilation, NOT `tsc` directly:**

### ✅ Correct Commands:

- **Development:** `npm run dev` - Vite compiles TypeScript in-memory
- **Type Checking:** `npm run typecheck` - Uses `tsc --noEmit` (checks only, no files created)
- **Production Build:** `npm run build` - Runs `tsc --noEmit` then `vite build`

### ❌ Never Run:

- `tsc` (without --noEmit) - Creates scattered .js/.d.ts files next to sources
- `tsc --project .` - Same problem
- Any direct TypeScript compilation to source folders

### Why Vite, Not tsc?

1. **In Development:** Vite compiles TypeScript on-the-fly using esbuild (faster)
2. **In Production:** Vite bundles everything into `dist/` folder
3. **Type Safety:** `tsc --noEmit` checks types without creating files
4. **Prevention:** `.gitignore` blocks any accidentally created .js files in source folders

### What Caused the Scattered JS Files?

The build script originally had `tsc` without `--noEmit`, which created `.js` and `.d.ts` files alongside source files. These were then committed to Git. This has been fixed - the build now uses `tsc --noEmit && vite build`.

### Recent Changes (Sept 30, 2025)

- ✅ Fresh GitHub clone imported and configured for Replit environment
- ✅ All npm dependencies installed and verified (484 packages, 0 vulnerabilities)
- ✅ Frontend workflow configured and running (`npm run dev:5000` on port 5000)
- ✅ Vite configuration verified (host: 0.0.0.0, allowedHosts: true, port 5000)
- ✅ Deployment configuration set up for autoscale (build + preview)
- ✅ Application tested and confirmed working with animated clock interface
- ✅ Dual-renderer system operational (Three.js for users, Canvas 2D for AI/screenshots)
- ✅ Project ready for development and deployment

## Architecture

### Stage2048 System

The project uses a fixed 2048×2048 coordinate system that scales consistently across all devices:

**Core Module:** `shared/utils/stage2048.ts`

**Key Features:**

- Fixed 2048×2048 internal resolution (consistent coordinates)
- CSS transform scaling for any screen size
- "Cover" behavior (fills viewport, may overflow like CSS background-size: cover)
- Responsive (auto-adjusts on resize)
- Framework-agnostic (works with Canvas 2D, Three.js, or any renderer)

**Main Functions:**

```typescript
import { STAGE_SIZE, createStageTransformer, computeCoverTransform } from "@shared/utils/stage2048";

// Auto-setup with resize handling
const cleanup = createStageTransformer(canvas, container);

// Manual transform calculation
const { scale, offsetX, offsetY } = computeCoverTransform(width, height);
```

**Usage Examples:** See `shared/utils/stage2048.example.ts`

**Used By:**

- `StageCanvas.tsx` - Canvas 2D rendering
- `StageThree.tsx` - Three.js rendering

### Dual Renderer System

The project uses an intelligent dual-renderer system with auto-detection:

**For Normal Users (Production):**

- Three.js WebGL renderer (`StageThree.tsx`)
- High performance, hardware-accelerated
- Full 3D capabilities

**For AI Agents/Screenshot Tools:**

- Canvas 2D renderer (`StageCanvas.tsx`)
- Headless browser compatible
- Reliable screenshot capture

**Auto-Detection (`RendererDetector.ts`):**

- Detects headless browsers (HeadlessChrome, PhantomJS)
- Checks WebGL availability
- Falls back to Canvas 2D when needed

**Architecture Flow:**

1. `MainScreen.tsx` → Detects environment
2. Selects `StageThree` (WebGL) or `StageCanvas` (2D)
3. Both use `LayerCore` for consistent transform calculations
4. Visual output identical across renderers

### Layer System

The project uses a config-based layer system:

1. **Config JSON** (`shared/config/ConfigYuzha.json`) - Layer definitions
2. **Config.ts** (`shared/config/Config.ts`) - Type validation and sorting
3. **LayerCore** (`shared/layer/LayerCore.ts`) - Transform calculations (renderer-agnostic)
4. **LayerEngineThree** (`shared/layer/LayerEngineThree.ts`) - Three.js WebGL rendering
5. **LayerEngineCanvas** (`shared/layer/LayerEngineCanvas.ts`) - Canvas 2D rendering
6. **StageThree** (`shared/stages/StageThree.tsx`) - Three.js mounting
7. **StageCanvas** (`shared/stages/StageCanvas.tsx`) - Canvas mounting
8. **MainScreen** (`yuzha/src/MainScreen.tsx`) - Auto-detection and renderer selection

### Animation Behaviors

- **Spin**: Continuous rotation
- **Orbit**: Circular movement
- **Pulse**: Scale-based breathing effects
- **Fade**: Opacity oscillation
- **Basic transforms**: Position, scale, rotation, tilt

### UI Components

#### DragScreen Component (`yuzha/src/DragScreen.tsx`)

A fully-featured draggable and resizable popup modal component built with React and Tailwind CSS:

**Features:**

- **Draggable**: Click and drag the header to move the popup anywhere on screen
- **Resizable**: 8 resize handles (all edges and corners) with minimum size constraints
- **Animated Input**: Character-by-character label animation with staggered transitions
- **Tailwind Styling**: Modern gradient design with smooth transitions
- **Bounded Movement**: Keeps popup within viewport boundaries

**Usage:**

```tsx
import DragScreen, { DragScreenExample } from './DragScreen';

// Basic usage
<DragScreen
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Custom Title"
>
  {/* Your custom content */}
</DragScreen>

// Or use the example with default content
<DragScreenExample />
```

**Props:**

- `isOpen`: boolean - Controls visibility
- `onClose`: () => void - Callback when close button is clicked
- `title`: string (optional) - Header title, defaults to "Popup Window"
- `children`: ReactNode (optional) - Custom content, defaults to animated input form

## User Preferences

Preferred communication style: Simple, everyday language.

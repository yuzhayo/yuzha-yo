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
- **Canvas 2D**: Rendering engine
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
- ✅ Imported from GitHub and configured for Replit environment
- ✅ Installed all npm dependencies for the monorepo
- ✅ Configured frontend workflow for Replit (npm run dev:5000 on port 5000)
- ✅ Verified Vite config already has proper settings (host: 0.0.0.0, allowedHosts: true)
- ✅ Verified production build works correctly
- ✅ Set up deployment configuration for autoscale
- ✅ Added favicon to yuzha/index.html to prevent 404 error
- ✅ Cleaned up compiled JS/d.ts files from TypeScript sources
- ✅ Converted all config files to TypeScript (.ts) for consistency
- ✅ Fixed build script to use `tsc --noEmit` (prevents creating scattered .js files)
- ✅ Updated .gitignore to prevent compiled files from being committed
- ✅ Created centralized stage2048 module for reusable 2048×2048 coordinate system
- ✅ Refactored StageCanvas and StageThree to use stage2048 module (removed duplication)
- ✅ Application running successfully with animated canvas layer system

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
import { STAGE_SIZE, createStageTransformer, computeCoverTransform } from '@shared/utils/stage2048';

// Auto-setup with resize handling
const cleanup = createStageTransformer(canvas, container);

// Manual transform calculation
const { scale, offsetX, offsetY } = computeCoverTransform(width, height);
```

**Usage Examples:** See `shared/utils/stage2048.example.ts`

**Used By:**
- `StageCanvas.tsx` - Canvas 2D rendering
- `StageThree.tsx` - Three.js rendering

### Layer System
The project uses a config-based layer system:
1. **Config JSON** (`shared/config/ConfigYuzha.json`) - Layer definitions
2. **Config.ts** (`shared/config/Config.ts`) - Type validation and sorting
3. **LayerCore** (`shared/layer/LayerCore.ts`) - Transform calculations
4. **LayerEngineCanvas** (`shared/layer/LayerEngineCanvas.ts`) - Canvas 2D rendering
5. **StageCanvas** (`shared/stages/StageCanvas.tsx`) - Canvas mounting
6. **MainScreen** (`yuzha/src/MainScreen.tsx`) - Component integration

### Animation Behaviors
- **Spin**: Continuous rotation
- **Orbit**: Circular movement
- **Pulse**: Scale-based breathing effects
- **Fade**: Opacity oscillation
- **Basic transforms**: Position, scale, rotation, tilt

## User Preferences

Preferred communication style: Simple, everyday language.

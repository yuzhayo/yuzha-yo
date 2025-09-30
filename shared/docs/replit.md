# Overview

This is a modern TypeScript animation framework built around a "Layer System" that processes JSON configurations into animated visual outputs. The project uses a monorepo structure with workspaces, combining a pure functional animation logic library with multiple rendering implementations (Three.js/WebGL and Pixi.js). The main application "Yuzha" serves as a template launcher showcasing various animation presets and configurations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Layer System (Pure Logic)

The heart of the project is a pure, functional animation engine in `/shared/layer/` that:

- Takes JSON configurations as input describing animations, positions, behaviors
- Validates and normalizes configurations with strict TypeScript typing
- Processes time-based animations (spin, orbit, pulse, fade) through composable functions
- Outputs structured LayerData for consumption by rendering systems
- Maintains complete determinism with no side effects or I/O operations

## Dual Rendering Architecture

Two separate rendering implementations provide flexibility:

**Stages Engine** (`/shared/stages/`): Three.js-based WebGL renderer

- Uses Three.js for 3D-capable rendering with 2D projections
- Coordinate system with configurable origin (center/top-left)
- Performance monitoring and adaptive quality adjustment
- Modular architecture with separate transform, device detection, and performance modules

**Pixi Renderer** (in Launcher): Pixi.js-based 2D renderer

- Lightweight 2D graphics optimized for UI elements
- WebGL acceleration with Canvas fallback
- Specialized for interactive launcher interfaces

## Monorepo Structure

- **Root workspace**: Shared configuration, linting, testing infrastructure
- **Yuzha app**: Main template launcher demonstrating Layer System capabilities
- **Shared libraries**: Reusable animation logic, rendering engines, utilities
- **Attached assets**: Additional applications like specialized Launchers

## Animation Behavior System

Animations are built as composable "behaviors" that can be combined:

- **Spin**: Continuous rotation with configurable speed and direction
- **Orbit**: Circular movement around anchor points
- **Pulse**: Scale-based breathing effects
- **Fade**: Opacity oscillation
- **Basic transforms**: Position, scale, rotation, tilt

## Configuration Management

- JSON-based configuration with TypeScript validation
- Asset registry system for image resource management
- UI-friendly converters for editor interfaces (degrees ↔ radians, RPM ↔ speed)
- Preset system for common animation combinations

# External Dependencies

## Core Runtime Dependencies

- **React 18**: UI framework for interactive components
- **Three.js**: 3D graphics library for WebGL rendering
- **Pixi.js**: 2D graphics library for lightweight rendering
- **TypeScript**: Type safety and development experience

## Development Infrastructure

- **Vite**: Build tool and development server
- **Vitest**: Testing framework with coverage reporting
- **ESLint**: Code linting with TypeScript integration
- **Prettier**: Code formatting
- **Tailwind CSS**: Utility-first styling with typography plugins

## Build and Deployment Tools

- **Autoprefixer**: CSS vendor prefixing
- **PostCSS**: CSS processing pipeline
- **Concurrently**: Parallel script execution for monorepo workflows

The system is designed to be self-contained with no external APIs or database dependencies for core animation functionality, though it includes infrastructure for potential database integration via Drizzle ORM patterns.

# Replit Environment Setup

## Project Structure

This is a **monorepo** with a single workspace:
- **yuzha**: Main application workspace containing the template launcher

The project was originally configured with a second workspace (dhepil) that was removed as it doesn't exist in the codebase.

## Development Configuration

- **Dev Server**: Runs on port 5000 (Replit standard)
- **Vite Config**: Pre-configured for Replit with host 0.0.0.0 and allowedHosts enabled
- **Workflow**: Single "Frontend" workflow running `npm run dev:5000`
- **Build System**: Vite 7.x with TypeScript support

## Deployment Setup

- **Target**: Autoscale (stateless frontend)
- **Build Command**: `npm run build` (builds yuzha workspace)
- **Start Command**: `npm run start` (runs preview on port 5000)

## Rendering System

- **Canvas 2D Renderer**: The application uses a Canvas 2D renderer (`StageCanvas.tsx`) that works perfectly in Replit's headless browser environment
- **No WebGL Dependencies**: Replaced Three.js/Pixi.js (which require WebGL) with native Canvas 2D API for full Replit compatibility
- **Layer System Intact**: The config-based layer system (ConfigYuzha.json → LayerEngineCanvas) remains unchanged

## Configuration Flow

The layer rendering system follows this dependency chain:

1. **Config JSON** (`shared/config/ConfigYuzha.json`) - Layer definitions
2. **Config.ts** (`shared/config/Config.ts`) - Type validation and sorting
3. **LayerCore** (`shared/layer/LayerCore.ts`) - Transform calculations
4. **LayerEngineCanvas** (`shared/layer/LayerEngineCanvas.ts`) - Canvas 2D image rendering with ImageRegistry
5. **StageCanvas** (`shared/stages/StageCanvas.tsx`) - Canvas 2D mounting
6. **MainScreen** (`yuzha/src/MainScreen.tsx`) - Component integration

## Recent Changes (Sept 29, 2025)

### Replit Environment Setup
- ✅ Fixed cross-env dependency issue by removing it from workspace
- ✅ Updated package.json scripts to use native PORT environment variable
- ✅ Configured workflow to run on port 5000 with webview output

### Canvas 2D Migration
- ✅ Created `LayerEngineCanvas.ts` - Canvas 2D layer rendering engine
- ✅ Created `StageCanvas.tsx` - Canvas 2D stage component
- ✅ Replaced Three.js (`StageThree`) with Canvas 2D (`StageCanvas`)
- ✅ Fixed asset path resolution for case-sensitive file system (`Asset/` vs `asset/`)
- ✅ Verified rendering works perfectly in Replit preview without WebGL errors
- ✅ Reduced bundle size from 482 kB to 13 kB by removing Three.js dependency

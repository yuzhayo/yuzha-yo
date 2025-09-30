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

### Recent Setup Changes (Sept 30, 2025)
- ✅ Fixed Vite React plugin configuration (removed deprecated `fastRefresh` option)
- ✅ Updated TypeScript config to include shared folder in compilation
- ✅ Configured frontend workflow for Replit environment
- ✅ Verified production build works correctly
- ✅ Set up deployment configuration for autoscale

## Architecture

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

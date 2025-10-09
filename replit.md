# Yuzha Animation Framework

## Overview
The Yuzha Animation Framework is a modern TypeScript-based animation framework that utilizes a JSON-based "Layer System" to generate animated visual outputs. It is built as a monorepo leveraging React, Vite, Three.js (WebGL), and Canvas 2D, featuring an intelligent dual-renderer system. The project aims to provide a robust and performant solution for creating complex animations, with a focus on clear architecture and efficient rendering across different environments.

## User Preferences
Communication: Simple, everyday language

## System Architecture
The framework employs a dual-renderer system, defaulting to Three.js WebGL for production environments and falling back to Canvas 2D for AI agents or screenshot generation, with automatic headless browser detection. All rendering engines (Canvas, DOM, Three.js) share identical animation patterns and utilize a fixed 2048x2048 coordinate system that scales dynamically to fit various screen sizes.

The core animation logic revolves around a Layer System where JSON configurations define layers that pass through a pipeline of processors (e.g., `Spin Processor`) before reaching the rendering engine. The configuration structure clearly separates layer identity from feature-specific groups (Basic, Spin, Orbital, Debug Config). Performance is optimized through techniques like pipeline caching, pre-calculated math constants, static layer buffering, and lazy calculations for static layers. Debugging is supported by a comprehensive Image Mapping Debug visualization system with configurable visual helpers integrated as a pipeline processor.

**Key Technical Implementations & Design Choices:**
- **Monorepo Structure:** `yuzha/` for the main application and `shared/` for common logic.
- **Rendering:** Three.js (WebGL) for high-performance production, Canvas 2D as a fallback.
- **Coordinate System:** Stage2048 system (2048x2048 pixels) for consistent scaling.
- **Layer System:** JSON config drives `LayerCore` with extensible processors for transformations and animations.
- **Configuration:** `ConfigYuzha.json` defines layer properties and animation parameters. `transformConfig` handles conditional overrides for animation parameters.
- **Performance:**
    - Pipeline caching for processor results.
    - Pre-calculated math constants (`DEG_TO_RAD`, `TWO_PI`).
    - StaticLayerBuffer for one-time rendering of static content.
    - Image dimension and mapping caches.
    - Lazy calculations and `React.memo` for rendering optimization.
- **Debugging:** `ImageMappingDebugConfig` allows enabling various visual helpers (markers, axis lines, rays, bounding boxes) for both Canvas 2D and Three.js renderers.
- **TypeScript:** Strict type checking used throughout the project, with Vite handling compilation.

## External Dependencies
- **React 18:** Frontend UI library.
- **TypeScript:** Programming language for type safety.
- **Vite 7:** Build tool and development server.
- **Three.js:** WebGL 3D library for high-performance rendering.
- **Tailwind CSS:** Utility-first CSS framework.
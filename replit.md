# Yuzha Animation Framework

## Overview

The Yuzha Animation Framework is a modern TypeScript-based animation framework that generates animated visual outputs using a JSON-based "Layer System." Built as a monorepo with React, Vite, Three.js (WebGL), and Canvas 2D, it features an intelligent dual-renderer system. The project aims to provide a robust and performant solution for creating complex animations with clear architecture and efficient rendering.

## User Preferences

Communication: Simple, everyday language

## System Architecture

The framework utilizes a dual-renderer system, defaulting to Three.js WebGL for production and falling back to Canvas 2D for AI agents or screenshot generation, with automatic headless browser detection. Both renderers share identical animation patterns and operate on a fixed 2048x2048 coordinate system that dynamically scales.

Core animation logic is driven by a Layer System where JSON configurations define layers processed by a pipeline (e.g., `Spin Processor`) before rendering. The configuration separates layer identity from feature-specific groups. Performance is optimized through pipeline caching, pre-calculated math constants, static layer buffering, and lazy calculations. Debugging is supported by an Image Mapping Debug visualization system with configurable visual helpers. The system uses an extended coordinate system supporting negative and >100% percent values for advanced animation capabilities.

**Key Technical Implementations & Design Choices:**

-   **Monorepo Structure:** `yuzha/` for the main application and `shared/` for common logic.
-   **Rendering:** Three.js (WebGL) for high-performance; Canvas 2D as fallback.
-   **Coordinate System:** Stage2048 system (2048x2048 pixels) for consistent scaling, `normalizePercent()` for extended range.
-   **Layer System:** JSON config drives `LayerCore` with extensible processors for transformations and animations, consolidated under `shared/layer/`.
-   **Configuration:** `ConfigYuzha.json` defines layer properties and animation parameters in a flat structure, with `transformConfig` for conditional overrides and clock alias normalization.
-   **Performance:** Pipeline caching, pre-calculated constants, `StaticLayerBuffer`, image dimension/mapping caches, lazy calculations, and `React.memo`.
-   **Debugging:** `ImageMappingDebugConfig` for visual helpers across renderers.
-   **TypeScript:** Strict type checking with Vite for compilation.

## External Dependencies

-   **React 18:** Frontend UI library.
-   **TypeScript:** Programming language.
-   **Vite 7:** Build tool and development server.
-   **Three.js:** WebGL 3D library.
-   **Tailwind CSS:** Utility-first CSS framework.
// IMPORT SECTION
import React, { useEffect, useRef, useState, useCallback } from "react";
import { StagesEngine } from "@shared/stages/StagesEngine";
import {
  processLibraryConfigToStageObjects,
  updateStageObjectsFromLayers,
} from "@shared/stages/StagesEngineLayer";
import type { LibraryConfig } from "@shared/layer2/LayerTypes";
import type { StageObject, RenderQuality } from "@shared/stages/StagesTypes";

// STYLE SECTION (unused)

// STATE SECTION
export interface StagesCanvasLayerProps {
  width: number;
  height: number;
  config: LibraryConfig;
  quality?: RenderQuality;
  onInitialized?: () => void;
  onError?: (error: string) => void;
  onWarning?: (warnings: string[]) => void;
}

// LOGIC SECTION
export function StagesCanvasLayer({
  width,
  height,
  config,
  quality: _quality = {
    dpr: Math.min(window.devicePixelRatio, 2),
    antialias: true,
    shadows: false,
    textureScale: 1.0,
  },
  onInitialized,
  onError,
  onWarning,
}: StagesCanvasLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<StagesEngine | null>(null);
  const objectsMapRef = useRef<Map<string, StageObject>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize stages engine
  const initializeEngine = useCallback(async () => {
    if (!containerRef.current || engineRef.current) return;

    try {
      setError(null);

      const engine = new StagesEngine({
        width: 2048,
        height: 2048,
        debug: false,
      });

      await engine.mount(containerRef.current);
      engineRef.current = engine;

      // Process initial config
      const currentTime = (Date.now() - startTimeRef.current) / 1000;
      const result = processLibraryConfigToStageObjects(config, currentTime);

      if (result.warnings.length > 0) {
        onWarning?.(result.warnings);
      }

      // Add all objects to engine
      for (const obj of result.objects) {
        engine.setObject(obj.id, obj);
        objectsMapRef.current.set(obj.id, obj);
      }

      setIsInitialized(true);
      onInitialized?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize stages engine";
      setError(errorMessage);
      onError?.(errorMessage);
      console.error("[StagesCanvasLayer] Initialization failed:", err);
    }
  }, [config, onInitialized, onError, onWarning]);

  // Animation loop
  const animate = useCallback(() => {
    if (!engineRef.current || !isInitialized) return;

    try {
      const currentTime = (Date.now() - startTimeRef.current) / 1000;

      // Update objects with new animation state
      const result = updateStageObjectsFromLayers(config, objectsMapRef.current, currentTime);

      // Update engine with new object states
      for (const obj of result.updatedObjects) {
        engineRef.current.updateObject(obj.id, obj);
        objectsMapRef.current.set(obj.id, obj);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    } catch (err) {
      console.error("[StagesCanvasLayer] Animation loop error:", err);
    }
  }, [config, isInitialized]);

  // Start animation loop
  const startAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate]);

  // Stop animation loop
  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Update config when props change
  const updateConfig = useCallback(async () => {
    if (!engineRef.current || !isInitialized) return;

    try {
      // Reset time reference for new config
      startTimeRef.current = Date.now();

      // Clear existing objects
      for (const [id] of objectsMapRef.current) {
        engineRef.current.removeObject(id);
      }
      objectsMapRef.current.clear();

      // Process new config
      const result = processLibraryConfigToStageObjects(config, 0);

      if (result.warnings.length > 0) {
        onWarning?.(result.warnings);
      }

      // Add new objects
      for (const obj of result.objects) {
        engineRef.current.setObject(obj.id, obj);
        objectsMapRef.current.set(obj.id, obj);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update config";
      console.error("[StagesCanvasLayer] Config update failed:", err);
      onError?.(errorMessage);
    }
  }, [config, isInitialized, onError, onWarning]);

  // Cleanup function
  const cleanup = useCallback(() => {
    stopAnimation();

    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    objectsMapRef.current.clear();
    setIsInitialized(false);
    setError(null);
  }, [stopAnimation]);

  // UI SECTION
  const containerStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    position: "relative",
    overflow: "hidden",
    background: "transparent",
  };

  // EFFECT SECTION
  // Initialize engine on mount
  useEffect(() => {
    initializeEngine();
    return cleanup;
  }, [initializeEngine, cleanup]);

  // Update config when it changes
  useEffect(() => {
    if (isInitialized) {
      updateConfig();
    }
  }, [config, updateConfig, isInitialized]);

  // Start/stop animation based on initialization state
  useEffect(() => {
    if (isInitialized && !error) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return stopAnimation;
  }, [isInitialized, error, startAnimation, stopAnimation]);

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      // Engine handles its own resize logic
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return <div ref={containerRef} style={containerStyle} data-testid="stages-canvas-layer" />;
}

// EXPORT SECTION
export default StagesCanvasLayer;

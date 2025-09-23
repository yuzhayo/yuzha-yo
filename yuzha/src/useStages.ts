import { useEffect, useRef, useState, useCallback } from "react";
import type React from "react";
import { StagesRenderer } from "@shared/stages/StagesRenderer";
import { StagesLogic } from "@shared/stages/StagesLogic";
import type { RenderQuality, StageObject } from "@shared/stages/StagesTypes";

export interface UseStagesOptions {
  quality?: Partial<RenderQuality>;
  autoStart?: boolean;
}

export interface UseStagesReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  renderer: StagesRenderer | null;
  isInitialized: boolean;
  isRunning: boolean;
  error: string | null;
  addObject: (object: StageObject) => void;
  removeObject: (id: string) => void;
  updateObject: (object: StageObject) => void;
  start: () => void;
  stop: () => void;
  updateQuality: (quality: Partial<RenderQuality>) => void;
}

const DEFAULT_QUALITY: RenderQuality = {
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  antialias: true,
  shadows: false,
  textureScale: 1.0,
};

export function useStages(options: UseStagesOptions = {}): UseStagesReturn {
  const { quality: qualityOverrides = {}, autoStart = true } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<StagesRenderer | null>(null);
  const logicRef = useRef<StagesLogic | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quality = { ...DEFAULT_QUALITY, ...qualityOverrides };

  // Initialize Stages system
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setError(null);

        // Create logic instance
        const logic = new StagesLogic();
        logicRef.current = logic;

        // Create renderer instance
        const renderer = new StagesRenderer(logic);
        rendererRef.current = renderer;

        // Initialize renderer and get canvas
        const canvas = await renderer.initialize(quality);

        if (!mounted) {
          renderer.dispose();
          return;
        }

        canvasRef.current = canvas;
        setIsInitialized(true);

        if (autoStart) {
          renderer.start();
          setIsRunning(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize Stages");
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      if (logicRef.current) {
        logicRef.current = null;
      }
      setIsInitialized(false);
      setIsRunning(false);
    };
  }, [quality, autoStart]);

  const addObject = useCallback((object: StageObject) => {
    if (rendererRef.current) {
      rendererRef.current.setRenderObject(object);
    }
  }, []);

  const removeObject = useCallback((id: string) => {
    if (rendererRef.current) {
      rendererRef.current.removeRenderObject(id);
    }
  }, []);

  const updateObject = useCallback((object: StageObject) => {
    if (rendererRef.current) {
      rendererRef.current.updateRenderObject(object);
    }
  }, []);

  const start = useCallback(() => {
    if (rendererRef.current && isInitialized) {
      rendererRef.current.start();
      setIsRunning(true);
    }
  }, [isInitialized]);

  const stop = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.stop();
      setIsRunning(false);
    }
  }, []);

  const updateQuality = useCallback((newQuality: Partial<RenderQuality>) => {
    if (rendererRef.current) {
      rendererRef.current.updateQuality(newQuality);
    }
  }, []);

  return {
    canvasRef,
    renderer: rendererRef.current,
    isInitialized,
    isRunning,
    error,
    addObject,
    removeObject,
    updateObject,
    start,
    stop,
    updateQuality,
  };
}

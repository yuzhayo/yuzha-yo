// IMPORT SECTION
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { LayerEngine } from './EngineLayer-Parent.js';
import { LogicEngine, type LogicConfig } from './EngineLogic-Parent.js';
import { StagesEngine, type StagesConfig } from './EngineStages-Parent.js';
import LayerSceneManager from './EngineLayer-Children.js';
import { AnimationBehavior, RotationBehavior, ClockBehavior, OrbitBehavior } from './EngineLogic-Children.js';
import { SpriteStage, MeshStage, LightingStage, type SpriteStageConfig, type MeshStageConfig, type LightingStageConfig } from './EngineStages-Children.js';
import * as THREE from 'three';

// STYLE SECTION (unused)

// STATE SECTION
export interface EngineConfig {
  layer: {
    maxLayers: number;
    enableValidation: boolean;
  };
  logic: LogicConfig;
  stages: StagesConfig;
}

export interface EngineState {
  isInitialized: boolean;
  isRunning: boolean;
  layerCount: number;
  behaviorCount: number;
  stageCount: number;
  performance: {
    fps: number;
    frameTime: number;
  };
}

export interface HookConfig {
  autoStart?: boolean;
  enablePerformanceMonitoring?: boolean;
  onError?: (error: Error) => void;
  onInitialized?: () => void;
}

// LOGIC SECTION

/**
 * Main hook for dhepil engine integration with React
 */
export function useEngineSystem(config: EngineConfig, hookConfig: HookConfig = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engineState, setEngineState] = useState<EngineState>({
    isInitialized: false,
    isRunning: false,
    layerCount: 0,
    behaviorCount: 0,
    stageCount: 0,
    performance: { fps: 0, frameTime: 0 }
  });

  // Engine instances
  const layerEngine = useMemo(() => new LayerEngine(), []);

  const logicEngine = useMemo(() => new LogicEngine(config.logic), [config.logic]);
  const stagesEngine = useMemo(() => new StagesEngine(config.stages), [config.stages]);
  const sceneManager = useMemo(() => new LayerSceneManager(layerEngine, {}), [layerEngine]);

  // Initialize engines
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Initialize stages engine with canvas
      stagesEngine.initialize(canvasRef.current);

      // Set up default stages
      const spriteStageConfig: SpriteStageConfig = {
        textureUrls: [],
        maxSprites: 100,
        enableBatching: true
      };

      const meshStageConfig: MeshStageConfig = {
        geometryType: 'box',
        materialType: 'basic',
        enableShadows: false
      };

      const lightingStageConfig: LightingStageConfig = {
        ambientColor: 0x404040,
        ambientIntensity: 0.4,
        directionalColor: 0xffffff,
        directionalIntensity: 0.8,
        directionalPosition: new THREE.Vector3(1, 1, 0.5),
        enableShadows: false
      };

      const spriteStage = new SpriteStage('sprites', spriteStageConfig, 0);
      const meshStage = new MeshStage('meshes', meshStageConfig, 1);
      const lightingStage = new LightingStage('lighting', lightingStageConfig, -1);

      stagesEngine.addStage(lightingStage);
      stagesEngine.addStage(spriteStage);
      stagesEngine.addStage(meshStage);

      // Start logic engine
      logicEngine.start();

      setEngineState(prev => ({ 
        ...prev, 
        isInitialized: true,
        stageCount: 3
      }));

      if (hookConfig.onInitialized) {
        hookConfig.onInitialized();
      }

      if (hookConfig.autoStart) {
        start();
      }

    } catch (error) {
      console.error('Failed to initialize dhepil engine:', error);
      if (hookConfig.onError) {
        hookConfig.onError(error as Error);
      }
    }
  }, [stagesEngine, logicEngine, hookConfig]);

  // Animation loop
  useEffect(() => {
    if (!engineState.isInitialized || !engineState.isRunning) return;

    let animationId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      try {
        // Update logic behaviors
        logicEngine.update(deltaTime);

        // Render stages
        stagesEngine.render(deltaTime);

        // Update performance metrics
        if (hookConfig.enablePerformanceMonitoring) {
          const fps = 1000 / deltaTime;
          setEngineState(prev => ({
            ...prev,
            performance: { fps, frameTime: deltaTime },
            layerCount: layerEngine.getAllLayers().length,
            behaviorCount: logicEngine.getBehaviorCount()
          }));
        }

        animationId = requestAnimationFrame(animate);
      } catch (error) {
        console.error('Error in animation loop:', error);
        if (hookConfig.onError) {
          hookConfig.onError(error as Error);
        }
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [engineState.isInitialized, engineState.isRunning, logicEngine, stagesEngine, layerEngine, hookConfig]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !engineState.isInitialized) return;
      
      const { clientWidth, clientHeight } = canvasRef.current.parentElement || canvasRef.current;
      stagesEngine.resize(clientWidth, clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [stagesEngine, engineState.isInitialized]);

  // Control functions
  const start = useCallback(() => {
    setEngineState(prev => ({ ...prev, isRunning: true }));
  }, []);

  const stop = useCallback(() => {
    setEngineState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    layerEngine.getAllLayers().forEach(layer => {
      layerEngine.removeLayer(layer.id);
    });
    
    logicEngine.getAllBehaviors().forEach(behavior => {
      logicEngine.removeBehavior(behavior.id);
    });

    setEngineState(prev => ({
      ...prev,
      layerCount: 0,
      behaviorCount: 0
    }));
  }, [layerEngine, logicEngine]);

  return {
    // Refs
    canvasRef,
    
    // State
    engineState,
    
    // Engine instances
    layerEngine,
    logicEngine,
    stagesEngine,
    sceneManager,
    
    // Controls
    start,
    stop,
    reset
  };
}

/**
 * Hook for creating and managing animation behaviors
 */
export function useAnimationBehaviors(logicEngine: LogicEngine) {
  const [behaviors, setBehaviors] = useState<Map<string, any>>(new Map());

  const createRotationBehavior = useCallback((id: string, speed: number = Math.PI) => {
    const behavior = new RotationBehavior(id);
    logicEngine.addBehavior(id, behavior);
    behavior.setSpeed(speed);
    
    setBehaviors(prev => new Map(prev.set(id, behavior)));
    return behavior;
  }, [logicEngine]);

  const createClockBehavior = useCallback((id: string) => {
    const behavior = new ClockBehavior(id);
    logicEngine.addBehavior(id, behavior);
    
    setBehaviors(prev => new Map(prev.set(id, behavior)));
    return behavior;
  }, [logicEngine]);

  const createOrbitBehavior = useCallback((id: string, radius: number = 2, speed: number = Math.PI) => {
    const behavior = new OrbitBehavior(id);
    logicEngine.addBehavior(id, behavior);
    behavior.setOrbit(radius, speed);
    
    setBehaviors(prev => new Map(prev.set(id, behavior)));
    return behavior;
  }, [logicEngine]);

  const createAnimationBehavior = useCallback((id: string) => {
    const behavior = new AnimationBehavior(id);
    logicEngine.addBehavior(id, behavior);
    
    setBehaviors(prev => new Map(prev.set(id, behavior)));
    return behavior;
  }, [logicEngine]);

  const removeBehavior = useCallback((id: string) => {
    logicEngine.removeBehavior(id);
    setBehaviors(prev => {
      const newBehaviors = new Map(prev);
      newBehaviors.delete(id);
      return newBehaviors;
    });
  }, [logicEngine]);

  const getBehaviorState = useCallback((id: string) => {
    const behavior = behaviors.get(id);
    return behavior ? behavior.getState() : null;
  }, [behaviors]);

  return {
    behaviors,
    createRotationBehavior,
    createClockBehavior,
    createOrbitBehavior,
    createAnimationBehavior,
    removeBehavior,
    getBehaviorState
  };
}

/**
 * Hook for managing sprite layers with shared assets
 */
export function useAssetSprites(layerEngine: LayerEngine, sceneManager: LayerSceneManager) {
  const [assetRegistry, setAssetRegistry] = useState<Record<string, string>>({});
  const [loadedScenes, setLoadedScenes] = useState<string[]>([]);

  // Load asset registry from shared/Asset/
  useEffect(() => {
    const loadAssetRegistry = async () => {
      try {
        const response = await fetch('/shared/Asset/ImageRegistry.json');
        if (response.ok) {
          const registry = await response.json();
          setAssetRegistry(registry);
          // Update the scene manager's asset registry
          sceneManager.updateAssetRegistry(registry);
        }
      } catch (error) {
        console.error('Failed to load asset registry:', error);
      }
    };

    loadAssetRegistry();
  }, [sceneManager]);

  const loadGearScene = useCallback(() => {
    if (loadedScenes.includes('gear')) return;
    
    const sceneConfig = sceneManager.createGearScene();
    const layers = sceneManager.loadScene(sceneConfig);
    
    setLoadedScenes(prev => [...prev, 'gear']);
    return layers;
  }, [sceneManager, loadedScenes]);

  const loadClockScene = useCallback(() => {
    if (loadedScenes.includes('clock')) return;
    
    const sceneConfig = sceneManager.createClockScene();
    const layers = sceneManager.loadScene(sceneConfig);
    
    setLoadedScenes(prev => [...prev, 'clock']);
    return layers;
  }, [sceneManager, loadedScenes]);

  const createSpriteLayer = useCallback((id: string, assetId: string, position?: any, scale?: any) => {
    if (!assetRegistry[assetId]) {
      console.warn(`Asset ${assetId} not found in registry`);
      return null;
    }

    const layer = layerEngine.addLayer({
      id,
      type: 'mesh',
      position: position || { x: 0, y: 0, z: 0 },
      properties: {
        texture: assetRegistry[assetId],
        metadata: { assetId, scale: scale || { pct: 100 } }
      },
      visible: true,
      zIndex: 0
    });

    return layer;
  }, [layerEngine, assetRegistry]);

  const updateSpritePosition = useCallback((id: string, xPct: number, yPct: number) => {
    return sceneManager.updateLayerPosition(id, { xPct, yPct });
  }, [sceneManager]);

  const updateSpriteRotation = useCallback((id: string, angleDeg: number) => {
    return sceneManager.updateLayerRotation(id, angleDeg);
  }, [sceneManager]);

  const updateSpriteScale = useCallback((id: string, pct: number) => {
    return sceneManager.updateLayerScale(id, { pct });
  }, [sceneManager]);

  return {
    assetRegistry,
    loadedScenes,
    loadGearScene,
    loadClockScene,
    createSpriteLayer,
    updateSpritePosition,
    updateSpriteRotation,
    updateSpriteScale
  };
}

/**
 * Hook for performance monitoring
 */
export function useEnginePerformance(stagesEngine: StagesEngine) {
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const performanceMetrics = stagesEngine.getPerformanceMetrics();
      setMetrics(performanceMetrics);
    }, 1000);

    return () => clearInterval(interval);
  }, [stagesEngine]);

  return metrics;
}

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export default useEngineSystem;
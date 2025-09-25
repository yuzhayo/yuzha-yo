// IMPORT SECTION
import * as THREE from 'three';

// STYLE SECTION (unused)

// STATE SECTION
export interface StagesConfig {
  /** Renderer configuration */
  renderer: RendererConfig;
  
  /** Scene configuration */
  scene: SceneConfig;
  
  /** Camera configuration */
  camera: CameraConfig;
  
  /** Performance settings */
  performance?: PerformanceConfig;
}

export interface RendererConfig {
  canvas?: HTMLCanvasElement;
  antialias?: boolean;
  alpha?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  failIfMajorPerformanceCaveat?: boolean;
  stencil?: boolean;
  depth?: boolean;
  logarithmicDepthBuffer?: boolean;
  useLegacyLights?: boolean;
  outputColorSpace?: THREE.ColorSpace;
  toneMapping?: THREE.ToneMapping;
  toneMappingExposure?: number;
  shadowMap?: {
    enabled?: boolean;
    type?: THREE.ShadowMapType;
  };
}

export interface SceneConfig {
  background?: THREE.Color | THREE.Texture | THREE.CubeTexture;
  environment?: THREE.Texture;
  fog?: THREE.Fog | THREE.FogExp2;
}

export interface CameraConfig {
  type: 'perspective' | 'orthographic';
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  position?: THREE.Vector3;
  target?: THREE.Vector3;
}

export interface PerformanceConfig {
  targetFPS: number;
  enableProfiling: boolean;
  adaptiveQuality: boolean;
  pixelRatio?: number;
  maxPixelRatio?: number;
}

export interface Stage {
  /** Unique stage identifier */
  id: string;
  
  /** Stage enabled state */
  enabled: boolean;
  
  /** Stage priority for rendering order */
  priority: number;
  
  /** Initialize stage with Three.js scene */
  initialize(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.Camera): void;
  
  /** Render stage */
  render(deltaTime: number): void;
  
  /** Clean up stage resources */
  dispose(): void;
  
  /** Get stage performance metrics */
  getMetrics(): StageMetrics;
}

export interface StageMetrics {
  renderTime: number;
  triangleCount: number;
  drawCalls: number;
  memoryUsage: number;
}

export interface RenderTarget {
  renderTarget: THREE.WebGLRenderTarget;
  width: number;
  height: number;
  format: THREE.PixelFormat;
  type: THREE.TextureDataType;
}

// LOGIC SECTION
export abstract class BaseStage implements Stage {
  public id: string;
  public enabled: boolean = true;
  public priority: number = 0;
  
  protected scene!: THREE.Scene;
  protected renderer!: THREE.WebGLRenderer;
  protected camera!: THREE.Camera;
  protected metrics: StageMetrics = {
    renderTime: 0,
    triangleCount: 0,
    drawCalls: 0,
    memoryUsage: 0
  };

  constructor(id: string, priority: number = 0) {
    this.id = id;
    this.priority = priority;
  }

  public initialize(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.Camera): void {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.onInitialize();
  }

  public abstract render(deltaTime: number): void;
  protected abstract onInitialize(): void;

  public dispose(): void {
    this.enabled = false;
    this.onDispose();
  }

  protected onDispose(): void {}

  public getMetrics(): StageMetrics {
    return { ...this.metrics };
  }

  protected updateMetrics(renderTime: number): void {
    this.metrics.renderTime = renderTime;
    this.metrics.triangleCount = this.renderer.info.render.triangles;
    this.metrics.drawCalls = this.renderer.info.render.calls;
    this.metrics.memoryUsage = this.renderer.info.memory.geometries + this.renderer.info.memory.textures;
  }
}

export class StagesEngine {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.Camera;
  private stages: Map<string, Stage> = new Map();
  private config: StagesConfig;
  private performanceMonitor: PerformanceMonitor;
  private isInitialized: boolean = false;

  constructor(config: StagesConfig) {
    this.config = config;
    this.performanceMonitor = new PerformanceMonitor(config.performance);
  }

  /**
   * Initialize the stages engine
   */
  public initialize(canvas: HTMLCanvasElement): void {
    if (this.isInitialized) {
      console.warn('StagesEngine already initialized');
      return;
    }

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      ...this.config.renderer
    });

    // Configure renderer
    this.configureRenderer();

    // Create scene
    this.scene = new THREE.Scene();
    this.configureScene();

    // Create camera
    this.camera = this.createCamera();

    this.isInitialized = true;
  }

  /**
   * Add stage to the engine
   */
  public addStage(stage: Stage): void {
    if (!this.isInitialized) {
      throw new Error('StagesEngine must be initialized before adding stages');
    }

    this.stages.set(stage.id, stage);
    stage.initialize(this.scene, this.renderer, this.camera);
  }

  /**
   * Remove stage from engine
   */
  public removeStage(stageId: string): boolean {
    const stage = this.stages.get(stageId);
    if (!stage) return false;

    stage.dispose();
    this.stages.delete(stageId);
    return true;
  }

  /**
   * Render all stages
   */
  public render(deltaTime: number): void {
    if (!this.isInitialized) {
      console.warn('StagesEngine not initialized, skipping render');
      return;
    }

    const startTime = performance.now();

    // Clear renderer
    this.renderer.clear();

    // Sort stages by priority
    const sortedStages = Array.from(this.stages.values())
      .filter(stage => stage.enabled)
      .sort((a, b) => a.priority - b.priority);

    // Render each stage
    sortedStages.forEach(stage => {
      try {
        stage.render(deltaTime);
      } catch (error) {
        console.error(`Error rendering stage ${stage.id}:`, error);
      }
    });

    const renderTime = performance.now() - startTime;
    this.performanceMonitor.recordFrame(renderTime);
  }

  /**
   * Resize renderer and camera
   */
  public resize(width: number, height: number): void {
    if (!this.isInitialized) return;

    this.renderer.setSize(width, height, false);
    
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      const aspect = width / height;
      this.camera.left = -aspect;
      this.camera.right = aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Get all stages
   */
  public getAllStages(): Stage[] {
    return Array.from(this.stages.values());
  }

  /**
   * Get renderer reference
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get scene reference
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get camera reference
   */
  public getCamera(): THREE.Camera {
    return this.camera;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): any {
    return this.performanceMonitor.getMetrics();
  }

  private configureRenderer(): void {
    const { renderer: config } = this.config;
    
    // useLegacyLights is default false in modern Three.js versions
    // Legacy lights behavior is deprecated
    
    if (config.outputColorSpace) {
      this.renderer.outputColorSpace = config.outputColorSpace;
    }
    
    if (config.toneMapping) {
      this.renderer.toneMapping = config.toneMapping;
    }
    
    if (config.toneMappingExposure !== undefined) {
      this.renderer.toneMappingExposure = config.toneMappingExposure;
    }
    
    if (config.shadowMap) {
      this.renderer.shadowMap.enabled = config.shadowMap.enabled || false;
      if (config.shadowMap.type) {
        this.renderer.shadowMap.type = config.shadowMap.type;
      }
    }

    // Set pixel ratio
    const pixelRatio = Math.min(
      window.devicePixelRatio,
      this.config.performance?.maxPixelRatio || 2
    );
    this.renderer.setPixelRatio(pixelRatio);
  }

  private configureScene(): void {
    const { scene: config } = this.config;
    
    if (config.background) {
      this.scene.background = config.background;
    }
    
    if (config.environment) {
      this.scene.environment = config.environment;
    }
    
    if (config.fog) {
      this.scene.fog = config.fog;
    }
  }

  private createCamera(): THREE.Camera {
    const { camera: config } = this.config;
    
    if (config.type === 'perspective') {
      const camera = new THREE.PerspectiveCamera(
        config.fov || 75,
        config.aspect || 1,
        config.near || 0.1,
        config.far || 1000
      );
      
      if (config.position) {
        camera.position.copy(config.position);
      }
      
      if (config.target) {
        camera.lookAt(config.target);
      }
      
      return camera;
    } else {
      const camera = new THREE.OrthographicCamera(
        config.left || -1,
        config.right || 1,
        config.top || 1,
        config.bottom || -1,
        config.near || 0.1,
        config.far || 1000
      );
      
      if (config.position) {
        camera.position.copy(config.position);
      }
      
      if (config.target) {
        camera.lookAt(config.target);
      }
      
      return camera;
    }
  }
}

class PerformanceMonitor {
  private frameHistory: number[] = [];
  private maxFrames: number = 60;
  private config: PerformanceConfig | undefined;

  constructor(config?: PerformanceConfig) {
    this.config = config;
  }

  public recordFrame(renderTime: number): void {
    this.frameHistory.push(renderTime);
    
    if (this.frameHistory.length > this.maxFrames) {
      this.frameHistory.shift();
    }
  }

  public getMetrics(): any {
    if (this.frameHistory.length === 0) {
      return {
        averageFrameTime: 0,
        fps: 0,
        minFrameTime: 0,
        maxFrameTime: 0
      };
    }

    const averageFrameTime = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
    const fps = 1000 / averageFrameTime;
    const minFrameTime = Math.min(...this.frameHistory);
    const maxFrameTime = Math.max(...this.frameHistory);

    return {
      averageFrameTime,
      fps,
      minFrameTime,
      maxFrameTime,
      targetFPS: this.config?.targetFPS || 60
    };
  }
}

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export default StagesEngine;
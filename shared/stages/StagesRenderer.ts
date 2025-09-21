/**
 * Three.js renderer and scene management (PARENT - STABLE)
 * AI should not modify this file - modify child modules instead
 */

import * as THREE from "three";
import type { StageObject, RenderQuality } from "./StagesTypes";
import type { StagesLogic } from "./StagesLogic";
import { StagesRendererMesh } from "./StagesRendererMesh";
import { StagesRendererMaterial } from "./StagesRendererMaterial";

export class StagesRenderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private scene: THREE.Scene | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private animationId: number | null = null;
  private paused = false;

  private renderObjects = new Map<string, THREE.Object3D>();
  private logic: StagesLogic;
  private currentQuality: RenderQuality;

  // Stage dimensions from logic
  private STAGE_WIDTH = 2048;
  private STAGE_HEIGHT = 2048;

  // Child modules (AI can modify these)
  private meshFactory: StagesRendererMesh;
  private materialFactory: StagesRendererMaterial;

  constructor(logic: StagesLogic) {
    this.logic = logic;

    // Get stage dimensions from logic
    const dimensions = this.logic.getStats().transform.stageDimensions;
    if (dimensions) {
      this.STAGE_WIDTH = dimensions.width;
      this.STAGE_HEIGHT = dimensions.height;
    }
    this.currentQuality = {
      dpr: 1.5,
      antialias: true,
      shadows: false,
      textureScale: 1.0,
    };

    // Initialize child modules
    this.meshFactory = new StagesRendererMesh();
    this.materialFactory = new StagesRendererMaterial();
  }

  /**
   * Initialize Three.js renderer
   */
  async initialize(quality: RenderQuality): Promise<HTMLCanvasElement> {
    this.currentQuality = quality;

    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: quality.antialias,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });

    // Fixed stage dimensions from logic
    this.renderer.setSize(this.STAGE_WIDTH, this.STAGE_HEIGHT);
    this.renderer.setPixelRatio(quality.dpr);
    this.renderer.setClearColor(0x000000, 0);

    // Enable shadows if supported
    if (quality.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Create orthographic camera for 2D-style rendering
    this.camera = new THREE.OrthographicCamera(
      -this.STAGE_WIDTH / 2,
      this.STAGE_WIDTH / 2,
      this.STAGE_HEIGHT / 2,
      -this.STAGE_HEIGHT / 2,
      0.1,
      1000,
    );
    this.camera.position.z = 100;

    // Create scene
    this.scene = new THREE.Scene();

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(100, 100, 50);
    if (quality.shadows) {
      directionalLight.castShadow = true;
    }
    this.scene.add(directionalLight);

    this.canvas = this.renderer.domElement;

    // Handle visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });

    return this.canvas;
  }

  /**
   * Update render quality
   */
  updateQuality(quality: Partial<RenderQuality>): void {
    this.currentQuality = { ...this.currentQuality, ...quality };

    if (this.renderer) {
      this.renderer.setPixelRatio(this.currentQuality.dpr);

      // Update shadows
      if (this.currentQuality.shadows !== this.renderer.shadowMap.enabled) {
        this.renderer.shadowMap.enabled = this.currentQuality.shadows;
        this.renderer.shadowMap.needsUpdate = true;
      }
    }
  }

  /**
   * Add or update object in scene (delegated to mesh factory)
   */
  setRenderObject(object: StageObject): void {
    // Remove existing object
    const existing = this.renderObjects.get(object.id);
    if (existing) {
      this.scene?.remove(existing);
      this.meshFactory.disposeMesh(existing);
    }

    // Create new object using mesh factory
    const mesh = this.meshFactory.createFromObject(object);
    if (mesh) {
      this.renderObjects.set(object.id, mesh);
      this.scene?.add(mesh);
    }
  }

  /**
   * Update existing render object (delegated to mesh factory)
   */
  updateRenderObject(object: StageObject): void {
    const mesh = this.renderObjects.get(object.id);
    if (mesh) {
      this.meshFactory.updateFromObject(object, mesh);
    }
  }

  /**
   * Remove object from scene (delegated to mesh factory)
   */
  removeRenderObject(id: string): void {
    const mesh = this.renderObjects.get(id);
    if (mesh) {
      this.scene?.remove(mesh);
      this.meshFactory.disposeMesh(mesh);
      this.renderObjects.delete(id);
    }
  }

  /**
   * Start render loop
   */
  start(): void {
    if (this.animationId) return;

    const render = () => {
      if (!this.paused && this.renderer && this.scene && this.camera) {
        this.logic.trackRenderCall();
        this.renderer.render(this.scene, this.camera);
      }

      this.logic.updatePerformance();
      this.animationId = requestAnimationFrame(render);
    };

    render();
  }

  /**
   * Pause rendering
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume rendering
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * Stop rendering
   */
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Get Three.js scene
   */
  getScene(): THREE.Scene | null {
    return this.scene;
  }

  /**
   * Get Three.js camera
   */
  getCamera(): THREE.Camera | null {
    return this.camera;
  }

  /**
   * Get Three.js renderer
   */
  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  /**
   * Get canvas element
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Dispose renderer resources
   */
  dispose(): void {
    this.stop();

    // Dispose all render objects using mesh factory
    for (const [_id, mesh] of this.renderObjects) {
      this.meshFactory.disposeMesh(mesh);
    }
    this.renderObjects.clear();

    // Dispose child modules
    this.materialFactory.dispose();
    this.meshFactory.clearCache();

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.camera = null;
    this.scene = null;
    this.canvas = null;
  }

  /**
   * Get render statistics
   */
  getStats() {
    return {
      renderObjects: this.renderObjects.size,
      paused: this.paused,
      quality: this.currentQuality,
      meshFactory: this.meshFactory.getStats(),
      materialFactory: this.materialFactory.getStats(),
    };
  }
}

// IMPORT SECTION
import * as THREE from 'three';
import { BaseStage, StagesEngine, type Stage, type StageMetrics } from './EngineStages-Parent.js';

// STYLE SECTION (unused)

// STATE SECTION
export interface SpriteStageConfig {
  textureUrls: string[];
  maxSprites: number;
  enableBatching: boolean;
}

export interface MeshStageConfig {
  geometryType: 'box' | 'sphere' | 'plane' | 'cylinder';
  materialType: 'basic' | 'standard' | 'phong';
  enableShadows: boolean;
}

export interface LightingStageConfig {
  ambientColor: number;
  ambientIntensity: number;
  directionalColor: number;
  directionalIntensity: number;
  directionalPosition: THREE.Vector3;
  enableShadows: boolean;
}

export interface PostProcessingStageConfig {
  enableBloom: boolean;
  enableSSAO: boolean;
  enableToneMapping: boolean;
}

export interface SpriteObject {
  id: string;
  sprite: THREE.Sprite;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: number;
  visible: boolean;
  textureUrl: string;
}

export interface MeshObject {
  id: string;
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  visible: boolean;
}

// LOGIC SECTION
export class SpriteStage extends BaseStage {
  private sprites: Map<string, SpriteObject> = new Map();
  private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
  private textureCache: Map<string, THREE.Texture> = new Map();
  private config: SpriteStageConfig;
  private group: THREE.Group = new THREE.Group();

  constructor(id: string, config: SpriteStageConfig, priority: number = 0) {
    super(id, priority);
    this.config = config;
  }

  protected onInitialize(): void {
    this.scene.add(this.group);
    
    // Preload textures
    this.config.textureUrls.forEach(url => {
      this.loadTexture(url);
    });
  }

  /**
   * Create sprite with texture
   */
  public createSprite(id: string, textureUrl: string, position?: THREE.Vector3, scale?: THREE.Vector3): boolean {
    if (this.sprites.has(id)) {
      console.warn(`Sprite ${id} already exists`);
      return false;
    }

    if (this.sprites.size >= this.config.maxSprites) {
      console.warn(`Maximum sprites limit reached (${this.config.maxSprites})`);
      return false;
    }

    const texture = this.getTexture(textureUrl);
    if (!texture) {
      console.error(`Failed to load texture: ${textureUrl}`);
      return false;
    }

    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      alphaTest: 0.001
    });
    
    const sprite = new THREE.Sprite(material);
    
    if (position) {
      sprite.position.copy(position);
    }
    
    if (scale) {
      sprite.scale.copy(scale);
    }

    const spriteObject: SpriteObject = {
      id,
      sprite,
      position: sprite.position.clone(),
      scale: sprite.scale.clone(),
      rotation: 0,
      visible: true,
      textureUrl
    };

    this.sprites.set(id, spriteObject);
    this.group.add(sprite);

    return true;
  }

  /**
   * Update sprite properties
   */
  public updateSprite(id: string, updates: Partial<SpriteObject>): boolean {
    const spriteObj = this.sprites.get(id);
    if (!spriteObj) return false;

    if (updates.position) {
      spriteObj.sprite.position.copy(updates.position);
      spriteObj.position.copy(updates.position);
    }

    if (updates.scale) {
      spriteObj.sprite.scale.copy(updates.scale);
      spriteObj.scale.copy(updates.scale);
    }

    if (updates.rotation !== undefined) {
      spriteObj.sprite.material.rotation = updates.rotation;
      spriteObj.rotation = updates.rotation;
    }

    if (updates.visible !== undefined) {
      spriteObj.sprite.visible = updates.visible;
      spriteObj.visible = updates.visible;
    }

    if (updates.textureUrl && updates.textureUrl !== spriteObj.textureUrl) {
      const newTexture = this.getTexture(updates.textureUrl);
      if (newTexture) {
        (spriteObj.sprite.material as THREE.SpriteMaterial).map = newTexture;
        spriteObj.textureUrl = updates.textureUrl;
      }
    }

    return true;
  }

  /**
   * Remove sprite
   */
  public removeSprite(id: string): boolean {
    const spriteObj = this.sprites.get(id);
    if (!spriteObj) return false;

    this.group.remove(spriteObj.sprite);
    spriteObj.sprite.material.dispose();
    this.sprites.delete(id);

    return true;
  }

  /**
   * Get sprite by ID
   */
  public getSprite(id: string): SpriteObject | undefined {
    return this.sprites.get(id);
  }

  /**
   * Get all sprites
   */
  public getAllSprites(): SpriteObject[] {
    return Array.from(this.sprites.values());
  }

  public override render(deltaTime: number): void {
    if (!this.enabled) return;

    const startTime = performance.now();
    
    // Update sprite materials if needed
    this.sprites.forEach(spriteObj => {
      if (spriteObj.visible && spriteObj.sprite.material.needsUpdate) {
        spriteObj.sprite.material.needsUpdate = false;
      }
    });

    const renderTime = performance.now() - startTime;
    this.updateMetrics(renderTime);
  }

  protected override onDispose(): void {
    // Clean up sprites
    this.sprites.forEach(spriteObj => {
      this.group.remove(spriteObj.sprite);
      spriteObj.sprite.material.dispose();
    });
    this.sprites.clear();

    // Clean up textures
    this.textureCache.forEach(texture => {
      texture.dispose();
    });
    this.textureCache.clear();

    // Remove group from scene
    this.scene.remove(this.group);
  }

  private loadTexture(url: string): THREE.Texture | null {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!;
    }

    try {
      const texture = this.textureLoader.load(url);
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      
      this.textureCache.set(url, texture);
      return texture;
    } catch (error) {
      console.error(`Failed to load texture ${url}:`, error);
      return null;
    }
  }

  private getTexture(url: string): THREE.Texture | null {
    return this.textureCache.get(url) || this.loadTexture(url);
  }
}

export class MeshStage extends BaseStage {
  private meshes: Map<string, MeshObject> = new Map();
  private config: MeshStageConfig;
  private group: THREE.Group = new THREE.Group();

  constructor(id: string, config: MeshStageConfig, priority: number = 1) {
    super(id, priority);
    this.config = config;
  }

  protected onInitialize(): void {
    this.scene.add(this.group);
  }

  /**
   * Create mesh with geometry and material
   */
  public createMesh(id: string, geometryConfig?: any, materialConfig?: any): boolean {
    if (this.meshes.has(id)) {
      console.warn(`Mesh ${id} already exists`);
      return false;
    }

    const geometry = this.createGeometry(geometryConfig);
    const material = this.createMaterial(materialConfig);
    const mesh = new THREE.Mesh(geometry, material);

    if (this.config.enableShadows) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    const meshObject: MeshObject = {
      id,
      mesh,
      geometry,
      material,
      position: mesh.position.clone(),
      rotation: mesh.rotation.clone(),
      scale: mesh.scale.clone(),
      visible: true
    };

    this.meshes.set(id, meshObject);
    this.group.add(mesh);

    return true;
  }

  /**
   * Update mesh properties
   */
  public updateMesh(id: string, updates: Partial<MeshObject>): boolean {
    const meshObj = this.meshes.get(id);
    if (!meshObj) return false;

    if (updates.position) {
      meshObj.mesh.position.copy(updates.position);
      meshObj.position.copy(updates.position);
    }

    if (updates.rotation) {
      meshObj.mesh.rotation.copy(updates.rotation);
      meshObj.rotation.copy(updates.rotation);
    }

    if (updates.scale) {
      meshObj.mesh.scale.copy(updates.scale);
      meshObj.scale.copy(updates.scale);
    }

    if (updates.visible !== undefined) {
      meshObj.mesh.visible = updates.visible;
      meshObj.visible = updates.visible;
    }

    return true;
  }

  /**
   * Remove mesh
   */
  public removeMesh(id: string): boolean {
    const meshObj = this.meshes.get(id);
    if (!meshObj) return false;

    this.group.remove(meshObj.mesh);
    meshObj.geometry.dispose();
    if (Array.isArray(meshObj.material)) {
      meshObj.material.forEach(mat => mat.dispose());
    } else {
      meshObj.material.dispose();
    }
    this.meshes.delete(id);

    return true;
  }

  public override render(deltaTime: number): void {
    if (!this.enabled) return;

    const startTime = performance.now();
    
    // Update mesh transforms if needed
    this.meshes.forEach(meshObj => {
      if (meshObj.visible) {
        meshObj.mesh.updateMatrixWorld();
      }
    });

    const renderTime = performance.now() - startTime;
    this.updateMetrics(renderTime);
  }

  protected override onDispose(): void {
    // Clean up meshes
    this.meshes.forEach(meshObj => {
      this.group.remove(meshObj.mesh);
      meshObj.geometry.dispose();
      if (Array.isArray(meshObj.material)) {
        meshObj.material.forEach(mat => mat.dispose());
      } else {
        meshObj.material.dispose();
      }
    });
    this.meshes.clear();

    // Remove group from scene
    this.scene.remove(this.group);
  }

  private createGeometry(config: any = {}): THREE.BufferGeometry {
    switch (this.config.geometryType) {
      case 'box':
        return new THREE.BoxGeometry(
          config.width || 1,
          config.height || 1,
          config.depth || 1
        );
      case 'sphere':
        return new THREE.SphereGeometry(
          config.radius || 1,
          config.widthSegments || 32,
          config.heightSegments || 32
        );
      case 'plane':
        return new THREE.PlaneGeometry(
          config.width || 1,
          config.height || 1
        );
      case 'cylinder':
        return new THREE.CylinderGeometry(
          config.radiusTop || 1,
          config.radiusBottom || 1,
          config.height || 1,
          config.radialSegments || 32
        );
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  private createMaterial(config: any = {}): THREE.Material {
    const materialConfig = {
      color: config.color || 0xffffff,
      transparent: config.transparent || false,
      opacity: config.opacity || 1,
      ...config
    };

    switch (this.config.materialType) {
      case 'basic':
        return new THREE.MeshBasicMaterial(materialConfig);
      case 'standard':
        return new THREE.MeshStandardMaterial({
          ...materialConfig,
          roughness: config.roughness || 0.5,
          metalness: config.metalness || 0
        });
      case 'phong':
        return new THREE.MeshPhongMaterial({
          ...materialConfig,
          shininess: config.shininess || 30
        });
      default:
        return new THREE.MeshBasicMaterial(materialConfig);
    }
  }
}

export class LightingStage extends BaseStage {
  private lights: Map<string, THREE.Light> = new Map();
  private config: LightingStageConfig;
  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;

  constructor(id: string, config: LightingStageConfig, priority: number = -1) {
    super(id, priority);
    this.config = config;
  }

  protected onInitialize(): void {
    // Create ambient light
    this.ambientLight = new THREE.AmbientLight(
      this.config.ambientColor,
      this.config.ambientIntensity
    );
    this.scene.add(this.ambientLight);
    this.lights.set('ambient', this.ambientLight);

    // Create directional light
    this.directionalLight = new THREE.DirectionalLight(
      this.config.directionalColor,
      this.config.directionalIntensity
    );
    this.directionalLight.position.copy(this.config.directionalPosition);
    
    if (this.config.enableShadows) {
      this.directionalLight.castShadow = true;
      this.directionalLight.shadow.mapSize.width = 2048;
      this.directionalLight.shadow.mapSize.height = 2048;
      this.directionalLight.shadow.camera.near = 0.5;
      this.directionalLight.shadow.camera.far = 50;
    }
    
    this.scene.add(this.directionalLight);
    this.lights.set('directional', this.directionalLight);
  }

  /**
   * Add point light
   */
  public addPointLight(id: string, color: number, intensity: number, position: THREE.Vector3, distance?: number): boolean {
    if (this.lights.has(id)) {
      console.warn(`Light ${id} already exists`);
      return false;
    }

    const light = new THREE.PointLight(color, intensity, distance);
    light.position.copy(position);
    
    this.scene.add(light);
    this.lights.set(id, light);

    return true;
  }

  /**
   * Update light properties
   */
  public updateLight(id: string, updates: any): boolean {
    const light = this.lights.get(id);
    if (!light) return false;

    if (updates.color !== undefined) {
      light.color.setHex(updates.color);
    }

    if (updates.intensity !== undefined) {
      light.intensity = updates.intensity;
    }

    if (updates.position) {
      light.position.copy(updates.position);
    }

    return true;
  }

  /**
   * Remove light
   */
  public removeLight(id: string): boolean {
    const light = this.lights.get(id);
    if (!light || id === 'ambient' || id === 'directional') {
      return false; // Can't remove main lights
    }

    this.scene.remove(light);
    this.lights.delete(id);

    return true;
  }

  public override render(deltaTime: number): void {
    if (!this.enabled) return;

    const startTime = performance.now();
    
    // Update light properties if needed
    // Lights don't typically need per-frame updates
    
    const renderTime = performance.now() - startTime;
    this.updateMetrics(renderTime);
  }

  protected override onDispose(): void {
    // Remove all lights
    this.lights.forEach((light, id) => {
      this.scene.remove(light);
    });
    this.lights.clear();
  }
}

export class PostProcessingStage extends BaseStage {
  private config: PostProcessingStageConfig;
  private renderTarget!: THREE.WebGLRenderTarget;

  constructor(id: string, config: PostProcessingStageConfig, priority: number = 100) {
    super(id, priority);
    this.config = config;
  }

  protected onInitialize(): void {
    // Create render target for post-processing
    this.renderTarget = new THREE.WebGLRenderTarget(
      this.renderer.getSize(new THREE.Vector2()).x,
      this.renderer.getSize(new THREE.Vector2()).y
    );
  }

  public override render(deltaTime: number): void {
    if (!this.enabled) return;

    const startTime = performance.now();
    
    // Post-processing effects would be implemented here
    // This is a placeholder for bloom, SSAO, tone mapping, etc.
    
    const renderTime = performance.now() - startTime;
    this.updateMetrics(renderTime);
  }

  protected override onDispose(): void {
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
  }

  /**
   * Resize render target
   */
  public resize(width: number, height: number): void {
    if (this.renderTarget) {
      this.renderTarget.setSize(width, height);
    }
  }
}

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export { SpriteStage as default };
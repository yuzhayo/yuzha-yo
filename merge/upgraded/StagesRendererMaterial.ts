/**
 * Material creation and management - Child of StagesRenderer
 * AI can modify this file to add new materials and visual effects
 */

import * as THREE from "three";

export class StagesRendererMaterial {
  private materialCache = new Map<string, THREE.Material>();
  private textureCache = new Map<string, THREE.Texture>();
  private textureLoader = new THREE.TextureLoader();

  /**
   * Create material based on type and configuration
   * AI can extend this method for new material types
   */
  createMaterial(type: string, config: any = {}): THREE.Material {
    const cacheKey = this.getCacheKey(type, config);

    // Return cached material if available
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey)!.clone();
    }

    let material: THREE.Material;

    switch (type) {
      case "basic":
        material = this.createBasicMaterial(config);
        break;
      case "lambert":
        material = this.createLambertMaterial(config);
        break;
      case "phong":
        material = this.createPhongMaterial(config);
        break;
      case "glow":
        material = this.createGlowMaterial(config);
        break;
      case "water":
        material = this.createWaterMaterial(config);
        break;
      case "glass":
        material = this.createGlassMaterial(config);
        break;
      case "metal":
        material = this.createMetalMaterial(config);
        break;
      case "fire":
        material = this.createFireMaterial(config);
        break;
      case "ice":
        material = this.createIceMaterial(config);
        break;
      case "particle":
        material = this.createParticleMaterial(config);
        break;
      default:
        material = this.createDefaultMaterial(config);
    }

    // Cache the material
    this.materialCache.set(cacheKey, material);
    return material.clone();
  }

  /**
   * Create basic material
   */
  private createBasicMaterial(config: any): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: config.color || 0xffffff,
      transparent: config.transparent || false,
      opacity: config.opacity || 1.0,
      side: config.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      map: config.texture ? this.loadTexture(config.texture) : null,
    });
  }

  /**
   * Create lambert material (good for performance)
   */
  private createLambertMaterial(config: any): THREE.MeshLambertMaterial {
    return new THREE.MeshLambertMaterial({
      color: config.color || 0xffffff,
      transparent: config.transparent || false,
      opacity: config.opacity || 1.0,
      side: config.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      map: config.texture ? this.loadTexture(config.texture) : null,
      emissive: config.emissive || 0x000000,
    });
  }

  /**
   * Create phong material (more realistic lighting)
   */
  private createPhongMaterial(config: any): THREE.MeshPhongMaterial {
    return new THREE.MeshPhongMaterial({
      color: config.color || 0xffffff,
      transparent: config.transparent || false,
      opacity: config.opacity || 1.0,
      side: config.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      map: config.texture ? this.loadTexture(config.texture) : null,
      emissive: config.emissive || 0x000000,
      specular: config.specular || 0x111111,
      shininess: config.shininess || 30,
    });
  }

  /**
   * Create glowing material
   * AI can enhance this for special effects
   */
  private createGlowMaterial(config: any): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: config.color || 0x00ffff,
      transparent: true,
      opacity: config.opacity || 0.8,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Create water material
   * AI can add wave animations and reflections
   */
  private createWaterMaterial(config: any): THREE.MeshPhongMaterial {
    const material = new THREE.MeshPhongMaterial({
      color: config.color || 0x006994,
      transparent: true,
      opacity: config.opacity || 0.7,
      shininess: 100,
      specular: 0x222222,
    });

    // AI can add water normal map, wave animation
    // material.normalMap = this.loadTexture('water-normal.jpg')

    return material;
  }

  /**
   * Create glass material
   */
  private createGlassMaterial(config: any): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: config.color || 0xffffff,
      transparent: true,
      opacity: config.opacity || 0.1,
      roughness: config.roughness || 0.1,
      metalness: 0,
      transmission: 0.9,
      ior: 1.5,
    });
  }

  /**
   * Create metal material
   */
  private createMetalMaterial(config: any): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: config.color || 0x888888,
      metalness: config.metalness || 1.0,
      roughness: config.roughness || 0.3,
      envMapIntensity: 1.0,
    });
  }

  /**
   * Create fire material (animated)
   * AI can add flame animation and particle effects
   */
  private createFireMaterial(config: any): THREE.MeshBasicMaterial {
    const material = new THREE.MeshBasicMaterial({
      color: config.color || 0xff4400,
      transparent: true,
      opacity: config.opacity || 0.8,
      side: THREE.DoubleSide,
    });

    // AI can add fire texture animation here
    // this.animateFireTexture(material)

    return material;
  }

  /**
   * Create ice material
   */
  private createIceMaterial(config: any): THREE.MeshPhongMaterial {
    return new THREE.MeshPhongMaterial({
      color: config.color || 0xaaccff,
      transparent: true,
      opacity: config.opacity || 0.8,
      shininess: 100,
      specular: 0x444444,
    });
  }

  /**
   * Create particle material
   */
  private createParticleMaterial(config: any): THREE.PointsMaterial {
    return new THREE.PointsMaterial({
      color: config.color || 0xffffff,
      size: config.size || 5,
      transparent: true,
      opacity: config.opacity || 0.8,
      alphaTest: 0.5,
      vertexColors: config.vertexColors || false,
    });
  }

  /**
   * Create default material
   */
  private createDefaultMaterial(config: any): THREE.MeshLambertMaterial {
    return new THREE.MeshLambertMaterial({
      color: config.color || 0x888888,
      transparent: config.transparent || false,
      opacity: config.opacity || 1.0,
    });
  }

  /**
   * Load and cache texture
   */
  private loadTexture(url: string): THREE.Texture {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!;
    }

    const texture = this.textureLoader.load(url);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    this.textureCache.set(url, texture);
    return texture;
  }

  /**
   * Generate cache key for material
   */
  private getCacheKey(type: string, config: any): string {
    return `${type}_${JSON.stringify(config)}`;
  }

  /**
   * Update material properties
   * AI can add dynamic material property updates
   */
  updateMaterialProperties(material: THREE.Material, updates: any): void {
    Object.keys(updates).forEach((key) => {
      if (key in material) {
        (material as any)[key] = updates[key];
      }
    });

    material.needsUpdate = true;
  }

  /**
   * Create animated material
   * AI can add time-based material animations
   */
  createAnimatedMaterial(type: string, config: any, animationConfig: any): THREE.Material {
    const material = this.createMaterial(type, config);

    // AI can add animation logic here
    if (animationConfig.type === "color-cycle") {
      this.animateColorCycle(material, animationConfig);
    }

    return material;
  }

  /**
   * Animate color cycling
   */
  private animateColorCycle(material: THREE.Material, config: any): void {
    const animate = () => {
      if ("color" in material) {
        const time = Date.now() * 0.001;
        const hue = (time * config.speed || 0.5) % 1;
        (material as any).color.setHSL(hue, config.saturation || 1, config.lightness || 0.5);
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Create material from metadata
   * AI can enhance this to interpret complex material descriptions
   */
  createFromMetadata(metadata: any): THREE.Material {
    const materialType = metadata.materialType || "lambert";

    const config = {
      color: metadata.color,
      texture: metadata.texture,
      transparent: metadata.alpha !== undefined && metadata.alpha < 1,
      opacity: metadata.alpha || 1,
      emissive: metadata.emissive,
      roughness: metadata.roughness,
      metalness: metadata.metalness,
    };

    return this.createMaterial(materialType, config);
  }

  /**
   * Dispose cached materials and textures
   */
  dispose(): void {
    // Dispose materials
    for (const material of this.materialCache.values()) {
      material.dispose();
    }
    this.materialCache.clear();

    // Dispose textures
    for (const texture of this.textureCache.values()) {
      texture.dispose();
    }
    this.textureCache.clear();
  }

  /**
   * Get material statistics
   */
  getStats() {
    return {
      cachedMaterials: this.materialCache.size,
      cachedTextures: this.textureCache.size,
    };
  }
}

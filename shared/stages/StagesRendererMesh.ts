/**
 * Mesh creation logic - Child of StagesRenderer
 * AI can modify this file to add new mesh types and object rendering
 */

import * as THREE from "three";
import type { StageObject } from "./StagesTypes";

export class StagesRendererMesh {
  private meshCache = new Map<string, THREE.Object3D>();
  private textureLoader = new THREE.TextureLoader();

  /**
   * Create mesh from stage object
   * AI can extend this method for new object types
   */
  createFromObject(object: StageObject): THREE.Object3D | null {
    const { metadata } = object;

    if (!metadata || !metadata.type) {
      return this.createDefaultMesh(object);
    }

    switch (metadata.type) {
      case "sprite":
        return this.createSprite(object);
      case "circle":
        return this.createCircle(object);
      case "rectangle":
        return this.createRectangle(object);
      case "line":
        return this.createLine(object);
      case "text":
        return this.createText(object);
      case "clock":
        return this.createClock(object);
      case "weather":
        return this.createWeather(object);
      case "character":
        return this.createCharacter(object);
      case "particle":
        return this.createParticle(object);
      default:
        return this.createDefaultMesh(object);
    }
  }

  /**
   * Update existing mesh from object
   */
  updateFromObject(object: StageObject, mesh: THREE.Object3D): void {
    // Update position (convert stage coordinates to world coordinates)
    const [x, y, z = 0] = object.position;
    mesh.position.set(x - 1024, -(y - 1024), z); // Center at 0,0

    // Update rotation
    if (typeof object.rotation === "number") {
      mesh.rotation.z = object.rotation;
    } else if (Array.isArray(object.rotation)) {
      const [rx, ry, rz] = object.rotation;
      mesh.rotation.set(rx, ry, rz);
    }

    // Update scale
    if (typeof object.scale === "number") {
      mesh.scale.setScalar(object.scale);
    } else if (Array.isArray(object.scale)) {
      const [sx, sy, sz] = object.scale;
      mesh.scale.set(sx, sy, sz);
    }

    // Update visibility
    mesh.visible = object.visible !== false;

    // Update material properties if they changed
    this.updateMaterialFromMetadata(mesh, object.metadata);
  }

  /**
   * Create sprite mesh
   */
  private createSprite(object: StageObject): THREE.Mesh {
    const { metadata } = object;
    if (!metadata) {
      return this.createDefaultMesh(object);
    }

    const width = metadata.width || 100;
    const height = metadata.height || 100;

    const geometry = new THREE.PlaneGeometry(width, height);

    let material: THREE.Material;
    if (metadata.texture) {
      const texture = this.textureLoader.load(metadata.texture);
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;

      material = new THREE.MeshLambertMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
      });
    } else {
      material = new THREE.MeshLambertMaterial({
        color: metadata.color || 0xffffff,
        transparent: metadata.alpha !== undefined,
        opacity: metadata.alpha || 1,
      });
    }

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create circle mesh
   */
  private createCircle(object: StageObject): THREE.Mesh {
    const { metadata } = object;
    if (!metadata) {
      return this.createDefaultMesh(object);
    }

    const radius = metadata.radius || 50;

    const geometry = new THREE.CircleGeometry(radius, 32);
    const material = new THREE.MeshLambertMaterial({
      color: metadata.color || 0xffffff,
      transparent: metadata.alpha !== undefined,
      opacity: metadata.alpha || 1,
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create rectangle mesh
   */
  private createRectangle(object: StageObject): THREE.Mesh {
    const { metadata } = object;
    if (!metadata) {
      return this.createDefaultMesh(object);
    }

    const width = metadata.width || 100;
    const height = metadata.height || 100;

    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshLambertMaterial({
      color: metadata.color || 0xffffff,
      transparent: metadata.alpha !== undefined,
      opacity: metadata.alpha || 1,
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create line mesh
   */
  private createLine(object: StageObject): THREE.Line {
    const { metadata } = object;
    if (!metadata) {
      // Default line with basic points
      const points = [
        [0, 0],
        [100, 100],
      ];
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array(points.length * 3);

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (point && point.length >= 2) {
          vertices[i * 3] = point[0] || 0;
          vertices[i * 3 + 1] = point[1] || 0;
          vertices[i * 3 + 2] = 0;
        }
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 1,
      });
      return new THREE.Line(geometry, material);
    }

    const points = metadata.points || [
      [0, 0],
      [100, 100],
    ];

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(points.length * 3);

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (point && point.length >= 2) {
        vertices[i * 3] = point[0] || 0;
        vertices[i * 3 + 1] = point[1] || 0;
        vertices[i * 3 + 2] = 0;
      }
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.LineBasicMaterial({
      color: metadata.color || 0xffffff,
      linewidth: metadata.lineWidth || 1,
    });

    return new THREE.Line(geometry, material);
  }

  /**
   * Create text mesh (placeholder - AI can enhance with proper text rendering)
   */
  private createText(object: StageObject): THREE.Mesh {
    const { metadata } = object;
    if (!metadata) {
      return this.createDefaultMesh(object);
    }

    // Placeholder: create a rectangle representing text bounds
    const width = metadata.width || 200;
    const height = metadata.height || 50;

    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshLambertMaterial({
      color: metadata.color || 0xffffff,
      transparent: true,
      opacity: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // AI can add proper text rendering here using libraries like:
    // - troika-three-text
    // - three-bmfont-text
    // - Canvas texture with text

    return mesh;
  }

  /**
   * Create clock mesh - AI can enhance this
   */
  private createClock(object: StageObject): THREE.Group {
    const { metadata } = object;
    if (!metadata) {
      return new THREE.Group();
    }

    const group = new THREE.Group();

    // Clock face
    const faceGeometry = new THREE.CircleGeometry(metadata.radius || 100, 32);
    const faceMaterial = new THREE.MeshLambertMaterial({
      color: metadata.faceColor || 0xffffff,
      side: THREE.DoubleSide,
    });
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    group.add(face);

    // Clock hands - AI can add hour, minute, second hands
    if (metadata.showHands) {
      const handGeometry = new THREE.PlaneGeometry(2, metadata.handLength || 80);
      const handMaterial = new THREE.MeshLambertMaterial({
        color: metadata.handColor || 0x000000,
      });
      const hand = new THREE.Mesh(handGeometry, handMaterial);
      hand.position.y = (metadata.handLength || 80) / 2;
      group.add(hand);
    }

    return group;
  }

  /**
   * Create weather effects - AI can add rain, snow, clouds
   */
  private createWeather(object: StageObject): THREE.Group {
    const { metadata } = object;
    const group = new THREE.Group();

    if (!metadata) {
      return group;
    }

    if (metadata.weather === "rain") {
      // Create rain particles
      const particleCount = metadata.particleCount || 100;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 2000;
        positions[i * 3 + 1] = Math.random() * 2000;
        positions[i * 3 + 2] = 0;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0x87ceeb,
        size: 2,
        transparent: true,
        opacity: 0.6,
      });

      const rain = new THREE.Points(geometry, material);
      group.add(rain);
    }

    return group;
  }

  /**
   * Create character mesh - AI can enhance for game characters
   */
  private createCharacter(object: StageObject): THREE.Group {
    const { metadata } = object;
    const group = new THREE.Group();

    if (!metadata) {
      return group;
    }

    // Character body
    const bodyGeometry = new THREE.CapsuleGeometry(metadata.radius || 20, metadata.height || 100);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: metadata.color || 0x8b4513, // Brown
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // Character head
    const headGeometry = new THREE.SphereGeometry(metadata.headRadius || 15);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: metadata.headColor || 0xffdbac, // Skin tone
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = (metadata.height || 100) / 2 + 15;
    group.add(head);

    // AI can add arms, legs, clothing, animations

    return group;
  }

  /**
   * Create particle system - AI can enhance for different effects
   */
  private createParticle(object: StageObject): THREE.Points {
    const { metadata } = object;
    if (!metadata) {
      // Default particle system
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(50 * 3);
      const colors = new Float32Array(50 * 3);

      for (let i = 0; i < 50; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

        colors[i * 3] = Math.random();
        colors[i * 3 + 1] = Math.random();
        colors[i * 3 + 2] = Math.random();
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
      });

      return new THREE.Points(geometry, material);
    }

    const particleCount = metadata.count || 50;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Random positions in a sphere
      const radius = metadata.radius || 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random colors
      colors[i * 3] = Math.random();
      colors[i * 3 + 1] = Math.random();
      colors[i * 3 + 2] = Math.random();
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: metadata.size || 5,
      vertexColors: true,
      transparent: true,
      opacity: metadata.opacity || 0.8,
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Create default mesh for unknown types
   */
  private createDefaultMesh(_object: StageObject): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(50, 50, 10);
    const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Update material properties based on metadata
   */
  private updateMaterialFromMetadata(mesh: THREE.Object3D, metadata: any): void {
    if (!metadata) return;

    mesh.traverse((child) => {
      if ("material" in child && child.material) {
        const material = child.material as THREE.Material;

        // Update color if it's a colored material
        if ("color" in material && metadata.color !== undefined) {
          (material as any).color.setHex(metadata.color);
        }

        // Update opacity
        if ("opacity" in material && metadata.alpha !== undefined) {
          (material as any).opacity = metadata.alpha;
          material.transparent = metadata.alpha < 1;
        }

        // Update visibility
        if (metadata.visible !== undefined) {
          material.visible = metadata.visible;
        }
      }
    });
  }

  /**
   * Dispose mesh and its resources
   */
  disposeMesh(mesh: THREE.Object3D): void {
    mesh.traverse((child) => {
      if ("geometry" in child && child.geometry) {
        const geometry = child.geometry as THREE.BufferGeometry;
        if (geometry && typeof geometry.dispose === "function") {
          geometry.dispose();
        }
      }

      if ("material" in child && child.material) {
        const material = child.material as THREE.Material | THREE.Material[];
        if (Array.isArray(material)) {
          material.forEach((mat) => {
            if (mat && typeof mat.dispose === "function") {
              mat.dispose();
            }
          });
        } else if (material && typeof material.dispose === "function") {
          material.dispose();
        }
      }
    });
  }

  /**
   * Get mesh creation statistics
   */
  getStats() {
    return {
      cachedMeshes: this.meshCache.size,
      // AI can add more stats here
    };
  }

  /**
   * Clear mesh cache
   */
  clearCache(): void {
    for (const [_id, mesh] of this.meshCache) {
      this.disposeMesh(mesh);
    }
    this.meshCache.clear();
  }
}

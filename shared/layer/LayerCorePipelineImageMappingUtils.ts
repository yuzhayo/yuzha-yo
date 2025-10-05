/**
 * Image Mapping Visual Debug Utilities
 * Helper functions to visualize imageTip, imageBase, and imageCenter points
 * Helps debug image orientation and axis alignment issues
 */

export type ImageCenterMarker = {
  type: "dot" | "crosshair";
  position: { x: number; y: number };
  size: number;
  color: string;
};

export type ImageTipMarker = {
  type: "circle" | "arrow";
  position: { x: number; y: number };
  size: number;
  color: string;
  label?: string;
};

export type ImageBaseMarker = {
  type: "circle" | "square";
  position: { x: number; y: number };
  size: number;
  color: string;
  label?: string;
};

export type ImageAxisLine = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness: number;
  color: string;
  opacity: number;
  label?: string;
};

export type ImageRotationIndicator = {
  center: { x: number; y: number };
  radius: number;
  startAngle: number; // In degrees
  endAngle: number; // In degrees
  color: string;
  opacity: number;
};

export type ImageMappingDebugVisuals = {
  centerMarker?: ImageCenterMarker;
  tipMarker?: ImageTipMarker;
  baseMarker?: ImageBaseMarker;
  axisLine?: ImageAxisLine;
  rotationIndicator?: ImageRotationIndicator;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    opacity: number;
  };
};

export type ImageMappingDebugConfig = {
  showCenter?: boolean;
  showTip?: boolean;
  showBase?: boolean;
  showAxisLine?: boolean;
  showRotation?: boolean;
  showBoundingBox?: boolean;
  centerStyle?: "dot" | "crosshair";
  tipStyle?: "circle" | "arrow";
  baseStyle?: "circle" | "square";
  colors?: {
    center?: string;
    tip?: string;
    base?: string;
    axisLine?: string;
    rotation?: string;
    boundingBox?: string;
  };
};

type ResolvedImageMappingDebugConfig = {
  showCenter: boolean;
  showTip: boolean;
  showBase: boolean;
  showAxisLine: boolean;
  showRotation: boolean;
  showBoundingBox: boolean;
  centerStyle: "dot" | "crosshair";
  tipStyle: "circle" | "arrow";
  baseStyle: "circle" | "square";
  colors: {
    center: string;
    tip: string;
    base: string;
    axisLine: string;
    rotation: string;
    boundingBox: string;
  };
};

const DEFAULT_CONFIG: ResolvedImageMappingDebugConfig = {
  showCenter: true,
  showTip: true,
  showBase: true,
  showAxisLine: true,
  showRotation: false, // Optional - can be noisy
  showBoundingBox: false, // Optional - for advanced debugging
  centerStyle: "crosshair",
  tipStyle: "circle",
  baseStyle: "circle",
  colors: {
    center: "#FF0000", // Red - imageCenter
    tip: "#00FF00", // Green - imageTip
    base: "#0000FF", // Blue - imageBase
    axisLine: "#FFFF00", // Yellow - axis line
    rotation: "#00FFFF", // Cyan - rotation indicator
    boundingBox: "#FF00FF", // Magenta - bounding box
  },
};

/**
 * Generate image center marker visualization data
 */
export function generateImageCenterMarker(
  imageCenter: { x: number; y: number },
  config?: Partial<ImageMappingDebugConfig>,
): ImageCenterMarker {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };

  return {
    type: cfg.centerStyle,
    position: imageCenter,
    size: cfg.centerStyle === "dot" ? 6 : 12,
    color: colors.center,
  };
}

/**
 * Generate image tip marker visualization data
 */
export function generateImageTipMarker(
  imageTip: { x: number; y: number },
  config?: Partial<ImageMappingDebugConfig>,
): ImageTipMarker {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };

  return {
    type: cfg.tipStyle,
    position: imageTip,
    size: 8,
    color: colors.tip,
    label: "TIP",
  };
}

/**
 * Generate image base marker visualization data
 */
export function generateImageBaseMarker(
  imageBase: { x: number; y: number },
  config?: Partial<ImageMappingDebugConfig>,
): ImageBaseMarker {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };

  return {
    type: cfg.baseStyle,
    position: imageBase,
    size: 8,
    color: colors.base,
    label: "BASE",
  };
}

/**
 * Generate axis line from base to tip
 */
export function generateAxisLine(
  imageBase: { x: number; y: number },
  imageTip: { x: number; y: number },
  displayAxisAngle: number,
  config?: Partial<ImageMappingDebugConfig>,
): ImageAxisLine {
  const _cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };

  return {
    start: imageBase,
    end: imageTip,
    thickness: 2,
    color: colors.axisLine,
    opacity: 0.6,
    label: `${displayAxisAngle.toFixed(1)}°`,
  };
}

/**
 * Generate rotation indicator arc
 */
export function generateRotationIndicator(
  imageCenter: { x: number; y: number },
  displayAxisAngle: number,
  displayRotation: number,
  config?: Partial<ImageMappingDebugConfig>,
): ImageRotationIndicator {
  const _cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };

  return {
    center: imageCenter,
    radius: 20,
    startAngle: displayAxisAngle,
    endAngle: displayAxisAngle + displayRotation,
    color: colors.rotation,
    opacity: 0.7,
  };
}

/**
 * Generate bounding box for image dimensions
 */
export function generateBoundingBox(
  position: { x: number; y: number },
  width: number,
  height: number,
  scale: { x: number; y: number },
  config?: Partial<ImageMappingDebugConfig>,
) {
  const _cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };

  const scaledWidth = width * scale.x;
  const scaledHeight = height * scale.y;

  return {
    x: position.x - scaledWidth / 2,
    y: position.y - scaledHeight / 2,
    width: scaledWidth,
    height: scaledHeight,
    color: colors.boundingBox,
    opacity: 0.3,
  };
}

/**
 * Generate complete image mapping debug visuals for a layer
 */
export function generateImageMappingDebugVisuals(
  layerData: {
    position: { x: number; y: number };
    scale: { x: number; y: number };
    imageMapping: {
      imageCenter: { x: number; y: number };
      imageTip: { x: number; y: number };
      imageBase: { x: number; y: number };
      imageDimensions: { width: number; height: number };
      displayAxisAngle: number;
      displayRotation: number;
    };
  },
  config?: Partial<ImageMappingDebugConfig>,
): ImageMappingDebugVisuals {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const visuals: ImageMappingDebugVisuals = {};

  const { imageMapping, position, scale } = layerData;
  const { width, height } = imageMapping.imageDimensions;

  // Convert image-space coordinates to stage-space coordinates
  const imageCenterStage = {
    x: position.x + (imageMapping.imageCenter.x - width / 2) * scale.x,
    y: position.y + (imageMapping.imageCenter.y - height / 2) * scale.y,
  };

  const imageTipStage = {
    x: position.x + (imageMapping.imageTip.x - width / 2) * scale.x,
    y: position.y + (imageMapping.imageTip.y - height / 2) * scale.y,
  };

  const imageBaseStage = {
    x: position.x + (imageMapping.imageBase.x - width / 2) * scale.x,
    y: position.y + (imageMapping.imageBase.y - height / 2) * scale.y,
  };

  if (cfg.showCenter) {
    visuals.centerMarker = generateImageCenterMarker(imageCenterStage, config);
  }

  if (cfg.showTip) {
    visuals.tipMarker = generateImageTipMarker(imageTipStage, config);
  }

  if (cfg.showBase) {
    visuals.baseMarker = generateImageBaseMarker(imageBaseStage, config);
  }

  if (cfg.showAxisLine) {
    visuals.axisLine = generateAxisLine(
      imageBaseStage,
      imageTipStage,
      imageMapping.displayAxisAngle,
      config,
    );
  }

  if (cfg.showRotation) {
    visuals.rotationIndicator = generateRotationIndicator(
      imageCenterStage,
      imageMapping.displayAxisAngle,
      imageMapping.displayRotation,
      config,
    );
  }

  if (cfg.showBoundingBox) {
    visuals.boundingBox = generateBoundingBox(position, width, height, scale, config);
  }

  return visuals;
}

/**
 * Canvas 2D rendering functions
 */
export const CanvasDebugRenderer = {
  drawImageCenter(ctx: CanvasRenderingContext2D, marker: ImageCenterMarker): void {
    ctx.save();

    if (marker.type === "dot") {
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.arc(marker.position.x, marker.position.y, marker.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (marker.type === "crosshair") {
      ctx.strokeStyle = marker.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Horizontal line
      ctx.moveTo(marker.position.x - marker.size, marker.position.y);
      ctx.lineTo(marker.position.x + marker.size, marker.position.y);
      // Vertical line
      ctx.moveTo(marker.position.x, marker.position.y - marker.size);
      ctx.lineTo(marker.position.x, marker.position.y + marker.size);
      ctx.stroke();
    }

    ctx.restore();
  },

  drawImageTip(ctx: CanvasRenderingContext2D, marker: ImageTipMarker): void {
    ctx.save();

    if (marker.type === "circle") {
      // Draw filled circle
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.arc(marker.position.x, marker.position.y, marker.size, 0, Math.PI * 2);
      ctx.fill();

      // Draw outline
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (marker.type === "arrow") {
      // Draw arrow pointing up
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.moveTo(marker.position.x, marker.position.y - marker.size);
      ctx.lineTo(marker.position.x - marker.size / 2, marker.position.y + marker.size / 2);
      ctx.lineTo(marker.position.x + marker.size / 2, marker.position.y + marker.size / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Draw label
    if (marker.label) {
      ctx.fillStyle = marker.color;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(marker.label, marker.position.x, marker.position.y - marker.size - 5);
    }

    ctx.restore();
  },

  drawImageBase(ctx: CanvasRenderingContext2D, marker: ImageBaseMarker): void {
    ctx.save();

    if (marker.type === "circle") {
      // Draw filled circle
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.arc(marker.position.x, marker.position.y, marker.size, 0, Math.PI * 2);
      ctx.fill();

      // Draw outline
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (marker.type === "square") {
      // Draw filled square
      ctx.fillStyle = marker.color;
      ctx.fillRect(
        marker.position.x - marker.size,
        marker.position.y - marker.size,
        marker.size * 2,
        marker.size * 2,
      );

      // Draw outline
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        marker.position.x - marker.size,
        marker.position.y - marker.size,
        marker.size * 2,
        marker.size * 2,
      );
    }

    // Draw label
    if (marker.label) {
      ctx.fillStyle = marker.color;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(marker.label, marker.position.x, marker.position.y + marker.size + 15);
    }

    ctx.restore();
  },

  drawAxisLine(ctx: CanvasRenderingContext2D, line: ImageAxisLine): void {
    ctx.save();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.thickness;
    ctx.globalAlpha = line.opacity;
    ctx.setLineDash([5, 5]); // Dashed line

    ctx.beginPath();
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
    ctx.stroke();

    // Draw label at midpoint
    if (line.label) {
      ctx.globalAlpha = 1;
      const midX = (line.start.x + line.end.x) / 2;
      const midY = (line.start.y + line.end.y) / 2;
      ctx.fillStyle = line.color;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(line.label, midX + 10, midY - 5);
    }

    ctx.restore();
  },

  drawRotationIndicator(ctx: CanvasRenderingContext2D, indicator: ImageRotationIndicator): void {
    ctx.save();
    ctx.strokeStyle = indicator.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = indicator.opacity;

    // Convert degrees to radians
    const startRad = (indicator.startAngle * Math.PI) / 180;
    const endRad = (indicator.endAngle * Math.PI) / 180;

    ctx.beginPath();
    ctx.arc(indicator.center.x, indicator.center.y, indicator.radius, startRad, endRad);
    ctx.stroke();

    // Draw arrow at end
    const arrowSize = 5;
    const arrowX = indicator.center.x + indicator.radius * Math.cos(endRad);
    const arrowY = indicator.center.y + indicator.radius * Math.sin(endRad);
    ctx.fillStyle = indicator.color;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - arrowSize * Math.cos(endRad - Math.PI / 6),
      arrowY - arrowSize * Math.sin(endRad - Math.PI / 6),
    );
    ctx.lineTo(
      arrowX - arrowSize * Math.cos(endRad + Math.PI / 6),
      arrowY - arrowSize * Math.sin(endRad + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  },

  drawBoundingBox(
    ctx: CanvasRenderingContext2D,
    box: { x: number; y: number; width: number; height: number; color: string; opacity: number },
  ): void {
    ctx.save();
    ctx.strokeStyle = box.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = box.opacity;
    ctx.setLineDash([3, 3]);

    ctx.strokeRect(box.x, box.y, box.width, box.height);

    ctx.restore();
  },

  drawAll(ctx: CanvasRenderingContext2D, visuals: ImageMappingDebugVisuals): void {
    // Draw in order: bounding box, axis line, base, tip, center (center on top)
    if (visuals.boundingBox) {
      this.drawBoundingBox(ctx, visuals.boundingBox);
    }
    if (visuals.axisLine) {
      this.drawAxisLine(ctx, visuals.axisLine);
    }
    if (visuals.rotationIndicator) {
      this.drawRotationIndicator(ctx, visuals.rotationIndicator);
    }
    if (visuals.baseMarker) {
      this.drawImageBase(ctx, visuals.baseMarker);
    }
    if (visuals.tipMarker) {
      this.drawImageTip(ctx, visuals.tipMarker);
    }
    if (visuals.centerMarker) {
      this.drawImageCenter(ctx, visuals.centerMarker);
    }
  },
};

/**
 * Three.js rendering functions
 * Note: Three.js uses a different coordinate system where Y-axis is inverted
 * and origin is at center, not top-left
 * Note: Import THREE from "three" in the file that uses these functions
 */
export const ThreeDebugRenderer = {
  createImageCenterMesh(
    marker: ImageCenterMarker,
    scene: any,
    STAGE_SIZE: number,
    THREE: any,
  ): any[] {
    const meshes: any[] = [];

    // Convert stage coordinates to Three.js coordinates
    const x = marker.position.x - STAGE_SIZE / 2;
    const y = STAGE_SIZE / 2 - marker.position.y;

    if (marker.type === "dot") {
      // Create dot
      const geometry = new THREE.CircleGeometry(marker.size, 16);
      const material = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 100); // Z=100 to render on top
      meshes.push(mesh);
    } else if (marker.type === "crosshair") {
      // Horizontal line
      const hGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x - marker.size, y, 100),
        new THREE.Vector3(x + marker.size, y, 100),
      ]);
      const hMaterial = new THREE.LineBasicMaterial({
        color: marker.color,
        linewidth: 2,
        depthTest: false,
      });
      const hLine = new THREE.Line(hGeometry, hMaterial);
      meshes.push(hLine);

      // Vertical line
      const vGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y - marker.size, 100),
        new THREE.Vector3(x, y + marker.size, 100),
      ]);
      const vMaterial = new THREE.LineBasicMaterial({
        color: marker.color,
        linewidth: 2,
        depthTest: false,
      });
      const vLine = new THREE.Line(vGeometry, vMaterial);
      meshes.push(vLine);
    }

    return meshes;
  },

  createImageTipMesh(marker: ImageTipMarker, scene: any, STAGE_SIZE: number, THREE: any): any[] {
    const meshes: any[] = [];

    const x = marker.position.x - STAGE_SIZE / 2;
    const y = STAGE_SIZE / 2 - marker.position.y;

    // Create circle
    const geometry = new THREE.CircleGeometry(marker.size, 16);
    const material = new THREE.MeshBasicMaterial({
      color: marker.color,
      transparent: true,
      opacity: 1,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 100);
    meshes.push(mesh);

    // Add outline
    const outlineGeometry = new THREE.RingGeometry(marker.size - 0.5, marker.size + 0.5, 16);
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: "#FFFFFF",
      transparent: true,
      opacity: 1,
      depthTest: false,
    });
    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineMesh.position.set(x, y, 100);
    meshes.push(outlineMesh);

    return meshes;
  },

  createImageBaseMesh(marker: ImageBaseMarker, scene: any, STAGE_SIZE: number, THREE: any): any[] {
    const meshes: any[] = [];

    const x = marker.position.x - STAGE_SIZE / 2;
    const y = STAGE_SIZE / 2 - marker.position.y;

    if (marker.type === "circle") {
      // Create circle
      const geometry = new THREE.CircleGeometry(marker.size, 16);
      const material = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 100);
      meshes.push(mesh);

      // Add outline
      const outlineGeometry = new THREE.RingGeometry(marker.size - 0.5, marker.size + 0.5, 16);
      const outlineMaterial = new THREE.MeshBasicMaterial({
        color: "#FFFFFF",
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
      outlineMesh.position.set(x, y, 100);
      meshes.push(outlineMesh);
    } else if (marker.type === "square") {
      // Create square
      const geometry = new THREE.PlaneGeometry(marker.size * 2, marker.size * 2);
      const material = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 100);
      meshes.push(mesh);
    }

    return meshes;
  },

  createAxisLineMesh(line: ImageAxisLine, scene: any, STAGE_SIZE: number, THREE: any): any {
    const startX = line.start.x - STAGE_SIZE / 2;
    const startY = STAGE_SIZE / 2 - line.start.y;
    const endX = line.end.x - STAGE_SIZE / 2;
    const endY = STAGE_SIZE / 2 - line.end.y;

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(startX, startY, 100),
      new THREE.Vector3(endX, endY, 100),
    ]);

    const material = new THREE.LineDashedMaterial({
      color: line.color,
      linewidth: line.thickness,
      transparent: true,
      opacity: line.opacity,
      dashSize: 5,
      gapSize: 5,
      depthTest: false,
    });

    const lineMesh = new THREE.Line(geometry, material);
    lineMesh.computeLineDistances(); // Required for dashed lines
    return lineMesh;
  },

  createBoundingBoxMesh(
    box: { x: number; y: number; width: number; height: number; color: string; opacity: number },
    scene: any,
    STAGE_SIZE: number,
    THREE: any,
  ): any {
    const centerX = box.x + box.width / 2 - STAGE_SIZE / 2;
    const centerY = STAGE_SIZE / 2 - (box.y + box.height / 2);

    const geometry = new THREE.PlaneGeometry(box.width, box.height);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: box.color,
      transparent: true,
      opacity: box.opacity,
      depthTest: false,
    });

    const lineSegments = new THREE.LineSegments(edges, material);
    lineSegments.position.set(centerX, centerY, 100);

    return lineSegments;
  },

  addAllToScene(
    visuals: ImageMappingDebugVisuals,
    scene: any,
    STAGE_SIZE: number,
    THREE: any,
  ): any[] {
    const allMeshes: any[] = [];

    if (visuals.boundingBox) {
      const mesh = this.createBoundingBoxMesh(visuals.boundingBox, scene, STAGE_SIZE, THREE);
      scene.add(mesh);
      allMeshes.push(mesh);
    }

    if (visuals.axisLine) {
      const mesh = this.createAxisLineMesh(visuals.axisLine, scene, STAGE_SIZE, THREE);
      scene.add(mesh);
      allMeshes.push(mesh);
    }

    if (visuals.baseMarker) {
      const meshes = this.createImageBaseMesh(visuals.baseMarker, scene, STAGE_SIZE, THREE);
      meshes.forEach((mesh) => {
        scene.add(mesh);
        allMeshes.push(mesh);
      });
    }

    if (visuals.tipMarker) {
      const meshes = this.createImageTipMesh(visuals.tipMarker, scene, STAGE_SIZE, THREE);
      meshes.forEach((mesh) => {
        scene.add(mesh);
        allMeshes.push(mesh);
      });
    }

    if (visuals.centerMarker) {
      const meshes = this.createImageCenterMesh(visuals.centerMarker, scene, STAGE_SIZE, THREE);
      meshes.forEach((mesh) => {
        scene.add(mesh);
        allMeshes.push(mesh);
      });
    }

    return allMeshes;
  },

  removeFromScene(meshes: any[], scene: any): void {
    meshes.forEach((mesh) => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat: any) => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  },
};

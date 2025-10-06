/**
 * Image Mapping Visual Debug Utilities
 * Helper functions to visualize imageTip, imageBase, and imageCenter points
 * Helps debug image orientation and axis alignment issues
 */

import type { UniversalLayerData } from "./LayerCore";

export type ImageCenterMarker = {
  type: "dot" | "crosshair";
  position: { x: number; y: number };
  size: number;
  color: string;
  label?: string;
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

export type StageCenterMarker = {
  type: "dot" | "crosshair" | "star";
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

export type ImageRay = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  angle: number; // In degrees
  thickness: number;
  color: string;
  opacity: number;
  label?: string;
};

export type ImageMappingDebugVisuals = {
  centerMarker?: ImageCenterMarker;
  tipMarker?: ImageTipMarker;
  baseMarker?: ImageBaseMarker;
  stageCenterMarker?: StageCenterMarker;
  axisLine?: ImageAxisLine;
  rotationIndicator?: ImageRotationIndicator;
  tipRay?: ImageRay;
  baseRay?: ImageRay;
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
  showStageCenter?: boolean;
  showAxisLine?: boolean;
  showRotation?: boolean;
  showTipRay?: boolean;
  showBaseRay?: boolean;
  showBoundingBox?: boolean;
  centerStyle?: "dot" | "crosshair";
  tipStyle?: "circle" | "arrow";
  baseStyle?: "circle" | "square";
  stageCenterStyle?: "dot" | "crosshair" | "star";
  colors?: {
    center?: string;
    tip?: string;
    base?: string;
    stageCenter?: string;
    axisLine?: string;
    rotation?: string;
    tipRay?: string;
    baseRay?: string;
    boundingBox?: string;
  };
};

type ResolvedImageMappingDebugConfig = {
  showCenter: boolean;
  showTip: boolean;
  showBase: boolean;
  showStageCenter: boolean;
  showAxisLine: boolean;
  showRotation: boolean;
  showTipRay: boolean;
  showBaseRay: boolean;
  showBoundingBox: boolean;
  centerStyle: "dot" | "crosshair";
  tipStyle: "circle" | "arrow";
  baseStyle: "circle" | "square";
  stageCenterStyle: "dot" | "crosshair" | "star";
  colors: {
    center: string;
    tip: string;
    base: string;
    stageCenter: string;
    axisLine: string;
    rotation: string;
    tipRay: string;
    baseRay: string;
    boundingBox: string;
  };
};

const DEFAULT_CONFIG: ResolvedImageMappingDebugConfig = {
  showCenter: true,
  showTip: true,
  showBase: true,
  showStageCenter: false, // Optional - shows stage center at 1024,1024
  showAxisLine: true,
  showRotation: false, // Optional - can be noisy
  showTipRay: false, // Optional - shows calculation ray for tip
  showBaseRay: false, // Optional - shows calculation ray for base
  showBoundingBox: false, // Optional - for advanced debugging
  centerStyle: "crosshair",
  tipStyle: "circle",
  baseStyle: "circle",
  stageCenterStyle: "star",
  colors: {
    center: "#FF0000", // Red - imageCenter
    tip: "#00FF00", // Green - imageTip
    base: "#0000FF", // Blue - imageBase
    stageCenter: "#00FFFF", // Cyan - stage center (1024,1024)
    axisLine: "#FFFF00", // Yellow - axis line
    rotation: "#00FFFF", // Cyan - rotation indicator
    tipRay: "#FFA500", // Orange - tip ray
    baseRay: "#9370DB", // Purple - base ray
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
    label: "CENTER",
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
 * Generate stage center marker visualization data
 * Stage center is always at (1024, 1024) - the center of the 2048x2048 stage
 */
export function generateStageCenterMarker(
  config?: Partial<ImageMappingDebugConfig>,
): StageCenterMarker {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };

  return {
    type: cfg.stageCenterStyle,
    position: { x: 1024, y: 1024 },
    size: cfg.stageCenterStyle === "star" ? 16 : 14,
    color: colors.stageCenter,
    label: "STAGE",
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
 * Generate ray from imageCenter to border at specified angle
 * This visualizes the calculation used to determine imageTip/imageBase
 * Uses the EXACT same logic as computeImageMapping for consistency
 */
export function generateImageRay(
  imageCenter: { x: number; y: number },
  imageDimensions: { width: number; height: number },
  angle: number,
  rayType: "tip" | "base",
  config?: Partial<ImageMappingDebugConfig>,
): ImageRay {
  const _cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };

  const { width, height } = imageDimensions;

  // Convert angle to radians (negate for screen coordinates)
  // EXACT copy from computeImageMapping
  const angleRad = (-angle * Math.PI) / 180;

  // Calculate ray direction
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  // Find intersection with rectangle boundary
  // EXACT copy from computeImageMapping logic
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Calculate scaling factor to reach rectangle edge
  const scaleX = dx !== 0 ? halfWidth / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfHeight / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  // Calculate end point (border intersection)
  const end = {
    x: imageCenter.x + scale * dx,
    y: imageCenter.y + scale * dy,
  };

  return {
    start: imageCenter,
    end: end,
    angle: angle,
    thickness: 1,
    color: rayType === "tip" ? colors.tipRay : colors.baseRay,
    opacity: 0.5,
    label: `${angle}°`,
  };
}

/**
 * Generate complete image mapping debug visuals for a layer
 */
export function generateImageMappingDebugVisuals(
  layer: UniversalLayerData,
  config?: Partial<ImageMappingDebugConfig>,
): ImageMappingDebugVisuals {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const visuals: ImageMappingDebugVisuals = {};

  const { imageMapping } = layer;
  const { width, height } = imageMapping.imageDimensions;

  // Use pre-calculated coordinates from layer.calculation
  const imageCenterStage = layer.calculation.imageCenter.stage.point;
  const imageTipStage = layer.calculation.imageTip.stage.point;
  const imageBaseStage = layer.calculation.imageBase.stage.point;

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

  if (cfg.showTipRay && layer.imageTip !== undefined) {
    const tipRayImageSpace = generateImageRay(
      imageMapping.imageCenter,
      imageMapping.imageDimensions,
      layer.imageTip,
      "tip",
      config,
    );
    // Use pre-calculated transformation for start point
    const tipRayStart = layer.calculation.imageCenter.stage.point;
    const tipRayEndImagePoint = tipRayImageSpace.end;

    // Still need to transform the ray end point (not pre-calculated)
    const tipRayEnd = {
      x: layer.position.x + (tipRayEndImagePoint.x - width / 2) * layer.scale.x,
      y: layer.position.y + (tipRayEndImagePoint.y - height / 2) * layer.scale.y,
    };

    visuals.tipRay = {
      ...tipRayImageSpace,
      start: tipRayStart,
      end: tipRayEnd,
    };
  }

  if (cfg.showBaseRay && layer.imageBase !== undefined) {
    const baseRayImageSpace = generateImageRay(
      imageMapping.imageCenter,
      imageMapping.imageDimensions,
      layer.imageBase,
      "base",
      config,
    );
    // Use pre-calculated transformation for start point
    const baseRayStart = layer.calculation.imageCenter.stage.point;
    const baseRayEndImagePoint = baseRayImageSpace.end;

    // Still need to transform the ray end point (not pre-calculated)
    const baseRayEnd = {
      x: layer.position.x + (baseRayEndImagePoint.x - width / 2) * layer.scale.x,
      y: layer.position.y + (baseRayEndImagePoint.y - height / 2) * layer.scale.y,
    };

    visuals.baseRay = {
      ...baseRayImageSpace,
      start: baseRayStart,
      end: baseRayEnd,
    };
  }

  if (cfg.showBoundingBox) {
    visuals.boundingBox = generateBoundingBox(layer.position, width, height, layer.scale, config);
  }

  if (cfg.showStageCenter) {
    visuals.stageCenterMarker = generateStageCenterMarker(config);
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

    // Draw label
    if (marker.label) {
      ctx.fillStyle = marker.color;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeText(marker.label, marker.position.x, marker.position.y - marker.size - 5);
      ctx.fillText(marker.label, marker.position.x, marker.position.y - marker.size - 5);
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

  drawImageRay(ctx: CanvasRenderingContext2D, ray: ImageRay): void {
    ctx.save();
    ctx.strokeStyle = ray.color;
    ctx.lineWidth = ray.thickness;
    ctx.globalAlpha = ray.opacity;
    ctx.setLineDash([3, 3]); // Dotted line for rays

    ctx.beginPath();
    ctx.moveTo(ray.start.x, ray.start.y);
    ctx.lineTo(ray.end.x, ray.end.y);
    ctx.stroke();

    // Draw label near the end point
    if (ray.label) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = ray.color;
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(ray.label, ray.end.x, ray.end.y - 8);
    }

    ctx.restore();
  },

  drawStageCenter(ctx: CanvasRenderingContext2D, marker: StageCenterMarker): void {
    ctx.save();

    if (marker.type === "dot") {
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.arc(marker.position.x, marker.position.y, marker.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (marker.type === "crosshair") {
      // Draw full-screen crosshair lines for maximum visibility
      ctx.strokeStyle = marker.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      // Horizontal line spanning the entire stage
      ctx.moveTo(0, marker.position.y);
      ctx.lineTo(2048, marker.position.y);
      // Vertical line spanning the entire stage
      ctx.moveTo(marker.position.x, 0);
      ctx.lineTo(marker.position.x, 2048);
      ctx.stroke();
    } else if (marker.type === "star") {
      // Draw full-screen crosshair lines for maximum visibility
      ctx.strokeStyle = marker.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      // Horizontal line spanning the entire stage
      ctx.moveTo(0, marker.position.y);
      ctx.lineTo(2048, marker.position.y);
      // Vertical line spanning the entire stage
      ctx.moveTo(marker.position.x, 0);
      ctx.lineTo(marker.position.x, 2048);
      ctx.stroke();

      // Draw the star at center with no transparency
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      ctx.fillStyle = marker.color;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const spikes = 5;
      const outerRadius = marker.size;
      const innerRadius = marker.size / 2;
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = marker.position.x + radius * Math.cos(angle);
        const y = marker.position.y + radius * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Draw label
    if (marker.label) {
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      ctx.fillStyle = marker.color;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeText(marker.label, marker.position.x, marker.position.y - marker.size - 8);
      ctx.fillText(marker.label, marker.position.x, marker.position.y - marker.size - 8);
    }

    ctx.restore();
  },

  /**
   * Check if point is in viewport
   */
  isInViewport(
    point: { x: number; y: number },
    stageSize: number = 2048,
    margin: number = 100,
  ): boolean {
    return (
      point.x >= -margin &&
      point.x <= stageSize + margin &&
      point.y >= -margin &&
      point.y <= stageSize + margin
    );
  },

  drawAll(
    ctx: CanvasRenderingContext2D,
    visuals: ImageMappingDebugVisuals,
    stageSize: number = 2048,
  ): void {
    // Draw in order: bounding box, rays (background), axis line, rotation, markers (foreground)

    // Bounding box and stage center always draw (if present)
    if (visuals.boundingBox) {
      this.drawBoundingBox(ctx, visuals.boundingBox);
    }

    // Only draw rays if start point is visible
    if (visuals.tipRay && this.isInViewport(visuals.tipRay.start, stageSize)) {
      this.drawImageRay(ctx, visuals.tipRay);
    }
    if (visuals.baseRay && this.isInViewport(visuals.baseRay.start, stageSize)) {
      this.drawImageRay(ctx, visuals.baseRay);
    }

    // Draw axis line if either endpoint is visible
    if (visuals.axisLine) {
      const startVisible = this.isInViewport(visuals.axisLine.start, stageSize);
      const endVisible = this.isInViewport(visuals.axisLine.end, stageSize);
      if (startVisible || endVisible) {
        this.drawAxisLine(ctx, visuals.axisLine);
      }
    }

    // Draw rotation indicator if center is visible
    if (
      visuals.rotationIndicator &&
      this.isInViewport(visuals.rotationIndicator.center, stageSize)
    ) {
      this.drawRotationIndicator(ctx, visuals.rotationIndicator);
    }

    // Only draw markers if in viewport
    if (visuals.baseMarker && this.isInViewport(visuals.baseMarker.position, stageSize)) {
      this.drawImageBase(ctx, visuals.baseMarker);
    }
    if (visuals.tipMarker && this.isInViewport(visuals.tipMarker.position, stageSize)) {
      this.drawImageTip(ctx, visuals.tipMarker);
    }
    if (visuals.centerMarker && this.isInViewport(visuals.centerMarker.position, stageSize)) {
      this.drawImageCenter(ctx, visuals.centerMarker);
    }

    // Stage center always draws
    if (visuals.stageCenterMarker) {
      this.drawStageCenter(ctx, visuals.stageCenterMarker);
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
      // Create larger dot (2x size - reduced from 3x)
      const dotSize = marker.size * 2;
      const geometry = new THREE.CircleGeometry(dotSize, 32);
      const material = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 100); // Z=100 to render on top
      meshes.push(mesh);

      // Add small white center dot for precision
      const centerDotGeometry = new THREE.CircleGeometry(2, 16);
      const centerDotMaterial = new THREE.MeshBasicMaterial({
        color: "#FFFFFF",
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const centerDot = new THREE.Mesh(centerDotGeometry, centerDotMaterial);
      centerDot.position.set(x, y, 101);
      meshes.push(centerDot);
    } else if (marker.type === "crosshair") {
      const lineSize = marker.size * 2;
      // Horizontal line - use mesh-based thick line
      const hThickness = 3;
      const hGeometry = new THREE.PlaneGeometry(lineSize * 2, hThickness);
      const hMaterial = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const hLine = new THREE.Mesh(hGeometry, hMaterial);
      hLine.position.set(x, y, 100);
      meshes.push(hLine);

      // Vertical line - use mesh-based thick line
      const vGeometry = new THREE.PlaneGeometry(hThickness, lineSize * 2);
      const vMaterial = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const vLine = new THREE.Mesh(vGeometry, vMaterial);
      vLine.position.set(x, y, 100);
      meshes.push(vLine);

      // Add small center dot at crosshair intersection for precision
      const centerDotGeometry = new THREE.CircleGeometry(4, 16);
      const centerDotMaterial = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const centerDot = new THREE.Mesh(centerDotGeometry, centerDotMaterial);
      centerDot.position.set(x, y, 101);
      meshes.push(centerDot);
    }

    return meshes;
  },

  createImageTipMesh(marker: ImageTipMarker, scene: any, STAGE_SIZE: number, THREE: any): any[] {
    const meshes: any[] = [];

    const x = marker.position.x - STAGE_SIZE / 2;
    const y = STAGE_SIZE / 2 - marker.position.y;

    // Create circle (1.2x size - smaller than before)
    const circleSize = marker.size * 1.2;
    const geometry = new THREE.CircleGeometry(circleSize, 32);
    const material = new THREE.MeshBasicMaterial({
      color: marker.color,
      transparent: true,
      opacity: 1,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 100);
    meshes.push(mesh);

    // Add thicker outline
    const outlineGeometry = new THREE.RingGeometry(circleSize - 1.5, circleSize + 1.5, 32);
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: "#FFFFFF",
      transparent: true,
      opacity: 1,
      depthTest: false,
    });
    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineMesh.position.set(x, y, 100);
    meshes.push(outlineMesh);

    // Add small center dot for precision
    const centerDotGeometry = new THREE.CircleGeometry(3, 16);
    const centerDotMaterial = new THREE.MeshBasicMaterial({
      color: "#FFFFFF",
      transparent: true,
      opacity: 1,
      depthTest: false,
    });
    const centerDot = new THREE.Mesh(centerDotGeometry, centerDotMaterial);
    centerDot.position.set(x, y, 101);
    meshes.push(centerDot);

    return meshes;
  },

  createImageBaseMesh(marker: ImageBaseMarker, scene: any, STAGE_SIZE: number, THREE: any): any[] {
    const meshes: any[] = [];

    const x = marker.position.x - STAGE_SIZE / 2;
    const y = STAGE_SIZE / 2 - marker.position.y;

    if (marker.type === "circle") {
      // Create circle (1.5x size)
      const circleSize = marker.size * 1.5;

      // Add bright glow for visibility against dark background
      const glowGeometry = new THREE.CircleGeometry(circleSize * 2, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: "#00BFFF", // Bright cyan/light blue for visibility
        transparent: true,
        opacity: 0.4,
        depthTest: false,
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.set(x, y, 99);
      meshes.push(glowMesh);

      // Main circle with brighter blue
      const geometry = new THREE.CircleGeometry(circleSize, 32);
      const material = new THREE.MeshBasicMaterial({
        color: "#4169E1", // Royal blue - brighter than pure blue
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 100);
      meshes.push(mesh);

      // Add thicker white outline
      const outlineGeometry = new THREE.RingGeometry(circleSize - 1.5, circleSize + 1.5, 32);
      const outlineMaterial = new THREE.MeshBasicMaterial({
        color: "#FFFFFF",
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
      outlineMesh.position.set(x, y, 100);
      meshes.push(outlineMesh);

      // Add bright cyan center dot for precision
      const centerDotGeometry = new THREE.CircleGeometry(4, 16);
      const centerDotMaterial = new THREE.MeshBasicMaterial({
        color: "#00FFFF", // Bright cyan
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const centerDot = new THREE.Mesh(centerDotGeometry, centerDotMaterial);
      centerDot.position.set(x, y, 101);
      meshes.push(centerDot);
    } else if (marker.type === "square") {
      // Create square (1.5x size)
      const squareSize = marker.size * 1.5;
      const geometry = new THREE.PlaneGeometry(squareSize * 2, squareSize * 2);
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

    // Calculate line properties
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;

    // Create mesh-based thick line (4px thick for better visibility)
    const thickness = 4;
    const geometry = new THREE.PlaneGeometry(length, thickness);
    const material = new THREE.MeshBasicMaterial({
      color: line.color,
      transparent: true,
      opacity: line.opacity * 1.5, // Increase opacity
      depthTest: false,
    });

    const lineMesh = new THREE.Mesh(geometry, material);
    lineMesh.position.set(centerX, centerY, 100);
    lineMesh.rotation.z = angle;

    return lineMesh;
  },

  createBoundingBoxMesh(
    box: { x: number; y: number; width: number; height: number; color: string; opacity: number },
    scene: any,
    STAGE_SIZE: number,
    THREE: any,
  ): any[] {
    const meshes: any[] = [];
    const centerX = box.x + box.width / 2 - STAGE_SIZE / 2;
    const centerY = STAGE_SIZE / 2 - (box.y + box.height / 2);

    // Convert to corners in Three.js coordinates
    const left = box.x - STAGE_SIZE / 2;
    const right = left + box.width;
    const top = STAGE_SIZE / 2 - box.y;
    const bottom = top - box.height;

    // Use mesh-based thick lines (5px) for better visibility
    const thickness = 5;
    const increasedOpacity = Math.min(box.opacity * 3, 0.9); // 3x opacity, max 90%

    // Top line
    const topGeometry = new THREE.PlaneGeometry(box.width, thickness);
    const topMaterial = new THREE.MeshBasicMaterial({
      color: box.color,
      transparent: true,
      opacity: increasedOpacity,
      depthTest: false,
    });
    const topLine = new THREE.Mesh(topGeometry, topMaterial);
    topLine.position.set(centerX, top, 100);
    meshes.push(topLine);

    // Bottom line
    const bottomGeometry = new THREE.PlaneGeometry(box.width, thickness);
    const bottomMaterial = new THREE.MeshBasicMaterial({
      color: box.color,
      transparent: true,
      opacity: increasedOpacity,
      depthTest: false,
    });
    const bottomLine = new THREE.Mesh(bottomGeometry, bottomMaterial);
    bottomLine.position.set(centerX, bottom, 100);
    meshes.push(bottomLine);

    // Left line
    const leftGeometry = new THREE.PlaneGeometry(thickness, box.height);
    const leftMaterial = new THREE.MeshBasicMaterial({
      color: box.color,
      transparent: true,
      opacity: increasedOpacity,
      depthTest: false,
    });
    const leftLine = new THREE.Mesh(leftGeometry, leftMaterial);
    leftLine.position.set(left, centerY, 100);
    meshes.push(leftLine);

    // Right line
    const rightGeometry = new THREE.PlaneGeometry(thickness, box.height);
    const rightMaterial = new THREE.MeshBasicMaterial({
      color: box.color,
      transparent: true,
      opacity: increasedOpacity,
      depthTest: false,
    });
    const rightLine = new THREE.Mesh(rightGeometry, rightMaterial);
    rightLine.position.set(right, centerY, 100);
    meshes.push(rightLine);

    return meshes;
  },

  createImageRayMesh(ray: ImageRay, scene: any, STAGE_SIZE: number, THREE: any): any {
    const startX = ray.start.x - STAGE_SIZE / 2;
    const startY = STAGE_SIZE / 2 - ray.start.y;
    const endX = ray.end.x - STAGE_SIZE / 2;
    const endY = STAGE_SIZE / 2 - ray.end.y;

    // Calculate line properties
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;

    // Create mesh-based thick line (3px thick for better visibility)
    const thickness = 3;
    const geometry = new THREE.PlaneGeometry(length, thickness);
    const material = new THREE.MeshBasicMaterial({
      color: ray.color,
      transparent: true,
      opacity: ray.opacity * 1.5, // Increase opacity
      depthTest: false,
    });

    const lineMesh = new THREE.Mesh(geometry, material);
    lineMesh.position.set(centerX, centerY, 98); // Slightly behind axis line
    lineMesh.rotation.z = angle;

    return lineMesh;
  },

  createStageCenterMesh(
    marker: StageCenterMarker,
    scene: any,
    STAGE_SIZE: number,
    THREE: any,
  ): any[] {
    const meshes: any[] = [];

    // Stage center is at (1024, 1024), convert to Three.js coordinates
    const x = marker.position.x - STAGE_SIZE / 2;
    const y = STAGE_SIZE / 2 - marker.position.y;

    if (marker.type === "dot") {
      const dotSize = marker.size * 2;
      const geometry = new THREE.CircleGeometry(dotSize, 32);
      const material = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 100);
      meshes.push(mesh);
    } else if (marker.type === "crosshair") {
      // Full-screen horizontal line - mesh-based for visibility
      const hThickness = 4;
      const hGeometry = new THREE.PlaneGeometry(STAGE_SIZE, hThickness);
      const hMaterial = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      });
      const hLine = new THREE.Mesh(hGeometry, hMaterial);
      hLine.position.set(0, y, 100);
      meshes.push(hLine);

      // Full-screen vertical line - mesh-based for visibility
      const vGeometry = new THREE.PlaneGeometry(hThickness, STAGE_SIZE);
      const vMaterial = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      });
      const vLine = new THREE.Mesh(vGeometry, vMaterial);
      vLine.position.set(x, 0, 100);
      meshes.push(vLine);
    } else if (marker.type === "star") {
      // Full-screen horizontal line - mesh-based for visibility
      const hThickness = 4;
      const hGeometry = new THREE.PlaneGeometry(STAGE_SIZE, hThickness);
      const hMaterial = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      });
      const hLine = new THREE.Mesh(hGeometry, hMaterial);
      hLine.position.set(0, y, 100);
      meshes.push(hLine);

      // Full-screen vertical line - mesh-based for visibility
      const vGeometry = new THREE.PlaneGeometry(hThickness, STAGE_SIZE);
      const vMaterial = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      });
      const vLine = new THREE.Mesh(vGeometry, vMaterial);
      vLine.position.set(x, 0, 100);
      meshes.push(vLine);

      // Create 5-point star at center
      const spikes = 5;
      const outerRadius = marker.size;
      const innerRadius = marker.size / 2;
      const points: any[] = [];

      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        points.push(new THREE.Vector3(px, py, 100));
      }
      points.push(points[0]); // Close the star

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: marker.color,
        linewidth: 2,
        depthTest: false,
      });
      const lineMesh = new THREE.LineLoop(geometry, material);
      meshes.push(lineMesh);

      // Fill the star
      const shape = new THREE.Shape();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const px = radius * Math.cos(angle);
        const py = radius * Math.sin(angle);
        if (i === 0) {
          shape.moveTo(px, py);
        } else {
          shape.lineTo(px, py);
        }
      }
      shape.closePath();

      const fillGeometry = new THREE.ShapeGeometry(shape);
      const fillMaterial = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 1,
        depthTest: false,
      });
      const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
      fillMesh.position.set(x, y, 100);
      meshes.push(fillMesh);
    }

    return meshes;
  },

  addAllToScene(
    visuals: ImageMappingDebugVisuals,
    scene: any,
    STAGE_SIZE: number,
    THREE: any,
  ): any[] {
    const allMeshes: any[] = [];

    if (visuals.boundingBox) {
      const meshes = this.createBoundingBoxMesh(visuals.boundingBox, scene, STAGE_SIZE, THREE);
      meshes.forEach((mesh) => {
        scene.add(mesh);
        allMeshes.push(mesh);
      });
    }

    if (visuals.tipRay) {
      const mesh = this.createImageRayMesh(visuals.tipRay, scene, STAGE_SIZE, THREE);
      scene.add(mesh);
      allMeshes.push(mesh);
    }

    if (visuals.baseRay) {
      const mesh = this.createImageRayMesh(visuals.baseRay, scene, STAGE_SIZE, THREE);
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

    if (visuals.stageCenterMarker) {
      const meshes = this.createStageCenterMesh(
        visuals.stageCenterMarker,
        scene,
        STAGE_SIZE,
        THREE,
      );
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

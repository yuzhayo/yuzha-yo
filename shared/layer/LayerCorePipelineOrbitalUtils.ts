/**
 * Orbital Visual Debug Utilities
 * Helper functions to visualize orbital motion paths and centers
 */

export type OrbitCenterMarker = {
  type: "dot" | "crosshair";
  center: { x: number; y: number };
  size: number;
  color: string;
};

export type OrbitLineTrace = {
  center: { x: number; y: number };
  radius: number;
  points: Array<{ x: number; y: number }>;
  thickness: number;
  color: string;
  opacity: number;
};

export type OrbitRadiusLine = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness: number;
  color: string;
  opacity: number;
};

export type OrbitPointMarker = {
  type: "circle";
  position: { x: number; y: number };
  size: number;
  color: string;
};

export type OrbitalDebugVisuals = {
  centerMarker?: OrbitCenterMarker;
  lineTrace?: OrbitLineTrace;
  radiusLine?: OrbitRadiusLine;
  pointMarker?: OrbitPointMarker;
};

export type OrbitalDebugConfig = {
  showCenter?: boolean;
  showOrbitLine?: boolean;
  showRadiusLine?: boolean;
  showOrbitPoint?: boolean;
  centerStyle?: "dot" | "crosshair";
  colors?: {
    center?: string;
    orbitLine?: string;
    radiusLine?: string;
    orbitPoint?: string;
  };
};

type ResolvedOrbitalDebugConfig = {
  showCenter: boolean;
  showOrbitLine: boolean;
  showRadiusLine: boolean;
  showOrbitPoint: boolean;
  centerStyle: "dot" | "crosshair";
  colors: {
    center: string;
    orbitLine: string;
    radiusLine: string;
    orbitPoint: string;
  };
};

const DEFAULT_CONFIG: ResolvedOrbitalDebugConfig = {
  showCenter: true,
  showOrbitLine: true,
  showRadiusLine: true,
  showOrbitPoint: true,
  centerStyle: "crosshair",
  colors: {
    center: "#FF0000", // Red
    orbitLine: "#00FF00", // Green
    radiusLine: "#FFFF00", // Yellow
    orbitPoint: "#0000FF", // Blue
  },
};

/**
 * Generate orbit center marker visualization data
 */
export function generateOrbitCenterMarker(
  orbitCenter: [number, number],
  config?: Partial<OrbitalDebugConfig>,
): OrbitCenterMarker {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };

  return {
    type: cfg.centerStyle,
    center: { x: orbitCenter[0], y: orbitCenter[1] },
    size: cfg.centerStyle === "dot" ? 6 : 15,
    color: colors.center,
  };
}

/**
 * Generate orbit line (circular path) trace visualization data
 */
export function generateOrbitLineTrace(
  orbitCenter: [number, number],
  orbitRadius: number,
  config?: Partial<OrbitalDebugConfig>,
): OrbitLineTrace {
  const _cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };
  const segments = 64; // Smooth circle
  const points: Array<{ x: number; y: number }> = [];

  // Generate circle points
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = orbitCenter[0] + orbitRadius * Math.cos(angle);
    const y = orbitCenter[1] + orbitRadius * Math.sin(angle);
    points.push({ x, y });
  }

  return {
    center: { x: orbitCenter[0], y: orbitCenter[1] },
    radius: orbitRadius,
    points,
    thickness: 2,
    color: colors.orbitLine,
    opacity: 0.5,
  };
}

/**
 * Generate radius line from orbit center to current position
 */
export function generateOrbitRadiusLine(
  orbitCenter: [number, number],
  orbitPoint: { x: number; y: number },
  config?: Partial<OrbitalDebugConfig>,
): OrbitRadiusLine {
  const _cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };

  return {
    start: { x: orbitCenter[0], y: orbitCenter[1] },
    end: orbitPoint,
    thickness: 2,
    color: colors.radiusLine,
    opacity: 0.7,
  };
}

/**
 * Generate orbit point marker for current position
 */
export function generateOrbitPointMarker(
  orbitPoint: { x: number; y: number },
  config?: Partial<OrbitalDebugConfig>,
): OrbitPointMarker {
  const _cfg = { ...DEFAULT_CONFIG, ...config };
  const colors = { ...DEFAULT_CONFIG.colors, ...config?.colors };

  return {
    type: "circle",
    position: orbitPoint,
    size: 8,
    color: colors.orbitPoint,
  };
}

/**
 * Generate complete orbital debug visuals for a layer
 */
export function generateOrbitalDebugVisuals(
  orbitCenter: [number, number],
  orbitRadius: number,
  currentOrbitPoint: { x: number; y: number },
  config?: Partial<OrbitalDebugConfig>,
): OrbitalDebugVisuals {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const visuals: OrbitalDebugVisuals = {};

  if (cfg.showCenter) {
    visuals.centerMarker = generateOrbitCenterMarker(orbitCenter, config);
  }

  if (cfg.showOrbitLine) {
    visuals.lineTrace = generateOrbitLineTrace(orbitCenter, orbitRadius, config);
  }

  if (cfg.showRadiusLine) {
    visuals.radiusLine = generateOrbitRadiusLine(orbitCenter, currentOrbitPoint, config);
  }

  if (cfg.showOrbitPoint) {
    visuals.pointMarker = generateOrbitPointMarker(currentOrbitPoint, config);
  }

  return visuals;
}

/**
 * Canvas 2D rendering functions
 */
export const CanvasDebugRenderer = {
  drawOrbitCenter(ctx: CanvasRenderingContext2D, marker: OrbitCenterMarker): void {
    ctx.save();

    if (marker.type === "dot") {
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.arc(marker.center.x, marker.center.y, marker.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (marker.type === "crosshair") {
      ctx.strokeStyle = marker.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Horizontal line
      ctx.moveTo(marker.center.x - marker.size, marker.center.y);
      ctx.lineTo(marker.center.x + marker.size, marker.center.y);
      // Vertical line
      ctx.moveTo(marker.center.x, marker.center.y - marker.size);
      ctx.lineTo(marker.center.x, marker.center.y + marker.size);
      ctx.stroke();
    }

    ctx.restore();
  },

  drawOrbitLine(ctx: CanvasRenderingContext2D, line: OrbitLineTrace): void {
    ctx.save();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.thickness;
    ctx.globalAlpha = line.opacity;

    ctx.beginPath();
    ctx.arc(line.center.x, line.center.y, line.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  },

  drawRadiusLine(ctx: CanvasRenderingContext2D, line: OrbitRadiusLine): void {
    ctx.save();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.thickness;
    ctx.globalAlpha = line.opacity;

    ctx.beginPath();
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
    ctx.stroke();

    ctx.restore();
  },

  drawOrbitPoint(ctx: CanvasRenderingContext2D, marker: OrbitPointMarker): void {
    ctx.save();
    ctx.fillStyle = marker.color;

    ctx.beginPath();
    ctx.arc(marker.position.x, marker.position.y, marker.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  drawAll(ctx: CanvasRenderingContext2D, visuals: OrbitalDebugVisuals): void {
    if (visuals.lineTrace) {
      this.drawOrbitLine(ctx, visuals.lineTrace);
    }
    if (visuals.radiusLine) {
      this.drawRadiusLine(ctx, visuals.radiusLine);
    }
    if (visuals.centerMarker) {
      this.drawOrbitCenter(ctx, visuals.centerMarker);
    }
    if (visuals.pointMarker) {
      this.drawOrbitPoint(ctx, visuals.pointMarker);
    }
  },
};

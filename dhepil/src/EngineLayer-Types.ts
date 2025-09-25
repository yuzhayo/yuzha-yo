// IMPORT SECTION (unused)

// STYLE SECTION (unused)

// STATE SECTION
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export type LayerType = 'mesh' | 'light' | 'camera' | 'group' | 'effect' | 'ui' | 'animation';

export interface LayerProperties {
  /** Material configuration */
  material?: MaterialConfig;
  
  /** Texture reference */
  texture?: string;
  
  /** Animation settings */
  animation?: AnimationConfig;
  
  /** Custom metadata */
  metadata?: Record<string, any>;
}

export interface MaterialConfig {
  type?: 'basic' | 'standard' | 'phong' | 'lambert';
  color?: number;
  wireframe?: boolean;
  opacity?: number;
  transparent?: boolean;
  roughness?: number;
  metalness?: number;
  map?: string;
}

export interface AnimationConfig {
  type?: 'rotation' | 'position' | 'scale' | 'opacity';
  duration?: number;
  easing?: EasingFunction;
  repeat?: number;
  direction?: 'normal' | 'reverse' | 'alternate';
}

export type EasingFunction = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';

export interface GeometryConfig {
  type: 'box' | 'sphere' | 'cylinder' | 'plane';
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  segments?: number;
}

export interface ProcessingContext {
  environment?: string;
  enableOptimizations?: boolean;
  targetFPS?: number;
  qualityLevel?: string;
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface PipelineResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  metadata?: {
    validationTime?: number;
    processingTime?: number;
    optimizationTime?: number;
    totalLayers?: number;
  };
}

// LOGIC SECTION (unused)

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export default Vector3;
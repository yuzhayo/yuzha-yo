/**
 * LayerSystemTypes.ts - Unified Type System
 * Best-of-best from source2 + source3 with comprehensive interfaces
 */

/* ==============================
 * Basic Types
 * ============================== */

export type Vec2 = { x: number; y: number };

export type StageOrigin = "center" | "top-left";
export type FitMode = "contain" | "cover" | "stretch";
export type Alignment =
  | "center"
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

export type Direction = "cw" | "ccw";
export type AnchorMode = "center" | "top-left" | "custom";
export type PositionMode = "absolute" | "fraction";
export type ScaleMode = "uniform" | "xy";

/* ==============================
 * Stage Configuration
 * ============================== */

export interface StageConfig {
  width?: number;
  height?: number;
  origin?: StageOrigin;
  debug?: boolean;
}

export interface StageConfigNormalized {
  width: number;
  height: number;
  origin: StageOrigin;
}

/* ==============================
 * Animation Behaviors
 * ============================== */

export interface SpinConfig {
  enabled: boolean;
  speedDegPerSec?: number | undefined;
  periodSec?: number | undefined;
  direction?: Direction;
  offsetDeg?: number;
  epochMs?: number;
  startDelayMs?: number;
  durationMs?: number | undefined;
}

export interface OrbitConfig {
  enabled: boolean;
  orbitCenter?: Vec2 | undefined;
  radiusPx?: number | undefined;
  startAngleDeg?: number | undefined;
  speedDegPerSec?: number;
  periodSec?: number | undefined;
  direction?: Direction;
  orbitAngleOffsetDeg?: number;
  epochMs?: number;
  orientationMode?: "inheritSpin" | "radial-out" | "radial-in" | "tangent";
  startDelayMs?: number;
  durationMs?: number | undefined;
}

export interface PulseConfig {
  enabled: boolean;
  amplitude: number;
  rpm: number;
}

export interface FadeConfig {
  enabled: boolean;
  from: number;
  to: number;
  rpm: number;
}

export interface ClockConfig {
  enabled: boolean;
  timezone?: string | undefined;
  tickMode?: "smooth" | "tick";
  timeFormat?: 12 | 24;
  imageSpin?: "none" | "true" | "sec" | "min" | "hour";
  imageTipAngle360?: number;
  imageBaseAngle360?: number;
  clockCenter?: Vec2 | undefined;
  centerBaseRadius?: number;
}

export interface BehaviorsConfig {
  spin?: Partial<SpinConfig>;
  orbit?: Partial<OrbitConfig>;
  pulse?: Partial<PulseConfig>;
  fade?: Partial<FadeConfig>;
  clock?: Partial<ClockConfig>;
}

export interface BehaviorsConfigNormalized {
  spin: SpinConfig;
  orbit: OrbitConfig;
  pulse: PulseConfig;
  fade: FadeConfig;
  clock: ClockConfig;
}

/* ==============================
 * Effects System
 * ============================== */

export type EffectType = "fade" | "pulse" | "blink" | "shake" | "wiggle";
export type Easing =
  | "linear"
  | "easeInQuad"
  | "easeOutQuad"
  | "easeInOutQuad"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInOutCubic";
export type Waveform = "sine" | "triangle" | "square" | "saw" | "revSaw" | "noise";

export interface BaseEffectUnit {
  type: EffectType;
  enable?: boolean;
  startDelayMs?: number;
  durationMs?: number;
  easing?: Easing;
  mix?: number;
}

export interface FadeUnit extends BaseEffectUnit {
  type: "fade";
  from?: number;
  to?: number;
  pingpong?: boolean;
}

export interface PulseUnit extends BaseEffectUnit {
  type: "pulse";
  freqHz?: number;
  periodSec?: number;
  waveform?: Waveform;
  scaleCenter?: number;
  scaleAmp?: number;
  opacityCenter?: number;
  opacityAmp?: number;
  scaleXYSplit?: boolean;
  phaseDeg?: number;
}

export interface ShakeUnit extends BaseEffectUnit {
  type: "shake";
  posAmp?: Vec2;
  angleAmpDeg?: number;
  freqHz?: number;
}

export type EffectUnit = FadeUnit | PulseUnit | ShakeUnit;

export interface EffectConfig {
  enabled: boolean;
  allowAngleNudge?: boolean;
  units?: EffectUnit[];
}

/* ==============================
 * Asset Management
 * ============================== */

export type AssetRef = { type: "path"; path: string } | { type: "registry"; key: string };

export interface AssetMeta {
  src: string;
  width: number;
  height: number;
  anchor?: Vec2;
  dpi?: number;
}

/* ==============================
 * Layer Configuration
 * ============================== */

export interface LayerConfig {
  layerId: string;
  enabled?: boolean;

  // Asset
  imagePath?: string;
  registryKey?: string;

  // Transform
  position?: Vec2;
  positionMode?: PositionMode;
  scale?: number | Vec2;
  scaleMode?: ScaleMode;
  scaleUniform?: number;
  scaleXY?: Vec2;
  angle?: number;
  tilt?: Vec2;
  anchor?: Vec2;
  anchorMode?: AnchorMode;
  anchorCustom?: Vec2;
  opacity?: number;

  // Visual
  visible?: boolean;
  zIndex?: number;
  imageTipAngle360?: number;
  imageBaseAngle360?: number;

  // Behaviors
  behaviors?: BehaviorsConfig;

  // Container
  layerWidth?: number;
  layerHeight?: number;
  fitMode?: FitMode;
  alignment?: Alignment;

  // Effects
  effects?: EffectConfig;
}

export interface LayerConfigNormalized {
  layerId: string;
  enabled: boolean;
  assetRef: AssetRef;

  position: Vec2;
  scale: Vec2;
  angle: number;
  tilt: Vec2;
  anchor: Vec2;
  opacity: number;
  visible: boolean;
  zIndex: number;
  imageTipAngle360: number;
  imageBaseAngle360: number;

  behaviors: BehaviorsConfigNormalized;

  container?:
    | {
        width?: number | undefined;
        height?: number | undefined;
        fitMode: FitMode;
        alignment: Alignment;
      }
    | undefined;

  effects: EffectConfig;
}

/* ==============================
 * System Configuration
 * ============================== */

export interface LibraryConfig {
  stage?: StageConfig;
  layers: LayerConfig[];
}

export interface LibraryConfigNormalized {
  stage: StageConfigNormalized;
  layers: LayerConfigNormalized[];
}

/* ==============================
 * Runtime State
 * ============================== */

export interface LayerData {
  id: string;
  zIndex: number;
  asset: AssetRef;

  transform: {
    position: Vec2;
    scale: Vec2;
    angle: number;
    tilt: Vec2;
    anchor: Vec2;
    opacity: number;
  };

  container?: {
    width?: number;
    height?: number;
    fitMode: FitMode;
    alignment: Alignment;
  };

  behaviors: BehaviorsConfigNormalized;
  effects: EffectConfig;

  state: {
    isHovered: boolean;
    isPressed: boolean;
    isActive: boolean;
    isVisible: boolean;
  };
}

export interface ProcessingContext {
  stage: StageConfigNormalized;
  time: number;
  registry: Map<string, AssetMeta>;
  eventState?: Map<string, LayerData["state"]>;
}

/* ==============================
 * Rendering Types (from source2)
 * ============================== */

export interface RenderQuality {
  dpr: number;
  antialias: boolean;
  shadows: boolean;
  textureScale: number;
}

export interface DeviceTier {
  tier: "low" | "mid" | "high";
  maxDPR: number;
  antialias: boolean;
  shadowsEnabled: boolean;
  textureQuality: number;
  maxObjects: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCalls: number;
  objectCount: number;
}

export interface StageObject {
  id: string;
  position: [number, number, number?];
  rotation?: number | [number, number, number];
  scale?: number | [number, number, number];
  visible?: boolean;
  metadata?: Record<string, any>;
}

export interface StageCoordinates {
  stageX: number;
  stageY: number;
}

export interface StageEvent {
  type: "pointerdown" | "pointermove" | "pointerup" | "click";
  stageX: number;
  stageY: number;
  objectId?: string;
  originalEvent: PointerEvent | MouseEvent;
}

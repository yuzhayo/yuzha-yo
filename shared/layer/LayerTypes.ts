/**
 * LayerTypes.ts (v0.2)
 * Truth source untuk logic library:
 * - Input JSON schema (LibraryConfig)
 * - Normalized types (LibraryConfigNormalized)
 * - Output struct (LayerData)
 * - Processing context untuk pipeline
 */

/* ==============================
 * Basic Types
 * ============================== */

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

export interface Vec2 {
  x: number;
  y: number;
}

/* ==============================
 * Stage Config
 * ============================== */

export interface StageConfig {
  width?: number;
  height?: number;
  origin?: StageOrigin;
}

export interface StageConfigNormalized {
  width: number;
  height: number;
  origin: StageOrigin;
}

/* ==============================
 * Behaviors
 * ============================== */

export interface SpinConfig {
  enabled: boolean;
  rpm: number;
  direction: Direction; // default cw (di validator)
}

export interface OrbitConfig {
  enabled: boolean;
  rpm: number;
  radius: number; // px
  center?: Vec2; // default: base position
}

export interface PulseConfig {
  enabled: boolean;
  amplitude: number; // additional scale (e.g., 0.2)
  rpm: number;
}

export interface FadeConfig {
  enabled: boolean;
  from: number; // 0..1
  to: number; // 0..1
  rpm: number;
}

export interface BehaviorsConfig {
  spin?: Partial<SpinConfig>;
  orbit?: Partial<OrbitConfig>;
  pulse?: Partial<PulseConfig>;
  fade?: Partial<FadeConfig>;
}

export interface BehaviorsConfigNormalized {
  spin: SpinConfig;
  orbit: OrbitConfig;
  pulse: PulseConfig;
  fade: FadeConfig;
}

/* ==============================
 * Events
 * ============================== */

export interface EventActionSpin {
  action: "spin";
  set?: Partial<SpinConfig>;
}
export interface EventActionOrbit {
  action: "orbit";
  set?: Partial<OrbitConfig>;
}
export interface EventActionPulse {
  action: "pulse";
  set?: Partial<PulseConfig>;
}
export interface EventActionFade {
  action: "fade";
  set?: Partial<FadeConfig>;
}

export type EventAction =
  | EventActionSpin
  | EventActionOrbit
  | EventActionPulse
  | EventActionFade;

export interface EventHooks {
  onPress?: EventAction[];
  onHover?: EventAction[];
  onRelease?: EventAction[];
}

/* ==============================
 * Asset
 * ============================== */

export type AssetRef =
  | { type: "path"; path: string }
  | { type: "registry"; key: string };

export interface AssetMeta {
  src: string; // resolved path/URL
  width: number; // px
  height: number; // px
  anchor?: Vec2; // optional pixel or normalized (renderer bebas)
  dpi?: number;
}

/* ==============================
 * Layer Config (Input JSON)
 * ============================== */

export interface LayerConfig {
  layerId: string;
  imagePath?: string;
  registryKey?: string;

  position?: Vec2; // px
  scale?: number | Vec2; // uniform or per-axis
  angle?: number; // deg (Z)
  tilt?: Vec2; // deg (X,Y)
  anchor?: Vec2; // normalized [0..1]
  opacity?: number; // 0..1

  behaviors?: BehaviorsConfig;
  events?: EventHooks;

  layerWidth?: number; // px
  layerHeight?: number; // px
  fitMode?: FitMode;
  alignment?: Alignment;
}

export interface LayerConfigNormalized {
  layerId: string;
  assetRef: AssetRef;

  position: Vec2;
  scale: Vec2;
  angle: number;
  tilt: Vec2;
  anchor: Vec2;
  opacity: number;

  behaviors: BehaviorsConfigNormalized;
  events?: EventHooks;

  container?: {
    width?: number;
    height?: number;
    fitMode: FitMode;
    alignment: Alignment;
  };
}

/* ==============================
 * Root Config
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
 * Output Struct (for renderer)
 * ============================== */

export interface LayerData {
  id: string; // layerId
  zIndex: number; // derived (sorting)
  asset: AssetRef;

  transform: {
    position: Vec2;
    scale: Vec2;
    angle: number; // deg
    tilt: Vec2; // deg
    anchor: Vec2; // normalized [0..1]
    opacity: number; // 0..1
  };

  container?: {
    width?: number;
    height?: number;
    fitMode: FitMode;
    alignment: Alignment;
  };

  behaviors: BehaviorsConfigNormalized;
  events?: EventHooks;

  state: {
    isHovered: boolean;
    isPressed: boolean;
    isActive: boolean;
    isVisible: boolean;
  };
}

/* ==============================
 * Processing Context
 * ============================== */

export interface ProcessingContext {
  stage: StageConfigNormalized;
  time: number; // ms or s (renderer bebas, konsisten saja)
  registry: Map<string, AssetMeta>;
  eventState?: Map<string, LayerData["state"]>;
}

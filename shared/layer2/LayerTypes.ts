/**
 * LayerTypes.ts (layer2 baseline)
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
  direction: Direction;
}

export interface OrbitConfig {
  enabled: boolean;
  rpm: number;
  radius: number;
  center?: Vec2;
}

export interface ClockConfig {
  enabled: boolean;
  mode: "hour" | "minute" | "second";
  speedMultiplier?: number;
}

export interface BehaviorsConfig {
  spin?: Partial<SpinConfig>;
  orbit?: Partial<OrbitConfig>;
  clock?: Partial<ClockConfig>;
}

export interface SpinState {
  enabled: boolean;
  rpm: number;
  direction: Direction;
}

export interface OrbitState {
  enabled: boolean;
  rpm: number;
  radius: number;
  center?: Vec2;
}

export interface ClockState {
  enabled: boolean;
  mode: "hour" | "minute" | "second";
  speedMultiplier: number;
}

export interface BehaviorsConfigNormalized {
  spin: SpinState;
  orbit: OrbitState;
  clock: ClockState;
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
export interface EventActionClock {
  action: "clock";
  set?: Partial<ClockConfig>;
}

export type EventAction = EventActionSpin | EventActionOrbit | EventActionClock;

export interface EventHooks {
  onPress?: EventAction[];
  onHover?: EventAction[];
  onRelease?: EventAction[];
}

/* ==============================
 * Asset
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
 * Layer Config (Input JSON)
 * ============================== */

export interface LayerConfig {
  layerId: string;
  imagePath?: string;
  registryKey?: string;

  position?: Vec2;
  scale?: number | Vec2;
  angle?: number;
  tilt?: Vec2;
  anchor?: Vec2;
  opacity?: number;

  behaviors?: BehaviorsConfig;
  events?: EventHooks;

  layerWidth?: number;
  layerHeight?: number;
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
  time: number;
  registry: Map<string, AssetMeta>;
  eventState?: Map<string, LayerData["state"]>;
}

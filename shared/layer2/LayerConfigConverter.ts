import type {
  ClockConfig,
  ClockState,
  LayerConfig,
  LayerConfigNormalized,
  LibraryConfig,
  OrbitConfig,
  SpinConfig,
  StageConfig,
} from "./LayerTypes";
import registryJson from "./LayerConfigRegistry.json";
interface LayerRegistryFile {
  ASSET_BASE_PATH: string;
  registry: Record<string, string>;
}

const layerRegistryFile = registryJson as LayerRegistryFile;

const resolveRegistryTemplate = (template: string): string =>
  template.replace(/\$\{ASSET_BASE_PATH\}/g, layerRegistryFile.ASSET_BASE_PATH);

export const ASSET_REGISTRY: Record<string, string> = Object.fromEntries(
  Object.entries(layerRegistryFile.registry).map(([key, template]) => [
    key,
    resolveRegistryTemplate(template),
  ]),
);

export type AssetRegistryKey = keyof typeof ASSET_REGISTRY;
export const ASSET_KEYS = Object.keys(ASSET_REGISTRY) as AssetRegistryKey[];

export interface HumanLayerConfig extends Omit<LayerConfig, "imagePath" | "registryKey"> {
  assetKey: AssetRegistryKey;
}

export interface HumanLibraryConfig {
  stage?: StageConfig;
  layers: HumanLayerConfig[];
}

export function humanToRuntimeConfig(config: HumanLibraryConfig): LibraryConfig {
  return {
    stage: config.stage,
    layers: config.layers.map((layer) => {
      const { assetKey, ...rest } = layer;
      return {
        ...rest,
        registryKey: assetKey,
      } as LayerConfig;
    }),
  };
}
export interface AngleOptions {
  wrap?: boolean;
}
export interface RpmOptions {
  min?: number;
  max?: number;
}
export interface ScaleOptions {
  min?: number;
  max?: number;
}
export interface OpacityOptions {
  min?: number;
  max?: number;
}

export interface UILayerControls {
  angle: number;
  tiltX: number;
  tiltY: number;
  opacity: number;
  scale: number;
  spin: Pick<SpinConfig, "enabled" | "rpm" | "direction">;
  orbit: Pick<OrbitConfig, "enabled" | "rpm" | "radius">;
  clock: Pick<ClockConfig, "enabled" | "mode" | "speedMultiplier">;
}

const DEF_RPM: Required<RpmOptions> = { min: 0, max: 60 };
const DEF_SCALE: Required<ScaleOptions> = { min: 0.1, max: 10 };
const DEF_OPACITY: Required<OpacityOptions> = { min: 0, max: 1 };

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const wrap360 = (deg: number) => {
  let r = deg % 360;
  if (r < 0) r += 360;
  return r;
};

export const toUIDeg = (deg: number, opts: AngleOptions = { wrap: true }) =>
  opts.wrap === false ? deg : wrap360(deg);
export const fromUIDeg = (uiDeg: number) => uiDeg;

export const toUIRpm = (rpm: number, opts: RpmOptions = {}) => {
  const { min, max } = { ...DEF_RPM, ...opts };
  return clamp(rpm, min, max);
};
export const fromUIRpm = (ui: number, opts: RpmOptions = {}) => {
  const { min, max } = { ...DEF_RPM, ...opts };
  return clamp(ui, min, max);
};

export const toUIOpacity = (opacity: number, opts: OpacityOptions = {}) => {
  const { min, max } = { ...DEF_OPACITY, ...opts };
  return clamp(opacity, min, max);
};
export const fromUIOpacity = (ui: number, opts: OpacityOptions = {}) => {
  const { min, max } = { ...DEF_OPACITY, ...opts };
  return clamp(ui, min, max);
};

export const toUIScaleUniform = (sx: number, sy: number, opts: ScaleOptions = {}) => {
  const { min, max } = { ...DEF_SCALE, ...opts };
  const avg = (sx + sy) / 2;
  return clamp(avg, min, max);
};
export const fromUIScaleUniform = (ui: number, opts: ScaleOptions = {}) => {
  const { min, max } = { ...DEF_SCALE, ...opts };
  const s = clamp(ui, min, max);
  return { x: s, y: s };
};

export function toUILayerControls(
  layer: LayerConfigNormalized,
  rpmOpts: RpmOptions = {},
  scaleOpts: ScaleOptions = {},
  opacityOpts: OpacityOptions = {},
): UILayerControls {
  return {
    angle: toUIDeg(layer.angle),
    tiltX: toUIDeg(layer.tilt.x),
    tiltY: toUIDeg(layer.tilt.y),
    opacity: toUIOpacity(layer.opacity, opacityOpts),
    scale: toUIScaleUniform(layer.scale.x, layer.scale.y, scaleOpts),
    spin: {
      enabled: layer.behaviors.spin.enabled,
      rpm: toUIRpm(layer.behaviors.spin.rpm, rpmOpts),
      direction: layer.behaviors.spin.direction,
    },
    orbit: {
      enabled: layer.behaviors.orbit.enabled,
      rpm: toUIRpm(layer.behaviors.orbit.rpm, rpmOpts),
      radius: layer.behaviors.orbit.radius,
    },
    clock: {
      enabled: layer.behaviors.clock.enabled,
      mode: layer.behaviors.clock.mode,
      speedMultiplier: layer.behaviors.clock.speedMultiplier ?? 1,
    },
  };
}

export function fromUILayerControls(
  base: LayerConfigNormalized,
  ui: Partial<UILayerControls>,
  rpmOpts: RpmOptions = {},
  scaleOpts: ScaleOptions = {},
  opacityOpts: OpacityOptions = {},
): LayerConfigNormalized {
  const angle = ui.angle !== undefined ? fromUIDeg(ui.angle) : base.angle;
  const tiltX = ui.tiltX !== undefined ? fromUIDeg(ui.tiltX) : base.tilt.x;
  const tiltY = ui.tiltY !== undefined ? fromUIDeg(ui.tiltY) : base.tilt.y;
  const opacity = ui.opacity !== undefined ? fromUIOpacity(ui.opacity, opacityOpts) : base.opacity;

  const uniform = ui.scale !== undefined ? fromUIScaleUniform(ui.scale, scaleOpts) : base.scale;

  const spin: SpinConfig = {
    enabled: ui.spin?.enabled ?? base.behaviors.spin.enabled,
    rpm: ui.spin?.rpm !== undefined ? fromUIRpm(ui.spin.rpm, rpmOpts) : base.behaviors.spin.rpm,
    direction: ui.spin?.direction ?? base.behaviors.spin.direction,
  };

  const orbit: OrbitConfig = {
    enabled: ui.orbit?.enabled ?? base.behaviors.orbit.enabled,
    rpm: ui.orbit?.rpm !== undefined ? fromUIRpm(ui.orbit.rpm, rpmOpts) : base.behaviors.orbit.rpm,
    radius: ui.orbit?.radius !== undefined ? ui.orbit.radius : base.behaviors.orbit.radius,
    center: base.behaviors.orbit.center,
  };

  const clock: ClockState = {
    enabled: ui.clock?.enabled ?? base.behaviors.clock.enabled,
    mode: ui.clock?.mode ?? base.behaviors.clock.mode,
    speedMultiplier:
      ui.clock?.speedMultiplier !== undefined
        ? Math.max(0.01, ui.clock.speedMultiplier)
        : base.behaviors.clock.speedMultiplier,
  };

  return {
    ...base,
    angle,
    tilt: { x: tiltX, y: tiltY },
    opacity,
    scale: { x: uniform.x, y: uniform.y },
    behaviors: {
      spin,
      orbit,
      clock,
    },
  };
}

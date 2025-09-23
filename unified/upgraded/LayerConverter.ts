/**
 * LayerConverter.ts (final)
 * - Converter JSON ⇄ UI values (deg↔slider, rpm↔speed, opacity 0–1, scale 0.1–10).
 * - Tidak dipakai di runtime pipeline (khusus editor/Config Screen).
 * - Bekerja di atas *normalized* model agar UI konsisten: LayerConfigNormalized.
 */

import type {
  FadeConfig,
  OrbitConfig,
  PulseConfig,
  SpinConfig,
  LayerConfigNormalized,
} from "./LayerTypes";

/* ==============================
 * UI Control Models & Options
 * ============================== */

export interface AngleOptions {
  wrap?: boolean; // default true, wrap to [0..360)
}
export interface RpmOptions {
  min?: number; // default 0
  max?: number; // default 60
}
export interface ScaleOptions {
  min?: number; // default 0.1
  max?: number; // default 10
}
export interface OpacityOptions {
  min?: number; // default 0
  max?: number; // default 1
}

/**
 * Snapshot nilai yang ramah editor/slider.
 * Catatan:
 * - UI pakai uniform scale (single knob). Balikannya kita pecah jadi {x,y} uniform.
 * - tilt dipisah tiltX/tiltY (deg) biar mudah buat slider 0..360.
 */
export interface UILayerControls {
  angle: number; // deg 0..360
  tiltX: number; // deg 0..360
  tiltY: number; // deg 0..360
  opacity: number; // 0..1
  scale: number; // uniform control 0.1..10

  spin: Pick<SpinConfig, "enabled" | "rpm" | "direction">;
  orbit: Pick<OrbitConfig, "enabled" | "rpm" | "radius">;
  pulse: Pick<PulseConfig, "enabled" | "amplitude" | "rpm">;
  fade: Pick<FadeConfig, "enabled" | "from" | "to" | "rpm">;
}

/* ==============================
 * Helpers
 * ============================== */

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

/* ==============================
 * JSON (normalized) → UI controls
 * ============================== */

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
    pulse: {
      enabled: layer.behaviors.pulse.enabled,
      amplitude: layer.behaviors.pulse.amplitude,
      rpm: toUIRpm(layer.behaviors.pulse.rpm, rpmOpts),
    },
    fade: {
      enabled: layer.behaviors.fade.enabled,
      from: toUIOpacity(layer.behaviors.fade.from, { min: 0, max: 1 }),
      to: toUIOpacity(layer.behaviors.fade.to, { min: 0, max: 1 }),
      rpm: toUIRpm(layer.behaviors.fade.rpm, rpmOpts),
    },
  };
}

/* ==============================
 * UI controls → JSON (normalized)
 * ============================== */

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
    center: base.behaviors.orbit.center, // default: tidak diedit via UI sederhana
  };

  const pulse: PulseConfig = {
    enabled: ui.pulse?.enabled ?? base.behaviors.pulse.enabled,
    amplitude:
      ui.pulse?.amplitude !== undefined ? ui.pulse.amplitude : base.behaviors.pulse.amplitude,
    rpm: ui.pulse?.rpm !== undefined ? fromUIRpm(ui.pulse.rpm, rpmOpts) : base.behaviors.pulse.rpm,
  };

  const fade: FadeConfig = {
    enabled: ui.fade?.enabled ?? base.behaviors.fade.enabled,
    from:
      ui.fade?.from !== undefined
        ? fromUIOpacity(ui.fade.from, { min: 0, max: 1 })
        : base.behaviors.fade.from,
    to:
      ui.fade?.to !== undefined
        ? fromUIOpacity(ui.fade.to, { min: 0, max: 1 })
        : base.behaviors.fade.to,
    rpm: ui.fade?.rpm !== undefined ? fromUIRpm(ui.fade.rpm, rpmOpts) : base.behaviors.fade.rpm,
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
      pulse,
      fade,
    },
  };
}

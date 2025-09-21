// /shared/logic/LayerValidator.ts
// Validate + normalize LibraryConfig → LibraryConfigNormalized
// ES2020+, side-effect free

import type {
  Alignment,
  AssetRef,
  BehaviorsConfig,
  BehaviorsConfigNormalized,
  EventAction,
  EventHooks,
  FitMode,
  LibraryConfig,
  LibraryConfigNormalized,
  LayerConfig,
  LayerConfigNormalized,
  StageConfigNormalized,
  StageOrigin,
  Vec2,
} from "./LayerTypes";

// ---------- Defaults ----------
const DEFAULT_STAGE: StageConfigNormalized = {
  width: 2048,
  height: 2048,
  origin: "center",
};

const DEFAULT_ANCHOR: Vec2 = { x: 0.5, y: 0.5 };
const DEFAULT_POSITION: Vec2 = { x: 0, y: 0 };
const DEFAULT_TILT: Vec2 = { x: 0, y: 0 };
const DEFAULT_SCALE: Vec2 = { x: 1, y: 1 };
const DEFAULT_OPACITY = 1;

const DEFAULT_BEHAVIORS: BehaviorsConfigNormalized = {
  spin: { enabled: false, rpm: 0, direction: "cw" },
  orbit: { enabled: false, rpm: 0, radius: 0 },
  pulse: { enabled: false, amplitude: 0, rpm: 0 },
  fade: { enabled: false, from: 1, to: 1, rpm: 0 },
};

// ---------- Types ----------
export type Severity = "error" | "warning";
export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
  severity: Severity;
}
export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  normalized?: LibraryConfigNormalized;
}

// ---------- Guards/Helpers ----------
const isNum = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);
const isVec2 = (v: unknown): v is Vec2 =>
  !!v && typeof v === "object" && isNum((v as any).x) && isNum((v as any).y);

const isFitMode = (m: unknown): m is FitMode =>
  m === "contain" || m === "cover" || m === "stretch";

const isAlignment = (a: unknown): a is Alignment =>
  a === "center" ||
  a === "top-left" ||
  a === "top" ||
  a === "top-right" ||
  a === "left" ||
  a === "right" ||
  a === "bottom-left" ||
  a === "bottom" ||
  a === "bottom-right";

const isOrigin = (o: unknown): o is StageOrigin =>
  o === "center" || o === "top-left";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const normalizeScale = (scale: LayerConfig["scale"]): Vec2 => {
  if (typeof scale === "number" && isNum(scale)) return { x: scale, y: scale };
  if (isVec2(scale)) return { x: scale.x, y: scale.y };
  return DEFAULT_SCALE;
};

const toAssetRef = (layer: LayerConfig): AssetRef | null => {
  const hasPath =
    typeof layer.imagePath === "string" && layer.imagePath.length > 0;
  const hasKey =
    typeof layer.registryKey === "string" && layer.registryKey.length > 0;
  if (hasPath && hasKey) return null; // conflict
  if (!hasPath && !hasKey) return null; // missing
  return hasPath
    ? { type: "path", path: layer.imagePath! }
    : { type: "registry", key: layer.registryKey! };
};

const normalizeBehaviors = (
  b?: BehaviorsConfig,
): BehaviorsConfigNormalized => ({
  spin: {
    enabled: b?.spin?.enabled ?? DEFAULT_BEHAVIORS.spin.enabled,
    rpm: isNum(b?.spin?.rpm)
      ? (b!.spin!.rpm as number)
      : DEFAULT_BEHAVIORS.spin.rpm,
    direction: b?.spin?.direction ?? "cw",
  },
  orbit: {
    enabled: b?.orbit?.enabled ?? DEFAULT_BEHAVIORS.orbit.enabled,
    rpm: isNum(b?.orbit?.rpm)
      ? (b!.orbit!.rpm as number)
      : DEFAULT_BEHAVIORS.orbit.rpm,
    radius: isNum(b?.orbit?.radius)
      ? (b!.orbit!.radius as number)
      : DEFAULT_BEHAVIORS.orbit.radius,
    center:
      b?.orbit?.center && isVec2(b.orbit.center) ? b.orbit.center : undefined,
  },
  pulse: {
    enabled: b?.pulse?.enabled ?? DEFAULT_BEHAVIORS.pulse.enabled,
    amplitude: isNum(b?.pulse?.amplitude)
      ? (b!.pulse!.amplitude as number)
      : DEFAULT_BEHAVIORS.pulse.amplitude,
    rpm: isNum(b?.pulse?.rpm)
      ? (b!.pulse!.rpm as number)
      : DEFAULT_BEHAVIORS.pulse.rpm,
  },
  fade: {
    enabled: b?.fade?.enabled ?? DEFAULT_BEHAVIORS.fade.enabled,
    from: isNum(b?.fade?.from)
      ? clamp01(b!.fade!.from as number)
      : DEFAULT_BEHAVIORS.fade.from,
    to: isNum(b?.fade?.to)
      ? clamp01(b!.fade!.to as number)
      : DEFAULT_BEHAVIORS.fade.to,
    rpm: isNum(b?.fade?.rpm)
      ? (b!.fade!.rpm as number)
      : DEFAULT_BEHAVIORS.fade.rpm,
  },
});

// validate & normalize event hooks; push issues ke arrays referensi yang asli
function validateEvents(
  hooks: EventHooks | undefined,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
  basePath: string,
): EventHooks {
  const out: EventHooks = {};
  const keys: Array<keyof EventHooks> = ["onPress", "onHover", "onRelease"];

  for (const k of keys) {
    const list = hooks?.[k];
    if (!list) continue;
    if (!Array.isArray(list)) {
      errors.push({
        code: "events.invalid",
        path: `${basePath}.${k}`,
        message: "must be an array",
        severity: "error",
      });
      continue;
    }
    const normalized: EventAction[] = [];
    list.forEach((entry, idx) => {
      const path = `${basePath}.${k}[${idx}]`;
      const action = (entry as any)?.action;
      if (
        action !== "spin" &&
        action !== "orbit" &&
        action !== "pulse" &&
        action !== "fade"
      ) {
        errors.push({
          code: "events.action.unknown",
          path,
          message: `unknown action "${action}" (spin|orbit|pulse|fade)`,
          severity: "error",
        });
        return;
      }
      const set = (entry as any)?.set;
      if (set && typeof set !== "object") {
        errors.push({
          code: "events.set.invalid",
          path,
          message: "set must be an object",
          severity: "error",
        });
        return;
      }
      // light checks per action (numeric/boolean shape)
      if (set?.rpm !== undefined && !isNum(set.rpm)) {
        errors.push({
          code: "events.set.rpm",
          path,
          message: "rpm must be number",
          severity: "error",
        });
      }
      if (set?.enabled !== undefined && typeof set.enabled !== "boolean") {
        errors.push({
          code: "events.set.enabled",
          path,
          message: "enabled must be boolean",
          severity: "error",
        });
      }
      if (
        action === "spin" &&
        set?.direction &&
        set.direction !== "cw" &&
        set.direction !== "ccw"
      ) {
        errors.push({
          code: "events.set.direction",
          path,
          message: 'direction must be "cw"|"ccw"',
          severity: "error",
        });
      }
      if (action === "orbit") {
        if (set?.radius !== undefined && !isNum(set.radius)) {
          errors.push({
            code: "events.set.radius",
            path,
            message: "radius must be number",
            severity: "error",
          });
        }
        if (set?.center !== undefined && !isVec2(set.center)) {
          errors.push({
            code: "events.set.center",
            path,
            message: "center must be {x,y}",
            severity: "error",
          });
        }
      }
      if (
        action === "pulse" &&
        set?.amplitude !== undefined &&
        !isNum(set.amplitude)
      ) {
        errors.push({
          code: "events.set.amplitude",
          path,
          message: "amplitude must be number",
          severity: "error",
        });
      }
      if (action === "fade") {
        if (set?.from !== undefined && !isNum(set.from)) {
          errors.push({
            code: "events.set.from",
            path,
            message: "from must be number",
            severity: "error",
          });
        }
        if (set?.to !== undefined && !isNum(set.to)) {
          errors.push({
            code: "events.set.to",
            path,
            message: "to must be number",
            severity: "error",
          });
        }
      }
      normalized.push(entry as EventAction);
    });
    (out as any)[k] = normalized;
  }
  return out;
}

// ---------- Main ----------
export function validateLibraryConfig(input: LibraryConfig): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Stage
  const stage: StageConfigNormalized = {
    width:
      isNum(input.stage?.width) && input.stage!.width! > 0
        ? input.stage!.width!
        : DEFAULT_STAGE.width,
    height:
      isNum(input.stage?.height) && input.stage!.height! > 0
        ? input.stage!.height!
        : DEFAULT_STAGE.height,
    origin: isOrigin(input.stage?.origin)
      ? input.stage!.origin!
      : DEFAULT_STAGE.origin,
  };
  if (input.stage?.origin !== undefined && !isOrigin(input.stage.origin)) {
    warnings.push({
      code: "stage.origin.invalid",
      path: "stage.origin",
      message: `unknown origin "${String(input.stage.origin)}", fallback to "${DEFAULT_STAGE.origin}"`,
      severity: "warning",
    });
  }

  // Layers
  if (!Array.isArray(input.layers)) {
    errors.push({
      code: "layers.missing",
      path: "layers",
      message: "layers must be an array",
      severity: "error",
    });
    return { ok: false, errors, warnings };
  }

  const seen = new Set<string>();
  const normalizedLayers: LayerConfigNormalized[] = [];

  input.layers.forEach((layer, idx) => {
    const base = `layers[${idx}]`;

    // id
    if (
      !layer ||
      typeof layer !== "object" ||
      typeof layer.layerId !== "string" ||
      layer.layerId.length === 0
    ) {
      errors.push({
        code: "layer.id.missing",
        path: `${base}.layerId`,
        message: "layerId required",
        severity: "error",
      });
      return;
    }
    if (seen.has(layer.layerId)) {
      errors.push({
        code: "layer.id.duplicate",
        path: `${base}.layerId`,
        message: `duplicate "${layer.layerId}"`,
        severity: "error",
      });
      return;
    }
    seen.add(layer.layerId);

    // asset
    const assetRef = toAssetRef(layer);
    if (!assetRef) {
      const both = !!layer.imagePath && !!layer.registryKey;
      errors.push({
        code: "layer.asset.invalid",
        path: base,
        message: both
          ? "imagePath and registryKey are mutually exclusive"
          : "one of imagePath or registryKey is required",
        severity: "error",
      });
      return;
    }

    // transforms (defaults)
    const position = isVec2(layer.position)
      ? layer.position!
      : DEFAULT_POSITION;
    const scale = normalizeScale(layer.scale);
    const angle = isNum(layer.angle) ? (layer.angle as number) : 0;
    const tilt = isVec2(layer.tilt) ? layer.tilt! : DEFAULT_TILT;
    const anchor = isVec2(layer.anchor) ? layer.anchor! : DEFAULT_ANCHOR;
    const opacity = isNum(layer.opacity)
      ? (layer.opacity as number)
      : DEFAULT_OPACITY;

    if (opacity < 0 || opacity > 1) {
      warnings.push({
        code: "layer.opacity.range",
        path: `${base}.opacity`,
        message: "opacity should be within [0,1]",
        severity: "warning",
      });
    }
    if (anchor.x < 0 || anchor.x > 1 || anchor.y < 0 || anchor.y > 1) {
      warnings.push({
        code: "layer.anchor.range",
        path: `${base}.anchor`,
        message: "anchor should be [0..1]",
        severity: "warning",
      });
    }

    // container
    const width = isNum(layer.layerWidth)
      ? (layer.layerWidth as number)
      : undefined;
    const height = isNum(layer.layerHeight)
      ? (layer.layerHeight as number)
      : undefined;
    const fitMode = layer.fitMode;
    const alignment = layer.alignment;

    if (fitMode !== undefined && !isFitMode(fitMode)) {
      errors.push({
        code: "layer.fit.invalid",
        path: `${base}.fitMode`,
        message: "fitMode must be contain|cover|stretch",
        severity: "error",
      });
    }
    if (alignment !== undefined && !isAlignment(alignment)) {
      errors.push({
        code: "layer.alignment.invalid",
        path: `${base}.alignment`,
        message: "invalid alignment",
        severity: "error",
      });
    }
    if (
      (fitMode !== undefined || alignment !== undefined) &&
      (!width || !height)
    ) {
      errors.push({
        code: "layer.container.missing",
        path: base,
        message: "fitMode/alignment requires layerWidth and layerHeight",
        severity: "error",
      });
    }
    if (
      (width !== undefined && width <= 0) ||
      (height !== undefined && height <= 0)
    ) {
      errors.push({
        code: "layer.container.nonPositive",
        path: base,
        message: "layerWidth/layerHeight must be positive numbers",
        severity: "error",
      });
    }

    // behaviors
    const behaviors = normalizeBehaviors(layer.behaviors);
    if (behaviors.orbit.radius < 0 || behaviors.orbit.rpm < 0) {
      warnings.push({
        code: "behavior.orbit.range",
        path: `${base}.behaviors.orbit`,
        message: "rpm & radius should be >= 0",
        severity: "warning",
      });
    }
    if (behaviors.spin.rpm < 0) {
      warnings.push({
        code: "behavior.spin.range",
        path: `${base}.behaviors.spin.rpm`,
        message: "rpm should be >= 0",
        severity: "warning",
      });
    }
    if (behaviors.pulse.rpm < 0 || behaviors.pulse.amplitude < 0) {
      warnings.push({
        code: "behavior.pulse.range",
        path: `${base}.behaviors.pulse`,
        message: "rpm & amplitude should be >= 0",
        severity: "warning",
      });
    }
    if (behaviors.fade.rpm < 0) {
      warnings.push({
        code: "behavior.fade.range",
        path: `${base}.behaviors.fade.rpm`,
        message: "rpm should be >= 0",
        severity: "warning",
      });
    }

    // events
    const events = validateEvents(
      layer.events,
      errors,
      warnings,
      `${base}.events`,
    );

    // pack normalized
    const normalized: LayerConfigNormalized = {
      layerId: layer.layerId,
      assetRef,
      position,
      scale,
      angle,
      tilt,
      anchor,
      opacity,
      behaviors,
      events,
      container:
        width || height || fitMode || alignment
          ? {
              width,
              height,
              fitMode: fitMode as FitMode,
              alignment: alignment as Alignment,
            }
          : undefined,
    };

    normalizedLayers.push(normalized);
  });

  const ok = errors.length === 0;
  return ok
    ? {
        ok: true,
        errors,
        warnings,
        normalized: { stage, layers: normalizedLayers },
      }
    : { ok: false, errors, warnings };
}

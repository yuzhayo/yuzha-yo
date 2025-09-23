import type {
  Alignment,
  AssetRef,
  BehaviorsConfig,
  BehaviorsConfigNormalized,
  ClockConfig,
  EventAction,
  EventHooks,
  FitMode,
  LibraryConfig,
  LibraryConfigNormalized,
  LayerConfig,
  LayerConfigNormalized,
  OrbitConfig,
  StageConfigNormalized,
  StageOrigin,
  SpinConfig,
  Vec2,
} from "./LayerTypes";
import registryJson from "./LayerConfigRegistry.json";

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
  clock: { enabled: false, mode: "second", speedMultiplier: 1 },
};

interface LayerRegistryFile {
  ASSET_BASE_PATH: string;
  registry: Record<string, string>;
}

const layerRegistryFile = registryJson as LayerRegistryFile;
const REGISTRY_KEYS = new Set(Object.keys(layerRegistryFile.registry));

const resolveRegistryPath = (key: string): string | undefined => {
  const template = layerRegistryFile.registry[key];
  return template
    ? template.replace(/\$\{ASSET_BASE_PATH\}/g, layerRegistryFile.ASSET_BASE_PATH)
    : undefined;
};

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

const isNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const isVec2 = (v: unknown): v is Vec2 =>
  !!v && typeof v === "object" && isNum((v as any).x) && isNum((v as any).y);

const isFitMode = (m: unknown): m is FitMode => m === "contain" || m === "cover" || m === "stretch";

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

const isOrigin = (o: unknown): o is StageOrigin => o === "center" || o === "top-left";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const normalizeScale = (scale: LayerConfig["scale"]): Vec2 => {
  if (typeof scale === "number" && isNum(scale)) return { x: scale, y: scale };
  if (isVec2(scale)) return { x: scale.x, y: scale.y };
  return DEFAULT_SCALE;
};

const toAssetRef = (layer: LayerConfig): AssetRef | null => {
  const hasPath = typeof layer.imagePath === "string" && layer.imagePath.length > 0;
  const hasKey = typeof layer.registryKey === "string" && layer.registryKey.length > 0;
  if (hasPath && hasKey) return null;
  if (!hasPath && !hasKey) return null;
  return hasPath
    ? { type: "path", path: layer.imagePath! }
    : { type: "registry", key: layer.registryKey! };
};

const normalizeSpin = (spin?: Partial<SpinConfig>): BehaviorsConfigNormalized["spin"] => ({
  enabled: spin?.enabled ?? DEFAULT_BEHAVIORS.spin.enabled,
  rpm: isNum(spin?.rpm) ? (spin!.rpm as number) : DEFAULT_BEHAVIORS.spin.rpm,
  direction: spin?.direction ?? DEFAULT_BEHAVIORS.spin.direction,
});

const normalizeOrbit = (orbit?: Partial<OrbitConfig>): BehaviorsConfigNormalized["orbit"] => ({
  enabled: orbit?.enabled ?? DEFAULT_BEHAVIORS.orbit.enabled,
  rpm: isNum(orbit?.rpm) ? (orbit!.rpm as number) : DEFAULT_BEHAVIORS.orbit.rpm,
  radius: isNum(orbit?.radius) ? (orbit!.radius as number) : DEFAULT_BEHAVIORS.orbit.radius,
  center: orbit?.center && isVec2(orbit.center) ? { ...orbit.center } : undefined,
});

const normalizeClock = (clock?: Partial<ClockConfig>): BehaviorsConfigNormalized["clock"] => ({
  enabled: clock?.enabled ?? DEFAULT_BEHAVIORS.clock.enabled,
  mode: clock?.mode ?? DEFAULT_BEHAVIORS.clock.mode,
  speedMultiplier: isNum(clock?.speedMultiplier)
    ? (clock!.speedMultiplier as number)
    : DEFAULT_BEHAVIORS.clock.speedMultiplier,
});

const normalizeBehaviors = (behaviors?: BehaviorsConfig): BehaviorsConfigNormalized => ({
  spin: normalizeSpin(behaviors?.spin),
  orbit: normalizeOrbit(behaviors?.orbit),
  clock: normalizeClock(behaviors?.clock),
});

const validateEvents = (
  hooks: EventHooks | undefined,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
  basePath: string,
): EventHooks | undefined => {
  if (!hooks) return undefined;
  const validateArray = (arr: EventAction[] | undefined, path: string) => {
    if (!arr) return undefined;
    return arr.filter((action, idx) => {
      if (!action || typeof action !== "object") {
        warnings.push({
          code: "event.invalid",
          path: `${path}[${idx}]`,
          message: "event action must be object",
          severity: "warning",
        });
        return false;
      }
      if (action.action === "spin" && action.set) {
        const rpm = action.set.rpm;
        if (rpm !== undefined && !isNum(rpm)) {
          warnings.push({
            code: "event.spin.rpm.invalid",
            path: `${path}[${idx}].set.rpm`,
            message: "spin rpm must be finite number",
            severity: "warning",
          });
          delete (action.set as Partial<SpinConfig>).rpm;
        }
      }
      if (action.action === "orbit" && action.set) {
        const radius = action.set.radius;
        if (radius !== undefined && (!isNum(radius) || radius < 0)) {
          warnings.push({
            code: "event.orbit.radius.invalid",
            path: `${path}[${idx}].set.radius`,
            message: "orbit radius must be >= 0",
            severity: "warning",
          });
          delete (action.set as Partial<OrbitConfig>).radius;
        }
      }
      if (action.action === "clock" && action.set) {
        const speed = action.set.speedMultiplier;
        if (speed !== undefined && (!isNum(speed) || speed <= 0)) {
          warnings.push({
            code: "event.clock.speed.invalid",
            path: `${path}[${idx}].set.speedMultiplier`,
            message: "clock speedMultiplier must be > 0",
            severity: "warning",
          });
          delete (action.set as Partial<ClockConfig>).speedMultiplier;
        }
      }
      return true;
    });
  };

  return {
    onPress: validateArray(hooks.onPress, `${basePath}.onPress`),
    onHover: validateArray(hooks.onHover, `${basePath}.onHover`),
    onRelease: validateArray(hooks.onRelease, `${basePath}.onRelease`),
  };
};

export function validateLibraryConfig(input: LibraryConfig): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!input || typeof input !== "object") {
    return {
      ok: false,
      errors: [
        {
          code: "root.invalid",
          path: "root",
          message: "input must be an object",
          severity: "error",
        },
      ],
      warnings: [],
    };
  }

  const stage: StageConfigNormalized = {
    width: isNum(input.stage?.width) ? (input.stage!.width as number) : DEFAULT_STAGE.width,
    height: isNum(input.stage?.height) ? (input.stage!.height as number) : DEFAULT_STAGE.height,
    origin:
      input.stage?.origin && isOrigin(input.stage.origin)
        ? input.stage.origin
        : DEFAULT_STAGE.origin,
  };

  if (stage.width <= 0 || stage.height <= 0) {
    errors.push({
      code: "stage.dimensions.invalid",
      path: "stage",
      message: "stage width/height must be positive",
      severity: "error",
    });
  }

  if (!Array.isArray(input.layers)) {
    errors.push({
      code: "layers.invalid",
      path: "layers",
      message: "layers must be an array",
      severity: "error",
    });
    return { ok: false, errors, warnings };
  }

  const normalizedLayers: LayerConfigNormalized[] = [];

  input.layers.forEach((layer, index) => {
    const base = `layers[${index}]`;

    if (!layer || typeof layer !== "object") {
      errors.push({
        code: "layer.invalid",
        path: base,
        message: "layer must be an object",
        severity: "error",
      });
      return;
    }

    if (!layer.layerId || typeof layer.layerId !== "string") {
      errors.push({
        code: "layer.id.missing",
        path: `${base}.layerId`,
        message: "layerId must be string",
        severity: "error",
      });
      return;
    }

    const assetRef = toAssetRef(layer);
    if (!assetRef) {
      errors.push({
        code: "layer.asset.invalid",
        path: `${base}.imagePath|registryKey`,
        message: "provide either imagePath or registryKey",
        severity: "error",
      });
      return;
    }

    if (assetRef.type === "registry") {
      if (!REGISTRY_KEYS.has(assetRef.key)) {
        errors.push({
          code: "layer.asset.registryMissing",
          path: `${base}.registryKey`,
          message: `registryKey "${assetRef.key}" not found in LayerConfigRegistry.json`,
          severity: "error",
        });
        return;
      }
      // Ensure key resolves to a real path (defensive)
      resolveRegistryPath(assetRef.key);
    }

    const position = isVec2(layer.position) ? { ...layer.position } : DEFAULT_POSITION;
    const tilt = isVec2(layer.tilt) ? { ...layer.tilt } : DEFAULT_TILT;
    const anchor = isVec2(layer.anchor)
      ? { x: clamp01(layer.anchor.x), y: clamp01(layer.anchor.y) }
      : DEFAULT_ANCHOR;
    const scale = normalizeScale(layer.scale);
    const angle = isNum(layer.angle) ? (layer.angle as number) : 0;
    const opacity = isNum(layer.opacity) ? clamp01(layer.opacity as number) : DEFAULT_OPACITY;

    const width = isNum(layer.layerWidth) ? (layer.layerWidth as number) : undefined;
    const height = isNum(layer.layerHeight) ? (layer.layerHeight as number) : undefined;
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
    if ((fitMode !== undefined || alignment !== undefined) && (!width || !height)) {
      errors.push({
        code: "layer.container.missing",
        path: base,
        message: "fitMode/alignment requires layerWidth and layerHeight",
        severity: "error",
      });
    }
    if ((width !== undefined && width <= 0) || (height !== undefined && height <= 0)) {
      errors.push({
        code: "layer.container.nonPositive",
        path: base,
        message: "layerWidth/layerHeight must be positive numbers",
        severity: "error",
      });
    }

    const behaviors = normalizeBehaviors(layer.behaviors);

    if (behaviors.orbit.radius < 0 || behaviors.orbit.rpm < 0) {
      warnings.push({
        code: "behavior.orbit.range",
        path: `${base}.behaviors.orbit`,
        message: "orbit radius & rpm should be >= 0",
        severity: "warning",
      });
    }
    if (behaviors.spin.rpm < 0) {
      warnings.push({
        code: "behavior.spin.range",
        path: `${base}.behaviors.spin.rpm`,
        message: "spin rpm should be >= 0",
        severity: "warning",
      });
    }
    if (behaviors.clock.speedMultiplier !== undefined && behaviors.clock.speedMultiplier <= 0) {
      warnings.push({
        code: "behavior.clock.speed",
        path: `${base}.behaviors.clock.speedMultiplier`,
        message: "clock speedMultiplier should be > 0",
        severity: "warning",
      });
      behaviors.clock.speedMultiplier = Math.max(0.01, Math.abs(behaviors.clock.speedMultiplier));
    }

    const events = validateEvents(layer.events, errors, warnings, `${base}.events`);

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

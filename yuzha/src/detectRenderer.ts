export type RendererMode = "auto" | "pixi" | "dom";

export type RendererAvailability = {
  pixi?: boolean;
  dom?: boolean;
};

type DetectedBase = {
  via: "explicit" | "override" | "auto" | "fallback";
  fallbackFrom?: RendererMode;
};

export type DetectedRenderer =
  | (DetectedBase & { kind: "pixi" | "dom" })
  | (DetectedBase & { kind: "static"; reason: string });

function getOverride(): "pixi" | "dom" | null {
  if (typeof window === "undefined") return null;
  try {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("renderer");
    if (q === "pixi" || q === "dom") return q;
  } catch {}
  try {
    const ls = window.localStorage.getItem("renderer");
    if (ls === "pixi" || ls === "dom") return ls;
  } catch {}
  return null;
}

function makeStatic(reason: string, fallbackFrom?: RendererMode): DetectedRenderer {
  return { kind: "static", via: "fallback", fallbackFrom, reason };
}

export function detectRenderer(
  mode: RendererMode = "auto",
  availability: RendererAvailability = {},
): DetectedRenderer {
  const hasPixi = availability.pixi ?? false;
  const hasDom = availability.dom ?? false;

  const resolveExplicit = (
    target: "pixi" | "dom",
    via: DetectedRenderer["via"],
  ): DetectedRenderer => {
    if (target === "pixi" && hasPixi) return { kind: "pixi", via };
    if (target === "dom" && hasDom) return { kind: "dom", via };
    if (target === "pixi" && hasDom) return { kind: "dom", via: "fallback", fallbackFrom: "pixi" };
    if (target === "dom" && hasPixi) return { kind: "pixi", via: "fallback", fallbackFrom: "dom" };
    return makeStatic(`${target.toUpperCase()} renderer not bundled`, target);
  };

  if (mode === "pixi") return resolveExplicit("pixi", "explicit");
  if (mode === "dom") return resolveExplicit("dom", "explicit");

  const override = getOverride();
  if (override === "pixi") {
    const res = resolveExplicit("pixi", "override");
    if (res.kind === "pixi") return res;
    if (res.kind === "dom" && res.via === "fallback") return res;
  } else if (override === "dom") {
    const res = resolveExplicit("dom", "override");
    if (res.kind === "dom") return res;
    if (res.kind === "pixi" && res.via === "fallback") return res;
  }

  if (hasPixi) return { kind: "pixi", via: "auto" };
  if (hasDom) return { kind: "dom", via: "auto" };

  return makeStatic("No renderer registered");
}

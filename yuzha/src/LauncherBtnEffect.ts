import type { CSSProperties } from "react";

export type LauncherBtnEffectKind = "none" | "fade" | "pulse" | "glow";

export type LauncherBtnEffectConfig = {
  kind?: LauncherBtnEffectKind;
  intensity?: number;
};

export type LauncherBtnEffectState = {
  open: boolean;
  hovering?: boolean;
  pressing?: boolean;
};

export type LauncherBtnVisual = {
  panelClass: string;
  panelStyle?: CSSProperties;
  buttonClass: string;
  buttonStyle?: CSSProperties;
  badgeClass: string;
};

export function useLauncherBtnEffect(
  state: LauncherBtnEffectState,
  cfg?: LauncherBtnEffectConfig,
): LauncherBtnVisual {
  const kind = cfg?.kind ?? "none";

  const basePanel: string[] = ["launcher-panel"];
  const panelStyle: CSSProperties = {};

  if (kind === "fade") {
    basePanel.push(state.open ? "launcher-panel--fade-open" : "launcher-panel--fade-closed");
  }

  if (kind === "glow") {
    basePanel.push("launcher-panel--glow");
    if (state.open) panelStyle.boxShadow = "0 24px 48px rgba(236,72,153,0.28)";
  }

  if (kind === "pulse" && state.open) {
    panelStyle.animation = "pulse 1.6s ease-in-out infinite";
  }

  const buttonStyle: CSSProperties | undefined = state.pressing
    ? { transform: "translateY(1px) scale(0.98)" }
    : undefined;

  return {
    panelClass: basePanel.join(" "),
    panelStyle: Object.keys(panelStyle).length > 0 ? panelStyle : undefined,
    buttonClass: "launcher-button",
    buttonStyle,
    badgeClass: "launcher-badge",
  };
}

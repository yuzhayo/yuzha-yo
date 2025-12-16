/**
 * MainScreenUtils.tsx - Unified MainScreen Component System (Simplified)
 *
 * Organized into isolated blocks:
 * 🔴 CRITICAL - Core functionality (DO NOT DELETE)
 * 🟡 OPTIONAL - UI features (safe to remove)
 * 🟢 UTILITY - Helper functions (safe to remove)
 */

import React from "react";
import type { CSSProperties } from "react";

// ===================================================================
// 🔴 BLOCK 1: STAGE CONSTANTS
// ===================================================================

/** Stage dimensions - 2048×2048 coordinate system */
export const STAGE_WIDTH = 2048;
export const STAGE_HEIGHT = 2048;
export const STAGE_CENTER_X = 1024;
export const STAGE_CENTER_Y = 1024;

/** Stage quadrants for positioning reference */
export const STAGE_QUADRANTS = {
  TOP_LEFT: { x: 0, y: 0, width: 1024, height: 1024 },
  TOP_RIGHT: { x: 1024, y: 0, width: 1024, height: 1024 },
  BOTTOM_LEFT: { x: 0, y: 1024, width: 1024, height: 1024 },
  BOTTOM_RIGHT: { x: 1024, y: 1024, width: 1024, height: 1024 },
} as const;

/** Common positioning zones within 2048×2048 stage */
export const STAGE_ZONES = {
  CENTER: { x: 1024, y: 1024 },
  TOP_CENTER: { x: 1024, y: 256 },
  BOTTOM_CENTER: { x: 1024, y: 1792 },
  LEFT_CENTER: { x: 256, y: 1024 },
  RIGHT_CENTER: { x: 1792, y: 1024 },
} as const;

// ===================================================================
// 🔴 BLOCK 2: TYPE DEFINITIONS
// ===================================================================

export type MainScreenBtnGestureOptions = {
  holdMs?: number;
  moveTolerancePx?: number;
};

export type MainScreenBtnGesture = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  bindTargetProps: () => React.HTMLAttributes<HTMLElement>;
};

export type MainScreenBtnEffectKind = "none" | "fade" | "pulse" | "glow";

export type MainScreenBtnEffectConfig = {
  kind?: MainScreenBtnEffectKind;
};

export type MainScreenBtnEffectState = {
  open: boolean;
};

export type MainScreenBtnVisual = {
  panelClass: string;
  panelStyle?: CSSProperties;
  buttonClass: string;
  badgeClass: string;
};

export type MainScreenBtnProps = {
  open: boolean;
  onToggle?: () => void;
  effect?: MainScreenBtnEffectConfig;
  title?: string;
};

export type MainScreenRendererBadgeProps = {
  visible: boolean;
  label: string;
};

export type MainScreenUpdaterProps = {
  visible: boolean;
  rendererMode?: "auto" | "canvas" | "three";
  onRendererModeChange?: (mode: "auto" | "canvas" | "three") => void;
  onOpenCounterScreen?: () => void;
  onOpenCounter2Screen?: () => void;
  onOpenTimestampScreen?: () => void;
  onOpenFloatingScreen?: () => void;
  onOpenAlphaRemoveScreen?: () => void;
  onOpenComponentViewer?: () => void;
  rendererLabel?: string;
};

export type MainScreenBtnGestureAreaProps = {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  options?: MainScreenBtnGestureOptions;
  onOpenChange?: (open: boolean) => void;
};

// ===================================================================
// 🟢 BLOCK 3: UTILITY FUNCTIONS
// ===================================================================

async function clearCachesAndReload() {
  // Run cleanup operations in parallel for better performance
  await Promise.allSettled([
    // Service worker cleanup
    (async () => {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    })(),

    // Cache cleanup
    (async () => {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    })(),
  ]);

  // Force reload with cache bust, fallback to simple reload
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("_ts", String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

// ===================================================================
// 🔴 BLOCK 4: GESTURE SYSTEM (SIMPLIFIED)
// ===================================================================

type PressState = {
  active: boolean;
  pointerId: number | null;
  startX: number;
  startY: number;
  timer: number | null;
};

export function useMainScreenBtnGesture(opts?: MainScreenBtnGestureOptions): MainScreenBtnGesture {
  const holdMs = opts?.holdMs ?? 450;
  const tolerance = opts?.moveTolerancePx ?? 8;
  const toleranceSq = tolerance * tolerance;

  const [open, setOpen] = React.useState(false);
  const toggle = React.useCallback(() => setOpen((v) => !v), []);

  const pressRef = React.useRef<PressState>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    timer: null,
  });

  const clearTimer = () => {
    if (pressRef.current.timer !== null) {
      window.clearTimeout(pressRef.current.timer);
      pressRef.current.timer = null;
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!e.isPrimary) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    const p = pressRef.current;
    p.active = true;
    p.pointerId = e.pointerId;
    p.startX = e.clientX;
    p.startY = e.clientY;

    clearTimer();
    p.timer = window.setTimeout(() => {
      if (p.active) {
        toggle();
        p.active = false;
      }
    }, holdMs);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const p = pressRef.current;
    if (!p.active || p.pointerId !== e.pointerId) return;

    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    if (dx * dx + dy * dy > toleranceSq) {
      p.active = false;
      clearTimer();
    }
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLElement>) => {
    const p = pressRef.current;
    if (p.pointerId !== null && p.pointerId !== e.pointerId) return;

    p.active = false;
    p.pointerId = null;
    clearTimer();

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  const bindTargetProps = (): React.HTMLAttributes<HTMLElement> => ({
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
  });

  React.useEffect(() => clearTimer, []);

  return { open, setOpen, toggle, bindTargetProps };
}

// ===================================================================
// 🔴 BLOCK 5: EFFECT SYSTEM (SIMPLIFIED)
// ===================================================================

export function useMainScreenBtnEffect(
  state: MainScreenBtnEffectState,
  cfg?: MainScreenBtnEffectConfig,
): MainScreenBtnVisual {
  const kind = cfg?.kind ?? "none";

  const basePanel =
    "pointer-events-auto fixed bottom-4 right-4 z-[9999] " +
    "bg-neutral-900/80 backdrop-blur-md border border-neutral-800 " +
    "rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2";

  const baseButton =
    "btn inline-flex items-center gap-2 px-3 py-1.5 rounded-xl " +
    "bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 " +
    "text-sm leading-none";

  const baseBadge =
    "badge text-[10px] px-2 py-0.5 rounded bg-neutral-800/70 border border-neutral-700";

  if (kind === "glow") {
    return {
      panelClass: basePanel + " ring-1 ring-pink-400/25",
      panelStyle: state.open ? { boxShadow: "0 0 24px rgba(236,72,153,0.25)" } : undefined,
      buttonClass: baseButton + " ring-1 ring-pink-400/20",
      badgeClass: baseBadge,
    };
  }

  if (kind === "pulse") {
    return {
      panelClass: basePanel,
      panelStyle: state.open ? { animation: "pulse 1.5s ease-in-out infinite" } : undefined,
      buttonClass: baseButton,
      badgeClass: baseBadge,
    };
  }

  if (kind === "fade") {
    return {
      panelClass: basePanel,
      panelStyle: { opacity: state.open ? 1 : 0.85, transition: "opacity 160ms ease" },
      buttonClass: baseButton,
      badgeClass: baseBadge,
    };
  }

  return {
    panelClass: basePanel,
    panelStyle: undefined,
    buttonClass: baseButton,
    badgeClass: baseBadge,
  };
}

// ===================================================================
// 🟡 BLOCK 6: RENDERER BADGE COMPONENT
// ===================================================================

export function MainScreenRendererBadge(props: MainScreenRendererBadgeProps) {
  if (!props.visible) return null;
  return (
    <div
      className="pointer-events-none select-none fixed top-3 right-3 z-[9998] text-[10px] px-2 py-0.5 rounded bg-black/60 border border-white/10 text-white/80"
      aria-live="polite"
    >
      {props.label}
    </div>
  );
}

// ===================================================================
// 🟡 BLOCK 7: UPDATER COMPONENT
// ===================================================================

export function MainScreenUpdater(props: MainScreenUpdaterProps) {
  const currentMode = props.rendererMode ?? "auto";

  const getRendererButtonClass = (mode: "auto" | "canvas" | "three") => {
    const baseClass = "text-[11px] px-3 py-2 rounded text-white shadow-sm border";
    const isSelected = currentMode === mode;

    if (!isSelected) {
      return `${baseClass} bg-gray-600/40 border-gray-700/40 text-gray-400`;
    }

    if (mode === "auto") {
      return `${baseClass} bg-blue-600/80 hover:bg-blue-500/80 active:bg-blue-600 border-white/10`;
    } else if (mode === "canvas") {
      return `${baseClass} bg-amber-600/80 hover:bg-amber-500/80 active:bg-amber-600 border-white/10`;
    } else {
      return `${baseClass} bg-emerald-600/80 hover:bg-emerald-500/80 active:bg-emerald-600 border-white/10`;
    }
  };

  if (!props.visible) return null;

  return (
    <div className="fixed top-3 right-3 z-[9998] flex flex-col items-end gap-2">
      {props.rendererLabel && (
        <div className="pointer-events-none select-none rounded bg-black/60 px-3 py-1 text-xs text-white/80 shadow-inner border border-white/10 whitespace-normal break-words text-right leading-tight">
          {props.rendererLabel}
        </div>
      )}
      {props.onRendererModeChange && (
        <div className="flex flex-row gap-1">
          <button
            type="button"
            onClick={() => props.onRendererModeChange?.("auto")}
            className={getRendererButtonClass("auto")}
            aria-label="Auto renderer mode"
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => props.onRendererModeChange?.("canvas")}
            className={getRendererButtonClass("canvas")}
            aria-label="Canvas renderer mode"
          >
            Canvas
          </button>
          <button
            type="button"
            onClick={() => props.onRendererModeChange?.("three")}
            className={getRendererButtonClass("three")}
            aria-label="Three renderer mode"
          >
            Three
          </button>
        </div>
      )}
      <div className="flex flex-col gap-1 self-end">
        <button
          type="button"
          onClick={clearCachesAndReload}
          className="text-xs px-3 py-2 rounded bg-pink-600/80 hover:bg-pink-500/80 active:bg-pink-600 text-white shadow-sm border border-white/10 text-center whitespace-normal break-words leading-tight"
          aria-label="Force update and reload"
        >
          Update
        </button>
        {props.onOpenCounterScreen && (
          <button
            type="button"
            onClick={props.onOpenCounterScreen}
            className="text-xs px-3 py-2 rounded bg-sky-600/80 hover:bg-sky-500/80 active:bg-sky-600 text-white shadow-sm border border-white/10 text-center whitespace-normal break-words leading-tight"
          >
            Counter
          </button>
        )}
        {props.onOpenCounter2Screen && (
          <button
            type="button"
            onClick={props.onOpenCounter2Screen}
            onContextMenu={(e) => {
              e.preventDefault();
              window.open("http://localhost:3002", "_blank");
            }}
            className="text-xs px-3 py-2 rounded bg-teal-600/80 hover:bg-teal-500/80 active:bg-teal-600 text-white shadow-sm border border-white/10 text-center whitespace-normal break-words leading-tight"
            title="Click: Open locally | Right-click: Open in new tab (port 3002)"
          >
            Counter2
          </button>
        )}
        {props.onOpenTimestampScreen && (
          <button
            type="button"
            onClick={props.onOpenTimestampScreen}
            className="text-xs px-3 py-2 rounded bg-emerald-600/80 hover:bg-emerald-500/80 active:bg-emerald-600 text-white shadow-sm border border-white/10 text-center whitespace-normal break-words leading-tight"
          >
            Timestamp
          </button>
        )}
        {props.onOpenFloatingScreen && (
          <button
            type="button"
            onClick={props.onOpenFloatingScreen}
            className="text-xs px-3 py-2 rounded bg-violet-600/80 hover:bg-violet-500/80 active:bg-violet-600 text-white shadow-sm border border-white/10 text-center whitespace-normal break-words leading-tight"
          >
            Floating Window
          </button>
        )}
        {props.onOpenAlphaRemoveScreen && (
          <button
            type="button"
            onClick={props.onOpenAlphaRemoveScreen}
            className="text-xs px-3 py-2 rounded bg-orange-600/80 hover:bg-orange-500/80 active:bg-orange-600 text-white shadow-sm border border-white/10 text-center whitespace-normal break-words leading-tight"
          >
            Alpha Remover
          </button>
        )}
        {props.onOpenComponentViewer && (
          <button
            type="button"
            onClick={props.onOpenComponentViewer}
            className="text-xs px-3 py-2 rounded bg-cyan-600/80 hover:bg-cyan-500/80 active:bg-cyan-600 text-white shadow-sm border border-white/10 text-center whitespace-normal break-words leading-tight"
          >
            Components
          </button>
        )}
      </div>
    </div>
  );
}

// ===================================================================
// 🔴 BLOCK 8: BUTTON PANEL COMPONENT (SIMPLIFIED)
// ===================================================================

export function MainScreenBtnPanel(props: MainScreenBtnProps) {
  const { open, onToggle, title = "Launcher" } = props;

  const vis = useMainScreenBtnEffect({ open }, props.effect);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onToggle]);

  if (!open) return null;

  return (
    <div className={vis.panelClass} style={vis.panelStyle}>
      <span className={vis.badgeClass}>{title}</span>
      <div className="flex items-center gap-2">
        <button type="button" className={vis.buttonClass} onClick={onToggle}>
          Close
        </button>
      </div>
    </div>
  );
}

// ===================================================================
// 🟡 BLOCK 9: GESTURE AREA COMPONENT
// ===================================================================

export function MainScreenBtnGestureArea(props: MainScreenBtnGestureAreaProps) {
  const g = useMainScreenBtnGesture(props.options);

  React.useEffect(() => {
    props.onOpenChange?.(g.open);
  }, [g.open, props]);

  return (
    <div
      {...g.bindTargetProps()}
      className={props.className ?? "absolute inset-0 pointer-events-auto"}
      style={props.style}
    >
      {typeof props.children === "function"
        ? (props.children as (arg: { open: boolean; toggle: () => void }) => React.ReactNode)({
            open: g.open,
            toggle: g.toggle,
          })
        : props.children}
    </div>
  );
}

// ===================================================================
// 🟡 BLOCK 10: BUTTON DOCK (SIMPLIFIED)
// ===================================================================

export function MainScreenBtnDock(
  props: Omit<MainScreenBtnProps, "open" | "onToggle"> & { overlayClassName?: string },
) {
  const gesture = useMainScreenBtnGesture();
  return (
    <>
      <div
        {...gesture.bindTargetProps()}
        className={props.overlayClassName ?? "absolute inset-0 pointer-events-auto"}
      />
      <MainScreenBtnPanel
        open={gesture.open}
        onToggle={gesture.toggle}
        effect={props.effect}
        title={props.title}
      />
    </>
  );
}

// Export utility functions
export { clearCachesAndReload };

import React from "react";
import { stageToViewportCoords, type StageTransform } from "@shared/layer";
import { requireAssetUrl } from "@shared/asset/assetResolver";

const iconBack = requireAssetUrl("general_icon_jiantou1");
const iconReset = requireAssetUrl("general_icon_shuaxin");
const iconSettings = requireAssetUrl("general_icon_shezhi");

type ScreenPosition = { x: number; y: number };

type BaseButtonProps = {
  screenPosition: ScreenPosition;
  onClick?: () => void;
  size?: number;
  icon: string;
  label: string;
};

const BUTTON_BASE_SIZE = 56;

function FloatingButton({
  screenPosition,
  onClick,
  size = BUTTON_BASE_SIZE,
  icon,
  label,
}: BaseButtonProps) {
  return (
    <div
      className="pointer-events-none fixed z-30"
      style={{ left: screenPosition.x, top: screenPosition.y }}
    >
      <button
        type="button"
        className="pointer-events-auto rounded-lg bg-transparent shadow-sm shadow-black/30 transition hover:scale-[1.05] active:scale-95"
        onClick={onClick}
        aria-label={label}
        style={{ width: size, height: size }}
      >
        <img src={icon} alt={label} className="h-full w-full object-contain" draggable={false} />
      </button>
    </div>
  );
}

export function CounterBackButton(props: Omit<BaseButtonProps, "icon">) {
  return <FloatingButton {...props} icon={iconBack} label="Back" />;
}

export function CounterResetButton(props: Omit<BaseButtonProps, "icon">) {
  return <FloatingButton {...props} icon={iconReset} label="Reset" />;
}

export function CounterSettingsButton(props: Omit<BaseButtonProps, "icon">) {
  return <FloatingButton {...props} icon={iconSettings} label="Settings" />;
}

export { BUTTON_BASE_SIZE };

type CounterControlsProps = {
  transform: StageTransform;
  backStagePosition?: ScreenPosition;
  resetStagePosition: ScreenPosition;
  settingsStagePosition: ScreenPosition;
  onBack?: () => void;
  onReset: () => void;
  onToggleSettings: () => void;
  showSettings: boolean;
};

type ScreenResult = { x: number; y: number };

const MIN_SIZE = 48;
const MAX_SIZE = 72;

function clampToViewport(pos: ScreenResult, size: number): ScreenResult {
  if (typeof window === "undefined") return pos;
  const margin = 8;
  const maxX = Math.max(margin, window.innerWidth - size - margin);
  const maxY = Math.max(margin, window.innerHeight - size - margin);
  return {
    x: Math.min(maxX, Math.max(margin, pos.x)),
    y: Math.min(maxY, Math.max(margin, pos.y)),
  };
}

function resolveOverlap(items: ScreenResult[], size: number): ScreenResult[] {
  const gap = size + 8;
  const resolved: ScreenResult[] = [];

  items.forEach((pos) => {
    const adjusted = { ...pos };
    for (const prev of resolved) {
      const overlapX = Math.abs(adjusted.x - prev.x) < size * 0.5;
      const overlapY = Math.abs(adjusted.y - prev.y) < size * 0.5;
      if (overlapX && overlapY) {
        adjusted.y = Math.max(adjusted.y, prev.y + gap);
      }
    }
    resolved.push(adjusted);
  });

  return resolved;
}

export function CounterControls({
  transform,
  backStagePosition,
  resetStagePosition,
  settingsStagePosition,
  onBack,
  onReset,
  onToggleSettings,
  showSettings,
}: CounterControlsProps) {
  const controlButtonSize = React.useMemo(() => {
    const scaled = BUTTON_BASE_SIZE * transform.scale;
    return Math.max(MIN_SIZE, Math.min(MAX_SIZE, scaled));
  }, [transform.scale]);

  const { backPos, resetPos, settingsPos } = React.useMemo(() => {
    const results: Array<ScreenResult> = [];
    const includeBack = Boolean(onBack && backStagePosition);

    const toScreen = (stage: ScreenPosition): ScreenResult => {
      const { x, y } = stageToViewportCoords(stage.x, stage.y, transform);
      const half = controlButtonSize / 2;
      return clampToViewport({ x: x - half, y: y - half }, controlButtonSize);
    };

    if (includeBack && backStagePosition) {
      results.push(toScreen(backStagePosition));
    }
    results.push(toScreen(resetStagePosition));
    results.push(toScreen(settingsStagePosition));

    const resolved = resolveOverlap(results, controlButtonSize);

    return {
      backPos: includeBack ? resolved[0] : null,
      resetPos: includeBack ? resolved[1] : resolved[0],
      settingsPos: includeBack ? resolved[2] : resolved[1],
    };
  }, [backStagePosition, controlButtonSize, onBack, resetStagePosition, settingsStagePosition, transform]);

  return (
    <>
      {onBack && backPos ? (
        <CounterBackButton screenPosition={backPos} onClick={onBack} label="Back" size={controlButtonSize} />
      ) : null}
      {resetPos ? (
        <CounterResetButton
          screenPosition={resetPos}
          onClick={onReset}
          label="Reset"
          size={controlButtonSize}
        />
      ) : null}
      {settingsPos ? (
        <CounterSettingsButton
          screenPosition={settingsPos}
          onClick={onToggleSettings}
          label={showSettings ? "Hide" : "Settings"}
          size={controlButtonSize}
        />
      ) : null}
    </>
  );
}

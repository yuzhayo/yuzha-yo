import React, { useMemo, useState } from "react";
import StageCanvas from "@shared/layer/StageCanvas";
import StageThree from "@shared/layer/StageThree";
import { getRendererType } from "@shared/utils/RendererDetector";
import { MainScreenBtnPanel, useMainScreenBtnGesture, MainScreenUpdater } from "./MainScreenUtils";

export type RendererMode = "auto" | "canvas" | "three";
export type RendererType = "canvas" | "three";

export type MainScreenProps = {
  children?: React.ReactNode;
  onOpenCounterScreen?: () => void;
  onOpenTimestampScreen?: () => void;
  onOpenFloatingScreen?: () => void;
  onOpenAlphaRemoveScreen?: () => void;
};

function MainScreenOverlay({
  rendererLabel,
  rendererMode,
  onRendererModeChange,
  onOpenCounterScreen,
  onOpenTimestampScreen,
  onOpenFloatingScreen,
  onOpenAlphaRemoveScreen,
}: {
  rendererLabel: string;
  rendererMode: RendererMode;
  onRendererModeChange: (mode: RendererMode) => void;
  onOpenCounterScreen?: () => void;
  onOpenTimestampScreen?: () => void;
  onOpenFloatingScreen?: () => void;
  onOpenAlphaRemoveScreen?: () => void;
}) {
  const gesture = useMainScreenBtnGesture();

  return (
    <>
      <div {...gesture.bindTargetProps()} className="absolute inset-0 pointer-events-auto z-20" />
      <MainScreenBtnPanel
        open={gesture.open}
        onToggle={gesture.toggle}
        effect={{ kind: "fade" }}
        title="Launcher"
      />
      <MainScreenUpdater
        visible={gesture.open}
        rendererLabel={rendererLabel}
        rendererMode={rendererMode}
        onRendererModeChange={onRendererModeChange}
        onOpenCounterScreen={onOpenCounterScreen}
        onOpenTimestampScreen={onOpenTimestampScreen}
        onOpenFloatingScreen={onOpenFloatingScreen}
        onOpenAlphaRemoveScreen={onOpenAlphaRemoveScreen}
      />
    </>
  );
}

/**
 * MainScreen with MainScreenUtils attached
 * Testing if overlay components break stage centering
 */
export default function MainScreen({
  children,
  onOpenCounterScreen,
  onOpenTimestampScreen,
  onOpenFloatingScreen,
  onOpenAlphaRemoveScreen,
}: MainScreenProps) {
  const autoDetectedRenderer = useMemo(() => getRendererType(), []);
  const [rendererMode, setRendererMode] = useState<RendererMode>("auto");

  const activeRenderer: RendererType =
    rendererMode === "auto" ? autoDetectedRenderer : rendererMode;

  const rendererLabel = React.useMemo(() => {
    const baseLabel = activeRenderer === "three" ? "Three.js WebGL Renderer" : "Canvas 2D Renderer";
    const modeLabel = rendererMode === "auto" ? " (Auto)" : ` (Manual: ${rendererMode})`;
    return baseLabel + modeLabel;
  }, [activeRenderer, rendererMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {activeRenderer === "three" ? <StageThree /> : <StageCanvas />}
      {children ?? (
        <MainScreenOverlay
          rendererLabel={rendererLabel}
          rendererMode={rendererMode}
          onRendererModeChange={setRendererMode}
          onOpenCounterScreen={onOpenCounterScreen}
          onOpenTimestampScreen={onOpenTimestampScreen}
          onOpenFloatingScreen={onOpenFloatingScreen}
          onOpenAlphaRemoveScreen={onOpenAlphaRemoveScreen}
        />
      )}
    </div>
  );
}

export { MainScreenOverlay };

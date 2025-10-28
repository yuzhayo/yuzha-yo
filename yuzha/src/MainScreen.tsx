import React, { useMemo, useState } from "react";
import StageCanvas from "@shared/stage/StageCanvas";
import StageThree from "@shared/stage/StageThree";
import { getRendererType } from "@shared/utils/RendererDetector";
import { MainScreenBtnPanel, useMainScreenBtnGesture, MainScreenUpdater } from "./MainScreenUtils";

export type RendererMode = "auto" | "canvas" | "three";
export type RendererType = "canvas" | "three";

export type MainScreenProps = {
  children?: React.ReactNode;
  onOpenTestScreen?: () => void;
  onOpenStruckScreen?: () => void;
};

function MainScreenOverlay({
  rendererLabel,
  rendererMode,
  onRendererModeChange,
  onOpenTestScreen,
  onOpenStruckScreen,
}: {
  rendererLabel: string;
  rendererMode: RendererMode;
  onRendererModeChange: (mode: RendererMode) => void;
  onOpenTestScreen?: () => void;
  onOpenStruckScreen?: () => void;
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
        onOpenTestScreen={onOpenTestScreen}
        onOpenStruckScreen={onOpenStruckScreen}
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
  onOpenTestScreen,
  onOpenStruckScreen,
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
          onOpenTestScreen={onOpenTestScreen}
          onOpenStruckScreen={onOpenStruckScreen}
        />
      )}
    </div>
  );
}

export { MainScreenOverlay };

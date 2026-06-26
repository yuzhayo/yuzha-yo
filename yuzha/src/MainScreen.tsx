import React, { useMemo, useState, useCallback } from "react";
import StageCanvas from "@shared/layer/StageCanvas";
import StageThree from "@shared/layer/StageThree";
import { getRendererType } from "@shared/utils/RendererDetector";
import { useMainScreenBtnGesture, MainScreenUpdater } from "./MainScreenUtils";

export type RendererMode = "auto" | "canvas" | "three";
export type RendererType = "canvas" | "three";

export type MainScreenProps = {
  children?: React.ReactNode;
  onOpenTimestampScreen?: () => void;
  onOpenFloatingScreen?: () => void;
};

function MainScreenOverlay({
  rendererLabel,
  rendererMode,
  onRendererModeChange,
  onOpenTimestampScreen,
  onOpenFloatingScreen,
}: {
  rendererLabel: string;
  rendererMode: RendererMode;
  onRendererModeChange: (mode: RendererMode) => void;
  onOpenTimestampScreen?: () => void;
  onOpenFloatingScreen?: () => void;
}) {
  const gesture = useMainScreenBtnGesture();

  return (
    <>
      <div {...gesture.bindTargetProps()} className="absolute inset-0 pointer-events-auto z-20" />
      <MainScreenUpdater
        visible={gesture.open}
        rendererLabel={rendererLabel}
        rendererMode={rendererMode}
        onRendererModeChange={onRendererModeChange}
        onOpenTimestampScreen={onOpenTimestampScreen}
        onOpenFloatingScreen={onOpenFloatingScreen}
      />
    </>
  );
}

/**
 * MainScreen with MainScreenUtils attached
 */
export default function MainScreen({
  children,
  onOpenTimestampScreen,
  onOpenFloatingScreen,
}: MainScreenProps) {
  const autoDetectedRenderer = useMemo(() => getRendererType(), []);
  const [rendererMode, setRendererMode] = useState<RendererMode>("auto");
  const [threeJsFailed, setThreeJsFailed] = useState(false);

  const handleThreeJsError = useCallback(() => {
    console.warn("[MainScreen] Three.js failed, falling back to Canvas renderer");
    setThreeJsFailed(true);
  }, []);

  const activeRenderer: RendererType =
    threeJsFailed ? "canvas" : rendererMode === "auto" ? autoDetectedRenderer : rendererMode;

  const rendererLabel = React.useMemo(() => {
    const baseLabel = activeRenderer === "three" ? "Three.js WebGL Renderer" : "Canvas 2D Renderer";
    const modeLabel = rendererMode === "auto" ? " (Auto)" : ` (Manual: ${rendererMode})`;
    return baseLabel + modeLabel;
  }, [activeRenderer, rendererMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {activeRenderer === "three" ? <StageThree onError={handleThreeJsError} /> : <StageCanvas />}
      {children ?? (
        <MainScreenOverlay
          rendererLabel={rendererLabel}
          rendererMode={rendererMode}
          onRendererModeChange={setRendererMode}
          onOpenTimestampScreen={onOpenTimestampScreen}
          onOpenFloatingScreen={onOpenFloatingScreen}
        />
      )}
    </div>
  );
}

export { MainScreenOverlay };

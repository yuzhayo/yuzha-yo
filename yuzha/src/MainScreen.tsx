import React, { useMemo, useState } from "react";
import StageCanvas from "@shared/stage/StageCanvas";
import StageDOM from "@shared/stage/StageDOM";
import StageThree from "@shared/stage/StageThree";
import { getRendererType } from "@shared/utils/RendererDetector";
import {
  MainScreenBtnPanel,
  useMainScreenBtnGesture,
  MainScreenRendererBadge,
  MainScreenUpdater,
} from "./MainScreenUtils";

export type RendererMode = "auto" | "dom" | "canvas" | "three";
export type RendererType = "dom" | "canvas" | "three";

export type MainScreenProps = {
  children?: React.ReactNode;
  onOpenTestScreen?: () => void;
};

function MainScreenOverlay({
  rendererLabel,
  rendererMode,
  onRendererModeChange,
  onOpenTestScreen,
}: {
  rendererLabel: string;
  rendererMode: RendererMode;
  onRendererModeChange: (mode: RendererMode) => void;
  onOpenTestScreen?: () => void;
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
      <MainScreenRendererBadge visible={gesture.open} label={rendererLabel} />
      <MainScreenUpdater
        visible={gesture.open}
        rendererMode={rendererMode}
        onRendererModeChange={onRendererModeChange}
        onOpenTestScreen={onOpenTestScreen}
      />
    </>
  );
}

/**
 * MainScreen with MainScreenUtils attached
 * Testing if overlay components break stage centering
 */
export default function MainScreen({ children, onOpenTestScreen }: MainScreenProps) {
  const autoDetectedRenderer = useMemo(() => getRendererType(), []);
  const [rendererMode, setRendererMode] = useState<RendererMode>("dom");

  const activeRenderer: RendererType =
    rendererMode === "auto" ? autoDetectedRenderer : rendererMode;

  const rendererLabel = React.useMemo(() => {
    let baseLabel = "Canvas 2D Renderer (AI Agent Fallback)";
    if (activeRenderer === "three") {
      baseLabel = "Three.js WebGL Renderer";
    } else if (activeRenderer === "dom") {
      baseLabel = "DOM CSS Renderer";
    }
    const modeLabel = rendererMode === "auto" ? " (Auto)" : ` (Manual: ${rendererMode})`;
    return baseLabel + modeLabel;
  }, [activeRenderer, rendererMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {activeRenderer === "three" ? (
        <StageThree />
      ) : activeRenderer === "dom" ? (
        <StageDOM />
      ) : (
        <StageCanvas />
      )}
      {children ?? (
        <MainScreenOverlay
          rendererLabel={rendererLabel}
          rendererMode={rendererMode}
          onRendererModeChange={setRendererMode}
          onOpenTestScreen={onOpenTestScreen}
        />
      )}
    </div>
  );
}

export { MainScreenOverlay };

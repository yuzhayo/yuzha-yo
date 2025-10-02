import React, { useMemo } from "react";
import StageCanvas from "@shared/stages/StageCanvas";
import StageThree from "@shared/stages/StageThree";
import { getRendererType } from "@shared/utils/RendererDetector";
import {
  MainScreenBtnPanel,
  useMainScreenBtnGesture,
  MainScreenRendererBadge,
  MainScreenUpdater,
  MainScreenApiTester,
} from "./MainScreenUtils";

export type MainScreenProps = {
  children?: React.ReactNode;
};

function MainScreenOverlay({ rendererLabel }: { rendererLabel: string }) {
  const gesture = useMainScreenBtnGesture();

  return (
    <>
      <div {...gesture.bindTargetProps()} className="absolute inset-0 pointer-events-auto z-20" />
      <MainScreenBtnPanel
        open={gesture.open}
        onToggle={gesture.toggle}
        effect={{ kind: "fade" }}
        title="Modules"
        target="_self"
      />
      <MainScreenRendererBadge visible={gesture.open} label={rendererLabel} />
      <MainScreenApiTester visible={gesture.open} />
      <MainScreenUpdater visible={gesture.open} />
    </>
  );
}

/**
 * MainScreen with MainScreenUtils attached
 * Testing if overlay components break stage centering
 */
export default function MainScreen({ children }: MainScreenProps) {
  const rendererType = useMemo(() => getRendererType(), []);
  const rendererLabel =
    rendererType === "three" ? "Three.js WebGL Renderer" : "Canvas 2D Renderer (AI Agent Fallback)";

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {rendererType === "three" ? <StageThree /> : <StageCanvas />}
      {children ?? <MainScreenOverlay rendererLabel={rendererLabel} />}
    </div>
  );
}

export { MainScreenOverlay };

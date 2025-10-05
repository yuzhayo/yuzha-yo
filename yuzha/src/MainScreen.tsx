import React, { useState } from "react";
import StageDOM from "@shared/stages/StageDOM";
import {
  MainScreenBtnPanel,
  useMainScreenBtnGesture,
  MainScreenRendererBadge,
  MainScreenUpdater,
} from "./MainScreenUtils";

export type MainScreenProps = {
  children?: React.ReactNode;
};

function MainScreenOverlay() {
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
      <MainScreenRendererBadge visible={gesture.open} label="DOM CSS Renderer" />
      <MainScreenUpdater visible={gesture.open} />
    </>
  );
}

/**
 * MainScreen with MainScreenUtils attached
 * Testing if overlay components break stage centering
 */
export default function MainScreen({ children }: MainScreenProps) {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <StageDOM />
      {children ?? <MainScreenOverlay />}
    </div>
  );
}

export { MainScreenOverlay };

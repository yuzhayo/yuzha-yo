import React from "react";
import StagePixi from "@shared/stages/StagePixi";
import StageThree from "@shared/stages/StageThree";
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

function MainScreenOverlay() {
  const gesture = useMainScreenBtnGesture();
  const label = "Yuzha Module";

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
      <MainScreenRendererBadge visible={gesture.open} label={label} />
      <MainScreenApiTester visible={gesture.open} />
      <MainScreenUpdater visible={gesture.open} />
    </>
  );
}

/**
 * Container host untuk stage dan overlay lain.
 * Bertugas menyediakan kanvas full-screen 2048x2048.
 */
export default function MainScreen({ children }: MainScreenProps) {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <StageThree />
      <StagePixi />
      {children ?? <MainScreenOverlay />}
    </div>
  );
}

export { MainScreenOverlay };
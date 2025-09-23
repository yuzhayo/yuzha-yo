// IMPORT SECTION
import React from "react";
import StagesCanvasLayer from "./StagesCanvasLayer";
import type { LibraryConfig } from "@shared/layer2/LayerTypes";
import runtimeConfigJson from "@shared/layer2/LayerConfig.json"; // ← runtime JSON (LibraryConfig)
import "@shared/fonts/taimingda.css";

// COERCE JSON TO TYPED CONFIG
const runtimeConfig = runtimeConfigJson as LibraryConfig;

// STYLE (minimal, full-viewport)
const WRAPPER_STYLE: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  margin: 0,
  padding: 0,
  overflow: "hidden",
  background: "#0f172a",
};

// COMPONENT
export default function MainScreen() {
  return (
    <div style={WRAPPER_STYLE}>
      <StagesCanvasLayer
        width={2048}
        height={2048}
        config={runtimeConfig}
        // callbacks optional; keep engine quiet and simple
        onInitialized={undefined}
        onError={undefined}
        onWarning={undefined}
        quality={{
          dpr: Math.min(window.devicePixelRatio, 2),
          antialias: true,
          shadows: false,
          textureScale: 1.0,
        }}
      />
    </div>
  );
}

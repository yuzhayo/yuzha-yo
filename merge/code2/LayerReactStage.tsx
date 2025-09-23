// Simple React component that wires config → useLayerEngine → StagesCanvas.
// NEW file. No code copied from legacy folders.

import React from "react";
import type { LibraryConfig } from "../../shared/layer/LayerTypes";
import type { RenderQuality } from "../../shared/stages/StagesTypes";
import { useLayerEngine } from "./useLayerEngine";
import { StagesCanvas } from "./StagesCanvas";

export default function LayerReactStage({
  config,
  quality,
  className,
  style,
  onError,
}: {
  config: LibraryConfig;
  quality?: Partial<RenderQuality>;
  className?: string;
  style?: React.CSSProperties;
  onError?: (e: string) => void;
}) {
  const { canvasRef } = useLayerEngine({ config, quality, onError });

  return (
    <StagesCanvas
      ref={canvasRef as any}
      className={className}
      style={style}
    />
  );
}

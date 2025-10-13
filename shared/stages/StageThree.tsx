import React, { useEffect, useRef } from "react";
import { createStagePipeline } from "../layer/pipeline/StagePipeline";
import { mountThreeRenderer } from "../layer/pipeline/renderers/ThreeRendererAdapter";

function StageThree() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let cleanup: (() => void) | undefined;
    let active = true;

    (async () => {
      const pipeline = await createStagePipeline();
      if (!active) return;
      cleanup = await mountThreeRenderer({ container, canvas }, pipeline);
    })().catch((error) => {
      console.error("Failed to initialise Three.js stage", error);
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export default React.memo(StageThree);

import React, { useEffect, useRef } from "react";
import { createStagePipeline } from "../layer/pipeline/StagePipeline";
import { mountDomRenderer } from "../layer/pipeline/renderers/DomRendererAdapter";

function StageDOM() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    let cleanup: (() => void) | undefined;
    let active = true;

    (async () => {
      const pipeline = await createStagePipeline();
      if (!active) return;
      cleanup = await mountDomRenderer({ container, stage }, pipeline);
    })().catch((error) => {
      console.error("Failed to initialise DOM stage", error);
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      <div ref={stageRef} className="block" />
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export default React.memo(StageDOM);

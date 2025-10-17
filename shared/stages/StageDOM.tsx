import React, { useEffect, useRef } from "react";
import { createStagePipeline, toRendererInput, type StagePipeline } from "../layer/pipeline/StagePipeline";
import { createStageTransformer } from "../utils/stage2048";
import { mountDomLayers } from "../layer/LayerEngines";

async function mountDomRenderer(
  container: HTMLDivElement,
  stage: HTMLDivElement,
  pipeline: StagePipeline,
): Promise<() => void> {
  const cleanupTransform = createStageTransformer(stage, container, {
    resizeDebounce: 100,
  });

  const cleanupLayers = await mountDomLayers(stage, toRendererInput(pipeline));

  return () => {
    cleanupTransform?.();
    cleanupLayers?.();
  };
}

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
      cleanup = await mountDomRenderer(container, stage, pipeline);
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

export default React.memo(StageDOM);

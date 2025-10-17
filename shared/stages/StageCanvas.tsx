import React, { useEffect, useRef } from "react";
import { createStagePipeline, toRendererInput, type StagePipeline } from "../layer/pipeline/StagePipeline";
import { createStageTransformer } from "../utils/stage2048";
import { mountCanvasLayers } from "../layer/LayerEngines";

async function mountCanvasRenderer(
  container: HTMLDivElement,
  canvas: HTMLCanvasElement,
  pipeline: StagePipeline,
): Promise<() => void> {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("[CanvasRenderer] Failed to acquire 2D context");
  }

  canvas.width = pipeline.stageSize;
  canvas.height = pipeline.stageSize;

  const cleanupTransform = createStageTransformer(canvas, container, {
    resizeDebounce: 100,
  });

  const cleanupLayers = await mountCanvasLayers(context, toRendererInput(pipeline));

  return () => {
    cleanupTransform?.();
    cleanupLayers?.();
  };
}

function StageCanvas() {
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
      cleanup = await mountCanvasRenderer(container, canvas, pipeline);
    })().catch((error) => {
      console.error("Failed to initialise Canvas stage", error);
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

export default React.memo(StageCanvas);

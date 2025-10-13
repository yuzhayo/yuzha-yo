import { createStageTransformer } from "../../../utils/stage2048";
import { mountCanvasLayers } from "../../LayerEngines";
import { toRendererInput, type StagePipeline } from "../StagePipeline";

export type CanvasRendererElements = {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
};

export async function mountCanvasRenderer(
  elements: CanvasRendererElements,
  pipeline: StagePipeline,
): Promise<() => void> {
  const { container, canvas } = elements;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("[CanvasRendererAdapter] Failed to acquire 2D context");
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

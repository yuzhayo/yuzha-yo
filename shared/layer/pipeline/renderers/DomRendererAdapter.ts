import { createStageTransformer } from "../../../utils/stage2048";
import { mountDomLayers } from "../../LayerEngines";
import type { StagePipeline } from "../StagePipeline";
import { toRendererInput } from "../StagePipeline";

export type DomRendererElements = {
  container: HTMLDivElement;
  stage: HTMLDivElement;
};

export async function mountDomRenderer(
  elements: DomRendererElements,
  pipeline: StagePipeline,
): Promise<() => void> {
  const { container, stage } = elements;

  const cleanupTransform = createStageTransformer(stage, container, {
    resizeDebounce: 100,
  });

  const cleanupLayers = await mountDomLayers(stage, toRendererInput(pipeline));

  return () => {
    cleanupTransform?.();
    cleanupLayers?.();
  };
}

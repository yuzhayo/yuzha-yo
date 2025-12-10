import config from "./ConfigCounter.json";
import {
  STAGE_SIZE,
  prepareLayer,
  is2DLayer,
  getProcessorsForEntry,
  buildLayerMotion,
  computeLayerBounds,
  isLayerWithinStageBounds,
  type StagePipeline,
  type EnhancedLayerData,
  type LayerProcessor,
  type LayerMetadata,
  type LayerMotionMarker,
  type LayerConfigEntry,
} from "@shared/layer";

function appendMotionMarkers(target: LayerMotionMarker[], source?: LayerMotionMarker[]) {
  if (!source?.length) return;
  target.push(...source);
}

export async function createCounterPipeline(): Promise<StagePipeline> {
  const stageSize = STAGE_SIZE;
  const entries = (config as unknown as LayerConfigEntry[]).filter(is2DLayer);
  const motionMarkers: LayerMotionMarker[] = [];

  const layers = (
    await Promise.all(
      entries.map(async (entry) => {
        const layer = await prepareLayer(entry, stageSize);
        if (!layer) return null;

        const processors = getProcessorsForEntry(entry, undefined);
        const enhanced = layer as EnhancedLayerData;
        const baseBounds = computeLayerBounds(
          enhanced.position,
          enhanced.scale,
          enhanced.imageMapping,
        );

        const motionArtifacts = buildLayerMotion(entry, enhanced, stageSize);
        if (motionArtifacts.processor) {
          processors.push(motionArtifacts.processor as LayerProcessor);
        }
        appendMotionMarkers(motionMarkers, motionArtifacts.markers);

        const hasAnimation =
          processors.length > 0 ||
          Boolean(
            enhanced.hasSpinAnimation || enhanced.hasOrbitalAnimation || motionArtifacts.processor,
          );

        const metadata: LayerMetadata = {
          baseBounds,
          isStatic: !hasAnimation,
          hasAnimation,
          visibleByDefault: enhanced.visible !== false,
        };

        if (!metadata.hasAnimation && !isLayerWithinStageBounds(baseBounds, stageSize)) {
          return null;
        }

        return { entry, data: enhanced, processors, metadata };
      }),
    )
  ).filter(Boolean) as StagePipeline["layers"];

  return { stageSize, layers, markers: motionMarkers.length ? motionMarkers : undefined };
}

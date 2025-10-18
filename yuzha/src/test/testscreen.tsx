import React from "react";
import { createTestStagePipeline } from "./core";
import { runPipeline, type EnhancedLayerData } from "@shared/layer/layer";
import { STAGE_SIZE } from "@shared/stage/StageSystem";

export type TestScreenProps = {
  onBack?: () => void;
};

type TestLayerState = {
  data: EnhancedLayerData;
};

function TestStagePreview() {
  const [layers, setLayers] = React.useState<TestLayerState[] | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const pipeline = await createTestStagePipeline();
      if (!active) return;

      const hydrated = pipeline.layers.map((layer) => {
        const processed =
          layer.processors.length > 0 ? runPipeline(layer.data, layer.processors) : layer.data;
        return { data: processed };
      });
      setLayers(hydrated);
    })().catch((error) => {
      console.error("[TestScreen] Failed to load test pipeline", error);
      setLayers([]);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="aspect-square w-full max-w-3xl">
      <svg
        viewBox={`0 0 ${STAGE_SIZE} ${STAGE_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
      >
        {(layers ?? []).map(({ data }) => {
          if (data.visible === false) return null;
          const { width, height } = data.imageMapping.imageDimensions;
          const scaledWidth = width * data.scale.x;
          const scaledHeight = height * data.scale.y;
          const left = data.position.x - scaledWidth / 2;
          const top = data.position.y - scaledHeight / 2;
          return (
            <image
              key={data.LayerID}
              href={data.imageUrl}
              x={left}
              y={top}
              width={scaledWidth}
              height={scaledHeight}
              style={{ pointerEvents: "none" }}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function TestScreen(props: TestScreenProps) {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      {props.onBack && (
        <button
          type="button"
          onClick={props.onBack}
          className="absolute right-6 top-6 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-blue-500 active:bg-blue-600"
        >
          Back to Main Screen
        </button>
      )}
      <div className="flex h-full flex-col items-center justify-center px-6 py-20">
        <div className="relative w-full max-w-3xl rounded-lg border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/40">
          <TestStagePreview />
        </div>
      </div>
    </div>
  );
}

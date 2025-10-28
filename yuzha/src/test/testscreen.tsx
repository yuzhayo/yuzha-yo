import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  computeCoverTransform,
  createStagePipeline,
  roundStagePoint,
  type PreparedLayer,
  type StageTransform,
} from "@shared/stage/StageSystem";
import { runPipeline, type EnhancedLayerData } from "@shared/layer/layer";
import { getImageCenter } from "@shared/layer/layerCore";

export type TestScreenProps = {
  onBack?: () => void;
};

type RenderLayer = {
  entry: PreparedLayer["entry"];
  data: EnhancedLayerData;
};

const CLOCK_LAYER_IDS = new Set([
  "clock-background",
  "clock-hour-hand",
  "clock-minute-hand",
  "clock-moon",
]);

function ClockStagePreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [preparedLayers, setPreparedLayers] = useState<PreparedLayer[]>([]);
  const [renderLayers, setRenderLayers] = useState<RenderLayer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stageTransform, setStageTransform] = useState<StageTransform>(() => ({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    width: 0,
    height: 0,
  }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pipeline = await createStagePipeline();
        if (cancelled) return;
        const filtered = pipeline.layers.filter((layer) =>
          CLOCK_LAYER_IDS.has(layer.entry.LayerID),
        );
        setPreparedLayers(filtered);
      } catch (error) {
        if (cancelled) return;
        console.error("[TestScreen] Failed to prepare clock layers", error);
        setErrorMessage("Failed to load clock configuration.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (preparedLayers.length === 0) return;
    let rafId: number | null = null;

    const renderFrame = (time: number) => {
      const frame = preparedLayers
        .map((layer) => ({
          entry: layer.entry,
          data:
            layer.processors.length > 0
              ? (runPipeline(layer.data, layer.processors, time) as EnhancedLayerData)
              : (layer.data as EnhancedLayerData),
        }))
        .sort((a, b) => (a.entry.LayerOrder ?? 0) - (b.entry.LayerOrder ?? 0));
      setRenderLayers(frame);
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [preparedLayers]);

  useEffect(() => {
    const updateTransform = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const viewportWidth = rect.width || window.innerWidth;
      const viewportHeight = rect.height || window.innerHeight;
      const transform = computeCoverTransform(viewportWidth, viewportHeight);
      setStageTransform(transform);
    };

    updateTransform();
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateTransform) : null;
    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateTransform);
    return () => {
      window.removeEventListener("resize", updateTransform);
      resizeObserver?.disconnect();
    };
  }, []);

  const stageSize = 2048;

  const stageStyle = useMemo(() => {
    return {
      width: stageSize,
      height: stageSize,
      transform: `translate(${stageTransform.offsetX}px, ${stageTransform.offsetY}px) scale(${stageTransform.scale})`,
      transformOrigin: "top left",
    } as React.CSSProperties;
  }, [stageSize, stageTransform]);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen overflow-hidden bg-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0" style={stageStyle}>
          <div
            className="relative"
            style={{
              width: stageSize,
              height: stageSize,
            }}
          >
            {renderLayers.length > 0 ? (
              renderLayers.map(({ entry, data }) => {
                const naturalWidth = data.imageMapping.imageDimensions.width;
                const naturalHeight = data.imageMapping.imageDimensions.height;
                const scaledWidth = naturalWidth * data.scale.x;
                const scaledHeight = naturalHeight * data.scale.y;
                const placement = computeLayerPlacement(data, scaledWidth, scaledHeight);
                const pivotPercent = extractPivotPercent(data, naturalWidth, naturalHeight);
                const rotation = data.currentRotation ?? 0;

                return (
                  <div
                    key={entry.LayerID}
                    className="absolute"
                    style={{
                      left: placement.left,
                      top: placement.top,
                      width: scaledWidth,
                      height: scaledHeight,
                      transformOrigin: `${pivotPercent.x}% ${pivotPercent.y}%`,
                      transform: `rotate(${rotation}deg)`,
                      zIndex: entry.LayerOrder ?? 0,
                    }}
                  >
                    <img
                      src={data.imageUrl}
                      alt={entry.LayerID}
                      className="pointer-events-none block h-full w-full select-none"
                    />
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-300">
                {errorMessage ?? "Loading clock stage..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestScreen(props: TestScreenProps) {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <ClockStagePreview />
      {props.onBack && (
        <button
          type="button"
          onClick={props.onBack}
          className="absolute right-6 top-6 z-10 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-blue-500 active:bg-blue-600"
        >
          Back to Main Screen
        </button>
      )}
    </div>
  );
}

function computeLayerPlacement(
  data: EnhancedLayerData,
  scaledWidth: number,
  scaledHeight: number,
): { left: number; top: number } {
  const basePosition = data.position ?? { x: 0, y: 0 };
  const centerX = scaledWidth / 2;
  const centerY = scaledHeight / 2;
  const pivot = getImageCenter(data.imageMapping);
  const pivotX = pivot.x * data.scale.x;
  const pivotY = pivot.y * data.scale.y;
  const dx = centerX - pivotX;
  const dy = centerY - pivotY;
  const position = roundStagePoint(basePosition);
  return {
    left: position.x - centerX + dx,
    top: position.y - centerY + dy,
  };
}

function extractPivotPercent(
  data: EnhancedLayerData,
  naturalWidth: number,
  naturalHeight: number,
): { x: number; y: number } {
  if (data.calculation?.spinPoint?.image?.percent) {
    return {
      x: data.calculation.spinPoint.image.percent.x,
      y: data.calculation.spinPoint.image.percent.y,
    };
  }
  const imageCenter = getImageCenter(data.imageMapping);
  return {
    x: (imageCenter.x / naturalWidth) * 100,
    y: (imageCenter.y / naturalHeight) * 100,
  };
}

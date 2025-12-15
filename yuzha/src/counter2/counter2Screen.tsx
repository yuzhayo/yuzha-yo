import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StageCanvas,
  prepareLayer,
  is2DLayer,
  getProcessorsForEntry,
  computeLayerBounds,
  isLayerWithinStageBounds,
  buildLayerMotion,
  type StagePipeline,
  type LayerConfigEntry,
  type LayerMetadata,
  type EnhancedLayerData,
  type LayerProcessor,
  type PreparedLayer,
} from "@shared/layer";
import { getDeviceCapability } from "@shared/utils/DeviceCapability";
import Counter2Floating from "./counter2Floating";
import Counter2Settings from "./counter2Settings";
import { Counter2Controls } from "./counter2Buttons";
import rawConfig from "@shared/layer/ConfigCounter2.json";

if (import.meta.hot) {
  import.meta.hot.accept();
}

type Counter2ScreenProps = {
  onBack?: () => void;
};

const STAGE_SIZE = 2048;

async function createCounter2Pipeline(): Promise<StagePipeline> {
  const config = rawConfig as LayerConfigEntry[];
  const twoDLayers = config.filter(is2DLayer);

  const prepared = (
    await Promise.all(
      twoDLayers.map(async (entry) => {
        try {
          const layer = await prepareLayer(entry, STAGE_SIZE);
          if (!layer) {
            console.warn(`[Counter2] Skipping layer "${entry.LayerID}" - prepareLayer returned null`);
            return null;
          }

          const processors = getProcessorsForEntry(entry);
          const enhancedLayer = layer as EnhancedLayerData;
          const baseBounds = computeLayerBounds(
            enhancedLayer.position,
            enhancedLayer.scale,
            enhancedLayer.imageMapping,
          );
          const baseHasAnimation =
            processors.length > 0 ||
            Boolean(enhancedLayer.hasSpinAnimation || enhancedLayer.hasOrbitalAnimation);

          const motionArtifacts = buildLayerMotion(entry, enhancedLayer, STAGE_SIZE);
          if (motionArtifacts.processor) {
            processors.push(motionArtifacts.processor as LayerProcessor);
          }

          const finalHasAnimation = baseHasAnimation || Boolean(motionArtifacts.processor);

          const metadata: LayerMetadata = {
            baseBounds,
            isStatic: !finalHasAnimation,
            hasAnimation: finalHasAnimation,
            visibleByDefault: enhancedLayer.visible !== false,
          };

          if (!metadata.hasAnimation && !isLayerWithinStageBounds(baseBounds, STAGE_SIZE)) {
            console.info(`[Counter2] Skipping static offscreen layer "${entry.LayerID}"`);
            return null;
          }

          return {
            entry,
            data: enhancedLayer,
            processors,
            metadata,
          } satisfies PreparedLayer;
        } catch (error) {
          console.error(`[Counter2] Failed to prepare layer "${entry.LayerID}"`, error);
          return null;
        }
      })
    )
  ).filter((layer): layer is PreparedLayer => layer !== null);

  prepared.sort((a, b) => (a.entry.LayerOrder ?? 0) - (b.entry.LayerOrder ?? 0));

  return {
    stageSize: STAGE_SIZE,
    layers: prepared,
    markers: undefined,
  };
}

export default function Counter2Screen({ onBack }: Counter2ScreenProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showFloating, setShowFloating] = useState(false);

  const deviceCapability = useMemo(() => getDeviceCapability(), []);

  const rendererLabel = useMemo(() => {
    const perfLabel = deviceCapability.performanceLevel.toUpperCase();
    const deviceLabel = deviceCapability.isLowEndDevice ? "Low-End" : "Standard";
    return `${perfLabel} | ${deviceLabel} | Canvas2D`;
  }, [deviceCapability]);

  const handleToggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const handleToggleFloating = useCallback(() => {
    setShowFloating((prev) => !prev);
  }, []);

  const loadPipeline = useCallback(() => createCounter2Pipeline(), []);

  useEffect(() => {
    console.log("[Counter2Screen] Mounted with device capability:", deviceCapability);
    console.log("[Counter2Screen] Using Canvas2D renderer (optimized for all devices)");
  }, [deviceCapability]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <StageCanvas loadPipeline={loadPipeline} />

      <div className="absolute top-3 left-3 z-50">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg shadow-lg border border-slate-700/50 backdrop-blur-sm transition-colors"
        >
          Back
        </button>
      </div>

      <div className="absolute top-3 right-3 z-50 flex flex-col gap-2 items-end">
        <div className="px-3 py-1 text-xs text-white/80 bg-black/60 rounded border border-white/10">
          {rendererLabel}
        </div>
        <div className="px-2 py-1 text-[10px] text-teal-400/80 bg-teal-900/30 rounded border border-teal-700/30">
          Using shared/layer pipeline
        </div>
      </div>

      <Counter2Controls
        onToggleSettings={handleToggleSettings}
        onToggleFloating={handleToggleFloating}
      />

      {showSettings && (
        <Counter2Settings onClose={handleToggleSettings} />
      )}

      {showFloating && (
        <Counter2Floating onClose={handleToggleFloating} />
      )}
    </div>
  );
}

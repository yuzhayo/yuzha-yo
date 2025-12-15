import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StageCanvas,
  prepareLayer,
  is2DLayer,
  getProcessorsForEntry,
  computeLayerBounds,
  isLayerWithinStageBounds,
  buildLayerMotion,
  computeCoverTransform,
  stageToViewportCoords,
  type StagePipeline,
  type LayerConfigEntry,
  type LayerMetadata,
  type EnhancedLayerData,
  type LayerProcessor,
  type PreparedLayer,
  type StageTransform,
} from "@shared/layer";
import { getDeviceCapability } from "@shared/utils/DeviceCapability";
import Counter2Floating from "./counter2Floating";
import Counter2Settings from "./counter2Settings";
import { Counter2Controls } from "./counter2Buttons";
import Counter2FloatingButton from "./counter2FloatingButton";
import Counter2CountDisplay from "./counter2CountDisplay";
import rawConfig from "@shared/layer/ConfigCounter2.json";
import diceSound from "@shared/sound/dice.wav";

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

  const [count, setCount] = useState(0);
  const [isBumping, setIsBumping] = useState(false);
  const bumpTimeoutRef = React.useRef<number | undefined>(undefined);

  const [floatingSize] = useState(250);
  const [messageSize] = useState(240);
  const [messageFontSize] = useState(90);
  const [messageColor] = useState("#ffffff");

  const [hapticsEnabled] = useState(true);
  const [soundEnabled] = useState(false);

  const [buttonStagePosition] = useState({ x: 1024, y: 1300 });
  const [messageStagePosition] = useState({ x: 1024, y: 400 });

  const [transform, setTransform] = useState<StageTransform>(() =>
    typeof window !== "undefined"
      ? computeCoverTransform(window.innerWidth, window.innerHeight)
      : { scale: 1, offsetX: 0, offsetY: 0, width: 2048, height: 2048 }
  );

  const deviceCapability = useMemo(() => getDeviceCapability(), []);

  const rendererLabel = useMemo(() => {
    const perfLabel = deviceCapability.performanceLevel.toUpperCase();
    const deviceLabel = deviceCapability.isLowEndDevice ? "Low-End" : "Standard";
    return `${perfLabel} | ${deviceLabel} | Canvas2D`;
  }, [deviceCapability]);

  React.useEffect(() => {
    const saved = window.localStorage.getItem("counter2/count/v1");
    if (saved !== null) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed)) {
        setCount(parsed);
      }
    }
    return () => {
      if (bumpTimeoutRef.current !== undefined) {
        clearTimeout(bumpTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      setTransform(computeCoverTransform(window.innerWidth, window.innerHeight));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toScreenPosition = React.useCallback(
    (stagePos: { x: number; y: number }, size: number) => {
      const { x, y } = stageToViewportCoords(stagePos.x, stagePos.y, transform);
      const half = size / 2;
      const margin = 8;
      const maxX = Math.max(margin, window.innerWidth - size - margin);
      const maxY = Math.max(margin, window.innerHeight - size - margin);
      return {
        x: Math.min(maxX, Math.max(margin, x - half)),
        y: Math.min(maxY, Math.max(margin, y - half)),
      };
    },
    [transform]
  );

  const increment = React.useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      window.localStorage.setItem("counter2/count/v1", String(next));
      return next;
    });

    setIsBumping(true);
    if (bumpTimeoutRef.current !== undefined) {
      clearTimeout(bumpTimeoutRef.current);
    }
    bumpTimeoutRef.current = window.setTimeout(() => setIsBumping(false), 250);

    if (hapticsEnabled && "vibrate" in navigator) {
      navigator.vibrate(20);
    }

    if (soundEnabled) {
      const audio = new Audio(diceSound);
      audio.volume = 0.2;
      audio.play().catch(() => {});
    }
  }, [hapticsEnabled, soundEnabled]);

  const reset = React.useCallback(() => {
    setCount(0);
    window.localStorage.setItem("counter2/count/v1", "0");

    if (hapticsEnabled && "vibrate" in navigator) {
      navigator.vibrate(20);
    }
    if (soundEnabled) {
      const audio = new Audio(diceSound);
      audio.volume = 0.2;
      audio.play().catch(() => {});
    }
  }, [hapticsEnabled, soundEnabled]);

  const buttonScreenPosition = React.useMemo(
    () => toScreenPosition(buttonStagePosition, floatingSize),
    [buttonStagePosition, floatingSize, toScreenPosition]
  );

  const messageScreenPosition = React.useMemo(
    () => toScreenPosition(messageStagePosition, messageSize),
    [messageStagePosition, messageSize, toScreenPosition]
  );

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
      <style>{`
        @keyframes count-bump {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .count-bump {
          animation: count-bump 0.25s ease-out;
        }
      `}</style>

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
        onReset={reset}
      />

      <Counter2FloatingButton
        size={floatingSize}
        screenPosition={buttonScreenPosition}
        onActivate={increment}
      />

      <Counter2CountDisplay
        size={messageSize}
        screenPosition={messageScreenPosition}
      >
        <div
          className={`flex w-full items-center justify-center text-white drop-shadow ${
            isBumping ? "count-bump" : ""
          }`}
          style={{
            fontFamily: "Taimingda, sans-serif",
            fontSize: messageFontSize,
            color: messageColor,
            WebkitTextStroke: "1px rgba(0,0,0,0.6)",
            textShadow: "0 0 5px rgba(0,0,0,0.8)",
          }}
        >
          {count}
        </div>
      </Counter2CountDisplay>

      {showSettings && (
        <Counter2Settings onClose={handleToggleSettings} />
      )}

      {showFloating && (
        <Counter2Floating onClose={handleToggleFloating} />
      )}
    </div>
  );
}

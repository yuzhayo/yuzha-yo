import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildClockStageRuntime, computeClockFrame } from "@shared/clock/ClockProcessor";
import type { ClockRenderFrame } from "@shared/clock/clockTypes";
import { computeCoverTransform, type StageTransform } from "@shared/stage/StageSystem";

export type TestScreenProps = {
  onBack?: () => void;
};

type ClockRuntime = Awaited<ReturnType<typeof buildClockStageRuntime>>;

/**
 * ClockStagePreview renders the clock configuration inside the test screen.
 *
 * FUTURE AI AGENTS:
 * -----------------
 * - buildClockStageRuntime() handles heavy lifting once (asset loading,
 *   geometry precomputation).
 * - Every animation frame we recompute the render state so the clock follows
 *   real-time second/minute/hour progress.
 * - Stage cover logic mirrors StageSystem's behaviour so the 2048x2048 virtual
 *   stage fits any viewport.
 */
function ClockStagePreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ClockRuntime | null>(null);
  const [frame, setFrame] = useState<ClockRenderFrame | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runtimeReady, setRuntimeReady] = useState(false);
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
        const runtime = await buildClockStageRuntime();
        if (cancelled) return;
        runtimeRef.current = runtime;
        setRuntimeReady(true);
        setFrame(computeClockFrame(runtime));
      } catch (error) {
        if (cancelled) return;
        console.error("[TestScreen] Failed to build clock runtime", error);
        setErrorMessage("Failed to load clock configuration.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!runtimeReady || !runtimeRef.current) return;
    let frameId: number | null = null;

    const tick = () => {
      if (!runtimeRef.current) return;
      setFrame(computeClockFrame(runtimeRef.current));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [runtimeReady]);

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

  const stageSize = frame?.stageSize ?? runtimeRef.current?.stageSize ?? 2048;

  const stageStyle = useMemo(() => {
    return {
      width: stageSize,
      height: stageSize,
      transform: `translate(${stageTransform.offsetX}px, ${stageTransform.offsetY}px) scale(${stageTransform.scale})`,
      transformOrigin: "top left",
    } as React.CSSProperties;
  }, [stageSize, stageTransform]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen overflow-hidden bg-slate-900"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0" style={stageStyle}>
          <div
            className="relative"
            style={{
              width: stageSize,
              height: stageSize,
            }}
          >
            {runtimeReady && frame ? (
              frame.elements.map((element) => (
                <div
                  key={element.id}
                  className="absolute"
                  style={{
                    left: element.transform.translateX,
                    top: element.transform.translateY,
                    width: element.width,
                    height: element.height,
                    transformOrigin: `${element.transform.pivotPercentX}% ${element.transform.pivotPercentY}%`,
                    transform: `rotate(${element.transform.rotationDegrees}deg)`,
                    zIndex: element.layer,
                  }}
                >
                  <img
                    src={element.imageSrc}
                    alt={element.id}
                    className="pointer-events-none block h-full w-full select-none"
                  />
                </div>
              ))
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

import React, { useEffect, useRef } from "react";
import type { Application as PixiApplication } from "pixi.js";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer } from "../layer/LayerCore";
import { mountPixiLayers } from "../layer/LayerEnginePixi";

const STAGE_SIZE = 2048;

function computeCoverTransform(viewportWidth: number, viewportHeight: number) {
  const scale = Math.max(viewportWidth / STAGE_SIZE, viewportHeight / STAGE_SIZE);
  const width = STAGE_SIZE * scale;
  const height = STAGE_SIZE * scale;
  return {
    scale,
    offsetX: (viewportWidth - width) / 2,
    offsetY: (viewportHeight - height) / 2,
  };
}

export default function StagePixi() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let app: PixiApplication | null = null;
    let cleanupLayers: (() => void) | undefined;
    let cancelled = false;

    const run = async () => {
      const { Application } = await import("pixi.js");
      const instance = new Application({
        view: canvas,
        width: STAGE_SIZE,
        height: STAGE_SIZE,
        backgroundAlpha: 0,
        antialias: true,
      });

      if (cancelled) {
        instance.destroy(true, { children: true, texture: true, baseTexture: true });
        return;
      }

      app = instance;
      const config = loadLayerConfig();
      const twoDLayers = config.filter(is2DLayer);
      cleanupLayers = await mountPixiLayers(instance, twoDLayers);
    };

    run().catch((error) => {
      console.error("Failed to initialise Pixi stage", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    });

    const applyTransform = () => {
      const { innerWidth, innerHeight } = window;
      const { scale, offsetX, offsetY } = computeCoverTransform(innerWidth, innerHeight);

      canvas.width = STAGE_SIZE;
      canvas.height = STAGE_SIZE;
      canvas.style.width = `${STAGE_SIZE}px`;
      canvas.style.height = `${STAGE_SIZE}px`;

      container.style.width = `${STAGE_SIZE}px`;
      container.style.height = `${STAGE_SIZE}px`;
      container.style.transformOrigin = "top left";
      container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    };

    applyTransform();
    window.addEventListener("resize", applyTransform);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", applyTransform);
      cleanupLayers?.();
      app?.destroy(true, { children: true, texture: true, baseTexture: true });
      app = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-10" style={{ pointerEvents: "auto" }}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

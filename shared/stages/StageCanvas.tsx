import React, { useEffect, useRef } from "react";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer } from "../layer/LayerCore";
import { mountCanvasLayers } from "../layer/LayerEngineCanvas";

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

export default function StageCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }

    canvas.width = STAGE_SIZE;
    canvas.height = STAGE_SIZE;

    let cleanupLayers: (() => void) | undefined;

    const run = async () => {
      const config = loadLayerConfig();
      const twoDLayers = config.filter(is2DLayer);
      cleanupLayers = await mountCanvasLayers(ctx, twoDLayers);
    };

    run().catch((error) => {
      console.error("Failed to initialise Canvas stage", error);
    });

    const applyTransform = () => {
      const { innerWidth, innerHeight } = window;
      const { scale, offsetX, offsetY } = computeCoverTransform(innerWidth, innerHeight);

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
      window.removeEventListener("resize", applyTransform);
      cleanupLayers?.();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

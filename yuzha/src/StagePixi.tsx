import React, { useEffect, useRef } from "react";

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
    return () => window.removeEventListener("resize", applyTransform);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div ref={containerRef} className="absolute top-0 left-0">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
import React, { useRef, useEffect } from "react";
import { StageTransformManager } from "./StageTransform";
import { STAGE_CLASSES } from "./StageConstants";
import "./stage-cover.css";

export interface StageBackgroundProps {
  debug?: boolean;
  className?: string;
}

/**
 * StageBackground - Provides a fixed 2048x2048 background canvas
 * that doesn't disrupt existing UI layout
 *
 * Usage: Place as the first child of your screen container
 * - Creates background canvas with proper scaling
 * - Doesn't interfere with existing gestures or layout
 * - Provides access to stage coordinate system for other components
 */
export function StageBackground({ debug = false, className = "" }: StageBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize stage transform manager
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const manager = new StageTransformManager(debug);
    manager.initialize(containerRef.current, canvasRef.current);

    return () => {
      manager.dispose();
    };
  }, [debug]);

  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{ zIndex: 0 }} // Ensure it stays in background
    >
      <div ref={containerRef} className={STAGE_CLASSES.CONTAINER}>
        <canvas
          ref={canvasRef}
          className={STAGE_CLASSES.CANVAS}
          width={2048}
          height={2048}
          style={{ pointerEvents: "none" }} // Don't interfere with gestures
        />
      </div>
    </div>
  );
}

export default StageBackground;

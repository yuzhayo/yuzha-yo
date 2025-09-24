import React, { useRef, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { StageTransformManager, createCoordinateTransformer } from "./StageTransform";
import { STAGE_CLASSES } from "./StageConstants";
import type { StageCoordinates } from "./StageTypes";
import "./stage-cover.css";

export interface StageContainerProps {
  children?: ReactNode;
  debug?: boolean;
  className?: string;
  onStageClick?: (coordinates: StageCoordinates) => void;
  onStagePointerMove?: (coordinates: StageCoordinates) => void;
}

/**
 * StageContainer - React component that provides a fixed 2048x2048 canvas
 * with automatic scaling and coordinate transformation
 */
export function StageContainer({
  children,
  debug = false,
  className = "",
  onStageClick,
  onStagePointerMove,
}: StageContainerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [, setManager] = useState<StageTransformManager | null>(null);
  const [coordinateTransformer, setCoordinateTransformer] = useState<ReturnType<
    typeof createCoordinateTransformer
  > | null>(null);

  // Initialize stage transform manager
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const stageManager = new StageTransformManager(debug);
    stageManager.initialize(
      containerRef.current,
      canvasRef.current,
      overlayRef.current || undefined,
    );

    const transformer = createCoordinateTransformer(stageManager);

    setManager(stageManager);
    setCoordinateTransformer(transformer);

    return () => {
      stageManager.dispose();
    };
  }, [debug]);

  // Handle stage click events
  const handleStageClick = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!coordinateTransformer || !onStageClick) return;

    const coordinates = coordinateTransformer.transformPointerEvent(event);
    if (coordinates) {
      onStageClick(coordinates);
    }
  };

  // Handle stage pointer move events
  const handleStagePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!coordinateTransformer || !onStagePointerMove) return;

    const coordinates = coordinateTransformer.transformPointerEvent(event);
    if (coordinates) {
      onStagePointerMove(coordinates);
    }
  };

  return (
    <div ref={rootRef} className={`${STAGE_CLASSES.ROOT} ${className}`}>
      <div ref={containerRef} className={STAGE_CLASSES.CONTAINER}>
        <canvas ref={canvasRef} className={STAGE_CLASSES.CANVAS} width={2048} height={2048} />

        {/* Overlay for gesture handling */}
        <div
          ref={overlayRef}
          className={STAGE_CLASSES.OVERLAY}
          onPointerDown={handleStageClick}
          onPointerMove={handleStagePointerMove}
        />

        {/* Content overlay - positioned relative to stage coordinates */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none", // Let gestures pass through to overlay
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default StageContainer;

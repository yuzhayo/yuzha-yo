// IMPORT SECTION
import React, { useEffect, useRef } from 'react';

// STYLE SECTION
const canvasStyles = {
  display: 'block',
  width: '100%',
  height: '100%',
  outline: 'none',
  cursor: 'default'
};

const containerStyles = {
  width: '100%',
  height: '100%',
  position: 'relative' as const,
  overflow: 'hidden',
  backgroundColor: '#000'
};

// STATE SECTION
export interface ComponentCanvasProps {
  /** Canvas ref from useEngineSystem */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  
  /** Stages engine instance */
  stagesEngine: any;
  
  /** Engine state */
  engineState: any;
  
  /** Canvas container styles */
  style?: React.CSSProperties;
  
  /** Canvas container class name */
  className?: string;
  
  /** Enable resize observer */
  enableResize?: boolean;
  
  /** Performance monitoring update interval in ms */
  performanceUpdateInterval?: number;
  
  /** Event handlers */
  onPerformanceUpdate?: (metrics: any) => void;
}

// LOGIC SECTION

/**
 * Canvas component for dhepil engine rendering
 */
export default function ComponentCanvas({
  canvasRef,
  stagesEngine,
  engineState,
  style,
  className,
  enableResize = true,
  performanceUpdateInterval = 1000,
  onPerformanceUpdate
}: ComponentCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle container resize
  useEffect(() => {
    if (!enableResize || !containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvasRef.current!.width = width * window.devicePixelRatio;
        canvasRef.current!.height = height * window.devicePixelRatio;
        canvasRef.current!.style.width = `${width}px`;
        canvasRef.current!.style.height = `${height}px`;
        
        // Update engine viewport
        stagesEngine.resize(width, height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [enableResize, canvasRef, stagesEngine]);

  // Performance monitoring - use ref to avoid recreation on every state change
  const metricsRef = useRef(engineState);
  metricsRef.current = engineState;
  
  useEffect(() => {
    if (!onPerformanceUpdate || !metricsRef.current.isRunning) return;

    const interval = setInterval(() => {
      const currentMetrics = metricsRef.current;
      const metrics = {
        ...currentMetrics.performance,
        layerCount: currentMetrics.layerCount,
        behaviorCount: currentMetrics.behaviorCount,
        stageCount: currentMetrics.stageCount,
        isRunning: currentMetrics.isRunning,
        isInitialized: currentMetrics.isInitialized
      };
      onPerformanceUpdate(metrics);
    }, performanceUpdateInterval);

    return () => clearInterval(interval);
  }, [onPerformanceUpdate, performanceUpdateInterval, engineState.isRunning]);

  // Note: Engine references are now managed by parent component

  return (
    <div
      ref={containerRef}
      style={{ ...containerStyles, ...style }}
      className={className}
      data-dhepil-canvas-container
    >
      <canvas
        ref={canvasRef}
        style={canvasStyles}
        data-dhepil-canvas
      />
      
      {/* Development overlay for debugging */}
      {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          {engineState.isInitialized ? 
            `${engineState.performance.fps.toFixed(1)} FPS | ${engineState.layerCount} Layers | ${engineState.behaviorCount} Behaviors` :
            'Initializing...'
          }
        </div>
      )}
    </div>
  );
}

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export { ComponentCanvas };
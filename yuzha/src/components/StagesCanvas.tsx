import React, { useEffect } from 'react';
import { useStages } from '../hooks/useStages';
import type { StageObject, RenderQuality } from '@shared/stages/StagesTypes';

export interface StagesCanvasProps {
  width?: number;
  height?: number;
  quality?: Partial<RenderQuality>;
  objects?: StageObject[];
  className?: string;
  style?: React.CSSProperties;
  onInitialized?: () => void;
  onError?: (error: string) => void;
}

export function StagesCanvas({
  width = 800,
  height = 600,
  quality,
  objects = [],
  className,
  style,
  onInitialized,
  onError,
}: StagesCanvasProps) {
  const {
    canvasRef,
    isInitialized,
    error,
    addObject,
    removeObject,
  } = useStages({ quality });

  // Handle objects changes
  useEffect(() => {
    if (!isInitialized) return;

    // Add all objects
    objects.forEach(obj => {
      addObject(obj);
    });

    // Cleanup function to remove objects when they change
    return () => {
      objects.forEach(obj => {
        removeObject(obj.id);
      });
    };
  }, [objects, isInitialized, addObject, removeObject]);

  // Handle initialization callback
  useEffect(() => {
    if (isInitialized && onInitialized) {
      onInitialized();
    }
  }, [isInitialized, onInitialized]);

  // Handle error callback
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const containerStyle: React.CSSProperties = {
    width,
    height,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    ...style,
  };

  const canvasStyle: React.CSSProperties = {
    maxWidth: '100%',
    maxHeight: '100%',
    display: 'block',
  };

  if (error) {
    return (
      <div className={className} style={containerStyle}>
        <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '20px' }}>
          <div>Graphics Error</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={className} style={containerStyle}>
        <div style={{ color: '#64b5f6', textAlign: 'center' }}>
          Initializing Graphics...
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      {canvasRef.current && (
        <canvas
          ref={(el) => {
            if (el && canvasRef.current) {
              // Replace the canvas in the container
              el.parentNode?.replaceChild(canvasRef.current, el);
            }
          }}
          style={canvasStyle}
        />
      )}
    </div>
  );
}
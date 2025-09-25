// IMPORT SECTION
import React, { useState, useEffect } from 'react';
import { useEnginePerformance } from './ReactHooks-Engine.js';
import type { StagesEngine } from './EngineStages-Parent.js';
import type { LogicEngine } from './EngineLogic-Parent.js';
import type { LayerEngine } from './EngineLayer-Parent.js';

// STYLE SECTION
const statusStyles = {
  padding: '16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px'
};

const metricRowStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 0',
  borderBottom: '1px solid #e9ecef'
};

const metricLabelStyles = {
  fontWeight: 'bold' as const,
  color: '#495057'
};

const metricValueStyles = {
  color: '#28a745',
  fontFamily: 'monospace'
};

const sectionStyles = {
  marginBottom: '16px',
  padding: '12px',
  backgroundColor: 'white',
  borderRadius: '4px',
  border: '1px solid #dee2e6'
};

const headerStyles = {
  margin: '0 0 12px 0',
  fontSize: '16px',
  color: '#343a40'
};

const statusIndicatorStyles = {
  display: 'inline-block',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  marginRight: '8px'
};

// STATE SECTION
export interface ComponentStatusProps {
  /** Stages engine instance */
  stagesEngine: StagesEngine;
  
  /** Logic engine instance */
  logicEngine: LogicEngine;
  
  /** Layer engine instance */
  layerEngine: LayerEngine;
  
  /** Update interval in milliseconds */
  updateInterval?: number;
  
  /** Show detailed metrics */
  showDetailed?: boolean;
  
  /** Show performance graphs */
  showGraphs?: boolean;
  
  /** Status panel styles */
  style?: React.CSSProperties;
  
  /** Status panel class name */
  className?: string;
}

interface EngineMetrics {
  performance: {
    fps: number;
    frameTime: number;
    averageFrameTime: number;
    targetFPS: number;
  };
  layers: {
    count: number;
    visible: number;
    groups: number;
  };
  behaviors: {
    count: number;
    active: number;
    dirty: number;
  };
  stages: {
    count: number;
    enabled: number;
    triangles: number;
    drawCalls: number;
  };
  memory: {
    geometries: number;
    textures: number;
    programs: number;
  };
}

// LOGIC SECTION

/**
 * Status monitoring component for dhepil engine
 */
export default function ComponentStatus({
  stagesEngine,
  logicEngine,
  layerEngine,
  updateInterval = 1000,
  showDetailed = false,
  showGraphs = false,
  style,
  className
}: ComponentStatusProps) {
  const [metrics, setMetrics] = useState<EngineMetrics>({
    performance: { fps: 0, frameTime: 0, averageFrameTime: 0, targetFPS: 60 },
    layers: { count: 0, visible: 0, groups: 0 },
    behaviors: { count: 0, active: 0, dirty: 0 },
    stages: { count: 0, enabled: 0, triangles: 0, drawCalls: 0 },
    memory: { geometries: 0, textures: 0, programs: 0 }
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Use performance monitoring hook
  const performanceMetrics = useEnginePerformance(stagesEngine);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      try {
        // Get layer metrics
        const allLayers = layerEngine.getAllLayers();
        const visibleLayers = allLayers.filter(layer => layer.visible);

        // Get behavior metrics
        const allBehaviors = logicEngine.getAllBehaviors();
        const activeBehaviors = allBehaviors.filter(behavior => behavior.enabled);
        const dirtyBehaviors = allBehaviors.filter(behavior => behavior.isDirty());

        // Get stage metrics
        const allStages = stagesEngine.getAllStages();
        const enabledStages = allStages.filter(stage => stage.enabled);

        // Get renderer info if available
        const renderer = stagesEngine.getRenderer();
        const rendererInfo = renderer?.info || { 
          render: { triangles: 0, calls: 0 },
          memory: { geometries: 0, textures: 0 }
        };

        setMetrics({
          performance: {
            fps: performanceMetrics.fps || 0,
            frameTime: performanceMetrics.frameTime || 0,
            averageFrameTime: performanceMetrics.averageFrameTime || 0,
            targetFPS: performanceMetrics.targetFPS || 60
          },
          layers: {
            count: allLayers.length,
            visible: visibleLayers.length,
            groups: 0 // TODO: implement layer groups
          },
          behaviors: {
            count: allBehaviors.length,
            active: activeBehaviors.length,
            dirty: dirtyBehaviors.length
          },
          stages: {
            count: allStages.length,
            enabled: enabledStages.length,
            triangles: rendererInfo.render.triangles,
            drawCalls: rendererInfo.render.calls
          },
          memory: {
            geometries: rendererInfo.memory.geometries,
            textures: rendererInfo.memory.textures,
            programs: 0 // programs not available in current Three.js info
          }
        });

        setIsRunning(true);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error updating metrics:', error);
        setIsRunning(false);
      }
    };

    // Update immediately
    updateMetrics();

    // Set up interval
    const interval = setInterval(updateMetrics, updateInterval);

    return () => clearInterval(interval);
  }, [stagesEngine, logicEngine, layerEngine, performanceMetrics, updateInterval]);

  // Helper functions
  const getStatusColor = (value: number, threshold: number) => {
    if (value >= threshold) return '#28a745'; // Green
    if (value >= threshold * 0.7) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toFixed(decimals);
  };

  const formatMemory = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      style={{ ...statusStyles, ...style }}
      className={className}
      data-dhepil-status
    >
      {/* Engine Status */}
      <div style={sectionStyles}>
        <h3 style={headerStyles}>
          <span 
            style={{
              ...statusIndicatorStyles,
              backgroundColor: isRunning ? '#28a745' : '#dc3545'
            }}
          />
          Engine Status
        </h3>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Running:</span>
          <span style={{ ...metricValueStyles, color: isRunning ? '#28a745' : '#dc3545' }}>
            {isRunning ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Last Update:</span>
          <span style={metricValueStyles}>
            {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={sectionStyles}>
        <h3 style={headerStyles}>Performance</h3>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>FPS:</span>
          <span style={{ 
            ...metricValueStyles, 
            color: getStatusColor(metrics.performance.fps, 55)
          }}>
            {formatNumber(metrics.performance.fps)}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Frame Time:</span>
          <span style={metricValueStyles}>
            {formatNumber(metrics.performance.frameTime)} ms
          </span>
        </div>
        
        {showDetailed && (
          <>
            <div style={metricRowStyles}>
              <span style={metricLabelStyles}>Average Frame Time:</span>
              <span style={metricValueStyles}>
                {formatNumber(metrics.performance.averageFrameTime)} ms
              </span>
            </div>
            
            <div style={metricRowStyles}>
              <span style={metricLabelStyles}>Target FPS:</span>
              <span style={metricValueStyles}>
                {metrics.performance.targetFPS}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Layer Metrics */}
      <div style={sectionStyles}>
        <h3 style={headerStyles}>Layers</h3>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Total:</span>
          <span style={metricValueStyles}>
            {metrics.layers.count}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Visible:</span>
          <span style={metricValueStyles}>
            {metrics.layers.visible}
          </span>
        </div>
        
        {showDetailed && (
          <div style={metricRowStyles}>
            <span style={metricLabelStyles}>Groups:</span>
            <span style={metricValueStyles}>
              {metrics.layers.groups}
            </span>
          </div>
        )}
      </div>

      {/* Behavior Metrics */}
      <div style={sectionStyles}>
        <h3 style={headerStyles}>Behaviors</h3>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Total:</span>
          <span style={metricValueStyles}>
            {metrics.behaviors.count}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Active:</span>
          <span style={metricValueStyles}>
            {metrics.behaviors.active}
          </span>
        </div>
        
        {showDetailed && (
          <div style={metricRowStyles}>
            <span style={metricLabelStyles}>Dirty:</span>
            <span style={metricValueStyles}>
              {metrics.behaviors.dirty}
            </span>
          </div>
        )}
      </div>

      {/* Rendering Metrics */}
      <div style={sectionStyles}>
        <h3 style={headerStyles}>Rendering</h3>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Stages:</span>
          <span style={metricValueStyles}>
            {metrics.stages.enabled}/{metrics.stages.count}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Triangles:</span>
          <span style={metricValueStyles}>
            {metrics.stages.triangles.toLocaleString()}
          </span>
        </div>
        
        <div style={metricRowStyles}>
          <span style={metricLabelStyles}>Draw Calls:</span>
          <span style={metricValueStyles}>
            {metrics.stages.drawCalls}
          </span>
        </div>
      </div>

      {/* Memory Metrics */}
      {showDetailed && (
        <div style={sectionStyles}>
          <h3 style={headerStyles}>Memory</h3>
          
          <div style={metricRowStyles}>
            <span style={metricLabelStyles}>Geometries:</span>
            <span style={metricValueStyles}>
              {metrics.memory.geometries}
            </span>
          </div>
          
          <div style={metricRowStyles}>
            <span style={metricLabelStyles}>Textures:</span>
            <span style={metricValueStyles}>
              {metrics.memory.textures}
            </span>
          </div>
          
          <div style={metricRowStyles}>
            <span style={metricLabelStyles}>Programs:</span>
            <span style={metricValueStyles}>
              {metrics.memory.programs}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export { ComponentStatus };
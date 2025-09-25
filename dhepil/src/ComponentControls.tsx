// IMPORT SECTION
import React, { useState, useCallback } from 'react';
import { useAnimationBehaviors, useAssetSprites } from './ReactHooks-Engine.js';
import type { LayerEngine } from './EngineLayer-Parent.js';
import type { LogicEngine } from './EngineLogic-Parent.js';
import type LayerSceneManager from './EngineLayer-Children.js';

// STYLE SECTION
const controlsStyles = {
  padding: '16px',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  fontFamily: 'Arial, sans-serif'
};

const buttonStyles = {
  padding: '8px 16px',
  margin: '4px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
};

const disabledButtonStyles = {
  ...buttonStyles,
  backgroundColor: '#ccc',
  cursor: 'not-allowed'
};

const inputStyles = {
  padding: '4px 8px',
  margin: '4px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px'
};

const sectionStyles = {
  marginBottom: '16px',
  padding: '12px',
  backgroundColor: 'white',
  borderRadius: '4px',
  border: '1px solid #ddd'
};

// STATE SECTION
export interface ComponentControlsProps {
  /** Layer engine instance */
  layerEngine: LayerEngine;
  
  /** Logic engine instance */
  logicEngine: LogicEngine;
  
  /** Scene manager instance */
  sceneManager: LayerSceneManager;
  
  /** Show advanced controls */
  showAdvanced?: boolean;
  
  /** Available asset scenes */
  availableScenes?: string[];
  
  /** Control panel styles */
  style?: React.CSSProperties;
  
  /** Control panel class name */
  className?: string;
}

// LOGIC SECTION

/**
 * Control panel component for dhepil engine
 */
export default function ComponentControls({
  layerEngine,
  logicEngine,
  sceneManager,
  showAdvanced = false,
  availableScenes = ['gear', 'clock'],
  style,
  className
}: ComponentControlsProps) {
  const [selectedScene, setSelectedScene] = useState<string>('');
  const [rotationSpeed, setRotationSpeed] = useState<number>(Math.PI);
  const [orbitRadius, setOrbitRadius] = useState<number>(2);
  const [showBehaviorState, setShowBehaviorState] = useState<boolean>(false);

  // Use animation behaviors hook
  const {
    behaviors,
    createRotationBehavior,
    createClockBehavior,
    createOrbitBehavior,
    createAnimationBehavior,
    removeBehavior,
    getBehaviorState
  } = useAnimationBehaviors(logicEngine);

  // Use asset sprites hook
  const {
    assetRegistry,
    loadedScenes,
    loadGearScene,
    loadClockScene,
    createSpriteLayer,
    updateSpritePosition,
    updateSpriteRotation,
    updateSpriteScale
  } = useAssetSprites(layerEngine, sceneManager);

  // Scene management handlers
  const handleLoadScene = useCallback((sceneName: string) => {
    switch (sceneName) {
      case 'gear':
        loadGearScene();
        break;
      case 'clock':
        loadClockScene();
        break;
      default:
        console.warn(`Unknown scene: ${sceneName}`);
    }
  }, [loadGearScene, loadClockScene]);

  // Behavior management handlers
  const handleCreateRotationBehavior = useCallback(() => {
    const behaviorId = `rotation_${Date.now()}`;
    createRotationBehavior(behaviorId, rotationSpeed);
  }, [createRotationBehavior, rotationSpeed]);

  const handleCreateClockBehavior = useCallback(() => {
    const behaviorId = `clock_${Date.now()}`;
    createClockBehavior(behaviorId);
  }, [createClockBehavior]);

  const handleCreateOrbitBehavior = useCallback(() => {
    const behaviorId = `orbit_${Date.now()}`;
    createOrbitBehavior(behaviorId, orbitRadius, Math.PI);
  }, [createOrbitBehavior, orbitRadius]);

  // Layer management handlers
  const handleClearLayers = useCallback(() => {
    layerEngine.getAllLayers().forEach(layer => {
      layerEngine.removeLayer(layer.id);
    });
  }, [layerEngine]);

  const handleClearBehaviors = useCallback(() => {
    Array.from(behaviors.keys()).forEach(behaviorId => {
      removeBehavior(behaviorId);
    });
  }, [behaviors, removeBehavior]);

  // Asset sprite handlers
  const handleCreateSprite = useCallback((assetId: string) => {
    const spriteId = `${assetId}_${Date.now()}`;
    createSpriteLayer(spriteId, assetId, { x: 0, y: 0, z: 0 }, { pct: 100 });
  }, [createSpriteLayer]);

  return (
    <div
      style={{ ...controlsStyles, ...style }}
      className={className}
      data-dhepil-controls
    >
      {/* Scene Controls */}
      <div style={sectionStyles}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Scene Controls</h3>
        
        <div>
          <select
            value={selectedScene}
            onChange={(e) => setSelectedScene(e.target.value)}
            style={inputStyles}
          >
            <option value="">Select Scene</option>
            {availableScenes.map(scene => (
              <option key={scene} value={scene}>
                {scene.charAt(0).toUpperCase() + scene.slice(1)} Scene
              </option>
            ))}
          </select>
          
          <button
            onClick={() => selectedScene && handleLoadScene(selectedScene)}
            disabled={!selectedScene}
            style={selectedScene ? buttonStyles : disabledButtonStyles}
          >
            Load Scene
          </button>
        </div>

        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Loaded scenes: {loadedScenes.join(', ') || 'None'}
        </div>
      </div>

      {/* Behavior Controls */}
      <div style={sectionStyles}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Animation Behaviors</h3>
        
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Rotation Speed (rad/s):
          </label>
          <input
            type="number"
            step="0.1"
            value={rotationSpeed}
            onChange={(e) => setRotationSpeed(parseFloat(e.target.value) || 0)}
            style={inputStyles}
          />
          <button onClick={handleCreateRotationBehavior} style={buttonStyles}>
            Add Rotation
          </button>
        </div>

        <div>
          <button onClick={handleCreateClockBehavior} style={buttonStyles}>
            Add Clock Behavior
          </button>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Orbit Radius:
          </label>
          <input
            type="number"
            step="0.1"
            value={orbitRadius}
            onChange={(e) => setOrbitRadius(parseFloat(e.target.value) || 0)}
            style={inputStyles}
          />
          <button onClick={handleCreateOrbitBehavior} style={buttonStyles}>
            Add Orbit
          </button>
        </div>

        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Active behaviors: {behaviors.size}
        </div>
      </div>

      {/* Asset Sprites */}
      <div style={sectionStyles}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Asset Sprites</h3>
        
        <div>
          {Object.keys(assetRegistry).map(assetId => (
            <button
              key={assetId}
              onClick={() => handleCreateSprite(assetId)}
              style={buttonStyles}
            >
              Add {assetId}
            </button>
          ))}
        </div>
        
        {Object.keys(assetRegistry).length === 0 && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            Loading asset registry...
          </div>
        )}
      </div>

      {/* Engine Controls */}
      <div style={sectionStyles}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Engine Controls</h3>
        
        <button onClick={handleClearLayers} style={buttonStyles}>
          Clear Layers
        </button>
        
        <button onClick={handleClearBehaviors} style={buttonStyles}>
          Clear Behaviors
        </button>
      </div>

      {/* Advanced Controls */}
      {showAdvanced && (
        <div style={sectionStyles}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Advanced</h3>
          
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={showBehaviorState}
              onChange={(e) => setShowBehaviorState(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Show Behavior State
          </label>
          
          {showBehaviorState && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#f8f8f8',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              <pre>
                {JSON.stringify(
                  Array.from(behaviors.keys()).reduce((acc, behaviorId) => {
                    acc[behaviorId] = getBehaviorState(behaviorId);
                    return acc;
                  }, {} as Record<string, any>),
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export { ComponentControls };
// IMPORT SECTION
import React, { useState, useCallback, useEffect } from 'react';
import ComponentCanvas from './ComponentCanvas.js';
import ComponentControls from './ComponentControls.js';
import ComponentStatus from './ComponentStatus.js';
import useEngineSystem, { type EngineConfig } from './ReactHooks-Engine.js';
import * as THREE from 'three';

// STYLE SECTION
const appStyles = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column' as const,
  backgroundColor: '#f0f0f0',
  fontFamily: 'Arial, sans-serif'
};

const headerStyles = {
  padding: '16px',
  backgroundColor: '#2c3e50',
  color: 'white',
  textAlign: 'center' as const,
  fontSize: '24px',
  fontWeight: 'bold' as const
};

const mainContentStyles = {
  flex: 1,
  display: 'flex',
  gap: '16px',
  padding: '16px',
  overflow: 'hidden'
};

const canvasContainerStyles = {
  flex: 1,
  minHeight: '400px',
  backgroundColor: '#000',
  borderRadius: '8px',
  overflow: 'hidden'
};

const sidebarStyles = {
  width: '350px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '16px',
  overflow: 'auto'
};

const footerStyles = {
  padding: '8px 16px',
  backgroundColor: '#34495e',
  color: 'white',
  fontSize: '12px',
  textAlign: 'center' as const
};

// STATE SECTION
interface AppState {
  engineConfig: EngineConfig;
  showAdvancedControls: boolean;
  showDetailedStatus: boolean;
}

// LOGIC SECTION

/**
 * Main dhepil application component
 */
const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    engineConfig: {
      layer: {
        maxLayers: 100,
        enableValidation: true
      },
      logic: {
        updateFrequency: 60,
        enablePhysics: false,
        enableAnimations: true,
        enableInteractions: true,
        behaviorDefaults: {
          animation: {
            easing: 'easeInOut',
            duration: 2000
          },
          interaction: {
            debounce: 100
          },
          physics: {
            gravity: 9.81,
            friction: 0.8
          }
        },
        performance: {
          targetFPS: 60,
          enableProfiling: true,
          adaptiveQuality: false
        }
      },
      stages: {
        renderer: {
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance',
          outputColorSpace: THREE.SRGBColorSpace
        },
        scene: {
          background: new THREE.Color(0x1a1a1a)
        },
        camera: {
          type: 'perspective',
          fov: 75,
          aspect: window.innerWidth / window.innerHeight,
          near: 0.1,
          far: 1000,
          position: new THREE.Vector3(0, 0, 5),
          target: new THREE.Vector3(0, 0, 0)
        },
        performance: {
          targetFPS: 60,
          enableProfiling: true,
          adaptiveQuality: false
        }
      }
    },
    showAdvancedControls: false,
    showDetailedStatus: false
  });

  // Event handlers
  const handleEngineInitialized = useCallback(() => {
    console.log('dhepil engine initialized successfully');
  }, []);

  const handleEngineError = useCallback((error: Error) => {
    console.error('dhepil engine error:', error);
    // TODO: Show user-friendly error message
  }, []);

  // Initialize main engine system for all components to share
  const engineSystem = useEngineSystem(appState.engineConfig, {
    autoStart: true,
    enablePerformanceMonitoring: true,
    onInitialized: handleEngineInitialized,
    onError: handleEngineError
  });

  const {
    canvasRef,
    engineState,
    layerEngine,
    logicEngine,
    stagesEngine,
    sceneManager,
    start,
    stop,
    reset
  } = engineSystem;

  // Load default scene when engines are ready
  useEffect(() => {
    if (engineState.isInitialized && sceneManager) {
      try {
        const gearScene = sceneManager.createGearScene();
        sceneManager.loadScene(gearScene);
      } catch (error) {
        console.warn('Failed to load default gear scene:', error);
      }
    }
  }, [engineState.isInitialized, sceneManager]);

  const handlePerformanceUpdate = useCallback((metrics: any) => {
    // Handle performance metrics if needed
    if (metrics.fps < 30) {
      console.warn('Low FPS detected:', metrics.fps);
    }
  }, []);

  const toggleAdvancedControls = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      showAdvancedControls: !prev.showAdvancedControls
    }));
  }, []);

  const toggleDetailedStatus = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      showDetailedStatus: !prev.showDetailedStatus
    }));
  }, []);

  return (
    <div style={appStyles}>
      {/* Header */}
      <header style={headerStyles}>
        dhepil - Multi-Layered Rendering System
      </header>

      {/* Main Content */}
      <main style={mainContentStyles}>
        {/* Canvas Area */}
        <div style={canvasContainerStyles}>
          <ComponentCanvas
            canvasRef={canvasRef}
            stagesEngine={stagesEngine}
            engineState={engineState}
            onPerformanceUpdate={handlePerformanceUpdate}
            enableResize={true}
          />
        </div>

        {/* Sidebar */}
        <aside style={sidebarStyles}>
          {/* Controls Panel */}
          {layerEngine && logicEngine && sceneManager && (
            <ComponentControls
              layerEngine={layerEngine}
              logicEngine={logicEngine}
              sceneManager={sceneManager}
              showAdvanced={appState.showAdvancedControls}
              availableScenes={['gear', 'clock']}
            />
          )}

          {/* Status Panel */}
          {stagesEngine && logicEngine && layerEngine && (
            <ComponentStatus
              stagesEngine={stagesEngine}
              logicEngine={logicEngine}
              layerEngine={layerEngine}
              updateInterval={1000}
              showDetailed={appState.showDetailedStatus}
              showGraphs={false}
            />
          )}

          {/* Settings Panel */}
          <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Settings</h3>
            
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              <input
                type="checkbox"
                checked={appState.showAdvancedControls}
                onChange={toggleAdvancedControls}
                style={{ marginRight: '8px' }}
              />
              Advanced Controls
            </label>
            
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              fontSize: '14px'
            }}>
              <input
                type="checkbox"
                checked={appState.showDetailedStatus}
                onChange={toggleDetailedStatus}
                style={{ marginRight: '8px' }}
              />
              Detailed Status
            </label>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer style={footerStyles}>
        dhepil v1.0 - Layer System | Logic System | Stages System | React Integration
      </footer>
    </div>
  );
};

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export default App;
// IMPORT SECTION
import React, { useState, useCallback } from 'react';
import StagesCanvasLayer from './StagesCanvasLayer';
import { mainScreenConfigs, configPresets } from './MainScreenConfig';
import type { LibraryConfig } from '@shared/layer/LayerTypes';
import "@shared/fonts/taimingda.css";

// STYLE SECTION
const MAIN_STYLES = `
:root {
  color-scheme: dark;
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body,
#root {
  min-height: 100vh;
}

.main-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: radial-gradient(circle at top, rgba(59, 130, 246, 0.35), transparent 60%);
  gap: 2rem;
}

.main-header {
  text-align: center;
  max-width: 560px;
}

.main-header__title {
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 600;
  font-family: "Taimingda", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  margin-bottom: 1rem;
}

.main-header__subtitle {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(203, 213, 225, 0.8);
}

.main-canvas-container {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 35px 80px -45px rgba(15, 23, 42, 0.9);
}

.main-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.main-control-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.main-control-label {
  font-size: 0.875rem;
  color: rgba(203, 213, 225, 0.9);
  font-weight: 500;
}

.main-control-button {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.1);
  color: #e2e8f0;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.main-control-button:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.main-control-button.active {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.7);
}

.main-status {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: rgba(203, 213, 225, 0.7);
  align-items: center;
}

.main-status-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.main-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.main-status-dot.error {
  background: #ef4444;
}

.main-status-dot.warning {
  background: #f59e0b;
}
`;

// STATE SECTION
interface MainScreenState {
  currentConfigIndex: number;
  isInitialized: boolean;
  error: string | null;
  warnings: string[];
  currentConfig: LibraryConfig;
}

// LOGIC SECTION
function MainScreen() {
  const [state, setState] = useState<MainScreenState>({
    currentConfigIndex: 0,
    isInitialized: false,
    error: null,
    warnings: [],
    currentConfig: configPresets[0]?.config || mainScreenConfigs.minimal,
  });

  const handleConfigChange = useCallback((configIndex: number) => {
    const preset = configPresets[configIndex];
    if (preset && configIndex >= 0 && configIndex < configPresets.length) {
      setState(prev => ({
        ...prev,
        currentConfigIndex: configIndex,
        currentConfig: preset.config,
        error: null,
        warnings: [],
      }));
    }
  }, []);

  const handleInitialized = useCallback(() => {
    setState(prev => ({
      ...prev,
      isInitialized: true,
      error: null,
    }));
  }, []);

  const handleError = useCallback((errorMsg: string) => {
    setState(prev => ({
      ...prev,
      error: errorMsg,
      isInitialized: false,
    }));
  }, []);

  const handleWarning = useCallback((warnings: string[]) => {
    setState(prev => ({
      ...prev,
      warnings,
    }));
  }, []);

  const getStatusDotClass = useCallback(() => {
    if (state.error) return 'main-status-dot error';
    if (state.warnings.length > 0) return 'main-status-dot warning';
    return 'main-status-dot';
  }, [state.error, state.warnings]);

  const getStatusMessage = useCallback(() => {
    if (state.error) return `Error: ${state.error}`;
    if (state.warnings.length > 0) return `Warnings: ${state.warnings.length}`;
    if (state.isInitialized) return 'Graphics Ready';
    return 'Initializing...';
  }, [state.error, state.warnings, state.isInitialized]);

  const getLayerCount = useCallback(() => {
    return state.currentConfig.layers.length;
  }, [state.currentConfig]);

  // UI SECTION
  return (
    <>
      <style>{MAIN_STYLES}</style>
      <div className="main-app">
        <header className="main-header">
          <h1 className="main-header__title">Yuzha Layer System Demo</h1>
          <p className="main-header__subtitle">
            Interactive layer-based animations powered by the unified layer → stages → display workflow. 
            Try different animation configurations below.
          </p>
        </header>

        <div className="main-canvas-container">
          <div className="main-controls">
            <div className="main-control-group">
              <span className="main-control-label">Configuration:</span>
              {configPresets.map((preset, index) => (
                <button
                  key={preset.name}
                  className={`main-control-button ${state.currentConfigIndex === index ? 'active' : ''}`}
                  onClick={() => handleConfigChange(index)}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <StagesCanvasLayer
            width={800}
            height={600}
            config={state.currentConfig}
            onInitialized={handleInitialized}
            onError={handleError}
            onWarning={handleWarning}
            quality={{
              dpr: Math.min(window.devicePixelRatio, 2),
              antialias: true,
              shadows: false,
              textureScale: 1.0,
            }}
          />

          <div className="main-status">
            <div className="main-status-item">
              <div className={getStatusDotClass()}></div>
              <span>{getStatusMessage()}</span>
            </div>
            <div className="main-status-item">
              <span>Layers: {getLayerCount()}</span>
            </div>
            <div className="main-status-item">
              <span>Config: {configPresets[state.currentConfigIndex]?.name || 'Unknown'}</span>
            </div>
            <div className="main-status-item">
              <span>Canvas: 2048×2048</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// EFFECT SECTION (unused)

// EXPORT SECTION
export default MainScreen;
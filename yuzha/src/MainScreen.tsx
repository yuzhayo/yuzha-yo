import React, { useState, useCallback } from 'react';
import { StagesCanvas } from './components/StagesCanvas';
import { sampleObjects, animationPresets } from './config/sampleAnimations';
import type { StageObject } from '@shared/stages/StagesTypes';
import "@shared/fonts/taimingda.css";

const STYLE_TAG = `
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

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: radial-gradient(circle at top, rgba(59, 130, 246, 0.35), transparent 60%);
  gap: 2rem;
}

.header {
  text-align: center;
  max-width: 560px;
}

.header__title {
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 600;
  font-family: "Taimingda", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  margin-bottom: 1rem;
}

.header__subtitle {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(203, 213, 225, 0.8);
}

.graphics-container {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 35px 80px -45px rgba(15, 23, 42, 0.9);
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.control-label {
  font-size: 0.875rem;
  color: rgba(203, 213, 225, 0.9);
  font-weight: 500;
}

.control-button {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.1);
  color: #e2e8f0;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-button:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.control-button.active {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.7);
}

.status {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: rgba(203, 213, 225, 0.7);
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.status-dot.error {
  background: #ef4444;
}
`;

function MainScreen() {
  const [currentPreset, setCurrentPreset] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objects, setObjects] = useState<StageObject[]>(sampleObjects);

  const handlePresetChange = useCallback((presetIndex: number) => {
    const preset = animationPresets[presetIndex];
    if (preset && presetIndex >= 0 && presetIndex < animationPresets.length) {
      setCurrentPreset(presetIndex);
      setObjects(preset.objects);
    }
  }, []);

  const handleInitialized = useCallback(() => {
    setIsInitialized(true);
    setError(null);
  }, []);

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setIsInitialized(false);
  }, []);

  return (
    <>
      <style>{STYLE_TAG}</style>
      <div className="app">
        <header className="header">
          <h1 className="header__title">Yuzha Graphics Demo</h1>
          <p className="header__subtitle">
            Interactive Three.js graphics powered by the Stages system. 
            Try different animation presets below.
          </p>
        </header>

        <div className="graphics-container">
          <div className="controls">
            <div className="control-group">
              <span className="control-label">Animation:</span>
              {animationPresets.map((preset, index) => (
                <button
                  key={preset.name}
                  className={`control-button ${currentPreset === index ? 'active' : ''}`}
                  onClick={() => handlePresetChange(index)}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <StagesCanvas
            width={800}
            height={600}
            objects={objects}
            onInitialized={handleInitialized}
            onError={handleError}
            quality={{
              dpr: Math.min(window.devicePixelRatio, 2),
              antialias: true,
              shadows: false,
              textureScale: 1.0,
            }}
          />

          <div className="status">
            <div className="status-item">
              <div className={`status-dot ${error ? 'error' : ''}`}></div>
              <span>
                {error ? `Error: ${error}` : isInitialized ? 'Graphics Ready' : 'Initializing...'}
              </span>
            </div>
            <div className="status-item">
              <span>Objects: {objects.length}</span>
            </div>
            <div className="status-item">
              <span>Preset: {animationPresets[currentPreset]?.name || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MainScreen;
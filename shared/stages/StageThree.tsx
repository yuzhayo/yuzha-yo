import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer } from "../layer/LayerCore";
import { mountThreeLayers } from "../layer/LayerEngineThree";
import { STAGE_SIZE, createStageTransformer } from "../utils/stage2048";

export default function StageThree() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(STAGE_SIZE, STAGE_SIZE, false);
    renderer.setClearColor(0x000000, 0);

    const camera = new THREE.OrthographicCamera(
      -STAGE_SIZE / 2,
      STAGE_SIZE / 2,
      STAGE_SIZE / 2,
      -STAGE_SIZE / 2,
      0.1,
      2000,
    );
    camera.position.z = 1000;

    const scene = new THREE.Scene();

    let cleanupLayers: (() => void) | undefined;
    let cleanupTransform: (() => void) | undefined;
    let animationId: number;

    const run = async () => {
      const config = loadLayerConfig();
      const twoDLayers = config.filter(is2DLayer);
      cleanupLayers = await mountThreeLayers(scene, twoDLayers);

      const animate = () => {
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(animate);
      };
      animate();
    };

    run().catch((error) => {
      console.error("Failed to initialise Three.js stage", error);
    });

    // Set canvas dimensions for Three.js rendering
    canvas.width = STAGE_SIZE;
    canvas.height = STAGE_SIZE;

    cleanupTransform = createStageTransformer(canvas, container);

    return () => {
      cleanupTransform?.();
      cancelAnimationFrame(animationId);
      cleanupLayers?.();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

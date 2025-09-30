import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { loadLayerConfig } from "../config/Config";
import { is2DLayer } from "../layer/LayerCore";
import { mountThreeLayers } from "../layer/LayerEngineThree";
const STAGE_SIZE = 2048;
function computeCoverTransform(viewportWidth, viewportHeight) {
    const scale = Math.max(viewportWidth / STAGE_SIZE, viewportHeight / STAGE_SIZE);
    const width = STAGE_SIZE * scale;
    const height = STAGE_SIZE * scale;
    return {
        scale,
        offsetX: (viewportWidth - width) / 2,
        offsetY: (viewportHeight - height) / 2,
    };
}
export default function StageThree() {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas)
            return;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(STAGE_SIZE, STAGE_SIZE, false);
        renderer.setClearColor(0x000000, 0);
        const camera = new THREE.OrthographicCamera(-STAGE_SIZE / 2, STAGE_SIZE / 2, STAGE_SIZE / 2, -STAGE_SIZE / 2, 0.1, 2000);
        camera.position.z = 1000;
        const scene = new THREE.Scene();
        let cleanupLayers;
        let animationId;
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
        const applyTransform = () => {
            const { innerWidth, innerHeight } = window;
            const { scale, offsetX, offsetY } = computeCoverTransform(innerWidth, innerHeight);
            canvas.width = STAGE_SIZE;
            canvas.height = STAGE_SIZE;
            canvas.style.width = `${STAGE_SIZE}px`;
            canvas.style.height = `${STAGE_SIZE}px`;
            container.style.width = `${STAGE_SIZE}px`;
            container.style.height = `${STAGE_SIZE}px`;
            container.style.transformOrigin = "top left";
            container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        };
        applyTransform();
        window.addEventListener("resize", applyTransform);
        return () => {
            window.removeEventListener("resize", applyTransform);
            cancelAnimationFrame(animationId);
            cleanupLayers?.();
            renderer.dispose();
        };
    }, []);
    return (_jsx("div", { ref: containerRef, className: "absolute inset-0 z-0 pointer-events-none", children: _jsx("canvas", { ref: canvasRef, className: "block" }) }));
}

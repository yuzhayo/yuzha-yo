import React from "react";
import * as THREE from "three";
import { requireAssetUrl } from "@shared/asset/assetResolver";
import { createPolarAura } from "@shared/effect/polaraura";

const systemMessageBg = requireAssetUrl("SystemMessageBg");

export type CounterFloatingMessageProps = {
  size?: number;
  screenPosition?: { x: number; y: number };
  children?: React.ReactNode;
};

/**
 * Always-visible floating image for SystemMessageBg.
 * Minimal chrome; positioning/sizing driven by props.
 */
export default function CounterFloatingMessage({
  size = 240,
  screenPosition = { x: 24, y: 24 },
  children,
}: CounterFloatingMessageProps) {
  const auraCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!auraCanvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: auraCanvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(size, size);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const loader = new THREE.TextureLoader();
    const meshes = createPolarAura(loader);
    meshes.forEach((mesh) => scene.add(mesh));

    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      meshes.forEach((mesh) => {
        const mat = mesh.material as THREE.ShaderMaterial;
        if (mat.uniforms?.uTime) {
          mat.uniforms.uTime.value = elapsed;
        }
      });
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      meshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.ShaderMaterial).dispose();
        scene.remove(mesh);
      });
      renderer.dispose();
    };
  }, [size]);

  return (
    <div
      className="pointer-events-none fixed z-20"
      style={{
        left: screenPosition.x,
        top: screenPosition.y,
      }}
    >
      <div
        className="pointer-events-auto relative rounded-xl bg-transparent overflow-hidden"
        style={{
          width: size,
          height: size,
          maxWidth: "90vw",
          maxHeight: "90vh",
        }}
      >
        <canvas
          ref={auraCanvasRef}
          className="pointer-events-none absolute inset-0"
          width={size}
          height={size}
        />
        <img
          src={systemMessageBg}
          alt="System Message"
          className="pointer-events-none block h-full w-full object-contain select-none"
          draggable={false}
        />
        {children ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

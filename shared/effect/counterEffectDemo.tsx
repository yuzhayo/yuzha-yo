import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { requireAssetUrl } from "../asset/assetResolver";
import { createPolarAura } from "./polaraura";
import { createStraightRay } from "./straightRay";
import straightRayConfig from "./straightRay.config.json";

const wave22TextureUrl = requireAssetUrl("alpha_noise_256_wave_22");
const wave04TextureUrl = requireAssetUrl("alpha_noise_256_wave_04");
const wave05TextureUrl = requireAssetUrl("alpha_noise_256_wave_05");
const polarMaskTextureUrl = requireAssetUrl("Untitled-1");

export type CounterEffectDemoProps = {
  onClose?: () => void;
};

export default function CounterEffectDemo({ onClose }: CounterEffectDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationType, setAnimationType] = React.useState<
    | "polar"
    | "polarMask"
    | "radial"
    | "straight"
    | "perspective"
    | "perspectiveCircle"
    | "purpleFire"
    | "orangeBurst"
    | "auraBlast"
    | "smokeStack"
    | "smokeRadial"
  >("straight");

  const rayRotationOffsets = useMemo(() => {
    const offsets: number[] = [];
    for (let i = 0; i < 24; i++) {
      offsets.push((Math.random() - 0.5) * 0.15);
    }
    return offsets;
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(400, 400);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    const noiseTexture = textureLoader.load(wave22TextureUrl);
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;

    // Clear scene
    while (scene.children.length > 0) {
      const child = scene.children[0];
      if (child) {
        scene.remove(child);
      }
    }

    const layers: THREE.Mesh[] = [];

    if (animationType === "polar") {
      const polarMeshes = createPolarAura(textureLoader);
      polarMeshes.forEach((mesh) => {
        scene.add(mesh);
        layers.push(mesh);
      });
    } else if (animationType === "polarMask") {
      // POLAR MASK - dual-noise scroll through mask (grayscale)
      const maskTex = textureLoader.load(polarMaskTextureUrl);
      maskTex.wrapS = THREE.ClampToEdgeWrapping;
      maskTex.wrapT = THREE.ClampToEdgeWrapping;

      const tex1 = textureLoader.load(wave05TextureUrl);
      tex1.wrapS = THREE.RepeatWrapping;
      tex1.wrapT = THREE.RepeatWrapping;

      const tex2 = textureLoader.load(wave22TextureUrl);
      tex2.wrapS = THREE.RepeatWrapping;
      tex2.wrapT = THREE.RepeatWrapping;

      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        uniform sampler2D uMask;
        uniform sampler2D uTex1;
        uniform sampler2D uTex2;
        uniform float uTime;
        uniform float uLoop;
        uniform float uOpacity;
        uniform float uScale;
        uniform float uTimeOffset;
        varying vec2 vUv;

        const float PI = 3.14159265;

        void main() {
          vec2 center = vec2(0.5);
          vec2 uvBase = (vUv - center) * uScale + center;

          // looped phase 0..1
          float phase = fract((uTime + uTimeOffset) / uLoop);
          float flow = sin(2.0 * PI * phase);

          vec2 uv1 = uvBase + flow * vec2(-0.373, 1.736);
          vec2 uv2 = uvBase + flow * vec2(-0.264, 2.025);

          float mask = texture2D(uMask, vUv).r;
          if (mask < 0.01) discard;

          float n1 = texture2D(uTex1, uv1).r;
          float n2 = texture2D(uTex2, uv2).r;
          float combined = mix(n1, n2, 0.79);

          // soften extremes
          float intensity = smoothstep(0.0, 1.0, combined);

          vec3 color = vec3(intensity);
          gl_FragColor = vec4(color, intensity * mask * uOpacity);
        }
      `;

      const layerCount = 3;
      for (let i = 0; i < layerCount; i++) {
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uMask: { value: maskTex },
            uTex1: { value: tex1 },
            uTex2: { value: tex2 },
            uTime: { value: 0 },
            uLoop: { value: 1.0 },
            uOpacity: { value: 0.65 - i * 0.12 },
            uScale: { value: 0.45 }, // UV scale
            uTimeOffset: { value: i * 0.2 },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const geometry = new THREE.PlaneGeometry(2.2, 2.2);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -i * 0.01;
        scene.add(mesh);
        layers.push(mesh);
      }
    } else if (animationType === "straight") {
      // STRAIGHT SMOKE RAY (shared effect implementation)
      const rayMeshes = createStraightRay(textureLoader, straightRayConfig);
      rayMeshes.forEach((mesh, index) => {
        mesh.position.z = -index * 0.01;
        scene.add(mesh);
        layers.push(mesh);
      });
    } else if (animationType === "purpleFire") {
      // PURPLE FIRE - upward flowing with purple gradient
      const layerCount = 5;

      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uOffset;
        uniform float uOpacity;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          
          // Perspective: narrow at base, wider at tip
          float perspective = 0.4 + vUv.y * 0.6;
          uv.x = (uv.x - 0.5) * perspective + 0.5;
          
          // Animate upward
          uv.y -= uTime * 0.15 + uOffset;
          
          vec4 noise = texture2D(uTexture, uv);
          
          // Purple color gradient (dark purple to bright purple/white)
          vec3 darkPurple = vec3(0.3, 0.1, 0.5);
          vec3 brightPurple = vec3(0.8, 0.3, 1.0);
          vec3 white = vec3(1.0, 0.9, 1.0);
          
          // Map noise intensity to color
          vec3 color;
          if (noise.r < 0.5) {
            color = mix(darkPurple, brightPurple, noise.r * 2.0);
          } else {
            color = mix(brightPurple, white, (noise.r - 0.5) * 2.0);
          }
          
          // Fade at edges
          float fadeY = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
          float fadeX = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
          
          float alpha = noise.a * fadeY * fadeX * uOpacity;
          
          gl_FragColor = vec4(color, alpha);
        }
      `;

      for (let i = 0; i < layerCount; i++) {
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTexture: { value: noiseTexture },
            uTime: { value: 0 },
            uOffset: { value: i * 0.25 },
            uOpacity: { value: 0.7 - i * 0.1 },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const geometry = new THREE.PlaneGeometry(0.8, 2.0);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -i * 0.01;
        scene.add(mesh);
        layers.push(mesh);
      }
    } else if (animationType === "smokeStack") {
      // SMOKE STACK - simple stacked smoke using wave_04, stretch before fade
      const layerCount = 6;

      // Load wave_04 texture for this effect
      const smokeTexture = textureLoader.load(wave04TextureUrl);
      smokeTexture.wrapS = THREE.RepeatWrapping;
      smokeTexture.wrapT = THREE.RepeatWrapping;

      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uOffset;
        uniform float uOpacity;
        uniform float uSpeed;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          
          // Stretch effect: narrow at bottom (y=0), wider at top (y=1)
          float stretch = 0.3 + vUv.y * 0.7;
          uv.x = (uv.x - 0.5) * stretch + 0.5;
          
          // Slow upward smoke animation
          uv.y -= uTime * uSpeed + uOffset;
          
          // Add slight horizontal wobble for organic feel
          uv.x += sin(uTime * 0.5 + vUv.y * 3.0) * 0.02 * vUv.y;
          
          vec4 noise = texture2D(uTexture, uv);
          
          // Soft fade: bottom fades in, top fades out (stretch then fade)
          float fadeY = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
          float fadeX = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
          
          // Use texture alpha with fades
          float alpha = noise.a * fadeY * fadeX * uOpacity;
          
          gl_FragColor = vec4(noise.rgb, alpha);
        }
      `;

      for (let i = 0; i < layerCount; i++) {
        // Varying speeds for each layer (slower to faster)
        const speed = 0.04 + i * 0.015;
        const opacity = 0.6 - i * 0.08;
        const offset = i * 0.25;

        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTexture: { value: smokeTexture },
            uTime: { value: 0 },
            uOffset: { value: offset },
            uOpacity: { value: opacity },
            uSpeed: { value: speed },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        // Tall plane for smoke column
        const geometry = new THREE.PlaneGeometry(1.0, 2.0);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -i * 0.01;
        scene.add(mesh);
        layers.push(mesh);
      }
    } else if (animationType === "smokeRadial") {
      // SMOKE RADIAL - multiple smoke columns arranged in circle, radiating outward
      const rayCount = 16;
      const layersPerRay = 3;

      // Load wave_04 texture
      const smokeTexture = textureLoader.load(wave04TextureUrl);
      smokeTexture.wrapS = THREE.RepeatWrapping;
      smokeTexture.wrapT = THREE.RepeatWrapping;

      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      // Same stretch shader as smokeStack - narrow base, wide top
      const fragmentShader = `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uOffset;
        uniform float uOpacity;
        uniform float uSpeed;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          
          // Stretch effect: narrow at bottom (y=0), wider at top (y=1)
          float stretch = 0.25 + vUv.y * 0.75;
          uv.x = (uv.x - 0.5) * stretch + 0.5;
          
          // Slow upward/outward smoke animation
          uv.y -= uTime * uSpeed + uOffset;
          
          // Slight horizontal wobble for organic feel
          uv.x += sin(uTime * 0.4 + vUv.y * 2.5) * 0.015 * vUv.y;
          
          vec4 noise = texture2D(uTexture, uv);
          
          // Soft fade: bottom fades in, top fades out
          float fadeY = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.35, vUv.y);
          float fadeX = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
          
          float alpha = noise.a * fadeY * fadeX * uOpacity;
          
          gl_FragColor = vec4(noise.rgb, alpha);
        }
      `;

      // Create radial rays
      for (let r = 0; r < rayCount; r++) {
        const angle = (r / rayCount) * Math.PI * 2;
        const rotationOffset = rayRotationOffsets[r % rayRotationOffsets.length] || 0;

        for (let l = 0; l < layersPerRay; l++) {
          const speed = 0.05 + l * 0.02;
          const opacity = 0.5 - l * 0.12;
          const offset = l * 0.3 + r * 0.08;

          const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
              uTexture: { value: smokeTexture },
              uTime: { value: 0 },
              uOffset: { value: offset },
              uOpacity: { value: opacity },
              uSpeed: { value: speed },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });

          // Smoke column plane - offset so bottom edge is at origin
          const geometry = new THREE.PlaneGeometry(0.4, 1.4);
          geometry.translate(0, 0.7, 0); // Move so bottom edge is at y=0
          const mesh = new THREE.Mesh(geometry, material);

          // Position at center, rotate to radiate outward
          mesh.position.set(0, 0, -r * 0.001 - l * 0.0001);
          mesh.rotation.z = -angle + rotationOffset + Math.PI / 2;

          scene.add(mesh);
          layers.push(mesh);
        }
      }
    } else {
      // Effect placeholder for removed/unused options
    }

    // Animation loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      layers.forEach((layer) => {
        const material = layer.material as THREE.ShaderMaterial;
        if (material.uniforms?.uTime) {
          material.uniforms.uTime.value = elapsed;
        }
      });

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      layers.forEach((layer) => {
        layer.geometry.dispose();
        (layer.material as THREE.ShaderMaterial).dispose();
      });
      renderer.dispose();
    };
  }, [animationType]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 rounded bg-slate-800 px-3 py-1 text-sm font-semibold text-white shadow hover:bg-slate-700"
      >
        Close
      </button>

      <div className="relative flex flex-col items-center gap-4">
        <canvas ref={canvasRef} className="rounded-lg" />

        <div className="flex flex-wrap gap-2 justify-center max-w-lg">
          <button
            type="button"
            onClick={() => setAnimationType("polar")}
            className={`rounded px-3 py-2 text-xs font-medium shadow transition ${
              animationType === "polar"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Polar Aura
          </button>
          <button
            type="button"
            onClick={() => setAnimationType("polarMask")}
            className={`rounded px-3 py-2 text-xs font-medium shadow transition ${
              animationType === "polarMask"
                ? "bg-cyan-700 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Polar Mask
          </button>
          <button
            type="button"
            onClick={() => setAnimationType("straight")}
            className={`rounded px-3 py-2 text-xs font-medium shadow transition ${
              animationType === "straight"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Straight Ray
          </button>
          <button
            type="button"
            onClick={() => setAnimationType("perspective")}
            className={`rounded px-3 py-2 text-xs font-medium shadow transition ${
              animationType === "perspective"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Perspective Single
          </button>
          <button
            type="button"
            onClick={() => setAnimationType("radial")}
            className={`rounded px-3 py-2 text-xs font-medium shadow transition ${
              animationType === "radial"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Radial Rays
          </button>
          <button
            type="button"
            onClick={() => setAnimationType("perspectiveCircle")}
            className={`rounded px-3 py-2 text-xs font-medium shadow transition ${
              animationType === "perspectiveCircle"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Perspective Circle
          </button>
          <button
            type="button"
            onClick={() => setAnimationType("purpleFire")}
            className={`rounded px-3 py-2 text-xs font-medium shadow transition ${
              animationType === "purpleFire"
                ? "bg-purple-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Purple Fire
          </button>
          <button
            type="button"
            onClick={() => setAnimationType("orangeBurst")}
            className={`rounded px-3 py-2 text-xs font-medium shadow transition ${
              animationType === "orangeBurst"
                ? "bg-orange-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Orange Burst
          </button>
          <button
            type="button"
            onClick={() => setAnimationType("auraBlast")}
            className={`rounded px-3 py-2 text-xs font-medium shadow transition ${
              animationType === "auraBlast"
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Aura Blast
          </button>
          <button
            type="button"
            onClick={() => setAnimationType("smokeStack")}
            className={`rounded px-3 py-2 text-xs font-medium shadow transition ${
              animationType === "smokeStack"
                ? "bg-gray-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Smoke Stack
          </button>
          <button
            type="button"
            onClick={() => setAnimationType("smokeRadial")}
            className={`rounded px-3 py-2 text-xs font-medium shadow transition ${
              animationType === "smokeRadial"
                ? "bg-slate-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Smoke Radial
          </button>
        </div>
      </div>
    </div>
  );
}

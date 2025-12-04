import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import wave22Texture from "@shared/asset/alpha_noise_256_wave_22.png";
import wave04Texture from "@shared/asset/alpha_noise_256_wave_04.png";
import polarMaskTexture from "@shared/asset/Untitled-1.png";

export type CounterEffectDemoProps = {
  onClose?: () => void;
};

export default function CounterEffectDemo({ onClose }: CounterEffectDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = React.useState(false);
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
    const noiseTexture = textureLoader.load(wave22Texture);
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
      // POLAR AURA - dual-noise layered radial glow with swirl and pulse
      const layerCount = 4;

      const noiseTexture2 = textureLoader.load(wave04Texture);
      noiseTexture2.wrapS = THREE.RepeatWrapping;
      noiseTexture2.wrapT = THREE.RepeatWrapping;

      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        uniform sampler2D uTexture1;
        uniform sampler2D uTexture2;
        uniform float uTime;
        uniform float uScale;
        uniform float uOpacity;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
          vec2 center = vec2(0.5);
          vec2 pos = (vUv - center) * uScale;
          float r = length(pos);
          float angle = atan(pos.y, pos.x);

          // Swirl and drift with two distinct noise fields
          float swirl1 = sin(angle * 7.0 + uTime * 1.4) * 0.08;
          float swirl2 = cos(angle * 5.0 - uTime * 1.1) * 0.06;
          vec2 uv1 = vec2(angle / 6.2831853 + swirl1, r * 1.6 - uTime * 0.12);
          vec2 uv2 = vec2(angle / 6.2831853 * 1.25 + swirl2, r * 2.4 - uTime * 0.18);

          vec4 n1 = texture2D(uTexture1, uv1);
          vec4 n2 = texture2D(uTexture2, uv2);

          float noiseBroad = n2.r;
          float noiseDetail = n1.r;
          float noiseMix = mix(noiseBroad, noiseDetail, 0.55);
          float alphaMix = n1.a * 0.5 + n2.a * 0.5;

          // Shape: bright core + rim
          float inner = smoothstep(0.32, 0.0, r);
          float rim = smoothstep(0.44, 0.26, r);
          float edgeFalloff = smoothstep(0.65, 0.32, r);

          // Pulse
          float pulse = 0.9 + sin(uTime * 1.3 + r * 6.0) * 0.12;

          vec3 hot = vec3(1.0, 0.98, 1.0);
          vec3 color = mix(uColor, hot, smoothstep(0.2, 0.0, r) * 0.7);
          color = mix(color, uColor * 1.2, noiseMix);

          float alpha = (inner * 0.9 + rim) * alphaMix * uOpacity * pulse * edgeFalloff;

          gl_FragColor = vec4(color, alpha);
        }
      `;

      for (let i = 0; i < layerCount; i++) {
        const hueColors = [
          new THREE.Color(0.2, 0.7, 1.1),
          new THREE.Color(0.1, 0.55, 0.9),
          new THREE.Color(0.3, 0.8, 1.2),
          new THREE.Color(0.6, 0.9, 1.2),
        ];
        const layerColor = hueColors[i % hueColors.length];
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTexture1: { value: noiseTexture },
            uTexture2: { value: noiseTexture2 },
            uTime: { value: 0 },
            uScale: { value: 0.9 + i * 0.25 },
            uOpacity: { value: 0.5 - i * 0.1 },
            uColor: { value: layerColor },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const size = 1.8 + i * 0.35;
        const geometry = new THREE.PlaneGeometry(size, size);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -i * 0.01;
        scene.add(mesh);
        layers.push(mesh);
      }

      // Center pulse
      const centerMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          void main() {
            vec2 center = vec2(0.5);
            float d = length(vUv - center);
            float pulse = 0.85 + sin(uTime * 2.2) * 0.15;
            float glow = smoothstep(0.3, 0.0, d) * pulse;
            vec3 inner = vec3(1.0, 0.98, 1.0);
            vec3 edge = vec3(0.25, 0.85, 1.0);
            vec3 color = mix(edge, inner, smoothstep(0.18, 0.0, d));
            gl_FragColor = vec4(color, glow * 0.8);
          }
        `,
        uniforms: {
          uTime: { value: 0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const centerGeometry = new THREE.PlaneGeometry(0.95, 0.95);
      const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
      centerMesh.position.z = 0.05;
      scene.add(centerMesh);
      layers.push(centerMesh);
    } else if (animationType === "polarMask") {
      // POLAR MASK - layered bloom that scales outward and fades
      const layerCount = 3;

      const maskTex = textureLoader.load(polarMaskTexture);
      maskTex.wrapS = THREE.ClampToEdgeWrapping;
      maskTex.wrapT = THREE.ClampToEdgeWrapping;

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
        uniform float uOpacity;
        uniform float uScaleStart;
        uniform float uScaleRange;
        uniform float uSpeed;
        uniform float uOffset;
        varying vec2 vUv;

        void main() {
          vec2 center = vec2(0.5);
          float t = fract(uTime * uSpeed + uOffset);
          float scale = uScaleStart + t * uScaleRange;
          vec2 uv = (vUv - center) / scale + center;

          vec4 tex = texture2D(uTexture, uv);

          // Fade in/out over the loop, keep a small baseline to avoid gaps
          float fadeShape = smoothstep(0.0, 0.2, t) * smoothstep(1.0, 0.8, t);
          float fade = mix(0.25, 1.0, fadeShape);

          gl_FragColor = vec4(tex.rgb, tex.a * uOpacity * fade);
        }
      `;

      for (let i = 0; i < layerCount; i++) {
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTexture: { value: maskTex },
            uTime: { value: 0 },
            uOpacity: { value: 0.55 - i * 0.12 },
            uScaleStart: { value: 0.7 + i * 0.1 },
            uScaleRange: { value: 0.6 + i * 0.15 },
            uSpeed: { value: 0.35 + i * 0.08 },
            uOffset: { value: i * 0.25 },
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
      // STRAIGHT SMOKE RAY (test skew effect)
      const layerCount = 3;

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
          
          // Animate upward without stretch
          uv.y -= uTime * 0.2 + uOffset;
          
          // Sample texture normally
          vec4 noise = texture2D(uTexture, uv);
          
          // Fade at tip for natural smoke dissipation
          float fadeY = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          float fadeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
          
          gl_FragColor = vec4(noise.rgb, noise.a * fadeY * fadeX * uOpacity);
        }
      `;

      for (let i = 0; i < layerCount; i++) {
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTexture: { value: noiseTexture },
            uTime: { value: 0 },
            uOffset: { value: i * 0.33 },
            uOpacity: { value: 0.5 - i * 0.1 },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const geometry = new THREE.PlaneGeometry(0.6, 1.8);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -i * 0.01;
        scene.add(mesh);
        layers.push(mesh);
      }
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
      const smokeTexture = textureLoader.load(wave04Texture);
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
      const smokeTexture = textureLoader.load(wave04Texture);
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
            🔥 Purple Fire
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
            💥 Orange Burst
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
            ✨ Aura Blast
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
            💨 Smoke Stack
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
            🌀 Smoke Radial
          </button>
        </div>
      </div>
    </div>
  );
}

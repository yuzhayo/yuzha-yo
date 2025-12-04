import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import wave22Texture from "@shared/asset/alpha_noise_256_wave_22.png";
import wave04Texture from "@shared/asset/alpha_noise_256_wave_04.png";

export type CounterEffectDemoProps = {
  onClose?: () => void;
};

export default function CounterEffectDemo({ onClose }: CounterEffectDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = React.useState(false);
  const [animationType, setAnimationType] = React.useState<"polar" | "radial" | "straight" | "perspective" | "perspectiveCircle" | "purpleFire" | "orangeBurst" | "auraBlast" | "smokeStack" | "smokeRadial">("polar");
  
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
      scene.remove(scene.children[0]);
    }

    const layers: THREE.Mesh[] = [];

    if (animationType === "polar") {
      // POLAR ANIMATION (current)
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
        uniform float uSpeed;
        uniform float uScale;
        uniform float uOpacity;
        varying vec2 vUv;

        #define TAU 6.28318530718

        void main() {
          vec2 center = vec2(0.5, 0.5);
          vec2 pos = vUv - center;
          
          // Convert to polar coordinates
          float radius = length(pos) * uScale;
          float angle = atan(pos.y, pos.x);
          
          // Animate radius outward
          radius -= uTime * uSpeed;
          radius = fract(radius); // Loop
          
          // Sample texture using polar coordinates
          vec2 polarUV = vec2(angle / TAU, radius);
          vec4 noise = texture2D(uTexture, polarUV);
          
          // Fade at edges
          float fadeMask = smoothstep(0.0, 0.1, radius) * smoothstep(1.0, 0.8, radius);
          
          gl_FragColor = vec4(noise.rgb, noise.a * fadeMask * uOpacity);
        }
      `;

      const layerCount = 4;
      for (let i = 0; i < layerCount; i++) {
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTexture: { value: noiseTexture },
            uTime: { value: 0 },
            uSpeed: { value: 0.05 + i * 0.02 },
            uScale: { value: 2.0 + i * 0.3 },
            uOpacity: { value: 0.3 - i * 0.05 },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
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
    } else if (animationType === "perspective") {
      // SINGLE PERSPECTIVE RAY - narrow at base, wider at tip
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
          
          // Perspective transform: narrow at base (y=0), wider at tip (y=1)
          float perspective = 0.3 + vUv.y * 0.7; // 0.3 at base, 1.0 at tip
          uv.x = (uv.x - 0.5) * perspective + 0.5;
          
          // Animate upward
          uv.y -= uTime * 0.2 + uOffset;
          
          vec4 noise = texture2D(uTexture, uv);
          
          // Fade at tip
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
    } else if (animationType === "perspectiveCircle") {
      // PERSPECTIVE RAYS IN CIRCLE - narrow at center, wider at tip
      const rayCount = 12;
      const layersPerRay = 3;

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
          
          // Perspective transform: narrow at base (y=0), wider at tip (y=1)
          float perspective = 0.3 + vUv.y * 0.7; // 0.3 at base, 1.0 at tip
          uv.x = (uv.x - 0.5) * perspective + 0.5;
          
          // Animate outward
          uv.y -= uTime * 0.2 + uOffset;
          
          vec4 noise = texture2D(uTexture, uv);
          
          // Fade at tip
          float fadeY = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          float fadeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
          
          gl_FragColor = vec4(noise.rgb, noise.a * fadeY * fadeX * uOpacity);
        }
      `;

      for (let r = 0; r < rayCount; r++) {
        const angle = (r / rayCount) * Math.PI * 2;

        for (let l = 0; l < layersPerRay; l++) {
          const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
              uTexture: { value: noiseTexture },
              uTime: { value: 0 },
              uOffset: { value: l * 0.33 },
              uOpacity: { value: 0.5 - l * 0.1 },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });

          const geometry = new THREE.PlaneGeometry(0.5, 1.6);
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(0, 0, -r * 0.001 - l * 0.0001);
          mesh.rotation.z = -angle + Math.PI / 2;

          scene.add(mesh);
          layers.push(mesh);
        }
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
    } else if (animationType === "orangeBurst") {
      // ORANGE BURST - radial explosion effect
      const rayCount = 20;
      const layersPerRay = 3;

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
          
          // Perspective: narrow at center, wider outward
          float perspective = 0.2 + vUv.y * 0.8;
          uv.x = (uv.x - 0.5) * perspective + 0.5;
          
          // Fast outward animation (explosion)
          uv.y -= uTime * 0.4 + uOffset;
          
          vec4 noise = texture2D(uTexture, uv);
          
          // Orange to white gradient
          vec3 darkOrange = vec3(0.8, 0.3, 0.0);
          vec3 brightOrange = vec3(1.0, 0.6, 0.1);
          vec3 yellow = vec3(1.0, 0.9, 0.3);
          vec3 white = vec3(1.0, 1.0, 1.0);
          
          // Map based on distance from center and noise
          float centerDist = 1.0 - vUv.y;
          vec3 color;
          if (centerDist > 0.7) {
            // Near center: white hot
            color = white;
          } else if (centerDist > 0.4) {
            color = mix(yellow, white, (centerDist - 0.4) / 0.3);
          } else if (centerDist > 0.2) {
            color = mix(brightOrange, yellow, (centerDist - 0.2) / 0.2);
          } else {
            color = mix(darkOrange, brightOrange, centerDist / 0.2);
          }
          
          // Mix with noise intensity
          color = mix(color * 0.5, color, noise.r);
          
          // Fade at edges
          float fadeY = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          float fadeX = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
          
          float alpha = noise.a * fadeY * fadeX * uOpacity;
          
          gl_FragColor = vec4(color, alpha);
        }
      `;

      for (let r = 0; r < rayCount; r++) {
        const angle = (r / rayCount) * Math.PI * 2;

        for (let l = 0; l < layersPerRay; l++) {
          const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
              uTexture: { value: noiseTexture },
              uTime: { value: 0 },
              uOffset: { value: l * 0.2 },
              uOpacity: { value: 0.8 - l * 0.15 },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });

          const geometry = new THREE.PlaneGeometry(0.4, 1.4);
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(0, 0, -r * 0.001 - l * 0.0001);
          mesh.rotation.z = -angle + Math.PI / 2;

          scene.add(mesh);
          layers.push(mesh);
        }
      }
    } else if (animationType === "auraBlast") {
      // AURA BLAST - slow smoke-like radial spread with dual texture turbulence
      const rayCount = 24;
      const layersPerRay = 4;

      // Load second texture for more organic turbulence
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

      // Dual-texture shader for organic turbulent smoke
      const fragmentShader = `
        uniform sampler2D uTexture1;
        uniform sampler2D uTexture2;
        uniform float uTime;
        uniform float uOffset;
        uniform float uOpacity;
        uniform float uTurbulence;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          
          // Perspective: narrow at center (y=0), wider at edges (y=1)
          float perspective = 0.15 + vUv.y * 0.85;
          uv.x = (uv.x - 0.5) / perspective + 0.5;
          
          // Slow smoke-like outward animation
          float slowSpeed = 0.06;
          uv.y -= uTime * slowSpeed + uOffset;
          
          // Add slight horizontal turbulence based on second texture
          vec2 turbUV = vUv * 2.0;
          turbUV.y -= uTime * 0.03;
          vec4 turbNoise = texture2D(uTexture2, turbUV);
          uv.x += (turbNoise.r - 0.5) * uTurbulence * vUv.y;
          
          // Sample primary noise texture
          vec4 noise1 = texture2D(uTexture1, uv);
          
          // Sample secondary texture at different scale for layered effect
          vec2 uv2 = uv * 1.5;
          uv2.y -= uTime * 0.04;
          vec4 noise2 = texture2D(uTexture2, uv2);
          
          // Blend both noise textures for organic look
          float combinedNoise = noise1.r * 0.6 + noise2.r * 0.4;
          float combinedAlpha = noise1.a * 0.7 + noise2.a * 0.3;
          
          // Purple/blue aura color gradient
          vec3 darkPurple = vec3(0.2, 0.05, 0.4);
          vec3 midPurple = vec3(0.5, 0.2, 0.8);
          vec3 brightPurple = vec3(0.7, 0.4, 1.0);
          vec3 white = vec3(0.95, 0.9, 1.0);
          
          // Color based on noise intensity and distance
          vec3 color;
          float intensity = combinedNoise;
          if (intensity < 0.3) {
            color = mix(darkPurple, midPurple, intensity / 0.3);
          } else if (intensity < 0.6) {
            color = mix(midPurple, brightPurple, (intensity - 0.3) / 0.3);
          } else {
            color = mix(brightPurple, white, (intensity - 0.6) / 0.4);
          }
          
          // Soft fade at base (center) and tips (edges)
          float fadeY = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
          float fadeX = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
          
          float alpha = combinedAlpha * fadeY * fadeX * uOpacity;
          
          gl_FragColor = vec4(color, alpha);
        }
      `;

      // Create center glowing circle
      const centerGlowShader = `
        varying vec2 vUv;
        uniform float uTime;
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = length(vUv - center);
          
          // Pulsing glow
          float pulse = 0.9 + sin(uTime * 0.5) * 0.1;
          
          // Soft radial gradient
          float glow = smoothstep(0.5, 0.0, dist) * pulse;
          
          // Purple/white center
          vec3 innerColor = vec3(1.0, 0.95, 1.0);
          vec3 outerColor = vec3(0.6, 0.3, 0.9);
          vec3 color = mix(outerColor, innerColor, smoothstep(0.3, 0.0, dist));
          
          gl_FragColor = vec4(color, glow * 0.6);
        }
      `;

      // Add center glow
      const centerMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: centerGlowShader,
        uniforms: {
          uTime: { value: 0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const centerGeometry = new THREE.PlaneGeometry(0.5, 0.5);
      const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
      centerMesh.position.z = 0.01;
      scene.add(centerMesh);
      layers.push(centerMesh);

      // Create radial rays with slight random rotation offsets
      for (let r = 0; r < rayCount; r++) {
        const baseAngle = (r / rayCount) * Math.PI * 2;
        const rotationOffset = rayRotationOffsets[r] || 0;
        const angle = baseAngle + rotationOffset;

        for (let l = 0; l < layersPerRay; l++) {
          const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
              uTexture1: { value: noiseTexture },
              uTexture2: { value: noiseTexture2 },
              uTime: { value: 0 },
              uOffset: { value: l * 0.2 + r * 0.05 },
              uOpacity: { value: 0.45 - l * 0.08 },
              uTurbulence: { value: 0.08 + l * 0.02 },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });

          const geometry = new THREE.PlaneGeometry(0.35, 1.2);
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(0, 0, -r * 0.001 - l * 0.0001 - 0.01);
          mesh.rotation.z = -angle + Math.PI / 2;

          scene.add(mesh);
          layers.push(mesh);
        }
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
      // RADIAL ANIMATION (rays in circle)
      const rayCount = 12;
      const layersPerRay = 3;

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
          
          // Animate outward without stretch
          uv.y -= uTime * 0.2 + uOffset;
          
          vec4 noise = texture2D(uTexture, uv);
          
          // Fade at tip for natural smoke dissipation
          float fadeY = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          float fadeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
          
          gl_FragColor = vec4(noise.rgb, noise.a * fadeY * fadeX * uOpacity);
        }
      `;

      for (let r = 0; r < rayCount; r++) {
        const angle = (r / rayCount) * Math.PI * 2;

        for (let l = 0; l < layersPerRay; l++) {
          const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
              uTexture: { value: noiseTexture },
              uTime: { value: 0 },
              uOffset: { value: l * 0.33 },
              uOpacity: { value: 0.5 - l * 0.1 },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });

          const geometry = new THREE.PlaneGeometry(0.5, 1.6);
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(0, 0, -r * 0.001 - l * 0.0001);
          mesh.rotation.z = -angle + Math.PI / 2;

          scene.add(mesh);
          layers.push(mesh);
        }
      }
    }

    // Animation loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      layers.forEach((layer) => {
        const material = layer.material as THREE.ShaderMaterial;
        material.uniforms.uTime.value = elapsed;
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

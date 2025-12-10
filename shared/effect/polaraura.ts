import * as THREE from "three";
import { resolveAssetPath, resolveAssetUrl } from "../layer/engine";
import polarauraConfig from "./polaraura.config.json";

function getTextureUrl(imageId: string): string {
  const path = resolveAssetPath(imageId);
  if (!path) {
    throw new Error(`[PolarAura] Missing asset for "${imageId}"`);
  }
  return resolveAssetUrl(path);
}

export type PolarAuraOptions = {
  layerCount?: number;
  baseScale?: number;
  scaleStep?: number;
  baseOpacity?: number;
  opacityStep?: number;
  layerColors?: [number, number, number][];
  layerSizeBase?: number;
  layerSizeStep?: number;
  centerSize?: number;
};

type PolarAuraConfig = Required<PolarAuraOptions>;

const defaultConfig: PolarAuraConfig = {
  layerCount: 4,
  baseScale: 0.9,
  scaleStep: 0.25,
  baseOpacity: 0.5,
  opacityStep: 0.1,
  layerColors: [
    [0.2, 0.7, 1.1],
    [0.1, 0.55, 0.9],
    [0.3, 0.8, 1.2],
    [0.6, 0.9, 1.2],
  ],
  layerSizeBase: 1.8,
  layerSizeStep: 0.35,
  centerSize: 0.95,
};

const mergedConfig: PolarAuraConfig = {
  ...defaultConfig,
  ...(polarauraConfig as PolarAuraOptions),
  layerColors: (polarauraConfig as PolarAuraOptions).layerColors ?? defaultConfig.layerColors,
};

/**
 * Create Polar Aura meshes (layers + center pulse) using dual noise textures.
 * Caller is responsible for adding meshes to the scene and disposing them.
 */
export function createPolarAura(
  textureLoader: THREE.TextureLoader,
  {
    layerCount = mergedConfig.layerCount,
    baseScale = mergedConfig.baseScale,
    scaleStep = mergedConfig.scaleStep,
    baseOpacity = mergedConfig.baseOpacity,
    opacityStep = mergedConfig.opacityStep,
    layerColors = mergedConfig.layerColors,
    layerSizeBase = mergedConfig.layerSizeBase,
    layerSizeStep = mergedConfig.layerSizeStep,
    centerSize = mergedConfig.centerSize,
  }: PolarAuraOptions = mergedConfig,
): THREE.Mesh[] {
  const noiseTexture1 = textureLoader.load(getTextureUrl("alpha_noise_256_wave_22"));
  noiseTexture1.wrapS = THREE.RepeatWrapping;
  noiseTexture1.wrapT = THREE.RepeatWrapping;

  const noiseTexture2 = textureLoader.load(getTextureUrl("alpha_noise_256_wave_04"));
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

  const meshes: THREE.Mesh[] = [];

  for (let i = 0; i < layerCount; i++) {
    const layerColorTuple = layerColors[i % layerColors.length] ?? [1, 1, 1];
    const layerColor = new THREE.Color(
      layerColorTuple[0],
      layerColorTuple[1],
      layerColorTuple[2],
    );
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture1: { value: noiseTexture1 },
        uTexture2: { value: noiseTexture2 },
        uTime: { value: 0 },
        uScale: { value: baseScale + i * scaleStep },
        uOpacity: { value: baseOpacity - i * opacityStep },
        uColor: { value: layerColor },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const size = layerSizeBase + i * layerSizeStep;
    const geometry = new THREE.PlaneGeometry(size, size);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -i * 0.01;
    meshes.push(mesh);
  }

  // Center pulse layer
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

  const centerGeometry = new THREE.PlaneGeometry(centerSize, centerSize);
  const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
  centerMesh.position.z = 0.05;
  meshes.push(centerMesh);

  return meshes;
}

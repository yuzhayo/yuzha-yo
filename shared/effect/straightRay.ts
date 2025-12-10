import * as THREE from "three";
import { resolveAssetPath, resolveAssetUrl } from "../layer/engine";

export type StraightRayOptions = {
  layerCount?: number;
  width?: number;
  height?: number;
  offsetStep?: number;
  baseOpacity?: number;
  opacityStep?: number;
  speed?: number;
};

function getTextureUrl(imageId: string): string {
  const path = resolveAssetPath(imageId);
  if (!path) {
    throw new Error(`[StraightRay] Missing asset for "${imageId}"`);
  }
  return resolveAssetUrl(path);
}

/**
 * Create stacked straight smoke/ray meshes (additive blended).
 * Caller is responsible for adding to scene and driving uTime uniforms.
 */
export function createStraightRay(
  textureLoader: THREE.TextureLoader,
  {
    layerCount = 3,
    width = 0.6,
    height = 1.8,
    offsetStep = 0.33,
    baseOpacity = 0.5,
    opacityStep = 0.1,
    speed = 0.2,
  }: StraightRayOptions = {},
): THREE.Mesh[] {
  const noiseTexture = textureLoader.load(getTextureUrl("alpha_noise_256_wave_22"));
  noiseTexture.wrapS = THREE.RepeatWrapping;
  noiseTexture.wrapT = THREE.RepeatWrapping;

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
      
      // Animate upward without stretch
      uv.y -= uTime * uSpeed + uOffset;
      
      // Sample texture normally
      vec4 noise = texture2D(uTexture, uv);
      
      // Fade at tip for natural smoke dissipation
      float fadeY = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
      float fadeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
      
      gl_FragColor = vec4(noise.rgb, noise.a * fadeY * fadeX * uOpacity);
    }
  `;

  const meshes: THREE.Mesh[] = [];

  for (let i = 0; i < layerCount; i++) {
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: noiseTexture },
        uTime: { value: 0 },
        uOffset: { value: i * offsetStep },
        uOpacity: { value: Math.max(0, baseOpacity - i * opacityStep) },
        uSpeed: { value: speed },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(width, height);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -i * 0.01;
    meshes.push(mesh);
  }

  return meshes;
}

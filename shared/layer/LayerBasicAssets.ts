/**
 * Basic Layer System - Asset Management
 * 
 * Asset loading and resolution logic adapted from rawcode LogicConfig.ts
 * for use with the Three.js-based layer system.
 */

import * as THREE from 'three'
import type { LogicConfig, ImageRef } from './LayerBasicTypes'

// Asset resolution logic from LogicConfig.ts lines 14-35
const assetManifest: Record<string, string> = {}

const SHARED_ASSET_PREFIXES = ['@shared/Asset/', 'shared/Asset/']

function resolveBundledAsset(path: string): string | null {
  for (const prefix of SHARED_ASSET_PREFIXES) {
    if (path.startsWith(prefix)) {
      const relative = path.slice(prefix.length)
      const manifestKey = `@shared/Asset/${relative}`
      const mapped = assetManifest[manifestKey]
      if (mapped) return mapped
      console.warn('[LayerBasicAssets] Missing bundled asset for', path)
      return null
    }
  }
  return null
}

export function remapRegistry(cfg: LogicConfig): LogicConfig {
  const registry = { ...cfg.imageRegistry }
  for (const [key, value] of Object.entries(registry)) {
    const mapped = resolveBundledAsset(value)
    if (mapped) registry[key] = mapped
  }
  return { ...cfg, imageRegistry: registry }
}

export function getUrlForImageRef(cfg: LogicConfig, ref: ImageRef): string | null {
  if (ref.kind === 'url') return ref.url
  const url = cfg.imageRegistry[ref.id]
  return url ?? null
}

// Three.js texture loading with error handling
const textureLoader = new THREE.TextureLoader()
const textureCache = new Map<string, THREE.Texture>()

export async function loadTexture(url: string): Promise<THREE.Texture> {
  if (textureCache.has(url)) {
    return textureCache.get(url)!
  }

  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      (texture) => {
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        textureCache.set(url, texture)
        resolve(texture)
      },
      undefined,
      (error) => {
        console.error('[LayerBasicAssets] Failed to load texture:', url, error)
        reject(error)
      }
    )
  })
}

export function disposeTextureCache(): void {
  textureCache.forEach((texture) => texture.dispose())
  textureCache.clear()
}
import { resolveAssetPath, resolveAssetUrl } from "@shared/layer";

/**
 * Resolve an image ID from ImageRegistry.json to a bundler-safe URL.
 * Uses the registry for lookup and the static asset manifest from resolveAssetUrl.
 */
export function getAssetUrl(imageId: string): string | null {
  const assetPath = resolveAssetPath(imageId);
  if (!assetPath) return null;
  return resolveAssetUrl(assetPath);
}

export function requireAssetUrl(imageId: string): string {
  const url = getAssetUrl(imageId);
  if (!url) {
    throw new Error(`Asset not found in registry: ${imageId}`);
  }
  return url;
}

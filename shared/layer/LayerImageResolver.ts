import type { AssetRef, AssetMeta } from "./LayerTypes";

/**
 * Resolve referensi asset menjadi metadata. Pure, tanpa I/O.
 * - path: kembalikan minimal meta (src=path, width/height=NaN)
 * - registry: ambil dari registry (throw jika tidak ada)
 */
export function resolveAsset(ref: AssetRef, registry: Map<string, AssetMeta>): AssetMeta {
  if (ref.type === "path") {
    return { src: ref.path, width: Number.NaN, height: Number.NaN };
  }
  if (ref.type === "registry") {
    const meta = registry.get(ref.key);
    if (!meta) {
      throw new Error(`registry key "${ref.key}" not found`);
    }
    // clone to avoid accidental downstream mutation
    return { ...meta };
  }
  // defensive
  throw new Error(`unknown asset ref type: ${(ref as any).type}`);
}

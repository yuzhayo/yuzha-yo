import { describe, it, expect } from "vitest";
import { resolveAsset } from "../LayerImageResolver";
import type { AssetRef, AssetMeta } from "../LayerTypes";

describe("LayerImageResolver", () => {
  describe("resolveAsset", () => {
    it("should resolve path-based asset with minimal metadata", () => {
      const ref: AssetRef = { type: "path", path: "/test/image.png" };
      const registry = new Map();

      const result = resolveAsset(ref, registry);

      expect(result).toEqual({
        src: "/test/image.png",
        width: NaN,
        height: NaN,
      });
    });

    it("should resolve registry-based asset from registry", () => {
      const mockMeta: AssetMeta = {
        src: "/registry/image.jpg",
        width: 256,
        height: 256,
        anchor: { x: 0.5, y: 0.5 },
        dpi: 72,
      };

      const ref: AssetRef = { type: "registry", key: "test-key" };
      const registry = new Map([["test-key", mockMeta]]);

      const result = resolveAsset(ref, registry);

      expect(result).toEqual(mockMeta);
      // Should be a clone, not the same reference
      expect(result).not.toBe(mockMeta);
    });

    it("should throw error for missing registry key", () => {
      const ref: AssetRef = { type: "registry", key: "missing-key" };
      const registry = new Map();

      expect(() => resolveAsset(ref, registry)).toThrow(
        'registry key "missing-key" not found',
      );
    });

    it("should handle registry with multiple entries", () => {
      const meta1: AssetMeta = { src: "/img1.png", width: 100, height: 100 };
      const meta2: AssetMeta = { src: "/img2.png", width: 200, height: 200 };

      const registry = new Map([
        ["key1", meta1],
        ["key2", meta2],
      ]);

      const ref1: AssetRef = { type: "registry", key: "key1" };
      const ref2: AssetRef = { type: "registry", key: "key2" };

      const result1 = resolveAsset(ref1, registry);
      const result2 = resolveAsset(ref2, registry);

      expect(result1.src).toBe("/img1.png");
      expect(result1.width).toBe(100);
      expect(result2.src).toBe("/img2.png");
      expect(result2.width).toBe(200);
    });

    it("should preserve all asset metadata properties", () => {
      const fullMeta: AssetMeta = {
        src: "/full/image.png",
        width: 512,
        height: 256,
        anchor: { x: 0.3, y: 0.7 },
        dpi: 144,
      };

      const ref: AssetRef = { type: "registry", key: "full-meta" };
      const registry = new Map([["full-meta", fullMeta]]);

      const result = resolveAsset(ref, registry);

      expect(result.src).toBe("/full/image.png");
      expect(result.width).toBe(512);
      expect(result.height).toBe(256);
      expect(result.anchor).toEqual({ x: 0.3, y: 0.7 });
      expect(result.dpi).toBe(144);
    });

    it("should handle various path formats", () => {
      const paths = [
        "/absolute/path.png",
        "relative/path.jpg",
        "./current/dir.gif",
        "../parent/dir.svg",
        "https://example.com/image.webp",
      ];

      const registry = new Map();

      paths.forEach((path) => {
        const ref: AssetRef = { type: "path", path };
        const result = resolveAsset(ref, registry);
        expect(result.src).toBe(path);
        expect(Number.isNaN(result.width)).toBe(true);
        expect(Number.isNaN(result.height)).toBe(true);
      });
    });

    it("should throw error for unknown asset ref type", () => {
      const invalidRef = { type: "unknown", data: "test" } as any;
      const registry = new Map();

      expect(() => resolveAsset(invalidRef, registry)).toThrow(
        "unknown asset ref type: unknown",
      );
    });

    it("should clone registry metadata to prevent mutation", () => {
      const originalMeta: AssetMeta = {
        src: "/test.png",
        width: 100,
        height: 100,
        anchor: { x: 0.5, y: 0.5 },
      };

      const ref: AssetRef = { type: "registry", key: "test" };
      const registry = new Map([["test", originalMeta]]);

      const result = resolveAsset(ref, registry);

      // Modify the result
      result.width = 999;
      result.anchor = { x: 0, y: 0 };

      // Original should remain unchanged
      expect(originalMeta.width).toBe(100);
      expect(originalMeta.anchor).toEqual({ x: 0.5, y: 0.5 });
    });

    it("should handle empty registry for path-based assets", () => {
      const ref: AssetRef = { type: "path", path: "/some/path.png" };
      const emptyRegistry = new Map();

      // Should not throw error, just return minimal metadata
      const result = resolveAsset(ref, emptyRegistry);

      expect(result.src).toBe("/some/path.png");
      expect(Number.isNaN(result.width)).toBe(true);
      expect(Number.isNaN(result.height)).toBe(true);
    });
  });
});

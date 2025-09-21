import { describe, it, expect } from "vitest";
import { validateLibraryConfig } from "../LayerValidator";
import type { LibraryConfig } from "../LayerTypes";

describe("LayerValidator", () => {
  describe("validateLibraryConfig", () => {
    it("should validate minimal valid config", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "test-layer",
            imagePath: "/test/image.png",
          },
        ],
      };

      const result = validateLibraryConfig(config);

      expect(result.ok).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.normalized).toBeDefined();
      if (result.normalized) {
        expect(result.normalized.layers).toHaveLength(1);
        expect(result.normalized.layers![0]!.layerId).toBe("test-layer");
      }
    });

    it("should use default stage config when not provided", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "test-layer",
            imagePath: "/test/image.png",
          },
        ],
      };

      const result = validateLibraryConfig(config);

      if (result.normalized) {
        expect(result.normalized.stage).toEqual({
          width: 2048,
          height: 2048,
          origin: "center",
        });
      }
    });

    it("should fail validation when layers is not an array", () => {
      const config = {
        layers: null,
      } as any;

      const result = validateLibraryConfig(config);

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe("layers.missing");
    });

    it("should fail validation when layerId is missing", () => {
      const config: LibraryConfig = {
        layers: [
          {
            imagePath: "/test/image.png",
          } as any,
        ],
      };

      const result = validateLibraryConfig(config);

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe("layer.id.missing");
    });

    it("should fail validation when both imagePath and registryKey are provided", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "test-layer",
            imagePath: "/test/image.png",
            registryKey: "registry-key",
          },
        ],
      };

      const result = validateLibraryConfig(config);

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe("layer.asset.invalid");
    });

    it("should fail validation when neither imagePath nor registryKey are provided", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "test-layer",
          },
        ],
      };

      const result = validateLibraryConfig(config);

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe("layer.asset.invalid");
    });

    it("should validate registry-based asset", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "test-layer",
            registryKey: "test-registry-key",
          },
        ],
      };

      const result = validateLibraryConfig(config);

      expect(result.ok).toBe(true);
      if (result.normalized) {
        expect(result.normalized.layers![0]!.assetRef).toEqual({
          type: "registry",
          key: "test-registry-key",
        });
      }
    });

    it("should normalize behaviors with defaults", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "test-layer",
            imagePath: "/test/image.png",
            behaviors: {
              spin: { enabled: true, rpm: 30 },
            },
          },
        ],
      };

      const result = validateLibraryConfig(config);

      expect(result.ok).toBe(true);
      if (!result.normalized) throw new Error("Expected normalized");
      const behaviors = result.normalized.layers![0]!.behaviors;
      expect(behaviors?.spin).toEqual({
        enabled: true,
        rpm: 30,
        direction: "cw",
      });
      expect(behaviors?.orbit).toEqual({
        enabled: false,
        rpm: 0,
        radius: 0,
      });
    });

    it("should detect duplicate layer IDs", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "duplicate-id",
            imagePath: "/test/image1.png",
          },
          {
            layerId: "duplicate-id",
            imagePath: "/test/image2.png",
          },
        ],
      };

      const result = validateLibraryConfig(config);

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe("layer.id.duplicate");
    });

    it("should warn about invalid opacity range", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "test-layer",
            imagePath: "/test/image.png",
            opacity: 1.5,
          },
        ],
      };

      const result = validateLibraryConfig(config);

      expect(result.ok).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]!.code).toBe("layer.opacity.range");
    });
  });
});

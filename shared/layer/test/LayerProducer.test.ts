import { describe, it, expect, beforeEach } from "vitest";
import { produceLayers } from "../LayerProducer";
import type {
  LibraryConfig,
  ProcessingContext,
  AssetMeta,
} from "../LayerTypes";

describe("LayerProducer", () => {
  let mockContext: ProcessingContext;
  let mockAssetMeta: AssetMeta;

  beforeEach(() => {
    mockAssetMeta = {
      src: "/test/image.png",
      width: 100,
      height: 100,
      anchor: { x: 0.5, y: 0.5 },
    };

    mockContext = {
      stage: { width: 1024, height: 768, origin: "center" },
      time: 0,
      registry: new Map([["test-asset", mockAssetMeta]]),
    };
  });

  describe("produceLayers", () => {
    it("should produce layers from valid config", () => {
      const config: LibraryConfig = {
        stage: { width: 800, height: 600 },
        layers: [
          {
            layerId: "test-layer",
            imagePath: "/test/image.png",
            position: { x: 10, y: 20 },
            scale: 1.5,
            angle: 45,
            opacity: 0.8,
          },
        ],
      };

      const result = produceLayers(config, mockContext);

      expect(result.layers).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      expect(layer.id).toBe("test-layer");
      expect(layer.zIndex).toBe(0);
      expect(layer.asset).toEqual({ type: "path", path: "/test/image.png" });
      expect(layer.transform.position).toEqual({ x: 10, y: 20 });
      expect(layer.transform.scale).toEqual({ x: 1.5, y: 1.5 });
      expect(layer.transform.angle).toBe(45);
      expect(layer.transform.opacity).toBe(0.8);
    });

    it("should produce layers with registry assets", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "registry-layer",
            registryKey: "test-asset",
          },
        ],
      };

      const result = produceLayers(config, mockContext);

      expect(result.layers).toHaveLength(1);
      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      expect(layer.asset).toEqual({ type: "registry", key: "test-asset" });
    });

    it("should throw error for missing registry key", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "missing-registry",
            registryKey: "non-existent-key",
          },
        ],
      };

      expect(() => produceLayers(config, mockContext)).toThrow(
        'registry key "non-existent-key" not found',
      );
    });

    it("should apply spin animation", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "spin-layer",
            imagePath: "/test/image.png",
            angle: 0,
            behaviors: {
              spin: { enabled: true, rpm: 60, direction: "cw" },
            },
          },
        ],
      };

      const spinContext = { ...mockContext, time: 1 }; // 1 second
      const result = produceLayers(config, spinContext);

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      // 60 RPM for 1 second = 360 degrees rotation
      expect(layer.transform.angle).toBe(360);
    });

    it("should apply orbit animation", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "orbit-layer",
            imagePath: "/test/image.png",
            position: { x: 0, y: 0 },
            behaviors: {
              orbit: { enabled: true, rpm: 60, radius: 100 },
            },
          },
        ],
      };

      const orbitContext = { ...mockContext, time: 0.25 }; // Quarter rotation
      const result = produceLayers(config, orbitContext);

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      // At quarter rotation, should be at (0, 100) from center
      expect(layer.transform.position.x).toBeCloseTo(0, 5);
      expect(layer.transform.position.y).toBeCloseTo(100, 5);
    });

    it("should apply pulse animation", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "pulse-layer",
            imagePath: "/test/image.png",
            scale: 1,
            behaviors: {
              pulse: { enabled: true, amplitude: 0.5, rpm: 60 },
            },
          },
        ],
      };

      const pulseContext = { ...mockContext, time: 0.25 }; // Peak amplitude
      const result = produceLayers(config, pulseContext);

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      // At peak, scale should be 1 * (1 + 0.5) = 1.5
      expect(layer.transform.scale.x).toBeCloseTo(1.5, 5);
      expect(layer.transform.scale.y).toBeCloseTo(1.5, 5);
    });

    it("should apply fade animation", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "fade-layer",
            imagePath: "/test/image.png",
            opacity: 1,
            behaviors: {
              fade: { enabled: true, from: 0.2, to: 0.8, rpm: 60 },
            },
          },
        ],
      };

      const fadeContext = { ...mockContext, time: 0.25 }; // Maximum fade
      const result = produceLayers(config, fadeContext);

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      // At maximum, should be at 'to' value
      expect(layer.transform.opacity).toBeCloseTo(0.8, 5);
    });

    it("should apply multiple animations together", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "multi-anim-layer",
            imagePath: "/test/image.png",
            angle: 0,
            position: { x: 0, y: 0 },
            scale: 1,
            opacity: 1,
            behaviors: {
              spin: { enabled: true, rpm: 60, direction: "cw" },
              orbit: { enabled: true, rpm: 60, radius: 50 },
              pulse: { enabled: true, amplitude: 0.2, rpm: 60 },
              fade: { enabled: true, from: 0.5, to: 1, rpm: 60 },
            },
          },
        ],
      };

      const multiContext = { ...mockContext, time: 0.25 };
      const result = produceLayers(config, multiContext);

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;

      // All animations should be applied
      expect(layer.transform.angle).toBe(90); // 90 degree rotation
      expect(layer.transform.position.x).toBeCloseTo(0, 5); // orbit position
      expect(layer.transform.position.y).toBeCloseTo(50, 5);
      expect(layer.transform.scale.x).toBeCloseTo(1.2, 5); // pulse scale
      expect(layer.transform.opacity).toBeCloseTo(1, 5); // fade opacity
    });

    it("should maintain stable zIndex based on input order", () => {
      const config: LibraryConfig = {
        layers: [
          { layerId: "first", imagePath: "/first.png" },
          { layerId: "second", imagePath: "/second.png" },
          { layerId: "third", imagePath: "/third.png" },
        ],
      };

      const result = produceLayers(config, mockContext);

      expect(result.layers[0]!.zIndex).toBe(0);
      expect(result.layers[1]!.zIndex).toBe(1);
      expect(result.layers[2]!.zIndex).toBe(2);
    });

    it("should set proper state values", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "state-layer",
            imagePath: "/test/image.png",
            opacity: 0.5,
          },
        ],
      };

      const result = produceLayers(config, mockContext);

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      expect(layer.state).toEqual({
        isHovered: false,
        isPressed: false,
        isActive: false,
        isVisible: true,
      });
    });

    it("should preserve container configuration", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "container-layer",
            imagePath: "/test/image.png",
            layerWidth: 200,
            layerHeight: 150,
            fitMode: "contain",
            alignment: "center",
          },
        ],
      };

      const result = produceLayers(config, mockContext);

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      expect(layer.container).toEqual({
        width: 200,
        height: 150,
        fitMode: "contain",
        alignment: "center",
      });
    });

    it("should preserve events configuration", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "events-layer",
            imagePath: "/test/image.png",
            events: {
              onPress: [{ action: "spin", set: { enabled: true, rpm: 30 } }],
              onHover: [{ action: "fade", set: { from: 0, to: 1 } }],
            },
          },
        ],
      };

      const result = produceLayers(config, mockContext);

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      expect(layer.events?.onPress).toHaveLength(1);
      expect(layer.events?.onHover).toHaveLength(1);
      expect(layer.events?.onPress?.[0]).toEqual({
        action: "spin",
        set: { enabled: true, rpm: 30 },
      });
    });

    it("should throw error for invalid config", () => {
      const invalidConfig = {
        layers: [
          {
            // Missing layerId and asset
          },
        ],
      } as any;

      expect(() => produceLayers(invalidConfig, mockContext)).toThrow(
        "validation failed",
      );
    });

    it("should return warnings from validation", () => {
      const config: LibraryConfig = {
        layers: [
          {
            layerId: "warning-layer",
            imagePath: "/test/image.png",
            opacity: 1.5, // Out of range, should generate warning
          },
        ],
      };

      const result = produceLayers(config, mockContext);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("opacity should be within [0,1]");
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import {
  compose,
  produceBasic,
  produceBasicSpin,
  produceBasicOrbit,
  produceBasicPulse,
  produceBasicFade,
  produceFull,
} from "../LayerPipeline";
import type {
  LibraryConfig,
  ProcessingContext,
  AssetMeta,
} from "../LayerTypes";

describe("LayerPipeline", () => {
  let mockContext: ProcessingContext;
  let mockAssetMeta: AssetMeta;
  let basicConfig: LibraryConfig;

  beforeEach(() => {
    mockAssetMeta = {
      src: "/test/image.png",
      width: 100,
      height: 100,
    };

    mockContext = {
      stage: { width: 800, height: 600, origin: "center" },
      time: 0,
      registry: new Map([["test-asset", mockAssetMeta]]),
    };

    basicConfig = {
      stage: { width: 400, height: 300 },
      layers: [
        {
          layerId: "test-layer",
          imagePath: "/test.png",
          position: { x: 10, y: 20 },
          scale: 2,
          angle: 45,
          opacity: 0.8,
          behaviors: {
            spin: { enabled: true, rpm: 60, direction: "cw" },
            orbit: { enabled: true, rpm: 30, radius: 50 },
            pulse: { enabled: true, amplitude: 0.5, rpm: 45 },
            fade: { enabled: true, from: 0.3, to: 0.9, rpm: 40 },
          },
        },
      ],
    };
  });

  describe("compose", () => {
    it("should create composer with selected wrappers", () => {
      const composer = compose(["spin", "fade"]);
      // Use timing that produces exact values for fade
      const result = composer(basicConfig, { ...mockContext, time: 0.375 }); // 90 degrees for 40 RPM

      expect(result.layers).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      // Should have spin applied (135 degrees at 0.375s with 60 RPM = 45 + 135)
      expect(layer.transform.angle).toBe(180); // 45 + 135

      // Should have fade applied (at peak with 40 RPM at 0.375s)
      expect(layer.transform.opacity).toBeCloseTo(0.9, 3);

      // Should NOT have orbit applied (position should remain original)
      expect(layer.transform.position).toEqual({ x: 10, y: 20 });

      // Should NOT have pulse applied (scale should remain original)
      expect(layer.transform.scale).toEqual({ x: 2, y: 2 });
    });

    it("should create composer with no wrappers", () => {
      const composer = compose([]);
      const result = composer(basicConfig, mockContext);

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      // Should be basic transform only
      expect(layer.transform.angle).toBe(45); // original
      expect(layer.transform.position).toEqual({ x: 10, y: 20 }); // original
      expect(layer.transform.scale).toEqual({ x: 2, y: 2 }); // original
      expect(layer.transform.opacity).toBe(0.8); // original
    });

    it("should create composer with all wrappers", () => {
      const composer = compose(["spin", "orbit", "pulse", "fade"]);
      // Use specific timing for predictable results
      const result = composer(basicConfig, { ...mockContext, time: 0.333 }); // for 45 RPM pulse

      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;

      // All animations should be applied, but use less strict comparisons
      expect(layer.transform.angle).toBeGreaterThan(45); // spin applied
      expect(layer.transform.position.x).not.toBe(10); // orbit applied
      expect(layer.transform.position.y).not.toBe(20); // orbit applied
      expect(layer.transform.scale.x).toBeGreaterThan(2); // pulse applied
      expect(layer.transform.scale.y).toBeGreaterThan(2); // pulse applied
      expect(layer.transform.opacity).not.toBe(0.8); // fade applied
    });

    it("should handle duplicate wrappers gracefully", () => {
      const composer = compose(["spin", "spin", "fade"]);
      const result = composer(basicConfig, { ...mockContext, time: 0.375 });

      // Should work the same as ['spin', 'fade']
      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;
      expect(layer.transform.angle).toBe(180); // spin applied once
      expect(layer.transform.opacity).toBeCloseTo(0.9, 3); // fade applied
    });
  });

  describe("produceBasic", () => {
    it("should produce layers with basic transforms only", () => {
      const result = produceBasic(basicConfig, mockContext);

      expect(result.layers).toHaveLength(1);
      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;

      expect(layer.transform.position).toEqual({ x: 10, y: 20 });
      expect(layer.transform.scale).toEqual({ x: 2, y: 2 });
      expect(layer.transform.angle).toBe(45);
      expect(layer.transform.opacity).toBe(0.8);
      expect(layer.zIndex).toBe(0);
    });

    it("should preserve layer metadata in basic mode", () => {
      const result = produceBasic(basicConfig, mockContext);
      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;

      expect(layer.id).toBe("test-layer");
      expect(layer.asset).toEqual({ type: "path", path: "/test.png" });
      expect(layer.behaviors).toBeDefined();
      expect(layer.state.isVisible).toBe(true);
    });
  });

  describe("produceBasicSpin", () => {
    it("should apply only spin animation", () => {
      const result = produceBasicSpin(basicConfig, {
        ...mockContext,
        time: 0.5,
      });
      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;

      // Spin: 60 RPM for 0.5s = 180 degrees
      expect(layer.transform.angle).toBe(225); // 45 + 180

      // Other transforms should remain basic
      expect(layer.transform.position).toEqual({ x: 10, y: 20 });
      expect(layer.transform.scale).toEqual({ x: 2, y: 2 });
      expect(layer.transform.opacity).toBe(0.8);
    });
  });

  describe("produceBasicOrbit", () => {
    it("should apply only orbit animation", () => {
      const result = produceBasicOrbit(basicConfig, {
        ...mockContext,
        time: 0.5,
      });
      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;

      // Orbit: 30 RPM for 0.5s = 90 degrees around base position
      expect(layer.transform.position.x).toBeCloseTo(10, 5); // base + orbit calculation
      expect(layer.transform.position.y).toBeCloseTo(70, 5); // base + radius

      // Other transforms should remain basic
      expect(layer.transform.angle).toBe(45);
      expect(layer.transform.scale).toEqual({ x: 2, y: 2 });
      expect(layer.transform.opacity).toBe(0.8);
    });
  });

  describe("produceBasicPulse", () => {
    it("should apply only pulse animation", () => {
      const result = produceBasicPulse(basicConfig, {
        ...mockContext,
        time: (0.25 / 45) * 60,
      }); // adjusted for 45 RPM
      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;

      // Pulse: amplitude 0.5 at peak = scale * 1.5
      expect(layer.transform.scale.x).toBeCloseTo(3, 5); // 2 * 1.5
      expect(layer.transform.scale.y).toBeCloseTo(3, 5);

      // Other transforms should remain basic
      expect(layer.transform.position).toEqual({ x: 10, y: 20 });
      expect(layer.transform.angle).toBe(45);
      expect(layer.transform.opacity).toBe(0.8);
    });
  });

  describe("produceBasicFade", () => {
    it("should apply only fade animation", () => {
      const result = produceBasicFade(basicConfig, {
        ...mockContext,
        time: (0.25 / 40) * 60,
      }); // adjusted for 40 RPM
      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;

      // Fade: at peak should be 'to' value
      expect(layer.transform.opacity).toBeCloseTo(0.9, 5);

      // Other transforms should remain basic
      expect(layer.transform.position).toEqual({ x: 10, y: 20 });
      expect(layer.transform.scale).toEqual({ x: 2, y: 2 });
      expect(layer.transform.angle).toBe(45);
    });
  });

  describe("produceFull", () => {
    it("should apply all animations like the full producer", () => {
      const result = produceFull(basicConfig, { ...mockContext, time: 0.25 });
      expect(result.layers.length).toBeGreaterThan(0);
      const layer = result.layers[0]!;

      // Should have all animations applied (same as full LayerProducer)
      expect(layer.transform.angle).not.toBe(45); // spin applied
      expect(layer.transform.position).not.toEqual({ x: 10, y: 20 }); // orbit applied
      expect(layer.transform.scale).not.toEqual({ x: 2, y: 2 }); // pulse applied
      expect(layer.transform.opacity).not.toBe(0.8); // fade applied
    });
  });

  describe("error handling", () => {
    it("should throw error for invalid config", () => {
      const invalidConfig = {
        layers: [
          {
            /* missing required fields */
          },
        ],
      } as any;

      expect(() => produceBasic(invalidConfig, mockContext)).toThrow(
        "validation failed",
      );
      expect(() => produceBasicSpin(invalidConfig, mockContext)).toThrow(
        "validation failed",
      );
      expect(() => compose(["spin"])(invalidConfig, mockContext)).toThrow(
        "validation failed",
      );
    });

    it("should handle warnings properly", () => {
      const configWithWarnings: LibraryConfig = {
        layers: [
          {
            layerId: "warning-layer",
            imagePath: "/test.png",
            opacity: 1.5, // out of range
          },
        ],
      };

      const result = produceBasic(configWithWarnings, mockContext);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("opacity should be within [0,1]");
    });
  });

  describe("consistency across pipeline variants", () => {
    it("should produce identical basic transforms across all variants", () => {
      const timeZeroContext = { ...mockContext, time: 0 };

      // At time 0, all animations should have no effect
      const basic = produceBasic(basicConfig, timeZeroContext);
      const spin = produceBasicSpin(basicConfig, timeZeroContext);
      const orbit = produceBasicOrbit(basicConfig, timeZeroContext);
      const pulse = produceBasicPulse(basicConfig, timeZeroContext);
      const fade = produceBasicFade(basicConfig, timeZeroContext);

      // Basic properties should be identical
      expect(spin.layers[0]!.id).toBe(basic.layers[0]!.id);
      expect(orbit.layers[0]!.asset).toEqual(basic.layers[0]!.asset);
      expect(pulse.layers[0]!.zIndex).toBe(basic.layers[0]!.zIndex);
      expect(fade.layers[0]!.behaviors).toEqual(basic.layers[0]!.behaviors);
    });

    it("should maintain layer order consistency", () => {
      const multiLayerConfig: LibraryConfig = {
        layers: [
          { layerId: "first", imagePath: "/first.png" },
          { layerId: "second", imagePath: "/second.png" },
          { layerId: "third", imagePath: "/third.png" },
        ],
      };

      const result = produceBasic(multiLayerConfig, mockContext);

      expect(result.layers[0]!.id).toBe("first");
      expect(result.layers[1]!.id).toBe("second");
      expect(result.layers[2]!.id).toBe("third");
      expect(result.layers[0]!.zIndex).toBe(0);
      expect(result.layers[1]!.zIndex).toBe(1);
      expect(result.layers[2]!.zIndex).toBe(2);
    });
  });
});

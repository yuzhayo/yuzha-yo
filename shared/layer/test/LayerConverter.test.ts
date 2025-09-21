import { describe, it, expect } from "vitest";
import {
  toUIDeg,
  fromUIDeg,
  toUIRpm,
  fromUIRpm,
  toUIOpacity,
  fromUIOpacity,
  toUIScaleUniform,
  fromUIScaleUniform,
  toUILayerControls,
  fromUILayerControls,
} from "../LayerConverter";
import type { LayerConfigNormalized } from "../LayerTypes";

describe("LayerConverter", () => {
  describe("angle conversion", () => {
    it("should wrap angles to 0-360 range", () => {
      expect(toUIDeg(450)).toBe(90); // 450 - 360 = 90
      expect(toUIDeg(-90)).toBe(270); // -90 + 360 = 270
      expect(toUIDeg(720)).toBe(0); // 720 - 720 = 0
    });

    it("should handle no wrap option", () => {
      expect(toUIDeg(450, { wrap: false })).toBe(450);
      expect(toUIDeg(-90, { wrap: false })).toBe(-90);
    });

    it("should pass through fromUIDeg", () => {
      expect(fromUIDeg(180)).toBe(180);
      expect(fromUIDeg(0)).toBe(0);
      expect(fromUIDeg(359)).toBe(359);
    });
  });

  describe("RPM conversion", () => {
    it("should clamp RPM within default range", () => {
      expect(toUIRpm(-10)).toBe(0);
      expect(toUIRpm(100)).toBe(60);
      expect(toUIRpm(30)).toBe(30);
    });

    it("should respect custom RPM range", () => {
      expect(toUIRpm(150, { min: 0, max: 200 })).toBe(150);
      expect(toUIRpm(-10, { min: 10, max: 100 })).toBe(10);
    });

    it("should maintain symmetry with fromUIRpm", () => {
      const original = 45;
      const ui = toUIRpm(original);
      const back = fromUIRpm(ui);
      expect(back).toBe(original);
    });
  });

  describe("opacity conversion", () => {
    it("should clamp opacity within 0-1 range", () => {
      expect(toUIOpacity(-0.5)).toBe(0);
      expect(toUIOpacity(1.5)).toBe(1);
      expect(toUIOpacity(0.7)).toBe(0.7);
    });

    it("should maintain symmetry with fromUIOpacity", () => {
      const original = 0.8;
      const ui = toUIOpacity(original);
      const back = fromUIOpacity(ui);
      expect(back).toBe(original);
    });
  });

  describe("scale conversion", () => {
    it("should convert to uniform scale by averaging", () => {
      expect(toUIScaleUniform(2, 4)).toBe(3); // (2+4)/2 = 3
      expect(toUIScaleUniform(1, 1)).toBe(1);
      expect(toUIScaleUniform(0.5, 1.5)).toBe(1);
    });

    it("should clamp uniform scale within range", () => {
      expect(toUIScaleUniform(0.05, 0.05)).toBe(0.1); // below min
      expect(toUIScaleUniform(15, 15)).toBe(10); // above max
    });

    it("should convert from uniform scale to Vec2", () => {
      const result = fromUIScaleUniform(2.5);
      expect(result).toEqual({ x: 2.5, y: 2.5 });
    });

    it("should maintain symmetry with uniform values", () => {
      const originalX = 3;
      const originalY = 3;
      const ui = toUIScaleUniform(originalX, originalY);
      const back = fromUIScaleUniform(ui);
      expect(back.x).toBe(originalX);
      expect(back.y).toBe(originalY);
    });
  });

  describe("full layer controls conversion", () => {
    const mockNormalizedLayer: LayerConfigNormalized = {
      layerId: "test-layer",
      assetRef: { type: "path", path: "/test.png" },
      position: { x: 0, y: 0 },
      scale: { x: 2, y: 2 },
      angle: 45,
      tilt: { x: 90, y: 180 },
      anchor: { x: 0.5, y: 0.5 },
      opacity: 0.8,
      behaviors: {
        spin: { enabled: true, rpm: 30, direction: "cw" },
        orbit: { enabled: false, rpm: 0, radius: 100 },
        pulse: { enabled: true, amplitude: 0.2, rpm: 15 },
        fade: { enabled: false, from: 0, to: 1, rpm: 10 },
      },
    };

    it("should convert normalized layer to UI controls", () => {
      const result = toUILayerControls(mockNormalizedLayer);

      expect(result.angle).toBe(45);
      expect(result.tiltX).toBe(90);
      expect(result.tiltY).toBe(180);
      expect(result.opacity).toBe(0.8);
      expect(result.scale).toBe(2); // uniform from (2+2)/2
      expect(result.spin).toEqual({
        enabled: true,
        rpm: 30,
        direction: "cw",
      });
      expect(result.pulse).toEqual({
        enabled: true,
        amplitude: 0.2,
        rpm: 15,
      });
    });

    it("should convert UI controls back to normalized layer", () => {
      const uiControls = toUILayerControls(mockNormalizedLayer);
      const result = fromUILayerControls(mockNormalizedLayer, uiControls);

      expect(result.angle).toBe(mockNormalizedLayer.angle);
      expect(result.tilt.x).toBe(mockNormalizedLayer.tilt.x);
      expect(result.tilt.y).toBe(mockNormalizedLayer.tilt.y);
      expect(result.opacity).toBe(mockNormalizedLayer.opacity);
      expect(result.scale).toEqual(mockNormalizedLayer.scale);
      expect(result.behaviors.spin).toEqual(mockNormalizedLayer.behaviors.spin);
    });

    it("should handle partial UI updates", () => {
      const partialUI = {
        angle: 90,
        spin: { enabled: false, rpm: 30, direction: "cw" as const },
      };

      const result = fromUILayerControls(mockNormalizedLayer, partialUI);

      expect(result.angle).toBe(90); // updated
      expect(result.tilt.x).toBe(mockNormalizedLayer.tilt.x); // preserved
      expect(result.behaviors.spin.enabled).toBe(false); // updated
      expect(result.behaviors.spin.rpm).toBe(
        mockNormalizedLayer.behaviors.spin.rpm,
      ); // preserved
    });
  });
});

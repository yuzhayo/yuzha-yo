import { describe, it, expect } from "vitest";
import { applyFade } from "../LayerLogicFade";
import type { FadeConfig } from "../LayerTypes";

describe("LayerLogicFade", () => {
  describe("applyFade", () => {
    it("should return original opacity when disabled", () => {
      const config: FadeConfig = {
        enabled: false,
        from: 0.2,
        to: 0.8,
        rpm: 30,
      };
      const result = applyFade({ opacity: 0.5 }, config, 1);

      expect(result.opacity).toBe(0.5);
    });

    it("should return original opacity when rpm is 0", () => {
      const config: FadeConfig = { enabled: true, from: 0.2, to: 0.8, rpm: 0 };
      const result = applyFade({ opacity: 0.5 }, config, 1);

      expect(result.opacity).toBe(0.5);
    });

    it("should start at from value when time is 0", () => {
      const config: FadeConfig = { enabled: true, from: 0.2, to: 0.8, rpm: 60 };
      const result = applyFade({ opacity: 0.5 }, config, 0);

      // At time 0, sin(0) = 0, so t01 = (0 + 1) / 2 = 0.5
      // value = 0.2 + (0.8 - 0.2) * 0.5 = 0.2 + 0.3 = 0.5
      expect(result.opacity).toBeCloseTo(0.5, 5);
    });

    it("should reach maximum at quarter cycle", () => {
      const config: FadeConfig = { enabled: true, from: 0.2, to: 0.8, rpm: 60 };

      // At 0.25 seconds with 60 RPM = 90 degrees = sin(π/2) = 1
      // t01 = (1 + 1) / 2 = 1
      // value = 0.2 + (0.8 - 0.2) * 1 = 0.8
      const result = applyFade({ opacity: 0.5 }, config, 0.25);

      expect(result.opacity).toBeCloseTo(0.8, 5);
    });

    it("should return to middle at half cycle", () => {
      const config: FadeConfig = { enabled: true, from: 0.2, to: 0.8, rpm: 60 };

      // At 0.5 seconds with 60 RPM = 180 degrees = sin(π) = 0
      // t01 = (0 + 1) / 2 = 0.5
      // value = 0.2 + (0.8 - 0.2) * 0.5 = 0.5
      const result = applyFade({ opacity: 0.5 }, config, 0.5);

      expect(result.opacity).toBeCloseTo(0.5, 5);
    });

    it("should reach minimum at three-quarter cycle", () => {
      const config: FadeConfig = { enabled: true, from: 0.2, to: 0.8, rpm: 60 };

      // At 0.75 seconds with 60 RPM = 270 degrees = sin(3π/2) = -1
      // t01 = (-1 + 1) / 2 = 0
      // value = 0.2 + (0.8 - 0.2) * 0 = 0.2
      const result = applyFade({ opacity: 0.5 }, config, 0.75);

      expect(result.opacity).toBeCloseTo(0.2, 5);
    });

    it("should handle reversed fade (from > to)", () => {
      const config: FadeConfig = { enabled: true, from: 0.8, to: 0.2, rpm: 60 };

      // At maximum (t01 = 1), should be at 'to' value
      const result = applyFade({ opacity: 0.5 }, config, 0.25);

      expect(result.opacity).toBeCloseTo(0.2, 5);
    });

    it("should handle same from and to values", () => {
      const config: FadeConfig = { enabled: true, from: 0.6, to: 0.6, rpm: 60 };

      // Should always return the same value regardless of time
      const result1 = applyFade({ opacity: 0.5 }, config, 0);
      const result2 = applyFade({ opacity: 0.5 }, config, 0.25);
      const result3 = applyFade({ opacity: 0.5 }, config, 0.5);

      expect(result1.opacity).toBeCloseTo(0.6, 5);
      expect(result2.opacity).toBeCloseTo(0.6, 5);
      expect(result3.opacity).toBeCloseTo(0.6, 5);
    });

    it("should clamp values to 0-1 range", () => {
      const config: FadeConfig = {
        enabled: true,
        from: -0.5,
        to: 1.5,
        rpm: 60,
      };

      // At minimum (t01 = 0)
      const minResult = applyFade({ opacity: 0.5 }, config, 0.75);
      expect(minResult.opacity).toBe(0); // clamped from -0.5

      // At maximum (t01 = 1)
      const maxResult = applyFade({ opacity: 0.5 }, config, 0.25);
      expect(maxResult.opacity).toBe(1); // clamped from 1.5
    });

    it("should handle 30 RPM correctly", () => {
      const config: FadeConfig = { enabled: true, from: 0, to: 1, rpm: 30 };

      // 30 RPM for 0.5 seconds = 90 degrees = maximum
      const result = applyFade({ opacity: 0.5 }, config, 0.5);

      expect(result.opacity).toBeCloseTo(1, 5);
    });

    it("should handle invalid time values", () => {
      const config: FadeConfig = { enabled: true, from: 0.2, to: 0.8, rpm: 30 };
      const originalOpacity = 0.5;

      expect(applyFade({ opacity: originalOpacity }, config, NaN).opacity).toBe(
        originalOpacity,
      );
      expect(
        applyFade({ opacity: originalOpacity }, config, Infinity).opacity,
      ).toBe(originalOpacity);
    });

    it("should handle full opacity range correctly", () => {
      const config: FadeConfig = { enabled: true, from: 0, to: 1, rpm: 60 };

      // Test at different phases
      const results = [
        applyFade({ opacity: 0.5 }, config, 0), // middle
        applyFade({ opacity: 0.5 }, config, 0.25), // maximum
        applyFade({ opacity: 0.5 }, config, 0.5), // middle
        applyFade({ opacity: 0.5 }, config, 0.75), // minimum
      ];

      expect(results[0]!.opacity).toBeCloseTo(0.5, 5);
      expect(results[1]!.opacity).toBeCloseTo(1, 5);
      expect(results[2]!.opacity).toBeCloseTo(0.5, 5);
      expect(results[3]!.opacity).toBeCloseTo(0, 5);
    });
  });
});

import { describe, it, expect } from "vitest";
import { applyPulse } from "../LayerLogicPulse";
import type { PulseConfig } from "../LayerTypes";

describe("LayerLogicPulse", () => {
  describe("applyPulse", () => {
    it("should return original scale when disabled", () => {
      const config: PulseConfig = { enabled: false, amplitude: 0.5, rpm: 30 };
      const result = applyPulse({ scale: { x: 2, y: 3 } }, config, 1);

      expect(result.scale).toEqual({ x: 2, y: 3 });
    });

    it("should return original scale when rpm is 0", () => {
      const config: PulseConfig = { enabled: true, amplitude: 0.5, rpm: 0 };
      const result = applyPulse({ scale: { x: 2, y: 3 } }, config, 1);

      expect(result.scale).toEqual({ x: 2, y: 3 });
    });

    it("should return original scale when amplitude is 0", () => {
      const config: PulseConfig = { enabled: true, amplitude: 0, rpm: 30 };
      const result = applyPulse({ scale: { x: 2, y: 3 } }, config, 1);

      expect(result.scale).toEqual({ x: 2, y: 3 });
    });

    it("should apply pulse at sine wave peak (amplitude = 1)", () => {
      const config: PulseConfig = { enabled: true, amplitude: 0.5, rpm: 60 };

      // At 0.25 seconds with 60 RPM, we're at 90 degrees = sin(π/2) = 1
      // Scale factor = 1 + 0.5 * 1 = 1.5
      const result = applyPulse({ scale: { x: 2, y: 3 } }, config, 0.25);

      expect(result.scale.x).toBeCloseTo(3, 5); // 2 * 1.5
      expect(result.scale.y).toBeCloseTo(4.5, 5); // 3 * 1.5
    });

    it("should apply pulse at sine wave trough (amplitude = -1)", () => {
      const config: PulseConfig = { enabled: true, amplitude: 0.5, rpm: 60 };

      // At 0.75 seconds with 60 RPM, we're at 270 degrees = sin(3π/2) = -1
      // Scale factor = 1 + 0.5 * (-1) = 0.5
      const result = applyPulse({ scale: { x: 2, y: 4 } }, config, 0.75);

      expect(result.scale.x).toBeCloseTo(1, 5); // 2 * 0.5
      expect(result.scale.y).toBeCloseTo(2, 5); // 4 * 0.5
    });

    it("should apply no pulse at sine wave zero crossing", () => {
      const config: PulseConfig = { enabled: true, amplitude: 0.5, rpm: 60 };

      // At 0 seconds, sine = 0, so scale factor = 1 + 0.5 * 0 = 1
      const result = applyPulse({ scale: { x: 2, y: 3 } }, config, 0);

      expect(result.scale.x).toBeCloseTo(2, 5); // 2 * 1
      expect(result.scale.y).toBeCloseTo(3, 5); // 3 * 1
    });

    it("should handle 30 RPM correctly", () => {
      const config: PulseConfig = { enabled: true, amplitude: 1, rpm: 30 };

      // 30 RPM for 0.5 seconds = 90 degrees = sin(π/2) = 1
      // Scale factor = 1 + 1 * 1 = 2
      const result = applyPulse({ scale: { x: 1, y: 1 } }, config, 0.5);

      expect(result.scale.x).toBeCloseTo(2, 5);
      expect(result.scale.y).toBeCloseTo(2, 5);
    });

    it("should handle different amplitude values", () => {
      const baseScale = { x: 2, y: 2 };
      const time = 0.25; // 90 degrees for 60 RPM

      // Test amplitude 0.2
      let config: PulseConfig = { enabled: true, amplitude: 0.2, rpm: 60 };
      let result = applyPulse({ scale: baseScale }, config, time);
      expect(result.scale.x).toBeCloseTo(2.4, 5); // 2 * (1 + 0.2)

      // Test amplitude 1.0
      config = { enabled: true, amplitude: 1.0, rpm: 60 };
      result = applyPulse({ scale: baseScale }, config, time);
      expect(result.scale.x).toBeCloseTo(4, 5); // 2 * (1 + 1.0)
    });

    it("should handle invalid time values", () => {
      const config: PulseConfig = { enabled: true, amplitude: 0.5, rpm: 30 };
      const originalScale = { x: 2, y: 3 };

      expect(applyPulse({ scale: originalScale }, config, NaN).scale).toEqual(
        originalScale,
      );
      expect(
        applyPulse({ scale: originalScale }, config, Infinity).scale,
      ).toEqual(originalScale);
    });

    it("should maintain uniform scaling across x and y", () => {
      const config: PulseConfig = { enabled: true, amplitude: 0.5, rpm: 60 };
      const result = applyPulse({ scale: { x: 2, y: 4 } }, config, 0.25);

      // Both should be scaled by the same factor (1.5)
      expect(result.scale.x / 2).toBeCloseTo(result.scale.y / 4, 5);
    });
  });
});

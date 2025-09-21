import { describe, it, expect } from "vitest";
import { applySpin } from "../LayerLogicSpin";
import type { SpinConfig } from "../LayerTypes";

describe("LayerLogicSpin", () => {
  describe("applySpin", () => {
    it("should return original angle when disabled", () => {
      const config: SpinConfig = { enabled: false, rpm: 30, direction: "cw" };
      const result = applySpin({ angle: 45 }, config, 1);

      expect(result.angle).toBe(45);
    });

    it("should return original angle when rpm is 0", () => {
      const config: SpinConfig = { enabled: true, rpm: 0, direction: "cw" };
      const result = applySpin({ angle: 45 }, config, 1);

      expect(result.angle).toBe(45);
    });

    it("should calculate clockwise rotation correctly", () => {
      const config: SpinConfig = { enabled: true, rpm: 60, direction: "cw" };
      // 60 RPM = 1 rotation per second = 360 degrees per second
      const result = applySpin({ angle: 0 }, config, 1);

      expect(result.angle).toBe(360);
    });

    it("should calculate counter-clockwise rotation correctly", () => {
      const config: SpinConfig = { enabled: true, rpm: 60, direction: "ccw" };
      // 60 RPM = 1 rotation per second = -360 degrees per second
      const result = applySpin({ angle: 0 }, config, 1);

      expect(result.angle).toBe(-360);
    });

    it("should handle partial time correctly", () => {
      const config: SpinConfig = { enabled: true, rpm: 60, direction: "cw" };
      // 60 RPM for 0.5 seconds = 180 degrees
      const result = applySpin({ angle: 90 }, config, 0.5);

      expect(result.angle).toBe(270); // 90 + 180
    });

    it("should handle 30 RPM correctly", () => {
      const config: SpinConfig = { enabled: true, rpm: 30, direction: "cw" };
      // 30 RPM for 1 second = 180 degrees
      const result = applySpin({ angle: 0 }, config, 1);

      expect(result.angle).toBe(180);
    });

    it("should handle invalid time values", () => {
      const config: SpinConfig = { enabled: true, rpm: 30, direction: "cw" };

      expect(applySpin({ angle: 45 }, config, NaN).angle).toBe(45);
      expect(applySpin({ angle: 45 }, config, Infinity).angle).toBe(45);
    });

    it("should accumulate rotations over multiple calls", () => {
      const config: SpinConfig = { enabled: true, rpm: 60, direction: "cw" };

      let result = applySpin({ angle: 0 }, config, 0.5); // +180
      expect(result.angle).toBe(180);

      result = applySpin({ angle: result.angle }, config, 0.5); // +180 more
      expect(result.angle).toBe(360);
    });
  });
});

import { describe, it, expect } from "vitest";
import { applyOrbit } from "../LayerLogicOrbit";
import type { OrbitConfig } from "../LayerTypes";

describe("LayerLogicOrbit", () => {
  describe("applyOrbit", () => {
    it("should return original position when disabled", () => {
      const config: OrbitConfig = { enabled: false, rpm: 30, radius: 100 };
      const result = applyOrbit({ position: { x: 10, y: 20 } }, config, 1, {
        x: 0,
        y: 0,
      });

      expect(result.position).toEqual({ x: 10, y: 20 });
    });

    it("should return original position when rpm is 0", () => {
      const config: OrbitConfig = { enabled: true, rpm: 0, radius: 100 };
      const result = applyOrbit({ position: { x: 10, y: 20 } }, config, 1, {
        x: 0,
        y: 0,
      });

      expect(result.position).toEqual({ x: 10, y: 20 });
    });

    it("should return original position when radius is 0", () => {
      const config: OrbitConfig = { enabled: true, rpm: 30, radius: 0 };
      const result = applyOrbit({ position: { x: 10, y: 20 } }, config, 1, {
        x: 0,
        y: 0,
      });

      expect(result.position).toEqual({ x: 10, y: 20 });
    });

    it("should calculate clockwise orbit correctly at time 0", () => {
      const config: OrbitConfig = { enabled: true, rpm: 60, radius: 100 };
      const baseCenter = { x: 0, y: 0 };

      // At time 0, should be at (radius, 0) from center
      const result = applyOrbit(
        { position: { x: 0, y: 0 } },
        config,
        0,
        baseCenter,
      );

      expect(result.position.x).toBeCloseTo(100, 5);
      expect(result.position.y).toBeCloseTo(0, 5);
    });

    it("should calculate quarter rotation correctly", () => {
      const config: OrbitConfig = { enabled: true, rpm: 60, radius: 100 };
      const baseCenter = { x: 0, y: 0 };

      // 60 RPM for 0.25 seconds = 90 degrees = quarter circle
      // Should be at (0, radius) from center
      const result = applyOrbit(
        { position: { x: 0, y: 0 } },
        config,
        0.25,
        baseCenter,
      );

      expect(result.position.x).toBeCloseTo(0, 5);
      expect(result.position.y).toBeCloseTo(100, 5);
    });

    it("should calculate half rotation correctly", () => {
      const config: OrbitConfig = { enabled: true, rpm: 60, radius: 100 };
      const baseCenter = { x: 0, y: 0 };

      // 60 RPM for 0.5 seconds = 180 degrees = half circle
      // Should be at (-radius, 0) from center
      const result = applyOrbit(
        { position: { x: 0, y: 0 } },
        config,
        0.5,
        baseCenter,
      );

      expect(result.position.x).toBeCloseTo(-100, 5);
      expect(result.position.y).toBeCloseTo(0, 5);
    });

    it("should use custom center when provided", () => {
      const config: OrbitConfig = {
        enabled: true,
        rpm: 60,
        radius: 100,
        center: { x: 50, y: 50 },
      };
      const baseCenter = { x: 0, y: 0 };

      // At time 0, should be at (50 + radius, 50) = (150, 50)
      const result = applyOrbit(
        { position: { x: 0, y: 0 } },
        config,
        0,
        baseCenter,
      );

      expect(result.position.x).toBeCloseTo(150, 5);
      expect(result.position.y).toBeCloseTo(50, 5);
    });

    it("should use baseCenter when no custom center provided", () => {
      const config: OrbitConfig = { enabled: true, rpm: 60, radius: 100 };
      const baseCenter = { x: 25, y: 25 };

      // At time 0, should be at (25 + radius, 25) = (125, 25)
      const result = applyOrbit(
        { position: { x: 0, y: 0 } },
        config,
        0,
        baseCenter,
      );

      expect(result.position.x).toBeCloseTo(125, 5);
      expect(result.position.y).toBeCloseTo(25, 5);
    });

    it("should handle counter-clockwise direction", () => {
      const config = {
        enabled: true,
        rpm: 60,
        radius: 100,
        direction: "ccw" as const,
      } as OrbitConfig & { direction: "ccw" };
      const baseCenter = { x: 0, y: 0 };

      // CCW quarter rotation should be at (0, -radius)
      const result = applyOrbit(
        { position: { x: 0, y: 0 } },
        config,
        0.25,
        baseCenter,
      );

      expect(result.position.x).toBeCloseTo(0, 5);
      expect(result.position.y).toBeCloseTo(-100, 5);
    });

    it("should handle invalid time values", () => {
      const config: OrbitConfig = { enabled: true, rpm: 60, radius: 100 };
      const baseCenter = { x: 0, y: 0 };
      const originalPos = { x: 10, y: 20 };

      expect(
        applyOrbit({ position: originalPos }, config, NaN, baseCenter).position,
      ).toEqual(originalPos);
      expect(
        applyOrbit({ position: originalPos }, config, Infinity, baseCenter)
          .position,
      ).toEqual(originalPos);
    });
  });
});

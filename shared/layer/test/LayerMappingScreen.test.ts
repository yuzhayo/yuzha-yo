import { describe, it, expect } from "vitest";
import { createScreenMapping, defaultPlacement } from "../LayerMappingScreen";
import type { StageConfigNormalized } from "../LayerTypes";

describe("LayerMappingScreen", () => {
  describe("createScreenMapping", () => {
    describe("center origin", () => {
      const centerStage: StageConfigNormalized = {
        width: 800,
        height: 600,
        origin: "center",
      };

      it("should create screen mapping for center origin", () => {
        const mapping = createScreenMapping(centerStage);

        expect(mapping.bounds()).toEqual({ w: 800, h: 600 });
        expect(mapping.center()).toEqual({ x: 0, y: 0 });
      });

      it("should pass through coordinates for center origin", () => {
        const mapping = createScreenMapping(centerStage);

        const point = { x: 100, y: -50 };
        expect(mapping.toCenter(point)).toEqual(point);
        expect(mapping.toTopLeft(point)).toEqual({ x: 500, y: 250 }); // +half
      });

      it("should handle coordinate conversion correctly for center origin", () => {
        const mapping = createScreenMapping(centerStage);

        // For center origin stage, toCenter is pass-through
        const centerPoint = { x: -200, y: 150 };
        expect(mapping.toCenter(centerPoint)).toEqual(centerPoint);

        // toTopLeft adds half dimensions to convert to screen coordinates
        const topLeftEquivalent = mapping.toTopLeft(centerPoint);
        expect(topLeftEquivalent).toEqual({ x: 200, y: 450 }); // -200+400, 150+300
      });
    });

    describe("top-left origin", () => {
      const topLeftStage: StageConfigNormalized = {
        width: 1000,
        height: 800,
        origin: "top-left",
      };

      it("should create screen mapping for top-left origin", () => {
        const mapping = createScreenMapping(topLeftStage);

        expect(mapping.bounds()).toEqual({ w: 1000, h: 800 });
        expect(mapping.center()).toEqual({ x: 500, y: 400 }); // half dimensions
      });

      it("should convert coordinates correctly for top-left origin", () => {
        const mapping = createScreenMapping(topLeftStage);

        const topLeftPoint = { x: 200, y: 100 };
        expect(mapping.toCenter(topLeftPoint)).toEqual({ x: -300, y: -300 }); // -half
        expect(mapping.toTopLeft(topLeftPoint)).toEqual(topLeftPoint);
      });

      it("should handle center point conversion", () => {
        const mapping = createScreenMapping(topLeftStage);

        const centerOfStage = { x: 500, y: 400 }; // center in top-left coords
        expect(mapping.toCenter(centerOfStage)).toEqual({ x: 0, y: 0 });
      });

      it("should handle coordinate conversion correctly for top-left origin", () => {
        const mapping = createScreenMapping(topLeftStage);

        // For top-left origin stage, toTopLeft is pass-through
        const topLeftPoint = { x: 750, y: 200 };
        expect(mapping.toTopLeft(topLeftPoint)).toEqual(topLeftPoint);

        // toCenter subtracts half dimensions to convert to center coordinates
        const centerEquivalent = mapping.toCenter(topLeftPoint);
        expect(centerEquivalent).toEqual({ x: 250, y: -200 }); // 750-500, 200-400
      });
    });

    describe("edge cases", () => {
      it("should handle zero dimensions", () => {
        const zeroStage: StageConfigNormalized = {
          width: 0,
          height: 0,
          origin: "center",
        };

        const mapping = createScreenMapping(zeroStage);

        expect(mapping.bounds()).toEqual({ w: 0, h: 0 });
        expect(mapping.center()).toEqual({ x: 0, y: 0 });
      });

      it("should handle very large dimensions", () => {
        const largeStage: StageConfigNormalized = {
          width: 10000,
          height: 10000,
          origin: "top-left",
        };

        const mapping = createScreenMapping(largeStage);

        expect(mapping.center()).toEqual({ x: 5000, y: 5000 });

        const point = { x: 2500, y: 7500 };
        const centerCoord = mapping.toCenter(point);
        expect(centerCoord).toEqual({ x: -2500, y: 2500 });
      });

      it("should handle non-square dimensions", () => {
        const rectStage: StageConfigNormalized = {
          width: 1920,
          height: 1080,
          origin: "center",
        };

        const mapping = createScreenMapping(rectStage);

        expect(mapping.center()).toEqual({ x: 0, y: 0 });

        const point = { x: 100, y: -200 };
        const topLeftCoord = mapping.toTopLeft(point);
        expect(topLeftCoord).toEqual({ x: 1060, y: 340 }); // +half of each dimension
      });
    });

    describe("coordinate system consistency", () => {
      it("should maintain consistency between origins", () => {
        const dimensions = { width: 400, height: 300 };

        const centerStage: StageConfigNormalized = {
          ...dimensions,
          origin: "center",
        };
        const topLeftStage: StageConfigNormalized = {
          ...dimensions,
          origin: "top-left",
        };

        const centerMapping = createScreenMapping(centerStage);
        const topLeftMapping = createScreenMapping(topLeftStage);

        // Same logical point in different coordinate systems
        const logicalPoint = { x: 50, y: -75 };

        // Convert center-origin point to top-left
        const centerAsTopLeft = centerMapping.toTopLeft(logicalPoint);

        // Convert that back to center using top-left mapping
        const backToCenter = topLeftMapping.toCenter(centerAsTopLeft);

        expect(backToCenter).toEqual(logicalPoint);
      });
    });
  });

  describe("defaultPlacement", () => {
    it("should return origin center for center-based stage", () => {
      const centerStage: StageConfigNormalized = {
        width: 800,
        height: 600,
        origin: "center",
      };

      const placement = defaultPlacement(centerStage);

      expect(placement).toEqual({ x: 0, y: 0 });
    });

    it("should return stage center for top-left stage", () => {
      const topLeftStage: StageConfigNormalized = {
        width: 1000,
        height: 800,
        origin: "top-left",
      };

      const placement = defaultPlacement(topLeftStage);

      expect(placement).toEqual({ x: 500, y: 400 }); // half of dimensions
    });

    it("should handle square stage", () => {
      const squareStage: StageConfigNormalized = {
        width: 512,
        height: 512,
        origin: "top-left",
      };

      const placement = defaultPlacement(squareStage);

      expect(placement).toEqual({ x: 256, y: 256 });
    });

    it("should handle very small stage", () => {
      const smallStage: StageConfigNormalized = {
        width: 2,
        height: 2,
        origin: "top-left",
      };

      const placement = defaultPlacement(smallStage);

      expect(placement).toEqual({ x: 1, y: 1 });
    });

    it("should handle odd dimensions", () => {
      const oddStage: StageConfigNormalized = {
        width: 101, // odd
        height: 201, // odd
        origin: "top-left",
      };

      const placement = defaultPlacement(oddStage);

      expect(placement).toEqual({ x: 50.5, y: 100.5 });
    });
  });
});

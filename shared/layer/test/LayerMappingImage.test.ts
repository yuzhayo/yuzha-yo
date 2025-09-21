import { describe, it, expect } from "vitest";
import type { ContainerSpec } from "../LayerMappingImage";
import { mapImageIntoContainer } from "../LayerMappingImage";
import type { AssetMeta } from "../LayerTypes";

describe("LayerMappingImage", () => {
  describe("mapImageIntoContainer", () => {
    const mockAsset: AssetMeta = {
      src: "/test/image.png",
      width: 200,
      height: 100,
    };

    const mockAnchor = { x: 0.5, y: 0.5 };

    it("should return original dimensions when no container", () => {
      const result = mapImageIntoContainer(mockAsset, undefined, mockAnchor);

      expect(result).toEqual({
        displayWidth: 200,
        displayHeight: 100,
        offset: { x: 0, y: 0 },
        anchor: mockAnchor,
      });
    });

    it("should use asset anchor when available", () => {
      const assetWithAnchor: AssetMeta = {
        ...mockAsset,
        anchor: { x: 0.2, y: 0.8 },
      };

      const result = mapImageIntoContainer(
        assetWithAnchor,
        undefined,
        mockAnchor,
      );

      expect(result.anchor).toEqual({ x: 0.2, y: 0.8 });
    });

    it("should handle stretch fit mode", () => {
      const container: ContainerSpec = {
        width: 300,
        height: 150,
        fitMode: "stretch",
        alignment: "center",
      };

      const result = mapImageIntoContainer(mockAsset, container, mockAnchor);

      expect(result.displayWidth).toBe(300);
      expect(result.displayHeight).toBe(150);
      expect(result.offset).toEqual({ x: 0, y: 0 }); // center alignment
    });

    it("should handle contain fit mode with width constraint", () => {
      const container: ContainerSpec = {
        width: 100, // smaller than asset width
        height: 200, // larger than asset height
        fitMode: "contain",
        alignment: "center",
      };

      const result = mapImageIntoContainer(mockAsset, container, mockAnchor);

      // Asset is 200x100, container is 100x200
      // Scale factor should be min(100/200, 200/100) = min(0.5, 2) = 0.5
      expect(result.displayWidth).toBe(100); // 200 * 0.5
      expect(result.displayHeight).toBe(50); // 100 * 0.5
    });

    it("should handle contain fit mode with height constraint", () => {
      const container: ContainerSpec = {
        width: 400, // larger than asset width
        height: 50, // smaller than asset height
        fitMode: "contain",
        alignment: "center",
      };

      const result = mapImageIntoContainer(mockAsset, container, mockAnchor);

      // Asset is 200x100, container is 400x50
      // Scale factor should be min(400/200, 50/100) = min(2, 0.5) = 0.5
      expect(result.displayWidth).toBe(100); // 200 * 0.5
      expect(result.displayHeight).toBe(50); // 100 * 0.5
    });

    it("should handle cover fit mode", () => {
      const container: ContainerSpec = {
        width: 100,
        height: 200,
        fitMode: "cover",
        alignment: "center",
      };

      const result = mapImageIntoContainer(mockAsset, container, mockAnchor);

      // Asset is 200x100, container is 100x200
      // Scale factor should be max(100/200, 200/100) = max(0.5, 2) = 2
      expect(result.displayWidth).toBe(400); // 200 * 2
      expect(result.displayHeight).toBe(200); // 100 * 2
    });

    it("should handle center alignment", () => {
      const container: ContainerSpec = {
        width: 100,
        height: 100,
        fitMode: "stretch",
        alignment: "center",
      };

      const result = mapImageIntoContainer(mockAsset, container, mockAnchor);

      expect(result.offset).toEqual({ x: 0, y: 0 });
    });

    it("should handle top-left alignment", () => {
      const container: ContainerSpec = {
        width: 100,
        height: 100,
        fitMode: "stretch",
        alignment: "top-left",
      };

      const result = mapImageIntoContainer(mockAsset, container, mockAnchor);

      expect(result.offset).toEqual({ x: -50, y: -50 }); // half container size
    });

    it("should handle bottom-right alignment", () => {
      const container: ContainerSpec = {
        width: 200,
        height: 150,
        fitMode: "stretch",
        alignment: "bottom-right",
      };

      const result = mapImageIntoContainer(mockAsset, container, mockAnchor);

      expect(result.offset).toEqual({ x: 100, y: 75 }); // half container size
    });

    it("should handle all alignment positions correctly", () => {
      const container: ContainerSpec = {
        width: 200,
        height: 100,
        fitMode: "stretch",
        alignment: "center", // will be overridden in tests
      };

      const alignments: Array<[string, { x: number; y: number }]> = [
        ["center", { x: 0, y: 0 }],
        ["top", { x: 0, y: -50 }],
        ["bottom", { x: 0, y: 50 }],
        ["left", { x: -100, y: 0 }],
        ["right", { x: 100, y: 0 }],
        ["top-left", { x: -100, y: -50 }],
        ["top-right", { x: 100, y: -50 }],
        ["bottom-left", { x: -100, y: 50 }],
        ["bottom-right", { x: 100, y: 50 }],
      ];

      alignments.forEach(([alignment, expectedOffset]) => {
        const testContainer = { ...container, alignment: alignment as any };
        const result = mapImageIntoContainer(
          mockAsset,
          testContainer,
          mockAnchor,
        );
        expect(result.offset).toEqual(expectedOffset);
      });
    });

    it("should return zero dimensions for invalid asset dimensions", () => {
      const invalidAsset: AssetMeta = {
        src: "/test.png",
        width: NaN,
        height: 100,
      };

      const container: ContainerSpec = {
        width: 100,
        height: 100,
        fitMode: "contain",
        alignment: "center",
      };

      const result = mapImageIntoContainer(invalidAsset, container, mockAnchor);

      expect(result.displayWidth).toBe(0);
      expect(result.displayHeight).toBe(0);
      expect(result.offset).toEqual({ x: 0, y: 0 });
    });

    it("should return zero dimensions for invalid container dimensions", () => {
      const container: ContainerSpec = {
        width: 0,
        height: 100,
        fitMode: "contain",
        alignment: "center",
      };

      const result = mapImageIntoContainer(mockAsset, container, mockAnchor);

      expect(result.displayWidth).toBe(0);
      expect(result.displayHeight).toBe(0);
    });

    it("should handle container with only width defined", () => {
      const container: ContainerSpec = {
        width: 100,
        height: undefined as any,
        fitMode: "contain",
        alignment: "center",
      };

      const result = mapImageIntoContainer(mockAsset, container, mockAnchor);

      expect(result.displayWidth).toBe(0);
      expect(result.displayHeight).toBe(0);
    });

    it("should handle negative asset dimensions gracefully", () => {
      const negativeAsset: AssetMeta = {
        src: "/test.png",
        width: -100,
        height: 50,
      };

      const container: ContainerSpec = {
        width: 100,
        height: 100,
        fitMode: "contain",
        alignment: "center",
      };

      const result = mapImageIntoContainer(
        negativeAsset,
        container,
        mockAnchor,
      );

      expect(result.displayWidth).toBe(0);
      expect(result.displayHeight).toBe(0);
    });

    it("should handle perfect square asset and container", () => {
      const squareAsset: AssetMeta = {
        src: "/square.png",
        width: 100,
        height: 100,
      };

      const squareContainer: ContainerSpec = {
        width: 200,
        height: 200,
        fitMode: "contain",
        alignment: "center",
      };

      const result = mapImageIntoContainer(
        squareAsset,
        squareContainer,
        mockAnchor,
      );

      // Both scale factors are 2, so contain and cover should be the same
      expect(result.displayWidth).toBe(200);
      expect(result.displayHeight).toBe(200);
    });
  });
});

import { describe, expect, it } from "vitest";

import type { EnhancedLayerData } from "../LayerCorePipeline";
import { createOrbitalProcessor } from "../LayerCorePipelineOrbital";
import type { LayerCalculationPoints, Point2D, PercentPoint } from "../LayerCore";

function bundle(point: Point2D, percent: PercentPoint = { x: 0, y: 0 }) {
  return { point, percent };
}

function makeLayer(): EnhancedLayerData {
  const stageCenter = { x: 1024, y: 1024 };
  const calc: LayerCalculationPoints = {
    stageCenter: bundle(stageCenter, { x: 50, y: 50 }),
    imageCenter: {
      image: bundle({ x: 50, y: 50 }),
      stage: bundle(stageCenter, { x: 50, y: 50 }),
    },
    imageTip: {
      image: bundle({ x: 50, y: 0 }),
      stage: bundle(stageCenter, { x: 50, y: 0 }),
    },
    imageBase: {
      image: bundle({ x: 50, y: 100 }),
      stage: bundle(stageCenter, { x: 50, y: 100 }),
    },
    spinPoint: {
      image: bundle({ x: 50, y: 50 }),
      stage: bundle(stageCenter, { x: 50, y: 50 }),
    },
    orbitPoint: {
      image: bundle({ x: 50, y: 50 }),
      stage: bundle(stageCenter, { x: 50, y: 50 }),
      stageAnchor: bundle(stageCenter, { x: 50, y: 50 }),
    },
    orbitLine: bundle(stageCenter, { x: 50, y: 50 }),
  };

  return {
    layerId: "test",
    imageId: "test",
    imageUrl: "",
    imagePath: "",
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    imageMapping: {
      imageCenter: { x: 50, y: 50 },
      imageTip: { x: 50, y: 0 },
      imageBase: { x: 50, y: 100 },
      imageDimensions: { width: 100, height: 100 },
      displayAxisAngle: 0,
      displayRotation: 0,
      axisCenterOffset: { x: 0, y: 0 },
    },
    imageTip: 90,
    imageBase: 270,
    calculation: calc,
    rotation: 0,
    orbitStagePoint: { x: 1024, y: 1024 },
    orbitLinePoint: { x: 1324, y: 1024 },
    orbitLineVisible: true,
    orbitRadius: 300,
    orbitImagePercent: { x: 50, y: 50 },
    orbitImagePoint: { x: 50, y: 50 },
  };
}

describe("createOrbitalProcessor", () => {
  it("returns unchanged layer when orbit is inactive", () => {
    const processor = createOrbitalProcessor({ orbitSpeed: 0 });
    const layer = makeLayer();
    layer.position = { x: 200, y: 200 };
    layer.rotation = 45;

    const enhanced = processor(layer, 0);

    expect(enhanced.position).toEqual(layer.position);
    expect(enhanced.rotation).toEqual(45);
    expect(enhanced.hasOrbitalAnimation).toBeFalsy();
  });

  it("applies orbital motion when active", () => {
    const processor = createOrbitalProcessor({ orbitSpeed: 10 });
    const enhanced = processor(makeLayer(), 1000);

    expect(enhanced.hasOrbitalAnimation).toBe(true);
    expect(enhanced.orbitRadius).toBeCloseTo(300);
    expect(enhanced.orbitLineStyle?.visible).toBe(true);
  });

  it("honors orientation when enabled", () => {
    const processor = createOrbitalProcessor({ orbitSpeed: 5, orbitOrient: true });
    const baseAngleLayer = makeLayer();
    baseAngleLayer.rotation = 15;
    const enhanced = processor(baseAngleLayer, 1000);

    expect(enhanced.hasOrbitalAnimation).toBe(true);
    expect(enhanced.currentRotation).toBeDefined();
  });
});


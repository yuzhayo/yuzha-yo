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
  it("positions image on derived orbit using layer metadata", () => {
    const processor = createOrbitalProcessor({});
    const enhanced = processor(makeLayer(), 0);

    expect(enhanced.orbitStagePoint).toEqual({ x: 1024, y: 1024 });
    expect(enhanced.orbitPoint?.x).toBeCloseTo(1324);
    expect(enhanced.orbitPoint?.y).toBeCloseTo(1024);
    expect(enhanced.position.x).toBeCloseTo(1324);
    expect(enhanced.position.y).toBeCloseTo(1024);
    expect(enhanced.orbitRadius).toBeCloseTo(300);
    expect(enhanced.orbitLineStyle?.visible).toBe(true);
    expect(enhanced.currentRotation ?? 0).toBeCloseTo(0);
  });

  it("respects overrides from config", () => {
    const processor = createOrbitalProcessor({
      orbitStagePoint: [900, 900],
      orbitLinePoint: [1100, 900],
      orbitLine: true,
      orbitImagePoint: [0, 50],
      orbitDirection: "ccw",
      orbitSpeed: 0,
      orbitOrient: true,
    });

    const enhanced = processor(makeLayer(), 0);

    expect(enhanced.orbitStagePoint).toEqual({ x: 900, y: 900 });
    expect(enhanced.orbitRadius).toBeCloseTo(200);
    expect(enhanced.orbitLineStyle?.visible).toBe(true);
    expect(enhanced.position.x).toBeCloseTo(1150);
    expect(enhanced.position.y).toBeCloseTo(900);
    expect(enhanced.currentRotation ?? 0).toBeCloseTo(0);

    const baseAngleLayer = makeLayer();
    baseAngleLayer.rotation = 15;
    const enhancedWithBase = processor(baseAngleLayer, 0);
    expect(enhanced.currentRotation ?? 0).toBeCloseTo(0);
  });
});

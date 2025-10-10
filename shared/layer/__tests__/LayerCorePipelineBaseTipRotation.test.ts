import { describe, expect, it } from "vitest";

import type { EnhancedLayerData } from "../LayerCorePipeline";
import { createBaseTipRotationProcessor } from "../LayerCorePipelineBaseTipRotation";
import type { LayerCalculationPoints, Point2D } from "../LayerCore";

const zeroPoint = Object.freeze({ x: 0, y: 0 });
const zeroPercent = Object.freeze({ x: 0, y: 0 });

function makeCalculationPoints(): LayerCalculationPoints {
  const coordinate = { point: { ...zeroPoint }, percent: { ...zeroPercent } };
  return {
    stageCenter: { ...coordinate },
    imageCenter: { image: { ...coordinate }, stage: { ...coordinate } },
    imageTip: { image: { ...coordinate }, stage: { ...coordinate } },
    imageBase: { image: { ...coordinate }, stage: { ...coordinate } },
    spinPoint: { image: { ...coordinate }, stage: { ...coordinate } },
    orbitPoint: {
      image: { ...coordinate },
      stage: { ...coordinate },
      stageAnchor: { ...coordinate },
    },
  };
}

interface LayerOverrides {
  axisAngle?: number;
  orbitPoint?: Point2D;
  orbitCenter?: Point2D;
  orbitRadius?: number;
  hasOrbitalAnimation?: boolean;
  spinSpeed?: number;
}

function makeLayer(overrides: LayerOverrides = {}): EnhancedLayerData {
  const {
    axisAngle = 90,
    orbitPoint = { x: 0, y: -100 },
    orbitCenter = { x: 0, y: 0 },
    orbitRadius = 100,
    hasOrbitalAnimation = true,
    spinSpeed,
  } = overrides;

  return {
    layerId: "test-layer",
    imageId: "test-image",
    imageUrl: "",
    imagePath: "",
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    imageMapping: {
      imageCenter: { x: 0, y: 0 },
      imageTip: { x: 0, y: 0 },
      imageBase: { x: 0, y: 0 },
      imageDimensions: { width: 100, height: 100 },
      displayAxisAngle: axisAngle,
      displayRotation: 0,
      axisCenterOffset: { x: 0, y: 0 },
    },
    imageTip: 90,
    imageBase: 270,
    calculation: makeCalculationPoints(),
    hasOrbitalAnimation,
    orbitRadius,
    orbitPoint,
    orbitCenter,
    spinSpeed,
  };
}

describe("createBaseTipRotationProcessor", () => {
  const processor = createBaseTipRotationProcessor();

  it("keeps tip aligned when axis already matches radius", () => {
    const result = processor(
      makeLayer({
        axisAngle: 90,
        orbitPoint: { x: 0, y: -150 }, // directly above centre
      }),
    );

    expect(result.baseTipRotation).toBeCloseTo(0);
    expect(result.rotation).toBeCloseTo(0);
  });

  it("rotates image so tip points to orbit radius", () => {
    const result = processor(
      makeLayer({
        axisAngle: 0, // image pointing right by default
        orbitPoint: { x: 0, y: -150 }, // position above centre (north)
      }),
    );

    expect(result.baseTipRotation).toBeCloseTo(270);
    expect(result.rotation).toBeCloseTo(270);
  });

  it("returns original layer when spin is active", () => {
    const layer = makeLayer({ spinSpeed: 30 });
    const result = processor(layer);

    expect(result).toBe(layer);
  });

  it("skips rotation when orbital metadata missing", () => {
    const result = processor(
      makeLayer({
        hasOrbitalAnimation: false,
      }),
    );

    expect(result.baseTipRotation).toBeUndefined();
    expect(result.rotation).toBeUndefined();
  });
});

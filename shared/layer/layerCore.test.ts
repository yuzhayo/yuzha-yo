import { describe, it, expect } from "vitest";

import { prepareSpinState, prepareOrbitState, type BaseLayerState } from "./layerCore";
import {
  createCoordinateBundle,
  createDualSpaceCoordinate,
  type Point2D,
  type PercentPoint,
} from "./layerBasic";
import type { LayerConfigEntry } from "../config/Config";

function makeBaseState(overrides?: {
  position?: Point2D;
  scale?: Point2D;
  imageCenterStagePoint?: Point2D;
  imageCenterStagePercent?: PercentPoint;
  stageSize?: number;
}): BaseLayerState {
  const stageSize = overrides?.stageSize ?? 2048;
  const position = overrides?.position ?? { x: 400, y: 600 };
  const scale = overrides?.scale ?? { x: 1, y: 1 };

  const stageCenterPoint: Point2D = { x: stageSize / 2, y: stageSize / 2 };
  const stageCenterPercent: PercentPoint = { x: 50, y: 50 };

  const imageCenterStage = overrides?.imageCenterStagePoint ?? position;
  const imageCenterStagePercent = overrides?.imageCenterStagePercent ?? { x: 50, y: 50 };

  return {
    baseData: {
      LayerID: "test-layer",
      ImageID: "test-image",
      imageUrl: "mock://image.png",
      imagePath: "mock/path/image.png",
      position,
      scale,
      imageMapping: {
        imageCenter: { x: 50, y: 50 },
        imageDimensions: { width: 100, height: 100 },
      },
      rotation: 0,
      orbitOrient: false,
    },
    stageSize,
    stageCenter: createCoordinateBundle(stageCenterPoint, stageCenterPercent),
    imageCenter: createDualSpaceCoordinate(
      { x: 50, y: 50 },
      { x: 50, y: 50 },
      imageCenterStage,
      imageCenterStagePercent,
    ),
  };
}

describe("prepareSpinState", () => {
  it("returns disabled state when no spin config supplied", () => {
    const baseState = makeBaseState();
    const emptyConfig = {} as LayerConfigEntry;

    const spinState = prepareSpinState(baseState, emptyConfig);

    expect(spinState.hasSpin).toBe(false);
    expect(spinState.spinStagePoint).toEqual({ x: 0, y: 0 });
    expect(spinState.spinImagePercent).toEqual({ x: 0, y: 0 });
  });

  it("normalises stage/image spin inputs relative to base state", () => {
    const baseState = makeBaseState();
    const config = {
      spinStagePoint: [800, 900],
      spinImagePoint: [25, 75],
    } as LayerConfigEntry;

    const spinState = prepareSpinState(baseState, config);

    expect(spinState.hasSpin).toBe(true);
    expect(spinState.spinStagePoint).toEqual({ x: 800, y: 900 });
    expect(spinState.spinImagePercent).toEqual({ x: 25, y: 75 });
    expect(spinState.calculation.spinPoint.stage.point).toEqual({
      x: 800,
      y: 900,
    });
    expect(spinState.calculation.spinPoint.image.percent).toEqual({
      x: 25,
      y: 75,
    });
  });
});

describe("prepareOrbitState", () => {
  it("returns disabled state when no orbit config supplied", () => {
    const baseState = makeBaseState();
    const emptyConfig = {} as LayerConfigEntry;

    const orbitState = prepareOrbitState(baseState, emptyConfig);

    expect(orbitState.hasOrbit).toBe(false);
    expect(orbitState.orbitRadius).toBe(0);
    expect(orbitState.orbitLineVisible).toBe(false);
  });

  it("derives orbit radius and anchor data from config", () => {
    const baseState = makeBaseState();
    const config = {
      orbitStagePoint: [600, 600],
      orbitLinePoint: [700, 600],
      orbitImagePoint: [60, 40],
      orbitLine: true,
      orbitSpeed: 15,
      orbitDirection: "cw",
    } as LayerConfigEntry;

    const orbitState = prepareOrbitState(baseState, config);

    expect(orbitState.hasOrbit).toBe(true);
    expect(orbitState.orbitStagePoint).toEqual({ x: 600, y: 600 });
    expect(orbitState.orbitLinePoint).toEqual({ x: 700, y: 600 });
    expect(orbitState.orbitRadius).toBeCloseTo(100);
    expect(orbitState.orbitLineVisible).toBe(true);
    expect(orbitState.orbitImagePercent).toEqual({ x: 60, y: 40 });
    expect(orbitState.calculation.orbitLine.percent).toEqual({ x: 34.1796875, y: 29.296875 });
  });
});

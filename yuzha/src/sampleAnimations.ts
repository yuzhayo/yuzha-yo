import type { StageObject } from "@shared/stages/StagesTypes";

// Sample stage objects for demonstration
export const sampleObjects: StageObject[] = [
  {
    id: "spinning-square",
    position: [200, 200, 0],
    rotation: 0,
    scale: 1,
    visible: true,
    metadata: {
      type: "rectangle",
      width: 100,
      height: 100,
      color: 0x3b82f6, // Blue
    },
  },
  {
    id: "pulsing-circle",
    position: [-200, -100, 0],
    rotation: 0,
    scale: 1,
    visible: true,
    metadata: {
      type: "circle",
      radius: 60,
      color: 0x10b981, // Green
    },
  },
  {
    id: "orbiting-star",
    position: [0, -200, 0],
    rotation: 0,
    scale: 0.8,
    visible: true,
    metadata: {
      type: "sprite",
      width: 80,
      height: 80,
      color: 0xf59e0b, // Yellow
    },
  },
];

// Animation configurations using the Layer system format
export const layerConfigs = {
  spinningLogo: {
    stage: { width: 2048, height: 2048 },
    layers: [
      {
        layerId: "logo",
        position: { x: 0, y: 0 },
        scale: 1.0,
        behaviors: {
          spin: {
            enabled: true,
            rpm: 20,
            direction: "cw" as const,
          },
        },
      },
    ],
  },
  pulsatingElements: {
    stage: { width: 2048, height: 2048 },
    layers: [
      {
        layerId: "pulse1",
        position: { x: -300, y: -200 },
        scale: 1.0,
        behaviors: {
          pulse: {
            enabled: true,
            amplitude: 0.3,
            rpm: 30,
          },
        },
      },
      {
        layerId: "pulse2",
        position: { x: 300, y: 200 },
        scale: 1.2,
        behaviors: {
          pulse: {
            enabled: true,
            amplitude: 0.5,
            rpm: 15,
          },
        },
      },
    ],
  },
  orbitingSystem: {
    stage: { width: 2048, height: 2048 },
    layers: [
      {
        layerId: "center",
        position: { x: 0, y: 0 },
        scale: 1.5,
      },
      {
        layerId: "orbit1",
        position: { x: 0, y: 0 },
        scale: 0.8,
        behaviors: {
          orbit: {
            enabled: true,
            rpm: 10,
            radius: 200,
            center: { x: 0, y: 0 },
          },
        },
      },
      {
        layerId: "orbit2",
        position: { x: 0, y: 0 },
        scale: 0.6,
        behaviors: {
          orbit: {
            enabled: true,
            rpm: -15,
            radius: 350,
            center: { x: 0, y: 0 },
          },
        },
      },
    ],
  },
};

// Animation presets for UI controls
export const animationPresets = [
  {
    name: "Static",
    description: "No animations",
    objects: sampleObjects.map((obj) => ({ ...obj, metadata: { ...obj.metadata } })),
  },
  {
    name: "Spin",
    description: "Rotating elements",
    objects: sampleObjects.map((obj) => ({ ...obj, metadata: { ...obj.metadata } })),
  },
  {
    name: "Pulse",
    description: "Breathing effect",
    objects: sampleObjects.map((obj) => ({ ...obj, metadata: { ...obj.metadata } })),
  },
  {
    name: "Orbit",
    description: "Circular motion",
    objects: sampleObjects.map((obj) => ({ ...obj, metadata: { ...obj.metadata } })),
  },
];

export default {
  sampleObjects,
  layerConfigs,
  animationPresets,
};

// IMPORT SECTION
import type { LibraryConfig } from '@shared/layer/LayerTypes';

// STATE SECTION
const ASSET_BASE_PATH = '/shared/Asset';

const imageRegistry = {
  // Sample and basic assets
  SAMPLE: `${ASSET_BASE_PATH}/SAMPLE.png`,
  
  // Clock icons for time-based animations
  NOON: `${ASSET_BASE_PATH}/UI_ClockIcon_Noon.png`,
  DAWN: `${ASSET_BASE_PATH}/UI_ClockIcon_Morning.png`,
  DUSK: `${ASSET_BASE_PATH}/UI_ClockIcon_Dusk.png`,
  NIGHT: `${ASSET_BASE_PATH}/UI_ClockIcon_Night.png`,
  
  // Star backgrounds for cosmic scene
  STARBGHOLE: `${ASSET_BASE_PATH}/STARBGHOLE1.png`,
  STARBG: `${ASSET_BASE_PATH}/STARBG.png`,
  STAR1: `${ASSET_BASE_PATH}/Enviro_Stars.png`,
  STAR2: `${ASSET_BASE_PATH}/Enviro_Stars_Big.png`,
  
  // Gears for mechanical animations
  GEAR1: `${ASSET_BASE_PATH}/GEAR1.png`,
  GEAR2: `${ASSET_BASE_PATH}/GEAR2.png`,
  GEAR3: `${ASSET_BASE_PATH}/GEAR3.png`,
  GEARMOON: `${ASSET_BASE_PATH}/GEARMOON.png`,
  
  // Clock components
  CLOCKGLOW: `${ASSET_BASE_PATH}/CLOCKGLOW.png`,
  CLOCKGLOW1: `${ASSET_BASE_PATH}/CLOCKGLOW1.png`,
  CLOCKGLOW2: `${ASSET_BASE_PATH}/CLOCKGLOW2.png`,
  CLOCKBG: `${ASSET_BASE_PATH}/CLOCKBG.png`,
  HAND1: `${ASSET_BASE_PATH}/UI_Clock_HourHand.png`,
  HAND2: `${ASSET_BASE_PATH}/UI_Clock_MinuteHand.png`,
  
  // Additional elements
  BUBBLE: `${ASSET_BASE_PATH}/BUBBLE.png`,
  DESK: `${ASSET_BASE_PATH}/AchieveMedal_Desk_Short02.png`,
  SYSHEAD: `${ASSET_BASE_PATH}/SystemMessageBg.png`,
  LOCK: `${ASSET_BASE_PATH}/V3_LockIcon.png`,
};

// LOGIC SECTION
const createStarSystemConfig = (): LibraryConfig => ({
  stage: { 
    width: 2048, 
    height: 2048, 
    origin: 'center' 
  },
  layers: [
    // Background star field
    {
      layerId: 'star-bg',
      imagePath: imageRegistry.STARBG,
      position: { x: 0, y: 0 },
      scale: 0.8,
      behaviors: {
        spin: { enabled: true, rpm: 0.2, direction: 'cw' }
      }
    },
    // Starfield hole effect
    {
      layerId: 'star-hole',
      imagePath: imageRegistry.STARBGHOLE,
      position: { x: 0, y: 0 },
      scale: 0.7,
      behaviors: {
        spin: { enabled: true, rpm: 0.3, direction: 'ccw' }
      }
    },
    // Large gear system
    {
      layerId: 'gear-large',
      imagePath: imageRegistry.GEAR1,
      position: { x: -400, y: 300 },
      scale: 1.2,
      behaviors: {
        spin: { enabled: true, rpm: 5, direction: 'cw' }
      }
    },
    {
      layerId: 'gear-medium',
      imagePath: imageRegistry.GEAR2,
      position: { x: 200, y: -250 },
      scale: 0.9,
      behaviors: {
        spin: { enabled: true, rpm: 8, direction: 'ccw' }
      }
    },
    {
      layerId: 'gear-small',
      imagePath: imageRegistry.GEAR3,
      position: { x: 350, y: 200 },
      scale: 0.6,
      behaviors: {
        spin: { enabled: true, rpm: 12, direction: 'cw' }
      }
    },
    // Central moon gear with complex motion
    {
      layerId: 'gear-moon',
      imagePath: imageRegistry.GEARMOON,
      position: { x: 0, y: 0 },
      scale: 1.0,
      behaviors: {
        spin: { enabled: true, rpm: 6, direction: 'cw' },
        pulse: { enabled: true, amplitude: 0.1, rpm: 15 }
      }
    },
    // Orbiting elements
    {
      layerId: 'orbit-star1',
      imagePath: imageRegistry.STAR1,
      position: { x: 0, y: -300 },
      scale: 0.4,
      behaviors: {
        orbit: { enabled: true, rpm: 3, radius: 300, center: { x: 0, y: 0 } },
        spin: { enabled: true, rpm: 20, direction: 'cw' }
      }
    },
    {
      layerId: 'orbit-star2',
      imagePath: imageRegistry.STAR2,
      position: { x: 0, y: -500 },
      scale: 0.5,
      behaviors: {
        orbit: { enabled: true, rpm: 2, radius: 500, center: { x: 0, y: 0 } },
        spin: { enabled: true, rpm: 15, direction: 'ccw' }
      }
    },
    // Clock system
    {
      layerId: 'clock-bg',
      imagePath: imageRegistry.CLOCKBG,
      position: { x: -600, y: -400 },
      scale: 0.5,
    },
    {
      layerId: 'clock-glow',
      imagePath: imageRegistry.CLOCKGLOW,
      position: { x: -600, y: -400 },
      scale: 0.5,
      behaviors: {
        pulse: { enabled: true, amplitude: 0.15, rpm: 8 }
      }
    },
    // Floating elements with fading
    {
      layerId: 'bubble-float',
      imagePath: imageRegistry.BUBBLE,
      position: { x: 500, y: -500 },
      scale: 0.7,
      behaviors: {
        fade: { enabled: true, from: 0.3, to: 1.0, rpm: 5 },
        pulse: { enabled: true, amplitude: 0.2, rpm: 10 }
      }
    }
  ]
});

const createMinimalConfig = (): LibraryConfig => ({
  stage: { 
    width: 2048, 
    height: 2048, 
    origin: 'center' 
  },
  layers: [
    {
      layerId: 'center-sample',
      imagePath: imageRegistry.SAMPLE,
      position: { x: 0, y: 0 },
      scale: 2.0,
      behaviors: {
        spin: { enabled: true, rpm: 10, direction: 'cw' },
        pulse: { enabled: true, amplitude: 0.2, rpm: 5 }
      }
    }
  ]
});

// CONFIG SECTION (unused)

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export const mainScreenConfigs = {
  starSystem: createStarSystemConfig(),
  minimal: createMinimalConfig(),
};

export const configPresets = [
  {
    name: 'Star System',
    description: 'Complex cosmic animation with gears and orbiting elements',
    config: mainScreenConfigs.starSystem,
  },
  {
    name: 'Minimal',
    description: 'Simple spinning sample element',
    config: mainScreenConfigs.minimal,
  },
];

export default mainScreenConfigs;
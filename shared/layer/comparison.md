Layer Logic Library - Workflow Summary and Function Code
Overall Architecture & Data Flow
text

JSON Config → Registry Lookup → Processing Pipeline → Renderer Data

Pipeline Options:
├── Basic: JSON → BaseLayer[]
├── Transform: JSON → BaseLayer[] → TransformedLayer[]  
├── Spin: JSON → BaseLayer[] → TransformedLayer[] → SpunLayer[]
└── Full: JSON → BaseLayer[] → TransformedLayer[] → SpunLayer[] → OrbitedLayer[]
File Structure & Purpose
1. Type Definitions (TypeDefinitions.ts)
TypeScript

// Core interfaces for data flow between pipeline stages
- RawLayerConfig (JSON input)
- BaseLayer (after basic processing)
- TransformedLayer (after static transforms)
- SpunLayer (after spin logic)
- OrbitedLayer (final output)
- UI config types and validation schemas
2. Layer Registry (LayerRegistry.ts)
TypeScript

// Maps layerId to default configurations
DEFAULT_LAYER_REGISTRY = {
  'header': { type: 'image', defaultConfig: {...} },
  'button': { type: 'component', defaultConfig: {...} },
  'spinner': { type: 'image', defaultConfig: { spin: {...} } }
}

Key Functions:
- validateLayerId() - Check if ID exists in registry
- mergeLayerConfig() - Combine user JSON with registry defaults
- resolveLayerSource() - Get imagePath or registry reference
3. Basic Layer Processing (LayerLogicBasic.ts)
TypeScript

// Core pipeline: JSON → validated layers → sorted by zHint
processBasicLayer(rawConfigs, registry, stageDimensions) → BaseLayer[]

Workflow:
1. Validate JSON structure and layer IDs
2. Merge with registry defaults
3. Resolve image sources
4. Determine layer dimensions (explicit or intrinsic)
5. Calculate initial stage positioning
6. Sort by zHint (lower = background)
4. Image Mapping (ImageMapping.ts)
TypeScript

// Calculate image dimensions and properties
getImageInfo(source) → { width, height, centerX, centerY }

Functions:
- getMockImageInfo() - Pattern-based dimension lookup
- calculateFitDimensions() - Scale content with contain/cover/fill/stretch
- getImageAspectRatio() - Calculate width/height ratio
5. Screen Mapping (ScreenMapping.ts)
TypeScript

// Position layer bounding boxes on 2048x2048 stage
calculateLayerPlacementOnStage(baseLayer, stageDimensions) → StagePlacementData

Workflow:
1. Start with centered placement as default
2. Apply type-based positioning (header→top, footer→bottom)
3. Apply ID-based positioning (logo→top-left)
4. Enforce stage boundary constraints
6. Content Mapping (ContentMapper.ts)
TypeScript

// Position and scale content within layer bounds
mapContentToLayer(baseLayer, contentConfig) → LayerContentMapped

Functions:
- calculateContentMapping() - Position content in layer space
- getDefaultScaleMode() - Auto-select contain/cover/fill based on layer type
- calculateAlignedContentPosition() - Apply alignment rules
7. Transform Logic (LayerLogicTransform.ts)
TypeScript

// Apply static transformations from JSON
applyStaticTransforms(baseLayers, rawConfigs) → TransformedLayer[]

Transformation Order:
1. Screen placement (ScreenMapping)
2. Content mapping (ContentMapper)  
3. Apply JSON scale factors
4. Apply JSON rotations (angle, tilt)
5. Apply JSON position offsets
8. Spin Logic (LayerLogicSpin.ts)
TypeScript

// Convert RPM to dynamic rotation data
applySpinLogic(transformedLayers, rawConfigs) → SpunLayer[]

Functions:
- calculateSpinVelocity() - RPM → radians/second + direction
- convertUIRangeToRPM() - UI slider (0-999) → RPM value
- validateSpinConfig() - Check speed/direction parameters
- calculateCurrentSpinAngle() - Get angle at specific time
9. Orbit Logic (LayerLogicOrbit.ts)
TypeScript

// Convert orbit parameters to dynamic positioning data
applyOrbitLogic(spunLayers, rawConfigs) → OrbitedLayer[]

Functions:
- calculateOrbitVelocity() - RPM → radians/second
- determineOrbitCenter() - Use explicit center or layer position
- calculateCurrentOrbitPosition() - Get x,y,z at specific time
- checkOrbitCollision() - Detect potential layer overlaps
10. Config Converter (ConfigConverter.ts)
TypeScript

// Bidirectional JSON ↔ UI conversion
convertJsonToUi(rawConfig) → UiLayerConfig (user-friendly)
convertUiToJson(uiConfig) → RawLayerConfig (library format)

Conversions:
- RPM values ↔ 0-999 slider ranges
- Pixel positions ↔ percentage offsets
- Scale factors ↔ percentage values (100% = 1.0x)
- Enable/disable toggles for animations
11. Config Schema (ConfigSchema.ts)
TypeScript

// UI control definitions and validation rules
UI_CONTROL_DEFINITIONS = {
  spinSpeedUI: { type: 'range', min: 0, max: 999, label: 'Spin Speed' },
  angleDegrees: { type: 'range', min: 0, max: 360, label: 'Rotation' }
}

Functions:
- validateCompleteUiConfig() - Check all UI values
- createValidationSchema() - Generate validation functions
- getControlsByCategory() - Group controls for UI sections
12. Main Entry Point (index.ts)
TypeScript

// Pipeline composers and convenience functions
createBasicPipeline() → (JSON) → BaseLayer[]
createTransformPipeline() → (JSON) → TransformedLayer[]  
createSpinPipeline() → (JSON) → SpunLayer[]
createFullPipeline() → (JSON) → OrbitedLayer[]

// Convenience function
processLayerConfiguration(rawConfigs, options) → processed layers
Key Workflow Functions
Basic Processing Chain
TypeScript

// 1. Validate and process JSON
validateAllLayerConfigs(rawConfigs) → boolean
processBasicLayer(rawConfigs, registry) → BaseLayer[]

// 2. Apply transformations  
applyStaticTransforms(baseLayers, rawConfigs) → TransformedLayer[]

// 3. Add animations
applySpinLogic(transformedLayers, rawConfigs) → SpunLayer[]
applyOrbitLogic(spunLayers, rawConfigs) → OrbitedLayer[]
Configuration Management
TypeScript

// Convert for UI editing
convertJsonToUi(rawConfig) → UiLayerConfig
// Convert back to library format
convertUiToJson(uiConfig) → RawLayerConfig

// Validation
validateLayerConfiguration(rawConfigs) → { isValid, errors, warnings }
Utility Functions
TypeScript

// Statistics and debugging
getLayerStats(layers) → { totalLayers, layerTypes, zHintRange }
getSpinStats(spunLayers) → { spinningLayers, averageSpeed, directions }
getOrbitStats(orbitedLayers) → { orbitingLayers, speedRange, radiusRange }

// Animation calculations  
calculateCurrentSpinAngle(layer, timeSeconds) → angle
calculateCurrentOrbitPosition(layer, timeSeconds) → { x, y, z }
Main Usage Patterns
1. Basic Usage (Static Layers Only)
TypeScript

import { createBasicPipeline } from 'shared';
const pipeline = createBasicPipeline();
const layers = pipeline(jsonConfig);
// Send layers to renderer
2. Full Pipeline (All Features)
TypeScript

import { createFullPipeline } from 'shared';
const pipeline = createFullPipeline();
const layers = pipeline(jsonConfig);
// layers include static transforms + spin + orbit data
3. Custom Pipeline
TypeScript

import { processBasicLayer, applyStaticTransforms, applySpinLogic } from 'shared';
const basic = processBasicLayer(jsonConfig, registry);
const transformed = applyStaticTransforms(basic, jsonConfig);  
const spinning = applySpinLogic(transformed, jsonConfig);
// Skip orbit logic, go directly to renderer
4. UI Configuration
TypeScript

import { convertJsonToUi, convertUiToJson } from 'shared';
// For UI editing
const uiConfig = convertJsonToUi(rawJson);
// After user edits
const newJson = convertUiToJson(editedUiConfig);
Data Structure Evolution
TypeScript

JSON Input (RawLayerConfig)
  ↓ LayerLogicBasic
BaseLayer (id, source, dimensions, position)
  ↓ LayerLogicTransform  
TransformedLayer (+ scale, rotation, position offsets)
  ↓ LayerLogicSpin
SpunLayer (+ spinVelocityRadPerSec, spinDirection)
  ↓ LayerLogicOrbit
OrbitedLayer (+ orbitConfig with center, radius, speed)
  ↓ To Renderer
Each stage adds more data while preserving previous stage information, enabling the composable pipeline architecture where any stage can be the final output for the renderer.
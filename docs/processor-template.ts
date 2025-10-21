Perfect! Now let me create one more file - a **template** for adding new processors that follows your architecture:
Action: file_editor create /app/docs/processor-template.ts --file-text "/**
 * ============================================================================
 * LAYER [FEATURE_NAME] - [Feature Description]
 * ============================================================================
 *
 * This module provides [feature description] functionality for layers.
 *
 * PURPOSE FOR FUTURE AI AGENTS:
 * ------------------------------
 * This handles [FEATURE_NAME] - [brief description of what this does].
 * Use this when you need layers to [use case examples].
 *
 * RESPONSIBILITIES:
 * -----------------
 * 1. [Feature] Configuration
 *    - [configProperty1]: [description]
 *    - [configProperty2]: [description]
 *
 * 2. [Feature] Processor
 *    - create[Feature]Processor: Creates processor that adds [feature] behavior
 *    - Calculates [what it calculates] based on [input]
 *    - Maintains [what state/consistency it maintains]
 *
 * 3. [Specific Calculations]
 *    - [Calculation 1]: [description]
 *    - [Calculation 2]: [description]
 *
 * HOW IT WORKS:
 * -------------
 * 1. Configuration specifies [parameters]
 * 2. Base [data] calculated in layerCore from [config properties]
 * 3. Processor calculates [output] from [input]
 * 4. [Additional steps]
 * 5. Renderer applies [final transformation]
 *
 * COORDINATE SYSTEMS (if applicable):
 * -------------------
 * - [property1]: [description of coordinate space]
 * - [property2]: [description of coordinate space]
 *
 * USED BY:
 * --------
 * - layer.ts (registers [feature] processor)
 * - StageCanvas/StageThree (renders [feature] layers)
 *
 * @module layer/layer[FeatureName]
 */

import type { UniversalLayerData } from \"./layerCore\";
import type { EnhancedLayerData, LayerProcessor } from \"./layer\";

/**
 * [Feature] configuration
 * 
 * Define all config properties that users can set in ConfigYuzha.json
 * for this feature.
 */
export type FeatureConfig = {
  /** [Description of config property 1] */
  featureProperty1?: number;
  
  /** [Description of config property 2] */
  featureProperty2?: string;
  
  /** [Description of config property 3] */
  featureProperty3?: boolean;
};

/**
 * Create a [feature] processor with the given configuration
 *
 * This processor handles [behavior description].
 *
 * ALGORITHM:
 * 1. [Step 1]
 * 2. [Step 2]
 * 3. [Step 3]
 *
 * @param config - [Feature] configuration from ConfigYuzha.json
 * @returns LayerProcessor that adds [feature] animation/behavior
 *
 * @example
 * const processor = createFeatureProcessor({
 *   featureProperty1: 10,
 *   featureProperty2: \"value\"
 * });
 */
export function createFeatureProcessor(config: FeatureConfig): LayerProcessor {
  // Extract config values with defaults
  const property1 = config.featureProperty1 ?? 0;
  const property2 = config.featureProperty2 ?? \"default\";
  const property3 = config.featureProperty3 ?? false;

  // Early return if feature is disabled
  if (property1 === 0 && !property3) {
    return (layer: UniversalLayerData): EnhancedLayerData => layer as EnhancedLayerData;
  }

  // State tracking (if needed)
  let startTime: number | undefined;
  let previousValue: number | undefined;

  // Return the processor function
  return (layer: UniversalLayerData, timestamp?: number): EnhancedLayerData => {
    // Initialize timestamp
    const currentTime = timestamp ?? performance.now();

    // Initialize start time on first call
    if (startTime === undefined) {
      startTime = currentTime;
    }

    // Calculate elapsed time
    const elapsedSeconds = (currentTime - startTime) / 1000;

    // === YOUR CALCULATION LOGIC HERE ===
    
    // Example: Calculate some value based on time
    const calculatedValue = property1 * elapsedSeconds;

    // Example: Calculate position offset
    const offsetX = Math.sin(elapsedSeconds * property1) * 10;
    const offsetY = Math.cos(elapsedSeconds * property1) * 10;

    // Example: Update position
    const newPosition = {
      x: layer.position.x + offsetX,
      y: layer.position.y + offsetY,
    };

    // === END CALCULATION LOGIC ===

    // Return enhanced layer with new properties
    return {
      ...layer,
      position: newPosition, // Override if position changed
      featureValue: calculatedValue, // Add new properties
      hasFeatureAnimation: true, // Flag for renderer
      featureProperty1: property1, // Expose config for debugging
      featureProperty2: property2,
    } as EnhancedLayerData;
  };
}

/**
 * Helper function for [specific calculation]
 *
 * @param input - [Description of input]
 * @returns [Description of output]
 */
function helperCalculation(input: number): number {
  // Implementation here
  return input * 2;
}

/**
 * Validation helper for config values
 *
 * @param value - Value to validate
 * @returns Clamped/validated value
 */
function validateConfigValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value)); // Clamp to 0-100
}

// ============================================================================
// REGISTRATION EXAMPLE (add to layer.ts)
// ============================================================================
/*

import { createFeatureProcessor } from \"./layerFeature\";

registerProcessor({
  name: \"feature\",
  shouldAttach(entry) {
    // Determine when this processor should attach based on config
    return (
      entry.featureProperty1 !== undefined && 
      entry.featureProperty1 > 0
    ) || entry.featureProperty3 === true;
  },
  create(entry) {
    return createFeatureProcessor({
      featureProperty1: entry.featureProperty1,
      featureProperty2: entry.featureProperty2,
      featureProperty3: entry.featureProperty3,
    });
  },
});

*/

// ============================================================================
// TYPE UPDATES NEEDED
// ============================================================================
/*

1. Add to Config.ts LayerConfigEntry type:
   featureProperty1?: number;
   featureProperty2?: string;
   featureProperty3?: boolean;

2. Add to Config.ts ConfigYuzhaEntry groups type:
   \"Feature Config\"?: {
     featureProperty1?: number;
     featureProperty2?: string;
     featureProperty3?: boolean;
   };

3. Add to layer.ts EnhancedLayerData type:
   featureValue?: number;
   hasFeatureAnimation?: boolean;
   featureProperty1?: number;
   featureProperty2?: string;

4. Update transformConfig() in Config.ts if special merge logic needed

*/

// ============================================================================
// CONFIG EXAMPLE (add to ConfigYuzha.json)
// ============================================================================
/*

{
  \"LayerID\": \"feature-example\",
  \"ImageID\": \"SOME_ASSET\",
  \"renderer\": \"2D\",
  \"LayerOrder\": 500,
  \"ImageScale\": [100, 100],
  \"groups\": {
    \"Basic Config\": {
      \"BasicStagePoint\": [1024, 1024],
      \"BasicImagePoint\": [50, 50]
    },
    \"Feature Config\": {
      \"featureProperty1\": 10,
      \"featureProperty2\": \"custom\",
      \"featureProperty3\": true
    }
  }
}

*/
"
Observation: Create successful: /app/docs/processor-template.ts
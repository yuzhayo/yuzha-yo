/**
 * Example usage of the stage2048 module
 * 
 * This file demonstrates various ways to use the stage2048 utilities
 * in your own modules and pipelines.
 */

import {
  STAGE_SIZE,
  computeCoverTransform,
  createStageTransformer,
  applyStagePosition,
  viewportToStageCoords,
  stageToViewportCoords,
  type StageTransform,
} from "./stage2048";

// ============================================
// Example 1: Basic canvas setup
// ============================================

function setupBasicCanvas() {
  const canvas = document.createElement("canvas");
  const container = document.createElement("div");
  
  // Set canvas internal dimensions
  canvas.width = STAGE_SIZE;
  canvas.height = STAGE_SIZE;
  
  // Create transformer (handles all resize logic)
  const cleanup = createStageTransformer(canvas, container);
  
  // Later, when unmounting:
  // cleanup();
  
  return { canvas, container, cleanup };
}

// ============================================
// Example 2: With debounced resize
// ============================================

function setupWithDebounce() {
  const canvas = document.createElement("canvas");
  const container = document.createElement("div");
  
  canvas.width = STAGE_SIZE;
  canvas.height = STAGE_SIZE;
  
  // Debounce resize events by 100ms for better performance
  const cleanup = createStageTransformer(canvas, container, {
    resizeDebounce: 100,
  });
  
  return { canvas, container, cleanup };
}

// ============================================
// Example 3: Manual transform calculation
// ============================================

function manualTransformExample() {
  const transform = computeCoverTransform(1920, 1080);
  
  console.log(transform);
  // {
  //   scale: 0.9375,
  //   offsetX: 0,
  //   offsetY: -480,
  //   width: 1920,
  //   height: 1920
  // }
  
  // You can use this for custom positioning logic
  const myElement = document.createElement("div");
  myElement.style.transform = `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`;
}

// ============================================
// Example 4: Positioning UI in stage coordinates
// ============================================

function positionUIExample() {
  const button = document.createElement("button");
  button.textContent = "Center Button";
  
  // Position at center of stage (1024, 1024)
  applyStagePosition(button, STAGE_SIZE / 2, STAGE_SIZE / 2);
  
  // Button is now at center in stage coordinates
  // The parent container should use the stage transform
}

// ============================================
// Example 5: Coordinate conversion
// ============================================

function coordinateConversionExample() {
  const transform = computeCoverTransform(window.innerWidth, window.innerHeight);
  
  // Convert mouse click to stage coordinates
  function handleClick(event: MouseEvent) {
    const stageCoords = viewportToStageCoords(event.clientX, event.clientY, transform);
    console.log("Clicked at stage position:", stageCoords);
    // { x: 1024, y: 1024 } if clicked at center
  }
  
  // Convert stage position to viewport position
  const centerStage = { x: STAGE_SIZE / 2, y: STAGE_SIZE / 2 };
  const viewportPos = stageToViewportCoords(centerStage.x, centerStage.y, transform);
  console.log("Center of stage in viewport:", viewportPos);
}

// ============================================
// Example 6: React Hook integration
// ============================================

function useStage2048() {
  const canvasRef = { current: null as HTMLCanvasElement | null };
  const containerRef = { current: null as HTMLDivElement | null };
  
  // In a React useEffect:
  function setupEffect() {
    if (!canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    canvas.width = STAGE_SIZE;
    canvas.height = STAGE_SIZE;
    
    const cleanup = createStageTransformer(canvas, container);
    
    return cleanup; // Return cleanup function for React
  }
  
  return setupEffect;
}

// ============================================
// Example 7: Custom pipeline integration
// ============================================

class Stage2048Pipeline {
  private canvas: HTMLCanvasElement;
  private container: HTMLElement;
  private cleanup?: () => void;
  public currentTransform: StageTransform;
  
  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas;
    this.container = container;
    this.currentTransform = computeCoverTransform(window.innerWidth, window.innerHeight);
    
    this.init();
  }
  
  private init() {
    this.canvas.width = STAGE_SIZE;
    this.canvas.height = STAGE_SIZE;
    
    // Store transform updates
    const originalCleanup = createStageTransformer(this.canvas, this.container);
    
    // Wrap cleanup to also update currentTransform
    this.cleanup = () => {
      originalCleanup();
    };
    
    // Update transform on resize
    window.addEventListener("resize", this.updateTransform.bind(this));
  }
  
  private updateTransform() {
    this.currentTransform = computeCoverTransform(window.innerWidth, window.innerHeight);
  }
  
  // Pipeline methods can use this.currentTransform
  public getStageCoords(viewportX: number, viewportY: number) {
    return viewportToStageCoords(viewportX, viewportY, this.currentTransform);
  }
  
  public destroy() {
    this.cleanup?.();
    window.removeEventListener("resize", this.updateTransform.bind(this));
  }
}

// ============================================
// Example 8: Three.js integration
// ============================================

function setupThreeJsStage() {
  const canvas = document.createElement("canvas");
  const container = document.createElement("div");
  
  // Three.js setup
  canvas.width = STAGE_SIZE;
  canvas.height = STAGE_SIZE;
  
  // Note: Three.js needs actual canvas dimensions set
  // The transformer handles the CSS scaling
  const cleanup = createStageTransformer(canvas, container);
  
  // Your Three.js renderer should use STAGE_SIZE for camera setup
  // const camera = new THREE.OrthographicCamera(
  //   -STAGE_SIZE / 2,
  //   STAGE_SIZE / 2,
  //   STAGE_SIZE / 2,
  //   -STAGE_SIZE / 2,
  //   0.1,
  //   2000
  // );
  
  return { canvas, container, cleanup };
}

export {
  setupBasicCanvas,
  setupWithDebounce,
  manualTransformExample,
  positionUIExample,
  coordinateConversionExample,
  useStage2048,
  Stage2048Pipeline,
  setupThreeJsStage,
};

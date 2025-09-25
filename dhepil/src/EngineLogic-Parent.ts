// IMPORT SECTION
import type { EasingFunction } from './EngineLayer-Types.js';

// STYLE SECTION (unused)

// STATE SECTION
export interface LogicConfig {
  /** Global logic system settings */
  updateFrequency: number;
  
  /** Feature toggles */
  enablePhysics: boolean;
  enableAnimations: boolean;
  enableInteractions: boolean;
  
  /** Behavior configuration defaults */
  behaviorDefaults: BehaviorDefaults;
  
  /** Performance settings */
  performance?: {
    targetFPS: number;
    enableProfiling: boolean;
    adaptiveQuality: boolean;
  };
}

export interface BehaviorDefaults {
  animation: {
    easing: EasingFunction;
    duration: number;
  };
  interaction: {
    debounce: number;
  };
  physics: {
    gravity: number;
    friction: number;
  };
}

export interface BehaviorUpdate {
  [key: string]: any;
}

export interface BehaviorState {
  [key: string]: any;
}

export interface Behavior {
  /** Unique behavior identifier */
  id: string;
  
  /** Behavior enabled state */
  enabled: boolean;
  
  /** Initialize behavior with configuration */
  initialize(config: LogicConfig): void;
  
  /** Update behavior state with delta time */
  update(deltaTime: number): void;
  
  /** Reset behavior to initial state */
  reset(): void;
  
  /** Clean up behavior resources */
  dispose(): void;
  
  /** Get current behavior state */
  getState(): BehaviorState;
  
  /** Check if behavior has pending changes */
  isDirty(): boolean;
  
  /** Clear dirty flag after processing */
  clearDirty(): void;
}

export interface RafTicker {
  subscribe: (callback: (deltaTime: number) => void) => () => void;
  unsubscribe: () => void;
  pause: () => void;
  resume: () => void;
  isRunning: () => boolean;
}

// LOGIC SECTION
export abstract class BaseBehavior implements Behavior {
  public id: string;
  public enabled: boolean = true;
  protected isDirtyFlag: boolean = false;
  protected config!: LogicConfig;

  constructor(id: string) {
    this.id = id;
  }

  public initialize(config: LogicConfig): void {
    this.config = config;
    this.onInitialize();
  }

  public abstract update(deltaTime: number): void;
  public abstract reset(): void;
  public abstract getState(): BehaviorState;

  protected abstract onInitialize(): void;

  public dispose(): void {
    this.enabled = false;
    this.onDispose();
  }

  protected onDispose(): void {}

  public isDirty(): boolean {
    return this.isDirtyFlag;
  }

  public clearDirty(): void {
    this.isDirtyFlag = false;
  }

  protected markDirty(): void {
    this.isDirtyFlag = true;
  }
}

export class LogicEngine {
  private behaviors: Map<string, Behavior> = new Map();
  private ticker: RafTicker;
  private config: LogicConfig;
  private eventHandlers: Map<string, ((...args: any[]) => void)[]> = new Map();

  constructor(config: LogicConfig) {
    this.config = config;
    this.ticker = this.createRafTicker();
  }

  /**
   * Add behavior to the engine
   */
  public addBehavior(id: string, behavior: Behavior): void {
    this.behaviors.set(id, behavior);
    behavior.initialize(this.config);
    this.emitEvent('behavior:added', { id, behavior });
  }

  /**
   * Update behavior properties
   */
  public updateBehavior(id: string, updates: BehaviorUpdate): boolean {
    const behavior = this.behaviors.get(id);
    if (!behavior) return false;
    
    // Apply updates to behavior
    Object.assign(behavior, updates);
    this.emitEvent('behavior:updated', { id, behavior });
    return true;
  }

  /**
   * Remove behavior from engine
   */
  public removeBehavior(id: string): boolean {
    const behavior = this.behaviors.get(id);
    if (!behavior) return false;
    
    behavior.dispose();
    this.behaviors.delete(id);
    this.emitEvent('behavior:removed', { id });
    return true;
  }

  /**
   * Process all behaviors for frame
   */
  public update(deltaTime: number): void {
    this.behaviors.forEach((behavior, _id) => {
      if (behavior.enabled) {
        behavior.update(deltaTime);
      }
    });
    
    this.emitEvent('frame:updated', { deltaTime, behaviorCount: this.behaviors.size });
  }

  /**
   * Start engine processing
   */
  public start(): void {
    this.ticker.subscribe((deltaTime) => this.update(deltaTime));
  }

  /**
   * Stop engine processing
   */
  public stop(): void {
    this.ticker.unsubscribe();
  }

  /**
   * Get all behaviors
   */
  public getAllBehaviors(): Behavior[] {
    return Array.from(this.behaviors.values());
  }

  /**
   * Get behavior count
   */
  public getBehaviorCount(): number {
    return this.behaviors.size;
  }

  private createRafTicker(): RafTicker {
    const subscribers = new Set<(deltaTime: number) => void>();
    let lastTime = 0;
    let rafId: number | null = null;
    let isPaused = false;
    let running = false;

    const tick = (currentTime: number) => {
      if (isPaused || !running) {
        if (running) {
          rafId = requestAnimationFrame(tick);
        }
        return;
      }
      
      const deltaTime = lastTime === 0 ? 16.67 : currentTime - lastTime;
      lastTime = currentTime;
      
      subscribers.forEach(callback => {
        try {
          callback(deltaTime);
        } catch (error) {
          console.error('Error in RAF ticker callback:', error);
        }
      });
      
      rafId = requestAnimationFrame(tick);
    };

    return {
      subscribe: (callback: (deltaTime: number) => void) => {
        subscribers.add(callback);
        if (!running) {
          running = true;
          rafId = requestAnimationFrame(tick);
        }
        return () => {
          subscribers.delete(callback);
          if (subscribers.size === 0) {
            running = false;
            if (rafId) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
          }
        };
      },
      unsubscribe: () => {
        subscribers.clear();
        running = false;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
      pause: () => {
        isPaused = true;
      },
      resume: () => {
        isPaused = false;
        lastTime = 0;
      },
      isRunning: () => running && !isPaused
    };
  }

  public on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private emitEvent(_event: string, _data: any): void {
    const handlers = this.eventHandlers.get(_event) || [];
    handlers.forEach(handler => {
      try {
        handler(_data);
      } catch (error) {
        console.error(`Error in event handler for ${_event}:`, error);
      }
    });
  }
}

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export default LogicEngine;
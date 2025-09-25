// IMPORT SECTION
import { BaseBehavior, type BehaviorState } from './EngineLogic-Parent.js';

// STYLE SECTION (unused)

// STATE SECTION
export interface AnimationOptions {
  easing?: string;
  repeat?: number;
  direction?: 'normal' | 'reverse' | 'alternate';
  onComplete?: () => void;
  onUpdate?: (value: number) => void;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Animation {
  id: string;
  property: string;
  startValue: number;
  endValue: number;
  duration: number;
  elapsed: number;
  isPlaying: boolean;
  isPaused: boolean;
  options: AnimationOptions;
}

export interface RotationState {
  angle: number;
  speed: number;
  direction: number;
}

export interface ClockState {
  hours: number;
  minutes: number;
  seconds: number;
  hourAngle: number;
  minuteAngle: number;
  secondAngle: number;
}

// LOGIC SECTION
export class AnimationBehavior extends BaseBehavior {
  private animations: Map<string, Animation> = new Map();
  private animationCounter: number = 0;

  protected onInitialize(): void {
    // Initialize animation system
  }

  /**
   * Create property-based animation
   */
  public animate(
    property: string, 
    target: number, 
    duration: number, 
    options: AnimationOptions = {}
  ): string {
    const animationId = `${property}_${this.animationCounter++}`;
    
    const animation: Animation = {
      id: animationId,
      property,
      startValue: 0,
      endValue: target,
      duration,
      elapsed: 0,
      isPlaying: false,
      isPaused: false,
      options: {
        easing: 'easeInOut',
        repeat: 1,
        direction: 'normal',
        ...options
      }
    };

    this.animations.set(animationId, animation);
    this.playAnimation(animationId);
    
    return animationId;
  }

  /**
   * Play animation by ID
   */
  public playAnimation(animationId: string): boolean {
    const animation = this.animations.get(animationId);
    if (!animation) return false;

    animation.isPlaying = true;
    animation.isPaused = false;
    this.markDirty();
    
    return true;
  }

  /**
   * Stop animation by ID
   */
  public stopAnimation(animationId: string): boolean {
    const animation = this.animations.get(animationId);
    if (!animation) return false;

    animation.isPlaying = false;
    animation.elapsed = 0;
    this.markDirty();
    
    return true;
  }

  public update(deltaTime: number): void {
    if (!this.enabled) return;

    let hasChanges = false;

    this.animations.forEach(animation => {
      if (animation.isPlaying && !animation.isPaused) {
        animation.elapsed += deltaTime;
        const progress = Math.min(animation.elapsed / animation.duration, 1);
        
        const easedProgress = this.applyEasing(progress, animation.options.easing || 'linear');
        const currentValue = animation.startValue + (animation.endValue - animation.startValue) * easedProgress;
        
        if (animation.options.onUpdate) {
          animation.options.onUpdate(currentValue);
        }

        if (progress >= 1) {
          if (animation.options.onComplete) {
            animation.options.onComplete();
          }
          
          // Handle repeat
          if ((animation.options.repeat || 1) > 1 || animation.options.repeat === Infinity) {
            animation.elapsed = 0;
            if (animation.options.repeat !== Infinity) {
              animation.options.repeat!--;
            }
          } else {
            animation.isPlaying = false;
          }
        }

        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.markDirty();
    }
  }

  public reset(): void {
    this.animations.clear();
    this.animationCounter = 0;
    this.clearDirty();
  }

  public getState(): BehaviorState {
    const animationStates: Record<string, any> = {};
    
    this.animations.forEach((animation, id) => {
      const progress = animation.duration > 0 ? animation.elapsed / animation.duration : 0;
      animationStates[id] = {
        property: animation.property,
        progress: Math.min(progress, 1),
        isPlaying: animation.isPlaying,
        isPaused: animation.isPaused
      };
    });

    return {
      activeAnimations: animationStates,
      animationCount: this.animations.size
    };
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return 1 - (1 - t) * (1 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'bounce':
        return this.bounceOut(t);
      case 'elastic':
        return this.elasticOut(t);
      default:
        return t;
    }
  }

  private bounceOut(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }

  private elasticOut(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
}

export class RotationBehavior extends BaseBehavior {
  private rotationState: RotationState = {
    angle: 0,
    speed: Math.PI, // 1 rotation per 2 seconds
    direction: 1
  };

  protected onInitialize(): void {
    // Initialize with config defaults
    if (this.config.behaviorDefaults.animation.duration) {
      this.rotationState.speed = (2 * Math.PI) / this.config.behaviorDefaults.animation.duration * 1000;
    }
  }

  /**
   * Set rotation speed in radians per second
   */
  public setSpeed(radiansPerSecond: number): void {
    this.rotationState.speed = radiansPerSecond;
    this.markDirty();
  }

  /**
   * Set rotation direction
   */
  public setDirection(direction: 1 | -1): void {
    this.rotationState.direction = direction;
    this.markDirty();
  }

  public update(deltaTime: number): void {
    if (!this.enabled) return;

    const deltaSeconds = deltaTime / 1000;
    this.rotationState.angle += this.rotationState.speed * this.rotationState.direction * deltaSeconds;
    
    // Keep angle in 0-2π range
    this.rotationState.angle = this.rotationState.angle % (2 * Math.PI);
    if (this.rotationState.angle < 0) {
      this.rotationState.angle += 2 * Math.PI;
    }

    this.markDirty();
  }

  public reset(): void {
    this.rotationState.angle = 0;
    this.clearDirty();
  }

  public getState(): BehaviorState {
    return {
      angle: this.rotationState.angle,
      angleDegrees: (this.rotationState.angle * 180) / Math.PI,
      speed: this.rotationState.speed,
      direction: this.rotationState.direction
    };
  }

  /**
   * Get current rotation in degrees
   */
  public getAngleDegrees(): number {
    return (this.rotationState.angle * 180) / Math.PI;
  }
}

export class ClockBehavior extends BaseBehavior {
  private clockState: ClockState = {
    hours: 0,
    minutes: 0,
    seconds: 0,
    hourAngle: 0,
    minuteAngle: 0,
    secondAngle: 0
  };

  protected onInitialize(): void {
    this.updateClock();
  }

  /**
   * Update clock to current time
   */
  private updateClock(): void {
    const now = new Date();
    this.clockState.hours = now.getHours() % 12;
    this.clockState.minutes = now.getMinutes();
    this.clockState.seconds = now.getSeconds();

    // Calculate hand angles (12 o'clock = 0 degrees)
    this.clockState.secondAngle = (this.clockState.seconds * 6) * Math.PI / 180; // 360/60 = 6 degrees per second
    this.clockState.minuteAngle = (this.clockState.minutes * 6 + this.clockState.seconds * 0.1) * Math.PI / 180;
    this.clockState.hourAngle = (this.clockState.hours * 30 + this.clockState.minutes * 0.5) * Math.PI / 180; // 360/12 = 30 degrees per hour

    this.markDirty();
  }

  public update(_deltaTime: number): void {
    if (!this.enabled) return;

    this.updateClock();
  }

  public reset(): void {
    this.updateClock();
    this.clearDirty();
  }

  public getState(): BehaviorState {
    return {
      time: {
        hours: this.clockState.hours,
        minutes: this.clockState.minutes,
        seconds: this.clockState.seconds
      },
      angles: {
        hour: this.clockState.hourAngle,
        minute: this.clockState.minuteAngle,
        second: this.clockState.secondAngle
      },
      anglesDegrees: {
        hour: (this.clockState.hourAngle * 180) / Math.PI,
        minute: (this.clockState.minuteAngle * 180) / Math.PI,
        second: (this.clockState.secondAngle * 180) / Math.PI
      }
    };
  }

  /**
   * Get hour hand angle in radians
   */
  public getHourAngle(): number {
    return this.clockState.hourAngle;
  }

  /**
   * Get minute hand angle in radians
   */
  public getMinuteAngle(): number {
    return this.clockState.minuteAngle;
  }

  /**
   * Get second hand angle in radians
   */
  public getSecondAngle(): number {
    return this.clockState.secondAngle;
  }
}

export class OrbitBehavior extends BaseBehavior {
  private orbitRadius: number = 2;
  private orbitSpeed: number = Math.PI; // radians per second
  private orbitAngle: number = 0;
  private centerPosition: Vector2 = { x: 0, y: 0 };
  private currentPosition: Vector2 = { x: 0, y: 0 };

  protected onInitialize(): void {
    this.updatePosition();
  }

  /**
   * Set orbit parameters
   */
  public setOrbit(radius: number, speed: number, centerX: number = 0, centerY: number = 0): void {
    this.orbitRadius = radius;
    this.orbitSpeed = speed;
    this.centerPosition = { x: centerX, y: centerY };
    this.updatePosition();
    this.markDirty();
  }

  public update(deltaTime: number): void {
    if (!this.enabled) return;

    const deltaSeconds = deltaTime / 1000;
    this.orbitAngle += this.orbitSpeed * deltaSeconds;
    
    // Keep angle in 0-2π range
    this.orbitAngle = this.orbitAngle % (2 * Math.PI);
    
    this.updatePosition();
    this.markDirty();
  }

  private updatePosition(): void {
    this.currentPosition.x = this.centerPosition.x + Math.cos(this.orbitAngle) * this.orbitRadius;
    this.currentPosition.y = this.centerPosition.y + Math.sin(this.orbitAngle) * this.orbitRadius;
  }

  public reset(): void {
    this.orbitAngle = 0;
    this.updatePosition();
    this.clearDirty();
  }

  public getState(): BehaviorState {
    return {
      position: { ...this.currentPosition },
      angle: this.orbitAngle,
      angleDegrees: (this.orbitAngle * 180) / Math.PI,
      radius: this.orbitRadius,
      speed: this.orbitSpeed,
      center: { ...this.centerPosition }
    };
  }

  /**
   * Get current position
   */
  public getPosition(): Vector2 {
    return { ...this.currentPosition };
  }
}

// UI SECTION (unused)

// EFFECT SECTION (unused)

// EXPORT SECTION
export { AnimationBehavior as default };
// AI-Agent Friendly Engine Interface
export interface EngineConfig {
  stage: {
    width: 2048
    height: 2048
  }
  performance: {
    dprCap: number          // 1.0 - 2.0
    antialias: boolean
    shadowsEnabled: boolean
  }
  debug: boolean
}

export interface StageAdapter {
  // Core lifecycle
  mount(element: HTMLElement): Promise<void>
  dispose(): void
  resize(): void
  
  // DOM integration
  getOverlay(): HTMLElement
  getCanvas(): HTMLCanvasElement
  
  // Performance
  pause(): void
  resume(): void
  getMetrics(): PerformanceMetrics
  
  // AI-Agent Interface
  configure(config: Partial<EngineConfig>): void
  getStatus(): EngineStatus
}

export interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  drawCalls: number
  triangles: number
}

export interface EngineStatus {
  ready: boolean
  paused: boolean
  error?: string
}
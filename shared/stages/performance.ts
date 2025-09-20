/**
 * Performance utilities for the 3D stage engine
 * Based on device detection and adaptive quality settings
 */

export interface PerformanceProfile {
  deviceTier: 'low' | 'mid' | 'high'
  maxDPR: number
  antialias: boolean
  shadowsEnabled: boolean
  textureQuality: number
}

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsage: number
  drawCalls: number
  triangles: number
}

/**
 * Detect device performance tier based on hardware capabilities
 */
export function detectDeviceTier(): 'low' | 'mid' | 'high' {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
  
  if (!gl) return 'low'
  
  const renderer = gl.getParameter(gl.RENDERER) as string
  const vendor = gl.getParameter(gl.VENDOR) as string
  
  // Check for dedicated GPU indicators
  if (renderer.includes('NVIDIA') || renderer.includes('AMD') || renderer.includes('Intel Arc')) {
    return 'high'
  }
  
  // Check for integrated graphics
  if (renderer.includes('Intel') || renderer.includes('Mali') || renderer.includes('Adreno')) {
    return 'mid'
  }
  
  // Memory check as fallback
  const memory = (performance as any).memory
  if (memory && memory.usedJSHeapSize) {
    return memory.jsHeapSizeLimit > 1000000000 ? 'mid' : 'low'
  }
  
  return 'mid' // Default fallback
}

/**
 * Get performance profile based on device capabilities
 */
export function getPerformanceProfile(): PerformanceProfile {
  const tier = detectDeviceTier()
  
  switch (tier) {
    case 'high':
      return {
        deviceTier: 'high',
        maxDPR: 2.0,
        antialias: true,
        shadowsEnabled: true,
        textureQuality: 1.0
      }
    
    case 'mid':
      return {
        deviceTier: 'mid',
        maxDPR: 1.5,
        antialias: true,
        shadowsEnabled: false,
        textureQuality: 0.8
      }
    
    case 'low':
    default:
      return {
        deviceTier: 'low',
        maxDPR: 1.0,
        antialias: false,
        shadowsEnabled: false,
        textureQuality: 0.5
      }
  }
}

/**
 * Monitor performance metrics and adapt quality settings
 */
export class PerformanceMonitor {
  private frameCount = 0
  private lastTime = 0
  private fpsHistory: number[] = []
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0
  }

  update(): void {
    const now = performance.now()
    const deltaTime = now - this.lastTime
    
    if (deltaTime >= 1000) {
      const fps = (this.frameCount * 1000) / deltaTime
      this.fpsHistory.push(fps)
      
      // Keep only last 30 samples (30 seconds at 1 sample per second)
      if (this.fpsHistory.length > 30) {
        this.fpsHistory.shift()
      }
      
      this.metrics.fps = fps
      this.metrics.frameTime = 1000 / fps
      
      this.frameCount = 0
      this.lastTime = now
    }
    
    this.frameCount++
  }

  getMetrics(): PerformanceMetrics {
    // Update memory usage if available
    const memory = (performance as any).memory
    if (memory) {
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    
    return { ...this.metrics }
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60
    return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
  }

  shouldReduceQuality(): boolean {
    const avgFPS = this.getAverageFPS()
    return avgFPS < 45 // Reduce quality if FPS drops below 45
  }

  shouldIncreaseQuality(): boolean {
    const avgFPS = this.getAverageFPS()
    return avgFPS > 55 && this.fpsHistory.length > 10 // Increase quality if consistently above 55 FPS
  }
}
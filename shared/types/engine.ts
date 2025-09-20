/**
 * TypeScript definitions for the 3D stage engine
 * Re-exports core types from stages directory
 */

export { EngineConfig, StageAdapter, PerformanceMetrics, EngineStatus } from '../stages/adapter'

export interface Transform3D {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
}

export interface SceneObject {
  id: string
  type: 'mesh' | 'light' | 'camera' | 'group'
  transform: Transform3D
  visible: boolean
  userData?: Record<string, any>
}
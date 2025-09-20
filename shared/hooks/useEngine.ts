/**
 * React hook for managing the Three.js engine
 */

import { useRef, useEffect, useState } from 'react'
import { ThreeStageAdapter } from '../stages/three-adapter'
import type { EngineConfig, EngineStatus } from '../types/engine'

export function useEngine(config?: Partial<EngineConfig>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<ThreeStageAdapter | null>(null)
  const [status, setStatus] = useState<EngineStatus>({ ready: false, paused: false })

  useEffect(() => {
    const initEngine = async () => {
      if (!containerRef.current) return

      try {
        const adapter = new ThreeStageAdapter()
        adapterRef.current = adapter

        if (config) {
          adapter.configure(config)
        }

        await adapter.mount(containerRef.current)
        setStatus(adapter.getStatus())
      } catch (error) {
        console.error('Failed to initialize engine:', error)
        setStatus({ ready: false, paused: false, error: String(error) })
      }
    }

    initEngine()

    return () => {
      if (adapterRef.current) {
        adapterRef.current.dispose()
        adapterRef.current = null
      }
    }
  }, [config])

  const getAdapter = () => adapterRef.current
  const getOverlay = () => adapterRef.current?.getOverlay()
  const getCanvas = () => adapterRef.current?.getCanvas()

  return {
    containerRef,
    status,
    adapter: adapterRef.current,
    getAdapter,
    getOverlay,
    getCanvas
  }
}
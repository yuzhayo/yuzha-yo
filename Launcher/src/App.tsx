import React, { useRef, useEffect, useState } from 'react'
import type { StageAdapter, EngineStatus } from '@shared/stages/adapter'
import { ThreeStageAdapter } from '@shared/stages/three-adapter'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<StageAdapter | null>(null)
  const [status, setStatus] = useState<EngineStatus>({ ready: false, paused: false })

  useEffect(() => {
    const initEngine = async () => {
      if (!containerRef.current) return

      try {
        const adapter = new ThreeStageAdapter()
        adapterRef.current = adapter
        
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
      }
    }
  }, [])

  return (
    <div className="app">
      <div className="stage-container" ref={containerRef} />
      <div className="debug-info">
        <p>Status: {status.ready ? 'Ready' : 'Loading'}</p>
        {status.error && <p className="error">Error: {status.error}</p>}
      </div>
    </div>
  )
}

export { App }
export default App
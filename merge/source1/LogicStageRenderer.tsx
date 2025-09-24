import React from 'react'
import type { LogicConfig } from './LogicTypes'
import { buildSceneFromLogic } from './LogicLoaderMain'
import logicConfigJson from './LogicConfigData'

export default function LogicStage() {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    let cleanupScene: (() => void) | undefined

    ;(async () => {
      const el = ref.current
      if (!el) return

      try {
        // Use imported configuration
        const cfg = logicConfigJson as unknown as LogicConfig
        
        // Note: This needs to be updated to work with the new stage system
        console.warn('[LogicStage] Needs integration with stage transform system')
        
      } catch (e) {
        console.error('[LogicStage] Failed to build scene from logic config', e)
      }
    })()

   return () => {
      try { cleanupScene?.() } catch {}
    }
  }, [])

  return (
    <div ref={ref} />
  )
}
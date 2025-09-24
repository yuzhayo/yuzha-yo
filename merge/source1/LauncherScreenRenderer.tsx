import React from 'react'
import type { RendererMode } from './LogicCapabilityUtils'
import LogicRendererBadgeRenderer from './LogicRendererBadgeRenderer'
import LauncherUpdaterUtils from './LauncherUpdaterUtils'
import LogicApiTesterRenderer from './LogicApiTesterRenderer'
import LogicStageRenderer from './LogicStageRenderer'
import LogicStageDomRenderer from './LogicStageDomRenderer'
import { detectRenderer } from './LogicCapabilityUtils'

export type LauncherScreenProps = {
  rendererMode?: RendererMode // 'auto' | 'pixi' | 'dom'
}

/**
 * Layar utama launcher yang menampilkan navigasi dock.
 * Logic renderer kompleks dihapus untuk sementara.
 */
export default function LauncherScreen(props: LauncherScreenProps) {
  const mode = props.rendererMode ?? 'auto'
  const chosen = detectRenderer(mode)
  const label = chosen === 'pixi' ? 'Renderer: Pixi' : 'Renderer: DOM'
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Renderer canvas behind UI */}
      <div className="absolute inset-0">
        {chosen === 'pixi' ? <LogicStageRenderer /> : <LogicStageDomRenderer />}
      </div>
      {/* Area utama untuk konten launcher */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">'''</h1>
          <p className="text-slate-300">
            Hold tap anywhere to access modules
          </p>
        </div>
      </div>

      {/* Renderer badge and updater (hold with launcher) */}
      <LogicRendererBadgeRenderer visible={true} label={label} />
      <LogicApiTesterRenderer visible={true} />
      <LauncherUpdaterUtils visible={true} />
    </div>
  )
}
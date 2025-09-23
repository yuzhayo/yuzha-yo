import React from 'react'
import './LauncherStyles.css'
import { detectRenderer, type RendererMode } from './detectRenderer'
import { LauncherBtnPanel } from './LauncherBtn'
import { useLauncherBtnGesture } from './LauncherBtnGesture'
import LogicRendererBadge from './LogicRendererBadge'
import LauncherUpdater from './LauncherUpdater'
import LogicApiTester from './LogicApiTester'

type LauncherScreenProps = {
  rendererMode?: RendererMode
}

export default function LauncherScreen(props: LauncherScreenProps) {
  const mode = props.rendererMode ?? 'auto'
  const chosen = detectRenderer(mode)
  const gesture = useLauncherBtnGesture()
  const label = chosen === 'pixi' ? 'Renderer: Pixi' : 'Renderer: DOM'

  return (
    <div className="launcher-screen">
      <div className="launcher-stage" aria-hidden="true" data-mode={chosen} />

      <div {...gesture.bindTargetProps()} className="launcher-overlay" />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        <div style={{ textAlign: 'center', display: 'grid', gap: '1rem' }}>
          <h1 className="launcher-headline">Display host ready.</h1>
          <p className="launcher-subtext">Hold anywhere to access modules</p>
        </div>
      </div>

      <LauncherBtnPanel
        open={gesture.open}
        onToggle={gesture.toggle}
        effect={{ kind: 'fade' }}
        title="Modules"
        target="_self"
      />

      <LogicRendererBadge visible={gesture.open} label={label} />
      <LogicApiTester visible={gesture.open} />
      <LauncherUpdater visible={gesture.open} />
    </div>
  )
}

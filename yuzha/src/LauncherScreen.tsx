import React from 'react'
import './LauncherStyles.css'
import {
  detectRenderer,
  type RendererMode,
  type RendererAvailability,
  type DetectedRenderer
} from './detectRenderer'
import { LauncherBtnPanel } from './LauncherBtn'
import { useLauncherBtnGesture } from './LauncherBtnGesture'
import LogicRendererBadge from './LogicRendererBadge'
import LauncherUpdater from './LauncherUpdater'
import LogicApiTester from './LogicApiTester'

type LauncherStageRenderers = {
  pixi?: React.ReactNode
  dom?: React.ReactNode
}

type LauncherScreenProps = {
  rendererMode?: RendererMode
  renderers?: LauncherStageRenderers
}

type RendererLabelParts = {
  label: string
  hint?: string
}

function formatRendererLabel(detected: DetectedRenderer): RendererLabelParts {
  const formatFallback = (kind: RendererMode | undefined) =>
    kind ? `fallback from ${kind.toUpperCase()}` : undefined

  if (detected.kind === 'pixi') {
    const suffix = detected.via === 'fallback' ? formatFallback(detected.fallbackFrom) : undefined
    return { label: 'Renderer: Pixi', hint: suffix }
  }

  if (detected.kind === 'dom') {
    const suffix = detected.via === 'fallback' ? formatFallback(detected.fallbackFrom) : undefined
    return { label: 'Renderer: DOM', hint: suffix }
  }

  if (detected.kind === 'static') {
    const hint = detected.fallbackFrom ? formatFallback(detected.fallbackFrom) : detected.reason
    return { label: 'Renderer: none', hint }
  }

  return { label: 'Renderer: unknown' }
}

function mapRenderersToAvailability(renderers?: LauncherStageRenderers): RendererAvailability {
  return {
    pixi: renderers?.pixi != null,
    dom: renderers?.dom != null
  }
}

export default function LauncherScreen(props: LauncherScreenProps) {
  const mode = props.rendererMode ?? 'auto'
  const availability = React.useMemo(() => mapRenderersToAvailability(props.renderers), [props.renderers])
  const detected = React.useMemo(() => detectRenderer(mode, availability), [mode, availability])
  const gesture = useLauncherBtnGesture()

  const stageContent = React.useMemo(() => {
    if (detected.kind === 'pixi') return props.renderers?.pixi ?? null
    if (detected.kind === 'dom') return props.renderers?.dom ?? null
    return null
  }, [detected, props.renderers])

  const labelParts = React.useMemo(() => formatRendererLabel(detected), [detected])
  const badgeLabel = labelParts.hint ? `${labelParts.label} (${labelParts.hint})` : labelParts.label

  return (
    <div className="launcher-screen">
      <div
        className="launcher-stage"
        aria-hidden="true"
        data-renderer={detected.kind}
        data-renderer-via={detected.via}
        data-renderer-fallback={detected.via === 'fallback' ? detected.fallbackFrom ?? 'unknown' : undefined}
      >
        {stageContent}
      </div>

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

      <LogicRendererBadge visible={gesture.open} label={badgeLabel} />
      <LogicApiTester visible={gesture.open} />
      <LauncherUpdater visible={gesture.open} />
    </div>
  )
}

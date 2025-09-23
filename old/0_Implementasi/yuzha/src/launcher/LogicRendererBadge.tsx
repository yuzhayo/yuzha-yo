import React from 'react'

export type LogicRendererBadgeProps = {
  visible: boolean
  label: string
}

export default function LogicRendererBadge(props: LogicRendererBadgeProps) {
  if (!props.visible) return null
  return (
    <div className="launcher-badge-status" aria-live="polite">
      {props.label}
    </div>
  )
}

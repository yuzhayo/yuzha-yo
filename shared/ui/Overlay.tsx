/**
 * DOM Overlay component for positioning UI over the 3D stage
 */

import React from 'react'

export interface OverlayProps {
  children: React.ReactNode
  className?: string
  pointerEvents?: boolean
}

export function Overlay({ children, className = '', pointerEvents = false }: OverlayProps) {
  const pointerClass = pointerEvents ? 'pointer-events-auto' : 'pointer-events-none'
  
  return (
    <div className={`absolute inset-0 ${pointerClass} z-10 ${className}`}>
      {children}
    </div>
  )
}
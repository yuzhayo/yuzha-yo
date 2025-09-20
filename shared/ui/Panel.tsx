/**
 * Reusable Panel component for UI overlays
 */

import React from 'react'

export interface PanelProps {
  children: React.ReactNode
  title?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  className?: string
  onClose?: () => void
  visible?: boolean
}

const positionClasses = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
}

export function Panel({
  children,
  title,
  position = 'top-left',
  className = '',
  onClose,
  visible = true
}: PanelProps) {
  if (!visible) return null

  const positionClass = positionClasses[position]

  return (
    <div className={`absolute ${positionClass} pointer-events-auto z-20 ${className}`}>
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4 min-w-[200px]">
        {title && (
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">{title}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="text-gray-700">
          {children}
        </div>
      </div>
    </div>
  )
}
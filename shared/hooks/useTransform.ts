/**
 * React hook for stage transform management
 */

import { useRef, useEffect, useState } from 'react'
import { StageTransformManager } from '../stages/transform'
import type { StageTransform, StageCoordinates } from '../stages/transform'

export function useTransform() {
  const managerRef = useRef<StageTransformManager | null>(null)
  const [transform, setTransform] = useState<StageTransform | null>(null)

  useEffect(() => {
    managerRef.current = new StageTransformManager()
    
    return () => {
      managerRef.current?.dispose()
      managerRef.current = null
    }
  }, [])

  const initialize = (container: HTMLElement, canvas: HTMLCanvasElement, overlay?: HTMLElement) => {
    if (managerRef.current) {
      managerRef.current.initialize(container, canvas, overlay)
      setTransform(managerRef.current.getTransform())
    }
  }

  const transformCoordinates = (event: PointerEvent | MouseEvent | TouchEvent): StageCoordinates | null => {
    return managerRef.current?.transformEventCoordinates(event) || null
  }

  return {
    manager: managerRef.current,
    transform,
    initialize,
    transformCoordinates
  }
}
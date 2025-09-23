// Small shared math helpers for processors

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function clamp01(n: number): number {
  return clamp(n, 0, 1)
}

export function normDeg(deg: number): number {
  const d = deg % 360
  return d < 0 ? d + 360 : d
}

// Common RPM clamp (0..60), accepts number-like or null/undefined
export function clampRpm60(v: unknown): number {
  const n = typeof v === 'number' ? v : v == null ? 0 : Number(v)
  if (!isFinite(n) || n <= 0) return 0
  return Math.min(60, Math.max(0, n))
}

import type { Application, Sprite } from 'pixi.js'
import type { LayerConfig } from './LogicTypes'
import { toRad } from './LogicMathUtils'

// Stage dimensions (should match actual stage transform)
const STAGE_WIDTH = 1024
const STAGE_HEIGHT = 1024

// Basic placement & ordering helpers

export function logicZIndexFor(cfg: LayerConfig): number {
  const m = cfg.id.match(/\d+/)
  return m ? parseInt(m[0], 10) : 0
}

export function logicApplyBasicTransform(app: Application, sp: Sprite, cfg: LayerConfig) {
  const w = STAGE_WIDTH
  const h = STAGE_HEIGHT
  const xPct = cfg.position.xPct ?? 0
  const yPct = cfg.position.yPct ?? 0
  sp.x = (xPct / 100) * w
  sp.y = (yPct / 100) * h
  const s = (cfg.scale?.pct ?? 100) / 100
  sp.scale.set(s, s)
  sp.rotation = toRad(cfg.angleDeg ?? 0)
  sp.zIndex = logicZIndexFor(cfg)
}
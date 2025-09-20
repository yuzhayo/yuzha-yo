/**
 * Configuration utilities
 */

import type { EngineConfig } from '../types/engine'

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  stage: {
    width: 2048,
    height: 2048
  },
  performance: {
    dprCap: 1.5,
    antialias: true,
    shadowsEnabled: false
  },
  debug: false
}

export function getEnvironmentConfig() {
  return {
    isDevelopment: (import.meta as any).env?.MODE === 'development',
    isProduction: (import.meta as any).env?.MODE === 'production',
    baseUrl: (import.meta as any).env?.BASE_URL || '/',
  }
}

export function mergeConfig<T extends Record<string, any>>(
  defaultConfig: T,
  userConfig: Partial<T>
): T {
  return { ...defaultConfig, ...userConfig }
}
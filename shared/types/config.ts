/**
 * Configuration types for the application
 */

export interface AppConfig {
  environment: 'development' | 'production' | 'test'
  debug: boolean
  performance: PerformanceConfig
  modules: ModuleConfig[]
}

export interface PerformanceConfig {
  enablePerformanceMonitoring: boolean
  fpsTarget: number
  memoryLimit: number // MB
  adaptiveQuality: boolean
}

export interface ModuleConfig {
  id: string
  name: string
  url: string
  enabled: boolean
  order: number
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'auto'
  animations: boolean
  reducedMotion: boolean
  colorScheme: ColorScheme
}

export interface ColorScheme {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  accent: string
}

export interface DatabaseConfig {
  provider: string
  connectionString?: string
  options: Record<string, any>
}

export interface AuthConfig {
  enablePasskey: boolean
  sessionDuration: number // minutes
  providers: string[]
}
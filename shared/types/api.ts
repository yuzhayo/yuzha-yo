/**
 * API types and interfaces
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  statusCode: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
}

export interface ModuleData {
  id: string
  name: string
  description: string
  version: string
  status: 'active' | 'inactive' | 'maintenance'
  config: Record<string, any>
}

export interface Asset {
  id: string
  name: string
  type: 'image' | 'model' | 'audio' | 'video' | 'texture'
  url: string
  size: number
  mimeType: string
  metadata?: Record<string, any>
}

export interface WebhookPayload {
  event: string
  data: Record<string, any>
  timestamp: number
  source: string
}
export interface Session {
  id: string
  title?: string
  description?: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'completed' | 'failed'
  metadata?: Record<string, unknown>
}

export interface CreateSessionParams {
  title?: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface UpdateSessionParams {
  title?: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface Asset {
  id: string
  label: string
  url: string
  thumbnailUrl?: string
  type: 'image' | 'video' | 'audio' | 'document'
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface ChatRequest {
  message: string
  mode?: 'direct' | 'skill'
  skill?: string
  assetRefs?: string[]
}

export type EventType = 'text' | 'info' | 'error' | 'tool_call' | 'tool_result' | 'plan_propose' | 'canvas_op'

export interface Event {
  id: string
  type: EventType
  content: string | Record<string, unknown>
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface Job {
  id: string
  sessionId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'approved' | 'rejected'
  type: string
  createdAt: string
  updatedAt: string
  result?: Record<string, unknown>
}

export interface Skill {
  id: string
  name: string
  description: string
  category: string
  icon?: string
  parameters?: SkillParameter[]
}

export interface SkillParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select'
  label: string
  description?: string
  required?: boolean
  default?: unknown
  options?: { value: string; label: string }[]
}

export interface RunSkillParams {
  skill: string
  parameters?: Record<string, unknown>
  assetRefs?: string[]
}

export interface FileUploadUrl {
  url: string
  key: string
  fields?: Record<string, string>
  expiresAt?: string
}

export interface Plan {
  id: string
  title: string
  description: string
  steps: PlanStep[]
  sessionId: string
}

export interface PlanStep {
  id: string
  title: string
  description: string
  skill?: string
  parameters?: Record<string, unknown>
}
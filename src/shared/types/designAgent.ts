export interface Session {
  id: string
  name: string
  creditsSpent?: number
  assetCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateSessionParams {
  name?: string
}

export interface UpdateSessionParams {
  name?: string
}

export interface Asset {
  asset_label: string
  kind: 'image' | 'video' | 'audio'
  url: string
  thumbnailUrl?: string
  source_tool: string
  model: string | null
  prompt: string | null
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  attachments?: Array<{ asset_label: string; url: string; kind: string }>
  skill_name?: string
  events?: EventItem[]
}

export interface EventItem {
  id: number
  type: EventType
  payload: EventPayload
  job_id: string
  created_at: string
}

export type EventType = 'text' | 'info' | 'error' | 'tool_call' | 'tool_result' | 'plan_propose' | 'canvas_op'

export interface EventPayload {
  content?: string
  message?: string
  needs_approval?: boolean
  title?: string
  nodes?: PlanNode[]
  total_credits?: number
  name?: string
  args?: Record<string, unknown>
  result?: ToolResult
  asset?: Asset
  op?: string
}

export interface PlanNode {
  tool: string
  model?: string
  credits?: number
}

export interface ToolResult {
  url?: string
  source_asset_id?: string
}

export interface EventsResponse {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error: string | null
  approved: boolean | null
  approval_requested: boolean
  cursor: number
  events: EventItem[]
  done: boolean
}

export interface Job {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'approved' | 'rejected'
  user_message?: string
  error?: string
  createdAt: string
  completedAt?: string
  result?: { plan?: Plan }
}

export interface Skill {
  name: string
  description: string
  inputs: string[]
  trigger_keywords: string[]
  estimated_credits: number
  category?: string
  icon?: string
}

export interface RunSkillParams {
  skill_name: string
  inputs?: Record<string, unknown>
  model?: string
  messages_snapshot?: ChatMessage[]
}

export interface ChatRequest {
  message: string
  model?: string
  canvas_state?: {
    viewport: { x: number; y: number; scale: number }
    selected?: string
    nodes: Array<{ asset_id: string; kind: string; x: number; y: number; w: number; h: number }>
  }
}

export interface FileUploadUrl {
  url: string
  key: string
  fields: Record<string, string>
  expiresAt?: string
}

export interface Plan {
  title: string
  description: string
  nodes: PlanNode[]
  total_credits?: number
}

export interface BrandKit {
  colors?: string[]
  fonts?: string[]
  logoUrl?: string
  tone?: string
}

export interface CanvasState {
  viewport: { x: number; y: number; scale: number }
  selected?: string
  nodes: CanvasNode[]
}

export interface CanvasNode {
  asset_id: string
  kind: 'image' | 'video' | 'audio'
  x: number
  y: number
  w: number
  h: number
}
import axios from 'axios'
import {
  Session,
  CreateSessionParams,
  UpdateSessionParams,
  Asset,
  ChatMessage,
  ChatRequest,
  Event,
  Job,
  Skill,
  RunSkillParams,
  FileUploadUrl,
  Plan
} from '@/types/designAgent'

const MUAPI_API_KEY = localStorage.getItem('muapi_key')
const DESIGN_AGENT_BASE_URL = '/.netlify/functions/design-agent'

const getHeaders = () => {
  const key = localStorage.getItem('muapi_key')
  return {
    'Authorization': key ? `Bearer ${key}` : '',
    'Content-Type': 'application/json'
  }
}

const createAuthClient = () => {
  return axios.create({
    baseURL: DESIGN_AGENT_BASE_URL,
    headers: getHeaders()
  })
}

export async function createSession(params: CreateSessionParams): Promise<Session> {
  const client = createAuthClient()
  const response = await client.post('/sessions', params)
  return response.data
}

export async function getSessions(): Promise<Session[]> {
  const client = createAuthClient()
  const response = await client.get('/sessions')
  return response.data
}

export async function getSession(id: string): Promise<Session> {
  const client = createAuthClient()
  const response = await client.get(`/sessions/${id}`)
  return response.data
}

export async function updateSession(id: string, params: UpdateSessionParams): Promise<Session> {
  const client = createAuthClient()
  const response = await client.patch(`/sessions/${id}`, params)
  return response.data
}

export async function deleteSession(id: string): Promise<void> {
  const client = createAuthClient()
  await client.delete(`/sessions/${id}`)
}

export async function getSessionAssets(sessionId: string): Promise<Asset[]> {
  const client = createAuthClient()
  const response = await client.get(`/sessions/${sessionId}/assets`)
  return response.data
}

export async function createAsset(sessionId: string, asset: Partial<Asset>): Promise<Asset> {
  const client = createAuthClient()
  const response = await client.post(`/sessions/${sessionId}/assets`, asset)
  return response.data
}

export async function sendChatMessage(sessionId: string, request: ChatRequest): Promise<void> {
  const client = createAuthClient()
  await client.post(`/sessions/${sessionId}/chat`, request)
}

export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  const client = createAuthClient()
  const response = await client.get(`/sessions/${sessionId}/messages`)
  return response.data
}

export async function updateMessages(sessionId: string, messageIds: string[]): Promise<void> {
  const client = createAuthClient()
  await client.patch(`/sessions/${sessionId}/messages`, { messageIds })
}

export async function getEvents(jobId: string, since?: string): Promise<Event[]> {
  const client = createAuthClient()
  const params = since ? { params: { since } } : {}
  const response = await client.get(`/jobs/${jobId}/events`, params)
  return response.data
}

export async function getSessionJobs(sessionId: string): Promise<Job[]> {
  const client = createAuthClient()
  const response = await client.get(`/sessions/${sessionId}/jobs`)
  return response.data
}

export async function approveJob(jobId: string): Promise<Job> {
  const client = createAuthClient()
  const response = await client.post(`/jobs/${jobId}/approve`)
  return response.data
}

export async function rejectJob(jobId: string, reason?: string): Promise<Job> {
  const client = createAuthClient()
  const response = await client.post(`/jobs/${jobId}/reject`, { reason })
  return response.data
}

export async function cancelJob(jobId: string): Promise<Job> {
  const client = createAuthClient()
  const response = await client.post(`/jobs/${jobId}/cancel`)
  return response.data
}

export async function runSkill(sessionId: string, params: RunSkillParams): Promise<Job> {
  const client = createAuthClient()
  const response = await client.post(`/sessions/${sessionId}/run-skill`, params)
  return response.data
}

export async function getAgentSkills(): Promise<Skill[]> {
  const client = createAuthClient()
  const response = await client.get('/agent-skills')
  return response.data
}

export async function getFileUploadUrl(filename: string, contentType: string): Promise<FileUploadUrl> {
  const client = createAuthClient()
  const response = await client.get('/api/app/get_file_upload_url', {
    params: { filename, content_type: contentType }
  })
  return response.data
}

export async function uploadFileToStorage(url: string, file: File, fields?: Record<string, string>): Promise<void> {
  const formData = new FormData()
  if (fields) {
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value))
  }
  formData.append('file', file)
  
  await fetch(url, {
    method: 'POST',
    body: formData
  })
}

export function pollEvents(
  jobId: string,
  onEvent: (event: Event) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void,
  interval: number = 1000,
  maxInterval: number = 30000,
  maxRetries: number = 300
): { stop: () => void } {
  let currentInterval = interval
  let retries = 0
  let lastTimestamp: string | undefined
  let stopped = false

  const poll = async () => {
    if (stopped) return

    try {
      const events = await getEvents(jobId, lastTimestamp)
      
      if (events.length > 0) {
        events.forEach(onEvent)
        lastTimestamp = events[events.length - 1].timestamp
      }

      if (events.some(e => e.type === 'plan_propose' || e.type === 'error')) {
        stopped = true
        onComplete?.()
        return
      }

      retries++
      if (retries >= maxRetries) {
        stopped = true
        onComplete?.()
        return
      }

      currentInterval = Math.min(currentInterval * 1.5, maxInterval)
      setTimeout(poll, currentInterval)
    } catch (error) {
      if (!stopped) {
        onError?.(error as Error)
        setTimeout(poll, currentInterval)
      }
    }
  }

  poll()
  return {
    stop: () => { stopped = true }
  }
}
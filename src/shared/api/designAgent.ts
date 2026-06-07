import axios from 'axios'
import {
  Session,
  CreateSessionParams,
  UpdateSessionParams,
  Asset,
  ChatMessage,
  EventItem,
  EventsResponse,
  Job,
  Skill,
  RunSkillParams,
  FileUploadUrl,
  ChatRequest
} from '../types/designAgent'

const DESIGN_AGENT_BASE_URL = '/.netlify/functions/design-agent'

const getHeaders = () => {
  const key = localStorage.getItem('muapi_key')
  return {
    'x-api-key': key || '',
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

export async function sendChatMessage(sessionId: string, request: ChatRequest): Promise<Job> {
  const client = createAuthClient()
  const response = await client.post(`/sessions/${sessionId}/chat`, request)
  return response.data
}

export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  const client = createAuthClient()
  const response = await client.get(`/sessions/${sessionId}/messages`)
  return response.data
}

export async function updateMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
  const client = createAuthClient()
  await client.patch(`/sessions/${sessionId}/messages`, { messages })
}

export async function getEvents(jobId: string, since?: string): Promise<EventsResponse> {
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

export async function approveJob(jobId: string): Promise<void> {
  const client = createAuthClient()
  await client.post(`/jobs/${jobId}/approve`)
}

export async function rejectJob(jobId: string, reason?: string): Promise<void> {
  const client = createAuthClient()
  await client.post(`/jobs/${jobId}/reject`, { reason })
}

export async function cancelJob(jobId: string): Promise<void> {
  const client = createAuthClient()
  await client.post(`/jobs/${jobId}/cancel`)
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

export async function getFileUploadUrl(filename: string): Promise<FileUploadUrl> {
  const client = createAuthClient()
  const response = await client.get('/get-file-upload-url', {
    params: { filename }
  })
  return response.data
}

const uploadFileToStorage = async (url: string, file: File, fields?: Record<string, string>): Promise<void> => {
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

export async function uploadAsset(sessionId: string, file: File): Promise<Asset> {
  const client = createAuthClient()
  const uploadRes = await getFileUploadUrl(file.name)
  
  // The API returns the full S3 upload URL with all required fields
  const s3Url = uploadRes.url
  const formFields = uploadRes.fields
  
  await uploadFileToStorage(s3Url, file, formFields)
  
  // Construct CDN URL - fields.key is the S3 key
  const cdnUrl = `https://cdn.muapi.ai/${uploadRes.key || formFields?.key || ''}`
  const response = await client.post(`/sessions/${sessionId}/assets`, {
    url: cdnUrl,
    kind: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio',
    source_tool: 'upload',
    prompt: file.name
  })
  return response.data
}

export function pollEvents(
  jobId: string,
  onEvent: (event: EventItem) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): { stop: () => void } {
  let currentInterval = 1000
  let maxInterval = 30000
  let retries = 0
  let maxRetries = 300
  let cursor = 0
  let stopped = false

  const poll = async () => {
    if (stopped) return

    try {
      const response = await getEvents(jobId, cursor.toString())
      
      if (response.events.length > 0) {
        response.events.forEach(onEvent)
        cursor = response.cursor
      }

      if (response.done) {
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
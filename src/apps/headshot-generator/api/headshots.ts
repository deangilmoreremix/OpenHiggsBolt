import { callMuapi } from '@/api/muapi'
import { supabase } from '@/api/supabase'

export interface AspectRatio {
  label: string
  value: string
}

export interface PhotoPackBody {
  image_url: string
  category: string
  aspect_ratio: string
}

export interface PhotoPackResponse {
  request_id: string
}

export type CreationStatus = 'processing' | 'completed' | 'failed'

export interface CreationRecord {
  id: string
  request_id: string
  category: string
  aspectRatio: string
  status: CreationStatus
  imageUrl: string | null
  error: string | null
  isPack: boolean
  createdAt: string
}

export interface PredictionResult {
  status: string
  outputs?: string[]
  url?: string
  output?: { url?: string }
  error?: string
}

const STORAGE_KEY = 'headshot-creations'

function generateId(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return Boolean(url && !url.includes('placeholder'))
}

export async function generateHeadshot(body: PhotoPackBody): Promise<string> {
  const data = await callMuapi<PhotoPackResponse>('photo-pack', 'POST', body)
  if (!data.request_id) {
    throw new Error('No request ID received from photo-pack API')
  }
  return data.request_id
}

export async function pollPredictionResult(
  requestId: string,
  signal?: AbortSignal
): Promise<PredictionResult> {
  return new Promise((resolve, reject) => {
    let cancelled = false

    const cleanup = () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
    }

    signal?.addEventListener('abort', () => {
      cleanup()
      reject(new Error('Polling cancelled'))
    })

    let timeoutId: number | null = null

    const tick = async () => {
      if (cancelled) return

      try {
        const result = await callMuapi<PredictionResult>(`predictions/${requestId}/result`, 'GET')
        const status = result.status.toLowerCase()

        if (status === 'completed' || status === 'succeeded' || status === 'success') {
          cleanup()
          resolve(result)
          return
        }

        if (status === 'failed' || status === 'error') {
          cleanup()
          reject(new Error(result.error || 'Generation failed'))
          return
        }

        timeoutId = window.setTimeout(tick, 3000)
      } catch (err) {
        cleanup()
        reject(err)
      }
    }

    tick()
  })
}

export function extractImageUrls(result: PredictionResult): string[] {
  const outputs = result.outputs
  if (Array.isArray(outputs) && outputs.length > 0) {
    return outputs
  }

  const single = result.url ?? result.output?.url
  if (single) {
    return [single]
  }

  return []
}

export function parseImageUrls(imageUrl: string | null | undefined): string[] {
  if (!imageUrl) return []
  try {
    const parsed = JSON.parse(imageUrl) as unknown
    if (Array.isArray(parsed)) return parsed as string[]
  } catch {
    // fall through
  }
  return [imageUrl]
}

function recordToDb(record: CreationRecord): Record<string, unknown> {
  return {
    category: record.category,
    aspect_ratio: record.aspectRatio,
    request_id: record.request_id,
    status: record.status,
    image_url: record.imageUrl,
    error: record.error,
    is_pack: record.isPack,
    created_at: record.createdAt,
  }
}

function rowToRecord(row: Record<string, unknown>): CreationRecord {
  return {
    id: String(row.id ?? generateId()),
    request_id: String(row.request_id ?? ''),
    category: String(row.category ?? ''),
    aspectRatio: String(row.aspect_ratio ?? row.aspectRatio ?? '1:1'),
    status: (row.status as CreationStatus) ?? 'processing',
    imageUrl: row.image_url ? String(row.image_url) : null,
    error: row.error ? String(row.error) : null,
    isPack: Boolean(row.is_pack ?? row.isPack),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  }
}

export async function saveCreation(record: CreationRecord): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('creations').insert(recordToDb(record))
      if (error) throw error
      return
    } catch (err) {
      console.error('[Supabase saveCreation failed, falling back to localStorage]', err)
    }
  }

  const existing = loadLocalCreations()
  existing.unshift(record)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export async function updateCreation(record: CreationRecord): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('creations')
        .update(recordToDb(record))
        .eq('request_id', record.request_id)
      if (error) throw error
      return
    } catch (err) {
      console.error('[Supabase updateCreation failed, falling back to localStorage]', err)
    }
  }

  const existing = loadLocalCreations()
  const index = existing.findIndex((c) => c.request_id === record.request_id)
  if (index >= 0) {
    existing[index] = record
  } else {
    existing.unshift(record)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export async function loadCreations(): Promise<CreationRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('creations')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<Record<string, unknown>[]>()
      if (error) throw error
      return (data ?? []).map(rowToRecord)
    } catch (err) {
      console.error('[Supabase loadCreations failed, falling back to localStorage]', err)
    }
  }

  return loadLocalCreations()
}

export async function clearCreations(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('creations').delete().neq('request_id', '')
      if (error) throw error
      return
    } catch (err) {
      console.error('[Supabase clearCreations failed, falling back to localStorage]', err)
    }
  }

  localStorage.removeItem(STORAGE_KEY)
}

function loadLocalCreations(): CreationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => rowToRecord(item as Record<string, unknown>))
  } catch {
    return []
  }
}

export function buildCreationRecord(
  requestId: string,
  category: string,
  aspectRatio: string
): CreationRecord {
  return {
    id: generateId(),
    request_id: requestId,
    category,
    aspectRatio,
    status: 'processing',
    imageUrl: null,
    error: null,
    isPack: false,
    createdAt: new Date().toISOString(),
  }
}

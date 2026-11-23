// Storyboard panels from OpenAI image models. The OpenAI key lives on the server (saved in Settings), so these
// calls only need the signed-in session; see app/api/storyboard/openai/route.ts.

const OPENAI_STORYBOARD_URL = '/api/storyboard/openai'

export interface OpenAiStoryboardModel {
  id: string
  label: string
}

export interface OpenAiPanelOptions {
  prompt: string
  aspect_ratio: '16:9' | '9:16' | '1:1'
  model?: string
  quality?: 'low' | 'medium' | 'high'
  /** Sketch, character sheets or other images that should shape the panel. */
  reference_urls?: string[]
  /** The existing panel to change, for an edit. */
  image_url?: string
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return typeof data?.error === 'string' && data.error ? data.error : fallback
  } catch {
    return fallback
  }
}

/** Which OpenAI image models this deployment offers, and the default. Falls back to a single "default" entry. */
export async function listOpenAiStoryboardModels(): Promise<{ models: OpenAiStoryboardModel[]; default: string }> {
  try {
    const res = await fetch(OPENAI_STORYBOARD_URL, { credentials: 'same-origin' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data?.models) && data.models.length) return { models: data.models, default: data.default || data.models[0].id }
    }
  } catch {
    // fall through
  }
  return { models: [{ id: '', label: 'Default' }], default: '' }
}

/** Generate (or edit) one panel and resolve with its image URL (a data: URL when OpenAI returns the bytes). */
export async function generateOpenAiPanel(options: OpenAiPanelOptions): Promise<string> {
  const { model, ...rest } = options
  const res = await fetch(OPENAI_STORYBOARD_URL, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...rest, ...(model ? { model } : {}) }),
  })
  if (!res.ok) throw new Error(await readError(res, 'Panel generation failed'))
  const data = await res.json()
  const url = data?.urls?.[0]
  if (typeof url !== 'string' || !url) throw new Error('The image service returned no panel. Try again.')
  return url
}

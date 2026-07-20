function getSupabaseUrl(): string | undefined {
  // Next.js / Node
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  }
  // Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_SUPABASE_URL
  }
  return undefined
}

const OPENAI_FUNCTION_URL = getSupabaseUrl()
  ? `${getSupabaseUrl()}/functions/v1/enhance-prompt`
  : '/.netlify/functions/enhance-prompt'

/**
 * Resolve the user's own OpenAI key (BYOK). Users add their key in Settings;
 * it is persisted to localStorage 'openai_key' (and mirrored to a global for
 * non-browser callers). This function talks to a Supabase Edge Function via
 * plain fetch, so — unlike axios requests — it does not pick up the global
 * `x-openai-key` interceptor and must attach the key itself.
 */
function getUserOpenAiKey(): string {
  if (typeof window !== 'undefined') {
    const w = window as unknown as { __OPENAI_KEY__?: string }
    const fromGlobal = w.__OPENAI_KEY__
    if (fromGlobal && fromGlobal.trim()) return fromGlobal.trim()
    try {
      const fromStorage = window.localStorage?.getItem('openai_key')
      if (fromStorage && fromStorage.trim()) return fromStorage.trim()
    } catch {
      // localStorage may be unavailable (SSR / privacy mode); ignore.
    }
  }
  return ''
}

/**
 * Call OpenAI via Supabase Edge Function to generate/enhance text.
 * Forwards the user's own OpenAI key (BYOK) via the `x-openai-key` header.
 */
export async function callOpenAI(
  prompt: string,
  mode: 'enhance' | 'script' | 'campaign' = 'enhance'
): Promise<{ text: string; model: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const userKey = getUserOpenAiKey()
  if (userKey) headers['x-openai-key'] = userKey

  const response = await fetch(OPENAI_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, mode }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `OpenAI error: ${response.status}`)
  }

  return response.json()
}

/**
 * Enhance a video prompt using AI
 */
export async function enhancePrompt(prompt: string): Promise<string> {
  const result = await callOpenAI(prompt, 'enhance')
  return result.text
}

/**
 * Generate a video script from a description
 */
export async function generateScript(description: string): Promise<string> {
  const result = await callOpenAI(description, 'script')
  return result.text
}

/**
 * Generate campaign copy from a description
 */
export async function generateCampaignCopy(description: string): Promise<string> {
  const result = await callOpenAI(description, 'campaign')
  return result.text
}

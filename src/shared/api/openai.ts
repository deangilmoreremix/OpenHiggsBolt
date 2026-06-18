const OPENAI_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhance-prompt`
  : '/.netlify/functions/enhance-prompt'

const OPENAI_CHAT_URL = '/.netlify/functions/openai/chat/completions'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

/**
 * Generic OpenAI chat completions client.
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<{ text: string; model: string; raw: any }> {
  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model || 'gpt-4o-mini',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens,
      stream: options.stream ?? false,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `OpenAI error: ${response.status}`)
  }

  const raw = await response.json()
  const text = raw.choices?.[0]?.message?.content || ''
  return { text, model: raw.model || options.model || 'gpt-4o-mini', raw }
}

/**
 * Call OpenAI via Supabase Edge Function to generate/enhance text
 */
export async function callOpenAI(
  prompt: string,
  mode: 'enhance' | 'script' | 'campaign' = 'enhance'
): Promise<{ text: string; model: string }> {
  const response = await fetch(OPENAI_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

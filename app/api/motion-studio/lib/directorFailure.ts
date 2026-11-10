import { NextResponse } from 'next/server'

/**
 * Every way the director can fail, with the real cause: the client shows it (and never swaps in an unrelated template
 * silently). OpenAI's own status and message travel with the error.
 */
export function directorFailure(err: unknown): NextResponse {
  const status = (err as { status?: number })?.status
  const message = err instanceof Error ? err.message : 'The director failed'
  const name = err instanceof Error ? err.name : ''
  const reply = (code: string, http: number, error: string) => NextResponse.json({ error, code, ...(status ? { upstreamStatus: status } : {}) }, { status: http })
  if (status === 401 || status === 403) return reply('OPENAI_KEY_REJECTED', 401, `OpenAI rejected the API key (HTTP ${status}): ${message}`)
  if (status === 429) return reply('OPENAI_RATE_LIMITED', 429, `OpenAI rate limit or quota reached (HTTP 429): ${message}`)
  if (name === 'TimeoutError' || name === 'AbortError') return reply('DIRECTOR_TIMEOUT', 504, 'The director did not answer within 55 seconds.')
  if (status && status >= 500) return reply('OPENAI_UNAVAILABLE', 502, `OpenAI is unavailable (HTTP ${status}): ${message}`)
  if (status) return reply('OPENAI_REQUEST_REJECTED', 502, `OpenAI rejected the request (HTTP ${status}), for example an unknown model or a bad request: ${message}`)
  if (err instanceof SyntaxError) return reply('BAD_OUTPUT', 502, 'The director returned text that is not valid JSON.')
  return reply('DIRECTOR_FAILED', 502, message)
}


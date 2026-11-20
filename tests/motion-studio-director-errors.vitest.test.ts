import { describe, expect, it } from 'vitest'
import { directorFailure } from '@/app/api/motion-studio/lib/directorFailure'

const err = (message: string, extra: Record<string, unknown> = {}) => Object.assign(new Error(message), extra)
const read = async (e: unknown) => {
  const res = directorFailure(e)
  return { status: res.status, body: await res.json() }
}

describe('the director reports the real cause', () => {
  it('a rejected key', async () => {
    const r = await read(err('Incorrect API key', { status: 401 }))
    expect(r.status).toBe(401)
    expect(r.body).toMatchObject({ code: 'OPENAI_KEY_REJECTED', upstreamStatus: 401 })
    expect(r.body.error).toMatch(/Incorrect API key/)
  })

  it('a rate limit stays a 429 with its own code, not a generic 502', async () => {
    const r = await read(err('You exceeded your current quota', { status: 429 }))
    expect(r.status).toBe(429)
    expect(r.body).toMatchObject({ code: 'OPENAI_RATE_LIMITED', upstreamStatus: 429 })
  })

  it('an OpenAI outage', async () => {
    const r = await read(err('The server had an error', { status: 503 }))
    expect(r.status).toBe(502)
    expect(r.body).toMatchObject({ code: 'OPENAI_UNAVAILABLE', upstreamStatus: 503 })
  })

  it('an unknown model or bad request carries OpenAI\'s message', async () => {
    const r = await read(err('The model `gpt-6-astra` does not exist', { status: 404 }))
    expect(r.body.code).toBe('OPENAI_REQUEST_REJECTED')
    expect(r.body.error).toMatch(/gpt-6-astra/)
  })

  it('a timeout', async () => {
    const e = new Error('The operation timed out')
    e.name = 'TimeoutError'
    expect((await read(e)).body.code).toBe('DIRECTOR_TIMEOUT')
  })

  it('malformed model output', async () => {
    expect((await read(new SyntaxError('Unexpected token'))).body.code).toBe('BAD_OUTPUT')
  })

  it('anything else keeps its message', async () => {
    const r = await read(new Error('The director returned too few usable scenes'))
    expect(r.body).toMatchObject({ code: 'DIRECTOR_FAILED', error: 'The director returned too few usable scenes' })
  })
})

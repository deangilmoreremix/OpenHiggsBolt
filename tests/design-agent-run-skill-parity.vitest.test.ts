import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('../app/api/design-agent/lib/auth', () => ({
  getDesignAgentApiKey: vi.fn(async () => 'test-da-key'),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/design-agent/run-skill parity', () => {
  it('resolves the skill primary input and defaults to gpt-5-mini', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/agent-skills')) {
        return new Response(
          JSON.stringify([
            { name: 'logo-design', inputs: ['brief'] },
          ]),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }

      return new Response(
        JSON.stringify({ job_id: 'job_1', status: 'pending' }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)

    const { POST } = await import('../app/api/design-agent/run-skill/route')
    const req = new NextRequest('http://localhost/api/design-agent/run-skill', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-da-key',
      },
      body: JSON.stringify({
        sessionId: 'sess/1',
        skill_name: 'logo-design',
        messages_snapshot: [
          {
            role: 'user',
            content: 'Create a premium black-and-gold logo\n\n[Attached asset_1 (image)]\n\n[Mode: agent]',
          },
        ],
      }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ job_id: 'job_1', status: 'pending' })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const [skillsUrl, skillsInit] = fetchMock.mock.calls[0]
    expect(String(skillsUrl)).toBe('https://api.muapi.ai/api/v1/creative-agent/agent-skills')
    expect((skillsInit as RequestInit).headers).toHaveProperty('x-api-key', 'test-da-key')

    const [runSkillUrl, runSkillInit] = fetchMock.mock.calls[1]
    expect(String(runSkillUrl)).toBe('https://api.muapi.ai/api/v1/creative-agent/sessions/sess%2F1/run-skill')
    const payload = JSON.parse(String((runSkillInit as RequestInit).body))
    expect(payload.model).toBe('gpt-5-mini')
    expect(payload.inputs).toEqual({ brief: 'Create a premium black-and-gold logo' })
    expect(payload.messages_snapshot).toHaveLength(1)
  })

  it('preserves explicit inputs supplied by the client', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(
      JSON.stringify({ job_id: 'job_2', status: 'pending' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ))
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)

    const { POST } = await import('../app/api/design-agent/run-skill/route')
    const req = new NextRequest('http://localhost/api/design-agent/run-skill', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'sess_2',
        skill_name: 'fashion-try-on',
        inputs: { person_image: 'asset_1', clothing_image: 'asset_2' },
        model: 'gpt-5-mini',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const payload = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))
    expect(payload.inputs).toEqual({ person_image: 'asset_1', clothing_image: 'asset_2' })
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const SANDBOX_KEY = '5c0dc3a2146315592368336e8ee102087853022254158331a48cd0cd8528cec9'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/design-agent/run-skill parity', () => {
  it('resolves the skill primary input and defaults to gpt-5-mini', async () => {
    vi.resetModules()

    vi.doMock('../app/api/design-agent/lib/auth', () => ({
      getDesignAgentApiKey: vi.fn(async () => SANDBOX_KEY),
    }))

    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: 'test-user' })),
    }))

    vi.doMock('../app/api/design-agent/lib/ownership', () => ({
      requireOwnership: vi.fn(async () => ({ userId: 'test-user' })),
      recordOwnership: vi.fn(async () => {}),
      getOwnerId: vi.fn(async () => 'test-user'),
    }))

    vi.doMock('@/access/apiRequireEntitlement', () => ({
      requireApiEntitlement: vi.fn(async () => ({ allowed: true })),
      entitlementForbiddenResponse: vi.fn(() => new Response('Forbidden', { status: 403 })),
    }))

    vi.doMock('@/src/lib/supabaseServer', () => ({
      getSupabaseAdmin: vi.fn(() => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          upsert: () => ({ error: null }),
        }),
      })),
    }))

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
        'x-api-key': SANDBOX_KEY,
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
    expect((skillsInit as RequestInit).headers).toHaveProperty('x-api-key', SANDBOX_KEY)

    const [runSkillUrl, runSkillInit] = fetchMock.mock.calls[1]
    expect(String(runSkillUrl)).toBe('https://api.muapi.ai/api/v1/creative-agent/sessions/sess%2F1/run-skill')
    const payload = JSON.parse(String((runSkillInit as RequestInit).body))
    expect(payload.model).toBe('gpt-5-mini')
    expect(payload.inputs).toEqual({ brief: 'Create a premium black-and-gold logo' })
    expect(payload.messages_snapshot).toHaveLength(1)
  })

  it('preserves explicit inputs supplied by the client', async () => {
    vi.resetModules()

    vi.doMock('../app/api/design-agent/lib/auth', () => ({
      getDesignAgentApiKey: vi.fn(async () => SANDBOX_KEY),
    }))

    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: 'test-user' })),
    }))

    vi.doMock('../app/api/design-agent/lib/ownership', () => ({
      requireOwnership: vi.fn(async () => ({ userId: 'test-user' })),
      recordOwnership: vi.fn(async () => {}),
      getOwnerId: vi.fn(async () => 'test-user'),
    }))

    vi.doMock('@/access/apiRequireEntitlement', () => ({
      requireApiEntitlement: vi.fn(async () => ({ allowed: true })),
      entitlementForbiddenResponse: vi.fn(() => new Response('Forbidden', { status: 403 })),
    }))

    vi.doMock('@/src/lib/supabaseServer', () => ({
      getSupabaseAdmin: vi.fn(() => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          upsert: () => ({ error: null }),
        }),
      })),
    }))

    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ job_id: 'job_2', status: 'pending' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ))
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)

    const { POST } = await import('../app/api/design-agent/run-skill/route')
    const req = new NextRequest('http://localhost/api/design-agent/run-skill', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': SANDBOX_KEY },
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

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  runProxy,
  buildTargetUrl,
  backoffDelay,
  MAX_ATTEMPTS,
  RETRY_STATUSES,
  BACKOFF_MS,
} from '../app/api/design-agent/_proxyCore.js'

function makeResponse({ status = 200, body = '', headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `Status ${status}`,
    headers: new Headers(headers),
    body,
  }
}

describe('design-agent proxy', () => {
  it('retries up to 3 times on 503 and then returns success', async () => {
    let calls = 0
    const fetchImpl = async () => {
      calls += 1
      if (calls < 3) return makeResponse({ status: 503, body: 'unavailable' })
      return makeResponse({ status: 200, body: 'ok' })
    }
    const res = await runProxy('https://api.muapi.ai/api/v1/creative-agent/sessions', {}, { fetchImpl })
    assert.equal(calls, MAX_ATTEMPTS, 'should attempt exactly 3 times before success')
    assert.equal(res.status, 200)
  })

  it('returns the last 503 response after 3 attempts when all fail', async () => {
    let calls = 0
    const fetchImpl = async () => {
      calls += 1
      return makeResponse({ status: 503, body: 'still down' })
    }
    const res = await runProxy('https://api.muapi.ai/api/v1/creative-agent/sessions', {}, { fetchImpl })
    assert.equal(calls, MAX_ATTEMPTS)
    assert.equal(res.status, 503)
  })

  it('does not retry on non-retryable statuses (e.g. 400)', async () => {
    let calls = 0
    const fetchImpl = async () => {
      calls += 1
      return makeResponse({ status: 400, body: 'bad request' })
    }
    const res = await runProxy('https://api.muapi.ai/api/v1/creative-agent/sessions', {}, { fetchImpl })
    assert.equal(calls, 1, '400 should not be retried')
    assert.equal(res.status, 400)
  })

  it('retries on 429, 502, 503, and 504', () => {
    for (const status of [429, 502, 503, 504]) {
      assert.ok(RETRY_STATUSES.has(status), `${status} should be retryable`)
    }
  })

  it('honors Retry-After header (in seconds) on 429', async () => {
    const t0 = Date.now()
    let calls = 0
    const fetchImpl = async () => {
      calls += 1
      if (calls === 1) {
        return makeResponse({ status: 429, headers: { 'Retry-After': '1' } })
      }
      return makeResponse({ status: 200, body: 'ok' })
    }
    const res = await runProxy('https://api.muapi.ai/api/v1/creative-agent/sessions', {}, { fetchImpl })
    const elapsed = Date.now() - t0
    assert.equal(res.status, 200)
    assert.equal(calls, 2)
    assert.ok(elapsed >= 900, `expected ~1000ms wait, got ${elapsed}ms`)
    assert.ok(elapsed < 3000, `should not take much longer than Retry-After, got ${elapsed}ms`)
  })

  it('falls back to exponential backoff when Retry-After is absent', async () => {
    const t0 = Date.now()
    let calls = 0
    const fetchImpl = async () => {
      calls += 1
      if (calls < 3) return makeResponse({ status: 502 })
      return makeResponse({ status: 200 })
    }
    await runProxy('https://api.muapi.ai/api/v1/creative-agent/sessions', {}, { fetchImpl })
    const elapsed = Date.now() - t0
    const expected = BACKOFF_MS[0] + BACKOFF_MS[1]
    assert.ok(elapsed >= expected - 50, `expected >= ${expected}ms backoff, got ${elapsed}ms`)
  })

  it('builds target URL with path segments and query params', () => {
    const url = buildTargetUrl(
      ['sessions', 'abc-123', 'jobs'],
      [['limit', '10'], ['cursor', 'x y']],
    )
    assert.equal(
      url,
      'https://api.muapi.ai/api/v1/creative-agent/sessions/abc-123/jobs?limit=10&cursor=x+y',
    )
  })

  it('builds target URL without query string when none provided', () => {
    const url = buildTargetUrl(['agent-skills'])
    assert.equal(url, 'https://api.muapi.ai/api/v1/creative-agent/agent-skills')
  })

  it('skips empty path segments', () => {
    const url = buildTargetUrl(['', 'jobs', '', 'j-1', 'events'])
    assert.equal(url, 'https://api.muapi.ai/api/v1/creative-agent/jobs/j-1/events')
  })

  it('backoffDelay returns 500/1000/2000 for non-429 statuses', () => {
    for (const status of [502, 503, 504]) {
      assert.equal(backoffDelay(status, null, 0), BACKOFF_MS[0])
      assert.equal(backoffDelay(status, null, 1), BACKOFF_MS[1])
      assert.equal(backoffDelay(status, null, 2), BACKOFF_MS[2])
      assert.equal(backoffDelay(status, null, 99), BACKOFF_MS[BACKOFF_MS.length - 1])
    }
  })

  it('backoffDelay prefers Retry-After over exponential backoff for 429', () => {
    const res = makeResponse({ status: 429, headers: { 'Retry-After': '3' } })
    assert.equal(backoffDelay(429, res, 0), 3000)
  })
})

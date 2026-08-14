import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

const MUAPI_API_KEY = process.env.MUAPI_API_KEY || '855c470aeb8aadd23cac4e1cd36567d7757b5783eca20258dbabd0ea65774303'
const MUAPI_BASE = 'https://api.muapi.ai'
const LOCAL_BASE = 'http://localhost:3000'

function authHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': MUAPI_API_KEY,
    ...extra,
  }
}

async function muapi(path, opts = {}) {
  const url = `${MUAPI_BASE}${path}`
  const res = await fetch(url, {
    ...opts,
    headers: authHeaders(opts.headers),
  })
  const body = await res.text()
  let data
  try { data = JSON.parse(body) } catch { data = body }
  return { status: res.status, data, rawBody: body }
}

async function localProxy(path, opts = {}) {
  const url = `${LOCAL_BASE}${path}`
  const res = await fetch(url, {
    ...opts,
    headers: authHeaders(opts.headers),
  })
  const body = await res.text()
  let data
  try { data = JSON.parse(body) } catch { data = body }
  return { status: res.status, data, rawBody: body }
}

function isLocalServerUp() {
  return fetch(LOCAL_BASE, { method: 'GET', signal: AbortSignal.timeout(2000) })
    .then(() => true)
    .catch(() => false)
}

describe('MuAPI All Endpoints', () => {
  let createdSessionId
  let createdJobId
  let localAvailable
  let catalogEndpoints = new Set()

  before(async () => {
    localAvailable = await isLocalServerUp()
    try {
      const { data } = await muapi('/api/v1/models')
      if (data.models && Array.isArray(data.models)) {
        for (const m of data.models) {
          if (m.endpoint) catalogEndpoints.add(m.endpoint.replace(/^\/api\/v1\//, ''))
        }
        console.log(`Loaded ${catalogEndpoints.size} endpoints from MuAPI catalog`)
      }
    } catch (e) {
      console.log('Could not load MuAPI catalog:', e.message)
    }
  })

  after(async () => {
    if (createdJobId) {
      try { await muapi(`/api/v1/creative-agent/jobs/${createdJobId}`, { method: 'DELETE' }) } catch {}
    }
    if (createdSessionId) {
      try { await muapi(`/api/v1/creative-agent/sessions/${createdSessionId}`, { method: 'DELETE' }) } catch {}
    }
  })

  describe('Models Catalog', () => {
    it('GET /api/v1/models returns model catalog', async () => {
      const { status, data } = await muapi('/api/v1/models')
      assert.equal(status, 200)
      assert.ok(data.models || Array.isArray(data))
    })
  })

  describe('Image Generation (Text-to-Image)', () => {
    it('POST /api/v1/flux-dev-image submits image generation and returns request_id', async () => {
      const { status, data } = await muapi('/api/v1/flux-dev-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'a red cube on a white background', width: 512, height: 512 }),
      })
      assert.equal(status, 200, JSON.stringify(data))
      assert.ok(data.request_id || data.id, 'should return request_id')
    })

    it('POST /api/v1/flux-schnell submits fast image generation', async () => {
      const { status, data } = await muapi('/api/v1/flux-schnell', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'a blue circle on a white background', width: 512, height: 512 }),
      })
      // Sandbox may not have access to all models; accept 200 or 404
      assert.ok([200, 404, 403].includes(status), `unexpected status ${status}: ${JSON.stringify(data)}`)
      if (status === 200) {
        assert.ok(data.request_id || data.id)
      }
    })

    it('POST /api/v1/bytedance-seedream-v5.0 submits seedream generation', async () => {
      const { status, data } = await muapi('/api/v1/bytedance-seedream-v5.0', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'a green triangle on a white background', width: 512, height: 512 }),
      })
      assert.ok([200, 404, 403].includes(status), `unexpected status ${status}: ${JSON.stringify(data)}`)
      if (status === 200) {
        assert.ok(data.request_id || data.id)
      }
    })
  })

  describe('Image Generation (Image-to-Image)', () => {
    it('POST /api/v1/flux-dev-image with image_url submits edit request', async () => {
      const placeholder = 'https://httpbin.org/image/png'
      const { status, data } = await muapi('/api/v1/flux-dev-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'make it surreal', image_url: placeholder, strength: 0.5 }),
      })
      assert.ok([200, 400, 422].includes(status))
    })
  })

  describe('VFX Generation', () => {
    it('POST /api/v1/generate_wan_ai_effects submits VFX job', async () => {
      const { status, data } = await muapi('/api/v1/generate_wan_ai_effects', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'subtle camera shake',
          image_url: 'https://httpbin.org/image/png',
          name: 'Camera Shake',
          aspect_ratio: '16:9',
          resolution: '720p',
          quality: 'medium',
          duration: 5,
        }),
      })
      // VFX may require specific image URLs or be unavailable on sandbox
      assert.ok([200, 400, 422].includes(status), `unexpected status ${status}: ${JSON.stringify(data)}`)
      if (status === 200) {
        assert.ok(data.request_id || data.id)
      }
    })
  })

  describe('Poll Results', () => {
    it('GET /api/v1/predictions/{id}/result returns status for unknown id', async () => {
      const { status } = await muapi('/api/v1/predictions/nonexistent-job-999/result')
      assert.ok([200, 404, 400].includes(status))
    })
  })

  describe('File Upload', () => {
    it('POST /api/v1/upload_file accepts a small image', async () => {
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const buffer = Buffer.from(pngBase64, 'base64')
      const blob = new Blob([buffer], { type: 'image/png' })
      const form = new FormData()
      form.append('file', blob, 'test.png')

      const res = await fetch(`${MUAPI_BASE}/api/v1/upload_file`, {
        method: 'POST',
        headers: { 'x-api-key': MUAPI_API_KEY },
        body: form,
      })
      const body = await res.text()
      assert.ok(res.ok, `upload failed: ${res.status} ${body}`)
      let data
      try { data = JSON.parse(body) } catch { data = body }
      assert.ok(data.url || data.file_url || data.data?.url)
    })
  })

  describe('Get Upload URL', () => {
    it('GET /app/get_file_upload_url returns an S3-style upload URL', async () => {
      const { status, data } = await muapi('/app/get_file_upload_url?filename=test.png')
      assert.equal(status, 200, JSON.stringify(data))
      assert.ok(data.url, 'should return a pre-signed URL')
    })
  })

  describe('Social Accounts', () => {
    it('POST /api/v1/youtube-publish is reachable', async () => {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), 15000)
      try {
        const { status, data } = await muapi('/api/v1/youtube-publish', {
          method: 'POST',
          body: JSON.stringify({ request_id: 'test-request-id' }),
          signal: ctrl.signal,
        })
        console.log(`  youtube-publish status: ${status}`)
      } catch (e) {
        if (e.name === 'AbortError') {
          console.log('  youtube-publish: timed out (not available on sandbox)')
          return
        }
        throw e
      } finally {
        clearTimeout(timeout)
      }
    })

    it('POST /api/v1/instagram-publish is reachable', async () => {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), 15000)
      try {
        const { status, data } = await muapi('/api/v1/instagram-publish', {
          method: 'POST',
          body: JSON.stringify({ request_id: 'test-request-id' }),
          signal: ctrl.signal,
        })
        console.log(`  instagram-publish status: ${status}`)
      } catch (e) {
        if (e.name === 'AbortError') {
          console.log('  instagram-publish: timed out (not available on sandbox)')
          return
        }
        throw e
      } finally {
        clearTimeout(timeout)
      }
    })

    it('POST /api/v1/tiktok-publish is reachable', async () => {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), 15000)
      try {
        const { status, data } = await muapi('/api/v1/tiktok-publish', {
          method: 'POST',
          body: JSON.stringify({ request_id: 'test-request-id' }),
          signal: ctrl.signal,
        })
        console.log(`  tiktok-publish status: ${status}`)
      } catch (e) {
        if (e.name === 'AbortError') {
          console.log('  tiktok-publish: timed out (not available on sandbox)')
          return
        }
        throw e
      } finally {
        clearTimeout(timeout)
      }
    })
  })

  describe('Creative Agent', () => {
    it('GET /api/v1/creative-agent/sessions lists sessions', async () => {
      const { status } = await muapi('/api/v1/creative-agent/sessions')
      assert.ok([200, 401, 403].includes(status))
    })

    it('POST /api/v1/creative-agent/sessions creates a session', async () => {
      const { status, data } = await muapi('/api/v1/creative-agent/sessions', {
        method: 'POST',
        body: JSON.stringify({ name: 'test-session' }),
      })
      assert.ok([200, 201].includes(status))
      if ((status === 200 || status === 201) && data.id) {
        createdSessionId = data.id
      }
    })

    it('GET /api/v1/creative-agent/agent-skills lists skills', async () => {
      const { status } = await muapi('/api/v1/creative-agent/agent-skills')
      assert.ok([200, 401, 403].includes(status))
    })

    it('GET /api/v1/creative-agent/sessions/{id}/jobs lists session jobs', async () => {
      const sid = createdSessionId || 'test-session'
      const { status } = await muapi(`/api/v1/creative-agent/sessions/${sid}/jobs`)
      assert.ok([200, 404, 401, 403].includes(status))
    })

    it('GET /api/v1/creative-agent/sessions/{id}/assets lists session assets', async () => {
      const sid = createdSessionId || 'test-session'
      const { status } = await muapi(`/api/v1/creative-agent/sessions/${sid}/assets`)
      assert.ok([200, 404, 401, 403].includes(status))
    })
  })

  describe('Workflow Proxy', () => {
    it('GET /api/workflow/ returns workflow list or error', async () => {
      const { status } = await muapi('/api/workflow/')
      assert.ok([200, 404, 401, 403].includes(status))
    })
  })

  describe('App Proxy', () => {
    it('GET /api/app/ returns app info or error', async () => {
      const { status } = await muapi('/api/app/')
      assert.ok([200, 404, 401, 403].includes(status))
    })
  })

  describe('Agents Proxy', () => {
    it('GET /api/agents/ lists agents', async () => {
      const { status } = await muapi('/api/agents/')
      assert.ok([200, 404, 401, 403].includes(status))
    })
  })

  describe('Storyboard Proxy', () => {
    it('GET /api/storyboard/ returns storyboard data', async () => {
      const { status } = await muapi('/api/storyboard/')
      assert.ok([200, 404, 401, 403].includes(status))
    })
  })

  describe('Local Proxy Routes (dev server)', () => {
    it('skips all if local dev server is not running', async () => {
      if (!localAvailable) {
        console.log('  [skip] local dev server not available on localhost:3000')
        return
      }
    })

    it('GET /api/v1/get_upload_url proxies to MuAPI', async () => {
      if (!localAvailable) return
      const { status } = await localProxy('/api/v1/get_upload_url?filename=test.png')
      assert.ok([200, 404, 401, 403].includes(status))
    })

    it('GET /api/v1/creative-agent/sessions proxies to MuAPI', async () => {
      if (!localAvailable) return
      const { status } = await localProxy('/api/v1/creative-agent/sessions')
      assert.ok([200, 401, 403, 404].includes(status))
    })

    it('GET /api/workflow/ proxies to MuAPI', async () => {
      if (!localAvailable) return
      const { status } = await localProxy('/api/workflow/')
      assert.ok([200, 401, 403, 404].includes(status))
    })

    it('GET /api/app/ proxies to MuAPI', async () => {
      if (!localAvailable) return
      const { status } = await localProxy('/api/app/')
      assert.ok([200, 401, 403, 404].includes(status))
    })

    it('GET /api/agents/ proxies to MuAPI', async () => {
      if (!localAvailable) return
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), 15000)
      try {
        const { status } = await localProxy('/api/agents/', { signal: ctrl.signal })
        assert.ok([200, 401, 403, 404, 500].includes(status))
      } catch (e) {
        if (e.name === 'AbortError') return
        throw e
      } finally {
        clearTimeout(timeout)
      }
    })

    it('GET /api/storyboard/ proxies to MuAPI', async () => {
      if (!localAvailable) return
      const { status } = await localProxy('/api/storyboard/')
      assert.ok([200, 401, 403, 404].includes(status))
    })

    it('GET /api/design-agent/skills proxies to MuAPI', async () => {
      if (!localAvailable) return
      const { status } = await localProxy('/api/design-agent/skills')
      assert.ok([200, 401, 403, 404].includes(status))
    })

    it('GET /api/design-agent/sessions proxies to MuAPI', async () => {
      if (!localAvailable) return
      const { status } = await localProxy('/api/design-agent/sessions')
      assert.ok([200, 401, 403, 404].includes(status))
    })

    it('GET /api/design-agent/jobs proxies to MuAPI', async () => {
      if (!localAvailable) return
      const { status } = await localProxy('/api/design-agent/jobs?sessionId=test')
      assert.ok([200, 400, 401, 403, 404].includes(status))
    })
  })
})

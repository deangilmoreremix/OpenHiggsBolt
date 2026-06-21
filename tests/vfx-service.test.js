import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { MuAPIVFXClient } from '../lib/muapi.js'

// Minimal File polyfill for Node tests
class MockFile {
  constructor([content], name, options = {}) {
    this.content = content
    this.name = name
    this.type = options.type || ''
    this.size = content.length
  }
}

global.File = MockFile

describe('MuAPIVFXClient', () => {
  let originalFetch
  let originalXHR

  before(() => {
    originalFetch = global.fetch
    originalXHR = global.XMLHttpRequest
  })

  after(() => {
    global.fetch = originalFetch
    global.XMLHttpRequest = originalXHR
  })

  it('throws when no API key is provided', () => {
    process.env.MUAPI_API_KEY = ''
    assert.throws(() => new MuAPIVFXClient({ apiKey: '' }), /API key is required/)
  })

  it('generateVFX submits payload and returns request_id', async () => {
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://api.muapi.ai/api/v1/generate_wan_ai_effects')
      assert.equal(options.method, 'POST')
      const body = JSON.parse(options.body)
      assert.equal(body.name, 'Car Explosion')
      assert.equal(body.image_url, 'https://example.com/image.jpg')
      assert.equal(body.aspect_ratio, '16:9')
      assert.equal(body.resolution, '720p')
      assert.equal(body.quality, 'high')
      assert.equal(body.duration, 10)
      return {
        ok: true,
        async json() {
          return { request_id: 'job-123', status: 'queued' }
        },
      }
    }

    const client = new MuAPIVFXClient({ apiKey: 'test-key' })
    const result = await client.generateVFX({
      image_url: 'https://example.com/image.jpg',
      effect: 'Car Explosion',
      aspect_ratio: '16:9',
      resolution: '720p',
      quality: 'high',
      duration: 10,
    })

    assert.equal(result.request_id, 'job-123')
    assert.equal(result.status, 'queued')
  })

  it('pollGeneration resolves when status is completed and video_url present', async () => {
    let calls = 0
    global.fetch = async (url) => {
      assert.ok(url.includes('/predictions/job-456/result'))
      calls++
      return {
        ok: true,
        async json() {
          if (calls === 1) return { status: 'processing' }
          return { status: 'completed', outputs: ['https://muapi.ai/video.mp4'] }
        },
      }
    }

    const client = new MuAPIVFXClient({ apiKey: 'test-key', pollIntervalMs: 10, maxPollAttempts: 5 })
    const updates = []
    const result = await client.pollGeneration('job-456', (s) => updates.push(s.status))

    assert.equal(result.video_url, 'https://muapi.ai/video.mp4')
    assert.deepEqual(updates, ['processing', 'completed'])
  })

  it('pollGeneration throws when status is failed', async () => {
    global.fetch = async () => ({
      ok: true,
      async json() {
        return { status: 'failed', error: 'GPU out of memory' }
      },
    })

    const client = new MuAPIVFXClient({ apiKey: 'test-key', pollIntervalMs: 10, maxPollAttempts: 5 })
    await assert.rejects(() => client.pollGeneration('job-789'), /GPU out of memory/)
  })

  it('getGenerationResult normalizes outputs to video_url', async () => {
    global.fetch = async () => ({
      ok: true,
      async json() {
        return { status: 'completed', outputs: ['https://muapi.ai/out.mp4'] }
      },
    })

    const client = new MuAPIVFXClient({ apiKey: 'test-key' })
    const status = await client.getGenerationResult('job-abc')

    assert.equal(status.status, 'completed')
    assert.equal(status.video_url, 'https://muapi.ai/out.mp4')
  })

  it('uploadImage sends file via XMLHttpRequest and returns url', async () => {
    global.XMLHttpRequest = class MockXHR {
      constructor() {
        this.headers = {}
        this.method = null
        this.url = null
      }
      open(method, url) {
        this.method = method
        this.url = url
      }
      setRequestHeader(key, value) {
        this.headers[key] = value
      }
      send() {
        assert.equal(this.method, 'POST')
        assert.ok(this.url.includes('/upload_file'))
        assert.equal(this.headers['x-api-key'], 'test-key')
        this.status = 200
        this.responseText = JSON.stringify({ url: 'https://muapi.ai/uploads/img.jpg' })
        this.onload()
      }
    }

    const client = new MuAPIVFXClient({ apiKey: 'test-key' })
    const file = new File(['hello'], 'test.jpg', { type: 'image/jpeg' })
    const result = await client.uploadImage(file)

    assert.equal(result.url, 'https://muapi.ai/uploads/img.jpg')
    assert.equal(result.name, 'test.jpg')
  })

  it('uploadImage rejects on HTTP error', async () => {
    global.XMLHttpRequest = class MockXHR {
      open() {}
      setRequestHeader() {}
      send() {
        this.status = 403
        this.statusText = 'Forbidden'
        this.responseText = JSON.stringify({ error: 'Invalid key' })
        this.onload()
      }
    }

    const client = new MuAPIVFXClient({ apiKey: 'test-key' })
    const file = new File(['hello'], 'test.jpg', { type: 'image/jpeg' })
    await assert.rejects(() => client.uploadImage(file), /Invalid key/)
  })
})

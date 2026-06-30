import { describe, it, before, after, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { muapi, setApiKey } from '../lib/muapi.js'

// This test verifies that the muapi singleton's API key can be swapped at
// runtime via setApiKey(), and that the next outgoing request uses the
// updated `x-api-key` header. This protects against the historical bug
// where the key was bound at construction time and could not be changed
// after the user signed in/out.

describe('muapi setApiKey (multi-key)', () => {
  let originalFetch
  let calls
  let originalKey

  before(() => {
    originalFetch = global.fetch
    originalKey = process.env.MUAPI_API_KEY
    process.env.MUAPI_API_KEY = 'initial-key-from-env'
  })

  after(() => {
    global.fetch = originalFetch
    if (originalKey === undefined) {
      delete process.env.MUAPI_API_KEY
    } else {
      process.env.MUAPI_API_KEY = originalKey
    }
  })

  afterEach(() => {
    calls = undefined
  })

  function installMockFetch() {
    calls = []
    global.fetch = async (url, options = {}) => {
      calls.push({ url, headers: options.headers || {} })
      return {
        ok: true,
        status: 200,
        async json() { return { request_id: 'mock-1', status: 'queued' } },
      }
    }
  }

  it('uses the env-derived key on first request', async () => {
    installMockFetch()
    // Ensure a clean singleton state for this test.
    setApiKey(null)
    setApiKey('initial-key-from-env')
    await muapi.generateVFX({ prompt: 'p', image_url: 'u', effect: 'e' })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].headers['x-api-key'], 'initial-key-from-env')
  })

  it('updates the next request header after setApiKey', async () => {
    installMockFetch()
    setApiKey('user-A-key')
    await muapi.getGenerationResult('req-1')
    assert.equal(calls[0].headers['x-api-key'], 'user-A-key')

    setApiKey('user-B-key')
    await muapi.getGenerationResult('req-2')
    assert.equal(calls[1].headers['x-api-key'], 'user-B-key')
  })

  it('setApiKey(null) clears the key so the next request has no x-api-key', async () => {
    installMockFetch()
    setApiKey('user-C-key')
    await muapi.getGenerationResult('req-3')
    assert.equal(calls[0].headers['x-api-key'], 'user-C-key')

    setApiKey(null)
    await muapi.getGenerationResult('req-4')
    assert.equal(calls[1].headers['x-api-key'] || '', '')
  })

  it('muapi.setApiKey proxy works the same as the named export', async () => {
    installMockFetch()
    muapi.setApiKey('user-D-key')
    await muapi.getGenerationResult('req-5')
    assert.equal(calls[0].headers['x-api-key'], 'user-D-key')
  })
})

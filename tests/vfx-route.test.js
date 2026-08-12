import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { POST as cancelPOST } from '../app/api/vfx/cancel/route'
import { GET as statusGET } from '../app/api/vfx/status/route'

describe('VFX cancel/status route race guard', () => {
  let originalFetch
  let originalMuapiKey

  before(() => {
    originalFetch = global.fetch
    originalMuapiKey = process.env.MUAPI_API_KEY
    process.env.MUAPI_API_KEY = 'test-key'

    // Simulate the job having COMPLETED on MuAPI's side for ANY fetch.
    // The cancel route also probes fetch (best-effort probe) — this covers it.
    global.fetch = async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          status: 'completed',
          outputs: ['https://muapi.ai/video.mp4'],
          video_url: 'https://muapi.ai/video.mp4',
        }
      },
    })
  })

  after(() => {
    global.fetch = originalFetch
    process.env.MUAPI_API_KEY = originalMuapiKey
  })

  it('pre-cancel poll surfaces the completed MuAPI result', async () => {
    const statusReq = new NextRequest(
      new URL('http://localhost/api/vfx/status?id=JOB-2')
    )

    const res = await statusGET(statusReq)
    const json = await res.json()

    assert.equal(json.status, 'completed')
    assert.equal(json.video_url, 'https://muapi.ai/video.mp4')
  })

  it('cancel then poll returns cancelled and discards the completed result', async () => {
    const cancelReq = new NextRequest(
      new URL('http://localhost/api/vfx/cancel'),
      {
        method: 'POST',
        body: JSON.stringify({ request_id: 'JOB-1' }),
        headers: { 'content-type': 'application/json' },
      }
    )

    await cancelPOST(cancelReq)

    const statusReq = new NextRequest(
      new URL('http://localhost/api/vfx/status?id=JOB-1')
    )

    const res = await statusGET(statusReq)
    const json = await res.json()

    assert.equal(json.status, 'cancelled')
    assert.equal(json.video_url, undefined)
  })
})

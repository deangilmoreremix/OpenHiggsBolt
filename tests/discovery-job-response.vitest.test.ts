import { describe, it, expect } from 'vitest'
import { mergeDiscoveredAssets, buildDiscoveryJobResponse } from '@/server/discoveryJobResponse'

/**
 * The discovery job response is the contract the Personalization Modal polls.
 * These tests pin the two things that can silently lose a discovered asset:
 * the shape it is stored in, and the de-duplication key.
 */
describe('mergeDiscoveredAssets', () => {
  it('keeps a BUILT asset that carries sourceUrl', () => {
    const merged = mergeDiscoveredAssets(
      null,
      { discoveredAssets: [{ id: 'a1', sourceUrl: 'https://example.com/logo.png', category: 'logo' }] },
    )
    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({ id: 'a1', category: 'logo' })
  })

  it('keeps a RAW image candidate that carries url instead of sourceUrl', () => {
    // The browser layer persists raw candidates, which use `url`. Reading only
    // `sourceUrl` used to drop these and report an empty asset list for a job
    // that had really found images.
    const merged = mergeDiscoveredAssets(
      null,
      { discoveredAssets: [{ id: 'a1', url: 'https://example.com/logo.png' }] },
    )
    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({ id: 'a1', url: 'https://example.com/logo.png' })
  })

  it('keeps assets from BOTH the fast result and the final result', () => {
    const merged = mergeDiscoveredAssets(
      { discoveredAssets: [{ id: 'fast', sourceUrl: 'https://example.com/fast.png' }] },
      { discoveredAssets: [{ id: 'final', sourceUrl: 'https://example.com/final.png' }] },
    )
    expect(merged.map((a: any) => a.id)).toEqual(['fast', 'final'])
  })

  it('de-duplicates the same image that appears in both results', () => {
    const merged = mergeDiscoveredAssets(
      { discoveredAssets: [{ id: 'a', sourceUrl: 'https://example.com/logo.png' }] },
      { discoveredAssets: [{ id: 'b', sourceUrl: 'https://example.com/logo.png' }] },
    )
    expect(merged).toHaveLength(1)
    expect(merged[0].id).toBe('a')
  })

  it('treats a query-string variant of the same image as the same asset', () => {
    const merged = mergeDiscoveredAssets(
      null,
      {
        discoveredAssets: [
          { id: 'a', sourceUrl: 'https://example.com/logo.png' },
          { id: 'b', sourceUrl: 'https://example.com/logo.png?v=2' },
        ],
      },
    )
    expect(merged).toHaveLength(1)
  })

  it('ignores entries that carry no usable URL at all', () => {
    const merged = mergeDiscoveredAssets(
      null,
      { discoveredAssets: [{ id: 'no-url' }, null, 'not-an-object', { id: 'ok', sourceUrl: 'https://example.com/x.png' }] },
    )
    expect(merged).toHaveLength(1)
    expect(merged[0].id).toBe('ok')
  })

  it('returns an empty list when neither result carries assets', () => {
    expect(mergeDiscoveredAssets(null, null)).toEqual([])
    expect(mergeDiscoveredAssets({}, { discoveredAssets: [] })).toEqual([])
  })
})

describe('buildDiscoveryJobResponse', () => {
  const baseRow = {
    id: 'job-1',
    clerk_user_id: 'user-1',
    website_url: 'https://example.com',
    status: 'complete',
    fast_result_json: null,
    browser_result_json: null,
    final_result_json: null,
    telemetry_json: null,
    error_code: null,
    error_message: null,
    created_at: '2026-01-01T00:00:00Z',
    started_at: '2026-01-01T00:00:01Z',
    completed_at: '2026-01-01T00:00:02Z',
    expires_at: '2027-01-01T00:00:00Z',
  } as any

  it('reports the assets the job actually found, in the stored shape', () => {
    const response = buildDiscoveryJobResponse({
      ...baseRow,
      final_result_json: { discoveredAssets: [{ id: 'a1', url: 'https://example.com/logo.png' }] },
    } as any)

    expect(response.status).toBe('complete')
    expect(response.result?.discoveredAssets).toEqual([{ id: 'a1', url: 'https://example.com/logo.png' }])
  })

  it('still reports the static assets when the browser phase failed', () => {
    // The whole point of merging: a browser failure must not throw away the
    // assets the static layer already found.
    const response = buildDiscoveryJobResponse({
      ...baseRow,
      status: 'error',
      error_code: 'BROWSER_UNAVAILABLE',
      error_message: 'no browser in this runtime',
      fast_result_json: { discoveredAssets: [{ id: 'static', sourceUrl: 'https://example.com/static.png' }] },
      final_result_json: null,
    } as any)

    expect(response.status).toBe('error')
    expect(response.errorCode).toBe('BROWSER_UNAVAILABLE')
    expect(response.result?.discoveredAssets).toHaveLength(1)
    expect((response.result?.discoveredAssets as any[])[0].id).toBe('static')
  })

  it('marks a running job as browser-queued', () => {
    const response = buildDiscoveryJobResponse({ ...baseRow, status: 'running', completed_at: null } as any)
    expect(response.status).toBe('running')
    expect(response.browserQueued).toBe(true)
  })
})

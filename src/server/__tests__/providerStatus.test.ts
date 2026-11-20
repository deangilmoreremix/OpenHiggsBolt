import { describe, it, expect } from 'vitest'
import { summarizeProviders, GET } from '@/app/api/personalization/provider-status/route'

describe('provider status', () => {
  it('maps breaker state to ok / degraded / cooling-down / unknown', () => {
    expect(summarizeProviders({ tracked: 0, coolingDown: 0 }, { coolingDown: false, consecutiveFailures: 0 })).toEqual({ overpass: 'unknown', nominatim: 'ok' })
    expect(summarizeProviders({ tracked: 3, coolingDown: 0 }, { coolingDown: false, consecutiveFailures: 1 })).toEqual({ overpass: 'ok', nominatim: 'degraded' })
    expect(summarizeProviders({ tracked: 3, coolingDown: 1 }, { coolingDown: true, consecutiveFailures: 3 })).toEqual({ overpass: 'degraded', nominatim: 'cooling-down' })
    expect(summarizeProviders({ tracked: 3, coolingDown: 3 }, { coolingDown: false, consecutiveFailures: 0 }).overpass).toBe('cooling-down')
  })
  it('the endpoint exposes no URLs or error text and is not cacheable', async () => {
    const res = await GET()
    expect(res.headers.get('cache-control')).toBe('no-store')
    const body = await res.json()
    expect(Object.keys(body).sort()).toEqual(['checkedAt', 'ok', 'providers', 'scope'])
    expect(JSON.stringify(body)).not.toMatch(/https?:|overpass-api|nominatim\.openstreetmap/i)
  })
})

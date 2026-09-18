import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockAuth = vi.hoisted(() => vi.fn())
const mockOrchestrateDiscovery = vi.hoisted(() => vi.fn())

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))

vi.mock('@/server/discoveryOrchestrator', () => ({
  orchestrateDiscovery: mockOrchestrateDiscovery,
  buildDiscoveredAssetsFromCandidates: vi.fn(async (candidates: any[]) =>
    candidates.map((c: any) => ({
      id: `asset-${Math.random()}`,
      sourceUrl: c.url,
      previewUrl: c.url,
      sourceType: 'WEBSITE' as const,
      category: 'logo' as const,
      confidence: 50,
      qualityScore: 50,
      relevanceScore: 50,
      selected: false,
      recommended: false,
      rejected: false,
      assignedSection: null,
      autoAssigned: false,
    })),
  ),
}))

// @ts-ignore
import { POST } from '../../../app/api/personalization/discover-assets/route'

function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
  } as any
}

describe('discover-assets route cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user-1' })
  })

  it('caches failed Firecrawl result and does not invoke Firecrawl again within TTL', async () => {
    const failingResult = {
      providerUsed: 'STATIC_FALLBACK',
      providerAttempted: 'STATIC_FALLBACK',
      candidates: [],
      pagesCrawled: 0,
      rawCandidates: 0,
      duration: 100,
      socialProfiles: [],
      discoveredAssets: [],
      firecrawlUsed: false,
      providerAttempts: ['SMARTVIDEO_STATIC'],
      firecrawlSkippedReason: 'FREE_RESULTS_INSUFFICIENT',
      localUsefulAssetCount: 0,
      firecrawlUsefulAssetCount: 0,
      sitemapFound: false,
      crawleePagesCrawled: 0,
    }

    mockOrchestrateDiscovery.mockResolvedValue(failingResult)

    const request1 = createMockRequest({ websiteUrl: 'https://example.com', testMode: false })
    const response1 = await POST(request1)
    const data1 = await response1.json()

    expect(response1.status).toBe(200)
    expect(data1.ok).toBe(true)
    expect(data1.cached).toBe(false)
    expect(mockOrchestrateDiscovery).toHaveBeenCalledTimes(1)

    const request2 = createMockRequest({ websiteUrl: 'https://example.com', testMode: false })
    const response2 = await POST(request2)
    const data2 = await response2.json()

    expect(response2.status).toBe(200)
    expect(data2.ok).toBe(true)
    expect(data2.cached).toBe(true)
    expect(mockOrchestrateDiscovery).toHaveBeenCalledTimes(1)
  })
})

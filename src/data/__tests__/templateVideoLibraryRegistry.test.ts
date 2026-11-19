// Step 2 ("AI Demos") registry: the original catalogs (kept when their media is playable) plus the Template videos library,
// every clip labeled No logo / Has logo.
import { describe, it, expect } from 'vitest'
import { DEMO_LIBRARY_REGISTRY, demoCollections, EXCLUDED_DEMO_COLLECTIONS, toVideoDemo } from '../demoLibraryRegistry'
import { getDemoCategoryIds, DEMO_CATEGORIES, ALL_DEMOS_CATEGORY_ID } from '../../shared/personalization/guided/demoCategories'
import { templateVideos } from '../templateVideoLibrary.js'

const PLAYABLE = /^(https:\/\/bzxohkrxcwodllketcpz\.supabase\.co\/storage\/v1\/object\/public\/demo-template-videos\/|\/media\/)/

describe('demo library registry', () => {
  it('holds every template-library clip exactly once (the original catalog demos reuse the library media)', () => {
    // Every library clip once, plus OpenHiggsBolt's own local PromptFeed / Seedance 1 clips (not in the library, marked Not reviewed).
    const localOnly = DEMO_LIBRARY_REGISTRY.filter((entry) => entry.branding === 'unreviewed')
    expect(localOnly).toHaveLength(43)
    expect(DEMO_LIBRARY_REGISTRY.length).toBe((templateVideos as unknown[]).length + localOnly.length)
    expect(new Set(DEMO_LIBRARY_REGISTRY.map((entry) => entry.id)).size).toBe(DEMO_LIBRARY_REGISTRY.length)
    expect(new Set(DEMO_LIBRARY_REGISTRY.map((entry) => entry.videoSrc)).size).toBe(DEMO_LIBRARY_REGISTRY.length)
  })

  it('only offers playable media: hosted in our bucket or a repo file, never the raw CDN or a missing catalog path', () => {
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      expect(entry.videoSrc, entry.id).toMatch(PLAYABLE)
      expect(entry.videoSrc, entry.id).not.toContain('media.beatapi.io')
      expect(entry.posterSrc, entry.id).toBeTruthy()
      // The Seedance 2.5 catalog demos are re-pointed at the hosted library media; only the local-only collections keep /media paths.
      expect(entry.videoSrc, entry.id).not.toMatch(/\/media\/seedance-25\//)
      if (entry.videoSrc.startsWith('/media/')) expect(['promptfeed', 'seedance-1'], entry.id).toContain(entry.collectionId)
    }
  })

  it('keeps the local PromptFeed and Seedance 1 clips (their files ship in this repo), marked Not reviewed', () => {
    const ids = demoCollections.map((collection) => collection.id)
    expect(ids).toEqual(expect.arrayContaining(['promptfeed', 'seedance-1']))
    expect(EXCLUDED_DEMO_COLLECTIONS.map((collection) => collection.id)).not.toEqual(expect.arrayContaining(['promptfeed']))
    expect(DEMO_LIBRARY_REGISTRY.filter((entry) => entry.collectionId === 'promptfeed')).toHaveLength(29)
    expect(DEMO_LIBRARY_REGISTRY.filter((entry) => entry.collectionId === 'seedance-1')).toHaveLength(14)
  })

  it('labels every library demo No logo or Has logo (a logo label names its mark); local-only clips are Not reviewed', () => {
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      const local = entry.collectionId === 'promptfeed' || entry.collectionId === 'seedance-1'
      expect(local ? ['unreviewed'] : ['none', 'logo'], entry.id).toContain(entry.branding)
      if (entry.branding === 'logo') expect(entry.marks, entry.id).toBeTruthy()
      expect(toVideoDemo(entry).branding, entry.id).toBe(entry.branding)
    }
  })

  it('files every demo under at least one business niche, so no clip is unreachable by category', () => {
    const stranded = DEMO_LIBRARY_REGISTRY.filter((entry) => getDemoCategoryIds(toVideoDemo(entry)).filter((id) => id !== ALL_DEMOS_CATEGORY_ID).length === 0)
    // The taxonomy is keyword based; a few generic clips may fall outside every niche but must stay reachable under "All".
    expect(stranded.length / DEMO_LIBRARY_REGISTRY.length).toBeLessThan(0.35)
    expect(DEMO_CATEGORIES.length).toBeGreaterThan(1)
  })
})

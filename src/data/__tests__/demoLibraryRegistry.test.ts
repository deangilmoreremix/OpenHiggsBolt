/**
 * Contract tests for the demo library registry.
 *
 * The registry replaced a hardcoded 12-slug allowlist that was the reason
 * only 12 of the shipped demo videos ever reached the UI. These tests lock
 * the guarantees that make the full library safe to render:
 *
 *  1. Every registered entry points at a video file that REALLY exists on
 *     disk under `public/` and is non-empty.
 *  2. Every registered entry's poster REALLY exists on disk.
 *  3. Every id is unique, and the id is source-qualified (no bare slug, no
 *     numeric index), so no two collections can collide.
 *  4. The registry is strictly larger than the old 12-entry allowlist.
 *  5. Every registered video has probed media facts (the verification
 *     allowlist), so an unverified file can never be registered.
 *  6. The registry is RECONCILED against the disk: every video file under
 *     `public/media/<collection>/videos` that has a real media container is registered,
 *     and every file that does NOT is excluded. This is the test that fails
 *     when a new collection lands on disk but is never wired up.
 */

import { describe, it, expect } from 'vitest'
import { closeSync, existsSync, openSync, readSync, statSync, readdirSync } from 'fs'
import { join } from 'path'
import { getCreateUrl } from '../types'
import { findDemoById } from '../demoLookup'
import {
  DEMO_LIBRARY_REGISTRY,
  DEMO_MEDIA_FACTS,
  DEMO_COLLECTION_IDS,
  DEMO_CATEGORIES,
  demoCollections,
  getDemoById,
  getDemosByCollection,
  getDemosByCategory,
  getMediaFacts,
  toVideoDemo,
  deriveAspectRatio,
  EXCLUDED_DEMO_COLLECTIONS,
} from '../demoLibraryRegistry'

const PUBLIC_DIR = join(process.cwd(), 'public')
const MEDIA_DIR = join(PUBLIC_DIR, 'media')

/** The allowlist that used to gate the grid. */
const OLD_CURATED_COUNT = 12

/**
 * Reconciled expected totals.
 *
 * 137 video files exist under `public/media/<collection>/videos`. 14 of them — the whole
 * `seedance-prompts` collection — are 9-byte "Not Found" error bodies with no
 * media container, so 123 videos are eligible and all 123 are registered.
 */
const EXPECTED_COLLECTION_COUNTS: Record<string, number> = {
  'minimax-h3': 30,
  promptfeed: 29,
  'seedance-1': 14,
  'seedance-25': 50,
}
const EXPECTED_TOTAL = 123
const ON_DISK_TOTAL = 137
const INVALID_ON_DISK = 14

/** WebM magic `1a 45 df a3`; MP4 magic is the `ftyp` box at offset 4. */
const WEBM_MAGIC = Buffer.from([0x1a, 0x45, 0xdf, 0xa3])

/** A real media container is never this small; a 9-byte error body is. */
const MIN_MEDIA_BYTES = 1024

/** Every video path the registry actually serves. */
const registeredVideoSrcs = new Set(DEMO_LIBRARY_REGISTRY.map((entry) => entry.videoSrc))

function publicPath(sitePath: string): string {
  return join(PUBLIC_DIR, sitePath.replace(/^\//, ''))
}

/** True when the file starts with a real WebM or MP4 container magic. */
function hasMediaMagic(absPath: string): boolean {
  // Read only the 12-byte header: loading every whole video (~450 MB) made
  // this test time out under full-suite CPU contention.
  const head = Buffer.alloc(12)
  const fd = openSync(absPath, 'r')
  try {
    readSync(fd, head, 0, 12, 0)
  } finally {
    closeSync(fd)
  }
  return (
    head.subarray(0, 4).equals(WEBM_MAGIC) || head.subarray(4, 8).toString('latin1') === 'ftyp'
  )
}

/** Every video file under `public/media/<collection>/videos/`. */
function mediaCollectionsOnDisk(): Array<{ collection: string; files: string[] }> {
  if (!existsSync(MEDIA_DIR)) return []
  return readdirSync(MEDIA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      collection: entry.name,
      files: readdirSync(join(MEDIA_DIR, entry.name, 'videos')).filter((file) =>
        /\.(mp4|webm|mov|m4v)$/i.test(file),
      ),
    }))
    .filter((entry) => entry.files.length > 0)
}

describe('DEMO_LIBRARY_REGISTRY — media existence', () => {
  it('registers a non-trivial number of demos', () => {
    expect(DEMO_LIBRARY_REGISTRY.length).toBeGreaterThan(OLD_CURATED_COUNT)
  })

  it('points every entry at a video file that exists on disk and is non-empty', () => {
    const missing: string[] = []
    const empty: string[] = []
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      const abs = publicPath(entry.videoSrc)
      if (!existsSync(abs)) {
        missing.push(entry.videoSrc)
        continue
      }
      if (statSync(abs).size === 0) empty.push(entry.videoSrc)
    }
    expect(missing).toEqual([])
    expect(empty).toEqual([])
  })

  it('points every entry at a poster file that exists on disk', () => {
    const missing: string[] = []
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      if (!entry.posterSrc) {
        missing.push(`<empty> ${entry.id}`)
        continue
      }
      if (!existsSync(publicPath(entry.posterSrc))) missing.push(`${entry.id} -> ${entry.posterSrc}`)
    }
    expect(missing).toEqual([])
  })

  it('registers only local media paths (never remote URLs or blob handles)', () => {
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      expect(entry.videoSrc.startsWith('/media/')).toBe(true)
      expect(entry.videoSrc.startsWith('http')).toBe(false)
      expect(entry.videoSrc.startsWith('blob:')).toBe(false)
    }
  })

  it('never registers a video whose file lacks a real media magic number', () => {
    const withoutMagic: string[] = []
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      const abs = publicPath(entry.videoSrc)
      if (!hasMediaMagic(abs)) withoutMagic.push(`${entry.id} -> ${entry.videoSrc}`)
    }
    expect(withoutMagic).toEqual([])
  })

  it('never registers a file too small to be a media container', () => {
    // Guards against a 9-byte "Not Found" HTTP body being registered as if
    // it were a video: it has no magic number, but it also has no size.
    const tooSmall: string[] = []
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      const size = statSync(publicPath(entry.videoSrc)).size
      if (size < MIN_MEDIA_BYTES) tooSmall.push(`${entry.id} -> ${entry.videoSrc} (${size} bytes)`)
    }
    expect(tooSmall).toEqual([])
  })
})

describe('DEMO_LIBRARY_REGISTRY — ids', () => {
  it('assigns every entry a unique id', () => {
    const ids = DEMO_LIBRARY_REGISTRY.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('never duplicates an id across collections', () => {
    const seen = new Map<string, string>()
    const duplicates: string[] = []
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      const owner = `${entry.collectionId}:${entry.slug}`
      if (seen.has(owner)) duplicates.push(`${owner} (${seen.get(owner)} + ${entry.collectionId})`)
      seen.set(owner, entry.collectionId)
    }
    expect(duplicates).toEqual([])
  })

  it('qualifies every id with its source collection', () => {
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      expect(entry.id).toBe(`${entry.collectionId}:${entry.slug}`)
      expect(DEMO_COLLECTION_IDS).toContain(entry.collectionId)
      expect(entry.id).not.toBe(entry.slug)
      expect(Number.isNaN(Number(entry.id))).toBe(true)
    }
  })

  it('resolves every entry through getDemoById', () => {
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      expect(getDemoById(entry.id)).toBe(entry)
    }
    expect(getDemoById('does-not-exist')).toBeUndefined()
  })
})

describe('DEMO_LIBRARY_REGISTRY — completeness', () => {
  it('is strictly larger than the old 12-slug allowlist', () => {
    expect(DEMO_LIBRARY_REGISTRY.length).toBeGreaterThan(OLD_CURATED_COUNT)
  })

  it('registers every verified video of every registered collection', () => {
    for (const collectionId of DEMO_COLLECTION_IDS) {
      const registered = getDemosByCollection(collectionId)
      expect(registered.length).toBeGreaterThan(0)
      // Every registered video of the collection has a probed fact row, and
      // every probed fact row of the collection is registered.
      const probed = Object.keys(DEMO_MEDIA_FACTS).filter((path) =>
        path.startsWith(`/media/${collectionId}/videos/`),
      )
      expect(registered.length).toBe(probed.length)
    }
  })

  it('keeps every collection listed in demoCollections with a non-zero count', () => {
    expect(demoCollections.map((c) => c.id).sort()).toEqual([...DEMO_COLLECTION_IDS].sort())
    for (const collection of demoCollections) {
      expect(collection.count).toBeGreaterThan(0)
      expect(collection.label.length).toBeGreaterThan(0)
      expect(collection.sourceUrl).toMatch(/^https:\/\//)
    }
  })

  it('exposes probed media facts for every registered video', () => {
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      const facts = getMediaFacts(entry.videoSrc)
      expect(facts, `no media facts for ${entry.id}`).toBeDefined()
      expect(facts!.width).toBeGreaterThan(0)
      expect(facts!.height).toBeGreaterThan(0)
      expect(facts!.durationSeconds).toBeGreaterThan(0)
      expect(entry.media).toEqual(facts)
    }
  })

  it('registers no video that failed verification (the seedance-prompts collection)', () => {
    // All 14 seedance-prompts files are 9-byte "Not Found" bodies. They must
    // not appear in the registry in any form.
    const offenders = DEMO_LIBRARY_REGISTRY.filter(
      (entry) =>
        (entry.collectionId as string) === 'seedance-prompts' ||
        entry.videoSrc.includes('/seedance-prompts/'),
    )
    expect(offenders).toEqual([])
  })

  it('documents every excluded collection with a reason', () => {
    expect(EXCLUDED_DEMO_COLLECTIONS.length).toBeGreaterThan(0)
    for (const excluded of EXCLUDED_DEMO_COLLECTIONS) {
      expect(excluded.reason.length).toBeGreaterThan(20)
      expect(excluded.videoCountOnDisk).toBeGreaterThanOrEqual(0)
      expect(excluded.verifiedVideoCount).toBeGreaterThanOrEqual(0)
      expect(excluded.verifiedVideoCount).toBeLessThanOrEqual(excluded.videoCountOnDisk)
      expect(typeof excluded.entitlementGated).toBe('boolean')
    }
    expect(EXCLUDED_DEMO_COLLECTIONS.map((e) => e.id)).toContain('seedance-prompts')
  })
})

describe('DEMO_LIBRARY_REGISTRY — reconciled totals', () => {
  it('registers exactly the reconciled number of eligible demos', () => {
    expect(DEMO_LIBRARY_REGISTRY.length).toBe(EXPECTED_TOTAL)
  })

  it('registers exactly the reconciled number of demos per collection', () => {
    const actual: Record<string, number> = {}
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      actual[entry.collectionId] = (actual[entry.collectionId] ?? 0) + 1
    }
    expect(actual).toEqual(EXPECTED_COLLECTION_COUNTS)
    for (const [collectionId, expected] of Object.entries(EXPECTED_COLLECTION_COUNTS)) {
      expect(getDemosByCollection(collectionId as never).length).toBe(expected)
    }
  })

  it('publishes the reconciled counts in demoCollections', () => {
    const published: Record<string, number> = {}
    for (const collection of demoCollections) published[collection.id] = collection.count
    expect(published).toEqual(EXPECTED_COLLECTION_COUNTS)
    const total = demoCollections.reduce((sum, collection) => sum + collection.count, 0)
    expect(total).toBe(EXPECTED_TOTAL)
  })

  it('has one probed media fact row per registered demo, and no orphans', () => {
    expect(Object.keys(DEMO_MEDIA_FACTS).length).toBe(EXPECTED_TOTAL)
    const registeredSrcs = new Set(DEMO_LIBRARY_REGISTRY.map((entry) => entry.videoSrc))
    const orphanFacts = Object.keys(DEMO_MEDIA_FACTS).filter((src) => !registeredSrcs.has(src))
    expect(orphanFacts).toEqual([])
  })

  it('registers every eligible video found on disk and no ineligible one', () => {
    // Walk every local demo collection on disk. A file with a real media
    // container MUST be registered; a file without one MUST NOT be.
    const eligibleButUnregistered: string[] = []
    const ineligibleButRegistered: string[] = []
    let onDisk = 0
    let eligible = 0

    for (const { collection, files } of mediaCollectionsOnDisk()) {
      for (const file of files) {
        onDisk += 1
        const sitePath = `/media/${collection}/videos/${file}`
        const abs = join(MEDIA_DIR, collection, 'videos', file)
        const isRegistered = registeredVideoSrcs.has(sitePath)
        const isEligible = existsSync(abs) && statSync(abs).size > 0 && hasMediaMagic(abs)
        if (isEligible) eligible += 1
        if (isEligible && !isRegistered) eligibleButUnregistered.push(sitePath)
        if (!isEligible && isRegistered) ineligibleButRegistered.push(sitePath)
      }
    }

    expect(onDisk).toBe(ON_DISK_TOTAL)
    expect(eligible).toBe(EXPECTED_TOTAL)
    expect(eligibleButUnregistered).toEqual([])
    expect(ineligibleButRegistered).toEqual([])
  })
})

describe('DEMO_LIBRARY_REGISTRY — excluded collections', () => {
  it('excludes seedance-prompts because its media is broken, not because it is paywalled', () => {
    const excluded = EXCLUDED_DEMO_COLLECTIONS.find((e) => e.id === 'seedance-prompts')
    expect(excluded).toBeDefined()
    expect(excluded!.videoCountOnDisk).toBe(INVALID_ON_DISK)
    expect(excluded!.verifiedVideoCount).toBe(0)
    expect(excluded!.entitlementGated).toBe(false)
  })

  it('proves every seedance-prompts file on disk is an invalid media body', () => {
    const dir = join(MEDIA_DIR, 'seedance-prompts', 'videos')
    expect(existsSync(dir)).toBe(true)
    const files = readdirSync(dir)
    expect(files.length).toBe(INVALID_ON_DISK)
    for (const file of files) {
      const abs = join(dir, file)
      expect(statSync(abs).size).toBeLessThan(MIN_MEDIA_BYTES)
      expect(hasMediaMagic(abs)).toBe(false)
    }
  })

  it('does not entitle-gate any excluded local collection', () => {
    for (const excluded of EXCLUDED_DEMO_COLLECTIONS) {
      expect(excluded.entitlementGated, `${excluded.id} is unexpectedly entitlement-gated`).toBe(
        false,
      )
    }
  })
})

describe('DEMO_LIBRARY_REGISTRY — metadata', () => {
  it('gives every entry a title, category, aspect ratio and duration', () => {
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      expect(entry.title.trim().length).toBeGreaterThan(0)
      expect(entry.prompt.trim().length).toBeGreaterThan(0)
      expect(entry.aspectRatio).toMatch(/^\d+:\d+$/)
      expect(entry.durationSeconds).toBeGreaterThan(0)
      expect(entry.style.trim().length).toBeGreaterThan(0)
      expect(DEMO_CATEGORIES.map((c) => c.id)).toContain(entry.category)
    }
  })

  it('exposes a category id and label for every canonical category', () => {
    for (const category of DEMO_CATEGORIES) {
      expect(category.id.length).toBeGreaterThan(0)
      expect(category.label.length).toBeGreaterThan(0)
    }
    expect(getDemosByCategory('Cinema').length).toBeGreaterThan(0)
    expect(getDemosByCategory('UGC').length).toBeGreaterThan(0)
  })

  it('derives an aspect ratio from real media dimensions', () => {
    expect(deriveAspectRatio({ width: 1920, height: 1080, durationSeconds: 1 })).toBe('16:9')
    expect(deriveAspectRatio({ width: 1080, height: 1920, durationSeconds: 1 })).toBe('9:16')
    expect(deriveAspectRatio({ width: 1080, height: 1080, durationSeconds: 1 })).toBe('1:1')
  })

  it('converts entries back into legacy VideoDemo records with a working route', () => {
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      const demo = toVideoDemo(entry)
      expect(demo.slug).toBe(entry.slug)
      expect(demo.sourceRepo).toBe(entry.sourceRepo)
      expect(demo.videoSrc).toBe(entry.videoSrc)
      expect(demo.posterSrc).toBe(entry.posterSrc)
      expect(demo.studioTab).toBe(entry.studioTab)
      expect(demo.duration).toBe(entry.durationSeconds)
      expect(typeof demo.id).toBe('number')
    }
  })

  it('routes every entry to a template that the demo lookup can resolve', () => {
    // The "Create" button builds `/studio/{tab}?template={sourceRepo}|{slug}`
    // and the target studio resolves that id through `findDemoById`. A demo
    // whose template id does not resolve would open an empty studio.
    for (const entry of DEMO_LIBRARY_REGISTRY) {
      const demo = toVideoDemo(entry)
      const templateId = `${demo.sourceRepo}|${demo.slug}`
      expect(findDemoById(templateId), `unresolvable template id: ${templateId}`).toBeDefined()
      expect(() => getCreateUrl(demo)).not.toThrow()
      expect(getCreateUrl(demo)).toContain(encodeURIComponent(templateId))
    }
  })
})

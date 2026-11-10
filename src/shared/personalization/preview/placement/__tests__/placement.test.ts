import { describe, it, expect } from 'vitest'
import { createLayer, applyLayoutPreset, createDefaultPreviewSettings, layoutDefaultGeometry } from '../../presets'
import { recommendPlacement, evaluateLayoutQuality, buildPlacementInput, type LumaSample, type ProtectedZone } from '..'
import type { PersonalizationPreviewSettings, PreviewInputProps } from '../../types'

const BRAND: PreviewInputProps['brand'] = {
  businessName: 'Kreindler & Kreindler LLP', headline: 'Kreindler & Kreindler LLP', offer: '20% off this week',
  cta: 'Call now', phone: '', website: '', logoUrl: 'https://cdn.example.com/logo.png',
  productUrl: 'https://cdn.example.com/p.png', serviceUrl: 'https://cdn.example.com/s.png',
}

/** A uniform luminance grid. */
const flat = (luma: number, t = 1.5): LumaSample => ({ t, cols: 16, rows: 9, luma: Array(16 * 9).fill(luma) })
/** A grid whose cells inside the normalized rect are `inside`, elsewhere `outside`. */
const blob = (r: { x: number; y: number; w: number; h: number }, inside: number, outside: number, t = 1.5): LumaSample => {
  const luma: number[] = []
  for (let row = 0; row < 9; row++) for (let col = 0; col < 16; col++) {
    const cx = (col + 0.5) / 16, cy = (row + 0.5) / 9
    luma.push(cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h ? inside : outside)
  }
  return { t, cols: 16, rows: 9, luma }
}
const zone = (x: number, y: number, w: number, h: number, label = 'Presenter'): ProtectedZone => ({ id: 'z', label, source: 'user', x, y, w, h })

function settingsFor(layout: Parameters<typeof applyLayoutPreset>[1], ratio: '16:9' | '9:16' | '1:1' | '4:5' = '16:9'): PersonalizationPreviewSettings {
  const dims = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350] }[ratio]
  return applyLayoutPreset({ ...createDefaultPreviewSettings(), aspectRatio: ratio, width: dims[0], height: dims[1], showEndCard: false }, layout)
}
// measured natural aspect ratios: a wide 3:1 logo, square product/service photos
const ASPECTS = { 'https://cdn.example.com/logo.png': 3, 'https://cdn.example.com/p.png': 1, 'https://cdn.example.com/s.png': 1 }
const build = (s: PersonalizationPreviewSettings, over: Partial<Parameters<typeof buildPlacementInput>[0]> = {}) =>
  buildPlacementInput({ settings: s, brand: BRAND, imageAspects: ASPECTS, ...over })
const move = (s: PersonalizationPreviewSettings, id: string, patch: object): PersonalizationPreviewSettings =>
  ({ ...s, layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })

describe('placement engine', () => {
  it('leaves a good designed layout exactly where it is', () => {
    const s = settingsFor('product-showcase')
    const r = recommendPlacement(build(s, { zones: [], samples: [flat(0.1)] }))
    expect(r.proposals.every((p) => !p.moved)).toBe(true)
  })

  it('moves text off a protected subject zone (speaker in the centre)', () => {
    let s = settingsFor('business-introduction')
    s = move(s, 'headline', { x: 0.5, y: 0.5 })
    const subject = zone(0.35, 0.1, 0.3, 0.8)
    const r = recommendPlacement(build(s, { zones: [subject], samples: [flat(0.1)] }))
    const p = r.proposals.find((x) => x.layerId === 'headline')!
    expect(p.moved).toBe(true)
    // the new box no longer covers the subject
    const q = evaluateLayoutQuality(build(move(s, 'headline', { x: p.x, y: p.y }), { zones: [subject], samples: [flat(0.1)] }))
    expect(q.issues.some((i) => i.layerId === 'headline' && i.code === 'text-over-subject')).toBe(false)
  })

  it('works for a speaker on the left and on the right', () => {
    for (const zx of [0.05, 0.65]) {
      let s = settingsFor('business-introduction')
      s = move(s, 'headline', { x: zx + 0.15, y: 0.4 })
      const subject = zone(zx, 0.1, 0.3, 0.8)
      const r = recommendPlacement(build(s, { zones: [subject], samples: [flat(0.1)] }))
      const p = r.proposals.find((x) => x.layerId === 'headline')!
      const q = evaluateLayoutQuality(build(move(s, 'headline', { x: p.x, y: p.y }), { zones: [subject], samples: [flat(0.1)] }))
      expect(q.issues.some((i) => i.layerId === 'headline' && i.code === 'text-over-subject'), `speaker at ${zx}`).toBe(false)
    }
  })

  it('moves white text off a bright region onto a dark one (contrast)', () => {
    let s = settingsFor('business-introduction')
    s = move(s, 'headline', { x: 0.3, y: 0.4 })
    // bright patch where the headline sits, dark elsewhere
    const bright = blob({ x: 0.05, y: 0.3, w: 0.55, h: 0.2 }, 0.95, 0.05)
    const before = evaluateLayoutQuality(build(s, { zones: [zone(0.7, 0.1, 0.25, 0.8)], samples: [bright] }))
    expect(before.issues.some((i) => i.code === 'low-contrast' && i.layerId === 'headline')).toBe(true)
    const r = recommendPlacement(build(s, { zones: [zone(0.7, 0.1, 0.25, 0.8)], samples: [bright] }))
    const p = r.proposals.find((x) => x.layerId === 'headline')!
    expect(p.moved).toBe(true)
    const after = evaluateLayoutQuality(build(move(s, 'headline', { x: p.x, y: p.y }), { zones: [zone(0.7, 0.1, 0.25, 0.8)], samples: [bright] }))
    expect(after.issues.some((i) => i.code === 'low-contrast' && i.layerId === 'headline')).toBe(false)
  })

  it('evaluates several frames across the overlay duration, not just the first', () => {
    const s = settingsFor('business-introduction')
    const dark = flat(0.05, 0.2)
    const brightLater = flat(0.95, 3.5)
    const q = evaluateLayoutQuality(build(s, { zones: [zone(0.8, 0.1, 0.15, 0.8)], samples: [dark, brightLater] }))
    const issue = q.issues.find((i) => i.code === 'low-contrast')
    expect(issue).toBeTruthy()
    expect(issue!.tStart).toBeCloseTo(3.5, 1) // the failing timestamp is reported
  })

  it('never moves a locked or hand-placed layer, even when it covers the subject', () => {
    let s = settingsFor('business-introduction')
    s = move(s, 'headline', { x: 0.5, y: 0.5, locked: true })
    s = move(s, 'businessName', { x: 0.5, y: 0.45, placementSource: 'manual' })
    const subject = zone(0.35, 0.1, 0.3, 0.8)
    const r = recommendPlacement(build(s, { zones: [subject], samples: [flat(0.1)] }))
    expect(r.proposals.find((p) => p.layerId === 'headline')).toBeUndefined()
    expect(r.proposals.find((p) => p.layerId === 'businessName')).toBeUndefined()
    expect(r.skipped.find((k) => k.layerId === 'headline')?.reason).toBe('locked')
    expect(r.skipped.find((k) => k.layerId === 'businessName')?.reason).toBe('manual')
    // …but the quality check still reports them (not auto-fixable)
    const q = evaluateLayoutQuality(build(s, { zones: [subject], samples: [flat(0.1)] }))
    const issue = q.issues.find((i) => i.layerId === 'headline' && i.code === 'text-over-subject')
    expect(issue).toBeTruthy()
    expect(issue!.fixable).toBe(false)
  })

  it('does not auto-place designs, full-frame scenes or picture-in-picture', () => {
    let s = settingsFor('business-introduction')
    s = { ...s, layers: [...s.layers, { ...createLayer('design'), id: 'design', designId: 'rve-picture-in-picture' }] }
    const r = recommendPlacement(build(s, {
      zones: [zone(0.2, 0.2, 0.6, 0.6)], samples: [flat(0.5)],
      designFacts: (id) => ({ id, category: 'full-scene', supported: true }),
    }))
    expect(r.skipped.find((k) => k.layerId === 'design')?.reason).toBe('not-auto-placeable')
  })

  it('is deterministic', () => {
    const s = settingsFor('service-promotion', '9:16')
    const input = build(s, { zones: [zone(0.3, 0.2, 0.4, 0.6)], samples: [blob({ x: 0, y: 0, w: 1, h: 0.4 }, 0.9, 0.1)] })
    expect(JSON.stringify(recommendPlacement(input))).toBe(JSON.stringify(recommendPlacement(input)))
  })

  it('keeps product/service images away from the subject at every aspect ratio', () => {
    for (const ratio of ['16:9', '9:16', '1:1', '4:5'] as const) {
      const s = settingsFor('product-showcase', ratio)
      const subject = zone(0.3, 0.15, 0.4, 0.7, 'Product close-up')
      const r = recommendPlacement(build(s, { zones: [subject], samples: [flat(0.2)] }))
      const applied: PersonalizationPreviewSettings = {
        ...s,
        layers: s.layers.map((l) => { const p = r.proposals.find((x) => x.layerId === l.id); return p ? { ...l, x: p.x, y: p.y } : l }),
      }
      const q = evaluateLayoutQuality(build(applied, { zones: [subject], samples: [flat(0.2)] }))
      // either resolved, or reported honestly — never silently "ready" over the subject
      const img = q.issues.find((i) => i.layerId === 'productImage' && i.code === 'media-over-subject')
      if (img) expect(q.status).toBe('needs-adjustment')
    }
  })
})

describe('layout quality check', () => {
  it('is Ready only when everything can be verified and passes', () => {
    const s = settingsFor('product-showcase')
    // a subject zone in empty space (top centre) that no overlay touches
    const q = evaluateLayoutQuality(build(s, { zones: [zone(0.45, 0.05, 0.1, 0.1)], samples: [flat(0.05)] }))
    expect(q.issues).toEqual([])
    expect(q.status).toBe('ready')
    expect(q.blocksExport).toBe(false)
  })

  it('is Review Required — not Ready — when the subject area and frame measurements are unknown', () => {
    const q = evaluateLayoutQuality(build(settingsFor('business-introduction')))
    expect(q.status).toBe('review-required')
    expect(q.issues.map((i) => i.code).sort()).toEqual(['contrast-unverified', 'subject-unknown'])
    expect(q.analysis.subjectVerified).toBe(false)
    expect(q.notes.join(' ')).toMatch(/baked into the source video/)
  })

  it('a layer with no image only warns; a broken image address blocks (confirmed rendering failure)', () => {
    const none = evaluateLayoutQuality(build(settingsFor('product-showcase'), {
      brand: { ...BRAND, productUrl: null, serviceUrl: null },
      zones: [zone(0.4, 0.1, 0.2, 0.3)], samples: [flat(0.05)],
    } as never))
    const missing = none.issues.find((i) => i.code === 'missing-media')!
    expect(missing.severity).toBe('adjust')
    expect(none.blocksExport).toBe(false)
    let s = settingsFor('product-showcase')
    s = move(s, 'productImage', { imageUrl: 'ftp://broken' })
    const broken = evaluateLayoutQuality(build(s, { zones: [zone(0.4, 0.1, 0.2, 0.3)], samples: [flat(0.05)] }))
    expect(broken.issues.find((i) => i.code === 'missing-media')?.severity).toBe('critical')
    expect(broken.blocksExport).toBe(true)
  })

  it('a purely subjective problem (text over the subject) never blocks export', () => {
    let s = settingsFor('business-introduction')
    s = move(s, 'headline', { x: 0.5, y: 0.5 })
    const subj = evaluateLayoutQuality(build(s, { zones: [zone(0.35, 0.1, 0.3, 0.8)], samples: [flat(0.05)] }))
    expect(subj.status).toBe('needs-adjustment')
    expect(subj.blocksExport).toBe(false)
  })

  it('flags an invalid image address as critical and an unsupported design as critical', () => {
    let s = settingsFor('business-introduction')
    s = move(s, 'logo', { imageUrl: 'ftp://nope' })
    s = { ...s, layers: [...s.layers, { ...createLayer('design'), id: 'design', designId: 'x' }] }
    const q = evaluateLayoutQuality(build(s, { zones: [zone(0.4, 0.1, 0.2, 0.3)], samples: [flat(0.05)], designFacts: (id) => ({ id, supported: false }) }))
    expect(q.issues.filter((i) => i.severity === 'critical').map((i) => i.code).sort()).toEqual(['missing-media', 'unsupported-design'])
    expect(q.blocksExport).toBe(true)
  })

  it('flags overlapping overlays and reports the layout default geometry as intended', () => {
    let s = settingsFor('service-promotion')
    s = move(s, 'tagline', { x: s.layers.find((l) => l.id === 'headline')!.x, y: s.layers.find((l) => l.id === 'headline')!.y })
    const q = evaluateLayoutQuality(build(s, { zones: [zone(0.5, 0.0, 0.01, 0.01)], samples: [flat(0.05)] }))
    expect(q.issues.some((i) => i.code === 'overlay-collision')).toBe(true)
    expect(layoutDefaultGeometry('service-promotion', 'headline', '16:9')).toBeTruthy()
  })

  it('flags copy typed identically on two text layers for review', () => {
    let s = settingsFor('business-introduction')
    s = move(s, 'headline', { text: 'Same words' })
    s = move(s, 'businessName', { text: 'Same words' })
    const q = evaluateLayoutQuality(build(s, { zones: [zone(0.8, 0.1, 0.1, 0.2)], samples: [flat(0.05)] }))
    expect(q.issues.some((i) => i.code === 'duplicate-text' && i.severity === 'review')).toBe(true)
  })
})

import { lumaGridFromRGBA, baseSampleTimes, refinementTimes, lumaDifference } from '..'

describe('frame sampler (pure parts)', () => {
  it('computes Rec.709 luma per cell', () => {
    const px = [255, 255, 255, 255, 0, 0, 0, 255, 255, 0, 0, 255]
    const g = lumaGridFromRGBA(px, 3, 1)
    expect(g[0]).toBeCloseTo(1, 5)
    expect(g[1]).toBeCloseTo(0, 5)
    expect(g[2]).toBeCloseTo(0.2126, 4)
  })
  it('samples the start, ten even points and the last moment', () => {
    const t = baseSampleTimes(11)
    expect(t[0]).toBe(0)
    expect(t).toHaveLength(12)
    expect(t[1]).toBeCloseTo(1, 3)
    expect(t[t.length - 1]).toBeCloseTo(10.9, 3)
    expect(baseSampleTimes(0)).toEqual([0])
  })
  it('adds a midpoint sample where neighbouring frames differ a lot (scene boundary)', () => {
    const a: LumaSample = { t: 1, cols: 2, rows: 1, luma: [0.1, 0.1] }
    const b: LumaSample = { t: 3, cols: 2, rows: 1, luma: [0.9, 0.9] }
    const c: LumaSample = { t: 5, cols: 2, rows: 1, luma: [0.9, 0.9] }
    expect(refinementTimes([a, b, c])).toEqual([2])
    expect(lumaDifference(a.luma, b.luma)).toBeCloseTo(0.8, 5)
  })
})

describe('source-aware review items', () => {
  const okZones = [zone(0.45, 0.05, 0.1, 0.1)]
  it('unknown baked-in graphics and unverified rights are Review Required, never Ready', () => {
    const q = evaluateLayoutQuality(build(settingsFor('product-showcase'), {
      zones: okZones, samples: [flat(0.05)],
      source: { rights: 'unverified', rightsNote: 'No licence record.', bakedStatus: 'unknown' },
    }))
    expect(q.status).toBe('review-required')
    expect(q.issues.map((i) => i.code).sort()).toEqual(['baked-in-unknown', 'rights-unverified'])
    expect(q.blocksExport).toBe(false) // review items never block by themselves
  })
  it('a third-party reference clip is flagged; a licensed, reviewed clip is Ready', () => {
    const third = evaluateLayoutQuality(build(settingsFor('product-showcase'), {
      zones: okZones, samples: [flat(0.05)],
      source: { rights: 'third-party-reference', rightsNote: 'Third-party brand clip.', bakedStatus: 'known' },
    }))
    expect(third.issues.map((i) => i.code)).toEqual(['rights-unverified'])
    const ok = evaluateLayoutQuality(build(settingsFor('product-showcase'), {
      zones: okZones, samples: [flat(0.05)],
      source: { rights: 'licensed', rightsNote: '', bakedStatus: 'known' },
    }))
    expect(ok.status).toBe('ready')
  })
})

import { recommendRestoredPlacement } from '..'

describe('restore recommended placement', () => {
  it('returns hand-placed layers to the template position, adjusted only where the footage needs it, and never touches locked ones', () => {
    let s = settingsFor('business-introduction')
    s = move(s, 'businessName', { x: 0.9, y: 0.9, placementSource: 'manual' })
    s = move(s, 'headline', { x: 0.5, y: 0.5, locked: true })
    const input = build(s, { zones: [zone(0.8, 0.1, 0.15, 0.2)], samples: [flat(0.05)] })
    const r = recommendRestoredPlacement(input)
    const bn = r.proposals.find((p) => p.layerId === 'businessName')!
    const intended = layoutDefaultGeometry('business-introduction', 'businessName', '16:9')
    // back at the template position (not where the customer dragged it), nudged at most a
    // little where the template position itself collides with the logo
    expect(bn.x).toBeCloseTo(intended.x, 6)
    expect(Math.abs(bn.y - intended.y)).toBeLessThan(0.06)
    expect(bn.y).toBeLessThan(0.5)
    expect(r.proposals.find((p) => p.layerId === 'headline')).toBeUndefined() // locked
    expect(r.skipped.find((k) => k.layerId === 'headline')?.reason).toBe('locked')
  })
})

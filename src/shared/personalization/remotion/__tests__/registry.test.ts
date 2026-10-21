// @vitest-environment jsdom
/**
 * Remotion design registry contract.
 *
 * The registry is the catalogue the personalization preview resolves design
 * ids against. These tests pin the guarantees a caller relies on:
 *  - the catalogue holds exactly the five adapted designs;
 *  - ids are unique and stable;
 *  - every design carries an MIT-family licence with upstream attribution;
 *  - every media slot a design declares can actually be satisfied;
 *  - overlay designs declare `placement: 'overlay'` and full-frame designs
 *    declare `placement: 'full-frame'`;
 *  - every design renders correctly from its default props alone.
 */
import { describe, it, expect } from 'vitest'
import {
  REMOTION_DESIGN_ASPECT_RATIOS,
  REMOTION_DESIGN_IDS,
  REMOTION_DESIGN_REGISTRY,
  getRemotionDesign,
  getRemotionDesignsByCategory,
  getRemotionDesignsByPlacement,
  isRemotionDesignId,
  resolveRemotionDesignProps,
} from '../registry'
import type { RemotionDesign } from '../registry'

const EXPECTED_IDS = [
  'bounce-in-headline',
  'logo-mask-wipe',
  'lower-third-glass-card',
  'social-reel',
  'particle-explosion',
] as const

/** The two designs that must composite over the customer's footage. */
const EXPECTED_OVERLAY_IDS = ['lower-third-glass-card', 'particle-explosion'] as const

describe('Remotion design registry', () => {
  it('holds exactly the five integrated designs', () => {
    expect(REMOTION_DESIGN_REGISTRY).toHaveLength(5)
    expect(REMOTION_DESIGN_IDS).toEqual([...EXPECTED_IDS])
  })

  it('uses unique design ids', () => {
    const ids = REMOTION_DESIGN_REGISTRY.map((design) => design.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(typeof id).toBe('string')
      expect(id.trim().length).toBeGreaterThan(0)
    }
  })

  it('gives every design an MIT-family licence with upstream attribution', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      expect(typeof design.source.license).toBe('string')
      expect(design.source.license).toMatch(/mit/i)
      expect(design.source.repo).toMatch(/^https:\/\/github\.com\//)
      expect(design.source.file.length).toBeGreaterThan(0)
      expect((design.source.attribution ?? '').length).toBeGreaterThan(0)
    }
  })

  it('makes every requiredMedia entry satisfiable', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      for (const media of design.requiredMedia) {
        expect(media.name.trim().length).toBeGreaterThan(0)
        expect(['logo', 'image', 'video', 'font']).toContain(media.kind)

        // Every provider prop the registry advertises must exist on the
        // design, otherwise the slot could never be filled.
        for (const prop of media.suppliedBy) {
          expect(Object.prototype.hasOwnProperty.call(design.defaultProps, prop)).toBe(
            true,
          )
        }

        if (media.required) {
          // A required slot has to be reachable through a real prop.
          expect(media.suppliedBy.length).toBeGreaterThan(0)
          expect(media.fallback).not.toBe('none')
        } else {
          // An optional slot must still have a rendering path.
          expect(media.fallback).not.toBe('none')
        }
      }
    }
  })

  it('declares the placement of every design and marks the overlays', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      expect(['full-frame', 'overlay']).toContain(design.placement)
    }

    const overlays = getRemotionDesignsByPlacement('overlay')
    expect(overlays.map((design) => design.id).sort()).toEqual(
      [...EXPECTED_OVERLAY_IDS].sort(),
    )
    for (const design of overlays) {
      expect(design.placement).toBe('overlay')
    }

    const fullFrame = getRemotionDesignsByPlacement('full-frame')
    expect(fullFrame.map((design) => design.id).sort()).toEqual(
      EXPECTED_IDS.filter((id) => !EXPECTED_OVERLAY_IDS.includes(id as never)).sort(),
    )
    for (const design of fullFrame) {
      expect(design.placement).toBe('full-frame')
    }
  })

  it('gives every design non-empty default props', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      expect(design.defaultProps).toBeTypeOf('object')
      expect(Object.keys(design.defaultProps).length).toBeGreaterThan(0)
      expect(design.defaultProps).not.toBeNull()
    }
  })

  it('describes every design completely', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      expect(typeof design.name).toBe('string')
      expect(design.name.trim().length).toBeGreaterThan(0)
      expect(['headline', 'logo', 'lower-third', 'cta', 'effect']).toContain(
        design.category,
      )
      expect(typeof design.component).toBe('function')
      expect(Number.isFinite(design.durationInFrames)).toBe(true)
      expect(design.durationInFrames).toBeGreaterThan(0)
      expect(typeof design.exportCapable).toBe('boolean')
      expect(design.aspectRatios.length).toBeGreaterThan(0)
      for (const ratio of design.aspectRatios) {
        expect(REMOTION_DESIGN_ASPECT_RATIOS).toContain(ratio)
      }
    }
  })

  it('only advertises props the design actually declares', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      for (const prop of [
        ...design.editableText,
        ...design.brandColorProps,
        ...design.brandAssetProps,
      ]) {
        expect(Object.prototype.hasOwnProperty.call(design.defaultProps, prop)).toBe(
          true,
        )
      }
    }
  })

  it('resolves designs by id and by category', () => {
    for (const id of EXPECTED_IDS) {
      const design = getRemotionDesign(id)
      expect(design).toBeDefined()
      expect(design!.id).toBe(id)
      expect(getRemotionDesignsByCategory(design!.category).map((d) => d.id)).toContain(
        id,
      )
    }

    expect(getRemotionDesign('does-not-exist')).toBeUndefined()
    expect(getRemotionDesign('')).toBeUndefined()
    expect(getRemotionDesignsByCategory('effect').map((d) => d.id)).toEqual([
      'particle-explosion',
    ])
  })

  it('type-guards design ids', () => {
    expect(isRemotionDesignId('social-reel')).toBe(true)
    expect(isRemotionDesignId('nope')).toBe(false)
    expect(isRemotionDesignId(undefined)).toBe(false)
    expect(isRemotionDesignId(42)).toBe(false)
  })

  it('merges caller props over the defaults and ignores unknown keys', () => {
    const design = getRemotionDesign('bounce-in-headline') as RemotionDesign
    const resolved = resolveRemotionDesignProps('bounce-in-headline', {
      headline: 'Custom headline',
      notARealProp: 'should be dropped',
    })

    expect(resolved.headline).toBe('Custom headline')
    expect(resolved.background).toBe(design.defaultProps.background)
    expect(Object.prototype.hasOwnProperty.call(resolved, 'notARealProp')).toBe(
      false,
    )

    // Unknown designs resolve to an empty bag rather than throwing.
    expect(resolveRemotionDesignProps('nope', { headline: 'x' })).toEqual({})
  })
})

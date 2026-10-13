import { describe, it, expect } from 'vitest'
import {
  applyLayoutPreset,
  clampLayer,
  createDefaultPreviewSettings,
  createLayer,
  fontStackById,
  getCompositionDimensions,
  LAYER_IDS_BY_LAYOUT,
  normalizePreviewSettings,
  positionForLayer,
  PREVIEW_LAYOUTS,
  PREVIEW_POSITIONS,
  toBox,
} from '../presets'
import { DEFAULT_PREVIEW_BRAND_COLORS } from '../types'

describe('getCompositionDimensions', () => {
  it('maps every aspect ratio to its composition size', () => {
    expect(getCompositionDimensions('16:9')).toEqual({ width: 1920, height: 1080 })
    expect(getCompositionDimensions('9:16')).toEqual({ width: 1080, height: 1920 })
    expect(getCompositionDimensions('1:1')).toEqual({ width: 1080, height: 1080 })
    expect(getCompositionDimensions('4:5')).toEqual({ width: 1080, height: 1350 })
  })

  it('falls back to 1920x1080 for unknown ratios', () => {
    expect(getCompositionDimensions('ultra-wide' as unknown as '16:9')).toEqual({
      width: 1920,
      height: 1080,
    })
  })
})

describe('createLayer', () => {
  it('builds per-kind defaults', () => {
    const logo = createLayer('logo')
    expect(logo.id).toBe('logo')
    expect(logo.kind).toBe('logo')
    expect(logo.visible).toBe(true)
    expect(logo.x).toBe(0.08)
    expect(logo.y).toBe(0.08)
    expect(logo.scale).toBe(0.22)
    expect(logo.animation).toBe('logo-reveal')
    expect(logo.opacity).toBe(1)
    expect(logo.animationDelay).toBe(0)
    expect(logo.startFrame).toBe(0)
    expect(logo.text).toBeUndefined()

    expect(createLayer('businessName').animation).toBe('slide-up')
    expect(createLayer('headline').scale).toBe(0.045)
    expect(createLayer('tagline').animation).toBe('fade')
    expect(createLayer('offer').animation).toBe('pop')
    expect(createLayer('cta').animation).toBe('cta-pulse')
    expect(createLayer('cta').color).toBe(DEFAULT_PREVIEW_BRAND_COLORS.accent)
    expect(createLayer('productImage').x).toBe(0.62)
    expect(createLayer('endCard').scale).toBe(1)
  })

  it('lets overrides win over defaults and clamps unsafe values', () => {
    const layer = createLayer('headline', {
      x: 2,
      y: -1,
      scale: 0.5,
      text: 'Custom',
      animation: 'fade',
      opacity: 0.5,
    })
    expect(layer.x).toBe(1)
    expect(layer.y).toBe(0)
    expect(layer.scale).toBe(0.5)
    expect(layer.text).toBe('Custom')
    expect(layer.animation).toBe('fade')
    expect(layer.opacity).toBe(0.5)
  })
})

describe('clampLayer', () => {
  it('clamps coordinates, scale, opacity and frame numbers', () => {
    const clamped = clampLayer({
      id: 'headline',
      kind: 'headline',
      visible: true,
      x: -0.5,
      y: 3,
      scale: 0.001,
      animation: 'fade',
      animationDelay: -8,
      startFrame: -2,
      opacity: 4,
    })
    expect(clamped.x).toBe(0)
    expect(clamped.y).toBe(1)
    expect(clamped.scale).toBe(0.02)
    expect(clamped.opacity).toBe(1)
    expect(clamped.animationDelay).toBe(0)
    expect(clamped.startFrame).toBe(0)
  })
})

describe('createDefaultPreviewSettings', () => {
  it('returns the business introduction layout with its layers', () => {
    const settings = createDefaultPreviewSettings()
    expect(settings.layout).toBe('business-introduction')
    expect(settings.aspectRatio).toBe('16:9')
    expect(settings.width).toBe(1920)
    expect(settings.height).toBe(1080)
    expect(settings.fps).toBe(30)
    expect(settings.durationInFrames).toBe(150)
    expect(settings.showEndCard).toBe(true)
    expect(settings.brandColors).toEqual(DEFAULT_PREVIEW_BRAND_COLORS)
    expect(settings.layers.map((layer) => layer.kind)).toEqual([
      'logo',
      'businessName',
      'headline',
    ])
  })

  it('derives dimensions from an overridden aspect ratio', () => {
    const settings = createDefaultPreviewSettings({ aspectRatio: '9:16', fps: 24 })
    expect(settings.aspectRatio).toBe('9:16')
    expect(settings.width).toBe(1080)
    expect(settings.height).toBe(1920)
    expect(settings.fps).toBe(24)
  })
})

describe('applyLayoutPreset', () => {
  it('preserves user edits for surviving layer ids and seeds new layers from ctx', () => {
    const settings = createDefaultPreviewSettings()
    settings.layers = settings.layers.map((layer) =>
      layer.id === 'headline'
        ? { ...layer, text: 'My Custom Headline', x: 0.5, y: 0.25, animation: 'fade' }
        : layer,
    )
    const next = applyLayoutPreset(settings, 'product-showcase', {
      headline: 'Seeded headline that should be ignored',
      offer: '50% off this week',
      productUrl: 'https://cdn.example.com/product.png',
    })

    expect(next.layout).toBe('product-showcase')
    expect(next.layers.map((layer) => layer.kind)).toEqual([
      'logo',
      'productImage',
      'headline',
      'offer',
    ])

    const headline = next.layers.find((layer) => layer.kind === 'headline')
    expect(headline?.text).toBe('My Custom Headline')
    expect(headline?.x).toBe(0.5)
    expect(headline?.y).toBe(0.25)
    expect(headline?.animation).toBe('fade')

    const productImage = next.layers.find((layer) => layer.kind === 'productImage')
    expect(productImage?.imageUrl).toBe('https://cdn.example.com/product.png')

    const offer = next.layers.find((layer) => layer.kind === 'offer')
    expect(offer?.text).toBe('50% off this week')
  })

  it('carries over brand colors, aspect ratio, fps and duration', () => {
    const settings = createDefaultPreviewSettings({
      brandColors: {
        primary: '#111111',
        accent: '#222222',
        text: '#333333',
        backgroundDim: 0.4,
      },
      aspectRatio: '4:5',
      fps: 24,
      durationInFrames: 90,
    })
    const next = applyLayoutPreset(settings, 'special-offer', {
      offer: 'Two for one',
      cta: 'Call today',
    })
    expect(next.layout).toBe('special-offer')
    expect(next.brandColors).toEqual(settings.brandColors)
    expect(next.aspectRatio).toBe('4:5')
    expect(next.fps).toBe(24)
    expect(next.durationInFrames).toBe(90)
    expect(next.layers.map((layer) => layer.kind)).toEqual(['headline', 'offer', 'cta'])
    expect(next.layers.find((layer) => layer.kind === 'offer')?.text).toBe('Two for one')
    expect(next.layers.find((layer) => layer.kind === 'cta')?.text).toBe('Call today')
  })

  it('seeds tagline text from ctx and never seeds the end card layer', () => {
    const seeded = applyLayoutPreset(createDefaultPreviewSettings(), 'service-promotion', {
      businessName: 'Acme Roofing',
      serviceUrl: 'https://cdn.example.com/service.png',
    })
    expect(seeded.layers.find((layer) => layer.kind === 'tagline')?.text).toBe('Acme Roofing')
    expect(seeded.layers.find((layer) => layer.kind === 'serviceImage')?.imageUrl).toBe(
      'https://cdn.example.com/service.png',
    )

    const ending = applyLayoutPreset(createDefaultPreviewSettings(), 'branded-ending', {
      businessName: 'Acme Roofing',
      cta: 'Book today',
    })
    const endCard = ending.layers.find((layer) => layer.kind === 'endCard')
    expect(endCard?.text).toBeUndefined()
    expect(endCard?.imageUrl).toBeUndefined()
  })

  it('ignores empty seeding values and falls back to the introduction layout for unknown ids', () => {
    const next = applyLayoutPreset(createDefaultPreviewSettings(), 'product-showcase', {
      headline: '   ',
      offer: '',
    })
    expect(next.layers.find((layer) => layer.kind === 'headline')?.text).toBeUndefined()
    expect(next.layers.find((layer) => layer.kind === 'offer')?.text).toBeUndefined()
  })
})

describe('normalizePreviewSettings', () => {
  it('returns valid defaults for garbage input without throwing', () => {
    const garbage: unknown[] = [null, undefined, 'nope', 42, true, [], {}]
    for (const raw of garbage) {
      const settings = normalizePreviewSettings(raw)
      expect(settings.layout).toBe('business-introduction')
      expect(settings.layers.length).toBeGreaterThan(0)
      expect(settings.width).toBe(1920)
      expect(settings.height).toBe(1080)
      expect(settings.fps).toBeGreaterThan(0)
      expect(settings.durationInFrames).toBeGreaterThan(0)
    }
  })

  it('ignores a non-array layers field', () => {
    const settings = normalizePreviewSettings({ layers: 'nope' })
    expect(settings.layers.map((layer) => layer.kind)).toEqual([
      'logo',
      'businessName',
      'headline',
    ])
  })

  it('drops layers with unknown kinds and clamps invalid coordinates', () => {
    const settings = normalizePreviewSettings({
      layers: [
        {
          id: 'headline',
          kind: 'headline',
          x: -3,
          y: 5,
          scale: 99,
          opacity: -1,
          animationDelay: -7,
          startFrame: -4,
          animation: 'spin',
        },
        { id: 'sparkles', kind: 'sparkles', x: 0.5 },
        { id: 'cta', kind: 'cta', text: 'Book now' },
      ],
    })
    expect(settings.layers.map((layer) => layer.id)).toEqual(['headline', 'cta'])

    const headline = settings.layers[0]
    expect(headline.x).toBe(0)
    expect(headline.y).toBe(1)
    expect(headline.scale).toBe(1)
    expect(headline.opacity).toBe(0)
    expect(headline.animationDelay).toBe(0)
    expect(headline.startFrame).toBe(0)
    expect(headline.animation).toBe('slide-up')

    const cta = settings.layers[1]
    expect(cta.text).toBe('Book now')
    expect(cta.animation).toBe('cta-pulse')
  })

  it('ensures unique layer ids by suffixing', () => {
    const settings = normalizePreviewSettings({
      layers: [
        { id: 'headline', kind: 'headline', text: 'first' },
        { id: 'headline', kind: 'headline', text: 'second' },
        { id: 'headline-2', kind: 'headline', text: 'third' },
      ],
    })
    expect(settings.layers.map((layer) => layer.id)).toEqual([
      'headline',
      'headline-2',
      'headline-2-2',
    ])
  })

  it('keeps valid scalars, ignores unknown fields and clamps out-of-range values', () => {
    const settings = normalizePreviewSettings({
      layout: 'special-offer',
      aspectRatio: '9:16',
      fps: 999,
      durationInFrames: -5,
      showEndCard: false,
      width: 1280,
      height: 720,
      brandColors: { primary: '#abcdef', accent: 12, text: '', backgroundDim: 3 },
      unknownField: 'ignored',
    })
    expect(settings.layout).toBe('special-offer')
    expect(settings.aspectRatio).toBe('9:16')
    expect(settings.fps).toBe(120)
    expect(settings.durationInFrames).toBe(150)
    expect(settings.showEndCard).toBe(false)
    expect(settings.brandColors.primary).toBe('#abcdef')
    expect(settings.brandColors.accent).toBe(DEFAULT_PREVIEW_BRAND_COLORS.accent)
    expect(settings.brandColors.text).toBe(DEFAULT_PREVIEW_BRAND_COLORS.text)
    expect(settings.brandColors.backgroundDim).toBe(1)
    expect((settings as unknown as Record<string, unknown>).unknownField).toBeUndefined()
  })
})

describe('toBox', () => {
  it('converts text layers from center coordinates and scale', () => {
    const layer = createLayer('headline', { x: 0.5, y: 0.5, scale: 0.05, text: 'Hello' })
    const box = toBox(layer, 1920, 1080)
    // fontSize = 0.05 * 1080; width = min(1920 * 0.9, fontSize * max(4, 5 * 0.55))
    expect(box.fontSizePx).toBe(54)
    expect(box.widthPx).toBe(216)
    expect(box.leftPx).toBe(Math.round(1920 * 0.5 - 216 / 2))
    expect(box.topPx).toBe(Math.round(1080 * 0.5 - 54 / 2))
  })

  it('converts image layers to a square box sized by width fraction', () => {
    const layer = createLayer('logo', { x: 0.08, y: 0.08 })
    const box = toBox(layer, 1920, 1080)
    expect(box.widthPx).toBe(422)
    expect(box.leftPx).toBe(Math.round(0.08 * 1920 - 422 / 2))
    expect(box.topPx).toBe(Math.max(0, Math.round(0.08 * 1080 - 422 / 2)))
  })

  it('clamps the top edge to the composition', () => {
    const layer = createLayer('headline', { x: 0, y: 0, scale: 0.2, text: 'x' })
    const box = toBox(layer, 1920, 1080)
    expect(box.topPx).toBe(0)
    expect(box.fontSizePx).toBe(216)
    expect(box.leftPx).toBe(Math.round(0 - Math.min(1920 * 0.9, 216 * 4) / 2))
  })
})

describe('positionForLayer', () => {
  it('returns the preset center for every position', () => {
    const layer = createLayer('headline')
    for (const position of PREVIEW_POSITIONS) {
      expect(positionForLayer(layer, position.id)).toEqual({ x: position.x, y: position.y })
    }
    expect(PREVIEW_POSITIONS).toHaveLength(8)
  })

  it('is the identity for unknown positions', () => {
    const layer = createLayer('headline', { x: 0.3, y: 0.7 })
    expect(positionForLayer(layer, 'middle-of-nowhere' as unknown as 'center')).toEqual({
      x: 0.3,
      y: 0.7,
    })
  })
})

describe('PREVIEW_LAYOUTS', () => {
  it('exposes exactly the five customer-facing layouts with names', () => {
    expect(PREVIEW_LAYOUTS.map((layout) => layout.id)).toEqual([
      'business-introduction',
      'product-showcase',
      'service-promotion',
      'special-offer',
      'branded-ending',
    ])
    expect(PREVIEW_LAYOUTS.map((layout) => layout.name)).toEqual([
      'Business Introduction',
      'Product Showcase',
      'Service Promotion',
      'Special Offer',
      'Branded Ending',
    ])
    for (const layout of PREVIEW_LAYOUTS) {
      expect(layout.description.length).toBeGreaterThan(0)
    }
  })

  it('keeps LAYER_IDS_BY_LAYOUT in sync with the layouts', () => {
    for (const layout of PREVIEW_LAYOUTS) {
      expect(LAYER_IDS_BY_LAYOUT[layout.id]).toBeDefined()
      expect(LAYER_IDS_BY_LAYOUT[layout.id].length).toBeGreaterThan(0)
    }
    expect(LAYER_IDS_BY_LAYOUT['business-introduction']).toEqual([
      'logo',
      'businessName',
      'headline',
    ])
    expect(LAYER_IDS_BY_LAYOUT['branded-ending']).toEqual([
      'logo',
      'businessName',
      'cta',
      'endCard',
    ])
  })
})

describe('fontStackById', () => {
  it('returns stacks for known fonts', () => {
    expect(fontStackById('inter')).toBe('Inter, ui-sans-serif, system-ui, sans-serif')
    expect(fontStackById('georgia')).toBe("Georgia, 'Times New Roman', serif")
    expect(fontStackById('impact')).toBe("Impact, 'Arial Black', sans-serif")
    expect(fontStackById('monospace')).toBe("ui-monospace, 'SF Mono', Menlo, monospace")
  })

  it('falls back to the default stack for unknown or missing ids', () => {
    expect(fontStackById()).toBe(fontStackById('inter'))
    expect(fontStackById('comic-sans')).toBe(fontStackById('inter'))
    expect(fontStackById('Inter, ui-sans-serif, system-ui, sans-serif')).toBe(
      fontStackById('inter'),
    )
  })
})

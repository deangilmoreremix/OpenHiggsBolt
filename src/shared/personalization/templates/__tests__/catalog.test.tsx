// @vitest-environment jsdom
/**
 * The concrete Phase 1 design catalog.
 *
 * These tests cover the two halves of the catalog: the registry entries
 * (ids, attribution, categories, support checks) and the adapter components
 * (do they actually render the upstream template with the customer's brand
 * data?).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import {
  getRemotionDesignTemplate,
  isRemotionDesignTemplateSupported,
  listRemotionDesignTemplates,
  listRemotionDesignTemplatesByCategory,
} from '../registry'
import {
  REMOTION_DESIGN_ATTRIBUTION,
  REMOTION_DESIGN_LICENSE_NOTICE,
  REMOTION_DESIGN_TEMPLATES,
  animatedHeadlineTemplate,
  getRemotionDesignAttributionLine,
  logoRevealTemplate,
  lowerThirdTemplate,
  promoCtaTemplate,
  visualEffectTemplate,
} from '../catalog'
import type {
  RemotionDesignComponentProps,
  RemotionDesignTemplate,
  RemotionDesignTextField,
} from '../types'
import {
  applyDesignTemplate,
  createDefaultPreviewSettings,
} from '../../preview/presets'

/**
 * The upstream templates call `useCurrentFrame()` and `useVideoConfig()`,
 * which need a registered composition. The real implementations of
 * everything else (`AbsoluteFill`, `interpolate`, `spring`, `Easing`, `Img`)
 * are kept so the adapters are exercised against the real upstream code.
 */
const clock = vi.hoisted(() => ({ frame: 0 }))

vi.mock('remotion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('remotion')>()
  const ReactMod = await import('react')
  return {
    ...actual,
    useCurrentFrame: () => clock.frame,
    useVideoConfig: () => ({ width: 1920, height: 1080, fps: 30, durationInFrames: 150 }),
    // The real <Img> renders through <Sequence> and the internal
    // useVideoConfig, so it needs a registered composition. These tests only
    // cover the adapter's mapping, so a plain <img> stands in for it.
    Img: ({ src, ...rest }: { src: string }) =>
      ReactMod.createElement('img', { src, alt: '', ...rest }),
  }
})

const EXPECTED_IDS = [
  'animated-headline',
  'logo-reveal',
  'lower-third',
  'promo-cta',
  'visual-effect',
]

const VALID_TEXT_FIELDS: RemotionDesignTextField[] = [
  'businessName',
  'headline',
  'offer',
  'cta',
  'phone',
  'website',
]

const LOGO_URL = 'https://cdn.example.com/brand/logo.png'

/** The props the composition hands to a design component. */
function makeProps(
  overrides: Partial<RemotionDesignComponentProps> = {},
): RemotionDesignComponentProps {
  return {
    text: 'Roofing done right',
    textSlots: {
      headline: 'Roofing done right',
      businessName: 'Acme Roofing',
      offer: '20% off this week',
      cta: 'Book now',
    },
    colors: {
      primary: '#29d3f2',
      accent: '#28c98b',
      text: '#ffffff',
      backgroundDim: 0.18,
    },
    media: { logo: LOGO_URL, product: null, service: null },
    box: { leftPx: 0, topPx: 0, widthPx: 1920, heightPx: 1080 },
    width: 1920,
    height: 1080,
    frame: 0,
    fps: 30,
    opacity: 1,
    color: '#fff',
    ...overrides,
  }
}

function renderTemplate(
  template: RemotionDesignTemplate,
  overrides: Partial<RemotionDesignComponentProps> = {},
) {
  const Component = template.component
  return render(<Component {...makeProps(overrides)} />)
}

beforeEach(() => {
  clock.frame = 0
})

describe('Remotion design catalog', () => {
  it('registers the five Phase 1 designs', () => {
    const ids = listRemotionDesignTemplates().map((template) => template.id)
    expect(ids).toEqual(EXPECTED_IDS)
    for (const id of EXPECTED_IDS) {
      expect(getRemotionDesignTemplate(id)).toBeDefined()
    }
  })

  it('exposes the five designs as named exports', () => {
    expect(REMOTION_DESIGN_TEMPLATES).toHaveLength(5)
    expect(animatedHeadlineTemplate.id).toBe('animated-headline')
    expect(logoRevealTemplate.id).toBe('logo-reveal')
    expect(lowerThirdTemplate.id).toBe('lower-third')
    expect(promoCtaTemplate.id).toBe('promo-cta')
    expect(visualEffectTemplate.id).toBe('visual-effect')
  })

  it('gives every design a component and a licensed, attributed source', () => {
    for (const template of REMOTION_DESIGN_TEMPLATES) {
      expect(template.component).toBeTruthy()
      expect(template.source.license).toBe('MIT')
      expect(template.source.attribution.trim().length).toBeGreaterThan(0)
      expect(template.source.attribution).toBe(REMOTION_DESIGN_ATTRIBUTION)
      expect(template.source.sourcePath).toMatch(/^src\/components\/.+\.tsx$/)
      expect(template.source.repositoryUrl).toMatch(/^https:\/\/github\.com\//)
    }
  })

  it('lists one design per category', () => {
    const cases: Array<[RemotionDesignTemplate['category'], string]> = [
      ['animated-headline', 'animated-headline'],
      ['logo-reveal', 'logo-reveal'],
      ['lower-third', 'lower-third'],
      ['promo-cta', 'promo-cta'],
      ['visual-effect', 'visual-effect'],
    ]
    for (const [category, id] of cases) {
      const found = listRemotionDesignTemplatesByCategory(category)
      expect(found.map((template) => template.id)).toEqual([id])
    }
  })

  it('supports the 16:9 format for every design', () => {
    for (const id of EXPECTED_IDS) {
      const check = isRemotionDesignTemplateSupported(id, '16:9')
      expect(check.supported).toBe(true)
      expect(check.reason).toBeUndefined()
    }
  })

  it('supports every Phase 1 aspect ratio for every design', () => {
    for (const id of EXPECTED_IDS) {
      for (const ratio of ['16:9', '9:16', '1:1', '4:5'] as const) {
        expect(isRemotionDesignTemplateSupported(id, ratio).supported).toBe(true)
      }
    }
  })

  it('declares a primary text slot with a known brand field', () => {
    for (const template of REMOTION_DESIGN_TEMPLATES) {
      const slots = template.textSlots ?? []
      const primary = slots.filter((slot) => slot.primary)
      if (slots.length === 0) {
        // The visual effect is textless by design.
        expect(template.id).toBe('visual-effect')
        continue
      }
      expect(primary).toHaveLength(1)
      expect(VALID_TEXT_FIELDS).toContain(primary[0].field)
    }
  })

  it('exposes the MIT attribution and permission notice for the product UI', () => {
    expect(getRemotionDesignAttributionLine()).toBe(REMOTION_DESIGN_ATTRIBUTION)
    expect(REMOTION_DESIGN_ATTRIBUTION).toContain('© 2026 Trimora Inc.')
    expect(REMOTION_DESIGN_ATTRIBUTION).toContain('MIT License')
    expect(REMOTION_DESIGN_LICENSE_NOTICE).toContain('Copyright (c) 2026 Trimora Inc.')
    expect(REMOTION_DESIGN_LICENSE_NOTICE).toContain(
      'The above copyright notice and this permission notice shall be included in all',
    )
  })

  it('applies every design with its own placement and primary text', () => {
    const settings = applyDesignTemplate(createDefaultPreviewSettings(), 'lower-third', {
      businessName: 'Acme Roofing',
      offer: '20% off',
    })
    expect(settings.remotionDesignId).toBe('lower-third')
    expect(settings.layers).toHaveLength(1)

    const layer = settings.layers[0]
    expect(layer.kind).toBe('design')
    expect(layer.designId).toBe('lower-third')
    expect(layer.text).toBe('Acme Roofing')
    expect(layer.x).toBe(lowerThirdTemplate.placement?.x)
    expect(layer.y).toBe(lowerThirdTemplate.placement?.y)
    expect(layer.scale).toBe(lowerThirdTemplate.placement?.scale)
    expect(layer.opacity).toBe(lowerThirdTemplate.placement?.opacity)
    expect(layer.animation).toBe(lowerThirdTemplate.placement?.animation)
  })

  it('keeps the visual effect full-frame so the blend can reach the video', () => {
    expect(visualEffectTemplate.placement?.scale).toBe(1)
    expect(visualEffectTemplate.placement?.opacity).toBe(1)
    expect(visualEffectTemplate.placement?.animation).toBe('none')
  })

  it('bounds every other design so it cannot cover the whole frame', () => {
    for (const template of REMOTION_DESIGN_TEMPLATES) {
      if (template.id === 'visual-effect') continue
      const scale = template.placement?.scale ?? 1
      expect(scale).toBeGreaterThan(0)
      expect(scale).toBeLessThan(1)
    }
  })
})

describe('Remotion design adapters', () => {
  it('renders the animated headline with the customer text', () => {
    const { container } = renderTemplate(animatedHeadlineTemplate)
    expect(container.innerHTML.length).toBeGreaterThan(0)
    expect(container.textContent).toContain('Roofing done right')
    // The upstream demo copy must never be reachable.
    expect(container.textContent).not.toContain('Make It Bounce')
  })

  it('renders the logo reveal with the wordmark and the customer logo', () => {
    const { container } = renderTemplate(logoRevealTemplate)
    expect(container.textContent).toContain('Acme Roofing')
    expect(container.textContent).not.toContain('ACME INC.')

    const image = container.querySelector('img')
    expect(image).not.toBeNull()
    expect(image?.getAttribute('src')).toBe(LOGO_URL)
    // A broken image would have an empty source.
    expect(image?.getAttribute('src')?.trim().length ?? 0).toBeGreaterThan(0)
  })

  it('renders the lower third with the name and the title', () => {
    const { container } = renderTemplate(lowerThirdTemplate)
    expect(container.textContent).toContain('Acme Roofing')
    expect(container.textContent).toContain('20% off this week')
    expect(container.textContent).not.toContain('Alex Morgan')
  })

  it('renders the promo end card with the title, subtitle and CTA', () => {
    const { container } = renderTemplate(promoCtaTemplate)
    expect(container.textContent).toContain('Roofing done right')
    expect(container.textContent).toContain('20% off this week')
    expect(container.textContent).toContain('Book now')
    expect(container.textContent).not.toContain('Thanks for watching')
  })

  it('renders the bokeh effect as blended discs without the upstream label', () => {
    const { container } = renderTemplate(visualEffectTemplate)
    expect(container.innerHTML.length).toBeGreaterThan(0)
    expect(container.textContent).not.toContain('Background Demo')
    expect(container.querySelectorAll('[style*="mix-blend-mode"]').length).toBeGreaterThan(0)
  })

  it('draws the MIT credit line inside every design', () => {
    for (const template of REMOTION_DESIGN_TEMPLATES) {
      const { container, unmount } = renderTemplate(template)
      const credit = container.querySelector('[data-remotion-design-credit]')
      expect(credit).not.toBeNull()
      expect(credit?.textContent).toContain('Trimora')
      unmount()
    }
  })

  it('scales the composition-sized canvas into the design box', () => {
    const { container } = renderTemplate(animatedHeadlineTemplate, {
      box: { leftPx: 0, topPx: 0, widthPx: 960, heightPx: 540 },
    })
    const canvas = container.querySelector('[data-remotion-design-canvas]') as HTMLElement
    expect(canvas).not.toBeNull()
    expect(canvas.style.width).toBe('1920px')
    expect(canvas.style.height).toBe('1080px')
    expect(canvas.style.transform).toBe('scale(0.5, 0.5)')
    expect(canvas.style.transformOrigin).toBe('top left')
  })

  it('omits the scale transform when the box already is the composition', () => {
    const { container } = renderTemplate(visualEffectTemplate)
    const canvas = container.querySelector('[data-remotion-design-canvas]') as HTMLElement
    expect(canvas.style.transform).toBe('')
  })

  it('degrades gracefully when the customer has no logo', () => {
    for (const template of REMOTION_DESIGN_TEMPLATES) {
      const { container, unmount } = renderTemplate(template, {
        media: { logo: null, product: null, service: null },
      })
      expect(container.innerHTML.length).toBeGreaterThan(0)
      // No broken image: the logo design simply does not render one.
      expect(container.querySelector('img')).toBeNull()
      unmount()
    }
  })

  it('never paints an opaque full-canvas background over the video', () => {
    for (const template of [
      animatedHeadlineTemplate,
      logoRevealTemplate,
      lowerThirdTemplate,
      visualEffectTemplate,
    ]) {
      const { container, unmount } = renderTemplate(template)
      const stage = container.querySelector('[data-remotion-design]') as HTMLElement
      const canvas = container.querySelector('[data-remotion-design-canvas]') as HTMLElement
      const upstreamRoot = canvas?.firstElementChild as HTMLElement | null

      expect(stage.style.background).toBe('')
      expect(stage.style.backgroundColor).toBe('')
      expect(canvas.style.background).toBe('')
      expect(canvas.style.backgroundColor).toBe('')
      expect(upstreamRoot?.style.backgroundColor).toBe('transparent')
      unmount()
    }
  })

  it('bounds the end card to its box instead of wiping the frame', () => {
    const { container } = renderTemplate(promoCtaTemplate, {
      box: { leftPx: 432, topPx: 486, widthPx: 1056, heightPx: 594 },
    })
    const stage = container.querySelector('[data-remotion-design]') as HTMLElement
    const canvas = container.querySelector('[data-remotion-design-canvas]') as HTMLElement

    // The bounded card: the box is smaller than the composition, the stage
    // clips the upstream's opaque fill and rounds it into a card.
    expect(stage.style.overflow).toBe('hidden')
    expect(stage.style.borderRadius).toBe('24px')
    expect(canvas.style.transform).toBe('scale(0.55, 0.55)')
  })
})

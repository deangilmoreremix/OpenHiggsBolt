// @vitest-environment jsdom
/**
 * Step 4 integration of the registered Remotion designs.
 *
 * These tests cover the whole path a design travels:
 *
 *   1. the customer picks one of the five designs in Step 4 (the picker sits
 *      NEXT TO the existing layout pills — it never replaces them);
 *   2. the selection reaches the composition through `inputProps.remotionDesignId`
 *      and the design's own props;
 *   3. an overlay design composites transparently over the customer's actual
 *      video, a full-frame design owns the frame, and the audio survives both;
 *   4. the design's copy and colours come from the personalization data the
 *      customer already entered (business name, offer, brand colours, logo).
 *
 * The provider hook is mocked (like the other guided-surface tests), so the
 * test drives the picker without mounting the whole wizard.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Player } from '@remotion/player'
import { REMOTION_DESIGN_REGISTRY } from '../../remotion/registry'
import { PREVIEW_LAYOUTS, createDefaultPreviewSettings, normalizePreviewSettings } from '../../preview/presets'
import type { PreviewInputProps } from '../../preview/types'

// ── Mocked provider context ──────────────────────────────────────────────────
// `vi.hoisted` keeps the mutable state reachable from the mock factory, which
// runs before the module body is evaluated.
const harness = vi.hoisted(() => ({
  previewSettings: null as any,
  clientForm: {} as any,
  assets: {} as any,
  capturedInputProps: null as any,
  setPreviewDesign: vi.fn(),
  updatePreviewDesignProps: vi.fn(),
  setPreviewLayout: vi.fn(),
  updatePreviewComposition: vi.fn(),
  updatePreviewLayer: vi.fn(),
  updatePreviewBrandColors: vi.fn(),
  resetPreviewLayout: vi.fn(),
  approvePersonalization: vi.fn(),
  createFinalVideo: vi.fn(),
  cancelExport: vi.fn(),
}))

vi.mock('../../DemoPersonalizeProvider', () => ({
  useDemoPersonalize: () => ({
    source: null,
    access: 'authenticated',
    clientForm: harness.clientForm,
    assets: harness.assets,
    previewSettings: harness.previewSettings,
    previewVideo: null,
    updatePreviewComposition: harness.updatePreviewComposition,
    updatePreviewLayer: harness.updatePreviewLayer,
    updatePreviewBrandColors: harness.updatePreviewBrandColors,
    setPreviewLayout: harness.setPreviewLayout,
    resetPreviewLayout: harness.resetPreviewLayout,
    setPreviewDesign: harness.setPreviewDesign,
    updatePreviewDesignProps: harness.updatePreviewDesignProps,
    previewApproved: false,
    approvePersonalization: harness.approvePersonalization,
    createFinalVideo: harness.createFinalVideo,
    cancelExport: harness.cancelExport,
    apiKey: '',
    generation: null,
    result: null,
    mode: null,
  }),
}))

// The before/after player is not under test here — the design is. It captures
// the input props it is handed, which is exactly what the composition renders.
vi.mock('../../preview/BeforeAfterPreview', () => ({
  BeforeAfterPreview: ({ inputProps }: { inputProps: any }) => {
    harness.capturedInputProps = inputProps
    return <div data-testid="before-after-preview" />
  },
}))

// The media components are stubbed so the test can observe exactly what the
// composition draws (and whether the video keeps its audio).
vi.mock('@remotion/media', () => ({
  Video: ({ src, muted }: { src: string; muted?: boolean }) => (
    <div data-testid="media-video" data-src={src} data-muted={muted ? 'true' : 'false'} />
  ),
  Audio: ({ src }: { src: string }) => <div data-testid="media-audio" data-src={src} />,
}))

import { StepPreviewApprove } from '../StepPreviewApprove'
import { PersonalizationComposition } from '../../preview/PersonalizationComposition'
import { buildPreviewInput } from '../buildPreviewInput'

const BRAND = {
  businessName: 'Acme Roofing',
  headline: 'Roofing done right',
  offer: 'Free inspection',
  cta: 'Visit acme.test',
  phone: '555-0100',
  website: 'https://acme.test',
  logoUrl: 'https://cdn.example.com/acme-logo.png',
  productUrl: null,
  serviceUrl: null,
}

const BRAND_COLORS = {
  primary: '#29d3f2',
  accent: '#28c98b',
  text: '#ffffff',
  backgroundDim: 0.18,
}

function makeInputProps(overrides: Partial<PreviewInputProps> = {}): PreviewInputProps {
  return {
    videoUrl: 'https://cdn.example.com/source.mp4',
    posterUrl: 'https://cdn.example.com/poster.jpg',
    isImageSource: false,
    audioUrl: 'https://cdn.example.com/music.mp3',
    settings: createDefaultPreviewSettings(),
    brand: { ...BRAND },
    ...overrides,
  }
}

beforeEach(() => {
  harness.previewSettings = createDefaultPreviewSettings()
  harness.clientForm = {}
  harness.assets = {}
  harness.setPreviewDesign.mockClear()
  harness.updatePreviewDesignProps.mockClear()
})

afterEach(() => {
  cleanup()
})

// ── 1. Selection ─────────────────────────────────────────────────────────────

describe('Step 4 motion design selection', () => {
  it('offers every registered design as a pill', () => {
    render(<StepPreviewApprove />)
    expect(REMOTION_DESIGN_REGISTRY.length).toBe(5)
    for (const design of REMOTION_DESIGN_REGISTRY) {
      const pill = screen.getByTestId(`design-pill-${design.id}`)
      expect(pill.textContent).toContain(design.name)
    }
  })

  it('keeps the existing layout pills next to the design pills', () => {
    render(<StepPreviewApprove />)
    for (const layout of PREVIEW_LAYOUTS) {
      expect(screen.getByText(layout.name)).toBeTruthy()
    }
    expect(screen.getByTestId('design-pill-none')).toBeTruthy()
  })

  it.each(REMOTION_DESIGN_REGISTRY.map((design) => [design.id, design.name] as const))(
    'selects the %s design',
    (id) => {
      render(<StepPreviewApprove />)
      fireEvent.click(screen.getByTestId(`design-pill-${id}`))
      expect(harness.setPreviewDesign).toHaveBeenCalledWith(id)
    },
  )

  it('clears the selection through the "Your layout" pill', () => {
    render(<StepPreviewApprove />)
    fireEvent.click(screen.getByTestId('design-pill-none'))
    expect(harness.setPreviewDesign).toHaveBeenCalledWith(null)
  })

  it('keeps the selected design when the preview settings are restored', () => {
    const restored = normalizePreviewSettings({
      ...createDefaultPreviewSettings(),
      remotionDesignId: 'social-reel',
      remotionDesignProps: { headline: 'Free inspection' },
    })
    expect(restored.remotionDesignId).toBe('social-reel')
    expect(restored.remotionDesignProps).toEqual({ headline: 'Free inspection' })
  })

  it('exposes the selected design copy and colours for editing', () => {
    harness.previewSettings = {
      ...createDefaultPreviewSettings(),
      remotionDesignId: 'lower-third-glass-card',
    }
    harness.clientForm = { businessName: 'Acme Roofing', offer: 'Free inspection' }

    render(<StepPreviewApprove />)

    const nameField = screen.getByLabelText('Design text: Name') as HTMLTextAreaElement
    expect(nameField.value).toBe('Acme Roofing')

    fireEvent.change(nameField, { target: { value: 'Acme Pro Roofing' } })
    expect(harness.updatePreviewDesignProps).toHaveBeenCalledWith({
      nameText: 'Acme Pro Roofing',
    })

    const colourField = screen.getByLabelText('Design colour: Accent colour') as HTMLInputElement
    expect(colourField.value).toBe(BRAND_COLORS.accent)
    fireEvent.change(colourField, { target: { value: '#ff0000' } })
    expect(harness.updatePreviewDesignProps).toHaveBeenCalledWith({ accentColor: '#ff0000' })
  })
})

// ── 2. The selection reaches the composition ─────────────────────────────────

describe('the selected design reaches the preview', () => {
  it('is carried on the preview input props', () => {
    harness.previewSettings = {
      ...createDefaultPreviewSettings(),
      remotionDesignId: 'social-reel',
    }
    harness.clientForm = { businessName: 'Acme Roofing', offer: 'Free inspection' }

    render(<StepPreviewApprove />)

    const props = harness.capturedInputProps as PreviewInputProps
    expect(props).not.toBeNull()
    expect(props.remotionDesignId).toBe('social-reel')
    expect(props.remotionDesignProps?.brandName).toBe('Acme Roofing')
    expect(props.remotionDesignProps?.headline).toBe('Free inspection')
  })

  it('leaves the input props untouched when no design is selected', () => {
    harness.clientForm = { businessName: 'Acme Roofing' }

    render(<StepPreviewApprove />)

    const props = harness.capturedInputProps as PreviewInputProps
    expect(props.remotionDesignId).toBeUndefined()
    expect(props.remotionDesignProps).toBeUndefined()
  })
})

// ── 4. The design is filled from the existing personalization data ───────────

describe('the design is filled from the existing personalization data', () => {
  const LOGO_URL = 'https://cdn.example.com/acme-logo.png'

  function buildFor(designId: string) {
    return buildPreviewInput({
      source: null,
      previewSettings: {
        ...createDefaultPreviewSettings(),
        remotionDesignId: designId,
      },
      previewVideo: null,
      clientForm: {
        businessName: 'Acme Roofing',
        offer: 'Free inspection',
        callToAction: 'Visit acme.test',
        phone: '555-0100',
        website: 'https://acme.test',
      },
      assets: {
        primaryLogo: { url: LOGO_URL, uploadedUrl: LOGO_URL },
      } as any,
    })
  }

  it('fills the headline design with the offer and the brand colours', () => {
    const props = buildFor('bounce-in-headline').remotionDesignProps ?? {}
    expect(props.headline).toBe('Free inspection')
    expect(props.background).toBe(BRAND_COLORS.primary)
    expect(props.color).toBe(BRAND_COLORS.accent)
  })

  it('fills the logo design with the business name, its monogram and the logo asset', () => {
    const props = buildFor('logo-mask-wipe').remotionDesignProps ?? {}
    expect(props.brandText).toBe('Acme Roofing')
    expect(props.monogram).toBe('AR')
    expect(props.logoImageUrl).toBe(LOGO_URL)
    expect(props.accentColor).toBe(BRAND_COLORS.accent)
    expect(props.textColor).toBe(BRAND_COLORS.text)
  })

  it('fills the lower third with the business name and the offer', () => {
    const props = buildFor('lower-third-glass-card').remotionDesignProps ?? {}
    expect(props.nameText).toBe('Acme Roofing')
    expect(props.titleText).toBe('Free inspection')
    expect(props.backgroundColor).toBe(BRAND_COLORS.primary)
  })

  it('fills the social reel with the business name, handle and contact lines', () => {
    const props = buildFor('social-reel').remotionDesignProps ?? {}
    expect(props.brandName).toBe('Acme Roofing')
    expect(props.handle).toBe('@acme')
    expect(props.ctaText).toBe('Visit acme.test')
    expect(props.infoLines).toContain('555-0100')
    expect(props.infoLines).toContain('https://acme.test')
  })

  it('fills the particle effect with the offer and the accent colour', () => {
    const props = buildFor('particle-explosion').remotionDesignProps ?? {}
    expect(props.text).toBe('Free inspection')
    expect(props.color).toBe(BRAND_COLORS.accent)
  })

  it('lets the customer own edits win over the derived values', () => {
    const inputProps = buildPreviewInput({
      source: null,
      previewSettings: {
        ...createDefaultPreviewSettings(),
        remotionDesignId: 'lower-third-glass-card',
        remotionDesignProps: { nameText: 'Acme Pro Roofing' },
      },
      previewVideo: null,
      clientForm: { businessName: 'Acme Roofing' },
      assets: {} as any,
    })
    expect(inputProps.remotionDesignProps?.nameText).toBe('Acme Pro Roofing')
  })
})

// ── 3. The composition actually renders the design ───────────────────────────

const mounted: Array<{ root: ReturnType<typeof createRoot>; container: HTMLElement }> = []

afterEach(() => {
  while (mounted.length > 0) {
    const { root, container } = mounted.pop()!
    act(() => root.unmount())
    container.remove()
  }
})

function renderComposition(inputProps: PreviewInputProps, frame = 30): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push({ root, container })

  act(() => {
    root.render(
      <Player
        component={PersonalizationComposition as never}
        inputProps={inputProps as never}
        durationInFrames={inputProps.settings.durationInFrames}
        fps={inputProps.settings.fps}
        compositionWidth={inputProps.settings.width}
        compositionHeight={inputProps.settings.height}
        initialFrame={frame}
        acknowledgeRemotionLicense
        style={{ width: 480, height: 270 }}
      />,
    )
  })

  return container
}

function designRoot(container: HTMLElement, id: string): HTMLElement {
  const root = container.querySelector<HTMLElement>(`[data-remotion-design-id="${id}"]`)
  expect(root).not.toBeNull()
  return root as HTMLElement
}

describe('PersonalizationComposition renders the selected design', () => {
  it('composites an overlay design transparently over the customer video', () => {
    const container = renderComposition(
      makeInputProps({
        remotionDesignId: 'lower-third-glass-card',
        remotionDesignProps: { nameText: 'Acme Roofing', titleText: 'Free inspection' },
      }),
    )

    const root = designRoot(container, 'lower-third-glass-card')
    // The overlay paints no background of its own — the footage stays visible.
    expect(root.getAttribute('style') ?? '').not.toMatch(/background(-color)?\s*:/i)

    // The customer's ACTUAL video is still the background layer…
    const video = container.querySelector('[data-testid="media-video"]')
    expect(video).not.toBeNull()
    expect(video?.getAttribute('data-src')).toBe('https://cdn.example.com/source.mp4')
    // …and it keeps its own audio track.
    expect(video?.getAttribute('data-muted')).toBe('false')

    // The customer's chosen music track survives as well.
    expect(container.querySelector('[data-testid="media-audio"]')).not.toBeNull()

    // The design's own copy is on screen.
    expect(container.textContent).toContain('Acme Roofing')
  })

  it('lets a full-frame design own the frame', () => {
    const container = renderComposition(
      makeInputProps({
        remotionDesignId: 'bounce-in-headline',
        remotionDesignProps: { headline: 'Free inspection', background: '#29d3f2' },
      }),
    )

    const root = designRoot(container, 'bounce-in-headline')
    // A full-frame design paints the frame.
    expect(root.getAttribute('style') ?? '').toMatch(/background(-color)?\s*:/i)

    // The design's copy is on screen…
    expect(container.textContent).toContain('Free inspection')
    // …and the footage is not drawn underneath it.
    expect(container.querySelector('[data-testid="media-video"]')).toBeNull()
    // The customer's music track still plays.
    expect(container.querySelector('[data-testid="media-audio"]')).not.toBeNull()
  })

  it('renders every registered design', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      const container = renderComposition(
        makeInputProps({ remotionDesignId: design.id, remotionDesignProps: {} }),
      )
      expect(designRoot(container, design.id)).toBeTruthy()
    }
  })

  it('keeps the previous behaviour when no design is selected', () => {
    const container = renderComposition(makeInputProps())

    expect(container.querySelector('[data-remotion-design-id]')).toBeNull()
    expect(container.querySelector('[data-testid="media-video"]')).not.toBeNull()
    // The built-in overlay layers still render.
    expect(container.textContent).toContain('Roofing done right')
  })
})

// @vitest-environment jsdom
/**
 * Certification for the browser export engine's REGISTERED DESIGN path.
 *
 * The engine can render a registered Remotion design instead of the
 * personalisation composition. These tests pin the whole contract:
 *
 *   - a design is selected by id and its prop overrides are applied;
 *   - the design's `defaultProps` merge with the overrides (overrides win);
 *   - the design's `durationInFrames` and `aspectRatios` drive the exported
 *     dimensions/duration;
 *   - `placement` decides whether the customer's video is composited under
 *     the design (overlay) or not (full-frame);
 *   - a dynamic `calculateMetadata` is forwarded to the renderer;
 *   - a design that is not `exportCapable` is rejected with a clear error;
 *   - REGRESSION: with no design the export is byte-for-byte what it always
 *     was — same composition id, same component, same props object.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import {
  buildRemotionDesignExportPlan,
  clearRegisteredRemotionDesigns,
  exportPersonalizedVideo,
  mergeRemotionDesignProps,
  registerRemotionDesign,
  registerRemotionDesigns,
  type RemotionDesignExportSpec,
} from '../webExport'
import { PERSONALIZATION_COMPOSITION_ID } from '../finalOutput'
import { PersonalizationComposition } from '../preview/PersonalizationComposition'
import { createDefaultPreviewSettings } from '../preview/presets'
import {
  audioCodecPresets,
  makeInputProps,
  makeStubBlob,
  videoCodecPresets,
} from './_webRendererHarness'

const mocks = vi.hoisted(() => ({
  canRenderMediaOnWeb: vi.fn(),
  renderMediaOnWeb: vi.fn(),
  getEncodableVideoCodecs: vi.fn(),
  getEncodableAudioCodecs: vi.fn(),
}))

vi.mock('@remotion/web-renderer', () => ({
  canRenderMediaOnWeb: mocks.canRenderMediaOnWeb,
  renderMediaOnWeb: mocks.renderMediaOnWeb,
  getEncodableVideoCodecs: mocks.getEncodableVideoCodecs,
  getEncodableAudioCodecs: mocks.getEncodableAudioCodecs,
}))

/**
 * `@remotion/media` is stubbed so the composited background is observable in
 * the DOM. The stub deliberately does what remotion's own media components do
 * — register themselves with the SequenceManager — so a composition that
 * forgot the no-op provider would throw here exactly like it does in a real
 * render.
 */
vi.mock('@remotion/media', async () => {
  const { createElement, useContext } = await import('react')
  const { Internals } = await import('remotion')
  return {
    Video: (props: { src: string }) => {
      const manager = useContext(Internals.SequenceManager) as unknown as {
        registerSequence: (sequence: unknown) => void
        unregisterSequence: (id: string) => void
      }
      manager.registerSequence({ id: 'mock-video-sequence' })
      manager.unregisterSequence('mock-video-sequence')
      return createElement('div', {
        'data-testid': 'media-video',
        'data-src': props.src,
      })
    },
    Audio: (props: { src: string }) =>
      createElement('div', {
        'data-testid': 'media-audio',
        'data-src': props.src,
      }),
  }
})

const { canRenderMediaOnWeb, renderMediaOnWeb, getEncodableVideoCodecs, getEncodableAudioCodecs } =
  mocks

beforeEach(() => {
  vi.clearAllMocks()
  clearRegisteredRemotionDesigns()
  getEncodableVideoCodecs.mockImplementation(videoCodecPresets.full)
  getEncodableAudioCodecs.mockImplementation(audioCodecPresets.full)
  canRenderMediaOnWeb.mockResolvedValue({ canRender: true, issues: [] as unknown[] })
  renderMediaOnWeb.mockImplementation(async () => ({
    getBlob: async () => makeStubBlob(),
  }))
})

afterEach(() => {
  clearRegisteredRemotionDesigns()
})

/** A design that records the props it was rendered with. */
const DesignComponent: React.FC<Record<string, unknown>> = (props) =>
  React.createElement('div', {
    'data-testid': 'design',
    'data-headline': String(props.headline ?? ''),
  })

function makeDesign(
  overrides: Partial<RemotionDesignExportSpec> = {},
): RemotionDesignExportSpec {
  return {
    id: 'bounce-in-headline',
    name: 'Bounce In Headline',
    component: DesignComponent,
    defaultProps: { headline: 'Default headline', color: '#ffffff' },
    durationInFrames: 90,
    placement: 'overlay',
    aspectRatios: ['16:9', '9:16'],
    exportCapable: true,
    ...overrides,
  }
}

/** The options the renderer was called with. */
function renderCall(index = 0): any {
  return renderMediaOnWeb.mock.calls[index][0] as any
}

/* ── Mounting a composition in jsdom ─────────────────────────────────────── */

const mounted: Array<{ root: ReturnType<typeof createRoot>; container: HTMLElement }> =
  []

function mountComposition(
  component: React.ComponentType<Record<string, unknown>>,
  props: Record<string, unknown>,
) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push({ root, container })
  act(() => {
    root.render(React.createElement(component, props))
  })
  return container
}

afterEach(() => {
  while (mounted.length > 0) {
    const { root, container } = mounted.pop()!
    act(() => root.unmount())
    container.remove()
  }
})

/* ────────────────────────────────────────────────────────────────────────── */

describe('registered design selection', () => {
  it('accepts a design id plus prop overrides on the export options', async () => {
    registerRemotionDesign(makeDesign())

    const result = await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { id: 'bounce-in-headline', props: { headline: 'Overridden' } },
    })

    expect(result.ok).toBe(true)
    const call = renderCall()
    // The design is exported under its own id, with its own duration.
    expect(call.composition.id).toBe('bounce-in-headline')
    expect(call.composition.durationInFrames).toBe(90)
    expect(call.composition.component).not.toBe(PersonalizationComposition)
  })

  it('rejects an unknown design id with a clear error', async () => {
    const result = await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { id: 'not-registered' },
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('unsupported-design')
    expect(result.error).toContain('not-registered')
    expect(result.error).toMatch(/not registered/i)
    // Nothing was rendered: the renderer is never even asked.
    expect(renderMediaOnWeb).not.toHaveBeenCalled()
  })

  it('rejects a design that is not export-capable instead of exporting it', async () => {
    registerRemotionDesign(
      makeDesign({ id: 'preview-only', exportCapable: false }),
    )

    const result = await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { id: 'preview-only' },
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('unsupported-design')
    expect(result.error).toMatch(/preview-only|cannot be exported/i)
    expect(renderMediaOnWeb).not.toHaveBeenCalled()
  })

  it('resolves a design through a caller-supplied resolver', async () => {
    const design = makeDesign({ id: 'resolved-elsewhere' })
    const resolver = vi.fn(() => design)

    const result = await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { id: 'resolved-elsewhere' },
      designResolver: resolver,
    })

    expect(result.ok).toBe(true)
    expect(resolver).toHaveBeenCalledWith('resolved-elsewhere')
    expect(renderCall().composition.id).toBe('resolved-elsewhere')
  })

  it('accepts a design record handed over directly, without registering it', async () => {
    const design = makeDesign({ id: 'handed-over' })

    const result = await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { ...design, props: { headline: 'Handed over' } },
    })

    expect(result.ok).toBe(true)
    const call = renderCall()
    expect(call.composition.id).toBe('handed-over')
    expect(call.inputProps).toEqual({
      headline: 'Handed over',
      color: '#ffffff',
    })
  })

  it('still refuses a handed-over design that is not export-capable', async () => {
    const design = makeDesign({ id: 'handed-over', exportCapable: false })

    const result = await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design,
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('unsupported-design')
    expect(renderMediaOnWeb).not.toHaveBeenCalled()
  })

  it('registers a whole list of designs at once', async () => {
    registerRemotionDesigns([makeDesign({ id: 'first' }), makeDesign({ id: 'second' })])

    for (const id of ['first', 'second']) {
      const result = await exportPersonalizedVideo({
        inputProps: makeInputProps(),
        design: { id },
      })
      expect(result.ok).toBe(true)
    }
  })
})

describe('design prop merging', () => {
  it('merges the design default props with the caller overrides (overrides win)', async () => {
    const design = makeDesign()
    registerRemotionDesign(design)

    await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { id: design.id, props: { headline: 'Overridden' } },
    })

    const call = renderCall()
    expect(call.inputProps).toEqual({
      headline: 'Overridden',
      color: '#ffffff',
    })
    // The design's own defaults survive where the caller said nothing.
    expect(call.inputProps.color).toBe('#ffffff')
    expect(call.composition.defaultProps).toEqual(call.inputProps)
  })

  it('keeps the design defaults untouched when there are no overrides', async () => {
    const design = makeDesign()
    registerRemotionDesign(design)

    await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { id: design.id },
    })

    expect(renderCall().inputProps).toEqual(design.defaultProps)
  })

  it('merges defaults and overrides in a pure helper too', () => {
    const design = makeDesign()
    expect(mergeRemotionDesignProps(design, { headline: 'X' })).toEqual({
      headline: 'X',
      color: '#ffffff',
    })
    expect(mergeRemotionDesignProps(design, undefined)).toEqual(
      design.defaultProps,
    )
  })
})

describe('design dimensions and duration', () => {
  it('drives the exported dimensions from the design aspect ratio', async () => {
    registerRemotionDesign(makeDesign({ aspectRatios: ['9:16'] }))

    await exportPersonalizedVideo({
      // The preview is 16:9, but the design only supports 9:16.
      inputProps: makeInputProps({
        settings: createDefaultPreviewSettings({
          aspectRatio: '16:9',
          width: 1920,
          height: 1080,
        }),
      }),
      design: { id: 'bounce-in-headline' },
    })

    const call = renderCall()
    expect(call.composition.width).toBe(1080)
    expect(call.composition.height).toBe(1920)
    expect(call.composition.width % 2).toBe(0)
    expect(call.composition.height % 2).toBe(0)
  })

  it('keeps the preview pixel size when the design supports the preview ratio', async () => {
    registerRemotionDesign(makeDesign({ aspectRatios: ['16:9'] }))

    await exportPersonalizedVideo({
      inputProps: makeInputProps({
        settings: createDefaultPreviewSettings({
          aspectRatio: '16:9',
          width: 1920,
          height: 1080,
        }),
      }),
      design: { id: 'bounce-in-headline' },
    })

    const call = renderCall()
    expect(call.composition.width).toBe(1920)
    expect(call.composition.height).toBe(1080)
  })

  it('drives the exported duration from the design, not the preview', async () => {
    registerRemotionDesign(makeDesign({ durationInFrames: 45 }))

    await exportPersonalizedVideo({
      // The preview is 150 frames long; the design is 45.
      inputProps: makeInputProps({
        settings: createDefaultPreviewSettings({ durationInFrames: 150 }),
      }),
      design: { id: 'bounce-in-headline' },
    })

    expect(renderCall().composition.durationInFrames).toBe(45)
  })

  it('exposes the plan (placement, dimensions, props) as a pure function', () => {
    const plan = buildRemotionDesignExportPlan({
      design: makeDesign({ placement: 'full-frame' }),
      overrides: { headline: 'Planned' },
      source: {
        sourceVideoUrl: '/media/demo.mp4',
        sourcePosterUrl: null,
        sourceAudioUrl: null,
      },
      preferredAspectRatio: '16:9',
      preferredWidth: 1920,
      preferredHeight: 1080,
    })

    expect(plan.compositionId).toBe('bounce-in-headline')
    expect(plan.placement).toBe('full-frame')
    expect(plan.compositesSourceVideo).toBe(false)
    expect(plan.width).toBe(1920)
    expect(plan.height).toBe(1080)
    expect(plan.durationInFrames).toBe(90)
    expect(plan.props).toEqual({ headline: 'Planned', color: '#ffffff' })
  })
})

describe('design placement', () => {
  it('composites the design over the customer video for an overlay design', async () => {
    registerRemotionDesign(makeDesign({ placement: 'overlay' }))

    await exportPersonalizedVideo({
      inputProps: makeInputProps({ videoUrl: '/media/demo.mp4' }),
      design: { id: 'bounce-in-headline' },
    })

    const call = renderCall()
    expect(call.composition.id).toBe('bounce-in-headline')

    const container = mountComposition(call.composition.component, call.inputProps)
    // The source video is the background layer, the design draws on top.
    const video = container.querySelector('[data-testid="media-video"]')
    expect(video).not.toBeNull()
    expect(video?.getAttribute('data-src')).toBe('/media/demo.mp4')
    expect(container.querySelector('[data-testid="design"]')).not.toBeNull()
  })

  it('renders the design as the whole frame for a full-frame design', async () => {
    registerRemotionDesign(makeDesign({ placement: 'full-frame' }))

    await exportPersonalizedVideo({
      inputProps: makeInputProps({ videoUrl: '/media/demo.mp4' }),
      design: { id: 'bounce-in-headline' },
    })

    const call = renderCall()
    const container = mountComposition(call.composition.component, call.inputProps)
    // No source video underneath: the design owns the frame.
    expect(container.querySelector('[data-testid="media-video"]')).toBeNull()
    expect(container.querySelector('[data-testid="design"]')).not.toBeNull()
  })

  it('keeps the customer audio track for both placements', async () => {
    for (const placement of ['overlay', 'full-frame'] as const) {
      registerRemotionDesign(makeDesign({ placement }))
      await exportPersonalizedVideo({
        inputProps: makeInputProps({ audioUrl: '/media/music.mp3' }),
        design: { id: 'bounce-in-headline' },
      })

      const call = renderCall()
      const container = mountComposition(
        call.composition.component,
        call.inputProps,
      )
      const audio = container.querySelector('[data-testid="media-audio"]')
      expect(audio?.getAttribute('data-src')).toBe('/media/music.mp3')
      mounted.length = 0
    }
  })

  it('renders a design that uses <Sequence> (the no-op SequenceManager stays in place)', async () => {
    // The stubbed <Video> registers itself with the SequenceManager, which
    // throws against remotion's default context. Rendering the composition
    // therefore proves the no-op provider is still supplied.
    registerRemotionDesign(makeDesign({ placement: 'overlay' }))

    await exportPersonalizedVideo({
      inputProps: makeInputProps({ videoUrl: '/media/demo.mp4' }),
      design: { id: 'bounce-in-headline' },
    })

    const call = renderCall()
    const container = mountComposition(call.composition.component, call.inputProps)
    expect(container.querySelector('[data-testid="media-video"]')).not.toBeNull()
  })
})

describe('calculateMetadata forwarding', () => {
  it('forwards a caller-supplied calculateMetadata to the renderer', async () => {
    const calculateMetadata = vi.fn(() => ({
      durationInFrames: 30,
      width: 720,
      height: 1280,
    }))

    await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      calculateMetadata,
    })

    const call = renderCall()
    expect(call.composition.calculateMetadata).toBe(calculateMetadata)
  })

  it('forwards the design own calculateMetadata when the caller has none', async () => {
    const designCalculateMetadata = vi.fn(() => ({ durationInFrames: 12 }))
    registerRemotionDesign(makeDesign({ calculateMetadata: designCalculateMetadata }))

    await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { id: 'bounce-in-headline' },
    })

    expect(renderCall().composition.calculateMetadata).toBe(
      designCalculateMetadata,
    )
  })

  it('lets a caller-supplied calculateMetadata win over the design one', async () => {
    const designCalculateMetadata = vi.fn(() => ({ durationInFrames: 12 }))
    const callerCalculateMetadata = vi.fn(() => ({ durationInFrames: 24 }))
    registerRemotionDesign(makeDesign({ calculateMetadata: designCalculateMetadata }))

    await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { id: 'bounce-in-headline' },
      calculateMetadata: callerCalculateMetadata,
    })

    expect(renderCall().composition.calculateMetadata).toBe(
      callerCalculateMetadata,
    )
  })

  it('omits calculateMetadata entirely when none was supplied', async () => {
    await exportPersonalizedVideo({ inputProps: makeInputProps() })

    const call = renderCall()
    expect('calculateMetadata' in call.composition).toBe(false)
  })
})

describe('regression: the existing export path is unchanged', () => {
  it('renders the personalisation composition with the approved props', async () => {
    const inputProps = makeInputProps({
      settings: createDefaultPreviewSettings({
        aspectRatio: '9:16',
        width: 1080,
        height: 1920,
        durationInFrames: 150,
        fps: 30,
      }),
    })

    const result = await exportPersonalizedVideo({ inputProps })

    expect(result.ok).toBe(true)
    const call = renderCall()
    expect(call.composition.id).toBe(PERSONALIZATION_COMPOSITION_ID)
    expect(call.composition.component).toBe(PersonalizationComposition)
    expect(call.composition.width).toBe(1080)
    expect(call.composition.height).toBe(1920)
    expect(call.composition.fps).toBe(30)
    expect(call.composition.durationInFrames).toBe(150)
    // The approved props are passed through untouched — same object.
    expect(call.inputProps).toBe(inputProps)
    expect(call.composition.defaultProps).toBe(inputProps)
    expect('calculateMetadata' in call.composition).toBe(false)
  })

  it('keeps the codec/container profile identical without a design', async () => {
    await exportPersonalizedVideo({ inputProps: makeInputProps() })

    const call = renderCall()
    expect(call.container).toBe('mp4')
    expect(call.videoCodec).toBe('h264')
    expect(call.audioCodec).toBe('aac')
    expect(call.muted).toBe(false)
  })

  it('does not touch the design path when no design is selected', async () => {
    await exportPersonalizedVideo({ inputProps: makeInputProps() })

    const call = renderCall()
    expect(call.composition.id).not.toBe('bounce-in-headline')
    expect(call.composition.component).not.toBe(DesignComponent)
  })
})

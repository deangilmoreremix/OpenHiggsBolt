// @vitest-environment jsdom
/**
 * END-TO-END verification of the five adapted Remotion designs through the
 * browser export chain.
 *
 * This file deliberately does NOT stub Remotion. Every design is mounted
 * through the REAL Remotion runtime (`@remotion/player` 4.0.499) with its
 * default props, so the assertions below are observations of Remotion's own
 * output, not of a test double:
 *
 *   - the design draws DOM (non-blank output);
 *   - an OVERLAY design paints no opaque backdrop, a FULL-FRAME design paints
 *     one — measured from the inline styles Remotion actually produced;
 *   - every editable copy value from `editableText` shows up in the rendered
 *     output (frame-aware, because `social-reel` reveals copy through
 *     `<Sequence>`);
 *   - the design's own `durationInFrames` is what the player is given (proved
 *     by the player's own last-frame clamp) and frame advancement works through
 *     `seekTo()` + the `frameupdate` event.
 *
 * The export chain is then verified end to end:
 *
 *   - `buildRemotionDesignExportPlan()` produces the exact plan for all five
 *     designs (duration, dimensions from `aspectRatios`, placement, merged
 *     props);
 *   - the composition actually handed to `@remotion/web-renderer` matches that
 *     plan;
 *   - the plan's component renders in the real Remotion runtime, so the thing
 *     the renderer would mount is proven to mount;
 *   - the customer's audio track survives in BOTH placements;
 *   - a preview-only design and an unknown id are rejected with
 *     `reason: 'unsupported-design'` before the renderer is ever loaded;
 *   - `calculateMetadata` is forwarded, and — proven against the INSTALLED
 *     renderer source and against Remotion's own `resolveVideoConfig()` — it is
 *     honoured.
 *
 * LIMITATION (stated up front, see the report): a real WebCodecs encode cannot
 * run under vitest/jsdom (no WebCodecs, no WebGL, no OffscreenCanvas). The
 * proof here is therefore (a) the exact composition object handed to the
 * renderer, plus (b) a real Remotion render of that exact composition. The
 * encode itself is not exercised.
 */

import React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { Player, type PlayerRef } from '@remotion/player'
import { Internals } from 'remotion'
import { Audio, Video } from '@remotion/media'
import {
  REMOTION_DESIGN_REGISTRY,
  getRemotionDesign,
} from '../remotion/registry'
import { SocialReel } from '../remotion/designs/social-reel'
import type { RemotionDesign } from '../remotion/registry'
import {
  buildRemotionDesignExportPlan,
  canonicalDimensionsForAspectRatio,
  clearRegisteredRemotionDesigns,
  exportPersonalizedVideo,
  registerRemotionDesign,
  registerRemotionDesigns,
  type RemotionDesignExportSpec,
} from '../webExport'
import { PERSONALIZATION_COMPOSITION_ID } from '../finalOutput'
import { PersonalizationComposition } from '../preview/PersonalizationComposition'
import { createDefaultPreviewSettings } from '../preview/presets'
import { makeInputProps } from './_webRendererHarness'

/* ──────────────────────────────────────────────────────────────────────────
 * The renderer is intercepted so the exact composition handed to it can be
 * inspected. The real module is NOT loaded (it needs WebCodecs); its INSTALLED
 * SOURCE is read from disk further down to prove `calculateMetadata` support.
 * ────────────────────────────────────────────────────────────────────────── */

const rendererMocks = vi.hoisted(() => ({
  canRenderMediaOnWeb: vi.fn(),
  renderMediaOnWeb: vi.fn(),
  getEncodableVideoCodecs: vi.fn(),
  getEncodableAudioCodecs: vi.fn(),
}))

vi.mock('@remotion/web-renderer', () => ({
  canRenderMediaOnWeb: rendererMocks.canRenderMediaOnWeb,
  renderMediaOnWeb: rendererMocks.renderMediaOnWeb,
  getEncodableVideoCodecs: rendererMocks.getEncodableVideoCodecs,
  getEncodableAudioCodecs: rendererMocks.getEncodableAudioCodecs,
}))

/**
 * `@remotion/media` is NOT stubbed — the real component renders, so the real
 * SequenceManager behaviour is exercised. It is only WRAPPED so the `src` it
 * receives becomes observable: Remotion renders a shared "warm-up" audio tag
 * in the DOM (a constant silent MP3 data URI), so the customer's track is not
 * visible in the DOM even though it is in the composition.
 */
const mediaRecorder = vi.hoisted(() => ({
  calls: [] as Array<{ kind: 'audio' | 'video'; src: string }>,
}))

vi.mock('@remotion/media', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@remotion/media')>()
  const { createElement } = await import('react')
  const wrap = (kind: 'audio' | 'video', Component: unknown) => {
    const Wrapped = (props: Record<string, unknown>) => {
      mediaRecorder.calls.push({ kind, src: String(props.src ?? '') })
      return createElement(Component as never, props as never)
    }
    ;(Wrapped as { displayName?: string }).displayName = `Recorded${kind}`
    return Wrapped
  }
  return {
    ...actual,
    Audio: wrap('audio', actual.Audio),
    Video: wrap('video', actual.Video),
  }
})

const {
  canRenderMediaOnWeb,
  renderMediaOnWeb,
  getEncodableVideoCodecs,
  getEncodableAudioCodecs,
} = rendererMocks

beforeEach(() => {
  vi.clearAllMocks()
  clearRegisteredRemotionDesigns()
  mediaRecorder.calls.length = 0
  getEncodableVideoCodecs.mockImplementation(async (container: string) =>
    container === 'mp4' ? ['h264'] : ['vp9', 'vp8'],
  )
  getEncodableAudioCodecs.mockImplementation(async (container: string) =>
    container === 'mp4' ? ['aac'] : ['opus', 'vorbis'],
  )
  canRenderMediaOnWeb.mockResolvedValue({ canRender: true, issues: [] })
  renderMediaOnWeb.mockImplementation(async () => ({
    getBlob: async () => new Blob(['stub-video-bytes'], { type: 'video/mp4' }),
  }))
})

afterEach(() => {
  clearRegisteredRemotionDesigns()
})

/* ──────────────────────────────────────────────────────────────────────────
 * Mounting helpers
 * ────────────────────────────────────────────────────────────────────────── */

const mounted: Array<{
  root: ReturnType<typeof createRoot>
  container: HTMLElement
}> = []

afterEach(() => {
  while (mounted.length > 0) {
    const { root, container } = mounted.pop()!
    act(() => root.unmount())
    container.remove()
  }
})

function mountNode(node: React.ReactNode): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push({ root, container })
  act(() => {
    root.render(node)
  })
  return container
}

/** Mounts a design in the REAL Remotion player runtime. */
function renderDesignInPlayer(
  design: RemotionDesign,
  options: {
    frame?: number
    props?: Record<string, unknown>
    width?: number
    height?: number
    durationInFrames?: number
  } = {},
): { container: HTMLElement; ref: React.RefObject<PlayerRef | null> } {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push({ root, container })
  const ref = React.createRef<PlayerRef>()

  act(() => {
    root.render(
      <Player
        ref={ref}
        component={design.component as never}
        inputProps={{ ...design.defaultProps, ...(options.props ?? {}) }}
        durationInFrames={options.durationInFrames ?? design.durationInFrames}
        fps={30}
        compositionWidth={options.width ?? 1920}
        compositionHeight={options.height ?? 1080}
        initialFrame={options.frame ?? 0}
        acknowledgeRemotionLicense
        style={{ width: 480, height: 270 }}
      />,
    )
  })

  return { container, ref }
}

function designRoot(container: HTMLElement, id: string): HTMLElement {
  const root = container.querySelector<HTMLElement>(
    `[data-remotion-design-id="${id}"]`,
  )
  expect(root, `${id} did not render its design root`).not.toBeNull()
  return root as HTMLElement
}

/**
 * Captures errors thrown while React commits (including inside effects), which
 * is where Remotion's SequenceManager registration fails.
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Background-paint measurement
 *
 * The designs declare their backgrounds as inline styles, so the inline style
 * attribute is the authoritative record of what was painted. Colours are
 * parsed to an alpha so "translucent" and "opaque" are distinguished.
 * ────────────────────────────────────────────────────────────────────────── */

type PaintKind = 'opaque' | 'translucent' | 'transparent' | 'unknown'

function alphaOfColor(color: string): number | null {
  const value = color.trim()
  if (value === '') return null
  if (value === 'transparent') return 0
  if (value === 'none') return null

  const rgba = /^rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*(?:,\s*([\d.]+%?)\s*)?\)$/i.exec(
    value,
  )
  if (rgba) {
    if (rgba[4] === undefined) return 1
    return rgba[4].endsWith('%')
      ? Number(rgba[4].slice(0, -1)) / 100
      : Number(rgba[4])
  }

  const hex = /^#([0-9a-f]{3,8})$/i.exec(value)
  if (hex) {
    const h = hex[1]
    if (h.length === 4) return parseInt(h[3] + h[3], 16) / 255
    if (h.length === 8) return parseInt(h.slice(6, 8), 16) / 255
    return 1
  }

  if (/^hsla?\(/i.test(value)) {
    const alpha = /,\s*([\d.]+%?)\s*\)$/i.exec(value)
    if (!alpha) return 1
    return alpha[1].endsWith('%')
      ? Number(alpha[1].slice(0, -1)) / 100
      : Number(alpha[1])
  }

  return null
}

const COLOR_TOKEN =
  /rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]{3,8}\b|\btransparent\b/gi

/** Classifies a CSS background value as opaque / translucent / unknown. */
function classifyBackground(value: string): PaintKind {
  const raw = value.trim()
  if (raw === '') return 'transparent'
  if (/^none$/i.test(raw)) return 'transparent'

  if (/gradient\(/i.test(raw)) {
    const stops = raw.match(COLOR_TOKEN) ?? []
    if (stops.length === 0) return 'unknown'
    const alphas = stops
      .map((stop) => alphaOfColor(stop))
      .filter((a): a is number => a !== null)
    if (alphas.length === 0) return 'unknown'
    return alphas.every((a) => a >= 1) ? 'opaque' : 'translucent'
  }

  const alpha = alphaOfColor(raw)
  if (alpha === null) return 'unknown'
  if (alpha <= 0) return 'transparent'
  return alpha >= 1 ? 'opaque' : 'translucent'
}

/** The background an element actually paints, honouring the shorthand. */
function backgroundOf(element: HTMLElement): { value: string; kind: PaintKind } {
  const shorthand = element.style.background
  if (shorthand && shorthand.trim() !== '') {
    return { value: shorthand, kind: classifyBackground(shorthand) }
  }
  const color = element.style.backgroundColor
  if (color && color.trim() !== '') {
    return { value: color, kind: classifyBackground(color) }
  }
  return { value: '', kind: 'transparent' }
}

/**
 * True when the element is an inset-0 absolute box, i.e. it geometrically
 * covers the whole frame and would hide the footage underneath it.
 */
function coversFrame(element: HTMLElement): boolean {
  const style = element.style
  if (style.position !== 'absolute') return false
  const isZero = (v: string) => v === '0' || v === '0px'
  return isZero(style.right) && isZero(style.bottom)
}

/** Every element inside the design root that paints an opaque backdrop. */
function opaqueBackdrops(root: HTMLElement): string[] {
  const found: string[] = []
  const walk = (element: HTMLElement) => {
    const { value, kind } = backgroundOf(element)
    if (kind === 'opaque' && coversFrame(element)) {
      found.push(`${element.tagName.toLowerCase()}[${value}]`)
    }
    for (const child of Array.from(element.children)) {
      walk(child as HTMLElement)
    }
  }
  walk(root)
  return found
}

/* ──────────────────────────────────────────────────────────────────────────
 * Editable-copy helpers
 * ────────────────────────────────────────────────────────────────────────── */

/** Collapses whitespace so multi-line copy compares reliably. */
function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** The non-empty default values of a design's editable text props. */
function editableCopyValues(
  design: RemotionDesign,
): Array<{ prop: string; value: string }> {
  const out: Array<{ prop: string; value: string }> = []
  for (const prop of design.editableText) {
    const raw = design.defaultProps[prop]
    if (typeof raw === 'string') {
      if (raw.trim().length > 0) out.push({ prop, value: raw })
      continue
    }
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (typeof item === 'string' && item.trim().length > 0) {
          out.push({ prop, value: item })
        }
      }
    }
  }
  return out
}

/** Frames sampled across a design, always inside its own duration. */
function sampleFrames(design: RemotionDesign): number[] {
  const last = design.durationInFrames - 1
  const wanted = [0, 5, 12, 24, 40, 48, 60, 72, 90, 100, 120, 130, 145]
  return wanted.filter((f) => f <= last).concat([last])
}

/* ──────────────────────────────────────────────────────────────────────────
 * Registry → export spec
 * ────────────────────────────────────────────────────────────────────────── */

function toExportSpec(design: RemotionDesign): RemotionDesignExportSpec {
  return {
    id: design.id,
    name: design.name,
    component: design.component as unknown as React.ComponentType<
      Record<string, unknown>
    >,
    defaultProps: design.defaultProps,
    durationInFrames: design.durationInFrames,
    placement: design.placement,
    aspectRatios: design.aspectRatios,
    exportCapable: design.exportCapable,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * 1. REAL RENDER TEST — every design in the real Remotion runtime
 * ────────────────────────────────────────────────────────────────────────── */

describe('1. real render: every design mounts in the Remotion runtime', () => {
  it('renders all five designs with non-blank output', () => {
    expect(REMOTION_DESIGN_REGISTRY).toHaveLength(5)

    for (const design of REMOTION_DESIGN_REGISTRY) {
      const { container } = renderDesignInPlayer(design)
      const root = designRoot(container, design.id)

      // Non-blank: the design drew real DOM, not an empty container.
      const descendants = root.querySelectorAll('*').length
      expect(descendants, `${design.id} drew no elements`).toBeGreaterThan(0)

      // The player mounted the composition, not an error fallback.
      expect(container.querySelector('canvas')).toBeNull()
      expect(container.innerHTML.length).toBeGreaterThan(0)
    }
  })

  it('paints an opaque background for full-frame designs and none for overlays', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      const { container } = renderDesignInPlayer(design)
      const root = designRoot(container, design.id)
      const { value, kind } = backgroundOf(root)
      const backdrops = opaqueBackdrops(root)

      if (design.placement === 'overlay') {
        // The root of an overlay must not paint a backdrop of its own…
        expect(
          kind,
          `${design.id} is an overlay but its root paints "${value}"`,
        ).toBe('transparent')
        // …and no inset-0 layer inside it may hide the footage either.
        expect(
          backdrops,
          `${design.id} is an overlay but paints an opaque backdrop: ${backdrops.join(', ')}`,
        ).toEqual([])
      } else {
        expect(
          kind,
          `${design.id} is full-frame but its root paints "${value}"`,
        ).toBe('opaque')
      }
    }
  })

  it('shows every editable copy value in the rendered output', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      const { container, ref } = renderDesignInPlayer(design)
      const frames = sampleFrames(design)

      // `social-reel` reveals copy through <Sequence>, so the whole duration is
      // sampled and the union of the visible text is checked.
      const seen = new Set<string>()
      for (const frame of frames) {
        act(() => {
          ref.current?.seekTo(frame)
        })
        seen.add(normalize(container.textContent ?? ''))
      }
      const allText = Array.from(seen).join(' | ')

      for (const { prop, value } of editableCopyValues(design)) {
        expect(
          allText,
          `${design.id}: editable copy "${value}" (prop "${prop}") is not in the rendered output`,
        ).toContain(normalize(value))
      }
    }
  })

  it('uses the design duration and advances frames through seekTo + frameupdate', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      const { container, ref } = renderDesignInPlayer(design)
      const player = ref.current
      expect(player, `${design.id} produced no player instance`).not.toBeNull()

      // The player's own last-frame clamp proves WHICH duration it was given:
      // seeking past the end lands on durationInFrames - 1.
      const last = design.durationInFrames - 1
      const frames: number[] = []
      const listener = (event: { detail: { frame: number } }) => {
        frames.push(event.detail.frame)
      }
      player!.addEventListener('frameupdate', listener)

      act(() => {
        player!.seekTo(design.durationInFrames + 50)
      })
      expect(
        player!.getCurrentFrame(),
        `${design.id} was not given its own durationInFrames`,
      ).toBe(last)

      act(() => {
        player!.seekTo(0)
      })
      expect(player!.getCurrentFrame()).toBe(0)

      const target = Math.min(30, last)
      act(() => {
        player!.seekTo(target)
      })
      expect(player!.getCurrentFrame()).toBe(target)

      // The frame really advanced: the design's own pixels changed.
      const before = designRoot(container, design.id).innerHTML
      act(() => {
        player!.seekTo(target === 0 ? 1 : 0)
      })
      const after = designRoot(container, design.id).innerHTML
      expect(
        after,
        `${design.id} did not react to the frame change`,
      ).not.toBe(before)

      expect(
        frames.length,
        `${design.id} never emitted a frameupdate event`,
      ).toBeGreaterThan(0)
      expect(frames).toContain(target)
      player!.removeEventListener('frameupdate', listener)
    }
  })
})

/* ──────────────────────────────────────────────────────────────────────────
 * 2. EXPORT CHAIN — the plan and the composition handed to the renderer
 * ────────────────────────────────────────────────────────────────────────── */

describe('2. export chain: the plan and the renderer composition', () => {
  it('builds the correct plan for every design', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      const spec = toExportSpec(design)
      const overrides = { [design.editableText[0]]: 'OVERRIDDEN COPY' }
      const plan = buildRemotionDesignExportPlan({
        design: spec,
        overrides,
        source: {
          sourceVideoUrl: '/media/demo.mp4',
          sourcePosterUrl: null,
          sourceAudioUrl: null,
        },
        preferredAspectRatio: '16:9',
        preferredWidth: 1920,
        preferredHeight: 1080,
      })

      expect(plan.compositionId).toBe(design.id)
      expect(plan.durationInFrames).toBe(design.durationInFrames)
      expect(plan.placement).toBe(design.placement)
      expect(plan.compositesSourceVideo).toBe(design.placement === 'overlay')
      expect(plan.width).toBe(1920)
      expect(plan.height).toBe(1080)

      // Merged props: defaults first, overrides win.
      expect(plan.props).toEqual({
        ...design.defaultProps,
        ...overrides,
      })
      expect(plan.props[design.editableText[0]]).toBe('OVERRIDDEN COPY')
    }
  })

  it('derives the export dimensions from each design aspect ratio', () => {
    const expected: Record<string, { width: number; height: number }> = {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '1:1': { width: 1080, height: 1080 },
      '4:5': { width: 1080, height: 1350 },
    }

    for (const design of REMOTION_DESIGN_REGISTRY) {
      for (const ratio of design.aspectRatios) {
        const plan = buildRemotionDesignExportPlan({
          design: toExportSpec(design),
          source: {
            sourceVideoUrl: null,
            sourcePosterUrl: null,
            sourceAudioUrl: null,
          },
          preferredAspectRatio: ratio,
          preferredWidth: null,
          preferredHeight: null,
        })
        const want = expected[ratio] ?? canonicalDimensionsForAspectRatio(ratio)
        expect(
          plan.width,
          `${design.id} @ ${ratio}`,
        ).toBe(want.width)
        expect(
          plan.height,
          `${design.id} @ ${ratio}`,
        ).toBe(want.height)
        // h264 needs even dimensions.
        expect(plan.width % 2).toBe(0)
        expect(plan.height % 2).toBe(0)
      }
    }
  })

  it('hands the renderer exactly the plan for every design', async () => {
    registerRemotionDesigns(REMOTION_DESIGN_REGISTRY.map(toExportSpec))

    for (const design of REMOTION_DESIGN_REGISTRY) {
      const overrides = { [design.editableText[0]]: 'PLAN OVERRIDE' }
      const result = await exportPersonalizedVideo({
        inputProps: makeInputProps({
          settings: createDefaultPreviewSettings({
            aspectRatio: '16:9',
            width: 1920,
            height: 1080,
          }),
        }),
        design: { id: design.id, props: overrides },
      })

      expect(result.ok, `${design.id} export failed`).toBe(true)
      const call = renderMediaOnWeb.mock.calls.at(-1)![0] as any
      const composition = call.composition

      expect(composition.id).toBe(design.id)
      expect(composition.durationInFrames).toBe(design.durationInFrames)
      expect(composition.width).toBe(1920)
      expect(composition.height).toBe(1080)
      expect(call.inputProps).toEqual({
        ...design.defaultProps,
        ...overrides,
      })
      expect(composition.defaultProps).toEqual(call.inputProps)
      expect(composition.component).not.toBe(PersonalizationComposition)
    }
  })

  it('renders the plan component itself in the real Remotion runtime', () => {
    for (const design of REMOTION_DESIGN_REGISTRY) {
      const plan = buildRemotionDesignExportPlan({
        design: toExportSpec(design),
        source: {
          sourceVideoUrl: null,
          sourcePosterUrl: null,
          sourceAudioUrl: null,
        },
        preferredAspectRatio: '16:9',
        preferredWidth: 1920,
        preferredHeight: 1080,
      })

      // The plan's component is what the renderer mounts. Mount THAT in the
      // real Remotion runtime, not the bare design.
      const container = mountNode(
        <Player
          component={plan.component as never}
          inputProps={plan.props}
          durationInFrames={plan.durationInFrames}
          fps={30}
          compositionWidth={plan.width}
          compositionHeight={plan.height}
          initialFrame={0}
          acknowledgeRemotionLicense
          style={{ width: 480, height: 270 }}
        />,
      )

      const root = designRoot(container, design.id)
      expect(root.querySelectorAll('*').length).toBeGreaterThan(0)

      // The plan wrapped the design in a transparent AbsoluteFill.
      const transparentLayer = container.querySelector<HTMLElement>(
        'div[style*="background: transparent"]',
      )
      expect(
        transparentLayer,
        `${design.id}: the plan did not wrap the design in a transparent layer`,
      ).not.toBeNull()
    }
  })
})

/* ──────────────────────────────────────────────────────────────────────────
 * 3. calculateMetadata
 * ────────────────────────────────────────────────────────────────────────── */

describe('3. calculateMetadata forwarding and honouring', () => {
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

    const call = renderMediaOnWeb.mock.calls.at(-1)![0] as any
    expect(call.composition.calculateMetadata).toBe(calculateMetadata)
  })

  it('forwards a design own calculateMetadata', async () => {
    const designCalculateMetadata = vi.fn(() => ({ durationInFrames: 12 }))
    registerRemotionDesign({
      ...toExportSpec(REMOTION_DESIGN_REGISTRY[0]),
      calculateMetadata: designCalculateMetadata,
    })

    await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { id: REMOTION_DESIGN_REGISTRY[0].id },
    })

    const call = renderMediaOnWeb.mock.calls.at(-1)![0] as any
    expect(call.composition.calculateMetadata).toBe(designCalculateMetadata)
  })

  it('keeps the no-design path identical when calculateMetadata is absent', async () => {
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
    const call = renderMediaOnWeb.mock.calls.at(-1)![0] as any
    expect(call.composition.id).toBe(PERSONALIZATION_COMPOSITION_ID)
    expect(call.composition.component).toBe(PersonalizationComposition)
    expect(call.composition.width).toBe(1080)
    expect(call.composition.height).toBe(1920)
    expect(call.composition.fps).toBe(30)
    expect(call.composition.durationInFrames).toBe(150)
    // Same object identity: the approved props are not copied or altered.
    expect(call.inputProps).toBe(inputProps)
    expect(call.composition.defaultProps).toBe(inputProps)
    // No calculateMetadata key at all.
    expect('calculateMetadata' in call.composition).toBe(false)
    // The codec/container profile is untouched.
    expect(call.container).toBe('mp4')
    expect(call.videoCodec).toBe('h264')
    expect(call.audioCodec).toBe('aac')
    expect(call.muted).toBe(false)
  })

  it('the INSTALLED renderer honours calculateMetadata', () => {
    const require = createRequire(import.meta.url)
    const pkgPath = require.resolve('@remotion/web-renderer/package.json')
    const rendererSource = readFileSync(
      join(dirname(pkgPath), 'dist', 'esm', 'index.mjs'),
      'utf8',
    )

    // The renderer resolves the composition through resolveVideoConfig() with
    // the caller's calculateMetadata, BEFORE it renders a single frame.
    expect(rendererSource).toContain('calculateMetadata: composition.calculateMetadata ?? null')
    expect(rendererSource).toContain('Internals9.resolveVideoConfig')
    expect(rendererSource).toContain('Internals10.resolveVideoConfig')

    // The public type admits it too.
    const typeSource = readFileSync(
      join(dirname(pkgPath), 'dist', 'props-if-has-props.d.ts'),
      'utf8',
    )
    expect(typeSource).toContain('calculateMetadata?: CalculateMetadataFunction')
  })

  it('Remotion own resolveVideoConfig applies the calculated metadata', async () => {
    // This is the exact function the installed renderer calls.
    const calculateMetadata = vi.fn(() => ({
      durationInFrames: 7,
      width: 640,
      height: 360,
      fps: 24,
    }))

    const resolved = await (
      Internals as unknown as {
        resolveVideoConfig: (args: Record<string, unknown>) => Promise<{
          width: number
          height: number
          fps: number
          durationInFrames: number
        }>
      }
    ).resolveVideoConfig({
      calculateMetadata,
      signal: new AbortController().signal,
      defaultProps: { a: 1 },
      inputProps: { a: 1 },
      compositionId: 'probe',
      compositionDurationInFrames: 100,
      compositionFps: 30,
      compositionWidth: 1920,
      compositionHeight: 1080,
    })

    expect(calculateMetadata).toHaveBeenCalled()
    expect(resolved.width).toBe(640)
    expect(resolved.height).toBe(360)
    expect(resolved.fps).toBe(24)
    expect(resolved.durationInFrames).toBe(7)

    // Without calculateMetadata the explicit composition values are used.
    const withoutMetadata = await (
      Internals as unknown as {
        resolveVideoConfig: (args: Record<string, unknown>) => Promise<{
          width: number
          height: number
          fps: number
          durationInFrames: number
        }>
      }
    ).resolveVideoConfig({
      calculateMetadata: null,
      signal: new AbortController().signal,
      defaultProps: { a: 1 },
      inputProps: { a: 1 },
      compositionId: 'probe',
      compositionDurationInFrames: 100,
      compositionFps: 30,
      compositionWidth: 1920,
      compositionHeight: 1080,
    })

    expect(withoutMetadata.width).toBe(1920)
    expect(withoutMetadata.height).toBe(1080)
    expect(withoutMetadata.fps).toBe(30)
    expect(withoutMetadata.durationInFrames).toBe(100)
  })
})

/* ──────────────────────────────────────────────────────────────────────────
 * 4. Audio preservation in BOTH placements
 * ────────────────────────────────────────────────────────────────────────── */

describe('4. the customer audio track survives in both placements', () => {
  it('keeps the audio layer for an overlay design', () => {
    const design = getRemotionDesign('lower-third-glass-card') as RemotionDesign
    const plan = buildRemotionDesignExportPlan({
      design: toExportSpec(design),
      source: {
        sourceVideoUrl: '/media/demo.mp4',
        sourcePosterUrl: null,
        sourceAudioUrl: '/media/music.mp3',
      },
      preferredAspectRatio: '16:9',
      preferredWidth: 1920,
      preferredHeight: 1080,
    })

    const container = mountNode(
      <Player
        component={plan.component as never}
        inputProps={plan.props}
        durationInFrames={plan.durationInFrames}
        fps={30}
        compositionWidth={plan.width}
        compositionHeight={plan.height}
        initialFrame={0}
        acknowledgeRemotionLicense
        style={{ width: 480, height: 270 }}
      />,
    )

    const audio = container.querySelector('audio')
    expect(audio, 'the overlay composition dropped the audio track').not.toBeNull()
    expect(
      mediaRecorder.calls.filter((call) => call.kind === 'audio'),
    ).toEqual([{ kind: 'audio', src: '/media/music.mp3' }])
  })

  it('keeps the audio layer for a full-frame design', () => {
    const design = getRemotionDesign('social-reel') as RemotionDesign
    const plan = buildRemotionDesignExportPlan({
      design: toExportSpec(design),
      source: {
        sourceVideoUrl: '/media/demo.mp4',
        sourcePosterUrl: null,
        sourceAudioUrl: '/media/music.mp3',
      },
      preferredAspectRatio: '16:9',
      preferredWidth: 1920,
      preferredHeight: 1080,
    })

    const container = mountNode(
      <Player
        component={plan.component as never}
        inputProps={plan.props}
        durationInFrames={plan.durationInFrames}
        fps={30}
        compositionWidth={plan.width}
        compositionHeight={plan.height}
        initialFrame={0}
        acknowledgeRemotionLicense
        style={{ width: 480, height: 270 }}
      />,
    )

    const audio = container.querySelector('audio')
    expect(audio, 'the full-frame composition dropped the audio track').not.toBeNull()
    expect(
      mediaRecorder.calls.filter((call) => call.kind === 'audio'),
    ).toEqual([{ kind: 'audio', src: '/media/music.mp3' }])
  })

  it('places the source video under an overlay and not under a full-frame design', () => {
    const overlay = getRemotionDesign('lower-third-glass-card') as RemotionDesign
    const overlayPlan = buildRemotionDesignExportPlan({
      design: toExportSpec(overlay),
      source: {
        sourceVideoUrl: '/media/demo.mp4',
        sourcePosterUrl: null,
        sourceAudioUrl: null,
      },
      preferredAspectRatio: '16:9',
      preferredWidth: 1920,
      preferredHeight: 1080,
    })
    const overlayContainer = mountNode(
      <Player
        component={overlayPlan.component as never}
        inputProps={overlayPlan.props}
        durationInFrames={overlayPlan.durationInFrames}
        fps={30}
        compositionWidth={overlayPlan.width}
        compositionHeight={overlayPlan.height}
        initialFrame={0}
        acknowledgeRemotionLicense
        style={{ width: 480, height: 270 }}
      />,
    )
    expect(overlayContainer.querySelector('video')).not.toBeNull()
    expect(
      mediaRecorder.calls.filter((call) => call.kind === 'video'),
    ).toEqual([{ kind: 'video', src: '/media/demo.mp4' }])

    const fullFrame = getRemotionDesign('social-reel') as RemotionDesign
    const fullFramePlan = buildRemotionDesignExportPlan({
      design: toExportSpec(fullFrame),
      source: {
        sourceVideoUrl: '/media/demo.mp4',
        sourcePosterUrl: null,
        sourceAudioUrl: null,
      },
      preferredAspectRatio: '16:9',
      preferredWidth: 1920,
      preferredHeight: 1080,
    })
    const fullFrameContainer = mountNode(
      <Player
        component={fullFramePlan.component as never}
        inputProps={fullFramePlan.props}
        durationInFrames={fullFramePlan.durationInFrames}
        fps={30}
        compositionWidth={fullFramePlan.width}
        compositionHeight={fullFramePlan.height}
        initialFrame={0}
        acknowledgeRemotionLicense
        style={{ width: 480, height: 270 }}
      />,
    )
    expect(
      fullFrameContainer.querySelector('video'),
      'a full-frame design must not composite the source video',
    ).toBeNull()
  })
})

/* ──────────────────────────────────────────────────────────────────────────
 * 5. Rejecting a design that must not be exported
 * ────────────────────────────────────────────────────────────────────────── */

describe('5. export guard: preview-only and unknown designs are rejected', () => {
  it('rejects a design with exportCapable:false', async () => {
    registerRemotionDesign({
      ...toExportSpec(REMOTION_DESIGN_REGISTRY[0]),
      id: 'preview-only-design',
      name: 'Preview Only Design',
      exportCapable: false,
    })

    const result = await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { id: 'preview-only-design' },
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('unsupported-design')
    expect(result.error).toMatch(/preview-only|cannot be exported/i)
    expect(result.error).toContain('Preview Only Design')
    // The renderer is never even loaded for a rejected design.
    expect(renderMediaOnWeb).not.toHaveBeenCalled()
  })

  it('rejects a handed-over design with exportCapable:false', async () => {
    const design = getRemotionDesign('particle-explosion') as RemotionDesign
    const result = await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { ...toExportSpec(design), exportCapable: false },
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('unsupported-design')
    expect(result.error).toMatch(/cannot be exported/i)
    expect(renderMediaOnWeb).not.toHaveBeenCalled()
  })

  it('rejects an unknown design id', async () => {
    const result = await exportPersonalizedVideo({
      inputProps: makeInputProps(),
      design: { id: 'no-such-design' },
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('unsupported-design')
    expect(result.error).toContain('no-such-design')
    expect(result.error).toMatch(/not registered/i)
    expect(renderMediaOnWeb).not.toHaveBeenCalled()
  })
})

/* ──────────────────────────────────────────────────────────────────────────
 * 6. The no-op SequenceManager shim
 * ────────────────────────────────────────────────────────────────────────── */

describe('6. the no-op SequenceManager shim', () => {
  it('renders the <Sequence>-based social reel in the browser path', () => {
    const reel = getRemotionDesign('social-reel') as RemotionDesign

    // Frame 0 → scene 1 (catch copy). Frame 100 → scene 3 (info panel).
    const first = renderDesignInPlayer(reel, { frame: 0 })
    const firstText = normalize(first.container.textContent ?? '')
    expect(firstText).toContain('Make it')
    expect(firstText).not.toContain('New drop / Studio Aria')

    const third = renderDesignInPlayer(reel, { frame: 100 })
    const thirdText = normalize(third.container.textContent ?? '')
    expect(thirdText).toContain('New drop / Studio Aria')
    expect(thirdText).not.toContain('Make it unmissable')
  })

  it('is REQUIRED: a media component without the shim throws', () => {
    // Remotion's media components register themselves with the
    // SequenceManager while NODE_ENV === 'test'. The default context throws.
    // This is the exact failure the shim in PersonalizationComposition.tsx
    // (and the identical shim in webExport.ts) prevents.
    //
    // The error boundary has to sit INSIDE the player, between the player and
    // the media component, because that is where the composition (and with it
    // the shim) lives in the real export path.
    const captured: Error[] = []
    const BareVideo: React.FC = () => (
      <ErrorBoundary onError={(error) => captured.push(error)}>
        <Video src="/media/demo.mp4" />
      </ErrorBoundary>
    )

    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const originalConsoleError = console.error
    console.error = () => {}
    try {
      act(() => {
        root.render(
          <Player
            component={BareVideo as never}
            inputProps={{}}
            durationInFrames={30}
            fps={30}
            compositionWidth={1920}
            compositionHeight={1080}
            initialFrame={0}
            acknowledgeRemotionLicense
            style={{ width: 480, height: 270 }}
          />,
        )
      })
    } catch (error) {
      captured.push(error as Error)
    } finally {
      console.error = originalConsoleError
      try {
        act(() => root.unmount())
      } catch {
        // Unmounting a tree that already threw is expected here.
      }
      container.remove()
    }

    expect(
      captured.map((error) => String(error?.message ?? '')).join(' | '),
      'the media component did not fail without the shim',
    ).toMatch(/SequenceManagerContext not initialized/i)
  })

  it('is EFFECTIVE: the export composition renders the same media component', () => {
    // The plan's component installs the no-op SequenceManager, so the very
    // media component that just threw now renders.
    const design = getRemotionDesign('lower-third-glass-card') as RemotionDesign
    const plan = buildRemotionDesignExportPlan({
      design: toExportSpec(design),
      source: {
        sourceVideoUrl: '/media/demo.mp4',
        sourcePosterUrl: null,
        sourceAudioUrl: '/media/music.mp3',
      },
      preferredAspectRatio: '16:9',
      preferredWidth: 1920,
      preferredHeight: 1080,
    })

    const container = mountNode(
      <Player
        component={plan.component as never}
        inputProps={plan.props}
        durationInFrames={plan.durationInFrames}
        fps={30}
        compositionWidth={plan.width}
        compositionHeight={plan.height}
        initialFrame={0}
        acknowledgeRemotionLicense
        style={{ width: 480, height: 270 }}
      />,
    )

    expect(container.querySelector('video')).not.toBeNull()
    expect(container.querySelector('audio')).not.toBeNull()
    expect(designRoot(container, design.id)).not.toBeNull()
  })

  it('the shim is a no-op that still satisfies the media components', () => {
    // The same shim the compositions use, exercised directly.
    const NOOP_SEQUENCE_MANAGER = {
      registerSequence: () => {},
      unregisterSequence: () => {},
      sequences: [],
    }

    const container = mountNode(
      <Internals.SequenceManager.Provider value={NOOP_SEQUENCE_MANAGER}>
        <Player
          component={Video as never}
          inputProps={{ src: '/media/demo.mp4' }}
          durationInFrames={30}
          fps={30}
          compositionWidth={1920}
          compositionHeight={1080}
          initialFrame={0}
          acknowledgeRemotionLicense
          style={{ width: 480, height: 270 }}
        />
      </Internals.SequenceManager.Provider>,
    )

    expect(container.querySelector('video')).not.toBeNull()
  })

  it('measures which components actually register with the SequenceManager', () => {
    // Ground truth for the shim, measured in the real Remotion runtime: a
    // recording SequenceManager is installed and every registration is
    // counted.
    const measure = (component: React.FC): number => {
      const calls: unknown[] = []
      const manager = {
        registerSequence: (sequence: unknown) => {
          calls.push(sequence)
        },
        unregisterSequence: () => {},
        sequences: [],
      }
      const container = document.createElement('div')
      document.body.appendChild(container)
      const root = createRoot(container)
      act(() => {
        root.render(
          <Internals.SequenceManager.Provider value={manager}>
            <Player
              component={component as never}
              inputProps={{}}
              durationInFrames={30}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              initialFrame={0}
              acknowledgeRemotionLicense
              style={{ width: 480, height: 270 }}
            />
          </Internals.SequenceManager.Provider>,
        )
      })
      act(() => root.unmount())
      container.remove()
      return calls.length
    }

    const reel = getRemotionDesign('social-reel') as RemotionDesign

    // `<Sequence>` (the social reel) does NOT register outside the Studio:
    // remotion's Sequence only registers when `isStudio` is true.
    expect(
      measure(() =>
        React.createElement(
          SocialReel as unknown as React.FC<Record<string, unknown>>,
          reel.defaultProps,
        ),
      ),
    ).toBe(0)

    // The media components DO register, which is why the no-op shim is
    // load-bearing for the export path.
    expect(measure(() => <Video src="/media/demo.mp4" />)).toBeGreaterThan(0)
  })
})

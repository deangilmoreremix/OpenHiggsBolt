/**
 * Browser export engine for the SmartVideo GO branded (overlay-only) render.
 *
 * The final branded video is produced IN THE BROWSER by
 * `@remotion/web-renderer` — never on a server. That means:
 *
 *   - no render worker, no API route, no headless browser, no storage upload
 *   - the finished file is handed straight to the user as a download
 *   - nothing here ever calls MuAPI, OpenAI or any other network service
 *
 * Capability detection runs BEFORE any frame is rendered, so an unsupported
 * browser/codec produces an explicit, actionable error instead of a hung
 * progress bar.
 *
 * The renderer itself is imported dynamically so the Next.js build keeps it out
 * of the main bundle: the provider `await import()`s this module inside the
 * branded-render branch only. The type-only imports below are erased at
 * runtime and never pull the package into a bundle.
 *
 * ── Registered custom designs ────────────────────────────────────────────
 *
 * Besides today's personalisation composition, the engine can render a
 * REGISTERED design (a Remotion component from the design registry) instead.
 * The registry is owned elsewhere; this module only defines the contract it
 * has to satisfy and resolves a design by id through a small, replaceable
 * seam. Nothing here imports the registry, so the two sides stay decoupled.
 *
 * Wiring the registry up is one line wherever the app boots:
 *
 *     import { registerRemotionDesigns } from './personalization/webExport'
 *     import { REMOTION_DESIGN_REGISTRY } from './personalization/remotion/registry'
 *     registerRemotionDesigns(REMOTION_DESIGN_REGISTRY)
 *
 * A caller that already holds a design record can also skip the registry and
 * hand the record straight to the export (`design: { ...record, props }`).
 */

import type {
  CanRenderMediaOnWebOptions,
  CanRenderMediaOnWebResult,
  WebRendererAudioCodec,
  WebRendererContainer,
  WebRendererVideoCodec,
} from '@remotion/web-renderer'
import { Audio, Video } from '@remotion/media'
import React from 'react'
import { AbsoluteFill, Img, Internals } from 'remotion'
import type { PreviewInputProps } from './preview/types'
import { PersonalizationComposition } from './preview/PersonalizationComposition'
import {
  PERSONALIZATION_COMPOSITION_ID,
  WEB_RENDER_EXTENSION,
  WEB_RENDER_MIME_TYPE,
  chooseWebExportProfile,
  webRenderUnsupportedMessage,
  type WebExportAudioSupport,
  type WebExportPlan,
  type WebRenderCodecSupport,
} from './finalOutput'

/** Video codecs the export engine can ask the renderer for. */
export type WebExportVideoCodec = 'h264' | 'vp9' | 'vp8'

/** Audio codecs the export engine can ask the renderer for. */
export type WebExportAudioCodec = 'aac' | 'opus' | 'vorbis'

/** Failure classes the caller must be able to act on differently. */
export type WebExportFailureReason =
  | 'unsupported-browser'
  | 'unsupported-codec'
  | 'unsupported-design'
  | 'render-failed'
  | 'cancelled'

export interface WebExportOptions {
  /** The approved preview props — exactly what the preview rendered. */
  inputProps: PreviewInputProps
  /** Force a video codec. Rejected when the browser cannot encode it. */
  videoCodec?: WebExportVideoCodec | null
  /** Force an audio codec. Falls back when the container cannot carry it. */
  audioCodec?: WebExportAudioCodec | null
  /** Real render progress, 0..1. */
  onProgress?: (progress: number) => void
  /** Aborting cancels the render and releases the renderer. */
  signal?: AbortSignal
  /**
   * Render a REGISTERED design instead of the personalisation composition.
   * Omit it and the export behaves exactly as it always did.
   */
  design?: RemotionDesignSelection
  /**
   * How a design id is resolved. Defaults to the module-level registry
   * (`registerRemotionDesign` / `registerRemotionDesigns`).
   */
  designResolver?: RemotionDesignResolver
  /**
   * Dynamic composition metadata (duration / aspect). Forwarded to the
   * renderer so a composition that computes its own size is honoured.
   */
  calculateMetadata?: WebExportCalculateMetadata
}

export interface WebExportSuccess {
  ok: true
  blob: Blob
  mimeType: string
  extension: string
  /** Non-fatal notes, e.g. audio dropped because no audio codec is encodable. */
  warning: string | null
}

export interface WebExportFailure {
  ok: false
  error: string
  reason: WebExportFailureReason
}

export type WebExportResult = WebExportSuccess | WebExportFailure

/** Progress payload shape emitted by the renderer. */
interface RendererProgress {
  progress: number
}

/** Blob-producing result of a successful render. */
interface RendererResult {
  getBlob: () => Promise<Blob>
}

/* ────────────────────────────────────────────────────────────────────────────
 * Registered design contract
 *
 * The design registry lives elsewhere. This is the contract a registered
 * design has to satisfy for the browser export engine to render it. It is
 * deliberately structural (not a nominal type), so a registry can hand its
 * own records over unchanged.
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * How a registered design is composited into the exported video:
 *
 *   - `overlay`    the design is drawn ON TOP of the customer's source video
 *                  (the video stays the background layer and the design is
 *                  transparent wherever it does not paint);
 *   - `full-frame` the design IS the frame — the source video is not rendered
 *                  underneath it. A design that wants to show the customer's
 *                  footage inside the frame takes it as one of its own props
 *                  (supplied by the caller).
 */
export type RemotionDesignPlacement = 'full-frame' | 'overlay'

/** The subset of a registered design the browser export engine consumes. */
export interface RemotionDesignExportSpec {
  /** Unique design id. Also used as the exported composition id. */
  id: string
  /** Human readable name, used in error messages. */
  name?: string
  /** The Remotion component that draws the design. */
  component: React.ComponentType<Record<string, unknown>>
  /** The props the design falls back to when the caller overrides nothing. */
  defaultProps: Record<string, unknown>
  /** Duration of the exported design, in frames. */
  durationInFrames: number
  /** Whether the design is composited over the video or fills the frame. */
  placement: RemotionDesignPlacement
  /** The aspect ratios the design supports, e.g. `['16:9', '9:16']`. */
  aspectRatios: string[]
  /** False for preview-only designs that must never be exported. */
  exportCapable: boolean
  /** Optional dynamic metadata (duration / aspect) for the design. */
  calculateMetadata?: WebExportCalculateMetadata
}

/**
 * How a caller selects the design to export.
 *
 * Either by id — the design is looked up through the registry — or by handing
 * the design record over directly, which is handy when the caller already
 * holds one (e.g. straight from the design registry) and does not want to
 * register it first.
 */
export type RemotionDesignSelection =
  | {
      /** The id of the registered design to render. */
      id: string
      /** Prop overrides. They win over the design's own `defaultProps`. */
      props?: Record<string, unknown>
    }
  | (RemotionDesignExportSpec & {
      /** Prop overrides. They win over the design's own `defaultProps`. */
      props?: Record<string, unknown>
    })

/** Resolves a design id to its registered spec (null/undefined when unknown). */
export type RemotionDesignResolver = (
  id: string,
) => RemotionDesignExportSpec | null | undefined

/** The media the engine hands to a registered design. */
export interface RemotionDesignSourceMedia {
  /** The customer's source video, or null for image sources. */
  sourceVideoUrl: string | null
  /** The poster image for the source (image sources, or the video poster). */
  sourcePosterUrl: string | null
  /** The customer's selected audio track, or null. */
  sourceAudioUrl: string | null
}

/* ────────────────────────────────────────────────────────────────────────────
 * Dynamic composition metadata
 *
 * Mirrors remotion's `CalculateMetadataFunction`, but the props are
 * shape-agnostic: the same callback has to work for the personalisation
 * composition (typed props) and for a registered design (free-form props).
 * ────────────────────────────────────────────────────────────────────────── */

export interface WebExportMetadataOptions<Props = unknown> {
  defaultProps: Props
  props: Props
  abortSignal: AbortSignal
  compositionId: string
  isRendering: boolean
}

export interface WebExportCompositionMetadata<Props = unknown> {
  durationInFrames?: number
  fps?: number
  width?: number
  height?: number
  props?: Props
}

export type WebExportCalculateMetadata<Props = unknown> = (
  options: WebExportMetadataOptions<Props>,
) =>
  | WebExportCompositionMetadata<Props>
  | Promise<WebExportCompositionMetadata<Props>>

/* ────────────────────────────────────────────────────────────────────────────
 * Design registry seam
 *
 * The registry itself is owned by another module; the export engine only
 * needs a way to look a design up by id. `registerRemotionDesign(s)` wires
 * the registry in, and `designResolver` lets a caller override the lookup for
 * a single call.
 * ────────────────────────────────────────────────────────────────────────── */

const registeredDesigns = new Map<string, RemotionDesignExportSpec>()

/** Registers (or replaces) a design so it can be exported by id. */
export function registerRemotionDesign(design: RemotionDesignExportSpec): void {
  registeredDesigns.set(design.id, design)
}

/** Registers a whole list of designs at once. */
export function registerRemotionDesigns(
  designs: readonly RemotionDesignExportSpec[],
): void {
  for (const design of designs) registerRemotionDesign(design)
}

/** The registered design with this id, or null when there is none. */
export function getRegisteredRemotionDesign(
  id: string,
): RemotionDesignExportSpec | null {
  return registeredDesigns.get(id) ?? null
}

/** Empties the registry (used by tests and by app teardown). */
export function clearRegisteredRemotionDesigns(): void {
  registeredDesigns.clear()
}

const defaultDesignResolver: RemotionDesignResolver = (id) =>
  registeredDesigns.get(id) ?? null

/** Outcome of resolving a design selection. */
type DesignResolution =
  | {
      ok: true
      design: RemotionDesignExportSpec
    }
  | {
      ok: false
      error: string
    }

/** True when the caller handed the design record over instead of its id. */
function isDesignRecord(
  selection: RemotionDesignSelection,
): selection is RemotionDesignExportSpec & {
  props?: Record<string, unknown>
} {
  return typeof (selection as { component?: unknown }).component === 'function'
}

/**
 * Resolves the selected design and refuses to export one that must not be
 * exported. A design that is not `exportCapable` is preview-only: exporting
 * it anyway would silently produce something other than what the customer
 * approved, so it is rejected with a message that says so.
 */
function resolveDesignSelection(
  selection: RemotionDesignSelection,
  resolver: RemotionDesignResolver,
): DesignResolution {
  let design: RemotionDesignExportSpec | null | undefined = null
  if (isDesignRecord(selection)) {
    design = selection
  } else {
    try {
      design = resolver(selection.id)
    } catch (error) {
      return {
        ok: false,
        error: `The design "${selection.id}" could not be looked up: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }
    }
  }
  if (!design) {
    return {
      ok: false,
      error: `The design "${selection.id}" is not registered, so it cannot be exported.`,
    }
  }
  if (design.exportCapable !== true) {
    return {
      ok: false,
      error: `The design "${design.name ?? design.id}" is preview-only and cannot be exported to a video.`,
    }
  }
  return { ok: true, design }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Design export plan (pure)
 * ────────────────────────────────────────────────────────────────────────── */

/** Everything the renderer needs to render a registered design. */
export interface RemotionDesignExportPlan {
  /** The composition id the design is exported under. */
  compositionId: string
  /** The component the renderer mounts. */
  component: React.ComponentType<Record<string, unknown>>
  /** Export width in px (always even). */
  width: number
  /** Export height in px (always even). */
  height: number
  /** Duration of the design, in frames. */
  durationInFrames: number
  /** The merged props: the design's defaults plus the caller's overrides. */
  props: Record<string, unknown>
  /** How the design is composited. */
  placement: RemotionDesignPlacement
  /** True when the source video is rendered underneath the design. */
  compositesSourceVideo: boolean
}

/**
 * The design's props, merged: the design's own `defaultProps` first, then
 * the caller's overrides, which always win.
 *
 * The result is exactly what the design component receives — the engine does
 * not smuggle anything of its own into the design's prop bag.
 */
export function mergeRemotionDesignProps(
  design: RemotionDesignExportSpec,
  overrides: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return {
    ...(design.defaultProps ?? {}),
    ...(overrides ?? {}),
  }
}

/** Aspect ratio used when a design declares none and the preview has none. */
const DEFAULT_DESIGN_ASPECT_RATIO = '16:9'

/**
 * The aspect ratio the design is exported at: the preview's own ratio when
 * the design supports it, otherwise the first ratio the design declares.
 */
export function remotionDesignAspectRatio(
  design: RemotionDesignExportSpec,
  preferred: string | null | undefined,
): string {
  const supported = (design.aspectRatios ?? []).filter(
    (ratio) => typeof ratio === 'string' && ratio.trim().length > 0,
  )
  if (preferred && supported.includes(preferred)) return preferred
  if (supported.length > 0) return supported[0]
  return preferred ?? DEFAULT_DESIGN_ASPECT_RATIO
}

/**
 * Canonical pixel size for an aspect ratio, with the SHORT side at 1080 —
 * which reproduces every preview preset exactly (16:9 → 1920x1080,
 * 9:16 → 1080x1920, 1:1 → 1080x1080, 4:5 → 1080x1350).
 */
export function canonicalDimensionsForAspectRatio(ratio: string): {
  width: number
  height: number
} {
  const match = /^\s*(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)\s*$/.exec(ratio)
  if (!match) return { width: 1920, height: 1080 }
  const width = Number(match[1])
  const height = Number(match[2])
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return { width: 1920, height: 1080 }
  }
  const scale = 1080 / Math.min(width, height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

/**
 * The export dimensions for a design.
 *
 * The design's aspect ratio decides the shape of the output. When the design
 * keeps the preview's own ratio, the preview's pixel size is kept as well
 * (so an approved 4K preview stays 4K); otherwise the canonical size for the
 * design's ratio is used.
 */
export function remotionDesignDimensions(input: {
  aspectRatio: string
  preferredAspectRatio?: string | null
  preferredWidth?: number | null
  preferredHeight?: number | null
}): {
  width: number
  height: number
} {
  const preferredWidth = input.preferredWidth ?? 0
  const preferredHeight = input.preferredHeight ?? 0
  if (
    input.preferredAspectRatio &&
    input.aspectRatio === input.preferredAspectRatio &&
    preferredWidth > 0 &&
    preferredHeight > 0
  ) {
    return {
      width: evenDimension(preferredWidth),
      height: evenDimension(preferredHeight),
    }
  }
  const canonical = canonicalDimensionsForAspectRatio(input.aspectRatio)
  return {
    width: evenDimension(canonical.width),
    height: evenDimension(canonical.height),
  }
}

/**
 * Builds the export plan for a registered design: which component to mount,
 * at what size, for how long, and with which props.
 */
export function buildRemotionDesignExportPlan(input: {
  design: RemotionDesignExportSpec
  overrides?: Record<string, unknown>
  source: RemotionDesignSourceMedia
  preferredAspectRatio?: string | null
  preferredWidth?: number | null
  preferredHeight?: number | null
}): RemotionDesignExportPlan {
  const { design } = input
  const props = mergeRemotionDesignProps(design, input.overrides)
  const aspectRatio = remotionDesignAspectRatio(
    design,
    input.preferredAspectRatio,
  )
  const { width, height } = remotionDesignDimensions({
    aspectRatio,
    preferredAspectRatio: input.preferredAspectRatio,
    preferredWidth: input.preferredWidth,
    preferredHeight: input.preferredHeight,
  })

  return {
    compositionId: design.id,
    component: createDesignExportComponent(design, props, input.source),
    width,
    height,
    durationInFrames: Math.max(1, Math.round(design.durationInFrames ?? 1)),
    props,
    placement: design.placement,
    compositesSourceVideo: design.placement === 'overlay',
  }
}

/**
 * The web renderer does not provide remotion's internal SequenceManager
 * context, and remotion's media components still try to register themselves
 * with it — which throws against the default context. The personalisation
 * composition solves this with a stable local no-op; a registered design
 * needs the exact same shim, otherwise a design that uses `<Sequence>` (or
 * any media component) cannot render.
 */
const NOOP_SEQUENCE_MANAGER = {
  registerSequence: () => {},
  unregisterSequence: () => {},
  sequences: [],
}

/**
 * Wraps a design component into the composition the renderer mounts.
 *
 * The wrapper decides what sits UNDERNEATH the design:
 *
 *   - `overlay`    the customer's source video (or its poster for image
 *                  sources) is rendered as the background layer;
 *   - `full-frame` nothing — the design owns the whole frame.
 *
 * The customer's audio track is kept in both cases: it is their chosen music,
 * independent of the design.
 *
 * The source media is closed over rather than passed as a prop, so the
 * design's prop bag stays exactly `defaultProps + overrides`.
 */
function createDesignExportComponent(
  design: RemotionDesignExportSpec,
  mergedProps: Record<string, unknown>,
  source: RemotionDesignSourceMedia,
): React.ComponentType<Record<string, unknown>> {
  const DesignComponent = design.component
  const placement = design.placement

  function RemotionDesignExportComposition(): React.ReactElement {
    const layers: React.ReactNode[] = []

    if (placement === 'overlay') {
      if (source.sourceVideoUrl) {
        layers.push(
          React.createElement(Video, {
            key: 'source-video',
            src: source.sourceVideoUrl,
            muted: false,
            style: { width: '100%', height: '100%', objectFit: 'cover' },
          }),
        )
      } else if (source.sourcePosterUrl) {
        layers.push(
          React.createElement(Img, {
            key: 'source-poster',
            src: source.sourcePosterUrl,
            style: { width: '100%', height: '100%', objectFit: 'cover' },
          }),
        )
      }
    }

    if (source.sourceAudioUrl) {
      layers.push(
        React.createElement(Audio, {
          key: 'source-audio',
          src: source.sourceAudioUrl,
        }),
      )
    }

    layers.push(
      React.createElement(DesignComponent, { key: 'design', ...mergedProps }),
    )

    return React.createElement(
      Internals.SequenceManager.Provider,
      { value: NOOP_SEQUENCE_MANAGER },
      React.createElement(
        AbsoluteFill,
        { style: { background: 'transparent' } },
        ...layers,
      ),
    )
  }

  return RemotionDesignExportComposition
}

/**
 * The exact slice of the installed `@remotion/web-renderer` API this engine
 * uses. Declared locally (instead of importing the package's own generic option
 * types) because those generics are shaped for schema-driven compositions and
 * reject a typed prop object without an index signature.
 */
type LoadedWebRenderer = {
  canRenderMediaOnWeb: (
    options: CanRenderMediaOnWebOptions,
  ) => Promise<CanRenderMediaOnWebResult>
  getEncodableVideoCodecs: (
    container: WebRendererContainer,
  ) => Promise<WebRendererVideoCodec[]>
  getEncodableAudioCodecs: (
    container: WebRendererContainer,
  ) => Promise<WebRendererAudioCodec[]>
  renderMediaOnWeb: (options: {
    composition: ExportComposition
    inputProps: PreviewInputProps | Record<string, unknown>
    container: WebRendererContainer
    videoCodec: WebRendererVideoCodec
    audioCodec: WebRendererAudioCodec | null
    muted: boolean
    signal: AbortSignal
    onProgress: (progress: RendererProgress) => void
  }) => Promise<RendererResult>
}

/**
 * The composition the renderer is handed. Two shapes are possible: today's
 * personalisation composition and a registered design.
 */
type ExportComposition = {
  id: string
  component:
    | React.ComponentType<PreviewInputProps>
    | React.ComponentType<Record<string, unknown>>
  width: number
  height: number
  fps: number
  durationInFrames: number
  defaultProps: PreviewInputProps | Record<string, unknown>
  calculateMetadata?: WebExportCalculateMetadata
}

/**
 * Aborting must reach the renderer even when the caller passed no signal, so
 * the UI can always cancel through `cancelActiveExport()`.
 */
let activeController: AbortController | null = null

/** Cancel the in-flight export, if any. Returns true when one was running. */
export function cancelActiveExport(): boolean {
  if (!activeController) return false
  activeController.abort()
  return true
}

/** True while an export is running. */
export function isExportActive(): boolean {
  return activeController !== null
}

/** Clamp a renderer progress value into 0..1. */
export function clampProgress(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

/**
 * Map the renderer's capability issues to one of our failure reasons. Codec and
 * container problems are "unsupported-codec"; a missing WebCodecs/WebGL stack
 * is "unsupported-browser"; anything else is a plain render failure.
 */
export function webExportFailureReason(
  issues: readonly { type: string }[],
): WebExportFailureReason {
  const types = new Set(issues.map((issue) => issue.type))
  if (types.has('webcodecs-unavailable') || types.has('webgl-unsupported')) {
    return 'unsupported-browser'
  }
  if (
    types.has('video-codec-unsupported') ||
    types.has('audio-codec-unsupported') ||
    types.has('container-codec-mismatch')
  ) {
    return 'unsupported-codec'
  }
  return 'render-failed'
}

/** h264 needs even dimensions; rounding also guards odd custom compositions. */
function evenDimension(value: number): number {
  const rounded = Math.max(2, Math.round(value))
  return rounded % 2 === 0 ? rounded : rounded + 1
}

/** Loads the renderer only when an export is actually requested. */
async function loadWebRenderer(): Promise<LoadedWebRenderer> {
  return (await import('@remotion/web-renderer')) as unknown as LoadedWebRenderer
}

/**
 * Which video/audio codecs this browser can actually encode, per container.
 * A failing probe is treated as "cannot encode", never as a guess.
 */
async function detectCodecSupport(renderer: LoadedWebRenderer): Promise<{
  video: WebRenderCodecSupport
  audio: WebExportAudioSupport
}> {
  const empty = [] as string[]
  const [mp4Video, webmVideo, mp4Audio, webmAudio] = await Promise.all([
    renderer.getEncodableVideoCodecs('mp4').catch(() => empty),
    renderer.getEncodableVideoCodecs('webm').catch(() => empty),
    renderer.getEncodableAudioCodecs('mp4').catch(() => empty),
    renderer.getEncodableAudioCodecs('webm').catch(() => empty),
  ])
  return {
    video: {
      h264: mp4Video.includes('h264'),
      vp9: webmVideo.includes('vp9'),
      vp8: webmVideo.includes('vp8'),
    },
    audio: { mp4: mp4Audio, webm: webmAudio },
  }
}

/**
 * Export the approved personalization as a real video file, entirely in the
 * browser. Never throws: every failure comes back as a classified result.
 */
export async function exportPersonalizedVideo(
  options: WebExportOptions,
): Promise<WebExportResult> {
  const { inputProps, onProgress, signal } = options

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      ok: false,
      reason: 'unsupported-browser',
      error: 'The branded video is rendered in your browser, which is not available right now.',
    }
  }
  if (signal?.aborted) {
    return { ok: false, reason: 'cancelled', error: 'Render cancelled before it started.' }
  }

  const settings = inputProps.settings
  const width = evenDimension(settings?.width ?? 0)
  const height = evenDimension(settings?.height ?? 0)
  const fps = settings?.fps && settings.fps > 0 ? settings.fps : 30
  const durationInFrames = Math.max(1, Math.round(settings?.durationInFrames ?? 1))

  // ── Registered design, resolved BEFORE the renderer is loaded ────────────
  // A design that cannot be exported (unknown id, or explicitly preview-only)
  // must fail with a clear message instead of silently rendering something
  // else — and it must not even pull the renderer in.
  let designPlan: RemotionDesignExportPlan | null = null
  let design: RemotionDesignExportSpec | null = null
  if (options.design) {
    const resolved = resolveDesignSelection(
      options.design,
      options.designResolver ?? defaultDesignResolver,
    )
    if (!resolved.ok) {
      return { ok: false, reason: 'unsupported-design', error: resolved.error }
    }
    design = resolved.design
    designPlan = buildRemotionDesignExportPlan({
      design,
      overrides: options.design.props,
      source: {
        sourceVideoUrl: inputProps.videoUrl ?? null,
        sourcePosterUrl: inputProps.posterUrl ?? null,
        sourceAudioUrl: inputProps.audioUrl ?? null,
      },
      preferredAspectRatio: settings?.aspectRatio ?? null,
      preferredWidth: settings?.width ?? null,
      preferredHeight: settings?.height ?? null,
    })
  }

  let renderer: LoadedWebRenderer
  try {
    renderer = await loadWebRenderer()
  } catch (error) {
    return {
      ok: false,
      reason: 'unsupported-browser',
      error: `Could not load the in-browser video renderer: ${
        error instanceof Error ? error.message : String(error)
      }`,
    }
  }

  // ── Capability detection, BEFORE anything is rendered ────────────────────
  let codecSupport: Awaited<ReturnType<typeof detectCodecSupport>>
  try {
    codecSupport = await detectCodecSupport(renderer)
  } catch (error) {
    return {
      ok: false,
      reason: 'unsupported-browser',
      error: `This browser could not report its video encoding support: ${
        error instanceof Error ? error.message : String(error)
      }`,
    }
  }

  const plan = chooseWebExportProfile({
    video: codecSupport.video,
    audio: codecSupport.audio,
    requestedVideoCodec: options.videoCodec ?? null,
    requestedAudioCodec: options.audioCodec ?? null,
  })
  if (plan.error) {
    return { ok: false, reason: plan.errorReason, error: plan.error }
  }

  let capability: CanRenderMediaOnWebResult
  try {
    capability = await renderer.canRenderMediaOnWeb({
      container: plan.profile.container,
      videoCodec: plan.profile.videoCodec,
      audioCodec: plan.audioCodec,
      width,
      height,
      muted: plan.muted,
    })
  } catch (error) {
    return {
      ok: false,
      reason: 'unsupported-browser',
      error: `This browser could not be checked for video encoding support: ${
        error instanceof Error ? error.message : String(error)
      }`,
    }
  }

  if (!capability.canRender) {
    const reason = webExportFailureReason(capability.issues)
    const details = capability.issues
      .filter((issue) => issue.severity === 'error')
      .map((issue) => issue.message)
      .join(' ')
    const fallback =
      reason === 'unsupported-browser'
        ? webRenderUnsupportedMessage(plan.profile)
        : 'The in-browser render could not be started.'
    return { ok: false, reason, error: details || fallback }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const controller = new AbortController()
  activeController = controller
  const forwardAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) {
      activeController = null
      return { ok: false, reason: 'cancelled', error: 'Render cancelled.' }
    }
    signal.addEventListener('abort', forwardAbort, { once: true })
  }

  try {
    // Without a design this is byte-for-byte the composition the engine has
    // always handed to the renderer; with a design the design's own duration,
    // aspect ratio and merged props take over.
    const composition: ExportComposition = designPlan
      ? {
          id: designPlan.compositionId,
          component: designPlan.component,
          width: designPlan.width,
          height: designPlan.height,
          fps,
          durationInFrames: designPlan.durationInFrames,
          defaultProps: designPlan.props,
        }
      : {
          id: PERSONALIZATION_COMPOSITION_ID,
          component: PersonalizationComposition,
          width,
          height,
          fps,
          durationInFrames,
          defaultProps: inputProps,
        }

    // Dynamic metadata is forwarded so a composition that computes its own
    // duration/aspect is honoured. Without one, the renderer keeps using the
    // explicit dimensions above.
    const calculateMetadata =
      options.calculateMetadata ?? design?.calculateMetadata ?? undefined
    if (calculateMetadata) {
      composition.calculateMetadata = calculateMetadata
    }

    const result = await renderer.renderMediaOnWeb({
      composition,
      inputProps: designPlan ? designPlan.props : inputProps,
      container: plan.profile.container,
      videoCodec: plan.profile.videoCodec,
      audioCodec: plan.audioCodec,
      muted: plan.muted,
      signal: controller.signal,
      onProgress: (progress) => {
        onProgress?.(clampProgress(progress.progress))
      },
    })
    const blob = await result.getBlob()
    return {
      ok: true,
      blob,
      mimeType: WEB_RENDER_MIME_TYPE[plan.profile.container],
      extension: WEB_RENDER_EXTENSION[plan.profile.container],
      warning: plan.warning,
    }
  } catch (error) {
    if (controller.signal.aborted) {
      return { ok: false, reason: 'cancelled', error: 'Render cancelled.' }
    }
    return {
      ok: false,
      reason: 'render-failed',
      error: error instanceof Error ? error.message : 'The in-browser render failed.',
    }
  } finally {
    if (signal) signal.removeEventListener('abort', forwardAbort)
    if (activeController === controller) activeController = null
  }
}

/** Hand the finished file to the user as a direct download. */
export function downloadWebExportBlob(blob: Blob, fileName: string): void {
  if (typeof document === 'undefined') return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // The download owns the blob once the click has been dispatched; the URL is
  // only kept around long enough for slow browsers to pick it up.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export type { WebExportPlan }

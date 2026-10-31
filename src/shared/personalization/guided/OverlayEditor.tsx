'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { PlayerRef } from '@remotion/player'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Move,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Type,
  X,
} from 'lucide-react'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'
import { PersonalizationPlayer } from '../preview/PersonalizationPlayer'
import {
  PREVIEW_ANIMATIONS,
  PREVIEW_FONTS,
  PREVIEW_POSITIONS,
  fontStackById,
  designSlotOf,
  isImageLayerKind,
  isSceneLayer,
  sceneLengths,
} from '../preview/presets'
import { getRemotionDesignTemplate } from '../templates'
import type {
  RemotionDesignTextSlot,
} from '../templates/types'
import type {
  PersonalizationPreviewSettings,
  PreviewInputProps,
  PreviewLayer,
  PreviewLayerKind,
} from '../preview/types'
import {
  MAX_LAYER_SCALE,
  MIN_LAYER_SCALE,
  SAFE_AREA_MARGIN,
  clampLayerToBounds,
  layerBoxMetrics,
  renderedLayerGeometry,
  imageAssetDefaultLabel,
  imageAssetOptions,
  nudgeDeltaForKey,
  offsetLayer,
  resolveCompositionSize,
  scaleLayerTo,
  stageScaleFactor,
  toStageBox,
} from './overlayGeometry'
import { C, chipStyle, hintStyle, inputStyle, labelStyle, panelStyle, secondaryButtonStyle, softPanelStyle } from './tokens'
import {
  DESIGN_CATEGORY_LABELS,
  LAYER_LABELS,
  describeLayerChanges,
  endCardChangeNote,
  layerLabel,
  diffLayers,
  framesToSeconds,
  layerRevealFrame,
  lookChanged,
  secondsToFrames,
} from './layerChanges'

const TEXT_KINDS: PreviewLayerKind[] = [
  'businessName',
  'headline',
  'offer',
  'cta',
  'tagline',
  'design',
]

/** Corner-handle keyboard step: 2% of the frame per press, 10% with Shift. */
const RESIZE_KEYBOARD_STEP = 0.02
const RESIZE_KEYBOARD_STEP_LARGE = 0.1

/**
 * The text the composition actually draws for a text layer (its own text, or
 * the brand field when the customer has not typed any). Used for geometry so
 * the editor's boxes are sized exactly like the rendered ones.
 */
function renderedText(layer: PreviewLayer, brand: PreviewInputProps['brand']): string {
  if (layer.kind === 'businessName') return layer.text ?? brand.businessName
  if (layer.kind === 'headline' || layer.kind === 'tagline') return layer.text ?? brand.headline
  if (layer.kind === 'offer') return layer.text ?? brand.offer
  if (layer.kind === 'cta') return layer.text ?? brand.cta
  return layer.text ?? ''
}

function layerText(layer: PreviewLayer, brand: PreviewInputProps['brand']): string {
  if (typeof layer.text === 'string' && layer.text.trim()) return layer.text
  if (layer.kind === 'businessName') return brand.businessName
  if (layer.kind === 'headline') return brand.headline
  if (layer.kind === 'offer') return brand.offer
  if (layer.kind === 'cta') return brand.cta
  if (layer.kind === 'tagline') return brand.headline
  // A design's primary slot is fed by the headline unless the customer
  // typed something on the layer.
  if (layer.kind === 'design') return brand.headline
  return ''
}

/* ── Design text slots ─────────────────────────────────────────────────────── */

/**
 * The design-slot resolver lives in the `core` lane
 * (`../preview/designSlots.ts`), because BOTH the inspector and the render
 * path need it and the composition must not import from `guided/` (that would
 * create the require cycle
 * Composition -> OverlayEditor -> Provider -> Modal -> OverlayEditor).
 *
 * The helpers are re-exported here so every existing consumer of
 * `guided/OverlayEditor` keeps working.
 */
export {
  DESIGN_SLOT_OVERRIDES_FIELD,
  brandSlotValue,
  designSlotLabel,
  designSlotOverrides,
  isPrimaryDesignSlot,
  resolveDesignSlotValues,
} from '../preview/designSlots'

import {
  designSlotLabel,
  designSlotOverrides,
  isPrimaryDesignSlot,
  resolveDesignSlotValues,
} from '../preview/designSlots'

/** The patch the inspector writes when a secondary slot changes. */
function slotOverridesPatch(next: Record<string, string>): Partial<PreviewLayer> {
  // `textSlotOverrides` is a field of `PreviewLayer`; the cast keeps the
  // patch type-safe against the rest of the layer shape.
  return { textSlotOverrides: next }
}

/** The optional character limit an adapter may put on a slot. */
function slotMaxLength(slot: RemotionDesignTextSlot): number | undefined {
  const raw = (slot as RemotionDesignTextSlot & { maxLength?: unknown }).maxLength
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return undefined
  return Math.floor(raw)
}

/**
 * Image fallback chain — mirrors the composition's own resolution order so the
 * stage never shows an empty box the render would fill (and vice versa).
 */
function layerImageUrl(layer: PreviewLayer, brand: PreviewInputProps['brand']): string {
  if (layer.imageUrl) return layer.imageUrl
  if (layer.kind === 'logo') return brand.logoUrl || ''
  if (layer.kind === 'productImage') return brand.productUrl || brand.serviceUrl || ''
  if (layer.kind === 'serviceImage') return brand.serviceUrl || brand.productUrl || ''
  return ''
}

/** Measures the stage element so layer boxes can mirror composition geometry. */
function useStageWidth(ref: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setWidth(element.clientWidth || 0)
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return width
}

interface DragState {
  layerId: string
  pointerId: number | null
  startX: number
  startY: number
  /** Safe-area-clamped snapshot taken when the drag started (no jump). */
  origin: PreviewLayer
  mode: 'move' | 'resize'
}

export interface OverlayEditorProps {
  inputProps: PreviewInputProps
}

/** Saves the "Advanced" disclosure per browser; storage may be unavailable. */
const ADVANCED_STORAGE_KEY = 'pz-overlay-editor-advanced'

function readAdvancedPreference(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(ADVANCED_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeAdvancedPreference(open: boolean): void {
  try {
    window.localStorage.setItem(ADVANCED_STORAGE_KEY, open ? '1' : '0')
  } catch {
    /* storage blocked: the toggle still works for this visit */
  }
}

/** 3×3 placement grid shown in the simple inspector (centers, 0..1). */
const POSITION_GRID: { id: string; label: string; x: number; y: number }[] = [
  { id: 'top-left', label: 'Top left', x: 0.06, y: 0.06 },
  { id: 'top-center', label: 'Top center', x: 0.5, y: 0.06 },
  { id: 'top-right', label: 'Top right', x: 0.94, y: 0.06 },
  { id: 'middle-left', label: 'Middle left', x: 0.06, y: 0.5 },
  { id: 'center', label: 'Center', x: 0.5, y: 0.5 },
  { id: 'middle-right', label: 'Middle right', x: 0.94, y: 0.5 },
  { id: 'bottom-left', label: 'Bottom left', x: 0.06, y: 0.88 },
  { id: 'bottom-center', label: 'Bottom center', x: 0.5, y: 0.88 },
  { id: 'bottom-right', label: 'Bottom right', x: 0.94, y: 0.88 },
]

/** How long a freshly added layer's outline pulses after a Quick Adjustment. */
const PULSE_MS = 1400
/** Delay before the preview restarts after a Quick Adjustment. */
const REPLAY_AFTER_CHANGE_MS = 250
/** How long the "what changed" note stays up unless dismissed. */
const NOTICE_MS = 7000

type LayerStatus = 'shown' | 'hidden' | 'missing-image' | 'empty-text' | 'missing-design'

function layerStatus(layer: PreviewLayer, brand: PreviewInputProps['brand']): LayerStatus {
  if (layer.kind === 'endCard') return 'shown'
  if (!layer.visible) return 'hidden'
  if (isImageLayerKind(layer.kind) && !layerImageUrl(layer, brand)) return 'missing-image'
  if (layer.kind === 'design') {
    return layer.designId && getRemotionDesignTemplate(layer.designId) ? 'shown' : 'missing-design'
  }
  if (TEXT_KINDS.includes(layer.kind) && !renderedText(layer, brand).trim()) return 'empty-text'
  return 'shown'
}

function statusText(status: LayerStatus, kind: PreviewLayerKind): string {
  if (status === 'hidden') return 'Hidden'
  if (status === 'missing-image') return kind === 'logo' ? 'No logo yet: choose one' : 'No photo yet: choose one'
  if (status === 'empty-text') return 'No text yet: type some'
  if (status === 'missing-design') return 'Design unavailable'
  return ''
}

function kindIcon(kind: PreviewLayerKind) {
  if (kind === 'design') return <Sparkles size={13} />
  if (kind === 'endCard') return <Layers size={13} />
  if (isImageLayerKind(kind)) return <ImageIcon size={13} />
  return <Type size={13} />
}

/** Mirrors the composition's end-card timing. */
function endCardStartFrame(durationInFrames: number): number {
  const length = Math.min(90, Math.max(45, Math.round(durationInFrames * 0.2)))
  return Math.max(0, durationInFrames - length)
}

/**
 * Direct-on-video overlay editor.
 *
 * The stage IS the Remotion preview: it mounts `PersonalizationPlayer` with
 * the same `inputProps` the final render uses, so designs, animations, colors
 * and text look exactly as they will in the exported video. A transparent
 * handle layer on top draws only the selection outlines and resize handles,
 * at the same normalized coordinates the composition uses (`./overlayGeometry`).
 * Used both in Simple Mode step 4 and in the modal's Advanced Editing section.
 *
 * All layer state lives in the provider: this component never keeps a second
 * copy of it — it reads `previewSettings` from context and writes through
 * `updatePreviewLayer`. Only UI state (selection, playback, the "what changed"
 * note) is local, so switching between Simple Mode and Advanced Editing keeps
 * every edit.
 *
 * When a Quick Adjustment changes the layout or the applied design, the editor
 * explains what was added or removed, selects the new layer, pulses its
 * outline and replays the preview from the start.
 */
export function OverlayEditor({ inputProps }: OverlayEditorProps): React.JSX.Element {
  const ctx = useDemoPersonalize()
  const {
    previewSettings,
    updatePreviewLayer,
    updatePreviewComposition,
    resetPreviewLayout,
    assets,
  } = ctx
  const setGuidedStep = (ctx as { setGuidedStep?: (step: 1 | 2 | 3 | 4) => void }).setGuidedStep
  const settings: PersonalizationPreviewSettings = previewSettings
  const fieldPrefix = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const stageWidth = useStageWidth(stageRef)
  const playerRef = useRef<PlayerRef | null>(null)
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selectedId, setSelectedId] = useState<string>(() => settings.layers[0]?.id || '')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pulseId, setPulseId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [advanced, setAdvanced] = useState<boolean>(readAdvancedPreference)
  const dragRef = useRef<DragState | null>(null)
  const previousSettingsRef = useRef<PersonalizationPreviewSettings>(settings)

  const brand = inputProps.brand
  const { width: compW, height: compH } = resolveCompositionSize(settings.width, settings.height)
  // One factor for both axes: stagePx = compositionPx * (stageWidth / compW).
  const factor = stageScaleFactor(stageWidth, compW)
  const fps = settings.fps > 0 ? settings.fps : 30
  // The video's own length; the opening and closing scenes play around it.
  const durationInFrames = Math.max(1, Math.round(settings.durationInFrames))
  const { intro: introLen, outro: outroLen } = sceneLengths(settings)
  const totalLen = introLen + durationInFrames + outroLen

  const editableLayers = settings.layers.filter((layer) => layer.kind !== 'endCard')
  const selected = settings.layers.find((layer) => layer.id === selectedId) || settings.layers[0] || null
  const selectedDesign =
    selected?.kind === 'design' && selected.designId
      ? getRemotionDesignTemplate(selected.designId)
      : undefined
  // A design labels its primary text slot; the plain layers just say "Text".
  const selectedTextLabel =
    selectedDesign?.textSlots?.find((slot) => slot && slot.primary)?.label ?? 'Text'
  // Every slot the selected design declares, with the value each one shows.
  const selectedSlots: RemotionDesignTextSlot[] =
    selectedDesign && Array.isArray(selectedDesign.textSlots) ? selectedDesign.textSlots : []
  const selectedSlotValues: Record<string, string | undefined> =
    selectedDesign && selected ? resolveDesignSlotValues(selectedDesign, selected, brand) : {}

  // Rows in the order they appear on screen; the end card always comes last.
  const orderedLayers = [...settings.layers].sort((a, b) => {
    if (a.kind === 'endCard') return 1
    if (b.kind === 'endCard') return -1
    return a.startFrame + a.animationDelay - (b.startFrame + b.animationDelay)
  })

  // The opening or closing scene on screen at the current frame, if any.
  const sceneInSlot = (slot: 'intro' | 'outro') =>
    settings.layers.find((layer) => isSceneLayer(layer) && layer.visible && designSlotOf(layer) === slot) ?? null
  const activeScene =
    frame < introLen ? sceneInSlot('intro') : frame >= introLen + durationInFrames ? sceneInSlot('outro') : null

  const controlId = (name: string) => `${fieldPrefix}-${name}`
  const round = (value: number) => Number(value.toFixed(4))

  /** The layer as the composition sizes it (text layers carry their drawn text). */
  const geometryLayer = useCallback(
    (layer: PreviewLayer): PreviewLayer =>
      TEXT_KINDS.includes(layer.kind) && layer.kind !== 'design'
        ? { ...layer, text: renderedText(layer, brand) }
        : layer,
    [brand],
  )

  /**
   * Writes one slot's new value.
   *
   * The primary slot keeps writing `layer.text` (the field the inspector has
   * always written); every other slot writes its entry in the layer's
   * per-slot override map. Clearing a secondary field drops the override so
   * the slot falls back to its brand value again.
   */
  const onDesignSlotChange = (slot: RemotionDesignTextSlot, next: string) => {
    if (!selected) return
    if (isPrimaryDesignSlot(slot)) {
      updatePreviewLayer(selected.id, { text: next })
      return
    }
    const overrides = designSlotOverrides(selected)
    if (next.trim()) overrides[slot.key] = next
    else delete overrides[slot.key]
    updatePreviewLayer(selected.id, slotOverridesPatch(overrides))
  }

  const commitPosition = useCallback(
    (layerId: string, next: PreviewLayer) => {
      updatePreviewLayer(layerId, { x: round(next.x), y: round(next.y) })
    },
    [updatePreviewLayer],
  )

  const commitScale = useCallback(
    (layerId: string, next: PreviewLayer) => {
      // A resize can also pull a layer back inside the safe area.
      updatePreviewLayer(layerId, { x: round(next.x), y: round(next.y), scale: round(next.scale) })
    },
    [updatePreviewLayer],
  )

  // ── Playback helpers ──────────────────────────────────────────────────────

  /** Pauses and, if the layer is not on screen yet, jumps to where it is. */
  const revealLayer = useCallback(
    (layer: PreviewLayer) => {
      const player = playerRef.current
      if (!player || layer.kind === 'endCard') return
      try {
        if (player.isPlaying()) player.pause()
      } catch {
        /* a player without media cannot report its state yet */
      }
      if (isSceneLayer(layer)) {
        // Show the scene at its best moment.
        const start = designSlotOf(layer) === 'intro' ? 0 : introLen + durationInFrames
        const length = designSlotOf(layer) === 'intro' ? introLen : outroLen
        player.seekTo(Math.min(totalLen - 1, start + Math.floor(length * 0.7)))
        return
      }
      // Overlays live on the video's own clock, after the opening scene.
      const target = Math.min(introLen + durationInFrames - 1, introLen + layerRevealFrame(layer, fps))
      const beforeReveal = frame < target
      const afterEnd = frame > introLen + (layer.endFrame ?? durationInFrames - 1)
      if (beforeReveal || afterEnd) player.seekTo(target)
    },
    [durationInFrames, fps, frame, introLen, outroLen, totalLen],
  )

  const togglePlay = () => {
    const player = playerRef.current
    if (!player) return
    try {
      if (player.isPlaying()) player.pause()
      else player.play()
    } catch {
      /* autoplay policies can reject play() */
    }
  }

  const replay = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    player.seekTo(0)
    try {
      player.play()
    } catch {
      /* autoplay policies can reject play(); the seek still applied */
    }
  }, [])

  const seekTo = (target: number) => {
    playerRef.current?.seekTo(Math.max(0, Math.min(totalLen - 1, Math.round(target))))
  }

  const selectLayer = (layer: PreviewLayer) => {
    setSelectedId(layer.id)
    revealLayer(layer)
  }

  // ── Quick Adjustment feedback ─────────────────────────────────────────────

  useEffect(() => {
    const previous = previousSettingsRef.current
    previousSettingsRef.current = settings
    if (previous === settings || !lookChanged(previous, settings)) return
    const changes = diffLayers(previous.layers, settings.layers)
    const summary = [describeLayerChanges(changes), endCardChangeNote(previous, settings)].filter(Boolean).join(' · ')
    setNotice(summary || null)
    const focus =
      changes.added.find((layer) => layer.kind === 'design') ?? changes.added.find((layer) => layer.kind !== 'endCard')
    if (focus) {
      setSelectedId(focus.id)
      setPulseId(focus.id)
    }
    panelRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
    // Restart once the Player has taken the new settings: seeking and playing
    // in the same commit that swaps its input props can loop its updates.
    const timer = window.setTimeout(replay, REPLAY_AFTER_CHANGE_MS)
    return () => window.clearTimeout(timer)
  }, [settings, replay])

  useEffect(() => {
    if (!pulseId) return
    const timer = window.setTimeout(() => setPulseId(null), PULSE_MS)
    return () => window.clearTimeout(timer)
  }, [pulseId])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [notice])

  // ── Dragging ──────────────────────────────────────────────────────────────

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || !stageRef.current) return
      if (drag.pointerId !== null && event.pointerId !== drag.pointerId) return
      const rect = stageRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const dx = (event.clientX - drag.startX) / rect.width
      const dy = (event.clientY - drag.startY) / rect.height
      if (drag.mode === 'move') {
        commitPosition(drag.layerId, offsetLayer(drag.origin, dx, dy, compW, compH))
      } else {
        const nextScale = drag.origin.scale * (1 + dx * 2)
        commitScale(drag.layerId, scaleLayerTo(drag.origin, nextScale, compW, compH))
      }
    },
    [commitPosition, commitScale, compW, compH],
  )

  const endDrag = useCallback(() => {
    dragRef.current = null
  }, [])

  // Window-level listeners: a drag that leaves the stage (or the window)
  // keeps tracking until the pointer is released, and touch never scrolls
  // because the stage sets `touch-action: none`.
  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [onPointerMove, endDrag])

  // A layout switch can remove the selected layer: fall back to the first
  // layer instead of leaving a stale id behind.
  useEffect(() => {
    if (selectedId && settings.layers.some((layer) => layer.id === selectedId)) return
    setSelectedId(settings.layers[0]?.id || '')
  }, [selectedId, settings.layers])

  const startDrag = (event: React.PointerEvent, layer: PreviewLayer, mode: 'move' | 'resize') => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedId(layer.id)
    // Never drag an invisible, not-yet-animated layer: pause on a frame where
    // it is fully on screen.
    revealLayer(layer)
    dragRef.current = {
      layerId: layer.id,
      pointerId: typeof event.pointerId === 'number' ? event.pointerId : null,
      startX: event.clientX,
      startY: event.clientY,
      // Snapshot the bounded geometry so the layer follows the pointer from
      // exactly where the customer sees it, even if the saved values were
      // out of the safe area.
      origin: clampLayerToBounds(geometryLayer(layer), compW, compH),
      mode,
    }
    if (mode === 'move') {
      // Keep focus on the dragged box so arrow keys nudge straight after a drag.
      const target = event.currentTarget as HTMLElement | null
      target?.focus?.({ preventScroll: true })
    }
  }

  /** Arrow keys nudge (1% / Shift 5%), Delete/Backspace hides the layer. */
  const onLayerKeyDown = (event: React.KeyboardEvent, layer: PreviewLayer) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectLayer(layer)
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      updatePreviewLayer(layer.id, { visible: false })
      return
    }
    const delta = nudgeDeltaForKey(event.key, event.shiftKey)
    if (!delta) return
    event.preventDefault()
    setSelectedId(layer.id)
    commitPosition(layer.id, offsetLayer(geometryLayer(layer), delta.dx, delta.dy, compW, compH))
  }

  /** Arrow keys on the corner handle resize by 2% (Shift 10%). */
  const onHandleKeyDown = (event: React.KeyboardEvent, layer: PreviewLayer) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      return
    }
    const delta = nudgeDeltaForKey(event.key, event.shiftKey)
    if (!delta) return
    event.preventDefault()
    const grows = delta.dx > 0 || delta.dy > 0
    const step = event.shiftKey ? 1 + RESIZE_KEYBOARD_STEP_LARGE : 1 + RESIZE_KEYBOARD_STEP
    const base = geometryLayer(layer)
    commitScale(layer.id, scaleLayerTo(base, grows ? layer.scale * step : layer.scale / step, compW, compH))
  }

  const imageOptions = (layer: PreviewLayer) => imageAssetOptions(layer, assets)

  const toggleAdvanced = () => {
    setAdvanced((open) => {
      writeAdvancedPreference(!open)
      return !open
    })
  }

  // ── Timeline ──────────────────────────────────────────────────────────────

  // One bar per item on the whole timeline: opening scene, the video's items
  // (offset by the opening scene), closing scene.
  const timelineRows = editableLayers
    .filter((layer) => layer.visible)
    .map((layer) => {
      if (isSceneLayer(layer)) {
        const isIntro = designSlotOf(layer) === 'intro'
        return {
          layer,
          start: isIntro ? 0 : introLen + durationInFrames,
          end: isIntro ? introLen : totalLen,
        }
      }
      return {
        layer,
        start: introLen + Math.min(durationInFrames, layer.startFrame + layer.animationDelay),
        end: introLen + Math.min(durationInFrames, (layer.endFrame ?? durationInFrames - 1) + 1),
      }
    })
    .sort((a, b) => a.start - b.start)
  const endCardStart = introLen + endCardStartFrame(durationInFrames)
  /** Timeline click: select the layer and show it, or jump to the end card. */
  const activateTimelineRow = (layer: PreviewLayer | null) => {
    if (layer) selectLayer(layer)
    else seekTo(endCardStart + 1)
  }
  const percent = (value: number) => `${Math.max(0, Math.min(100, (value / totalLen) * 100))}%`

  return (
    <div ref={panelRef} style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
        <Move size={15} color={C.cyan} />
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
          Edit on the video
        </h3>
        <button
          type="button"
          onClick={() => resetPreviewLayout()}
          aria-label="Restore default layout"
          style={{ ...secondaryButtonStyle, minHeight: 30, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RotateCcw size={11} /> Restore default layout
        </button>
      </div>
      <p
        style={hintStyle}
        title={`Arrow keys nudge the selected item by 1% (Shift for 5%), Delete hides it. Items stay inside the ${Math.round(SAFE_AREA_MARGIN * 100)}% safe area of the frame, and positions are saved with your project.`}
      >
        This is exactly what your final video will look like. Click an item to edit it, drag to move, use the
        corner to resize.
      </p>

      {notice ? (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 10,
            padding: '8px 10px',
            borderRadius: 10,
            border: `1px solid ${C.cyanBorder}`,
            background: C.cyanSoft,
            color: C.text,
            fontSize: 12,
          }}
        >
          <CheckCircle2 size={14} color={C.cyan} />
          <span style={{ flex: 1 }}>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setNotice(null)}
            style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: 2 }}
          >
            <X size={13} />
          </button>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 14, marginTop: 12 }} className="guided-overlay-grid">
        {/* ── Stage: the live Remotion preview + handles ─────────────────── */}
        <div style={{ minWidth: 0 }}>
          <div
            ref={stageRef}
            role="group"
            aria-label="Video overlay stage"
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: `${compW} / ${compH}`,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${C.border}`,
              background: '#05070a',
              touchAction: 'none',
            }}
          >
            {/* The Player only mounts once the stage has a size to draw at. */}
            {stageWidth > 0 ? (
              <div style={{ position: 'absolute', inset: 0 }}>
                <PersonalizationPlayer
                  inputProps={inputProps}
                  hideTransport
                  playerRefOverride={playerRef}
                  onFrameChange={setFrame}
                  onPlayingChange={setPlaying}
                  ariaLabel="Editable video preview"
                />
              </div>
            ) : null}
            {/* Safe-area guide: the same 2% inset the clamp enforces. */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: `${SAFE_AREA_MARGIN * 100}%`,
                border: '1px dashed rgba(255,255,255,.16)',
                borderRadius: 8,
                pointerEvents: 'none',
              }}
            />

            {/* While an opening/closing scene covers the frame, the items
                underneath are hidden, so their outlines are too. */}
            {activeScene ? (
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 10,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'rgba(5,7,10,.8)',
                  color: C.text,
                  fontSize: 10,
                  fontWeight: 700,
                  pointerEvents: 'none',
                }}
              >
                {designSlotOf(activeScene) === 'intro'
                  ? `Opening scene · your video starts at ${framesToSeconds(introLen, fps).toFixed(1)}s`
                  : 'Closing scene · plays after your video'}
              </span>
            ) : null}

            {/* Handle layer: outlines and resize handles only — the Player
                draws the content, so empty space still plays/pauses. */}
            {factor > 0 && !activeScene &&
              editableLayers.filter((layer) => layer.visible && !isSceneLayer(layer)).map((layer) => {
                const status = layerStatus(layer, brand)
                if (status === 'missing-image' || status === 'empty-text' || status === 'missing-design') return null
                const metrics = layerBoxMetrics(renderedLayerGeometry(geometryLayer(layer), compW, compH), compW, compH)
                const box = toStageBox(geometryLayer(layer), compW, compH, stageWidth)
                const height = box.height ?? metrics.heightPx * factor
                const isSelected = selected?.id === layer.id
                const isHovered = hoveredId === layer.id
                const isPulsing = pulseId === layer.id
                const outline = isSelected || isPulsing
                  ? `2px solid ${C.cyan}`
                  : isHovered
                    ? `1px dashed ${C.cyanBorder}`
                    : '1px dashed rgba(255,255,255,.18)'

                return (
                  <div
                    key={layer.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Move ${layerLabel(layer)}`}
                    aria-pressed={isSelected}
                    onPointerDown={(event) => startDrag(event, layer, 'move')}
                    onPointerEnter={() => setHoveredId(layer.id)}
                    onPointerLeave={() => setHoveredId((current) => (current === layer.id ? null : current))}
                    onKeyDown={(event) => onLayerKeyDown(event, layer)}
                    style={{
                      position: 'absolute',
                      left: box.left,
                      top: box.top,
                      width: box.width,
                      height,
                      cursor: 'move',
                      outline,
                      outlineOffset: 2,
                      borderRadius: 4,
                      boxShadow: isPulsing ? `0 0 0 6px ${C.cyanSoft}` : undefined,
                      transition: 'box-shadow 300ms ease',
                      userSelect: 'none',
                    }}
                  >
                    {(isSelected || isHovered) && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          // Inside the box when there is no room above it.
                          top: box.top < 22 ? 2 : -20,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: isSelected ? C.cyan : 'rgba(5,7,10,.85)',
                          color: isSelected ? '#041014' : C.text,
                          fontSize: 10,
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                        }}
                      >
                        {layerLabel(layer)}
                      </span>
                    )}
                    {isSelected && (
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={`Resize ${layerLabel(layer)}`}
                        onPointerDown={(event) => startDrag(event, layer, 'resize')}
                        onKeyDown={(event) => onHandleKeyDown(event, layer)}
                        style={{
                          position: 'absolute',
                          right: -7,
                          bottom: -7,
                          width: 14,
                          height: 14,
                          borderRadius: 4,
                          background: C.cyan,
                          border: '2px solid #041014',
                          cursor: 'nwse-resize',
                        }}
                      />
                    )}
                  </div>
                )
              })}
          </div>

          {/* ── Transport + timeline ──────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? 'Pause preview' : 'Play preview'}
              style={{ ...secondaryButtonStyle, minHeight: 30, width: 34, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              type="button"
              onClick={replay}
              aria-label="Replay preview"
              style={{ ...secondaryButtonStyle, minHeight: 30, width: 34, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RotateCcw size={13} />
            </button>
            <span style={{ color: C.muted, fontSize: 11, fontVariantNumeric: 'tabular-nums', minWidth: 72 }}>
              {framesToSeconds(frame, fps).toFixed(1)}s / {framesToSeconds(totalLen, fps).toFixed(1)}s
            </span>
          </div>

          <div aria-label="When each item appears" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[...timelineRows, ...(settings.showEndCard ? [null] : [])].map((row) => {
              const isEndCard = row === null
              const label = isEndCard ? LAYER_LABELS.endCard : layerLabel(row.layer)
              const start = isEndCard ? endCardStart : row.start
              const end = isEndCard ? introLen + durationInFrames : row.end
              const isSelected = !isEndCard && selected?.id === row.layer.id
              return (
                <div
                  key={isEndCard ? 'end-card' : row.layer.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${label} appears at ${framesToSeconds(start, fps).toFixed(1)} seconds`}
                  onClick={() => activateTimelineRow(isEndCard ? null : row.layer)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    activateTimelineRow(isEndCard ? null : row.layer)
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '92px minmax(0, 1fr)',
                    alignItems: 'center',
                    gap: 8,
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: isSelected ? C.cyan : C.muted, fontSize: 10, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {label}
                  </span>
                  <span style={{ position: 'relative', height: 8, borderRadius: 4, background: 'rgba(255,255,255,.06)' }}>
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: percent(start),
                        width: `calc(${percent(end)} - ${percent(start)})`,
                        borderRadius: 4,
                        background: isSelected ? C.cyan : C.cyanBorder,
                      }}
                    />
                    <span
                      aria-hidden
                      style={{ position: 'absolute', top: -2, bottom: -2, left: percent(frame), width: 1, background: C.text }}
                    />
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── What's on the video + controls ──────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <div style={labelStyle}>What&apos;s on your video</div>
          {orderedLayers.map((layer) => {
            const layerDesign =
              layer.kind === 'design' && layer.designId
                ? getRemotionDesignTemplate(layer.designId)
                : undefined
            const status = layerStatus(layer, brand)
            const warning = status === 'missing-image' || status === 'empty-text' || status === 'missing-design'
            const isSelected = selected?.id === layer.id
            const appearsAt = framesToSeconds(layer.startFrame + layer.animationDelay, fps)
            const subtitle =
              layer.kind === 'endCard'
                ? settings.showEndCard
                  ? 'Last few seconds'
                  : 'Off'
                : warning || status === 'hidden'
                  ? statusText(status, layer.kind)
                  : layerDesign
                    ? `${layerDesign.name} · ${DESIGN_CATEGORY_LABELS[layerDesign.category] ?? ''} · from ${appearsAt.toFixed(1)}s`
                    : `Appears at ${appearsAt.toFixed(1)}s`
            return (
              <div
                key={layer.id}
                role="button"
                tabIndex={0}
                aria-label={`Select ${layerLabel(layer)}`}
                aria-pressed={isSelected}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectLayer(layer)
                  }
                }}
                onClick={() => selectLayer(layer)}
                onPointerEnter={() => setHoveredId(layer.id)}
                onPointerLeave={() => setHoveredId((current) => (current === layer.id ? null : current))}
                style={{
                  ...softPanelStyle,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: `1px solid ${isSelected ? C.cyanBorder : warning ? 'rgba(245,184,64,.45)' : C.border}`,
                  cursor: 'pointer',
                  opacity: status === 'hidden' ? 0.6 : 1,
                }}
              >
                <span style={{ color: warning ? '#f5b840' : isSelected ? C.cyan : C.muted, display: 'inline-flex' }}>
                  {warning ? <AlertTriangle size={13} /> : kindIcon(layer.kind)}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', color: C.text, fontSize: 12, fontWeight: 700 }}>{layerLabel(layer)}</span>
                  <span style={{ display: 'block', color: warning ? '#f5b840' : C.muted, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {subtitle}
                  </span>
                </span>
                {layer.kind === 'endCard' ? null : (
                  <button
                    type="button"
                    aria-label={`${layer.visible ? 'Hide' : 'Show'} ${layerLabel(layer)}`}
                    aria-pressed={layer.visible}
                    onClick={(event) => {
                      event.stopPropagation()
                      updatePreviewLayer(layer.id, { visible: !layer.visible })
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: layer.visible ? C.cyan : C.muted2, padding: 2 }}
                  >
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                )}
              </div>
            )
          })}

          {selected && selected.kind !== 'endCard' && (
            <div style={{ ...softPanelStyle, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <div style={{ color: C.text, fontSize: 12, fontWeight: 800 }}>{layerLabel(selected)}</div>

              {selected.kind === 'design' && (
                <div style={{ color: C.muted, fontSize: 10 }}>
                  {selectedDesign
                    ? `${selectedDesign.name} — ${selectedDesign.description}`
                    : 'This design is not registered, so it will not render.'}
                </div>
              )}

              {TEXT_KINDS.includes(selected.kind) && (
                <>
                  {selected.kind === 'design' && selectedDesign ? (
                    selectedSlots.length > 0 ? (
                      /* One editable field per slot the design declares. */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedSlots.map((slot) => {
                          const label = designSlotLabel(slot)
                          const slotId = controlId(`slot-${slot.key}`)
                          return (
                            <div key={slot.key}>
                              <label style={labelStyle} htmlFor={slotId}>{label}</label>
                              <textarea
                                id={slotId}
                                aria-label={label}
                                value={selectedSlotValues[slot.key] ?? ''}
                                onChange={(event) => onDesignSlotChange(slot, event.target.value)}
                                rows={2}
                                maxLength={slotMaxLength(slot)}
                                style={{ ...inputStyle, padding: '8px 11px', resize: 'vertical' }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{ color: C.muted, fontSize: 10 }}>This design has no editable text.</div>
                    )
                  ) : (
                    <div>
                      <label style={labelStyle} htmlFor={controlId('text')}>{selectedTextLabel}</label>
                      <textarea
                        id={controlId('text')}
                        aria-label="Layer text"
                        value={selected.text ?? ''}
                        placeholder={layerText(selected, brand)}
                        onChange={(event) => updatePreviewLayer(selected.id, { text: event.target.value })}
                        rows={2}
                        style={{ ...inputStyle, padding: '8px 11px', resize: 'vertical' }}
                      />
                    </div>
                  )}
                  {selected.kind !== 'design' ? (
                    <div>
                      <label style={labelStyle} htmlFor={controlId('color')}>Color</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          id={controlId('color')}
                          type="color"
                          aria-label="Text color"
                          value={
                            selected.color ||
                            (selected.kind === 'cta' ? settings.brandColors.accent : settings.brandColors.text)
                          }
                          onChange={(event) => updatePreviewLayer(selected.id, { color: event.target.value })}
                          style={{ width: 52, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: C.field }}
                        />
                        <span style={{ color: C.muted, fontSize: 10, flex: 1 }}>
                          {selected.color
                            ? 'Custom color'
                            : selected.kind === 'cta'
                              ? 'Using your brand Accent color'
                              : 'Using your brand Text color'}
                        </span>
                        {selected.color ? (
                          <button
                            type="button"
                            onClick={() => updatePreviewLayer(selected.id, { color: undefined })}
                            style={{ ...chipStyle(false), minHeight: 26, fontSize: 10 }}
                          >
                            Match brand
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: C.muted, fontSize: 10 }}>
                      Uses your brand colors — change them under Colors above.
                    </div>
                  )}
                </>
              )}

              {isImageLayerKind(selected.kind) && (
                <div>
                  <label style={labelStyle} htmlFor={controlId('image')}>Image</label>
                  <select
                    id={controlId('image')}
                    aria-label="Layer image"
                    value={selected.imageUrl || ''}
                    onChange={(event) => updatePreviewLayer(selected.id, { imageUrl: event.target.value || undefined })}
                    style={inputStyle}
                  >
                    <option value="">{imageAssetDefaultLabel(selected.kind)}</option>
                    {imageOptions(selected).map((option, index) => (
                      <option key={`${index}-${option.value}`} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {!layerImageUrl(selected, brand) ? (
                    <p style={{ ...hintStyle, color: '#f5b840', marginTop: 6 }}>
                      Nothing to show yet, so this item is left off the video.{' '}
                      {setGuidedStep ? (
                        <button
                          type="button"
                          onClick={() => setGuidedStep(3)}
                          style={{ background: 'transparent', border: 'none', color: C.cyan, cursor: 'pointer', padding: 0, fontSize: 'inherit', textDecoration: 'underline' }}
                        >
                          Add one in Personalize
                        </button>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              )}

              {isSceneLayer(selected) ? (
                <p style={hintStyle}>
                  Plays for {framesToSeconds((selected.endFrame ?? 0) - selected.startFrame + 1, fps).toFixed(1)}s{' '}
                  {designSlotOf(selected) === 'intro' ? 'before' : 'after'} your video. Change it under Animated designs
                  above.
                </p>
              ) : (
              <>
              <div>
                <label style={labelStyle} htmlFor={controlId('scale')}>Size</label>
                <input
                  id={controlId('scale')}
                  type="range"
                  aria-label="Layer size"
                  min={MIN_LAYER_SCALE}
                  max={MAX_LAYER_SCALE}
                  step={0.01}
                  value={selected.scale}
                  onChange={(event) => {
                    const next = scaleLayerTo(geometryLayer(selected), Number(event.target.value), compW, compH)
                    commitScale(selected.id, next)
                  }}
                  style={{ width: '100%', accentColor: C.cyan }}
                />
              </div>

              <div>
                <div style={labelStyle}>Position</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, maxWidth: 180 }}>
                  {POSITION_GRID.map((position) => (
                    <button
                      key={position.id}
                      type="button"
                      aria-label={`Move layer to ${position.label}`}
                      title={position.label}
                      onClick={() => {
                        const next = clampLayerToBounds({ ...geometryLayer(selected), x: position.x, y: position.y }, compW, compH)
                        commitPosition(selected.id, next)
                      }}
                      style={{ ...chipStyle(false), minHeight: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 2, background: C.muted }} />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Move layer to Lower Third"
                  onClick={() => {
                    const lowerThird = PREVIEW_POSITIONS.find((position) => position.id === 'lower-third')
                    if (!lowerThird) return
                    const next = clampLayerToBounds({ ...geometryLayer(selected), x: lowerThird.x, y: lowerThird.y }, compW, compH)
                    commitPosition(selected.id, next)
                  }}
                  style={{ ...chipStyle(false), minHeight: 26, fontSize: 10, marginTop: 6 }}
                >
                  Lower third
                </button>
              </div>
              </>
              )}

              <button
                type="button"
                onClick={toggleAdvanced}
                aria-expanded={advanced}
                style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: 0, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}
              >
                {advanced ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Advanced
              </button>

              {advanced && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={labelStyle} htmlFor={controlId('opacity')}>Opacity</label>
                    <input
                      id={controlId('opacity')}
                      type="range"
                      aria-label="Layer opacity"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={selected.opacity}
                      onChange={(event) => updatePreviewLayer(selected.id, { opacity: Number(event.target.value) })}
                      style={{ width: '100%', accentColor: C.cyan }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle} htmlFor={controlId('animation')}>Entrance animation</label>
                    <select
                      id={controlId('animation')}
                      aria-label="Layer animation"
                      value={selected.animation}
                      onChange={(event) => {
                        updatePreviewLayer(selected.id, { animation: event.target.value as PreviewLayer['animation'] })
                        replay()
                      }}
                      style={inputStyle}
                    >
                      {PREVIEW_ANIMATIONS.map((animation) => (
                        <option key={animation.id} value={animation.id}>{animation.label}</option>
                      ))}
                    </select>
                  </div>

                  {TEXT_KINDS.includes(selected.kind) && selected.kind !== 'design' && (
                    <div>
                      <label style={labelStyle} htmlFor={controlId('font')}>Font</label>
                      <select
                        id={controlId('font')}
                        aria-label="Font"
                        value={selected.fontFamily || ''}
                        onChange={(event) => updatePreviewLayer(selected.id, { fontFamily: event.target.value || undefined })}
                        style={{ ...inputStyle, minHeight: 34 }}
                      >
                        <option value="">Match brand</option>
                        {/* Phase 3 decision D3: only the bundled face is
                            selectable. The historical per-OS entries stay
                            listed — as DISABLED options with their
                            "(unavailable)" labels — so a customer is never
                            silently offered a font that would break export
                            fidelity, and an old saved layer still shows which
                            (now unavailable) choice it carries. */}
                        {PREVIEW_FONTS.map((font) => (
                          <option
                            key={font.id}
                            value={font.stack}
                            disabled={!font.available}
                          >
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2" style={{ gap: 8 }}>
                    <div>
                      <label style={labelStyle} htmlFor={controlId('start')}>Show from (seconds)</label>
                      <input
                        id={controlId('start')}
                        type="number"
                        aria-label="Show from seconds"
                        min={0}
                        max={framesToSeconds(durationInFrames, fps)}
                        step={0.1}
                        value={framesToSeconds(selected.startFrame, fps)}
                        onChange={(event) =>
                          updatePreviewLayer(selected.id, { startFrame: secondsToFrames(Number(event.target.value), fps) })
                        }
                        style={{ ...inputStyle, minHeight: 34 }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle} htmlFor={controlId('delay')}>Animation delay (seconds)</label>
                      <input
                        id={controlId('delay')}
                        type="number"
                        aria-label="Animation delay seconds"
                        min={0}
                        max={framesToSeconds(durationInFrames, fps)}
                        step={0.1}
                        value={framesToSeconds(selected.animationDelay, fps)}
                        onChange={(event) =>
                          updatePreviewLayer(selected.id, { animationDelay: secondsToFrames(Number(event.target.value), fps) })
                        }
                        style={{ ...inputStyle, minHeight: 34 }}
                      />
                    </div>
                  </div>

                  <div style={{ color: C.muted, fontSize: 10 }}>
                    Position {Math.round(selected.x * 100)}% / {Math.round(selected.y * 100)}% · Size{' '}
                    {Math.round(selected.scale * 100)}% · kept inside the {Math.round(SAFE_AREA_MARGIN * 100)}% safe area
                  </div>
                </div>
              )}
            </div>
          )}

          {selected?.kind === 'endCard' && (
            <div style={{ ...softPanelStyle, marginTop: 4 }}>
              <div style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>Branded end card</div>
              <p style={hintStyle}>Shows your logo, contact details and final call to action at the end of the video.</p>
              <button
                type="button"
                aria-label={settings.showEndCard ? 'Turn off end card' : 'Turn on end card'}
                onClick={() => updatePreviewComposition({ showEndCard: !settings.showEndCard })}
                style={{ ...secondaryButtonStyle, minHeight: 30, marginTop: 8 }}
              >
                {settings.showEndCard ? 'Turn off end card' : 'Turn on end card'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>
        {`@media (max-width: 720px) { .guided-overlay-grid { grid-template-columns: minmax(0, 1fr); } }`}
      </style>
    </div>
  )
}

'use client'

import { CheckCircle2, Play } from 'lucide-react'
import { LiveCompositionPreview, useCardBackdrop, useHoverPlay } from './LiveCompositionPreview'
import { applyDesignTemplate, createDefaultPreviewSettings } from '../preview/presets'
import type { DesignSlot, PreviewInputProps } from '../preview/types'
import type { RemotionDesignCategory, RemotionDesignTemplate } from '../templates/types'
import { DESIGN_CATEGORY_LABELS } from './layerChanges'
import { C, labelStyle } from './tokens'

/**
 * Step 4 design picker: one preview card per registered Remotion design.
 *
 * Each card draws the design with the customer's own brand (text, logo and
 * colors) through the SAME composition the editor and the export use, so the
 * card shows exactly what clicking it adds. Cards show a still frame until
 * hovered or focused; only that card plays, so a catalog of dozens of designs
 * stays light. Thumbnails mount only once a card scrolls into view.
 */

export interface DesignGalleryProps {
  designs: RemotionDesignTemplate[]
  activeDesignId: string | null
  onSelect: (designId: string | null) => void
  /** The editor's preview input: brand, colors and the video's poster. */
  inputProps: PreviewInputProps
  /** Which slot this gallery fills; scenes and overlays list different designs. */
  slot?: DesignSlot
  /** Label of the card that clears the slot. */
  noneLabel?: string
}

/** True when a design belongs in this slot's gallery. */
export function designFitsSlot(design: RemotionDesignTemplate, slot: DesignSlot): boolean {
  const isScene = design.role === 'scene'
  return slot === 'overlay' ? !isScene : isScene
}

/** Card length: an overlay's hover loop, or the whole scene plus a short hold. */
function cardFrames(design: RemotionDesignTemplate): number {
  if (design.role !== 'scene') return HOVER_PREVIEW_FRAMES
  return Math.max(HOVER_PREVIEW_FRAMES, (design.sceneDurationInFrames ?? 90) + 15)
}

/**
 * CSS transform that zooms a card in on an overlay's own box, so a design
 * placed small on the frame still fills its card. Scenes fill the frame
 * already and are shown whole.
 */
export function cardZoomTransform(design: RemotionDesignTemplate): string | undefined {
  const placement = design.placement
  if (design.role === 'scene' || !placement || placement.scale >= 0.85) return undefined
  const zoom = Math.min(2.4, 1 / Math.max(0.2, placement.scale * 1.15))
  const dx = (0.5 - placement.x) * 100
  const dy = (0.5 - placement.y) * 100
  return `scale(${zoom.toFixed(3)}) translate(${dx.toFixed(2)}%, ${dy.toFixed(2)}%)`
}

const CARD_WIDTH = 1280
const CARD_HEIGHT = 720
/** Length of the looping hover preview. */
const HOVER_PREVIEW_FRAMES = 105

const TEXT_FIELD_LABELS: Record<string, string> = {
  businessName: 'business name',
  headline: 'headline',
  offer: 'offer',
  cta: 'call to action',
  phone: 'phone',
  website: 'website',
}

const MEDIA_LABELS: Record<string, string> = {
  logo: 'logo',
  product: 'product photo',
  service: 'service photo',
}

/** "Uses your logo + headline", from what the design declares. */
export function designUsesLine(design: RemotionDesignTemplate): string {
  const media = (Array.isArray(design.media) ? design.media : []).map((binding) => MEDIA_LABELS[binding.role])
  const text = (Array.isArray(design.textSlots) ? design.textSlots : []).map((slot) => TEXT_FIELD_LABELS[slot.field])
  const parts = Array.from(new Set([...media, ...text].filter(Boolean)))
  if (parts.length === 0) return 'Uses your brand colors'
  return `Uses your ${parts.slice(0, 3).join(' + ')}`
}

/** Where on the frame the design sits by default. */
export function designPlacementLine(design: RemotionDesignTemplate, slot: DesignSlot = 'overlay'): string {
  if (design.role === 'scene') {
    const seconds = Math.round(((design.sceneDurationInFrames ?? 90) / 30) * 10) / 10
    return `Full screen · ${seconds}s ${slot === 'outro' ? 'at the end' : 'at the start'}`
  }
  const placement = design.placement
  if (!placement || placement.scale >= 0.85) return 'Full screen'
  if (placement.y >= 0.65) return 'Bottom of the video'
  if (placement.y <= 0.35) return 'Top of the video'
  return 'Middle of the video'
}

/** The frame a still thumbnail shows: the design's own animation has finished. */
export function designStillFrame(design: RemotionDesignTemplate, fps: number): number {
  const frames = cardFrames(design)
  if (typeof design.posterFrame === 'number') return Math.max(0, Math.min(frames - 1, design.posterFrame))
  const animation = design.animation
  const settled = animation ? animation.delayInFrames + animation.durationInFrames : Math.round(fps * 1.5)
  return Math.max(1, Math.min(frames - 1, settled + 6))
}

/** Preview input with only this design on the customer's backdrop. */
function cardInputProps(design: RemotionDesignTemplate, base: PreviewInputProps, backdrop: string): PreviewInputProps {
  const fps = (base.settings?.fps ?? 0) > 0 ? base.settings.fps : 30
  const frames = cardFrames(design)
  const settings = applyDesignTemplate(
    createDefaultPreviewSettings({
      layers: [],
      aspectRatio: '16:9',
      fps,
      // Twice the scene length, so the scene window (at most half the video)
      // covers the whole authored scene.
      durationInFrames: design.role === 'scene' ? frames * 2 : frames,
      showEndCard: false,
      brandColors: { ...(base.settings?.brandColors ?? {}), backgroundDim: 0 },
    }),
    design.id,
    {
      businessName: base.brand.businessName,
      headline: base.brand.headline,
      offer: base.brand.offer,
      cta: base.brand.cta,
      logoUrl: base.brand.logoUrl ?? undefined,
      productUrl: base.brand.productUrl ?? undefined,
      serviceUrl: base.brand.serviceUrl ?? undefined,
    },
    design.role === 'scene' ? 'intro' : 'overlay',
  )
  return {
    ...base,
    // A still backdrop, never the video: dozens of cards must not each decode it.
    videoUrl: null,
    isImageSource: true,
    posterUrl: backdrop,
    audioUrl: null,
    settings: { ...settings, width: CARD_WIDTH, height: CARD_HEIGHT },
  }
}

function DesignCard({
  design,
  active,
  onSelect,
  inputProps,
  slot,
}: {
  design: RemotionDesignTemplate
  active: boolean
  onSelect: () => void
  inputProps: PreviewInputProps
  slot: DesignSlot
}): React.JSX.Element {
  const { playing, handlers } = useHoverPlay()
  const backdrop = useCardBackdrop(inputProps)
  const fps = (inputProps.settings?.fps ?? 0) > 0 ? inputProps.settings.fps : 30
  const usesLine = designUsesLine(design)
  const placementLine = designPlacementLine(design, slot)
  const zoom = cardZoomTransform(design)

  return (
    <button
      type="button"
      onClick={onSelect}
      {...handlers}
      aria-pressed={active}
      aria-label={design.name}
      title={design.description}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 6,
        borderRadius: 12,
        border: `1px solid ${active ? C.cyan : C.border}`,
        background: active ? C.cyanSoft : C.panelSoft,
        cursor: 'pointer',
        textAlign: 'left',
        minWidth: 0,
      }}
    >
      <span
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#06090d',
        }}
      >
        <span style={{ position: 'absolute', inset: 0, transform: zoom, transformOrigin: 'center' }}>
          <LiveCompositionPreview
            buildInputProps={() => cardInputProps(design, inputProps, backdrop)}
            playing={playing}
            stillFrame={designStillFrame(design, fps)}
            durationInFrames={cardFrames(design)}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            fps={fps}
          />
        </span>
        {!playing ? (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              right: 6,
              bottom: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'rgba(5,7,10,.75)',
              color: C.text,
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            <Play size={9} /> Hover to play
          </span>
        ) : null}
        {active ? (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: 6,
              top: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 6px',
              borderRadius: 999,
              background: C.cyan,
              color: '#041014',
              fontSize: 9,
              fontWeight: 800,
            }}
          >
            <CheckCircle2 size={9} /> Added
          </span>
        ) : null}
      </span>
      <span style={{ padding: '0 2px 2px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ color: active ? C.cyan : C.text, fontSize: 12, fontWeight: 800 }}>{design.name}</span>
        <span style={{ color: C.muted, fontSize: 10, lineHeight: 1.35 }}>{usesLine}</span>
        <span style={{ color: C.muted2, fontSize: 10 }}>{placementLine}</span>
      </span>
    </button>
  )
}

/** Designs grouped by category, in the label map's order. */
function groupByCategory(designs: RemotionDesignTemplate[]): [RemotionDesignCategory, RemotionDesignTemplate[]][] {
  const order = Object.keys(DESIGN_CATEGORY_LABELS) as RemotionDesignCategory[]
  return order
    .map(
      (category) =>
        [
          category,
          designs.filter((design) => (design.category in DESIGN_CATEGORY_LABELS ? design.category : 'other') === category),
        ] as [RemotionDesignCategory, RemotionDesignTemplate[]],
    )
    .filter(([, entries]) => entries.length > 0)
}

export function DesignGallery({
  designs: allDesigns,
  activeDesignId,
  onSelect,
  inputProps,
  slot = 'overlay',
  noneLabel = 'None: no animated design',
}: DesignGalleryProps): React.JSX.Element {
  const designs = allDesigns.filter((design) => designFitsSlot(design, slot))
  // Overlays are grouped by type; the scene rows are short enough to list flat.
  const groups: [string, RemotionDesignTemplate[]][] =
    slot === 'overlay'
      ? groupByCategory(designs).map(([category, entries]) => [DESIGN_CATEGORY_LABELS[category], entries])
      : [['', designs]]
  const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
    gap: 8,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={grid}>
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={activeDesignId === null}
          aria-label="None"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 64,
            borderRadius: 12,
            border: `1px ${activeDesignId === null ? 'solid' : 'dashed'} ${activeDesignId === null ? C.cyan : C.border}`,
            background: activeDesignId === null ? C.cyanSoft : 'transparent',
            color: activeDesignId === null ? C.cyan : C.muted,
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {noneLabel}
        </button>
      </div>
      {groups.map(([label, entries]) => (
        <div key={label || 'all'}>
          {label ? <div style={{ ...labelStyle, marginBottom: 6 }}>{label}</div> : null}
          <div style={grid}>
            {entries.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                active={activeDesignId === design.id}
                onSelect={() => onSelect(activeDesignId === design.id ? null : design.id)}
                inputProps={inputProps}
                slot={slot}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

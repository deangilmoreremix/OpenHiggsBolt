'use client'

/**
 * PersonalizationTemplateBrowser — categorized gallery of video layout
 * templates for Step 3 of the Easy Personalization Wizard.
 *
 * Mirrors the Motion Studio TemplateBrowser pattern: category tabs, search,
 * and a responsive grid of selectable cards. Clicking a card calls
 * `onSelect(layoutId)` which applies the layout preset to the wizard's
 * preview settings. Browser-only: never makes a paid call.
 */

import {
  useMemo,
  useState,
  useCallback,
  useId,
  useRef,
  useEffect,
  type CSSProperties,
  type ReactElement,
} from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Search,
  Sparkles,
  Type as TypeIcon,
  Image as ImageIcon,
  Layers,
  Clock,
  Check,
  ArrowRightLeft,
  Music,
  Sparkle,
  LogIn,
  Camera,
  Box,
  ChevronRight,
} from 'lucide-react'
import { Player } from '@remotion/player'
import type { PlayerRef } from '@remotion/player'
import { PREVIEW_LAYOUTS, LAYER_IDS_BY_LAYOUT, applyLayoutPreset } from '../preview/presets'
import { PersonalizationComposition } from '../preview/PersonalizationComposition'
import type { PreviewInputProps, PreviewLayoutId, PreviewLayerKind } from '../preview/types'
import { buildPreviewInput } from './buildPreviewInput'
import { C, badgeStyle, hintStyle, inputStyle, panelStyle, primaryButtonStyle, softPanelStyle, tileStyle } from './tokens'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'

/** Category keys for personalization layouts. */
export type PersonalizationCategoryKey =
  | 'introduction'
  | 'product'
  | 'service'
  | 'offer'
  | 'team'
  | 'transformation'
  | 'ending'

type IconComponent = LucideIcon

/** Map each layout ID to its category key. */
const LAYOUT_CATEGORY: Record<string, PersonalizationCategoryKey> = {
  'business-introduction': 'introduction',
  'product-showcase': 'product',
  'menu-item-highlight': 'product',
  'service-promotion': 'service',
  'customer-testimonial': 'service',
  'special-offer': 'offer',
  'event-promotion': 'offer',
  'team-member-intro': 'team',
  'before-after-transformation': 'transformation',
  'branded-ending': 'ending',
}

/** Category definitions with icons and labels. */
const CATEGORIES: Array<{ key: PersonalizationCategoryKey; label: string; icon: IconComponent }> = [
  { key: 'introduction', label: 'Introduction', icon: Sparkles },
  { key: 'product', label: 'Product', icon: ImageIcon },
  { key: 'service', label: 'Service', icon: Layers },
  { key: 'offer', label: 'Offer', icon: ArrowRightLeft },
  { key: 'team', label: 'Team', icon: Camera },
  { key: 'transformation', label: 'Transformation', icon: ArrowRightLeft },
  { key: 'ending', label: 'Ending', icon: LogIn },
]

/** Layer kind → short label for badges. */
const LAYER_BADGE_LABELS: Record<PreviewLayerKind, string> = {
  logo: 'Logo',
  businessName: 'Business name',
  headline: 'Headline',
  offer: 'Offer',
  cta: 'CTA',
  productImage: 'Product image',
  serviceImage: 'Service image',
  tagline: 'Tagline',
  endCard: 'End card',
  design: 'Design',
}

function layoutCategoryKey(layoutId: PreviewLayoutId): PersonalizationCategoryKey {
  return LAYOUT_CATEGORY[layoutId] ?? 'introduction'
}

function categoryCount(key: PersonalizationCategoryKey): number {
  return PREVIEW_LAYOUTS.filter((l) => layoutCategoryKey(l.id) === key).length
}

function resolveIcon(key: PersonalizationCategoryKey): IconComponent {
  return CATEGORIES.find((c) => c.key === key)?.icon ?? Box
}

function resolveLabel(key: PersonalizationCategoryKey): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key
}

/** Placeholder tile showing the layer arrangement as colored dots. */
function TemplateLayerPreview({ layoutId }: { layoutId: PreviewLayoutId }): React.JSX.Element {
  const kinds = LAYER_IDS_BY_LAYOUT[layoutId] ?? []
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 8,
        background: 'linear-gradient(135deg, #12171c, #151a20)',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
        {kinds.map((kind) => (
          <span
            key={kind}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,.04)',
              color: C.muted,
              fontSize: 8,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.03em',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: kind === 'logo' ? C.green : kind === 'cta' ? C.cyan : C.cyanSoft,
              }}
            />
            {LAYER_BADGE_LABELS[kind]}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Props for the template browser. */
export interface PersonalizationTemplateBrowserProps {
  /** When a layout is selected, applies the preset via the provider. */
  onSelect?: (layoutId: PreviewLayoutId) => void
}

/** Categorized gallery of personalization layout templates. */
export function PersonalizationTemplateBrowser({ onSelect }: PersonalizationTemplateBrowserProps): React.JSX.Element {
  const ctx = useDemoPersonalize()
  const { previewSettings, setPreviewLayout, source, previewVideo, clientForm, assets } = ctx
  const baseInput = useMemo<PreviewInputProps | null>(
    () =>
      previewSettings
        ? buildPreviewInput({ source, previewSettings, previewVideo, clientForm: clientForm ?? {}, assets })
        : null,
    [source, previewSettings, previewVideo, clientForm, assets],
  )
  const [activeCategory, setActiveCategory] = useState<PersonalizationCategoryKey | 'all'>('all')
  const [query, setQuery] = useState('')
  const searchId = useId()

  const handleSelect = useCallback(
    (layoutId: PreviewLayoutId) => {
      if (onSelect) onSelect(layoutId)
      else setPreviewLayout(layoutId)
    },
    [onSelect, setPreviewLayout],
  )

  /** Visible layouts, filtered by category and search. */
  const visible = useMemo<PreviewLayoutId[]>(() => {
    const trimmed = query.trim().toLowerCase()
    return PREVIEW_LAYOUTS.filter((layout) => {
      if (activeCategory !== 'all' && layoutCategoryKey(layout.id) !== activeCategory) return false
      if (!trimmed) return true
      const haystack = `${layout.name} ${layout.description}`.toLowerCase()
      return haystack.includes(trimmed)
    }).map((layout) => layout.id)
  }, [query, activeCategory])

  const totalCount = PREVIEW_LAYOUTS.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── Header + search ──────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <Sparkles size={15} color={C.cyan} />
          <h3
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
              color: C.text,
            }}
          >
            Video layout templates
          </h3>
          <span style={badgeStyle('muted')}>{totalCount} templates</span>
          <span style={badgeStyle('cyan')}>{CATEGORIES.length} categories</span>
        </div>
        <label
          htmlFor={searchId}
          style={{
            display: 'block',
            color: C.muted,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.04em',
            marginBottom: 4,
          }}
        >
          Search templates
        </label>
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            color={C.muted}
            style={{ position: 'absolute', top: '50%', left: 11, transform: 'translateY(-50%)' }}
          />
          <input
            id={searchId}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, category, or layer…"
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
        <p style={hintStyle}>
          Pick a layout to arrange your logo, photos and text on the video. Every template is editable —
          move, resize or hide any layer in the next step.
        </p>
      </div>

      {/* ── Category tabs ────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <div
          role="tablist"
          aria-label="Layout template categories"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
        >
          <CategoryTab
            label="All"
            icon={Sparkles}
            active={activeCategory === 'all'}
            count={totalCount}
            onClick={() => setActiveCategory('all')}
          />
          {CATEGORIES.map((category) => {
            const Icon = resolveIcon(category.key)
            return (
              <CategoryTab
                key={category.key}
                label={category.label}
                icon={Icon}
                active={activeCategory === category.key}
                count={categoryCount(category.key)}
                onClick={() => setActiveCategory(category.key)}
              />
            )
          })}
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        {visible.length === 0 ? (
          <p style={hintStyle}>No templates match that search. Try a different query or category.</p>
        ) : (
          <>
            <p style={{ ...hintStyle, marginTop: 0, marginBottom: 10 }}>
              {visible.length === totalCount
                ? `All ${totalCount} layout templates.`
                : `Showing ${visible.length} of ${totalCount} templates.`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 10 }}>
              {visible.map((layoutId) => (
                <TemplateCard
                  key={layoutId}
                  layoutId={layoutId}
                  active={previewSettings.layout === layoutId}
                  onSelect={handleSelect}
                  baseInput={baseInput}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Single category tab. */
function CategoryTab({
  label,
  icon: Icon,
  active,
  count,
  onClick,
}: {
  label: string
  icon: IconComponent
  active: boolean
  count: number
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        minHeight: 32,
        padding: '0 12px',
        borderRadius: 999,
        border: `1px solid ${active ? C.cyanBorder : C.border}`,
        background: active ? C.cyanSoft : 'transparent',
        color: active ? C.cyan : C.muted,
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      <Icon size={12} color={active ? C.cyan : C.muted} />
      {label}
      <span style={{ ...badgeStyle(active ? 'cyan' : 'muted'), marginLeft: 2 }}>{count}</span>
    </button>
  )
}

/** Single template card. */
function TemplateCard({
  layoutId,
  active,
  onSelect,
  baseInput,
}: {
  layoutId: PreviewLayoutId
  active: boolean
  onSelect: (layoutId: PreviewLayoutId) => void
  /** The customer's current preview input; the card re-lays it out. */
  baseInput: PreviewInputProps | null
}): React.JSX.Element {
  const inputProps = useMemo<PreviewInputProps | null>(() => {
    if (!baseInput) return null
    const { brand } = baseInput
    return {
      ...baseInput,
      settings: applyLayoutPreset(baseInput.settings, layoutId, {
        businessName: brand.businessName || 'Your Business',
        headline: brand.headline || brand.businessName || 'Your headline here',
        offer: brand.offer || '20% off this week',
        cta: brand.cta || 'Book now',
        phone: brand.phone,
        website: brand.website,
        logoUrl: brand.logoUrl ?? undefined,
        productUrl: brand.productUrl ?? undefined,
        serviceUrl: brand.serviceUrl ?? undefined,
      }),
    }
  }, [baseInput, layoutId])

  const layout = PREVIEW_LAYOUTS.find((l) => l.id === layoutId)
  if (!layout) return <></>
  const kinds = LAYER_IDS_BY_LAYOUT[layoutId] ?? []
  const [hovering, setHovering] = useState(false)

  return (
    <div
      data-testid="personalization-template-card"
      data-template-id={layoutId}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={`Select ${layout.name} template`}
      onClick={() => onSelect(layoutId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(layoutId)
        }
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        ...tileStyle(active),
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
        userSelect: 'none',
        borderColor: hovering || active ? C.cyanBorder : C.border,
      }}
    >
      {inputProps ? (
        <TemplateLivePreview inputProps={inputProps} playing={active || hovering} />
      ) : (
        <TemplateLayerPreview layoutId={layoutId} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={badgeStyle('cyan')}>{resolveLabel(layoutCategoryKey(layoutId))}</span>
        {active && (
          <span style={badgeStyle('green')}>
            <Check size={9} /> Selected
          </span>
        )}
      </div>

      <div style={{ color: C.text, fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{layout.name}</div>
      <p style={{ ...hintStyle, margin: 0 }}>{layout.description}</p>

      {kinds.length > 0 && (
        <div
          aria-label="Layers included"
          style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
        >
          {kinds.map((kind) => (
            <span
              key={kind}
              data-testid={`layer-badge-${kind}`}
              title={LAYER_BADGE_LABELS[kind]}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 6px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: 'rgba(255,255,255,.03)',
                color: C.muted,
                fontSize: 8,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.04em',
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 999,
                  background: kind === 'logo' ? C.green : kind === 'cta' ? C.cyan : C.cyanSoft,
                }}
              />
              {LAYER_BADGE_LABELS[kind]}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        data-testid="personalization-template-use"
        onClick={() => onSelect(layoutId)}
        style={{ ...primaryButtonStyle, flex: 1, minHeight: 36, fontSize: 11, padding: '0 12px' }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Use this template <ChevronRight size={12} />
        </span>
      </button>
    </div>
  )
}

/**
 * Live Remotion preview for a layout template card.
 *
 * Renders the real `PersonalizationComposition` — the customer's selected
 * video with this template's layers on top — so each card shows exactly what
 * the template will look like. The Player mounts only once the card scrolls
 * near the viewport, and plays only while the card is selected or hovered so
 * a grid of cards never decodes ten videos at once.
 */
function TemplateLivePreview({
  inputProps,
  playing,
}: {
  inputProps: PreviewInputProps
  playing: boolean
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerRef>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    try {
      if (playing) player.play()
      else player.pause()
    } catch {
      // Autoplay policies can reject play(); the still frame stays visible.
    }
  }, [playing, inView])

  const settings = inputProps.settings
  const durationInFrames = Math.max(1, Math.round(settings.durationInFrames))
  // Paused cards rest on a frame where the overlays have finished animating in.
  const restFrame = Math.min(durationInFrames - 1, Math.round(settings.fps * 1.5))
  const PreviewComposition = PersonalizationComposition as unknown as React.ComponentType<
    Record<string, unknown>
  >

  return (
    <div
      ref={containerRef}
      data-testid="personalization-template-player"
      style={{
        width: '100%',
        aspectRatio: `${settings.width} / ${settings.height}`,
        borderRadius: 8,
        overflow: 'hidden',
        background: '#000',
        // Clicks select the card; the preview itself is not interactive.
        pointerEvents: 'none',
      }}
    >
      {inView ? (
        <Player
          ref={playerRef}
          component={PreviewComposition}
          inputProps={inputProps as unknown as Record<string, unknown>}
          durationInFrames={durationInFrames}
          compositionWidth={settings.width}
          compositionHeight={settings.height}
          fps={settings.fps}
          initialFrame={restFrame}
          loop
          controls={false}
          clickToPlay={false}
          initiallyMuted
          autoPlay={playing}
          acknowledgeRemotionLicense
          style={{ width: '100%', height: '100%' }}
        />
      ) : null}
    </div>
  )
}

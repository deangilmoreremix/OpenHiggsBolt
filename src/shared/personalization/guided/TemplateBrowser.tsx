'use client'

/**
 * TemplateBrowser — the Motion Studio library browser for Step 2 of the
 * Easy Personalization Wizard.
 *
 * Surfaces the FULL Motion Studio shot library (124 recipe cards / 150
 * motion shots / 10 categories) sourced from `src/data/motionRecipeCatalog`,
 * which is the single source of truth. The browser is browser-only: it
 * never makes a paid call and never reaches for a Node.js / FFmpeg /
 * desktop dependency. The "Use this template" action sets the recipe as
 * the wizard's in-modal preview; the secondary "Edit in Motion Studio"
 * action hands off to the canonical `/studio/motion-studio` route.
 */

import { useMemo, useState, useCallback, useId, type CSSProperties } from 'react'
import {
  Image as ImageIcon,
  Search,
  ChevronRight,
  Sparkles,
  Type as TypeIcon,
  Camera,
  Layers,
  Sliders,
  BarChart3,
  Hand,
  ArrowRightLeft,
  Music,
  Sparkle,
  LogIn,
  ExternalLink,
  Check,
  Clock,
  Box,
  FileImage,
  MonitorPlay,
  ShoppingBag,
  MessageSquareQuote,
} from 'lucide-react'
import {
  MOTION_CATEGORIES,
  MOTION_TEMPLATES,
  getMotionTemplatesByCategory,
  searchMotionTemplates,
  type MotionCategoryKey,
  type MotionTemplate,
} from '@/data/motionRecipeCatalog'
import { C, badgeStyle, hintStyle, inputStyle, panelStyle, primaryButtonStyle, secondaryButtonStyle, softPanelStyle, tileStyle } from './tokens'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'

/** Map a category key to a small lucide icon so the tab bar reads at a glance. */
const CATEGORY_ICONS: Record<MotionCategoryKey, React.ComponentType<{ size?: number; color?: string }>> = {
  opening: Sparkles,
  typography: TypeIcon,
  'ui-entrance': Layers,
  camera: Camera,
  data: BarChart3,
  interaction: Hand,
  transition: ArrowRightLeft,
  rhythm: Music,
  effects: Sparkle,
  outro: LogIn,
}

/** English label for each category. The catalog carries the Chinese
 *  original as `categoryLabel`; this map supplies the English one for the
 *  UI. */
const CATEGORY_LABELS_EN: Record<MotionCategoryKey, string> = {
  opening: 'Opening',
  typography: 'Typography',
  'ui-entrance': 'UI Entrance',
  camera: 'Camera',
  data: 'Data',
  interaction: 'Interaction',
  transition: 'Transitions',
  rhythm: 'Rhythm',
  effects: 'Effects',
  outro: 'Outro',
}

const ASSET_ICONS: Array<{ key: keyof MotionTemplate['assets']; label: string; icon: React.ComponentType<{ size?: number; color?: string }> }> = [
  { key: 'logo', label: 'Logo', icon: FileImage },
  { key: 'image', label: 'Image', icon: ImageIcon },
  { key: 'screenshot', label: 'Screenshot', icon: MonitorPlay },
  { key: 'product', label: 'Product', icon: ShoppingBag },
  { key: 'text', label: 'Text', icon: TypeIcon },
  { key: 'cta', label: 'CTA', icon: MessageSquareQuote },
]

/**
 * Compose a stable poster URL for a template card. The catalog stores either
 * a `/public/...` path or a bare relative path; this normalises both to a
 * URL the `<img>` element can load.
 */
function posterUrl(template: MotionTemplate): string | null {
  if (!template.preview) return null
  if (template.preview.startsWith('http://') || template.preview.startsWith('https://')) {
    return template.preview
  }
  if (template.preview.startsWith('/')) return template.preview
  return `/${template.preview}`
}

/** Inline SVG placeholder used when a card has no poster image. Renders a
 *  tile that uses the catalog's category accent + the English name so the
 *  grid is visually complete even before previews are fetched. */
function TemplatePosterPlaceholder({ template }: { template: MotionTemplate }): React.JSX.Element {
  const Icon = CATEGORY_ICONS[template.category] ?? Box
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          `radial-gradient(circle at 30% 20%, ${C.cyanSoft}, transparent 60%),` +
          `linear-gradient(135deg, ${C.panelSoft}, ${C.field})`,
        border: `1px solid ${C.border}`,
      }}
    >
      <Icon size={36} color={C.cyan} />
    </div>
  )
}

export interface TemplateBrowserProps {
  /**
   * When true, "Use this template" calls the provider's
   * `useMotionTemplate` (sets the in-modal preview). When false, it calls
   * `launchMotionTemplate` (hands off to `/studio/motion-studio`). Defaults
   * to true — the wizard is the selection surface; the studio handoff is a
   * secondary action exposed on each card.
   */
  onSelect?: (template: MotionTemplate) => void
  onLaunch?: (template: MotionTemplate) => void
}

/**
 * The Motion Studio template browser. Renders 10 category tabs, a search
 * bar, and a responsive grid of selectable recipe cards. Two CTAs per card:
 * "Use this template" (in-modal preview) and "Edit in Motion Studio"
 * (canonical studio handoff).
 */
export function TemplateBrowser({ onSelect, onLaunch }: TemplateBrowserProps): React.JSX.Element {
  const ctx = useDemoPersonalize()
  const [activeCategory, setActiveCategory] = useState<MotionCategoryKey | 'all'>('all')
  const [query, setQuery] = useState('')
  const searchId = useId()

  const handleSelect = useCallback(
    (template: MotionTemplate) => {
      if (onSelect) onSelect(template)
      else ctx.useMotionTemplate(template)
    },
    [onSelect, ctx],
  )

  const handleLaunch = useCallback(
    (template: MotionTemplate) => {
      if (onLaunch) onLaunch(template)
      else ctx.launchMotionTemplate(template)
    },
    [onLaunch, ctx],
  )

  /** Visible cards, filtered by the active tab and the search box. */
  const visible = useMemo<MotionTemplate[]>(() => {
    const trimmed = query.trim()
    if (trimmed) return searchMotionTemplates(trimmed)
    if (activeCategory === 'all') return MOTION_TEMPLATES.slice()
    return getMotionTemplatesByCategory(activeCategory)
  }, [query, activeCategory])

  const totalCount = MOTION_TEMPLATES.length

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
            Motion Studio
          </h3>
          <span style={badgeStyle('muted')}>{totalCount} shots</span>
          <span style={badgeStyle('cyan')}>10 categories</span>
          <span style={{ marginLeft: 'auto', color: C.muted2, fontSize: 10 }}>
            Browser-only preview · hands off to the studio for editing & export
          </span>
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
          Search shots
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
            placeholder="Search by name, category, or component…"
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
        <p style={hintStyle}>
          The Motion Studio library is the canonical recipe set: {MOTION_CATEGORIES.length} motion categories from
          opening shots to outros. Each card lists the assets the recipe accepts (logo, image, text, CTA,
          …) so the in-modal preview can wire them up.
        </p>
      </div>

      {/* ── Category tabs ────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <div
          role="tablist"
          aria-label="Motion Studio categories"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
        >
          <CategoryTab
            label="All"
            icon={Sparkles}
            active={activeCategory === 'all'}
            count={totalCount}
            onClick={() => setActiveCategory('all')}
          />
          {MOTION_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.key] ?? Box
            return (
              <CategoryTab
                key={category.key}
                label={CATEGORY_LABELS_EN[category.key]}
                icon={Icon}
                active={activeCategory === category.key}
                count={category.count}
                onClick={() => setActiveCategory(category.key)}
              />
            )
          })}
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        {visible.length === 0 ? (
          <p style={hintStyle}>No Motion Studio shots match that search. Try a different query or category.</p>
        ) : (
          <>
            <p style={{ ...hintStyle, marginTop: 0, marginBottom: 10 }}>
              {visible.length === totalCount
                ? `All ${totalCount} shots from the full Motion Studio library.`
                : `Showing ${visible.length} of ${totalCount} shots.`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 10 }}>
              {visible.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  active={ctx.motionTemplate?.id === template.id}
                  onSelect={handleSelect}
                  onLaunch={handleLaunch}
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
  icon: React.ComponentType<{ size?: number; color?: string }>
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

/** Single recipe card. */
function TemplateCard({
  template,
  active,
  onSelect,
  onLaunch,
}: {
  template: MotionTemplate
  active: boolean
  onSelect: (template: MotionTemplate) => void
  onLaunch: (template: MotionTemplate) => void
}): React.JSX.Element {
  const poster = posterUrl(template)
  const supportedAssets = ASSET_ICONS.filter((entry) => template.assets[entry.key])
  const durationLabel = template.durationSec > 0 ? `${template.durationSec.toFixed(1)}s` : null

  return (
    <div
      data-testid="motion-template-card"
      data-template-id={template.id}
      style={{ ...tileStyle(active), display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {poster ? (
        <img
          src={poster}
          alt=""
          loading="lazy"
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            objectFit: 'cover',
            borderRadius: 8,
            display: 'block',
            background: '#000',
          }}
        />
      ) : (
        <TemplatePosterPlaceholder template={template} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={badgeStyle('cyan')}>{CATEGORY_LABELS_EN[template.category]}</span>
        {durationLabel && (
          <span style={badgeStyle('muted')}>
            <Clock size={9} /> {durationLabel}
          </span>
        )}
        {active && (
          <span style={badgeStyle('green')}>
            <Check size={9} /> Selected
          </span>
        )}
      </div>

      <div style={{ color: C.text, fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{template.nameEn}</div>
      {template.nameEn !== template.name && (
        <div style={{ color: C.muted2, fontSize: 10 }}>{template.name}</div>
      )}
      {template.summaryEn && (
        <p style={{ ...hintStyle, margin: 0 }}>{template.summaryEn}</p>
      )}

      {supportedAssets.length > 0 && (
        <div
          aria-label="Supported asset insertions"
          style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
        >
          {supportedAssets.map(({ key, label, icon: Icon }) => (
            <span
              key={key}
              data-testid={`asset-badge-${key}`}
              title={`Supports ${label}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 6px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: 'rgba(255,255,255,.03)',
                color: C.muted,
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.04em',
              }}
            >
              <Icon size={9} color={C.muted} />
              {label}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
        <button
          type="button"
          data-testid="motion-template-use"
          onClick={() => onSelect(template)}
          style={{ ...primaryButtonStyle, flex: 1, minHeight: 36, fontSize: 11, padding: '0 12px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Use this template <ChevronRight size={12} />
          </span>
        </button>
        <button
          type="button"
          data-testid="motion-template-launch"
          onClick={() => onLaunch(template)}
          style={{ ...secondaryButtonStyle, minHeight: 36, fontSize: 11, padding: '0 12px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ExternalLink size={11} /> Motion Studio
          </span>
        </button>
      </div>
    </div>
  )
}

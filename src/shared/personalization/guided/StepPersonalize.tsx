'use client'

import { Palette, Sparkles } from 'lucide-react'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'
import { PREVIEW_LAYOUTS } from '../preview/presets'
import { C, hintStyle, inputStyle, labelStyle, panelStyle, primaryButtonStyle, softPanelStyle, tileStyle } from './tokens'
import type { ClientProfile } from '../types'
import type { PreviewLayerKind } from '../preview/types'

const LAYER_LABELS: Record<PreviewLayerKind, string> = {
  logo: 'Logo',
  businessName: 'Business name',
  headline: 'Headline',
  offer: 'Offer',
  cta: 'Call to action',
  productImage: 'Product image',
  serviceImage: 'Service image',
  tagline: 'Tagline',
  endCard: 'Branded end card',
}

/**
 * Simple Mode step 3 — pick a ready-made layout and review what will be placed.
 *
 * Every visible field is editable; nothing is invented (an empty Offer stays
 * empty rather than being filled with a made-up promotion).
 */
export function StepPersonalize(): React.JSX.Element {
  const ctx = useDemoPersonalize()
  const {
    clientForm = {},
    updateClientForm,
    assets,
    previewSettings,
    setPreviewLayout,
    updatePreviewLayer,
    updatePreviewBrandColors,
    updatePreviewComposition,
    setGuidedStep,
  } = ctx

  const layers = previewSettings.layers
  const logoAvailable = Boolean(assets?.primaryLogo)
  const productAvailable = (assets?.products?.length || 0) > 0

  /** Update a client field AND the matching layer text so both stay in sync. */
  const setField = (field: keyof ClientProfile, value: string, layerKind: PreviewLayerKind) => {
    updateClientForm({ ...clientForm, [field]: value })
    const layer = layers.find((item) => item.kind === layerKind)
    if (layer) updatePreviewLayer(layer.id, { text: value })
  }

  const layoutUses = (layoutId: string): string[] => {
    const kinds: PreviewLayerKind[] =
      layoutId === 'business-introduction'
        ? ['logo', 'businessName', 'headline']
        : layoutId === 'product-showcase'
          ? ['logo', 'productImage', 'headline', 'offer']
          : layoutId === 'service-promotion'
            ? ['logo', 'serviceImage', 'headline', 'tagline']
            : layoutId === 'special-offer'
              ? ['headline', 'offer', 'cta']
              : ['logo', 'businessName', 'cta', 'endCard']
    return kinds.map((kind) => LAYER_LABELS[kind])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>Personalize automatically</h2>
        <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12, lineHeight: 1.55 }}>
          Pick a ready-made layout. We place your real logo, photos and details automatically — edit anything you see.
        </p>
      </div>

      {/* ── Layout picker ───────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Sparkles size={15} color={C.cyan} />
          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
            Choose a layout
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 10 }}>
          {PREVIEW_LAYOUTS.map((layout) => {
            const active = previewSettings.layout === layout.id
            return (
              <button key={layout.id} type="button" onClick={() => setPreviewLayout(layout.id)} style={tileStyle(active)}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 800 }}>{layout.name}</div>
                <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 11, lineHeight: 1.5 }}>{layout.description}</p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                  {layoutUses(layout.id).map((label) => (
                    <span key={label} style={{ ...softPanelStyle, padding: '2px 7px', fontSize: 9, color: C.muted, borderRadius: 999 }}>
                      {label}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Editable content ────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
          Your details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="guided-business-name">Business name</label>
            <input
              id="guided-business-name"
              value={clientForm.businessName || clientForm.name || ''}
              onChange={(event) => setField('businessName', event.target.value, 'businessName')}
              placeholder="Your business name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="guided-headline">Headline</label>
            <input
              id="guided-headline"
              value={clientForm.ctaHeadline || ''}
              onChange={(event) => setField('ctaHeadline', event.target.value, 'headline')}
              placeholder={clientForm.businessName || clientForm.name || 'A short opening line'}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="guided-offer">Offer (optional)</label>
            <input
              id="guided-offer"
              value={clientForm.offer || ''}
              onChange={(event) => setField('offer', event.target.value, 'offer')}
              placeholder="Leave empty unless you have one"
              style={inputStyle}
            />
            <p style={hintStyle}>Only add an offer you actually provide — we never invent discounts or prices.</p>
          </div>
          <div>
            <label style={labelStyle} htmlFor="guided-cta">Call to action</label>
            <input
              id="guided-cta"
              value={clientForm.callToAction || ''}
              onChange={(event) => setField('callToAction', event.target.value, 'cta')}
              placeholder={clientForm.website ? `Visit ${clientForm.website}` : clientForm.phone ? `Call ${clientForm.phone}` : 'e.g. Book a free quote'}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="guided-phone">Phone</label>
            <input
              id="guided-phone"
              value={clientForm.phone || ''}
              onChange={(event) => updateClientForm({ ...clientForm, phone: event.target.value })}
              placeholder="(optional)"
              style={inputStyle}
            />
            <p style={hintStyle}>Shown on the branded end card.</p>
          </div>
        </div>
      </div>

      {/* ── Brand colors ────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Palette size={15} color={C.cyan} />
          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
            Brand colors
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12 }}>
          {(
            [
              ['Primary', 'primary'],
              ['Accent', 'accent'],
              ['Text', 'text'],
            ] as const
          ).map(([label, key]) => (
            <div key={key}>
              <label style={labelStyle} htmlFor={`guided-color-${key}`}>{label}</label>
              <input
                id={`guided-color-${key}`}
                type="color"
                value={previewSettings.brandColors[key]}
                onChange={(event) => updatePreviewBrandColors({ [key]: event.target.value })}
                style={{ width: '100%', height: 40, borderRadius: 8, border: `1px solid ${C.border}`, background: C.field, padding: 3 }}
              />
            </div>
          ))}
          <div>
            <label style={labelStyle} htmlFor="guided-dim">Shade behind text</label>
            <input
              id="guided-dim"
              type="range"
              min={0}
              max={0.6}
              step={0.02}
              value={previewSettings.brandColors.backgroundDim}
              onChange={(event) => updatePreviewBrandColors({ backgroundDim: Number(event.target.value) })}
              style={{ width: '100%', accentColor: C.cyan }}
            />
          </div>
        </div>
      </div>

      {/* ── What will be placed ─────────────────────────────────────────── */}
      <div style={panelStyle}>
        <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
          What will be placed on your video
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 8 }}>
          {layers.map((layer) => {
            const isImageLayer = layer.kind === 'logo' || layer.kind === 'productImage' || layer.kind === 'serviceImage'
            const hasImage = isImageLayer ? Boolean(layer.imageUrl) : true
            const text = layer.text || ''
            const ready = layer.kind === 'endCard' ? previewSettings.showEndCard : hasImage && (isImageLayer || text.trim().length > 0)
            return (
              <div key={layer.id} style={{ ...softPanelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    flexShrink: 0,
                    background: ready ? C.green : C.muted2,
                  }}
                />
                <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{LAYER_LABELS[layer.kind]}</span>
                <span style={{ marginLeft: 'auto', color: ready ? C.green : C.muted, fontSize: 10, fontWeight: 700 }}>
                  {ready ? 'Ready' : layer.kind === 'productImage' && !productAvailable ? 'Add a photo in Advanced Editing' : isImageLayer && !hasImage ? 'Add an image' : 'Nothing to show'}
                </span>
              </div>
            )
          })}
        </div>
        {!logoAvailable && (
          <p style={hintStyle}>No logo yet — add one in Advanced Editing, or the layout works without it.</p>
        )}
        {!productAvailable && (
          <p style={hintStyle}>No product or service photos yet — add them in Advanced Editing to use those layouts fully.</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.text, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={previewSettings.showEndCard}
              onChange={(event) => updatePreviewComposition({ showEndCard: event.target.checked })}
            />
            Show a branded ending card
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => setGuidedStep(4)} style={primaryButtonStyle}>
          Apply and preview
        </button>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Move, RotateCcw } from 'lucide-react'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'
import {
  PREVIEW_ANIMATIONS,
  PREVIEW_FONTS,
  PREVIEW_POSITIONS,
  fontStackById,
  isImageLayerKind,
  toBox,
} from '../preview/presets'
import type {
  PersonalizationPreviewSettings,
  PreviewInputProps,
  PreviewLayer,
  PreviewLayerKind,
} from '../preview/types'
import { C, chipStyle, hintStyle, inputStyle, labelStyle, panelStyle, primaryButtonStyle, secondaryButtonStyle, softPanelStyle } from './tokens'

const LAYER_LABELS: Record<PreviewLayerKind, string> = {
  logo: 'Logo',
  businessName: 'Business name',
  headline: 'Headline',
  offer: 'Offer',
  cta: 'Call to action',
  productImage: 'Product image',
  serviceImage: 'Service image',
  tagline: 'Tagline',
  endCard: 'End card',
}

const TEXT_KINDS: PreviewLayerKind[] = ['businessName', 'headline', 'offer', 'cta', 'tagline']

function layerText(layer: PreviewLayer, brand: PreviewInputProps['brand']): string {
  if (typeof layer.text === 'string' && layer.text.trim()) return layer.text
  if (layer.kind === 'businessName') return brand.businessName
  if (layer.kind === 'headline') return brand.headline
  if (layer.kind === 'offer') return brand.offer
  if (layer.kind === 'cta') return brand.cta
  if (layer.kind === 'tagline') return brand.headline
  return ''
}

function layerImageUrl(layer: PreviewLayer, brand: PreviewInputProps['brand']): string {
  if (layer.imageUrl) return layer.imageUrl
  if (layer.kind === 'logo') return brand.logoUrl || ''
  if (layer.kind === 'productImage') return brand.productUrl || ''
  if (layer.kind === 'serviceImage') return brand.serviceUrl || ''
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
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
  originScale: number
  mode: 'move' | 'resize'
}

export interface OverlayEditorProps {
  inputProps: PreviewInputProps
}

/**
 * Direct-on-video overlay editor.
 *
 * Renders the selected video's poster as a stage and draws every preview layer
 * on top of it at the same normalized coordinates the Remotion composition
 * uses, so dragging here is exactly what the preview renders. Used both in
 * Simple Mode step 4 and in the modal's Advanced Editing section.
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
  const settings: PersonalizationPreviewSettings = previewSettings
  const stageRef = useRef<HTMLDivElement>(null)
  const stageWidth = useStageWidth(stageRef)
  const [selectedId, setSelectedId] = useState<string>(() => settings.layers[0]?.id || '')
  const dragRef = useRef<DragState | null>(null)

  const brand = inputProps.brand
  const compW = settings.width || 1920
  const compH = settings.height || 1080
  const factor = stageWidth > 0 ? stageWidth / compW : 0
  const stageHeight = Math.round(stageWidth * (compH / compW))

  const selected = settings.layers.find((layer) => layer.id === selectedId) || settings.layers[0] || null

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || !stageRef.current) return
      const rect = stageRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const dx = (event.clientX - drag.startX) / rect.width
      const dy = (event.clientY - drag.startY) / rect.height
      if (drag.mode === 'move') {
        const nextX = Math.min(1, Math.max(0, drag.originX + dx))
        const nextY = Math.min(1, Math.max(0, drag.originY + dy))
        updatePreviewLayer(drag.layerId, { x: Number(nextX.toFixed(4)), y: Number(nextY.toFixed(4)) })
      } else {
        const nextScale = Math.min(2, Math.max(0.05, drag.originScale * (1 + dx * 2)))
        updatePreviewLayer(drag.layerId, { scale: Number(nextScale.toFixed(4)) })
      }
    },
    [updatePreviewLayer],
  )

  const endDrag = useCallback(() => {
    dragRef.current = null
  }, [])

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

  const startDrag = (event: React.PointerEvent, layer: PreviewLayer, mode: 'move' | 'resize') => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedId(layer.id)
    dragRef.current = {
      layerId: layer.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: layer.x,
      originY: layer.y,
      originScale: layer.scale,
      mode,
    }
  }

  const imageOptions = (layer: PreviewLayer): { value: string; label: string }[] => {
    const pool = layer.kind === 'logo' ? assets?.logos || [] : assets?.products || []
    return pool.map((asset, index) => ({
      value: asset.uploadedUrl || asset.url,
      label: asset.name || `${LAYER_LABELS[layer.kind]} ${index + 1}`,
    }))
  }

  const editableLayers = settings.layers.filter((layer) => layer.kind !== 'endCard')

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
        <Move size={15} color={C.cyan} />
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: C.text }}>
          Edit on the video
        </h3>
        <button
          type="button"
          onClick={() => resetPreviewLayout()}
          style={{ ...secondaryButtonStyle, minHeight: 30, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RotateCcw size={11} /> Restore default layout
        </button>
      </div>
      <p style={hintStyle}>
        Drag any layer on the video to move it, or use its corner handle to resize. Positions are saved with your project.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 14, marginTop: 12 }} className="guided-overlay-grid">
        {/* ── Stage ─────────────────────────────────────────────────────── */}
        <div
          ref={stageRef}
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
          {inputProps.posterUrl ? (
            <img
              src={inputProps.posterUrl}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 12 }}>
              Your video
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: settings.brandColors.backgroundDim, pointerEvents: 'none' }} />

          {factor > 0 &&
            editableLayers.filter((layer) => layer.visible).map((layer) => {
              const box = toBox(layer, compW, compH)
              const left = box.leftPx * factor
              const top = box.topPx * factor
              const width = box.widthPx * factor
              const text = layerText(layer, brand)
              const imageUrl = layerImageUrl(layer, brand)
              if (!isImageLayerKind(layer.kind) && !text.trim()) return null
              if (isImageLayerKind(layer.kind) && !imageUrl) return null
              const isSelected = selected?.id === layer.id
              const color = layer.color ?? (layer.kind === 'cta' ? settings.brandColors.accent : settings.brandColors.text)

              return (
                <div
                  key={layer.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Move ${LAYER_LABELS[layer.kind]}`}
                  onPointerDown={(event) => startDrag(event, layer, 'move')}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') setSelectedId(layer.id)
                  }}
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width,
                    height: isImageLayerKind(layer.kind) ? width : undefined,
                    cursor: 'move',
                    outline: isSelected ? `2px dashed ${C.cyan}` : 'none',
                    outlineOffset: 2,
                    opacity: layer.opacity,
                  }}
                >
                  {isImageLayerKind(layer.kind) ? (
                    <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                  ) : layer.kind === 'cta' ? (
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <span
                        style={{
                          background: settings.brandColors.accent,
                          color: '#041014',
                          padding: '0.4em 1.1em',
                          borderRadius: 999,
                          display: 'inline-block',
                          fontFamily: fontStackById(layer.fontFamily),
                          fontSize: box.fontSizePx * factor,
                          fontWeight: 800,
                          pointerEvents: 'none',
                        }}
                      >
                        {text}
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontFamily: fontStackById(layer.fontFamily),
                        color,
                        fontSize: box.fontSizePx * factor,
                        fontWeight: layer.kind === 'businessName' ? 800 : 600,
                        lineHeight: 1.15,
                        textAlign: 'center',
                        width: '100%',
                        wordBreak: 'break-word',
                        pointerEvents: 'none',
                      }}
                    >
                      {text}
                    </div>
                  )}
                  {isSelected && (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`Resize ${LAYER_LABELS[layer.kind]}`}
                      onPointerDown={(event) => startDrag(event, layer, 'resize')}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') event.preventDefault()
                      }}
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

        {/* ── Layer list + controls ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <div style={labelStyle}>Layers</div>
          {settings.layers.map((layer) => (
            <div
              key={layer.id}
              style={{
                ...softPanelStyle,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: `1px solid ${selected?.id === layer.id ? C.cyanBorder : C.border}`,
                cursor: 'pointer',
              }}
              onClick={() => setSelectedId(layer.id)}
            >
              <span style={{ color: C.text, fontSize: 12, fontWeight: 700, flex: 1 }}>{LAYER_LABELS[layer.kind]}</span>
              {layer.kind === 'endCard' ? (
                <span style={{ color: C.muted, fontSize: 10 }}>{settings.showEndCard ? 'On' : 'Off'}</span>
              ) : (
                <button
                  type="button"
                  aria-label={`${layer.visible ? 'Hide' : 'Show'} ${LAYER_LABELS[layer.kind]}`}
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
          ))}

          {selected && selected.kind !== 'endCard' && (
            <div style={{ ...softPanelStyle, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <div style={{ color: C.text, fontSize: 12, fontWeight: 800 }}>{LAYER_LABELS[selected.kind]}</div>

              {TEXT_KINDS.includes(selected.kind) && (
                <>
                  <div>
                    <label style={labelStyle} htmlFor="overlay-layer-text">Text</label>
                    <textarea
                      id="overlay-layer-text"
                      value={selected.text ?? ''}
                      onChange={(event) => updatePreviewLayer(selected.id, { text: event.target.value })}
                      rows={2}
                      style={{ ...inputStyle, padding: '8px 11px', resize: 'vertical' }}
                    />
                  </div>
                  <div className="grid grid-cols-2" style={{ gap: 8 }}>
                    <div>
                      <label style={labelStyle} htmlFor="overlay-layer-color">Color</label>
                      <input
                        id="overlay-layer-color"
                        type="color"
                        value={selected.color || settings.brandColors.text}
                        onChange={(event) => updatePreviewLayer(selected.id, { color: event.target.value })}
                        style={{ width: '100%', height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: C.field }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle} htmlFor="overlay-layer-font">Font</label>
                      <select
                        id="overlay-layer-font"
                        value={selected.fontFamily || ''}
                        onChange={(event) => updatePreviewLayer(selected.id, { fontFamily: event.target.value || undefined })}
                        style={{ ...inputStyle, minHeight: 34 }}
                      >
                        <option value="">Match brand</option>
                        {PREVIEW_FONTS.map((font) => (
                          <option key={font.id} value={font.stack}>{font.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {isImageLayerKind(selected.kind) && (
                <div>
                  <label style={labelStyle} htmlFor="overlay-layer-image">Image</label>
                  <select
                    id="overlay-layer-image"
                    value={selected.imageUrl || ''}
                    onChange={(event) => updatePreviewLayer(selected.id, { imageUrl: event.target.value || undefined })}
                    style={inputStyle}
                  >
                    <option value="">Use your {selected.kind === 'logo' ? 'logo' : 'photo'}</option>
                    {imageOptions(selected).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle} htmlFor="overlay-layer-scale">Size</label>
                <input
                  id="overlay-layer-scale"
                  type="range"
                  min={0.05}
                  max={2}
                  step={0.01}
                  value={selected.scale}
                  onChange={(event) => updatePreviewLayer(selected.id, { scale: Number(event.target.value) })}
                  style={{ width: '100%', accentColor: C.cyan }}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="overlay-layer-opacity">Opacity</label>
                <input
                  id="overlay-layer-opacity"
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={selected.opacity}
                  onChange={(event) => updatePreviewLayer(selected.id, { opacity: Number(event.target.value) })}
                  style={{ width: '100%', accentColor: C.cyan }}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="overlay-layer-animation">Animation</label>
                <select
                  id="overlay-layer-animation"
                  value={selected.animation}
                  onChange={(event) =>
                    updatePreviewLayer(selected.id, { animation: event.target.value as PreviewLayer['animation'] })
                  }
                  style={inputStyle}
                >
                  {PREVIEW_ANIMATIONS.map((animation) => (
                    <option key={animation.id} value={animation.id}>{animation.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2" style={{ gap: 8 }}>
                <div>
                  <label style={labelStyle} htmlFor="overlay-layer-delay">Appear after (frames)</label>
                  <input
                    id="overlay-layer-delay"
                    type="number"
                    min={0}
                    max={Math.max(0, settings.durationInFrames)}
                    value={selected.animationDelay}
                    onChange={(event) => updatePreviewLayer(selected.id, { animationDelay: Math.max(0, Number(event.target.value) || 0) })}
                    style={{ ...inputStyle, minHeight: 34 }}
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="overlay-layer-start">Show from (frames)</label>
                  <input
                    id="overlay-layer-start"
                    type="number"
                    min={0}
                    max={Math.max(0, settings.durationInFrames)}
                    value={selected.startFrame}
                    onChange={(event) => updatePreviewLayer(selected.id, { startFrame: Math.max(0, Number(event.target.value) || 0) })}
                    style={{ ...inputStyle, minHeight: 34 }}
                  />
                </div>
              </div>

              <div>
                <div style={labelStyle}>Position presets</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {PREVIEW_POSITIONS.map((position) => (
                    <button
                      key={position.id}
                      type="button"
                      onClick={() => updatePreviewLayer(selected.id, { x: position.x, y: position.y })}
                      style={{ ...chipStyle(false), minHeight: 28, fontSize: 10 }}
                    >
                      {position.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selected?.kind === 'endCard' && (
            <div style={{ ...softPanelStyle, marginTop: 4 }}>
              <div style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>Branded end card</div>
              <p style={hintStyle}>Shows your logo, contact details and final call to action at the end of the video.</p>
              <button
                type="button"
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

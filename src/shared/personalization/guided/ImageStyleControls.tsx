'use client'

import { C, hintStyle, inputStyle, labelStyle, secondaryButtonStyle } from './tokens'
import type { ImageShadow, ImageShape, ImageStyle } from '../preview/imageStyle'

const SHAPES: { id: ImageShape; label: string }[] = [
  { id: 'rounded-rect', label: 'Rounded rectangle' },
  { id: 'circle', label: 'Circle' },
  { id: 'pill', label: 'Pill' },
  { id: 'square', label: 'Original (square corners)' },
  { id: 'custom', label: 'Custom corners' },
]
const SHADOWS: { id: ImageShadow; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'subtle', label: 'Subtle' },
  { id: 'medium', label: 'Medium' },
]

/**
 * Image look controls for an image layer: shape, corner radius, border, shadow,
 * fit, crop focus and exit. Editing starts from the look currently shown (the
 * automatic one included) and marks the style as the customer's, so the system
 * never replaces it. "Automatic" hands control back.
 */
export function ImageStyleControls({
  style,
  isAuto,
  reason,
  onChange,
  onReset,
}: {
  style: ImageStyle
  isAuto: boolean
  reason: string
  onChange: (patch: Partial<ImageStyle>) => void
  onReset: () => void
}): React.JSX.Element {
  const row = { display: 'grid', gap: 4 } as const
  return (
    <div data-testid="image-style-controls" style={{ display: 'grid', gap: 10, padding: '10px 0', borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={labelStyle}>Image style</div>
        <span data-testid="image-style-mode" style={{ ...hintStyle, margin: 0 }}>{isAuto ? 'Automatic' : 'Your style'}</span>
      </div>
      {isAuto && <p style={{ ...hintStyle, margin: 0 }}>Chosen automatically: {reason}. Change anything below to take control.</p>}

      <div style={row}>
        <label style={labelStyle}>Shape</label>
        <select aria-label="Image shape" value={style.shape} onChange={(e) => onChange({ shape: e.target.value as ImageShape })} style={inputStyle}>
          {SHAPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {(style.shape === 'rounded-rect' || style.shape === 'custom') && (
        <div style={row}>
          <label style={labelStyle}>Corner radius ({Math.round(style.radius * 100)}%)</label>
          <input type="range" aria-label="Corner radius" min={0} max={0.5} step={0.01} value={style.radius}
            onChange={(e) => onChange({ radius: Number(e.target.value) })} style={{ width: '100%', accentColor: C.cyan }} />
        </div>
      )}

      <div style={row}>
        <label style={labelStyle}>Border</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select aria-label="Border colour" value={style.borderWidth > 0 ? style.borderColor : 'none'}
            onChange={(e) => (e.target.value === 'none' ? onChange({ borderWidth: 0 }) : onChange({ borderColor: e.target.value, borderWidth: style.borderWidth > 0 ? style.borderWidth : 0.004 }))}
            style={{ ...inputStyle, flex: 1 }}>
            <option value="none">None</option>
            <option value="brand-primary">Brand colour</option>
            <option value="brand-accent">Accent colour</option>
            <option value="#ffffff">White</option>
            <option value="#000000">Black</option>
          </select>
          <input type="range" aria-label="Border width" min={0} max={0.015} step={0.001} value={style.borderWidth}
            disabled={style.borderWidth === 0} onChange={(e) => onChange({ borderWidth: Number(e.target.value) })} style={{ flex: 1, accentColor: C.cyan }} />
        </div>
      </div>

      <div style={row}>
        <label style={labelStyle}>Shadow</label>
        <select aria-label="Image shadow" value={style.shadow} onChange={(e) => onChange({ shadow: e.target.value as ImageShadow })} style={inputStyle}>
          {SHADOWS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <div style={row}>
        <label style={labelStyle}>Fit</label>
        <select aria-label="Image fit" value={style.fit} onChange={(e) => onChange({ fit: e.target.value as 'contain' | 'cover' })} style={inputStyle}>
          <option value="contain">Show the whole picture</option>
          <option value="cover">Fill the shape (crops)</option>
        </select>
      </div>

      {style.fit === 'cover' && (
        <>
          <div style={row}>
            <label style={labelStyle}>Crop: left–right</label>
            <input type="range" aria-label="Crop horizontal" min={0} max={1} step={0.01} value={style.cropX}
              onChange={(e) => onChange({ cropX: Number(e.target.value) })} style={{ width: '100%', accentColor: C.cyan }} />
          </div>
          <div style={row}>
            <label style={labelStyle}>Crop: top–bottom</label>
            <input type="range" aria-label="Crop vertical" min={0} max={1} step={0.01} value={style.cropY}
              onChange={(e) => onChange({ cropY: Number(e.target.value) })} style={{ width: '100%', accentColor: C.cyan }} />
          </div>
        </>
      )}

      <div style={row}>
        <label style={labelStyle}>When it leaves</label>
        <select aria-label="Image exit" value={style.exit ?? 'none'} onChange={(e) => onChange({ exit: e.target.value as 'none' | 'fade' | 'shrink' })} style={inputStyle}>
          <option value="none">Cut</option>
          <option value="fade">Fade out</option>
          <option value="shrink">Shrink and fade</option>
        </select>
      </div>

      {!isAuto && (
        <button type="button" data-testid="image-style-reset" aria-label="Reset image style" onClick={onReset} style={{ ...secondaryButtonStyle, minHeight: 30, fontSize: 11 }}>
          Back to automatic
        </button>
      )}
    </div>
  )
}

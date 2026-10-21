'use client'

import { useId } from 'react'
import { Sparkles } from 'lucide-react'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'
import { REMOTION_DESIGN_REGISTRY, getRemotionDesign } from '../remotion/registry'
import type { PreviewInputProps } from '../preview/types'
import { humanizeDesignProp } from './designProps'
import {
  C,
  badgeStyle,
  chipStyle,
  hintStyle,
  inputStyle,
  labelStyle,
  panelStyle,
  softPanelStyle,
} from './tokens'

export interface RemotionDesignPickerProps {
  /**
   * The preview input the composition renders. Its `remotionDesignProps` are
   * the design's effective values (the design's own defaults, the values
   * derived from the customer's business data, and the customer's edits), so
   * the editor below always shows what is actually on screen.
   */
  inputProps: PreviewInputProps
}

/** A `<input type="color">` only accepts a 6-digit hex value. */
function colorInputValue(value: unknown, fallback: string): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase()
  }
  return fallback
}

/** The default colour a design prop falls back to. */
function defaultColorValue(value: unknown): string {
  return colorInputValue(value, '#ffffff')
}

/** A design prop that carries several lines is edited as one textarea. */
function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.join('\n')
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

/**
 * The motion-design picker of Step 4.
 *
 * It sits NEXT TO the existing pill-shaped personalization options (the
 * layout presets) and never replaces them: the customer can keep the
 * built-in overlay layout or swap in one of the registered Remotion designs.
 *
 * A design is filled from the data the customer already entered — their
 * business name, offer, call to action and brand colours plus their logo —
 * so picking a design never asks for anything new. The copy and the colours
 * the design exposes can still be tweaked here, using the same field
 * conventions as the on-video overlay editor.
 */
export function RemotionDesignPicker({
  inputProps,
}: RemotionDesignPickerProps): React.JSX.Element {
  const { previewSettings, setPreviewDesign, updatePreviewDesignProps } = useDemoPersonalize()
  const fieldPrefix = useId()

  const selectedId = previewSettings.remotionDesignId ?? null
  const selected = selectedId ? getRemotionDesign(selectedId) : undefined
  const resolved = selected ? (inputProps.remotionDesignProps ?? {}) : {}

  const controlId = (name: string) => `${fieldPrefix}-${name}`

  const writeText = (prop: string, raw: string) => {
    const current = resolved[prop]
    const next = Array.isArray(current) ? raw.split('\n') : raw
    updatePreviewDesignProps({ [prop]: next })
  }

  return (
    <div style={panelStyle} data-testid="remotion-design-picker">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
          flexWrap: 'wrap',
        }}
      >
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
          Motion design
        </h3>
        {selected ? (
          <span style={badgeStyle('cyan')}>
            {selected.placement === 'overlay' ? 'Over your video' : 'Full frame'}
          </span>
        ) : null}
      </div>
      <p style={hintStyle}>
        Add a motion design to your video. Overlay designs stay transparent on top of your
        footage; full-frame designs become the video itself. Your business name, offer, brand
        colours and logo fill the design automatically — there is nothing new to enter. While a
        design is selected it replaces the built-in overlay layers.
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        <button
          type="button"
          onClick={() => setPreviewDesign(null)}
          aria-pressed={!selected}
          data-testid="design-pill-none"
          style={chipStyle(!selected)}
        >
          Your layout
        </button>
        {REMOTION_DESIGN_REGISTRY.map((design) => (
          <button
            key={design.id}
            type="button"
            onClick={() => setPreviewDesign(design.id)}
            aria-pressed={selectedId === design.id}
            data-testid={`design-pill-${design.id}`}
            style={chipStyle(selectedId === design.id)}
          >
            {design.name}
          </button>
        ))}
      </div>

      {selected ? (
        <div
          style={{
            ...softPanelStyle,
            marginTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ color: C.text, fontSize: 12, fontWeight: 800 }}>{selected.name}</div>
          {selected.notes ? <p style={{ ...hintStyle, marginTop: 0 }}>{selected.notes}</p> : null}

          {selected.editableText.length > 0 ? (
            <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Text
            </div>
          ) : null}
          {selected.editableText.map((prop) => (
            <div key={prop}>
              <label style={labelStyle} htmlFor={controlId(`text-${prop}`)}>
                {humanizeDesignProp(prop)}
              </label>
              <textarea
                id={controlId(`text-${prop}`)}
                aria-label={`Design text: ${humanizeDesignProp(prop)}`}
                value={textValue(resolved[prop])}
                onChange={(event) => writeText(prop, event.target.value)}
                rows={2}
                style={{ ...inputStyle, padding: '8px 11px', resize: 'vertical' }}
              />
            </div>
          ))}

          {selected.brandColorProps.length > 0 ? (
            <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Colours
            </div>
          ) : null}
          <div className="grid grid-cols-2" style={{ gap: 8 }}>
            {selected.brandColorProps.map((prop) => (
              <div key={prop}>
                <label style={labelStyle} htmlFor={controlId(`color-${prop}`)}>
                  {humanizeDesignProp(prop)}
                </label>
                <input
                  id={controlId(`color-${prop}`)}
                  type="color"
                  aria-label={`Design colour: ${humanizeDesignProp(prop)}`}
                  value={defaultColorValue(resolved[prop] ?? selected.defaultProps[prop])}
                  onChange={(event) => updatePreviewDesignProps({ [prop]: event.target.value })}
                  style={{
                    width: '100%',
                    height: 34,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.field,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

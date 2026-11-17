import { useState } from 'react'
import { Captions, Plus, Trash2 } from 'lucide-react'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'
import { ColorField } from './editor/ColorField'
import { Tip } from './editor/Tip'
import { C, chipStyle, hintStyle, inputStyle, labelStyle, panelStyle, secondaryButtonStyle } from './tokens'
import {
  CAPTION_PRESETS, DEFAULT_CAPTION_STYLE, MAX_CUES, captionPreset, cuesFromText, newCue,
  type CaptionCue, type CaptionPosition, type CaptionSettings, type CaptionStyle,
} from '../preview/captions'
import type { PreviewInputProps } from '../preview/types'

/**
 * Captions (Step 4): paste a script or subtitles and the lines are timed across the video; adjust each line's words and times,
 * pick a style (the presets take your brand colors), a position and size, a word highlight and a box. Free: nothing is
 * transcribed or generated, the words are yours. Drawn live and in the exported video by the same code.
 */
export function CaptionsPanel({ inputProps }: { inputProps: PreviewInputProps }): React.JSX.Element {
  const { previewSettings, updatePreviewComposition } = useDemoPersonalize()
  const [open, setOpen] = useState(false)
  const [script, setScript] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const durationSec = previewSettings.durationInFrames / Math.max(1, previewSettings.fps)
  const brand = previewSettings.brandColors
  const caps: CaptionSettings = previewSettings.captions ?? { enabled: false, cues: [], style: captionPreset('karaoke', brand) ?? DEFAULT_CAPTION_STYLE }
  const set = (patch: Partial<CaptionSettings>) => updatePreviewComposition({ captions: { ...caps, ...patch } })
  const setStyle = (patch: Partial<CaptionStyle>) => set({ style: { ...caps.style, ...patch, preset: patch.preset ?? 'custom' } })
  const setCue = (id: string, patch: Partial<CaptionCue>) => set({ cues: caps.cues.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  const apply = () => {
    const cues = cuesFromText(script, durationSec).slice(0, MAX_CUES)
    if (cues.length === 0) { setNotice('Nothing to caption yet. Paste some words or subtitles.'); return }
    setNotice(`${cues.length} line${cues.length > 1 ? 's' : ''} timed across ${durationSec.toFixed(1)} seconds. Adjust them below.`)
    set({ cues, enabled: true })
  }

  const numField = (id: string, label: string, value: number, onChange: (v: number) => void) => (
    <label htmlFor={id} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 9, color: C.muted2 }}>
      {label}
      <input id={id} data-testid={id} type="number" aria-label={label} min={0} max={durationSec} step={0.1} value={Math.round(value * 100) / 100}
        onChange={(e) => { if (e.target.value.trim() !== '') onChange(Math.max(0, Number(e.target.value))) }} style={{ ...inputStyle, minHeight: 26, padding: '0 6px', fontSize: 11 }} />
    </label>
  )

  return (
    <div data-testid="captions-panel" style={{ ...panelStyle, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Captions size={14} color={C.cyan} aria-hidden />
        <button type="button" data-testid="captions-toggle-panel" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={{ ...secondaryButtonStyle, minHeight: 28, fontSize: 11, padding: '0 10px', flex: 1, textAlign: 'left' }}>
          Captions {caps.enabled && caps.cues.length ? `· ${caps.cues.length} lines` : ''}
        </button>
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <Tip id="captionsScript" side="top"><label style={labelStyle} htmlFor="captions-script">Your words</label></Tip>
            <textarea id="captions-script" data-testid="captions-script" rows={3} value={script} onChange={(e) => setScript(e.target.value)} placeholder="Paste a script, or subtitles in SRT format…" style={{ ...inputStyle, padding: '8px 11px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <button type="button" data-testid="captions-apply" onClick={apply} style={{ ...secondaryButtonStyle, minHeight: 30, fontSize: 11, padding: '0 12px', borderColor: C.cyan, color: C.cyan }}>Time my words</button>
              {caps.cues.length > 0 && (
                <button type="button" data-testid="captions-enabled" aria-pressed={caps.enabled} onClick={() => set({ enabled: !caps.enabled })} style={{ ...chipStyle(caps.enabled), minHeight: 30, fontSize: 11 }}>{caps.enabled ? 'Captions on' : 'Captions off'}</button>
              )}
              {caps.cues.length > 0 && (
                <button type="button" data-testid="captions-clear" onClick={() => updatePreviewComposition({ captions: undefined })} style={{ ...secondaryButtonStyle, minHeight: 30, fontSize: 11, padding: '0 12px' }}>Remove captions</button>
              )}
            </div>
            {notice && <div role="status" data-testid="captions-notice" style={{ ...hintStyle, margin: '6px 0 0' }}>{notice}</div>}
            <p style={{ ...hintStyle, margin: '6px 0 0' }}>Free. Nothing is listened to or generated: the lines are timed evenly across the video, then you can adjust each one.</p>
          </div>

          {caps.cues.length > 0 && (
            <>
              <div>
                <Tip id="captionsStyle" side="top"><div style={labelStyle}>Style</div></Tip>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {CAPTION_PRESETS.map((p) => (
                    <button key={p.id} type="button" data-testid={`captions-preset-${p.id}`} aria-pressed={caps.style.preset === p.id} onClick={() => set({ style: captionPreset(p.id, brand)!, enabled: true })} style={{ ...chipStyle(caps.style.preset === p.id), minHeight: 28, fontSize: 10 }}>{p.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {(['top', 'middle', 'bottom'] as CaptionPosition[]).map((pos) => (
                  <button key={pos} type="button" data-testid={`captions-pos-${pos}`} aria-pressed={caps.style.position === pos} onClick={() => setStyle({ position: pos })} style={{ ...chipStyle(caps.style.position === pos), minHeight: 26, fontSize: 10 }}>{pos[0].toUpperCase() + pos.slice(1)}</button>
                ))}
                <button type="button" data-testid="captions-highlight" aria-pressed={caps.style.highlight === 'word'} onClick={() => setStyle({ highlight: caps.style.highlight === 'word' ? 'none' : 'word' })} style={{ ...chipStyle(caps.style.highlight === 'word'), minHeight: 26, fontSize: 10 }}>Highlight word</button>
                <button type="button" data-testid="captions-box" aria-pressed={caps.style.box} onClick={() => setStyle({ box: !caps.style.box })} style={{ ...chipStyle(caps.style.box), minHeight: 26, fontSize: 10 }}>Box</button>
                <button type="button" data-testid="captions-caps" aria-pressed={caps.style.uppercase} onClick={() => setStyle({ uppercase: !caps.style.uppercase })} style={{ ...chipStyle(caps.style.uppercase), minHeight: 26, fontSize: 10 }}>CAPS</button>
              </div>
              <div>
                <label style={labelStyle} htmlFor="captions-size">Size</label>
                <input id="captions-size" data-testid="captions-size" type="range" aria-label="Caption size" min={0.025} max={0.14} step={0.005} value={caps.style.size} onChange={(e) => setStyle({ size: Number(e.target.value) })} style={{ width: '100%', accentColor: C.cyan }} />
              </div>
              <div className="grid grid-cols-2" style={{ gap: 8 }}>
                <ColorField id="captions-color" label="Text color" ariaLabel="Caption text color" tipId="textColor" value={caps.style.color} onChange={(hex) => setStyle({ color: hex })} brand={brand} posterUrl={inputProps.posterUrl} />
                <ColorField id="captions-highlight-color" label="Highlight color" ariaLabel="Caption highlight color" tipId="textColor" value={caps.style.highlightColor} onChange={(hex) => setStyle({ highlightColor: hex })} brand={brand} posterUrl={inputProps.posterUrl} />
              </div>
              {caps.style.box && (
                <ColorField id="captions-box-color" label="Box color" ariaLabel="Caption box color" tipId="textColor" value={caps.style.boxColor} onChange={(hex) => setStyle({ boxColor: hex })} brand={brand} posterUrl={inputProps.posterUrl} />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Tip id="captionsLines" side="top"><div style={labelStyle}>Lines</div></Tip>
                {caps.cues.map((c, i) => (
                  <div key={c.id} data-testid="caption-cue" data-cue-id={c.id} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <textarea data-testid="caption-cue-text" aria-label={`Caption line ${i + 1}`} rows={2} value={c.text} onChange={(e) => setCue(c.id, { text: e.target.value.slice(0, 240) })} style={{ ...inputStyle, padding: '6px 8px', resize: 'vertical', flex: 1, fontSize: 12 }} />
                      <button type="button" data-testid="caption-cue-delete" aria-label={`Delete caption line ${i + 1}`} onClick={() => set({ cues: caps.cues.filter((x) => x.id !== c.id) })} style={{ ...secondaryButtonStyle, minHeight: 28, width: 30, padding: 0, display: 'grid', placeItems: 'center' }}><Trash2 size={12} aria-hidden /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                      {numField(`caption-start-${c.id}`, 'Starts (s)', c.start, (v) => setCue(c.id, { start: v, end: Math.max(c.end, v + 0.1) }))}
                      {numField(`caption-end-${c.id}`, 'Ends (s)', c.end, (v) => setCue(c.id, { end: Math.max(v, c.start + 0.1) }))}
                    </div>
                  </div>
                ))}
                <button type="button" data-testid="caption-cue-add" disabled={caps.cues.length >= MAX_CUES} onClick={() => { const last = caps.cues.at(-1); const start = Math.min(durationSec - 0.5, last ? last.end : 0); set({ cues: [...caps.cues, newCue(start, Math.min(durationSec, start + 2))] }) }} style={{ ...secondaryButtonStyle, minHeight: 28, fontSize: 11, alignSelf: 'flex-start', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Plus size={12} aria-hidden /> Add a line</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Captions, Crosshair, Plus, Trash2 } from 'lucide-react'
import { downloadBlob } from '../preview/capite/subtitleExport'
import { useDemoPersonalize } from '../DemoPersonalizeProvider'
import { ColorField } from './editor/ColorField'
import { Tip } from './editor/Tip'
import { SavedStylesBar } from './SavedStylesBar'
import { applyCaptionStyle, captureCaptionStyle } from '../preview/textStyles'
import { C, chipStyle, hintStyle, inputStyle, labelStyle, panelStyle, secondaryButtonStyle } from './tokens'
import {
  ALL_CAPTION_PRESETS, CAPTION_ANIMATIONS, CAPTION_PRESET_CATEGORIES, CAPTION_PRESETS, DEFAULT_CAPTION_STYLE, MAX_CUES, captionPreset, cuesFromText, cuesToSrt, cuesToVtt, newCue,
  activeCue, type CaptionAnimation, type CaptionCue, type CaptionPosition, type CaptionSettings, type CaptionStyle,
} from '../preview/captions'
import { LANGUAGES } from '../captions/scripts'
import { applyCasing, clampNudge, findReplace, transcriptText, type Casing } from '../captions/textTools'
import { CAPTION_FONTS, CAPTION_FONT_CATEGORIES, CAPTION_WEIGHTS, captionFontStack, type CaptionWeight } from '../captions/capiteFonts'
import { loadCaptionFont } from '../captions/capiteFontLoader'
import { CAPTION_CASINGS, MAX_CAPTION_OFFSET, type CaptionCasing } from '../captions/captionCustom'
import { captionsToAss } from '../preview/captionAss'
import type { PreviewInputProps } from '../preview/types'

/**
 * Captions (Step 4): paste a script or subtitles and the lines are timed across the video; adjust each line's words and times,
 * pick a style (the presets take your brand colors), a position and size, a word highlight and a box. Free: nothing is
 * transcribed or generated, the words are yours. Drawn live and in the exported video by the same code.
 */
const downloadText = (content: string, name: string, mime: string) => downloadBlob(content, name, mime)

export function CaptionsPanel({ inputProps, onSeek, playFrame }: {
  inputProps: PreviewInputProps
  /** Jump the live preview to a frame. Missing when there is no live preview. */
  onSeek?: (frame: number) => void
  /** The live preview's current frame, to mark the line that is playing. */
  playFrame?: number
}): React.JSX.Element {
  const { previewSettings, updatePreviewComposition } = useDemoPersonalize()
  const [open, setOpen] = useState(false)
  const [script, setScript] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [find, setFind] = useState('')
  const [replaceWith, setReplaceWith] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [editNotice, setEditNotice] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  // The chosen font is embedded; load it so the sample line and the preview show it.
  const chosenFont = previewSettings.captions?.style.fontFamily
  const chosenWeight = previewSettings.captions?.style.weight
  useEffect(() => { if (chosenFont) void loadCaptionFont(chosenFont, { weight: chosenWeight ? CAPTION_WEIGHTS[chosenWeight] : 800, italic: previewSettings.captions?.style.italic }) }, [chosenFont, chosenWeight, previewSettings.captions?.style.italic])
  const durationSec = previewSettings.durationInFrames / Math.max(1, previewSettings.fps)
  const brand = previewSettings.brandColors
  const caps: CaptionSettings = previewSettings.captions ?? { enabled: false, cues: [], style: captionPreset('karaoke', brand) ?? DEFAULT_CAPTION_STYLE }
  const set = (patch: Partial<CaptionSettings>) => updatePreviewComposition({ captions: { ...caps, ...patch } })
  const setStyle = (patch: Partial<CaptionStyle>) => set({ style: { ...caps.style, ...patch, preset: patch.preset ?? 'custom' } })
  // Moving the captions does not change which look they use.
  const moveTo = (offsetY: number | undefined) => set({ style: { ...caps.style, offsetY } })
  const setCue = (id: string, patch: Partial<CaptionCue>) => set({ cues: caps.cues.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  // The line that is playing: marked, and scrolled into view inside the list (never the page).
  const playingId = onSeek && playFrame !== undefined ? activeCue(caps.cues, playFrame, previewSettings.fps)?.id : undefined
  useEffect(() => {
    const list = listRef.current
    if (!playingId || !list) return
    const row = list.querySelector<HTMLElement>(`[data-cue-id="${playingId}"]`)
    if (!row) return
    if (row.offsetTop < list.scrollTop) list.scrollTop = Math.max(0, row.offsetTop - 4)
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight + 4
  }, [playingId])

  const nudge = (id: string, dStart: number, dEnd: number) => {
    const c = caps.cues.find((x) => x.id === id)
    if (!c) return
    const [s0, e0] = clampNudge(c.start, c.end, dStart, dEnd)
    const end = Math.min(e0, durationSec)
    setCue(id, { start: Math.min(s0, Math.max(0, end - 0.1)), end })
  }
  const replaceAll = () => {
    const { items, count } = findReplace(caps.cues, find, replaceWith, { matchCase, wholeWord })
    if (!find) return
    if (count === 0) { setEditNotice('Nothing to replace.'); return }
    setEditNotice(`${count} replacement${count > 1 ? 's' : ''}.`)
    set({ cues: items.map((c) => ({ ...c, text: c.text.slice(0, 240) })) })
  }
  const recase = (casing: Casing) => set({ cues: caps.cues.map((c) => ({ ...c, text: applyCasing(c.text, casing) })) })

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
                <button type="button" data-testid="captions-download-srt" onClick={() => downloadText(cuesToSrt(caps.cues), 'captions.srt', 'application/x-subrip')} style={{ ...secondaryButtonStyle, minHeight: 30, fontSize: 11, padding: '0 12px' }}>Download .srt</button>
              )}
              {caps.cues.length > 0 && (
                <button type="button" data-testid="captions-download-vtt" onClick={() => downloadText(cuesToVtt(caps.cues), 'captions.vtt', 'text/vtt')} style={{ ...secondaryButtonStyle, minHeight: 30, fontSize: 11, padding: '0 12px' }}>Download .vtt</button>
              )}
              {caps.cues.length > 0 && (
                <button type="button" data-testid="captions-download-txt" onClick={() => downloadText(transcriptText(caps.cues.map((x) => x.text)), 'captions.txt', 'text/plain')} style={{ ...secondaryButtonStyle, minHeight: 30, fontSize: 11, padding: '0 12px' }}>.txt</button>
              )}
              {caps.cues.length > 0 && (
                <button type="button" data-testid="captions-download-ass" onClick={() => downloadText(captionsToAss(caps, { width: previewSettings.width || 1920, height: previewSettings.height || 1080 }), 'captions.ass', 'text/x-ssa')} style={{ ...secondaryButtonStyle, minHeight: 30, fontSize: 11, padding: '0 12px' }}>.ass</button>
              )}
              {caps.cues.length > 0 && (
                <button type="button" data-testid="captions-clear" onClick={() => updatePreviewComposition({ captions: undefined })} style={{ ...secondaryButtonStyle, minHeight: 30, fontSize: 11, padding: '0 12px' }}>Remove captions</button>
              )}
            </div>
            {caps.cues.length > 0 && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: C.text }}>
                <span style={{ ...hintStyle, margin: 0 }}>Language of these words:</span>
                <select data-testid="captions-language" aria-label="Caption language" value={caps.language ?? 'auto'} onChange={(e) => set({ language: e.target.value === 'auto' ? undefined : e.target.value })} style={{ ...inputStyle, width: 'auto', minHeight: 28, fontSize: 11, padding: '0 8px' }}>
                  <option value="auto">Work it out from the words</option>
                  {LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
              </label>
            )}
            {notice && <div role="status" data-testid="captions-notice" style={{ ...hintStyle, margin: '6px 0 0' }}>{notice}</div>}
            <p style={{ ...hintStyle, margin: '6px 0 0' }}>Free. Nothing is listened to or generated: the lines are timed evenly across the video, then you can adjust each one.</p>
          </div>

          {caps.cues.length > 0 && (
            <>
              <div>
                <Tip id="captionsStyle" side="top"><div style={labelStyle}>Style</div></Tip>
                {CAPTION_PRESET_CATEGORIES.map((cat) => {
                  const list = ALL_CAPTION_PRESETS.filter((p) => ('category' in p ? (p as { category: string }).category : 'brand') === cat.id)
                  if (list.length === 0) return null
                  return (
                    <div key={cat.id} style={{ marginBottom: 6 }}>
                      <div style={{ ...hintStyle, margin: '0 0 3px' }}>{cat.label}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {list.map((p) => (
                          <button key={p.id} type="button" data-testid={`captions-preset-${p.id}`} aria-pressed={caps.style.preset === p.id} onClick={() => set({ style: captionPreset(p.id, brand)!, enabled: true })} style={{ ...chipStyle(caps.style.preset === p.id), minHeight: 28, fontSize: 10 }}>{p.label}</button>
                        ))}
                      </div>
                    </div>
                  )
                })}
                <div style={{ ...hintStyle, margin: '4px 0 3px' }}>Word animation</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {(['none', ...CAPTION_ANIMATIONS] as (CaptionAnimation | 'none')[]).map((a) => (
                    <button key={a} type="button" data-testid={`captions-anim-${a}`} aria-pressed={(caps.style.animation ?? 'none') === a} onClick={() => setStyle({ animation: a === 'none' ? undefined : a, windowed: a === 'none' ? undefined : true })} style={{ ...chipStyle((caps.style.animation ?? 'none') === a), minHeight: 26, fontSize: 10 }}>{a === 'none' ? 'Plain' : a[0].toUpperCase() + a.slice(1)}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {(['top', 'middle', 'bottom'] as CaptionPosition[]).map((pos) => (
                  <button key={pos} type="button" data-testid={`captions-pos-${pos}`} aria-pressed={caps.style.position === pos} onClick={() => setStyle({ position: pos, offsetY: undefined })} style={{ ...chipStyle(caps.style.position === pos), minHeight: 26, fontSize: 10 }}>{pos[0].toUpperCase() + pos.slice(1)}</button>
                ))}
                <button type="button" data-testid="captions-highlight" aria-pressed={caps.style.highlight === 'word'} onClick={() => setStyle({ highlight: caps.style.highlight === 'word' ? 'none' : 'word' })} style={{ ...chipStyle(caps.style.highlight === 'word'), minHeight: 26, fontSize: 10 }}>Highlight word</button>
                <button type="button" data-testid="captions-box" aria-pressed={caps.style.box} onClick={() => setStyle({ box: !caps.style.box })} style={{ ...chipStyle(caps.style.box), minHeight: 26, fontSize: 10 }}>Box</button>
                <button type="button" data-testid="captions-caps" aria-pressed={caps.style.uppercase} onClick={() => setStyle({ uppercase: !caps.style.uppercase })} style={{ ...chipStyle(caps.style.uppercase), minHeight: 26, fontSize: 10 }}>CAPS</button>
              </div>
              <div>
                <label style={labelStyle} htmlFor="captions-size">Size</label>
                <input id="captions-size" data-testid="captions-size" type="range" aria-label="Caption size" min={0.025} max={0.14} step={0.005} value={caps.style.size} onChange={(e) => setStyle({ size: Number(e.target.value) })} style={{ width: '100%', accentColor: C.cyan }} />
              </div>
              <div data-testid="captions-customize" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={labelStyle}>Make it yours</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11, color: C.text }}>
                  <span style={{ ...hintStyle, margin: 0 }}>Font</span>
                  <select data-testid="captions-font" aria-label="Caption font" value={caps.style.fontFamily ?? ''} onChange={(e) => setStyle({ fontFamily: e.target.value || undefined })} style={{ ...inputStyle, width: 'auto', minHeight: 28, fontSize: 11, padding: '0 8px' }}>
                    <option value="">The look&apos;s own</option>
                    {CAPTION_FONT_CATEGORIES.map((cat) => (
                      <optgroup key={cat.id} label={cat.label}>
                        {CAPTION_FONTS.filter((f) => f.category === cat.id).map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  {caps.style.fontFamily && <span data-testid="captions-font-sample" style={{ fontFamily: captionFontStack(caps.style.fontFamily, 'sans-serif'), fontSize: 16, color: C.text }}>Aa Hello</span>}
                </label>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }} role="group" aria-label="Caption weight">
                  <span style={{ ...hintStyle, margin: 0 }}>Weight</span>
                  <button type="button" data-testid="captions-weight-default" aria-pressed={!caps.style.weight} onClick={() => setStyle({ weight: undefined })} style={{ ...chipStyle(!caps.style.weight), minHeight: 26, fontSize: 10 }}>Look&apos;s</button>
                  {(Object.keys(CAPTION_WEIGHTS) as CaptionWeight[]).map((w) => (
                    <button key={w} type="button" data-testid={`captions-weight-${w}`} aria-pressed={caps.style.weight === w} onClick={() => setStyle({ weight: w })} style={{ ...chipStyle(caps.style.weight === w), minHeight: 26, fontSize: 10 }}>{w === 'extra-bold' ? 'Extra bold' : w[0].toUpperCase() + w.slice(1)}</button>
                  ))}
                  <button type="button" data-testid="captions-italic" aria-pressed={caps.style.italic === true} onClick={() => setStyle({ italic: caps.style.italic ? undefined : true })} style={{ ...chipStyle(caps.style.italic === true), minHeight: 26, fontSize: 10, fontStyle: 'italic' }}>Italic</button>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }} role="group" aria-label="Caption casing">
                  <span style={{ ...hintStyle, margin: 0 }}>Letters</span>
                  <button type="button" data-testid="captions-casing-default" aria-pressed={!caps.style.casing} onClick={() => setStyle({ casing: undefined })} style={{ ...chipStyle(!caps.style.casing), minHeight: 26, fontSize: 10 }}>Look&apos;s</button>
                  {CAPTION_CASINGS.map((k: CaptionCasing) => (
                    <button key={k} type="button" data-testid={`captions-casing-${k}`} aria-pressed={caps.style.casing === k} onClick={() => setStyle({ casing: k })} style={{ ...chipStyle(caps.style.casing === k), minHeight: 26, fontSize: 10 }}>{k === 'upper' ? 'UPPER' : k === 'title' ? 'Title Case' : 'As written'}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2" style={{ gap: 8 }}>
                  <ColorField id="captions-outline-color" label="Outline color" ariaLabel="Caption outline color" tipId="textColor" value={caps.style.outline?.color ?? '#000000'} onChange={(hex) => setStyle({ outline: { size: caps.style.outline?.size ?? 0.06, color: hex } })} brand={brand} posterUrl={inputProps.posterUrl} />
                  <ColorField id="captions-bg-color" label="Background color" ariaLabel="Caption background color" tipId="textColor" value={caps.style.boxColor} onChange={(hex) => setStyle({ box: true, boxColor: hex })} brand={brand} posterUrl={inputProps.posterUrl} />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="captions-offset">Move up or down</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input id="captions-offset" data-testid="captions-offset" type="range" aria-label="Caption vertical position" min={-MAX_CAPTION_OFFSET} max={MAX_CAPTION_OFFSET} step={0.01} value={caps.style.offsetY ?? 0} onChange={(e) => moveTo(Number(e.target.value) || undefined)} style={{ flex: 1, accentColor: C.cyan }} />
                    <button type="button" data-testid="captions-offset-reset" disabled={!caps.style.offsetY} onClick={() => moveTo(undefined)} style={{ ...secondaryButtonStyle, minHeight: 26, fontSize: 10, padding: '0 8px' }}>Reset</button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2" style={{ gap: 8 }}>
                <ColorField id="captions-color" label="Text color" ariaLabel="Caption text color" tipId="textColor" value={caps.style.color} onChange={(hex) => setStyle({ color: hex })} brand={brand} posterUrl={inputProps.posterUrl} />
                <ColorField id="captions-highlight-color" label="Highlight color" ariaLabel="Caption highlight color" tipId="textColor" value={caps.style.highlightColor} onChange={(hex) => setStyle({ highlightColor: hex })} brand={brand} posterUrl={inputProps.posterUrl} />
              </div>
              {caps.style.box && (
                <ColorField id="captions-box-color" label="Box color" ariaLabel="Caption box color" tipId="textColor" value={caps.style.boxColor} onChange={(hex) => setStyle({ boxColor: hex })} brand={brand} posterUrl={inputProps.posterUrl} />
              )}

              <SavedStylesBar
                kind="captions"
                idPrefix="captions"
                styles={previewSettings.textStyles ?? []}
                onStylesChange={(next) => updatePreviewComposition({ textStyles: next.length ? next : undefined })}
                capture={() => captureCaptionStyle(caps.style, brand)}
                onApply={(s) => { if (s.kind === 'captions') set({ style: applyCaptionStyle(s.style, brand), enabled: true }) }}
                defaultName="Caption style"
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Tip id="captionsLines" side="top"><div style={labelStyle}>Lines</div></Tip>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input data-testid="captions-find" aria-label="Find in captions" placeholder="Find" value={find} onChange={(e) => { setFind(e.target.value); setEditNotice(null) }} style={{ ...inputStyle, width: 110, minHeight: 26, padding: '0 8px', fontSize: 11 }} />
                  <input data-testid="captions-replace" aria-label="Replace with" placeholder="Replace with" value={replaceWith} onChange={(e) => setReplaceWith(e.target.value)} style={{ ...inputStyle, width: 110, minHeight: 26, padding: '0 8px', fontSize: 11 }} />
                  <button type="button" data-testid="captions-find-case" aria-pressed={matchCase} onClick={() => setMatchCase((v) => !v)} style={{ ...chipStyle(matchCase), minHeight: 26, fontSize: 10 }}>Aa</button>
                  <button type="button" data-testid="captions-find-word" aria-pressed={wholeWord} onClick={() => setWholeWord((v) => !v)} style={{ ...chipStyle(wholeWord), minHeight: 26, fontSize: 10 }}>Whole word</button>
                  <button type="button" data-testid="captions-replace-all" onClick={replaceAll} style={{ ...secondaryButtonStyle, minHeight: 26, fontSize: 10, padding: '0 10px' }}>Replace all</button>
                  <span style={{ width: 6 }} />
                  {(['upper', 'title', 'lower'] as Casing[]).map((k) => (
                    <button key={k} type="button" data-testid={`captions-case-${k}`} onClick={() => recase(k)} style={{ ...secondaryButtonStyle, minHeight: 26, fontSize: 10, padding: '0 8px' }}>{k === 'upper' ? 'UPPER' : k === 'title' ? 'Title' : 'lower'}</button>
                  ))}
                </div>
                {editNotice && <div role="status" data-testid="captions-edit-notice" style={{ ...hintStyle, margin: 0 }}>{editNotice}</div>}
                <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto', position: 'relative' }}>
                {caps.cues.map((c, i) => (
                  <div key={c.id} data-testid="caption-cue" data-cue-id={c.id} data-active={String(c.id === playingId)} style={{ border: `1px solid ${c.id === playingId ? C.cyan : C.border}`, borderRadius: 8, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <textarea data-testid="caption-cue-text" aria-label={`Caption line ${i + 1}`} rows={2} value={c.text} onChange={(e) => setCue(c.id, { text: e.target.value.slice(0, 240) })} style={{ ...inputStyle, padding: '6px 8px', resize: 'vertical', flex: 1, fontSize: 12 }} />
                      <button type="button" data-testid="caption-cue-delete" aria-label={`Delete caption line ${i + 1}`} onClick={() => set({ cues: caps.cues.filter((x) => x.id !== c.id) })} style={{ ...secondaryButtonStyle, minHeight: 28, width: 30, padding: 0, display: 'grid', placeItems: 'center' }}><Trash2 size={12} aria-hidden /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                      {numField(`caption-start-${c.id}`, 'Starts (s)', c.start, (v) => setCue(c.id, { start: v, end: Math.max(c.end, v + 0.1) }))}
                      {numField(`caption-end-${c.id}`, 'Ends (s)', c.end, (v) => setCue(c.id, { end: Math.max(v, c.start + 0.1) }))}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {onSeek && (
                        <button type="button" data-testid="caption-cue-seek" aria-label={`Jump to caption line ${i + 1}`} onClick={() => onSeek(Math.round(c.start * Math.max(1, previewSettings.fps)))} style={{ ...secondaryButtonStyle, minHeight: 24, fontSize: 10, padding: '0 8px', display: 'inline-flex', gap: 4, alignItems: 'center' }}><Crosshair size={11} aria-hidden /> Jump</button>
                      )}
                      {([['start', 'minus', -0.1, 0], ['start', 'plus', 0.1, 0], ['end', 'minus', 0, -0.1], ['end', 'plus', 0, 0.1]] as const).map(([edge, dir, dS, dE]) => (
                        <button key={`${edge}-${dir}`} type="button" data-testid={`caption-nudge-${c.id}-${edge}-${dir}`} aria-label={`${edge === 'start' ? 'Start' : 'End'} ${dir === 'minus' ? 'earlier' : 'later'} by 0.1 seconds, line ${i + 1}`} onClick={() => nudge(c.id, dS, dE)} style={{ ...secondaryButtonStyle, minHeight: 24, fontSize: 10, padding: '0 6px' }}>{edge === 'start' ? 'Start' : 'End'} {dir === 'minus' ? '−' : '+'}0.1</button>
                      ))}
                    </div>
                  </div>
                ))}
                </div>
                <button type="button" data-testid="caption-cue-add" disabled={caps.cues.length >= MAX_CUES} onClick={() => { const last = caps.cues.at(-1); const start = Math.min(durationSec - 0.5, last ? last.end : 0); set({ cues: [...caps.cues, newCue(start, Math.min(durationSec, start + 2))] }) }} style={{ ...secondaryButtonStyle, minHeight: 28, fontSize: 11, alignSelf: 'flex-start', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Plus size={12} aria-hidden /> Add a line</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

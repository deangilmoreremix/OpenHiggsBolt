// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, vi, afterEach, beforeAll, beforeEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { CaptionsPanel } from '../CaptionsPanel'
import { applyCaptionsPatch } from '../../captions/captionStyle'

// The panel keeps its captions in the provider's preview settings; a tiny stand-in with the real merge/clean rules.
const ctx: { previewSettings: { captions?: unknown; audio: unknown }; updatePreviewCaptions: (p: unknown) => void } = vi.hoisted(() => ({ previewSettings: { audio: null }, updatePreviewCaptions: () => {} }))
vi.mock('../../DemoPersonalizeProvider', () => ({ useDemoPersonalize: () => ctx }))

beforeAll(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true })
const VIDEO = 'https://x/clip.mp4'
const SRT = '1\n00:00:01,000 --> 00:00:02,000\nCall us today\n\n2\n00:00:02,500 --> 00:00:04,000\nfor a free quote\n'
let root: ReturnType<typeof createRoot>
let rerender: () => void

beforeEach(() => {
  ctx.previewSettings = { audio: null }
  ctx.updatePreviewCaptions = vi.fn((patch: unknown) => {
    ctx.previewSettings = { ...ctx.previewSettings, captions: applyCaptionsPatch(ctx.previewSettings.captions as never, patch as never) }
    rerender()
  })
})
afterEach(() => { vi.clearAllMocks(); act(() => root?.unmount()); document.body.innerHTML = '' })

function mount(videoUrl: string | null = VIDEO) {
  const el = document.body.appendChild(document.createElement('div'))
  root = createRoot(el)
  let url = videoUrl
  rerender = () => act(() => { root.render(<CaptionsPanel videoUrl={url} />) })
  rerender()
  return { el, setUrl: (u: string | null) => { url = u; rerender() } }
}
const q = (el: HTMLElement, id: string) => el.querySelector(`[data-testid="${id}"]`)
const click = (el: Element | null) => act(async () => { (el as HTMLElement).click() })
const tick = () => act(async () => { await new Promise((r) => setTimeout(r, 20)) })
const stored = () => ctx.previewSettings.captions as { enabled: boolean; style: string; position: string; forUrl: string; cues: { text: string; startMs: number }[] } | undefined
const upload = async (el: HTMLElement, text: string, name = 'c.srt') => {
  const input = q(el, 'captions-file') as HTMLInputElement
  const file = new File([text], name)
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })) })
  await tick()
}

describe('CaptionsPanel (file import)', () => {
  it('renders nothing without a video', () => { expect(q(mount(null).el, 'captions-panel')).toBeNull() })
  it('shows the import and add-line buttons first, no result list', () => {
    const { el } = mount()
    expect(q(el, 'captions-import')).toBeTruthy()
    expect(q(el, 'captions-add-line')).toBeTruthy()
    expect(q(el, 'captions-result')).toBeNull()
  })
  it('loads an .srt file into captions for this video', async () => {
    const { el } = mount(); await upload(el, SRT)
    expect(stored()).toMatchObject({ enabled: true, forUrl: VIDEO, style: 'bold', position: 'bottom' })
    expect(stored()!.cues.map((c) => c.text)).toEqual(['Call us today', 'for a free quote'])
    expect(q(el, 'captions-note')?.textContent).toMatch(/Loaded 2 lines/)
    expect(q(el, 'captions-result')).toBeTruthy()
  })
  it('says so for a file with no captions and keeps what it had', async () => {
    const { el } = mount(); await upload(el, 'just some text', 'notes.txt')
    expect(stored()).toBeUndefined()
    expect(q(el, 'captions-note')?.textContent).toMatch(/No captions were found in notes\.txt/)
  })
  it('adds a typed line, then another after it', async () => {
    const { el } = mount()
    await click(q(el, 'captions-add-line')); await click(q(el, 'captions-add-line'))
    expect(stored()!.cues.map((c) => [c.startMs, c.text])).toEqual([[0, 'New line'], [2000, 'New line']])
  })
  it('edits a line, deletes it by clearing it, and removes everything', async () => {
    const { el } = mount(); await upload(el, SRT)
    const type = async (i: number, value: string) => {
      const input = q(el, `captions-edit-${i}`) as HTMLInputElement
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
        input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      })
    }
    await type(0, 'Call now')
    expect(stored()!.cues.map((c) => c.text)).toEqual(['Call now', 'for a free quote'])
    await type(1, '')
    expect(stored()!.cues.map((c) => c.text)).toEqual(['Call now'])
    await click(q(el, 'captions-remove'))
    expect(stored()).toBeUndefined()
    expect(q(el, 'captions-result')).toBeNull()
  })
  it('switches look (built-in and from the 27) and place', async () => {
    const { el } = mount(); await upload(el, SRT)
    await click(q(el, 'captions-style-clean')); expect(stored()!.style).toBe('clean')
    const select = q(el, 'captions-capite-select') as HTMLSelectElement
    expect(select.querySelectorAll('option[value]:not([value=""])')).toHaveLength(27)
    await act(async () => { select.value = 'hormozi'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(stored()!.style).toBe('hormozi')
    await click(q(el, 'captions-position-top')); expect(stored()!.position).toBe('top')
  })
  it('asks before replacing existing captions', async () => {
    const { el } = mount(); await upload(el, SRT)
    await click(q(el, 'captions-import'))
    expect(q(el, 'captions-redo-confirm')).toBeTruthy()
    await click(q(el, 'captions-redo-no'))
    expect(q(el, 'captions-redo-confirm')).toBeNull()
  })
  it('never shows captions written for a different video', async () => {
    const { el, setUrl } = mount(); await upload(el, SRT)
    expect(q(el, 'captions-result')).toBeTruthy()
    setUrl('https://x/other.mp4')
    expect(q(el, 'captions-result')).toBeNull()
  })
  it('SRT and VTT downloads are offered', async () => {
    const { el } = mount(); await upload(el, SRT)
    expect(q(el, 'captions-srt')).toBeTruthy(); expect(q(el, 'captions-vtt')).toBeTruthy(); expect(q(el, 'captions-copy')).toBeTruthy()
  })
  it('refuses a file longer than the limit instead of silently using only its start', async () => {
    const { el } = mount()
    await upload(el, SRT + '\n' + 'x'.repeat(400_100)) // one valid cue first, then more than the limit of plain text
    expect(stored()).toBeUndefined()
    expect(q(el, 'captions-note')?.textContent).toMatch(/too big/)
  })
})

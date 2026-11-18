// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { CaptionSettings } from '../../preview/captions'
import { createDefaultPreviewSettings } from '../../preview/presets'

const state: { settings: Record<string, unknown> } = { settings: {} }
const updatePreviewComposition = vi.fn()
vi.mock('../../DemoPersonalizeProvider', () => ({ useDemoPersonalize: () => ({ previewSettings: state.settings, updatePreviewComposition }) }))
vi.mock('../editor/ColorField', () => ({ ColorField: ({ id, value, onChange }: { id: string; value: string; onChange: (hex: string) => void }) => <input data-testid={id} value={value} onChange={(e) => onChange(e.target.value)} /> }))
vi.mock('../../captions/capiteFontLoader', () => ({ loadCaptionFont: vi.fn(async () => ({ loaded: true })) }))

import { CaptionsPanel } from '../CaptionsPanel'

afterEach(() => { cleanup(); vi.clearAllMocks() })
const brandColors = { primary: '#112233', accent: '#ddeeff', text: '#ffffff', backgroundDim: 0.18 }
const caps = (style: Record<string, unknown> = {}): CaptionSettings => ({
  enabled: true,
  cues: [{ id: 'c1', start: 0, end: 2, text: 'hello world' }],
  style: { preset: 'karaoke', position: 'bottom', size: 0.06, highlight: 'word', color: '#ffffff', highlightColor: '#facc15', box: false, boxColor: '#000000', boxOpacity: 0.5, uppercase: true, bold: true, ...style },
})
function open(captions: CaptionSettings) {
  state.settings = { durationInFrames: 150, fps: 30, brandColors, captions }
  render(<CaptionsPanel inputProps={{ posterUrl: null } as never} />)
  fireEvent.click(screen.getByTestId('captions-toggle-panel'))
}
const last = () => updatePreviewComposition.mock.calls.at(-1)![0].captions as CaptionSettings

describe('captions customizer', () => {
  it('offers Capite\'s 16 fonts, grouped, and a way back to the look\'s own', () => {
    open(caps())
    const select = screen.getByTestId('captions-font') as HTMLSelectElement
    expect(select.querySelectorAll('option[value]:not([value=""])')).toHaveLength(16)
    expect(select.querySelectorAll('optgroup').length).toBeGreaterThanOrEqual(3)
    fireEvent.change(select, { target: { value: 'Bebas Neue' } })
    expect(last().style).toMatchObject({ fontFamily: 'Bebas Neue', preset: 'custom' })
    fireEvent.change(select, { target: { value: '' } })
    expect(last().style.fontFamily).toBeUndefined()
  })
  it('sets the weight, italic and casing', () => {
    open(caps())
    fireEvent.click(screen.getByTestId('captions-weight-light'))
    expect(last().style.weight).toBe('light')
    fireEvent.click(screen.getByTestId('captions-weight-default'))
    expect(last().style.weight).toBeUndefined()
    fireEvent.click(screen.getByTestId('captions-italic'))
    expect(last().style.italic).toBe(true)
    fireEvent.click(screen.getByTestId('captions-casing-title'))
    expect(last().style.casing).toBe('title')
    fireEvent.click(screen.getByTestId('captions-casing-default'))
    expect(last().style.casing).toBeUndefined()
  })
  it('sets the outline colour (making an outline when the look has none) and the background colour (turning the box on)', () => {
    open(caps())
    fireEvent.change(screen.getByTestId('captions-outline-color'), { target: { value: '#ff0000' } })
    expect(last().style.outline).toMatchObject({ color: '#ff0000' })
    expect(last().style.outline!.size).toBeGreaterThan(0)
    fireEvent.change(screen.getByTestId('captions-bg-color'), { target: { value: '#00ff00' } })
    expect(last().style).toMatchObject({ box: true, boxColor: '#00ff00' })
  })
  it('keeps an existing outline\'s size when only its colour changes', () => {
    open(caps({ outline: { size: 0.11, color: '#000000' } }))
    fireEvent.change(screen.getByTestId('captions-outline-color'), { target: { value: '#123456' } })
    expect(last().style.outline).toEqual({ size: 0.11, color: '#123456' })
  })
  it('moves the caption with a vertical offset slider and puts it back with Reset', () => {
    open(caps({ offsetY: 0.1 }))
    const slider = screen.getByTestId('captions-offset') as HTMLInputElement
    expect(slider.value).toBe('0.1')
    fireEvent.change(slider, { target: { value: '-0.2' } })
    expect(last().style.offsetY).toBe(-0.2)
    fireEvent.click(screen.getByTestId('captions-offset-reset'))
    expect(last().style.offsetY).toBeUndefined()
  })
  it('a position chip puts the caption back in its place', () => {
    open(caps({ offsetY: 0.2 }))
    fireEvent.click(screen.getByTestId('captions-pos-top'))
    expect(last().style).toMatchObject({ position: 'top' })
    expect(last().style.offsetY).toBeUndefined()
  })
})

describe('captions customizer: keeping clear of other text', () => {
  const nameLayer = (y: number) => ({ ...createDefaultPreviewSettings().layers.find((l) => l.kind === 'businessName')!, visible: true, opacity: 1, startFrame: 0, endFrame: undefined, x: 0.05, y })
  const brand = { businessName: 'Rascop And Associates LLC', headline: 'Call us today', offer: '10% off', cta: 'Book now' }
  function openWith(layerY: number, style: Record<string, unknown> = {}) {
    const captions = caps({ size: 0.08, ...style })
    state.settings = { durationInFrames: 150, fps: 30, width: 1920, height: 1080, brandColors, layers: [nameLayer(layerY)], captions }
    render(<CaptionsPanel inputProps={{ posterUrl: null, brand } as never} />)
    fireEvent.click(screen.getByTestId('captions-toggle-panel'))
  }
  it('warns when the captions cover another layer, and is quiet when they do not', () => {
    openWith(0.84)
    expect(screen.getByTestId('captions-overlap-warning').textContent).toMatch(/cover/i)
    cleanup()
    openWith(0.1)
    expect(screen.queryByTestId('captions-overlap-warning')).toBeNull()
  })
  it('moves the captions clear with one click', () => {
    openWith(0.84)
    fireEvent.click(screen.getByTestId('captions-clear-now'))
    const moved = last().style.offsetY
    expect(moved).toBeDefined()
    expect(Math.abs(moved!)).toBeGreaterThan(0.01)
    expect(last().style.preset).toBe('karaoke') // moving does not change the look
  })
  it('has a "keep clear of text" setting that is on until it is switched off', () => {
    openWith(0.1)
    const toggle = screen.getByTestId('captions-keep-clear')
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(toggle)
    expect(last().style.keepClear).toBe(false)
    cleanup(); vi.clearAllMocks()
    openWith(0.1, { keepClear: false })
    expect(screen.getByTestId('captions-keep-clear').getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(screen.getByTestId('captions-keep-clear'))
    expect(last().style.keepClear).toBeUndefined()
  })
  it('suggests switching it on when it is off and the captions cover something', () => {
    openWith(0.84, { keepClear: false })
    expect(screen.getByTestId('captions-overlap-warning').textContent).toMatch(/keep clear/i)
  })
})

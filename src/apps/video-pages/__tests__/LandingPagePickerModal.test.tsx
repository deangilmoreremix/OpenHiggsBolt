// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'

vi.hoisted(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true })
const createPage = vi.hoisted(() => vi.fn())
vi.mock('@puckeditor/core', () => ({ Puck: (p: any) => <div data-testid="puck" onClick={() => p.onChange?.(p.data)} /> }))
vi.mock('@puckeditor/core/no-external.css', () => ({}))
vi.mock('@/src/lib/landingPages/puck/designCss.js', () => ({}))
vi.mock('@/src/styles/landing-pages/studio-puck-theme.css', () => ({}))
vi.mock('@/src/lib/landingPages/puck/config.jsx', () => ({ puckConfig: {} }))
vi.mock('@/src/lib/landingPages/api.js', () => ({ createPage, updatePage: vi.fn() }))
import Modal from '../LandingPagePickerModal'
import { TEMPLATES } from '@/src/lib/landingPages/templates.js'

const video = { url: 'https://cdn.test/a.mp4', posterUrl: null, title: 'Hello', source: { studio: 'video', kind: 'video' } }
const flush = () => act(async () => { await Promise.resolve() })
const mount = (el: React.ReactElement) => { const h = document.createElement('div'); document.body.appendChild(h); act(() => { createRoot(h).render(el) }) }
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const click = (el: Element | null) => act(() => { (el as HTMLElement).click() })

describe('LandingPagePickerModal', () => {
  beforeEach(() => { document.body.innerHTML = ''; createPage.mockReset() })

  it('shows every design as a button and filters by search', () => {
    mount(<Modal video={video} onClose={() => {}} />)
    const cards = () => Array.from(document.body.querySelectorAll('div.grid button'))
    expect(cards().length).toBe(TEMPLATES.length)
    const input = q('input[aria-label="Search designs"]') as HTMLInputElement
    act(() => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!; set.call(input, 'Spa'); input.dispatchEvent(new Event('input', { bubbles: true })) })
    expect(cards().length).toBeGreaterThan(0)
    expect(cards().length).toBeLessThan(TEMPLATES.length)
  })

  it('opens the editor for a design, saves with the video attached and returns the page link', async () => {
    createPage.mockResolvedValue({ id: 'abcd1234', published: false, config: {} })
    const onPick = vi.fn()
    mount(<Modal video={video} onClose={() => {}} onPick={onPick} />)
    click(Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes((TEMPLATES[1] as any).name)) || null)
    expect(q('[data-testid=puck]')).not.toBeNull()
    click(Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent === 'Save as my page') || null)
    await flush()
    const arg = createPage.mock.calls[0][0]
    expect(arg.videoUrl).toBe(video.url)
    expect(arg.config.template).toBe((TEMPLATES[1] as any).id)
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'abcd1234', published: false }))
    expect(document.body.textContent).toContain('Saved to Video Pages')
  })

  it('refuses to save without a usable video', () => {
    mount(<Modal video={null} onClose={() => {}} />)
    expect(document.body.textContent).toContain("can't be used on a page")
  })

  it('Escape closes the dialog and Esc in the editor goes back first', () => {
    const onClose = vi.fn()
    mount(<Modal video={video} onClose={onClose} />)
    click(Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes((TEMPLATES[0] as any).name)) || null)
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
    expect(onClose).not.toHaveBeenCalled()
    expect(q('[data-testid=puck]')).toBeNull()
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
    expect(onClose).toHaveBeenCalled()
  })
})

describe('category chips', () => {
  it('every design is reachable from at least one category chip', () => {
    document.body.innerHTML = ''
    mount(<Modal video={video} onClose={() => {}} />)
    const seen = new Set<string>()
    const chips = Array.from(document.body.querySelectorAll('button[aria-pressed]')).filter((b) => b.textContent !== 'All')
    expect(chips.length).toBeGreaterThan(1)
    chips.forEach((c) => { click(c); document.body.querySelectorAll('div.grid button').forEach((b) => seen.add(b.textContent || '')) })
    expect(seen.size).toBe(TEMPLATES.length)
  })
})

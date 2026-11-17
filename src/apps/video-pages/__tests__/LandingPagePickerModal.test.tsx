// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'

vi.hoisted(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true })
const createPage = vi.hoisted(() => vi.fn())
const addContacts = vi.hoisted(() => vi.fn())
const customersState = vi.hoisted(() => ({ value: { customers: [] as any[], activeId: '', loading: false } }))
const puckProps = vi.hoisted(() => ({ last: null as any }))
vi.mock('@puckeditor/core', () => ({ Render: () => null, Puck: (p: any) => { puckProps.last = p; return <div data-testid="puck" onClick={() => p.onChange?.(p.data)} /> } }))
vi.mock('../useCustomers', () => ({ useCustomers: () => customersState.value }))
vi.mock('@puckeditor/core/no-external.css', () => ({}))
vi.mock('@/src/lib/landingPages/puck/designCss.js', () => ({}))
vi.mock('@/src/styles/landing-pages/studio-puck-theme.css', () => ({}))
vi.mock('@/src/lib/landingPages/puck/config.jsx', () => ({ puckConfig: {} }))
vi.mock('@/src/lib/landingPages/api.js', () => ({ createPage, updatePage: vi.fn(), addContacts }))
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


describe('personalizing for a customer', () => {
  const C1 = { id: 'c1', label: 'Riverside Plumbing', source: 'client', tokens: { firstname: 'Dana', lastname: 'Whitfield', company: 'Riverside Plumbing', city: 'Austin', companylogo: 'https://cdn.test/logo.png', role: '' }, email: 'dana@rp.test', business: { name: 'Riverside Plumbing' }, brand: { accent: '#ff8a1f', logoUrl: 'https://cdn.test/logo.png' } }
  const C2 = { id: 'c2', label: 'Acme Roofing', source: 'client', tokens: { firstname: 'Sam', lastname: 'Lee', company: 'Acme Roofing', city: 'Denver', companylogo: '', role: '' }, email: '', business: { name: 'Acme Roofing' }, brand: { accent: '', logoUrl: '' } }
  beforeEach(() => {
    document.body.innerHTML = ''; createPage.mockReset(); addContacts.mockReset(); puckProps.last = null
    customersState.value = { customers: [C1, C2], activeId: 'c1', loading: false }
    createPage.mockResolvedValue({ id: 'pg12345678', published: false, config: {} })
    addContacts.mockImplementation(async (_id: string, rows: any[]) => rows.map((r, i) => ({ id: `ct${i}abcdef`, fields: r.fields })))
  })
  const design = () => document.body.querySelector('div.grid button') as HTMLElement
  const saveBtn = () => Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent === 'Save as my page') as HTMLElement

  it('lists the customers with the active one selected', () => {
    mount(<Modal video={video} onClose={() => {}} />)
    const boxes = Array.from(document.body.querySelectorAll('[data-customer-id]')) as HTMLInputElement[]
    expect(boxes.map((b) => b.dataset.customerId)).toEqual(['c1', 'c2'])
    expect(boxes[0].checked).toBe(true); expect(boxes[1].checked).toBe(false)
    expect((document.body.querySelector('[data-customer-brand]') as HTMLInputElement).checked).toBe(true)
  })

  it('one customer: brand written into the page, preview tokens are theirs, a personal link is made', async () => {
    mount(<Modal video={video} onClose={() => {}} />)
    click(design()); await flush()
    expect(puckProps.last.data.root.props.accent).toBe('#ff8a1f')
    expect(document.body.querySelector('[data-personalized-note]')?.textContent).toContain('Personalized for Riverside Plumbing')
    click(saveBtn()); await flush(); await flush()
    expect(addContacts).toHaveBeenCalledTimes(1)
    expect(addContacts.mock.calls[0][0]).toBe('pg12345678')
    expect(addContacts.mock.calls[0][1]).toEqual([{ fields: expect.objectContaining({ firstname: 'Dana', company: 'Riverside Plumbing', email: 'dana@rp.test' }) }])
    expect(createPage.mock.calls[0][0].config.theme.accent).toBe('#ff8a1f')
    expect(document.body.querySelector('[data-personal-links]')?.textContent).toContain('/p/pg12345678?c=ct0abcdef')
  })

  it('several customers: one generic page and one personal link each', async () => {
    mount(<Modal video={video} onClose={() => {}} />)
    click(document.body.querySelector('[data-customer-id="c2"]')); await flush()
    expect((document.body.querySelector('[data-customer-brand]') as HTMLInputElement).disabled).toBe(true)
    click(design()); await flush()
    expect(puckProps.last.data.root.props.accent).not.toBe('#ff8a1f')
    click(saveBtn()); await flush(); await flush()
    expect(addContacts.mock.calls[0][1].length).toBe(2)
    expect(document.body.querySelector('[data-personal-links]')?.textContent).toContain('2 personal links')
  })

  it('nobody selected: plain design, no contacts', async () => {
    mount(<Modal video={video} onClose={() => {}} />)
    click(document.body.querySelector('[data-customer-none]')); await flush()
    click(design()); await flush()
    expect(document.body.querySelector('[data-personalized-note]')).toBeNull()
    click(saveBtn()); await flush(); await flush()
    expect(addContacts).not.toHaveBeenCalled()
  })

  it('keeps the page and says so when the personal links fail', async () => {
    addContacts.mockRejectedValue(new Error('no'))
    mount(<Modal video={video} onClose={() => {}} />)
    click(design()); await flush(); click(saveBtn()); await flush(); await flush()
    expect(document.body.textContent).toContain('The page is saved, but the personal links were not made')
    expect(document.body.textContent).toContain('Saved to Video Pages')
  })

  it('says so when there is no customer yet', () => {
    customersState.value = { customers: [], activeId: '', loading: false }
    mount(<Modal video={video} onClose={() => {}} />)
    expect(document.body.querySelector('[data-customer-panel]')?.textContent).toContain('No customer found yet')
  })
})

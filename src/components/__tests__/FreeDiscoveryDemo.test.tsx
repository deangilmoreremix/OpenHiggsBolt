/**
 * @vitest-environment jsdom
 *
 * FreeDiscoveryDemo is now a THIN entry point: it must not contain a second
 * Personalization implementation. These tests pin the entry-point contract:
 *   · it opens the SAME shared PersonalizationModal (the provider mounts it)
 *   · it opens it in anonymous (free discovery) mode
 *   · it owns no discovery/research/asset UI of its own
 *
 * The workflow, review area, sections and drag-and-drop are covered by
 * src/shared/personalization/__tests__/sharedDiscovery.test.tsx.
 */

import { describe, expect, it, afterEach, vi } from 'vitest'
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => '/demo',
  useSearchParams: () => new URLSearchParams(),
}))

import { DemoPersonalizeProvider } from '@/shared/personalization/DemoPersonalizeProvider'
import FreeDiscoveryDemo from '../FreeDiscoveryDemo'

const mounted: Root[] = []

/** Mirrors the composition in app/demo/page.tsx (the provider mounts the modal). */
function render() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => {
    root.render(
      createElement(
        DemoPersonalizeProvider,
        { access: 'anonymous' } as any,
        createElement(FreeDiscoveryDemo),
      ),
    )
  })
  return host
}

function sharedModal() {
  return document.querySelector('[role="dialog"][aria-labelledby="personalize-title"]')
}

afterEach(() => {
  while (mounted.length) {
    const root = mounted.pop()
    act(() => root?.unmount())
  }
})

describe('FreeDiscoveryDemo (thin entry point)', () => {
  it('opens the shared Personalization modal in anonymous mode on mount', () => {
    render()

    const dialog = sharedModal()
    expect(dialog, 'the shared PersonalizationModal should be open').toBeTruthy()

    // The shared modal's own "Find My Brand" primary action is rendered.
    const block = dialog?.querySelector('[data-testid="find-my-brand"]')
    expect(block?.textContent).toContain('Find My Brand')
    expect(block?.querySelector('#find-my-brand-url')).toBeTruthy()
  })

  it('re-opens the shared modal from its single CTA', () => {
    const host = render()
    const cta = host.querySelector('[data-testid="free-discovery-open"]') as HTMLElement | null
    expect(cta).toBeTruthy()

    // Close through the shared modal's own close control, then re-open.
    const close = document.querySelector('[aria-label="Close personalization modal"]') as HTMLElement | null
    expect(close).toBeTruthy()
    act(() => { close?.click() })
    expect(sharedModal()).toBeNull()

    act(() => { cta?.click() })
    expect(sharedModal()).toBeTruthy()
  })

  it('owns no business-search form of its own', () => {
    const host = render()
    // The standalone journey's own search inputs are gone — they now live inside
    // the shared modal behind "Or find a local business by niche & location".
    const hero = host.querySelector('main')
    expect(hero).toBeTruthy()
    expect(hero?.querySelector('input')).toBeNull()
    expect(hero?.querySelector('select')).toBeNull()
    expect(hero?.textContent).not.toContain('Business Type / Niche')
    expect(hero?.querySelector('select')).toBeNull()
  })

  it('opens the shared modal in anonymous mode: no paid affordances are offered', () => {
    const host = render()
    const cta = host.querySelector('[data-testid="free-discovery-open"]') as HTMLElement
    act(() => { cta?.click() })

    const dialog = sharedModal()
    expect(dialog).toBeTruthy()
    const text = dialog?.textContent || ''
    // Free visitors must not reach paid AI or saved-profile controls.
    expect(text).not.toContain('Analyze with GO Vision')
    expect(text).not.toContain('Make Selected Video Ready')
    expect(text).not.toContain('Use Selected Assets')
    expect(text).not.toContain('Personalize Prompt')
    expect(text).not.toContain('Save Client')
    expect(text).not.toContain('Select Existing Client')
    expect(dialog?.querySelector('footer')).toBeNull()
    // The free discovery surface is what they get instead.
    expect(dialog?.querySelector('#pz-find-my-brand')).toBeTruthy()
  })

  it('explains the free terms on the landing surface', () => {
    const host = render()
    const hero = host.querySelector('main')
    expect(hero?.textContent).toContain('Nothing is generated, nothing is charged')
    expect(hero?.textContent).toContain('Find My Brand')
  })
})

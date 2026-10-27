// @vitest-environment jsdom
/**
 * Render tests for the human-visible preview surface:
 *   - PreviewModeBadge  (hidden when paid / signed-out; visible + opens modal)
 *   - UpgradeModal      (exact copy, CTA link to the checkout URL, restore
 *                        POST + inline error, close button closes)
 *
 * Both components read `useSmartVideoAccess()`, which pulls from
 * `SmartVideoAccessContext` (exported by SmartVideoAccessProvider.tsx). We wrap
 * them in that real context with a hand-built value, so no provider network I/O
 * runs and every assertion is deterministic.
 *
 * Convention note: this repo's vitest component tests do NOT load
 * @testing-library/jest-dom; they assert with `.toBeTruthy()` on `getBy*`
 * results (which throw when absent) and `.toBeNull()` on `queryBy*`. This file
 * follows that convention.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import type { ReactNode } from 'react'
import PreviewModeBadge from '../PreviewModeBadge'
import UpgradeModal from '../UpgradeModal'
import { ENTITLEMENTS, SmartVideoAccessContext } from '../SmartVideoAccessProvider'
import type { AccessState } from '../entitlements'

// The context value type is not exported by name, so derive it from the
// (exported) context object itself.
type Ctx = NonNullable<import('react').ContextType<typeof SmartVideoAccessContext>>

// Current modal contract (UpgradeModal.tsx): the title is `Unlock {studioName}`
// and the primary CTA is a link to the checkout URL (env) or /#pricing — the
// modal itself no longer POSTs to /api/stripe/checkout.
const MODAL_TITLE = 'Unlock SmartVideo GO'
const MODAL_BODY_LINE1 = "You're exploring SmartVideo GO."
const MODAL_BODY_LINE2 =
  'Upgrade to create with this Studio and unlock SmartVideo GO creation tools.'

const PAID_ACCESS: AccessState = {
  clerkUserId: 'user_paid',
  email: 'paid@example.com',
  entitlements: { smartvideo_go: true },
  status: 'active',
  source: 'stripe',
  hasSmartVideoGo: true,
}

const UNPAID_ACCESS: AccessState = {
  clerkUserId: 'user_unpaid',
  email: 'unpaid@example.com',
  entitlements: { smartvideo_go: false },
  status: 'inactive',
  source: 'manual',
  hasSmartVideoGo: false,
}

function makeContext(overrides: Partial<Ctx>): Ctx {
  const base: any = {
    accessResult: { state: 'authenticated_unpaid', access: UNPAID_ACCESS },
    accessState: UNPAID_ACCESS,
    isLoading: false,
    isPaid: false,
    isAuthenticatedUnpaid: true,
    isSignedOut: false,
    isSignedIn: true,
    requireEntitlement: async (_entitlement: string, onAllowed: () => unknown) => onAllowed(),
    openUpgradeModal: vi.fn(),
    restoreAccess: vi.fn(async (_email: string) => ({ status: 'ok' } as any)),
    upgradeModal: { isOpen: false, source: 'default' },
    setUpgradeModal: vi.fn(),
  }
  return { ...base, ...overrides } as unknown as Ctx
}

function renderWith(ctx: Ctx, ui: ReactNode) {
  return render(<SmartVideoAccessContext.Provider value={ctx}>{ui}</SmartVideoAccessContext.Provider>)
}

let locationHrefSetter: { current: string }

beforeEach(() => {
  // UpgradeModal assigns `window.location.href` on a successful checkout
  // redirect. jsdom's real navigation is not implemented, so replace location
  // with a recording object per test.
  locationHrefSetter = { current: '' }
  const stub = {
    get href() {
      return locationHrefSetter.current
    },
    set href(value: string) {
      locationHrefSetter.current = value
    },
    assign: vi.fn(),
    reload: vi.fn(),
  }
  try {
    Object.defineProperty(window, 'location', { writable: true, configurable: true, value: stub })
  } catch {
    ;(window as any).location = stub
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// PreviewModeBadge
// ---------------------------------------------------------------------------

describe('PreviewModeBadge', () => {
  it('renders nothing when the user is paid', () => {
    const ctx = makeContext({ isPaid: true, isAuthenticatedUnpaid: false, accessState: PAID_ACCESS })
    renderWith(ctx, <PreviewModeBadge />)
    expect(screen.queryByText('Preview Mode')).toBeNull()
  })

  it('renders nothing when the user is signed out', () => {
    const ctx = makeContext({ isPaid: false, isSignedIn: false, isSignedOut: true })
    renderWith(ctx, <PreviewModeBadge />)
    expect(screen.queryByText('Preview Mode')).toBeNull()
  })

  it('renders the "Preview Mode" pill for an authenticated-unpaid user', () => {
    renderWith(makeContext({}), <PreviewModeBadge />)
    expect(screen.getByText('Preview Mode')).toBeTruthy()
  })

  it("opens the upgrade modal with source 'preview-badge' on click", () => {
    const openUpgradeModal = vi.fn()
    renderWith(makeContext({ openUpgradeModal }), <PreviewModeBadge />)
    fireEvent.click(screen.getByText('Preview Mode'))
    expect(openUpgradeModal).toHaveBeenCalledWith('preview-badge')
  })
})

// ---------------------------------------------------------------------------
// UpgradeModal
// ---------------------------------------------------------------------------

function openModalContext(overrides: Partial<Ctx> = {}): Ctx {
  return makeContext({ upgradeModal: { isOpen: true, source: 'default' }, ...overrides })
}

describe('UpgradeModal — copy and button order', () => {
  it('shows the exact title and body copy with the CTA link and the restore form', () => {
    const { container } = renderWith(openModalContext(), <UpgradeModal />)

    const heading = container.querySelector('h2')
    expect(heading?.textContent).toBe(MODAL_TITLE)
    const body = container.querySelector('p')
    expect(body?.textContent).toContain(MODAL_BODY_LINE1)
    expect(body?.textContent).toContain(MODAL_BODY_LINE2)

    // Primary CTA is the checkout/pricing LINK; the restore affordance follows.
    const cta = container.querySelector('a')
    expect(cta?.textContent).toContain('Unlock SmartVideo GO')
    expect(screen.getByText('Already purchased? Restore your access.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Restore Access' })).toBeTruthy()
  })

  it('hides the restore affordance when signed out but keeps the CTA and close button', () => {
    const { container } = renderWith(openModalContext({ isSignedIn: false }), <UpgradeModal />)
    expect(screen.queryByText('Already purchased? Restore your access.')).toBeNull()
    expect(container.querySelector('a')?.textContent).toContain('Unlock SmartVideo GO')
    // The X close button is still rendered.
    expect(container.querySelector('button')).toBeTruthy()
  })
})

describe('UpgradeModal — checkout destination', () => {
  it('links the CTA to the configured checkout URL without posting from the modal', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const prev = process.env.NEXT_PUBLIC_SMARTVIDEO_GO_CHECKOUT_URL
    process.env.NEXT_PUBLIC_SMARTVIDEO_GO_CHECKOUT_URL = 'https://checkout.stripe.test/session'
    try {
      const { container } = renderWith(openModalContext(), <UpgradeModal />)
      const cta = container.querySelector('a')
      expect(cta?.getAttribute('href')).toBe('https://checkout.stripe.test/session')
      expect(cta?.textContent).toContain('Unlock SmartVideo GO')
      // The modal itself must NOT fire a checkout request; the CTA navigates.
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_SMARTVIDEO_GO_CHECKOUT_URL
      else process.env.NEXT_PUBLIC_SMARTVIDEO_GO_CHECKOUT_URL = prev
    }
  })

  it('falls back to /#pricing when no checkout URL is configured and shows an inline restore error on failure', async () => {
    const { container } = renderWith(openModalContext(), <UpgradeModal />)
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/#pricing')

    // The modal's inline-error surface is the restore path.
    const fetchMock = vi.fn(async () => ({ ok: false, json: async () => ({ error: 'Restore unavailable' }) }))
    vi.stubGlobal('fetch', fetchMock)
    const input = screen.getByPlaceholderText('Enter your purchase email')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'buyer@example.com' } })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Restore Access' }))
    })
    expect(screen.getByText('Restore unavailable')).toBeTruthy()
  })
})

describe('UpgradeModal — restore', () => {
  it('posts to /api/access/restore and renders the status message', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      // A non-activated status so the component does NOT schedule the
      // window.location.reload() auto-close path — keeps the test deterministic.
      json: async () => ({ status: 'not_found', message: 'No qualifying purchase found for this email.' }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    renderWith(openModalContext(), <UpgradeModal />)

    const input = screen.getByPlaceholderText('Enter your purchase email')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'buyer@example.com' } })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Restore Access' }))
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/access/restore')
    expect(JSON.parse(String(init.body))).toEqual({ email: 'buyer@example.com' })
    expect(screen.getByText('No qualifying purchase found for this email.')).toBeTruthy()
  })
})

describe('UpgradeModal — closing the modal', () => {
  it('closes the modal from the close button (setUpgradeModal called with isOpen:false)', () => {
    const setUpgradeModal = vi.fn()
    const { container } = renderWith(openModalContext({ setUpgradeModal }), <UpgradeModal />)
    // The first button is the X close control.
    fireEvent.click(container.querySelector('button') as HTMLElement)
    expect(setUpgradeModal).toHaveBeenCalledWith(expect.objectContaining({ isOpen: false }))
  })
})

describe('UpgradeModal — closed state and entitlement surface', () => {
  it('renders nothing when the modal is not open', () => {
    const ctx = makeContext({ upgradeModal: { isOpen: false, source: 'default' } })
    renderWith(ctx, <UpgradeModal />)
    expect(screen.queryByText(MODAL_TITLE)).toBeNull()
  })

  it('exposes the SMARTVIDEO_GO entitlement key', () => {
    expect(ENTITLEMENTS.SMARTVIDEO_GO).toBe('smartvideo_go')
  })
})

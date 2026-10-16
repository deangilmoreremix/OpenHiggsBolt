// @vitest-environment jsdom
/**
 * Render tests for the human-visible preview surface:
 *   - PreviewModeBadge  (hidden when paid / signed-out; visible + opens modal)
 *   - UpgradeModal      (exact copy, three buttons in DOM order, checkout POST,
 *                        restore POST, Continue Exploring closes)
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

const MODAL_TITLE = 'Unlock SmartVideo GO AI'
// Exact body copy as rendered (the JSX uses &apos; for the apostrophe). Kept as
// a double-quoted literal so the straight apostrophe stays intact.
const MODAL_BODY =
  "You've explored the possibilities. Activate your access to generate videos, personalize your content, and use the AI creation tools."

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
  it('shows the exact title and body copy and the three buttons in DOM order', () => {
    renderWith(openModalContext(), <UpgradeModal />)

    expect(screen.getByText(MODAL_TITLE)).toBeTruthy()
    expect(screen.getByText(MODAL_BODY)).toBeTruthy()

    // All three action buttons, asserted in document order.
    const buttons = Array.from(document.querySelectorAll('button')).map(
      (b) => (b.textContent || '').trim(),
    )
    const idxPrimary = buttons.findIndex((t) => t === 'Get SmartVideo GO AI')
    const idxRestore = buttons.findIndex((t) => t === 'Already Purchased? Restore Access')
    const idxContinue = buttons.findIndex((t) => t === 'Continue Exploring')
    expect(idxPrimary).toBeGreaterThanOrEqual(0)
    expect(idxRestore).toBeGreaterThanOrEqual(0)
    expect(idxContinue).toBeGreaterThanOrEqual(0)
    expect(idxPrimary).toBeLessThan(idxRestore)
    expect(idxRestore).toBeLessThan(idxContinue)
  })

  it('hides the restore affordance when signed out but keeps primary + continue', () => {
    renderWith(openModalContext({ isSignedIn: false }), <UpgradeModal />)
    expect(screen.queryByText('Already Purchased? Restore Access')).toBeNull()
    expect(screen.getByText('Get SmartVideo GO AI')).toBeTruthy()
    expect(screen.getByText('Continue Exploring')).toBeTruthy()
  })
})

describe('UpgradeModal — checkout', () => {
  it("POSTs { plan: 'pro_lifetime' } to /api/stripe/checkout and redirects to the returned url", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.test/session' }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    renderWith(openModalContext(), <UpgradeModal />)
    await act(async () => {
      fireEvent.click(screen.getByText('Get SmartVideo GO AI'))
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/stripe/checkout')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ plan: 'pro_lifetime' })
    expect(locationHrefSetter.current).toBe('https://checkout.stripe.test/session')
  })

  it('shows an inline error when checkout fails', async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, json: async () => ({ error: 'Checkout unavailable' }) }))
    vi.stubGlobal('fetch', fetchMock)

    renderWith(openModalContext(), <UpgradeModal />)
    await act(async () => {
      fireEvent.click(screen.getByText('Get SmartVideo GO AI'))
    })
    expect(screen.getByRole('alert').textContent).toContain('Checkout unavailable')
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

    await act(async () => {
      fireEvent.click(screen.getByText('Already Purchased? Restore Access'))
    })
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

describe('UpgradeModal — Continue Exploring', () => {
  it('closes the modal (setUpgradeModal called with isOpen:false)', () => {
    const setUpgradeModal = vi.fn()
    renderWith(openModalContext({ setUpgradeModal }), <UpgradeModal />)
    fireEvent.click(screen.getByText('Continue Exploring'))
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

// @vitest-environment jsdom
/**
 * Only two apps are paid: GO-Viral studio and the reseller apps. Every other
 * app is open to any signed-in user, so there is no preview mode for them.
 *
 *   - hasSmartVideoGo: true for everyone
 *   - hasSmartVideoViral: go_viral_ai (how purchases are recorded),
 *     smartvideo_viral or founders, with a qualifying status
 *   - GoViralGate: shows the studio to buyers / the super user, a lock screen
 *     to everyone else
 *   - UpgradeModal: GO-Viral wording and checkout link for the GO-Viral source
 *   - SmartVideoAccessProvider: a failed access check falls back to base
 *     access (no preview mode) with GO-Viral locked
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import GoViralGate from '../GoViralGate'
import UpgradeModal from '../UpgradeModal'
import { SmartVideoAccessContext, isGoViralEntitlement } from '../SmartVideoAccessProvider'
import { ENTITLEMENTS, hasSmartVideoGo, hasSmartVideoViral } from '../entitlements'

type Ctx = NonNullable<import('react').ContextType<typeof SmartVideoAccessContext>>

function makeContext(overrides: Partial<Ctx>): Ctx {
  const base: any = {
    accessResult: { state: 'paid', access: null },
    accessState: null,
    isLoading: false,
    isPaid: true,
    isAuthenticatedUnpaid: false,
    isSignedOut: false,
    isSignedIn: true,
    hasSmartVideoViral: false,
    isSuperUser: false,
    requireEntitlement: async (_e: string, onAllowed: () => unknown) => onAllowed(),
    openUpgradeModal: vi.fn(),
    restoreAccess: vi.fn(),
    upgradeModal: { isOpen: false, source: 'default' },
    setUpgradeModal: vi.fn(),
  }
  return { ...base, ...overrides } as unknown as Ctx
}

function renderWith(ctx: Ctx, ui: ReactNode) {
  return render(<SmartVideoAccessContext.Provider value={ctx}>{ui}</SmartVideoAccessContext.Provider>)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('access rules', () => {
  it('base access is open to every signed-in user whatever the row says', () => {
    expect(hasSmartVideoGo({ smartvideo_go: false }, 'inactive')).toBe(true)
    expect(hasSmartVideoGo({ smartvideo_go: false }, 'revoked')).toBe(true)
    expect(hasSmartVideoGo({} as any, undefined)).toBe(true)
  })

  it('GO-Viral is granted by go_viral_ai, smartvideo_viral or founders with a qualifying status', () => {
    expect(hasSmartVideoViral({ smartvideo_go: true, go_viral_ai: true }, 'active')).toBe(true)
    expect(hasSmartVideoViral({ smartvideo_go: true, smartvideo_viral: true }, 'active')).toBe(true)
    expect(hasSmartVideoViral({ smartvideo_go: true, founders: true }, 'lifetime')).toBe(true)
    expect(hasSmartVideoViral({ smartvideo_go: true, go_viral_ai: true }, undefined)).toBe(true)
    expect(hasSmartVideoViral({ smartvideo_go: true }, 'active')).toBe(false)
    expect(hasSmartVideoViral({ smartvideo_go: true, go_viral_ai: true }, 'revoked')).toBe(false)
    expect(hasSmartVideoViral({ smartvideo_go: true, go_viral_ai: true }, 'inactive')).toBe(false)
  })

  it('recognises the GO-Viral entitlement names', () => {
    expect(isGoViralEntitlement('go-ai-viral')).toBe(true)
    expect(isGoViralEntitlement(ENTITLEMENTS.GO_VIRAL_AI)).toBe(true)
    expect(isGoViralEntitlement(ENTITLEMENTS.SMARTVIDEO_VIRAL)).toBe(true)
    expect(isGoViralEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)).toBe(false)
    expect(isGoViralEntitlement('video-studio')).toBe(false)
  })
})

describe('GoViralGate', () => {
  it('shows the studio to a GO-Viral buyer', () => {
    renderWith(makeContext({ hasSmartVideoViral: true }), <GoViralGate><p>viral studio</p></GoViralGate>)
    expect(screen.getByText('viral studio')).toBeTruthy()
    expect(screen.queryByTestId('go-viral-locked')).toBeNull()
  })

  it('shows the studio to the super user', () => {
    renderWith(makeContext({ isSuperUser: true }), <GoViralGate><p>viral studio</p></GoViralGate>)
    expect(screen.getByText('viral studio')).toBeTruthy()
  })

  it('locks the studio for a signed-in user without GO-Viral and opens the GO-Viral upgrade', () => {
    const ctx = makeContext({})
    renderWith(ctx, <GoViralGate><p>viral studio</p></GoViralGate>)
    expect(screen.queryByText('viral studio')).toBeNull()
    expect(screen.getByTestId('go-viral-locked')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Unlock GO-Viral' }))
    expect(ctx.openUpgradeModal).toHaveBeenCalledWith('go-ai-viral')
  })

  it('shows neither the studio nor the lock while access is loading', () => {
    renderWith(makeContext({ isLoading: true }), <GoViralGate><p>viral studio</p></GoViralGate>)
    expect(screen.queryByText('viral studio')).toBeNull()
    expect(screen.queryByTestId('go-viral-locked')).toBeNull()
  })
})

describe('UpgradeModal for GO-Viral', () => {
  it('uses GO-Viral wording and the GO-Viral checkout link', () => {
    vi.stubEnv('NEXT_PUBLIC_GO_VIRAL_CHECKOUT_URL', 'https://buy.example.com/go-viral')
    renderWith(
      makeContext({ upgradeModal: { isOpen: true, source: 'go-ai-viral' } }),
      <UpgradeModal />
    )
    expect(screen.getByText('Unlock GO-Viral', { selector: 'h2' })).toBeTruthy()
    expect(screen.getByText(/GO-Viral is sold separately/)).toBeTruthy()
    const cta = screen.getByText('Unlock GO-Viral', { selector: 'a' }) as HTMLAnchorElement
    expect(cta.getAttribute('href')).toBe('https://buy.example.com/go-viral')
    expect(screen.queryByText('All SmartVideo GO Studios')).toBeNull()
  })
})

describe('SmartVideoAccessProvider when the access check fails', () => {
  it('retries, then falls back to base access with GO-Viral locked (no preview mode)', async () => {
    vi.resetModules()
    // Clerk hands back stable objects between renders; so does this mock.
    const auth = { isSignedIn: true, isLoaded: true }
    const userResult = { user: { id: 'user_1', emailAddresses: [{ emailAddress: 'a@example.com' }] } }
    vi.doMock('@clerk/nextjs', () => ({
      useAuth: () => auth,
      useUser: () => userResult,
    }))
    const fetchMock = vi.fn(async () => new Response('timeout', { status: 504 }))
    vi.stubGlobal('fetch', fetchMock)

    const { SmartVideoAccessProvider, useSmartVideoAccess } = await import('../SmartVideoAccessProvider')
    function Probe() {
      const a = useSmartVideoAccess()
      if (a.isLoading) return <p>loading</p>
      return <p>{`paid=${a.isPaid} unpaid=${a.isAuthenticatedUnpaid} viral=${a.hasSmartVideoViral}`}</p>
    }
    render(<SmartVideoAccessProvider><Probe /></SmartVideoAccessProvider>)

    await waitFor(() => expect(screen.getByText('paid=true unpaid=false viral=false')).toBeTruthy())
    expect(fetchMock).toHaveBeenCalledTimes(2)
    vi.doUnmock('@clerk/nextjs')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next/dynamic', () => ({
  default: (_loader: unknown, options?: { ssr?: boolean }) => {
    const Stub = () => <div data-testid="dynamic-stub" />
    Stub.displayName = 'DynamicStub'
    if (options?.ssr === false) return Stub
    return Stub
  },
}))

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: [] }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('studio', () => {
  const Stub = ({ apiKey }: { apiKey: string | null }) => (
    <div data-testid="image-studio" data-api-key={apiKey ?? ''}>
      Image Studio
    </div>
  )
  return {
    ImageStudio: Stub,
    VideoStudio: Stub,
    ClippingStudio: Stub,
    VibeMotionStudio: Stub,
    LipSyncStudio: Stub,
    CinemaStudio: Stub,
    AudioStudio: Stub,
    MarketingStudio: Stub,
    WorkflowStudio: Stub,
    AgentStudio: Stub,
    AppsStudio: Stub,
    getUserBalance: vi.fn().mockResolvedValue({ balance: 42 }),
  }
})

vi.mock('@/hooks/useUserBalance', () => ({
  useUserBalance: () => ({ data: { balance: 42 }, error: null, isLoading: false }),
  default: () => ({ data: { balance: 42 }, error: null, isLoading: false }),
}))

import StandaloneShell from '../../components/StandaloneShell.js'

describe('StandaloneShell apiKey flow', () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie = 'muapi_key=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it('hides Sign out and forwards no apiKey when localStorage is empty', async () => {
    render(<StandaloneShell />)
    await waitFor(() => {
      expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument()
    })
    const studio = await screen.findByTestId('image-studio')
    expect(studio).toHaveAttribute('data-api-key', '')
  })

  it('exposes Sign out and passes the stored key to studios when localStorage has a key', async () => {
    localStorage.setItem('muapi_key', 'test-key')
    render(<StandaloneShell />)

    const signOut = await screen.findByText(/sign out/i)
    expect(signOut).toBeInTheDocument()

    const studio = await screen.findByTestId('image-studio')
    await waitFor(() => {
      expect(studio).toHaveAttribute('data-api-key', 'test-key')
    })
  })

  it('clears the key from localStorage and the cookie when Sign out is clicked', async () => {
    const user = userEvent.setup()
    localStorage.setItem('muapi_key', 'test-key')
    document.cookie = 'muapi_key=test-key; path=/'

    render(<StandaloneShell />)
    const signOut = await screen.findByText(/sign out/i)
    await user.click(signOut)

    expect(localStorage.getItem('muapi_key')).toBeNull()
    expect(document.cookie).not.toMatch(/muapi_key=test-key/)
  })
})

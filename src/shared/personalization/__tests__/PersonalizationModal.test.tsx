// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createRoot } from 'react-dom/client';
import PersonalizationModal from '../PersonalizationModal';
import { DemoPersonalizeProvider, useDemoPersonalize } from '../DemoPersonalizeProvider';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

vi.mock('@/components/SocialPublishProvider', () => ({
  SocialPublishContext: { Provider: ({ children }: any) => children, Consumer: ({ children }: any) => children(null) } as any,
  useSocialPublish: () => {
    throw new Error('useSocialPublish must be used within a <SocialPublishProvider>')
  },
}))

vi.mock('@/lib/authConfig', () => ({
  useAuthConfig: () => ({
    apiKey: 'test-key',
    openaiKey: '',
    setApiKey: vi.fn(),
    setOpenAiKey: vi.fn(),
    clearApiKey: vi.fn(),
    clearOpenAiKey: vi.fn(),
    clearAllKeys: vi.fn(),
    hasApiKey: true,
    hasOpenAiKey: false,
    isAuthenticated: true,
  }),
}))

function TestOpener({ source, onMounted }: { source: any; onMounted: (open: (opts: any) => void) => void }) {
  const { openPersonalize } = useDemoPersonalize();
  onMounted(openPersonalize);
  return null;
}

function ContextExposer() {
  const ctx = useDemoPersonalize()
  ;(window as any).__personalizationCtx = ctx
  return null
}

describe('PersonalizationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.querySelectorAll('[data-testid="personalization-root"]').forEach((el) => el.remove())
    delete (window as any).__personalizationCtx
  })

  it('renders six visible client asset cards without tab navigation', async () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'personalization-root')
    document.body.appendChild(container);
    const root = createRoot(container);

    let openPersonalize: ((opts: any) => void) | null = null;

    await act(async () => {
      root.render(
        <DemoPersonalizeProvider>
          <TestOpener
            source={{ id: 'demo-1', title: 'Test Demo', mediaType: 'video', originalPrompt: 'test', sourceMedia: null, poster: null, fullPrompt: 'test', shortPrompt: 'test', sourceType: 'landing-demo', sourceMetadata: {} }}
            onMounted={(open) => {
              openPersonalize = open;
            }}
          />
        </DemoPersonalizeProvider>,
      );
    });

    await act(async () => {
      openPersonalize?.({ source: { id: 'demo-1', title: 'Test Demo', mediaType: 'video', originalPrompt: 'test prompt', sourceMedia: null, poster: null, fullPrompt: 'test', shortPrompt: 'test', sourceType: 'landing-demo', sourceMetadata: {} } });
    });

    const cardTitles = [
      '1. Person / Presenter',
      '2. Logo',
      '3. Products / Services',
      '4. Brand References',
      '5. First Frame',
      '6. Last Frame / CTA',
    ];

    cardTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeTruthy();
    });

    // Verify the full-width design sections are present
    expect(screen.getByText('Source Demo')).toBeTruthy();
    expect(screen.getByText(/Client Assets/i)).toBeTruthy();
    expect(screen.getByText(/CTA & Business Content/i)).toBeTruthy();
    expect(screen.getByText(/Personalize The Prompt/i)).toBeTruthy();
    expect(screen.getByText(/SmartVideo Engine/i)).toBeTruthy();

    // Verify SmartVideo Recommended is prominently visible (check container text)
    expect(container.textContent).toMatch(/SmartVideo/)
    expect(container.textContent).toMatch(/Recommended/)

    // Verify prompt section has Original and Personalized headings
    expect(screen.getByText('Original Prompt')).toBeTruthy();
    expect(screen.getByText('Personalized Prompt')).toBeTruthy();

    // Verify large visual upload zones are present
    expect(screen.getByText('Add Photos')).toBeTruthy();
    expect(screen.getByText('Upload Logo')).toBeTruthy();

    // Verify preview/placeholder content shows for all six cards
    // Person card shows FACE/BODY/SIDE placeholders
    expect(container.textContent).toMatch(/FACE/)
    expect(container.textContent).toMatch(/BODY/)
    expect(container.textContent).toMatch(/SIDE/)
    // Products card shows 1/2/3 placeholders
    expect(container.textContent).toMatch(/1/)
    expect(container.textContent).toMatch(/2/)
    expect(container.textContent).toMatch(/3/)
    // Brand References shows STORE/TEAM/VEHICLE
    expect(container.textContent).toMatch(/STORE/)
    expect(container.textContent).toMatch(/TEAM/)
    expect(container.textContent).toMatch(/VEHICLE/)
    // Frames show "First Frame" and CTA preview
    expect(container.textContent).toMatch(/First Frame/)
    expect(container.textContent).toMatch(/Last Frame\/CTA/)

    // Verify no primary tab navigation exists
    const tabButtons = container.querySelectorAll('button');
    const tabLabels = [...tabButtons].map((b) => b.textContent?.trim()).filter(Boolean);
    expect(tabLabels).not.toContain('Person');
    expect(tabLabels).not.toContain('Logo');
    expect(tabLabels).not.toContain('Products');
    expect(tabLabels).not.toContain('Brand');
    expect(tabLabels).not.toContain('Frames');
    expect(tabLabels).not.toContain('CTA');

    // Verify Website field exists exactly once and Find Business Assets button is present
    const websiteLabels = screen.getAllByText('Website')
    expect(websiteLabels.length).toBe(1)
    const findButtons = screen.getAllByText('Find Business Assets')
    expect(findButtons.length).toBeGreaterThanOrEqual(1)
    expect(container.textContent).toMatch(/Optional — use your website to find business assets automatically/)

    // Verify Website appears before Business Name in DOM order
    const websiteLabel = websiteLabels[0]
    const businessNameLabel = screen.getByText('Business Name')
    const allLabels = Array.from(container.querySelectorAll('label'))
    expect(allLabels.indexOf(websiteLabel as any)).toBeLessThan(allLabels.indexOf(businessNameLabel as any))
  });

  it('renders the niche-specific CTA heading when source.sourceMetadata.nicheId is set', async () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'personalization-root')
    document.body.appendChild(container);
    const root = createRoot(container);

    let openPersonalize: ((opts: any) => void) | null = null;

    await act(async () => {
      root.render(
        <DemoPersonalizeProvider>
          <TestOpener
            source={{ id: 'demo-niche', title: 'Niche Demo', mediaType: 'video', originalPrompt: 'p', sourceMedia: null, poster: null, fullPrompt: 'p', shortPrompt: 'p', sourceType: 'landing-demo', sourceMetadata: { nicheId: 'ecommerce' } }}
            onMounted={(open) => { openPersonalize = open; }}
          />
        </DemoPersonalizeProvider>,
      );
    });

    await act(async () => {
      openPersonalize?.({
        source: {
          id: 'demo-niche',
          title: 'Niche Demo',
          mediaType: 'video',
          originalPrompt: 'p',
          sourceMedia: null,
          poster: null,
          fullPrompt: 'p',
          shortPrompt: 'p',
          sourceType: 'landing-demo',
          sourceMetadata: { nicheId: 'ecommerce' },
        },
      });
    });

    // Niche-aware heading + body come from NICHE_CTA_BY_ID.ecommerce.
    expect(
      screen.getByText('Personalize This AI Product Video Demo'),
    ).toBeTruthy();
    expect(container.textContent || '').toMatch(/AI ecommerce product video demo/);
  });

  it('falls back to the generic header when no nicheId is present', async () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'personalization-root')
    document.body.appendChild(container);
    const root = createRoot(container);

    let openPersonalize: ((opts: any) => void) | null = null;

    await act(async () => {
      root.render(
        <DemoPersonalizeProvider>
          <TestOpener
            source={{ id: 'demo-generic', title: 'Generic Demo', mediaType: 'video', originalPrompt: 'p', sourceMedia: null, poster: null, fullPrompt: 'p', shortPrompt: 'p', sourceType: 'landing-demo', sourceMetadata: {} }}
            onMounted={(open) => { openPersonalize = open; }}
          />
        </DemoPersonalizeProvider>,
      );
    });

    await act(async () => {
      openPersonalize?.({
        source: {
          id: 'demo-generic',
          title: 'Generic Demo',
          mediaType: 'video',
          originalPrompt: 'p',
          sourceMedia: null,
          poster: null,
          fullPrompt: 'p',
          shortPrompt: 'p',
          sourceType: 'landing-demo',
          sourceMetadata: {},
        },
      });
    });

    // No niche → generic title from the modal default.
    const genericMatches = screen.getAllByText(/Personalize this demo/i);
    expect(genericMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows manual website input when selected business has no website', async () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'personalization-root')
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <DemoPersonalizeProvider>
          <ContextExposer />
        </DemoPersonalizeProvider>,
      );
    });

    await act(async () => {
      ;(window as any).__personalizationCtx.openPersonalize({
        source: { id: 'demo-1', title: 'Test Demo', mediaType: 'video', originalPrompt: 'test', sourceMedia: null, poster: null, fullPrompt: 'test', shortPrompt: 'test', sourceType: 'landing-demo', sourceMetadata: { audience: 'customer' } },
      });
    });

    await act(async () => {
      ;(window as any).__personalizationCtx.updateClientForm({ audience: 'customer' })
      ;(window as any).__personalizationCtx.selectBusiness({
        id: 'osm-no-web',
        source: 'OPENSTREETMAP',
        name: 'No Website Biz',
        category: 'Restaurant',
        city: 'Tampa',
        region: 'FL',
        phone: '555-0000',
        website: undefined,
        websiteStatus: 'unknown',
        verificationStatus: 'unverified',
        leadScore: 50,
      })
    });

    expect(screen.getByPlaceholderText('Enter website manually to research')).toBeTruthy()
    expect(screen.getByText('Not listed in OpenStreetMap')).toBeTruthy()
  });

  it('keeps retry button visible when business research fails', async () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'personalization-root')
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <DemoPersonalizeProvider>
          <ContextExposer />
        </DemoPersonalizeProvider>,
      );
    });

    await act(async () => {
      ;(window as any).__personalizationCtx.openPersonalize({
        source: { id: 'demo-1', title: 'Test Demo', mediaType: 'video', originalPrompt: 'test', sourceMedia: null, poster: null, fullPrompt: 'test', shortPrompt: 'test', sourceType: 'landing-demo', sourceMetadata: { audience: 'customer' } },
      });
    });

    await act(async () => {
      ;(window as any).__personalizationCtx.updateClientForm({ audience: 'customer' })
      ;(window as any).__personalizationCtx.selectBusiness({
        id: 'osm-fail',
        source: 'OPENSTREETMAP',
        name: 'Fail Biz',
        category: 'Plumbing',
        city: 'Miami',
        region: 'FL',
        phone: '555-1111',
        website: undefined,
        websiteStatus: 'unknown',
        verificationStatus: 'unverified',
        leadScore: 50,
      })
      ;(window as any).__personalizationCtx.updateClientForm({ website: 'https://fail-biz.example.com' })
    })

    await act(async () => {
      ;(globalThis as any).fetch = vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response))
      ;(window as any).__personalizationCtx.researchBusiness()
    })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100))
    })

    expect(screen.getByText('Research failed: Server error')).toBeTruthy()
    expect(screen.getByText('Retry')).toBeTruthy()
    expect(screen.getByPlaceholderText('Enter website manually to research')).toBeTruthy()
  })
});

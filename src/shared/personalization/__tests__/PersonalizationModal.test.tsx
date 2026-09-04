// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

function TestOpener({ source, onMounted }: { source: any; onMounted: (open: (opts: any) => void) => void }) {
  const { openPersonalize } = useDemoPersonalize();
  onMounted(openPersonalize);
  return null;
}

describe('PersonalizationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders six visible client asset cards without tab navigation', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    let openPersonalize: ((opts: any) => void) | null = null;

    await act(async () => {
      root.render(
        <DemoPersonalizeProvider apiKey="test-key">
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
    expect(screen.getByText('Client Assets')).toBeTruthy();
    expect(screen.getByText('CTA & Business Content')).toBeTruthy();
    expect(screen.getByText('Personalize The Prompt')).toBeTruthy();
    expect(screen.getByText('Engine')).toBeTruthy();

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
    // Brand References shows TRUCK/OFFICE/UNIFORM
    expect(container.textContent).toMatch(/TRUCK/)
    expect(container.textContent).toMatch(/OFFICE/)
    expect(container.textContent).toMatch(/UNIFORM/)
    // Frames show "First Frame" and CTA preview
    expect(container.textContent).toMatch(/First Frame/)
    expect(container.textContent).toMatch(/Protect Your Home Today/)

    // Verify no primary tab navigation exists
    const tabButtons = container.querySelectorAll('button');
    const tabLabels = [...tabButtons].map((b) => b.textContent?.trim()).filter(Boolean);
    expect(tabLabels).not.toContain('Person');
    expect(tabLabels).not.toContain('Logo');
    expect(tabLabels).not.toContain('Products');
    expect(tabLabels).not.toContain('Brand');
    expect(tabLabels).not.toContain('Frames');
    expect(tabLabels).not.toContain('CTA');
  });

  it('renders the niche-specific CTA heading when source.sourceMetadata.nicheId is set', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    let openPersonalize: ((opts: any) => void) | null = null;

    await act(async () => {
      root.render(
        <DemoPersonalizeProvider apiKey="test-key">
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
    document.body.appendChild(container);
    const root = createRoot(container);

    let openPersonalize: ((opts: any) => void) | null = null;

    await act(async () => {
      root.render(
        <DemoPersonalizeProvider apiKey="test-key">
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
    const genericMatches = screen.getAllByText(/PERSONALIZE THIS DEMO/);
    expect(genericMatches.length).toBeGreaterThanOrEqual(1);
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createRoot } from 'react-dom/client';
import PersonalizationModal from '../PersonalizationModal';
import { DemoPersonalizeProvider, useDemoPersonalize } from '../DemoPersonalizeProvider';

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
      'Person / Presenter',
      'Logo',
      'Products / Services',
      'Brand References',
      'First Frame',
      'Last Frame / CTA',
    ];

    cardTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeTruthy();
    });

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
});

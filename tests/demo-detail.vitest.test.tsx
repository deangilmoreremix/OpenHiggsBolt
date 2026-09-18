// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'hollywood-professional-racing-movie-style' }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/components/SocialPublishProvider', () => ({
  SocialPublishContext: { Provider: ({ children }: any) => children, Consumer: ({ children }: any) => children(null) } as any,
  useSocialPublish: () => {
    throw new Error('useSocialPublish must be used within a <SocialPublishProvider>');
  },
}));

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
}));

import DemoDetailPage from '@/app/demo/[slug]/page';
import { DemoPromptProvider } from '@/components/landing/DemoPromptModal';
import { DemoPersonalizeProvider } from '@/shared/personalization';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DemoPromptProvider>
      <DemoPersonalizeProvider>{children}</DemoPersonalizeProvider>
    </DemoPromptProvider>
  );
}

describe('DemoDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the demo title and category', async () => {
    render(
      <Wrapper>
        <DemoDetailPage />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Hollywood Professional Racing Movie Style')).toBeDefined();
    });
  });

  it('shows the full prompt block', async () => {
    render(
      <Wrapper>
        <DemoDetailPage />
      </Wrapper>,
    );

    await waitFor(() => {
      const headings = screen.getAllByText('Full generation prompt');
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders the Create This Style button', async () => {
    render(
      <Wrapper>
        <DemoDetailPage />
      </Wrapper>,
    );

    await waitFor(() => {
      const buttons = screen.getAllByText('Create This Style');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens the Video/Cinema picker from the detail page', async () => {
    render(
      <Wrapper>
        <DemoDetailPage />
      </Wrapper>,
    );

    await waitFor(() => {
      const buttons = screen.getAllByText('Create This Style');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    await act(async () => {
      (screen.getAllByText('Create This Style')[0] as HTMLElement).click();
    });

    expect(screen.getByText('Video Studio')).toBeDefined();
    expect(screen.getByText('Cinema Studio')).toBeDefined();
    expect(screen.queryByText('VFX Studio')).toBeNull();
  });

  it('shows related demos when available', async () => {
    render(
      <Wrapper>
        <DemoDetailPage />
      </Wrapper>,
    );

    await waitFor(() => {
      const headings = screen.getAllByText('Related demos');
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });
});

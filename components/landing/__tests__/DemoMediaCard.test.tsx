// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import React from 'react';

vi.mock('next/navigation', () => ({
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
    throw new Error('useSocialPublish must be used within a <SocialPublishProvider>')
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

import DemoMediaCard from '../DemoMediaCard';
import { DemoPromptProvider } from '../DemoPromptModal';
import { DemoPersonalizeProvider } from '@/shared/personalization';
import { MINIMAX_H3_DEMOS } from '@/data/minimaxH3Demos';

const demo = MINIMAX_H3_DEMOS[0];

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DemoPromptProvider>
      <DemoPersonalizeProvider>{children}</DemoPersonalizeProvider>
    </DemoPromptProvider>
  );
}

describe('DemoMediaCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the three canonical action labels', () => {
    render(
      <Wrapper>
        <DemoMediaCard demo={demo} />
      </Wrapper>,
    );

    expect(screen.getByText('View Prompt')).toBeDefined();
    expect(screen.getByText('Personalize This Demo')).toBeDefined();
    expect(screen.getByText('Create This Style')).toBeDefined();
  });

  it('renders Create This Style as a button that opens the target picker', () => {
    render(
      <Wrapper>
        <DemoMediaCard demo={demo} />
      </Wrapper>,
    );

    const createButtons = screen.getAllByRole('button').filter((btn) => btn.textContent?.trim() === 'Create This Style');
    expect(createButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render legacy alternate labels as primary actions', () => {
    render(
      <Wrapper>
        <DemoMediaCard demo={demo} />
      </Wrapper>,
    );

    const primaryButtons = screen.getAllByRole('button').filter((btn) => !btn.querySelector('button'));
    const buttonLabels = primaryButtons.map((btn) => btn.textContent?.trim());
    expect(buttonLabels).not.toContain('Create This Type of Video');
    expect(buttonLabels).not.toContain('Open in Studio');
    expect(buttonLabels).not.toContain('Open Source');
  });

  it('opens the target picker with Video Studio and Cinema Studio when Create This Style is clicked', async () => {
    render(
      <Wrapper>
        <DemoMediaCard demo={demo} />
      </Wrapper>,
    );

    const createButtons = screen.getAllByText('Create This Style');
    await act(async () => {
      createButtons[0].click();
    });

    expect(screen.getByText('Open in...')).toBeDefined();
    expect(screen.getByText('Video Studio')).toBeDefined();
    expect(screen.getByText('Cinema Studio')).toBeDefined();
    expect(screen.queryByText('VFX Studio')).toBeNull();
    expect(screen.queryByText('Marketing Studio')).toBeNull();
  });
});

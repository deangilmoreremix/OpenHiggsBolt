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

import { PromptCard, VideoPromptCard } from '../GoAiViralStudio';
import { DemoPersonalizeProvider } from '@/shared/personalization';
import type { PromptRecord } from '@/types/go-ai-viral/prompt';
import type { SeedancePrompt } from '@/types/go-ai-viral/seedance';

function makePromptRecord(overrides: Partial<PromptRecord> = {}): PromptRecord {
  return {
    id: '1',
    imglumeId: 1,
    revision: '1',
    title: 'Test Image',
    prompt: 'test prompt',
    mediaType: 'image',
    recommendedModel: 'gptimage',
    sourceModels: ['gptimage'],
    categories: ['nature'],
    tags: ['test'],
    language: 'en',
    recommended: { quality: 'high', aspectRatio: '1:1', durationSeconds: null, generateAudio: null },
    source: {
      platform: 'x',
      postId: '1',
      url: 'https://x.com/test/1',
      author: { handle: 'test', name: 'Test' },
      publishedAt: '2024-01-01T00:00:00Z',
      discoveredAt: '2024-01-01T00:00:00Z',
      engagement: { likes: 10, reposts: 2, replies: 1 },
      attribution: 'Test',
      license: 'CC-BY-4.0',
      rightsHolder: 'Test',
    },
    media: [
      {
        type: 'image',
        role: 'result',
        previewUrl: 'https://example.com/preview.jpg',
        posterUrl: null,
        sourceUrl: null,
        altText: 'Test',
        width: 800,
        height: 600,
        license: 'CC-BY-4.0',
        rightsHolder: 'Test',
      },
    ],
    curation: {
      creator: 'ImgLume',
      url: 'https://example.com',
      recordUrl: 'https://example.com/1',
      license: 'CC-BY-4.0',
      contributions: [],
    },
    provenance: {
      discoveredBy: 'ByRadar',
      collection: 'test',
      importedAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    ...overrides,
  };
}

function makeSeedancePrompt(overrides: Partial<SeedancePrompt> = {}): SeedancePrompt {
  return {
    slug: 'test-video',
    prompt: 'test video prompt',
    fullPrompt: 'full test video prompt',
    sourceLanguage: 'en',
    detailHref: null,
    outputUrl: 'https://example.com/video.mp4',
    categories: ['cinema'],
    tags: ['test'],
    recommendedModel: 'seedance',
    sourceModels: ['seedance'],
    language: 'en',
    thumbnail: null,
    author: 'Test Author',
    publishedAt: '2024-01-01T00:00:00Z',
    engagement: { likes: 5, reposts: 1, replies: 0 },
    media: [
      {
        type: 'video',
        role: 'result',
        previewUrl: null,
        sourceUrl: null,
        posterUrl: 'https://example.com/poster.jpg',
        altText: 'Test video',
        width: 1280,
        height: 720,
        license: 'CC-BY-4.0',
        rightsHolder: 'Test',
      },
    ],
    ...overrides,
  };
}

describe('PromptCard', () => {
  it('renders the three canonical action labels', () => {
    const record = makePromptRecord();
    render(
      <DemoPersonalizeProvider>
        <PromptCard record={record} isSelected={false} onSelect={() => {}} />
      </DemoPersonalizeProvider>,
    );

    const viewPromptInstances = screen.getAllByText('View Prompt');
    const personalizeInstances = screen.getAllByText('Personalize This Demo');
    const createStyleInstances = screen.getAllByText('Create This Style');
    expect(viewPromptInstances.length).toBeGreaterThanOrEqual(1);
    expect(personalizeInstances.length).toBeGreaterThanOrEqual(1);
    expect(createStyleInstances.length).toBeGreaterThanOrEqual(1);
  });

  it('opens the studio picker when Create This Style is clicked', async () => {
    const record = makePromptRecord();
    render(
      <DemoPersonalizeProvider>
        <PromptCard record={record} isSelected={false} onSelect={() => {}} />
      </DemoPersonalizeProvider>,
    );

    const createStyleButtons = screen.getAllByText('Create This Style');
    await act(async () => {
      createStyleButtons[0].click();
    });

    expect(screen.getByText('Open in...')).toBeDefined();
  });

  it('does not render legacy alternate labels as primary actions', () => {
    const record = makePromptRecord({ source: { ...makePromptRecord().source, url: 'https://x.com/test/1' } });
    render(
      <DemoPersonalizeProvider>
        <PromptCard record={record} isSelected={false} onSelect={() => {}} />
      </DemoPersonalizeProvider>,
    );

    const actionAreas = screen.getAllByLabelText('Demo actions');
    const primaryActionText = actionAreas.map((area) => area.textContent).join('');
    expect(primaryActionText).not.toContain('Open in Studio');
    expect(primaryActionText).not.toContain('Open Source');
  });
});

describe('VideoPromptCard', () => {
  it('renders the three canonical action labels', () => {
    const record = makeSeedancePrompt();
    render(
      <DemoPersonalizeProvider>
        <VideoPromptCard record={record} onSelect={() => {}} />
      </DemoPersonalizeProvider>,
    );

    const viewPromptInstances = screen.getAllByText('View Prompt');
    const personalizeInstances = screen.getAllByText('Personalize This Demo');
    const createStyleInstances = screen.getAllByText('Create This Style');
    expect(viewPromptInstances.length).toBeGreaterThanOrEqual(1);
    expect(personalizeInstances.length).toBeGreaterThanOrEqual(1);
    expect(createStyleInstances.length).toBeGreaterThanOrEqual(1);
  });

  it('opens the studio picker when Create This Style is clicked', async () => {
    const record = makeSeedancePrompt();
    render(
      <DemoPersonalizeProvider>
        <VideoPromptCard record={record} onSelect={() => {}} />
      </DemoPersonalizeProvider>,
    );

    const createStyleButtons = screen.getAllByText('Create This Style');
    await act(async () => {
      createStyleButtons[0].click();
    });

    expect(screen.getByText('Open in...')).toBeDefined();
  });

  it('does not render legacy alternate labels as primary actions', () => {
    const record = makeSeedancePrompt({ outputUrl: 'https://example.com/video.mp4' });
    render(
      <DemoPersonalizeProvider>
        <VideoPromptCard record={record} onSelect={() => {}} />
      </DemoPersonalizeProvider>,
    );

    const actionAreas = screen.getAllByLabelText('Demo actions');
    const primaryActionText = actionAreas.map((area) => area.textContent).join('');
    expect(primaryActionText).not.toContain('Open in Studio');
    expect(primaryActionText).not.toContain('Play Video');
  });
});

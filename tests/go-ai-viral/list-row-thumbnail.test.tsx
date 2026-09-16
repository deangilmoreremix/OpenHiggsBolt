import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ListRowThumbnail } from '../../src/apps/go-ai-viral/GoAiViralStudio';
import type { PromptRecord, PromptMedia } from '../../src/types/go-ai-viral/prompt';

function makeMedia(overrides: Partial<PromptMedia> = {}): PromptMedia {
  return {
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
    ...overrides,
  };
}

function makePromptRecord(overrides: { media?: PromptMedia[]; mediaType?: 'image' | 'video' } = {}): PromptRecord {
  return {
    id: '1',
    imglumeId: 1,
    revision: '1',
    title: 'Test',
    prompt: 'test prompt',
    mediaType: overrides.mediaType || 'image',
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
    media: overrides.media || [makeMedia()],
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
  };
}

describe('ListRowThumbnail', () => {
  it('renders image from previewUrl', () => {
    const record = makePromptRecord({
      media: [makeMedia({ previewUrl: 'https://example.com/preview.jpg' })],
    });
    render(<ListRowThumbnail record={record} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/preview.jpg');
  });

  it('shows placeholder when no media URLs are available', () => {
    const record = makePromptRecord({
      media: [makeMedia({ previewUrl: '', sourceUrl: '', posterUrl: '' })],
    });
    render(<ListRowThumbnail record={record} />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('does not use style.display = "none" on error', () => {
    const record = makePromptRecord({
      media: [makeMedia({ previewUrl: 'https://example.com/broken.jpg' })],
    });
    render(<ListRowThumbnail record={record} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/broken.jpg');
    // Simulate error
    img.dispatchEvent(new Event('error'));
    // After error, image should be removed from DOM and placeholder shown
    expect(screen.queryByRole('img')).toBeNull();
  });
});

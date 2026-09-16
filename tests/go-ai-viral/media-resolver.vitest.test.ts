import { describe, it, expect } from 'vitest';
import {
  resolvePromptRecordImage,
  resolvePromptRecordVideo,
  resolveSeedanceVideo,
  isPlaceholderDataUri,
} from '@/libs/viralMediaResolver';
import type { PromptRecord, PromptMedia } from '@/types/go-ai-viral/prompt';
import type { SeedancePrompt } from '@/types/go-ai-viral/seedance';

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

describe('resolvePromptRecordImage', () => {
  it('prefers previewUrl from result role media', () => {
    const record = makePromptRecord({
      media: [
        makeMedia({ role: 'other', previewUrl: 'https://example.com/other.jpg' }),
        makeMedia({ role: 'result', previewUrl: 'https://example.com/result.jpg' }),
      ],
    });
    const resolved = resolvePromptRecordImage(record);
    expect(resolved.imageUrl).toBe('https://example.com/result.jpg');
    expect(resolved.isFallback).toBe(false);
  });

  it('falls back to sourceUrl when previewUrl is missing', () => {
    const record = makePromptRecord({
      media: [makeMedia({ previewUrl: '', sourceUrl: 'https://example.com/source.mp4' })],
    });
    const resolved = resolvePromptRecordImage(record);
    expect(resolved.imageUrl).toBe('https://example.com/source.mp4');
    expect(resolved.isFallback).toBe(true);
  });

  it('falls back to posterUrl when previewUrl and sourceUrl are missing', () => {
    const record = makePromptRecord({
      media: [makeMedia({ previewUrl: '', sourceUrl: '', posterUrl: 'https://example.com/poster.jpg' })],
    });
    const resolved = resolvePromptRecordImage(record);
    expect(resolved.imageUrl).toBe('https://example.com/poster.jpg');
    expect(resolved.isFallback).toBe(true);
  });

  it('returns null when no media URLs are available', () => {
    const record = makePromptRecord({
      media: [makeMedia({ previewUrl: '', sourceUrl: '', posterUrl: '' })],
    });
    const resolved = resolvePromptRecordImage(record);
    expect(resolved.imageUrl).toBeNull();
    expect(resolved.candidates).toEqual([]);
  });
});

describe('resolvePromptRecordVideo', () => {
  it('prefers sourceUrl for video src', () => {
    const record = makePromptRecord({
      mediaType: 'video',
      media: [makeMedia({ type: 'video', sourceUrl: 'https://example.com/video.mp4', previewUrl: 'https://example.com/preview.jpg' })],
    });
    const resolved = resolvePromptRecordVideo(record);
    expect(resolved.videoUrl).toBe('https://example.com/video.mp4');
    expect(resolved.isVideoFallback).toBe(false);
  });

  it('falls back to previewUrl for video src when sourceUrl is missing', () => {
    const record = makePromptRecord({
      mediaType: 'video',
      media: [makeMedia({ type: 'video', sourceUrl: '', previewUrl: 'https://example.com/preview.jpg' })],
    });
    const resolved = resolvePromptRecordVideo(record);
    expect(resolved.videoUrl).toBe('https://example.com/preview.jpg');
    expect(resolved.isVideoFallback).toBe(true);
  });

  it('prefers posterUrl for poster', () => {
    const record = makePromptRecord({
      mediaType: 'video',
      media: [makeMedia({ type: 'video', posterUrl: 'https://example.com/poster.jpg', previewUrl: 'https://example.com/preview.jpg' })],
    });
    const resolved = resolvePromptRecordVideo(record);
    expect(resolved.posterUrl).toBe('https://example.com/poster.jpg');
    expect(resolved.isPosterFallback).toBe(false);
  });

  it('falls back to previewUrl for poster when posterUrl is missing', () => {
    const record = makePromptRecord({
      mediaType: 'video',
      media: [makeMedia({ type: 'video', posterUrl: '', previewUrl: 'https://example.com/preview.jpg' })],
    });
    const resolved = resolvePromptRecordVideo(record);
    expect(resolved.posterUrl).toBe('https://example.com/preview.jpg');
    expect(resolved.isPosterFallback).toBe(true);
  });
});

describe('resolveSeedanceVideo', () => {
  it('uses outputUrl as video src', () => {
    const record: SeedancePrompt = {
      slug: 'test',
      prompt: 'test',
      fullPrompt: 'test full',
      sourceLanguage: 'en',
      detailHref: null,
      outputUrl: 'https://example.com/output.mp4',
      thumbnail: 'https://example.com/thumb.jpg',
    };
    const resolved = resolveSeedanceVideo(record);
    expect(resolved.videoUrl).toBe('https://example.com/output.mp4');
    expect(resolved.posterUrl).toBe('https://example.com/thumb.jpg');
  });

  it('derives thumbnail from outputUrl when thumbnail is missing', () => {
    const record: SeedancePrompt = {
      slug: 'test',
      prompt: 'test',
      fullPrompt: 'test full',
      sourceLanguage: 'en',
      detailHref: null,
      outputUrl: 'https://example.com/outputs/case-001.mp4',
      thumbnail: null,
    };
    const resolved = resolveSeedanceVideo(record);
    expect(resolved.posterUrl).toBe('https://example.com/thumbnails/case-001.jpg');
    expect(resolved.isPosterFallback).toBe(true);
  });

  it('returns null videoUrl when outputUrl is missing', () => {
    const record: SeedancePrompt = {
      slug: 'test',
      prompt: 'test',
      fullPrompt: 'test full',
      sourceLanguage: 'en',
      detailHref: null,
      outputUrl: null,
      thumbnail: null,
    };
    const resolved = resolveSeedanceVideo(record);
    expect(resolved.videoUrl).toBeNull();
    expect(resolved.posterUrl).toBeNull();
  });
});

describe('isPlaceholderDataUri', () => {
  it('returns false for null/undefined', () => {
    expect(isPlaceholderDataUri(null)).toBe(false);
    expect(isPlaceholderDataUri(undefined)).toBe(false);
    expect(isPlaceholderDataUri('')).toBe(false);
  });

  it('returns false for non-data URIs', () => {
    expect(isPlaceholderDataUri('https://example.com/image.jpg')).toBe(false);
  });

  it('returns true for SVG data URIs', () => {
    expect(isPlaceholderDataUri('data:image/svg+xml,<svg>...</svg>')).toBe(true);
  });

  it('returns false for non-SVG data URIs', () => {
    expect(isPlaceholderDataUri('data:image/png;base64,abc123')).toBe(false);
  });
});

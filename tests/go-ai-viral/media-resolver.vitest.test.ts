import { describe, it, expect } from 'vitest';
import {
  resolvePromptRecordImage,
  resolvePromptRecordVideo,
  resolveSeedanceVideo,
  isPlaceholderDataUri,
  proxyVideoUrl,
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
  it('prefers previewUrl from result role image media', () => {
    const record = makePromptRecord({
      media: [
        makeMedia({ role: 'other', previewUrl: 'https://example.com/other.jpg' }),
        makeMedia({ role: 'result', previewUrl: 'https://example.com/result.jpg' }),
      ],
    });
    const resolved = resolvePromptRecordImage(record);
    expect(resolved.imageUrl).toBe('https://example.com/result.jpg');
    expect(resolved.isFallback).toBe(false);
    expect(resolved.candidates).toEqual(['https://example.com/result.jpg', 'https://example.com/other.jpg'])
  });

  it('returns sourceUrl when previewUrl is missing', () => {
    const record = makePromptRecord({
      media: [makeMedia({ previewUrl: '', sourceUrl: 'https://example.com/source.mp4' })],
    });
    const resolved = resolvePromptRecordImage(record);
    expect(resolved.imageUrl).toBe('https://example.com/source.mp4');
    expect(resolved.isFallback).toBe(false);
    expect(resolved.candidates).toEqual(['https://example.com/source.mp4'])
  });

  it('returns posterUrl when previewUrl and sourceUrl are missing', () => {
    const record = makePromptRecord({
      media: [makeMedia({ previewUrl: '', sourceUrl: '', posterUrl: 'https://example.com/poster.jpg' })],
    });
    const resolved = resolvePromptRecordImage(record);
    expect(resolved.imageUrl).toBe('https://example.com/poster.jpg');
    expect(resolved.isFallback).toBe(false);
    expect(resolved.candidates).toEqual(['https://example.com/poster.jpg'])
  });

  it('builds full candidate list up front for runtime fallback', () => {
    const record = makePromptRecord({
      media: [
        makeMedia({ role: 'result', previewUrl: 'https://example.com/broken.jpg', sourceUrl: 'https://example.com/working.jpg', posterUrl: 'https://example.com/poster.jpg' }),
      ],
    });
    const resolved = resolvePromptRecordImage(record);
    expect(resolved.candidates).toEqual([
      'https://example.com/broken.jpg',
      'https://example.com/working.jpg',
      'https://example.com/poster.jpg',
    ])
  });

  it('falls back to first image media when no result role image exists', () => {
    const record = makePromptRecord({
      media: [
        makeMedia({ role: 'other', previewUrl: 'https://example.com/first.jpg' }),
        makeMedia({ role: 'other', previewUrl: 'https://example.com/second.jpg' }),
      ],
    });
    const resolved = resolvePromptRecordImage(record);
    expect(resolved.imageUrl).toBe('https://example.com/first.jpg');
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
  it('prefers sourceUrl from video media', () => {
    const record = makePromptRecord({
      mediaType: 'video',
      media: [makeMedia({ type: 'video', sourceUrl: 'https://example.com/video.mp4', previewUrl: 'https://example.com/preview.jpg' })],
    });
    const resolved = resolvePromptRecordVideo(record);
    expect(resolved.videoUrl).toBe('https://example.com/video.mp4');
    expect(resolved.isVideoFallback).toBe(false);
  });

  it('does not use image sourceUrl as video src when no video media exists', () => {
    const record = makePromptRecord({
      mediaType: 'video',
      media: [makeMedia({ type: 'image', sourceUrl: 'https://example.com/image.jpg', previewUrl: '' })],
    });
    const resolved = resolvePromptRecordVideo(record);
    expect(resolved.videoUrl).toBeNull();
    expect(resolved.isVideoFallback).toBe(false);
  });

  it('does not use video previewUrl as video src when sourceUrl is missing', () => {
    const record = makePromptRecord({
      mediaType: 'video',
      media: [makeMedia({ type: 'video', sourceUrl: '', previewUrl: 'https://example.com/preview.jpg' })],
    });
    const resolved = resolvePromptRecordVideo(record);
    expect(resolved.videoUrl).toBeNull();
    expect(resolved.isVideoFallback).toBe(false);
  });

  it('prefers image posterUrl for poster', () => {
    const record = makePromptRecord({
      mediaType: 'video',
      media: [
        makeMedia({ type: 'image', posterUrl: 'https://example.com/image-poster.jpg', previewUrl: '' }),
        makeMedia({ type: 'video', posterUrl: 'https://example.com/video-poster.jpg', previewUrl: '' }),
      ],
    });
    const resolved = resolvePromptRecordVideo(record);
    expect(resolved.posterUrl).toBe('https://example.com/image-poster.jpg');
    expect(resolved.isPosterFallback).toBe(false);
  });

  it('falls back to video posterUrl when image poster is missing', () => {
    const record = makePromptRecord({
      mediaType: 'video',
      media: [
        makeMedia({ type: 'image', posterUrl: '', previewUrl: '' }),
        makeMedia({ type: 'video', posterUrl: 'https://example.com/video-poster.jpg', previewUrl: '' }),
      ],
    });
    const resolved = resolvePromptRecordVideo(record);
    expect(resolved.posterUrl).toBe('https://example.com/video-poster.jpg');
    expect(resolved.isPosterFallback).toBe(false);
  });

  it('returns null videoUrl when only image media with sourceUrl is present', () => {
    const record = makePromptRecord({
      mediaType: 'video',
      media: [
        makeMedia({ type: 'image', sourceUrl: 'https://example.com/image.jpg', previewUrl: '' }),
        makeMedia({ type: 'image', sourceUrl: 'https://example.com/other.jpg', previewUrl: '' }),
      ],
    });
    const resolved = resolvePromptRecordVideo(record);
    expect(resolved.videoUrl).toBeNull();
    expect(resolved.isVideoFallback).toBe(false);
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

describe('proxyVideoUrl', () => {
  it('returns empty string for null/undefined', () => {
    expect(proxyVideoUrl(null)).toBe('');
    expect(proxyVideoUrl(undefined)).toBe('');
  });

  it('returns non-video URLs unchanged', () => {
    expect(proxyVideoUrl('https://cdn.example.com/video.mp4')).toBe('https://cdn.example.com/video.mp4');
  });

  it('returns empty string for empty URL', () => {
    expect(proxyVideoUrl('')).toBe('');
  });
});

describe('resolveSeedanceVideo with normalized media', () => {
  it('uses video media sourceUrl when normalized media is present', () => {
    const record: SeedancePrompt = {
      slug: 'test',
      prompt: 'test',
      fullPrompt: 'test full',
      sourceLanguage: 'en',
      detailHref: null,
      outputUrl: 'https://cdn.example.com/output.mp4',
      thumbnail: 'https://cdn.example.com/thumb.jpg',
      media: [
        { type: 'image', role: 'preview', previewUrl: 'https://cdn.example.com/thumb.jpg', sourceUrl: 'https://cdn.example.com/thumb.jpg', posterUrl: 'https://cdn.example.com/thumb.jpg' },
        { type: 'video', role: 'result', previewUrl: 'https://cdn.example.com/thumb.jpg', sourceUrl: 'https://cdn.example.com/video.mp4', posterUrl: 'https://cdn.example.com/thumb.jpg' },
      ],
    };
    const resolved = resolveSeedanceVideo(record);
    expect(resolved.videoUrl).toBe('https://cdn.example.com/video.mp4');
    expect(resolved.posterUrl).toBe('https://cdn.example.com/thumb.jpg');
  });

  it('falls back to outputUrl/thumbnail when normalized media is absent', () => {
    const record: SeedancePrompt = {
      slug: 'test',
      prompt: 'test',
      fullPrompt: 'test full',
      sourceLanguage: 'en',
      detailHref: null,
      outputUrl: 'https://cdn.example.com/outputs/case-001.mp4',
      thumbnail: 'https://cdn.example.com/thumb.jpg',
    };
    const resolved = resolveSeedanceVideo(record);
    expect(resolved.videoUrl).toBe('https://cdn.example.com/outputs/case-001.mp4');
    expect(resolved.posterUrl).toBe('https://cdn.example.com/thumb.jpg');
    expect(resolved.isVideoFallback).toBe(true);
    expect(resolved.isPosterFallback).toBe(true);
  });
});

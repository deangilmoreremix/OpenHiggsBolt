// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeHandoff, readHandoff, clearHandoff, clearHandoffCache, emitSendTo, SEND_TO_EVENT, createViralHandoff, VIRAL_TARGETS_BY_MEDIA, TARGET_LABEL } from '../src/shared/crossStudio';

describe('crossStudio', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset the module-level in-memory cache so tests are independent.
    // Because the module is statically imported above, vi.resetModules() does
    // not re-evaluate it; we call the exported reset directly.
    clearHandoffCache();
  });

  describe('writeHandoff / readHandoff', () => {
    it('writes payload to localStorage and in-memory cache', () => {
      const payload = {
        version: 1,
        target: 'video' as const,
        from: 'storyboard' as const,
        projectName: 'Test',
        aspectRatio: '16:9' as const,
        episodeDuration: 0,
        videoUrl: null,
        referenceImageUrl: null,
        characterNames: [],
        shots: [],
        combinedPrompt: 'prompt text',
        firstFrameUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
      };

      writeHandoff(payload);
      const result = readHandoff();
      expect(result).not.toBeNull();
      expect(result!.projectName).toBe('Test');
      expect(result!.combinedPrompt).toBe('prompt text');
      expect(localStorage.getItem('storyboard_to_studio')).toBe(JSON.stringify(payload));
    });

    it('returns null when no payload exists', () => {
      const result = readHandoff();
      expect(result).toBeNull();
    });

    it('returns cached value on subsequent reads without hitting localStorage', () => {
      const payload = {
        version: 1,
        target: 'video' as const,
        from: 'storyboard' as const,
        projectName: 'Cached',
        aspectRatio: '16:9' as const,
        episodeDuration: 0,
        videoUrl: null,
        referenceImageUrl: null,
        characterNames: [],
        shots: [],
        combinedPrompt: 'cached prompt',
        firstFrameUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
      };

      writeHandoff(payload);
      const first = readHandoff();
      expect(first!.projectName).toBe('Cached');

      localStorage.setItem('storyboard_to_studio', JSON.stringify({ ...payload, projectName: 'Overwritten' }));
      const second = readHandoff();
      expect(second!.projectName).toBe('Cached');
    });

    it('returns null when target does not match', () => {
      const payload = {
        version: 1,
        target: 'video' as const,
        from: 'storyboard' as const,
        projectName: 'Test',
        aspectRatio: '16:9' as const,
        episodeDuration: 0,
        videoUrl: null,
        referenceImageUrl: null,
        characterNames: [],
        shots: [],
        combinedPrompt: 'prompt',
        firstFrameUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
      };

      writeHandoff(payload);
      const result = readHandoff('cinema');
      expect(result).toBeNull();
    });

    it('returns payload when target matches', () => {
      const payload = {
        version: 1,
        target: 'video' as const,
        from: 'storyboard' as const,
        projectName: 'Test',
        aspectRatio: '16:9' as const,
        episodeDuration: 0,
        videoUrl: null,
        referenceImageUrl: null,
        characterNames: [],
        shots: [],
        combinedPrompt: 'prompt',
        firstFrameUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
      };

      writeHandoff(payload);
      const result = readHandoff('video');
      expect(result).not.toBeNull();
      expect(result!.target).toBe('video');
    });
  });

  describe('clearHandoff / clearHandoffCache', () => {
    it('clearHandoff removes localStorage but preserves in-memory cache', () => {
      const payload = {
        version: 1,
        target: 'video' as const,
        from: 'storyboard' as const,
        projectName: 'Test',
        aspectRatio: '16:9' as const,
        episodeDuration: 0,
        videoUrl: null,
        referenceImageUrl: null,
        characterNames: [],
        shots: [],
        combinedPrompt: 'prompt',
        firstFrameUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
      };

      writeHandoff(payload);
      expect(localStorage.getItem('storyboard_to_studio')).not.toBeNull();

      clearHandoff();
      expect(localStorage.getItem('storyboard_to_studio')).toBeNull();

      // In-memory cache should still have it
      const result = readHandoff();
      expect(result).not.toBeNull();
      expect(result!.projectName).toBe('Test');
    });

    it('clearHandoffCache drops in-memory cache but readHandoff can re-populate from localStorage', () => {
      const payload = {
        version: 1,
        target: 'video' as const,
        from: 'storyboard' as const,
        projectName: 'Test',
        aspectRatio: '16:9' as const,
        episodeDuration: 0,
        videoUrl: null,
        referenceImageUrl: null,
        characterNames: [],
        shots: [],
        combinedPrompt: 'prompt',
        firstFrameUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
      };

      writeHandoff(payload);
      clearHandoffCache();
      // readHandoff should re-populate the in-memory cache from localStorage
      const result = readHandoff();
      expect(result).not.toBeNull();
      expect(result!.projectName).toBe('Test');
    });
  });

  describe('emitSendTo', () => {
    it('dispatches CustomEvent with correct detail', () => {
      const handler = vi.fn();
      window.addEventListener(SEND_TO_EVENT, handler);

      emitSendTo('video');
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        detail: { target: 'video' },
      }));

      window.removeEventListener(SEND_TO_EVENT, handler);
    });
  });

  describe('createViralHandoff', () => {
    it('builds correct payload for image record', () => {
      const result = createViralHandoff({
        target: 'image',
        record: {
          title: 'My Art',
          prompt: 'a beautiful painting',
          fullPrompt: 'a beautiful painting of mountains',
          mediaType: 'image',
          media: [{ role: 'result', previewUrl: 'https://example.com/img.jpg' }],
          detailHref: null,
        },
      });

      expect(result.target).toBe('image');
      expect(result.from).toBe('go-ai-viral');
      expect(result.projectName).toBe('My Art');
      expect(result.aspectRatio).toBe('1:1');
      expect(result.combinedPrompt).toBe('a beautiful painting');
      expect(result.firstFrameUrl).toBe('https://example.com/img.jpg');
      expect(result.shots).toHaveLength(1);
      expect(result.shots[0].prompt).toBe('a beautiful painting');
    });

    it('builds correct payload for video record', () => {
      const result = createViralHandoff({
        target: 'video',
        record: {
          title: 'My Video',
          prompt: 'a cinematic video',
          fullPrompt: 'a cinematic video of the ocean',
          mediaType: 'video',
          outputUrl: 'https://example.com/video.mp4',
          detailHref: '/detail/1',
        },
      });

      expect(result.target).toBe('video');
      expect(result.from).toBe('go-ai-viral');
      expect(result.aspectRatio).toBe('16:9');
      expect(result.videoUrl).toBe('https://example.com/video.mp4');
      expect(result.combinedPrompt).toBe('a cinematic video');
    });

    it('falls back to prompt slice when title is missing', () => {
      const result = createViralHandoff({
        target: 'image',
        record: {
          prompt: 'a very long prompt that should be sliced',
          mediaType: 'image',
        },
      });

      expect(result.projectName).toBe('a very long prompt that should be sliced');
    });
  });

  describe('VIRAL_TARGETS_BY_MEDIA', () => {
    it('maps image to correct studios', () => {
      expect(VIRAL_TARGETS_BY_MEDIA.image).toEqual([
        'image',
        'thumbnail-studio',
        'ai-influencer',
        'marketing',
      ]);
    });

    it('maps video to correct studios', () => {
      expect(VIRAL_TARGETS_BY_MEDIA.video).toEqual([
        'video',
        'cinema',
        'vfx-studio',
        'clipping',
        'vibe-motion',
        'lipsync',
        'recast',
      ]);
    });
  });

  describe('TARGET_LABEL', () => {
    it('has labels for all targets', () => {
      expect(TARGET_LABEL.video).toBe('Video Studio');
      expect(TARGET_LABEL.image).toBe('Image Studio');
      expect(TARGET_LABEL.cinema).toBe('Cinema Studio');
      expect(TARGET_LABEL['vfx-studio']).toBe('VFX Studio');
      expect(TARGET_LABEL['thumbnail-studio']).toBe('Thumbnail Studio');
      expect(TARGET_LABEL['ai-influencer']).toBe('AI Influencer Studio');
      expect(TARGET_LABEL.marketing).toBe('Marketing Studio');
    });
  });
});

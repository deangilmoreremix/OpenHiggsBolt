// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

// No director (no key): the storyboard comes from the Ink Press template, which is what we measure.
vi.mock('../lib/directorClient', () => {
  class DirectorError extends Error {
    constructor(message: string, readonly code: string, readonly status: number) {
      super(message);
    }
  }
  return {
    DirectorError,
    captureSite: vi.fn(),
    requestPlan: vi.fn(async () => {
      throw new DirectorError('No key.', 'OPENAI_KEY_REQUIRED', 401);
    }),
  };
});

import { buildFilmProject, storyboardFilm } from '../lib/filmPipeline';
import { parseFilmRequest } from '../lib/filmChat';
import { projectEndFrame } from '../types';
import type { MediaAttachment } from '../lib/mediaUpload';

const total = (plan: { scenes: { durationSec: number }[] }) => plan.scenes.reduce((s, sc) => s + sc.durationSec, 0);

describe('storyboardFilm', () => {
  it('leaves room in the requested length for attached videos, so the built film matches it', async () => {
    const req = parseFilmRequest('a promo for Acme with the Ink Press template');
    const video: MediaAttachment = { id: 'v', kind: 'video', name: 'demo.mp4', url: 'blob:demo', size: 1, durationSec: 8 };
    const result = await storyboardFilm(req, { template: 'inkpress', durationSec: 20, aspectRatio: '16:9', reservedSec: 8 }, () => {});
    expect(Math.abs(total(result.plan) - 12)).toBeLessThan(0.5);
    const project = await buildFilmProject(result.plan, { aspectRatio: '16:9', capture: null, media: [video] }, () => {});
    expect(Math.abs(projectEndFrame(project) / project.fps - 20)).toBeLessThan(0.5);
  });

  it('never fits the storyboard below the shortest film', async () => {
    const req = parseFilmRequest('a promo for Acme with the Ink Press template');
    const result = await storyboardFilm(req, { template: 'inkpress', durationSec: 6, aspectRatio: '16:9', reservedSec: 8 }, () => {});
    expect(total(result.plan)).toBeGreaterThanOrEqual(4.9);
  });
});

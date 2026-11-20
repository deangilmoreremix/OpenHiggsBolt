// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/directorClient', () => {
  class DirectorError extends Error {
    constructor(message: string, readonly code: string, readonly status: number) {
      super(message);
    }
  }
  return {
    DirectorError,
    captureSite: vi.fn(async () => {
      throw new DirectorError('Stopped', 'CANCELLED', 0);
    }),
    requestPlan: vi.fn(),
    requestMapping: vi.fn(),
    requestDirections: vi.fn(),
    fetchRecipeCard: vi.fn(async () => null),
    requestRetext: vi.fn(async () => {
      throw new DirectorError('No key.', 'OPENAI_KEY_REQUIRED', 401);
    }),
    requestFrameReview: vi.fn(),
  };
});

import { captureSite, type SiteCapture } from '../lib/directorClient';
import { buildFilmProject, STAGE4_DEADLINE_MS, STAGE4_EXTRA, STAGE4_NEEDED } from '../lib/filmPipeline';
import type { DirectorPlan } from '../lib/directorPlan';

const links = ['pricing', 'services', 'team', 'clients', 'careers', 'blog', 'contact'].map((n) => ({ name: n, path: `/${n}`, url: `https://acme.test/${n}` }));
const capture = { url: 'https://acme.test/', title: 'Acme', page: { url: 'p0', width: 3840, height: 3000 }, pages: [{ name: 'home', path: '/', url: 'p0', width: 3840, height: 3000 }], crops: ['c0'], brand: {}, content: null, transient: false, links } as unknown as SiteCapture;
const shot = (asset: string) => ({ kind: 'shot' as const, recipeId: 'brand/feature-zoom', durationSec: 3, headline: '', caption: '', transition: 'cut' as const, asset });
const plan: DirectorPlan = { title: 'Acme', summary: '', palette: { background: '#fff', text: '#111', accent: '#c00' }, scenes: ['pricing', 'services', 'team', 'clients', 'careers'].map(shot) };

describe('stage 4 after approval (review on #143)', () => {
  it('captures at most 4 pages at once, all inside one deadline, and passes the build\'s Stop through', async () => {
    let stopped = false;
    await buildFilmProject(plan, { aspectRatio: '16:9', capture, media: [], adaptShots: false, music: false, cancelled: () => stopped }, () => {});
    const calls = vi.mocked(captureSite).mock.calls;
    expect(calls.length).toBe(STAGE4_NEEDED + STAGE4_EXTRA);
    expect(calls.length).toBeLessThanOrEqual(4);
    for (const [, o] of calls) {
      expect(o?.targeted).toBe(true);
      expect(o?.maxWaitMs).toBe(STAGE4_DEADLINE_MS);
      expect(o?.cancelled?.()).toBe(false);
    }
    stopped = true;
    expect(calls[0][1]?.cancelled?.()).toBe(true);
  });

  it('a build stopped during stage 4 stops there', async () => {
    vi.mocked(captureSite).mockClear();
    await expect(buildFilmProject(plan, { aspectRatio: '16:9', capture, media: [], adaptShots: false, music: false, cancelled: () => true }, () => {})).rejects.toThrow('Stopped');
  });
});

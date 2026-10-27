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
import { captureSite, type SiteCapture } from '../lib/directorClient';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
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

  const capture = (over: Partial<SiteCapture> = {}): SiteCapture => ({
    url: 'https://globex.example/',
    title: 'Globex — build faster',
    page: { url: 'https://cdn.test/page.jpg', width: 3840, height: 3492 },
    crops: ['https://cdn.test/crop-1.jpg'],
    images: ['https://cdn.test/image-1.jpg'],
    logo: 'https://cdn.test/site-logo.png',
    brand: { background: null, text: null, accent: null, fontFamily: null },
    content: { headline: 'Build faster with Globex', headings: ['Plan it', 'Ship it'], ctas: ['Start free'] },
    transient: false,
    ...over,
  });
  const brandKit = { businessName: 'Old Client Co', logo: 'https://cdn.test/kit-logo.png', colors: null, notes: null };

  it('names the film after the site the user gave, not the Brand Kit company, and uses the site\'s words', async () => {
    vi.mocked(captureSite).mockResolvedValueOnce(capture());
    const req = parseFilmRequest('a promo for https://globex.example with the Ink Press template');
    const result = await storyboardFilm(req, { template: 'inkpress', durationSec: 20, aspectRatio: '16:9', brandKit }, () => {});
    expect(result.plan.scenes[0].headline).toContain('Globex');
    expect(JSON.stringify(result.plan)).not.toContain('Old Client');
    expect(result.plan.scenes[0].caption).toBe('Build faster with Globex');
    expect(result.plan.scenes[result.plan.scenes.length - 1].caption).toBe('Start free');
  });

  it('uses the Brand Kit company only when there is no site, and the site logo over the Brand Kit logo', async () => {
    const noSite = await storyboardFilm(parseFilmRequest('a promo with the Ink Press template'), { template: 'inkpress', durationSec: 20, aspectRatio: '16:9', brandKit }, () => {});
    expect(noSite.plan.scenes[0].headline).toContain('Old Client');
    const result = await storyboardFilm(parseFilmRequest('a promo for https://globex.example with the Ink Press template'), { template: 'inkpress', durationSec: 20, aspectRatio: '16:9', brandKit, capture: capture() }, () => {});
    const project = await buildFilmProject(result.plan, { aspectRatio: '16:9', capture: capture(), media: [], logo: brandKit.logo }, () => {});
    const titles = project.tracks.flatMap((t) => t.clips).filter((c) => c.cardId === 'inkpress-title-card');
    for (const t of titles) expect(t.props.logo).toBe('https://cdn.test/site-logo.png');
  });

  it('puts a picture of the site on every picked shot that cannot draw captured pages itself', async () => {
    const codeShots = MOTION_TEMPLATES.filter((t) => ['HitCounter', 'BrandInkOpen'].includes(t.componentName));
    expect(codeShots).toHaveLength(2);
    const result = await storyboardFilm(parseFilmRequest(`a promo for globex.example with ${codeShots.map((t) => t.componentName).join(' and ')}`), { template: 'director', durationSec: 12, aspectRatio: '16:9', capture: capture() }, () => {});
    const project = await buildFilmProject(result.plan, { aspectRatio: '16:9', capture: capture(), media: [] }, () => {});
    const insets = project.tracks.find((t) => t.name === 'Site')?.clips ?? [];
    expect(insets).toHaveLength(2);
    expect(insets.every((c) => c.cardId === 'site-inset' && String(c.props.file).startsWith('https://cdn.test/'))).toBe(true);
    // The two insets alternate sides and use different pictures.
    expect(new Set(insets.map((c) => c.props.side)).size).toBe(2);
    expect(new Set(insets.map((c) => c.props.file)).size).toBe(2);
  });

  it('a captured site without a logo does not get the Brand Kit logo; the Brand Kit company is not sent to the director for a site film', async () => {
    const { requestPlan } = await import('../lib/directorClient');
    vi.mocked(requestPlan).mockClear();
    const noLogo = capture({ logo: null });
    const result = await storyboardFilm(parseFilmRequest('a promo for https://globex.example with the Ink Press template'), { template: 'director', durationSec: 20, aspectRatio: '16:9', brandKit, capture: noLogo }, () => {});
    const sent = vi.mocked(requestPlan).mock.calls[0][0].brandKit as { businessName: string | null; logo: string };
    expect(sent.businessName).toBeNull();
    expect(sent.logo).toBe('https://cdn.test/kit-logo.png');
    const project = await buildFilmProject(result.plan, { aspectRatio: '16:9', capture: noLogo, media: [], logo: brandKit.logo }, () => {});
    const titles = project.tracks.flatMap((t) => t.clips).filter((c) => c.cardId === 'inkpress-title-card');
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) expect(t.props.logo).toBeUndefined();
  });
});

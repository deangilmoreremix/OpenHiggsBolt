// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectData } from '../types';

const project = (): ProjectData => ({
  name: 't', fps: 30, width: 1920, height: 1080, background: '#000',
  tracks: [{ id: 'tr', name: 'Shots', clips: [0, 90, 180].map((start, i) => ({ id: `c${i}`, cardId: 'demo:RowEmbed', start, duration: 90, inOffset: 0, speed: 1, opacity: 1, scale: 1, x: 0, y: 0, props: {} })) }],
} as unknown as ProjectData);

afterEach(() => vi.resetModules());

describe('frame QA', () => {
  it('reports how many frames it checked when a stop ends it early', async () => {
    const controller = new AbortController();
    let rendered = 0;
    vi.doMock('../webRenderer', () => ({ renderStillOnWebExport: vi.fn(async () => { if (++rendered === 2) controller.abort(); return { blob: new Blob() }; }) }));
    const { checkFilmFrames } = await import('../lib/filmPipeline');
    const logs: string[] = [];
    const out = await checkFilmFrames(project(), (l) => logs.push(l), 30_000, controller.signal);
    expect(out.checked).toBe(2);
    expect(out.total).toBeGreaterThan(out.checked);
  });

  it('does not blame the browser when the time budget ran out before any frame', async () => {
    vi.doMock('../webRenderer', () => ({ renderStillOnWebExport: vi.fn((_p: unknown, _f: number, signal: AbortSignal) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))) }));
    const { checkFilmFrames } = await import('../lib/filmPipeline');
    const logs: string[] = [];
    const out = await checkFilmFrames(project(), (l) => logs.push(l), 20);
    expect(out.checked).toBe(0);
    expect(logs.join('\n')).toMatch(/time budget ran out/);
    expect(logs.join('\n')).not.toMatch(/cannot render stills/);
  });
});

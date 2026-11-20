// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

const exported: Array<{ tracks: string[] }> = [];
vi.mock('../webRenderer', async (orig) => {
  const real = await orig<typeof import('../webRenderer')>();
  let n = 0;
  return {
    ...real,
    exportMp4: vi.fn(async (opts: { project: { tracks: Array<{ name: string }> } }) => { exported.push({ tracks: opts.project.tracks.map((t) => t.name) }); return { blob: new Blob([`v${++n}`]) }; }),
    createDownloadUrl: vi.fn((b: Blob) => `blob:${(b as Blob).size}-${exported.length}`),
    guardTabWhileRendering: vi.fn(() => () => {}),
    registerParityHook: vi.fn(() => () => {}),
  };
});
vi.mock('@remotion/player', () => ({ Player: () => null }));
vi.mock('../lib/renderedAudio', () => ({ measureRenderedAudio: vi.fn(async () => null), audioReport: () => [] }));

import { FilmResultCard } from '../components/FilmDirectorChat';

const clip = (id: string) => ({ id, cardId: 'demo:X', start: 0, duration: 90, inOffset: 0, speed: 1, opacity: 1, scale: 1, x: 0, y: 0, props: {} });
const project = { name: 'Film', width: 1920, height: 1080, fps: 30, tracks: [{ id: 't1', name: 'Shots', clips: [clip('a')] }, { id: 't2', name: 'Music', role: 'music' as const, clips: [clip('m')] }] } as never;

describe('render both versions (upstream delivers with and without the music bed)', () => {
  it('renders twice, the second without the music track, and leaves both downloads', async () => {
    render(<FilmResultCard project={project} />);
    await act(async () => { fireEvent.click(screen.getByTestId('film-render-both')); });
    await vi.waitFor(() => expect(screen.getByTestId('film-download')).toBeTruthy());
    expect(exported.length).toBe(2);
    expect(exported[0].tracks).toContain('Music');
    expect(exported[1].tracks).not.toContain('Music');
    expect(screen.getByTestId('film-download-other').textContent).toMatch(/with music/);
  });
});

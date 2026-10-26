// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const calls: Array<{ prompt: string; capture: unknown; single: string | null }> = [];
/** When set, storyboards wait for it — to finish one after the conversation was reset. */
let gate: Promise<void> | null = null;
vi.mock('../lib/filmPipeline', async (orig) => {
  const real = await orig<typeof import('../lib/filmPipeline')>();
  const { inkPressPlan } = await import('../lib/filmChat');
  return {
    ...real,
    storyboardFilm: vi.fn(async (req: { prompt: string; siteUrl: string | null; single: { componentName: string } | null }, opts: { capture: unknown; durationSec: number }) => {
      calls.push({ prompt: req.prompt, capture: opts.capture, single: req.single?.componentName ?? null });
      if (gate) await gate;
      const capture = req.siteUrl ? { url: `https://${req.siteUrl}/`, title: 'Acme', page: { url: 'p', width: 1, height: 1 }, crops: [], brand: {} } : opts.capture;
      return { plan: inkPressPlan({ prompt: req.prompt, durationSec: 10 }), capture, source: 'inkpress' };
    }),
  };
});

import { useFilmDirector } from '../components/useFilmDirector';

const settings = () => ({ aspectRatio: '16:9' as const, durationSec: 10, brandKit: null, media: [], pickedRecipes: [] });
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('useFilmDirector', () => {
  it('reuses the site capture for a storyboard revision, not for a new film', async () => {
    calls.length = 0;
    const { result } = renderHook(() => useFilmDirector({ settings }));
    act(() => { result.current.send('Make a launch film for acme.io with the Ink Press template', { force: true }); });
    await flush();
    expect(result.current.stage).toBe('plan');
    expect(result.current.storyboard?.capture).toBeTruthy();

    // A revision keeps the capture…
    act(() => { result.current.send('use crash-zoom-punch instead'); });
    await flush();
    expect(calls[1].capture).toBeTruthy();

    // …a new film (asked for while that storyboard is open) without a URL does not inherit it.
    act(() => { result.current.send('Make another promo for my other product with the Ink Press template', { force: true }); });
    await flush();
    expect(calls[2].capture).toBeNull();
  });

  it('with editFallback, a non-answer to the Ink Press question goes back as an edit', async () => {
    const { result } = renderHook(() => useFilmDirector({ settings, editFallback: true }));
    act(() => { result.current.send('make a promo for my product'); });
    expect(result.current.stage).toBe('offer');
    let handled = true;
    act(() => { handled = result.current.send('make the text bigger'); });
    expect(handled).toBe(false);
    expect(result.current.stage).toBe('offer');
  });

  it('a storyboard that finishes after a reset (session switch) is dropped', async () => {
    let release!: () => void;
    gate = new Promise<void>((r) => { release = r; });
    const { result } = renderHook(() => useFilmDirector({ settings }));
    act(() => { result.current.send('Make a launch film for acme.io with the Ink Press template', { force: true }); });
    expect(result.current.stage).toBe('storyboarding');
    act(() => { result.current.reset(); });
    release();
    await flush();
    gate = null;
    expect(result.current.stage).toBe('idle');
    expect(result.current.storyboard).toBeNull();
    expect(result.current.messages).toEqual([]);
  });

  it('revising a one-shot film swaps the shot', async () => {
    calls.length = 0;
    const { result } = renderHook(() => useFilmDirector({ settings }));
    act(() => { result.current.send('Design a product close-up inspired by spotlight-hero-card', { force: true }); });
    await flush();
    expect(calls[0].single).toBe('SpotlightHeroCard');
    act(() => { result.current.send('use CrashZoomReal instead'); });
    await flush();
    expect(calls[1].single).toBe('CrashZoomReal');
    act(() => { result.current.send('make it a bit longer'); });
    await flush();
    expect(calls[2].single).toBe('CrashZoomReal');
  });

  it('walks the seven workflow steps from Product to Storyboard', async () => {
    const { result } = renderHook(() => useFilmDirector({ settings }));
    expect(result.current.steps.map((st) => st.state)).toEqual(Array(7).fill('todo'));
    act(() => { result.current.send('Make a launch film for acme.io with the Ink Press template', { force: true }); });
    const state = () => Object.fromEntries(result.current.steps.map((st) => [st.id, st.state]));
    expect(state()).toMatchObject({ product: 'done', capture: 'active', storyboard: 'active', animate: 'todo' });
    await flush();
    expect(state()).toMatchObject({ product: 'done', storyboard: 'done', animate: 'todo', deliver: 'todo' });
    expect(result.current.steps.map((st) => st.title)).toEqual(['Product', 'Capture', 'Storyboard', 'Animate', 'Beat sync', 'Frame QA', 'Deliver']);
  });
});

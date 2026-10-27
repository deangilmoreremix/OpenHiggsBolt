// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const calls: Array<{ prompt: string; capture: unknown; single: string | null; durationSec: number; recipes: string[] }> = [];
/** When set, storyboards wait for it — to finish one after the conversation was reset. */
let gate: Promise<void> | null = null;
/** When set, the build (frame QA) waits for it. */
let buildGate: Promise<void> | null = null;
vi.mock('../lib/filmPipeline', async (orig) => {
  const real = await orig<typeof import('../lib/filmPipeline')>();
  const { inkPressPlan, singleShotPlan } = await import('../lib/filmChat');
  return {
    ...real,
    storyboardFilm: vi.fn(async (req: { prompt: string; siteUrl: string | null; durationSec: number | null; recipes: { componentName: string }[]; single: Parameters<typeof singleShotPlan>[0] | null }, opts: { capture: unknown; durationSec: number }) => {
      calls.push({ prompt: req.prompt, capture: opts.capture, single: req.single?.componentName ?? null, durationSec: opts.durationSec, recipes: req.recipes.map((t) => t.componentName) });
      if (gate) await gate;
      const capture = req.siteUrl ? { url: `https://${req.siteUrl}/`, title: 'Acme', page: { url: 'p', width: 1, height: 1 }, crops: [], brand: {} } : opts.capture;
      const plan = req.single ? singleShotPlan(req.single, { prompt: req.prompt, durationSec: req.durationSec }) : inkPressPlan({ prompt: req.prompt, durationSec: 10 });
      return { plan, capture, source: 'inkpress' };
    }),
    // Frame QA renders in a real browser; here it just waits on the gate.
    checkFilmFrames: vi.fn(async () => {
      if (buildGate) await buildGate;
      return { checked: 0, failed: [] };
    }),
  };
});

import { useFilmDirector } from '../components/useFilmDirector';
import { MOTION_TEMPLATES, motionTemplateTitle } from '@/data/motionRecipeCatalog';

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

  it('a different company typed while a storyboard is open starts a new film; "New film" resets', async () => {
    calls.length = 0;
    const { result } = renderHook(() => useFilmDirector({ settings }));
    act(() => { result.current.send('Make a launch film for acme.io with the Ink Press template', { force: true }); });
    await flush();
    expect(result.current.stage).toBe('plan');
    act(() => { result.current.send('make a promo for https://globex.com with the Ink Press template'); });
    await flush();
    // A new film: the earlier site's capture is not carried over, and the new URL is requested.
    expect(calls).toHaveLength(2);
    expect(calls[1].prompt).not.toContain('Revise:');
    expect(calls[1].capture).toBeNull();
    act(() => { result.current.reset(); });
    expect(result.current.stage).toBe('idle');
    expect(result.current.messages).toEqual([]);
  });

  it('a bare new-site message ("now beta.dev") with a storyboard open starts a film instead of being dropped', async () => {
    calls.length = 0;
    const { result } = renderHook(() => useFilmDirector({ settings }));
    act(() => { result.current.send('Make a launch film for acme.io with the Ink Press template', { force: true }); });
    await flush();
    let handled = false;
    act(() => { handled = result.current.send('now beta.dev'); });
    expect(handled).toBe(true);
    expect(result.current.stage).toBe('offer');
  });

  it('shots picked while the storyboard is open are added to it', async () => {
    calls.length = 0;
    const picked = [MOTION_TEMPLATES.find((t) => t.componentName === 'HitCounter')!];
    let picks: typeof picked = [];
    const { result } = renderHook(() => useFilmDirector({ settings: () => ({ ...settings(), pickedRecipes: picks }) }));
    act(() => { result.current.send('Make a launch film for acme.io with the Ink Press template', { force: true }); });
    await flush();
    picks = picked;
    act(() => { result.current.send('Add the shot cards I picked: Hit Counter'); });
    await flush();
    expect(calls[1].recipes).toContain('HitCounter');
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
    act(() => { result.current.send('make it 7 seconds'); });
    await flush();
    expect(calls[3].single).toBe('CrashZoomReal');
    expect(result.current.storyboard?.plan.scenes[0].durationSec).toBe(7);
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

  it('keeps the length and instructions given with the Ink Press answer', async () => {
    calls.length = 0;
    const { result } = renderHook(() => useFilmDirector({ settings }));
    act(() => { result.current.send('make a promo for my product'); });
    expect(result.current.stage).toBe('offer');
    act(() => { result.current.send('yes, make it 30 seconds and emphasize team collaboration'); });
    await flush();
    expect(calls[0].durationSec).toBe(30);
    expect(calls[0].prompt).toContain('emphasize team collaboration');
  });

  it('a film still building when the chat unmounts is never installed', async () => {
    const build = async (unmountMidway: boolean) => {
      const onBuilt = vi.fn();
      const { result, unmount } = renderHook(() => useFilmDirector({ settings, onBuilt }));
      act(() => { result.current.send('Make a launch film for acme.io with the Ink Press template', { force: true }); });
      await flush();
      expect(result.current.stage).toBe('plan');
      let release!: () => void;
      buildGate = new Promise<void>((r) => { release = r; });
      act(() => { void result.current.approve(); });
      if (unmountMidway) unmount();
      release();
      await flush();
      buildGate = null;
      if (!unmountMidway) unmount();
      return onBuilt;
    };
    expect(await build(false)).toHaveBeenCalledTimes(1);
    expect(await build(true)).not.toHaveBeenCalled();
  });

  it('a picker-only request uses exactly the picked shots, variants included', async () => {
    calls.length = 0;
    const picked = [MOTION_TEMPLATES.find((t) => t.componentName === 'CrashZoomReal')!];
    const withPicks = () => ({ ...settings(), pickedRecipes: picked });
    const { result } = renderHook(() => useFilmDirector({ settings: withPicks }));
    act(() => { result.current.send(`Make a film with the shot cards I picked: ${picked.map(motionTemplateTitle).join(', ')}`, { force: true }); });
    await flush();
    expect(calls[0].recipes).toEqual(['CrashZoomReal']);
  });

  it('asks for at most the shots a storyboard can hold, and says what was dropped', async () => {
    calls.length = 0;
    const picked = MOTION_TEMPLATES.slice(0, 13);
    const { result } = renderHook(() => useFilmDirector({ settings: () => ({ ...settings(), pickedRecipes: picked }) }));
    act(() => { result.current.send('make a promo with these', { force: true }); });
    await flush();
    expect(calls[0].recipes).toHaveLength(12);
    expect(result.current.messages.some((m) => /up to 12 chosen shots/.test(m.content))).toBe(true);
  });

  it('a single-shot request with more shots picked in Templates builds a film of them all', async () => {
    calls.length = 0;
    const extra = MOTION_TEMPLATES.find((t) => t.componentName === 'RowEmbed')!;
    const { result } = renderHook(() => useFilmDirector({ settings: () => ({ ...settings(), pickedRecipes: [extra] }) }));
    act(() => { result.current.send('Design a product close-up inspired by spotlight-hero-card', { force: true }); });
    await flush();
    expect(calls[0].single).toBeNull();
    expect(calls[0].recipes).toEqual(['SpotlightHeroCard', 'RowEmbed']);
  });

  it('builds with the attachments the approved storyboard was planned with', async () => {
    let media: Array<{ id: string; kind: 'video'; name: string; url: string; size: number; durationSec: number }> = [
      { id: 'v', kind: 'video', name: 'demo.mp4', url: 'blob:demo', size: 1, durationSec: 4 },
    ];
    const onBuilt = vi.fn();
    const { result } = renderHook(() => useFilmDirector({ settings: () => ({ ...settings(), media }), onBuilt }));
    act(() => { result.current.send('Make a launch film for acme.io with the Ink Press template', { force: true }); });
    await flush();
    expect(result.current.storyboard?.videos).toEqual([{ name: 'demo.mp4', sec: 4 }]);
    media = []; // removed after the storyboard was shown
    await act(async () => { await result.current.approve(); });
    const project = onBuilt.mock.calls[0][0].project as { tracks: { clips: { cardId: string }[] }[] };
    expect(project.tracks.flatMap((t) => t.clips).some((c) => c.cardId === 'video-clip')).toBe(true);
  });

  it('a video length probed after the storyboard does not change the approved film', async () => {
    const video = { id: 'v', kind: 'video' as const, name: 'demo.mp4', url: 'blob:demo', size: 1, durationSec: undefined as number | undefined };
    const onBuilt = vi.fn();
    const { result } = renderHook(() => useFilmDirector({ settings: () => ({ ...settings(), media: [video] }), onBuilt }));
    act(() => { result.current.send('Make a launch film for acme.io with the Ink Press template', { force: true }); });
    await flush();
    expect(result.current.storyboard?.videos).toEqual([{ name: 'demo.mp4', sec: 4 }]);
    video.durationSec = 8; // the metadata probe finishes on the same attachment object
    await act(async () => { await result.current.approve(); });
    const clips = (onBuilt.mock.calls[0][0].project as { tracks: { clips: { cardId: string; duration: number }[] }[] }).tracks.flatMap((t) => t.clips);
    expect(clips.find((c) => c.cardId === 'video-clip')?.duration).toBe(120); // 4 s at 30 fps, as approved
  });

  it('Stop drops a storyboard in progress and ignores its late result', async () => {
    let release!: () => void;
    gate = new Promise<void>((r) => { release = r; });
    const { result } = renderHook(() => useFilmDirector({ settings }));
    act(() => { result.current.send('Make a launch film for acme.io with the Ink Press template', { force: true }); });
    expect(result.current.stage).toBe('storyboarding');
    act(() => { result.current.stop(); });
    expect(result.current.stage).toBe('idle');
    release();
    await flush();
    gate = null;
    expect(result.current.stage).toBe('idle');
    expect(result.current.storyboard).toBeNull();
    expect(result.current.messages.at(-1)?.content).toMatch(/^Stopped\./);
  });

  it('Stop during the build keeps the storyboard to approve again', async () => {
    const onBuilt = vi.fn();
    const { result } = renderHook(() => useFilmDirector({ settings, onBuilt }));
    act(() => { result.current.send('Make a launch film for acme.io with the Ink Press template', { force: true }); });
    await flush();
    let release!: () => void;
    buildGate = new Promise<void>((r) => { release = r; });
    act(() => { void result.current.approve(); });
    expect(result.current.stage).toBe('building');
    act(() => { result.current.stop(); });
    expect(result.current.stage).toBe('plan');
    expect(result.current.storyboard).not.toBeNull();
    release();
    await flush();
    buildGate = null;
    expect(onBuilt).not.toHaveBeenCalled();
    expect(result.current.film).toBeNull();
  });
});

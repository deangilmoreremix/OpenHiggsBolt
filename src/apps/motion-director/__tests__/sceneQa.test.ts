// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { ClipData, ProjectData } from '../types';
import { CONTENT_PROPS, diffShare, recordScenes, soloProject, validateShotScenes } from '../lib/sceneQa';
import type { SceneRecord } from '../lib/productionRun';

const clip = (id: string, stem: string, start: number, props: Record<string, unknown> = {}): ClipData => ({ id, cardId: `demo:${stem}`, start, duration: 60, props } as unknown as ClipData);
const project = (clips: ClipData[]): ProjectData => ({ name: 'p', fps: 30, width: 1920, height: 1080, brand: { name: 'Acme' } as never, tracks: [{ id: 't', name: 'shots', clips }] } as unknown as ProjectData);
const px = (v: number, n = 100) => ({ data: new Uint8ClampedArray(n * 4).fill(v), width: 10, height: 10 });

describe('scene visual validation', () => {
  it('renders the clip alone, with and without the person\'s content', () => {
    const c = clip('a', 'SpotlightHeroCard', 300, { screens: ['x'], accent: '#f00', texts: { a: 'b' } });
    const mine = soloProject(project([c]), c, false);
    const plain = soloProject(project([c]), c, true);
    expect(mine.tracks[0].clips[0].start).toBe(0);
    expect(mine.tracks[0].clips[0].props).toMatchObject({ screens: ['x'], texts: { a: 'b' } });
    expect(Object.keys(plain.tracks[0].clips[0].props ?? {})).toEqual(['accent']);
    expect(plain.brand).toBeUndefined();
    expect(CONTENT_PROPS).toContain('adaptedCode');
  });
  it('passes when the content changes the frame, fails when the shot looks like the sample', async () => {
    const a = clip('a', 'SpotlightHeroCard', 0, { screens: ['x'] });
    const b = clip('b', 'DeckDealFlyin', 60, { screens: ['x'] });
    const res = await validateShotScenes(project([a, b]), { pixels: async (p) => (p.tracks[0].clips[0].id === 'a' && Object.keys(p.tracks[0].clips[0].props ?? {}).includes('screens') ? px(255) : px(0)) });
    // clip a: with-content frame (255) differs from plain (0) -> passed; clip b: identical (0 vs 0 isn't the case: with-content is 0 too) -> failed
    expect(res.find((r) => r.clipId === 'a')?.state).toBe('passed');
    expect(res.find((r) => r.clipId === 'b')?.state).toBe('failed');
    expect(res.find((r) => r.clipId === 'b')?.note).toMatch(/same as the sample/);
  });
  it('an abstract recipe has nothing to replace; an unrenderable or out-of-time shot stays pending (never passed)', async () => {
    const abs = clip('r', 'RadialWave', 0);
    const real = clip('s', 'SpotlightHeroCard', 60, { screens: ['x'] });
    const bad = await validateShotScenes(project([abs, real]), { pixels: async () => { throw new Error('boom'); } });
    expect(bad.find((r) => r.clipId === 'r')?.state).toBe('passed');
    expect(bad.find((r) => r.clipId === 's')?.state).toBe('pending');
    const late = await validateShotScenes(project([real]), { pixels: async () => px(0) }, { budgetMs: -1 });
    expect(late[0].state).toBe('pending');
  });
  it('diffShare counts only pixels beyond the tolerance and treats a size mismatch as different', () => {
    expect(diffShare(px(0), px(10))).toBe(0);
    expect(diffShare(px(0), px(200))).toBe(1);
    expect(diffShare(px(0), { ...px(0), width: 5 })).toBe(1);
  });
  it('overlays the check onto the storyboard\'s scene records', () => {
    const base: SceneRecord[] = [
      { n: 1, recipeId: '', component: '', needs: 'text', assets: { state: 'satisfied', refs: [] }, personalization: 'parameterized', validation: { state: 'pending' } },
      { n: 2, recipeId: 'x', component: 'SpotlightHeroCard', needs: 'page', assets: { state: 'satisfied', refs: ['1 page'] }, personalization: 'pending', validation: { state: 'pending' } },
    ];
    const c = clip('a', 'SpotlightHeroCard', 90, { screens: ['x', 'y'] });
    const out = recordScenes(base, project([c]), [{ clipId: 'a', stem: 'SpotlightHeroCard', state: 'passed', frames: [30, 57], note: 'ok' }]);
    expect(out[1]).toMatchObject({ personalization: 'parameterized', validation: { state: 'passed', frames: [30, 57] } });
    expect(out[0].validation.state).toBe('passed');
  });
});

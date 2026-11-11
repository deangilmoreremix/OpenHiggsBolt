// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { ClipData, ProjectData } from '../types';
import { CONTENT_PROPS, recordScenes, soloProject, validateShotScenes } from '../lib/sceneQa';
import { checkShot, checksPassed, colourFootprint, diffShare, judgementItems, lumaSpread, pictureColours, type Pixels } from '../lib/sceneChecks';
import type { SceneRecord } from '../lib/productionRun';

const clip = (id: string, stem: string, start: number, props: Record<string, unknown> = {}): ClipData => ({ id, cardId: `demo:${stem}`, start, duration: 60, props } as unknown as ClipData);
const project = (clips: ClipData[]): ProjectData => ({ name: 'p', fps: 30, width: 1920, height: 1080, brand: { name: 'Acme' } as never, tracks: [{ id: 't', name: 'shots', clips }] } as unknown as ProjectData);
/** A 20x20 frame: background plus an optional coloured rectangle [x0,y0,x1,y1]. */
const frame = (bg: number, rect?: { box: [number, number, number, number]; rgb: [number, number, number] }): Pixels => {
  const w = 20, h = 20, data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const inside = rect && x >= rect.box[0] && x < rect.box[2] && y >= rect.box[1] && y < rect.box[3];
    const c = inside ? rect!.rgb : [bg, bg, bg];
    data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
  }
  return { data, width: w, height: h };
};
const PINK: [number, number, number] = [236, 0, 140];

describe('scene checkpoint properties', () => {
  it('measures blankness, change, colour position', () => {
    expect(lumaSpread(frame(120))).toBe(0);
    expect(lumaSpread(frame(0, { box: [0, 0, 10, 20], rgb: [255, 255, 255] }))).toBeGreaterThan(50);
    expect(diffShare(frame(0), frame(0, { box: [0, 0, 10, 20], rgb: [255, 255, 255] }))).toBeCloseTo(0.5, 1);
    const fp = colourFootprint(frame(200, { box: [4, 4, 12, 12], rgb: PINK }), PINK)!;
    expect(fp.share).toBeCloseTo(64 / 400, 2);
    expect(fp.cx).toBeCloseTo(0.4, 1);
    expect(pictureColours(frame(10, { box: [0, 0, 20, 10], rgb: PINK })).length).toBeGreaterThanOrEqual(2);
  });
  it('a shot whose frames carry the supplied picture, move, and stay inside the frame passes; every mechanical property is tagged', () => {
    const pts = (name: 'entering' | 'peak' | 'settled', box: [number, number, number, number]) => ({ name, mine: frame(30, { box, rgb: PINK }), plain: frame(30) });
    const checks = checkShot({ checkpoints: [pts('entering', [1, 1, 9, 9]), pts('peak', [4, 4, 14, 14]), pts('settled', [5, 5, 15, 15])], supplied: [PINK] });
    expect(checksPassed(checks)).toBe(true);
    for (const p of ['visibility', 'motionProgression', 'assetIdentity', 'clipping']) expect(checks.some((c) => c.property === p && c.kind === 'mechanical'), p).toBe(true);
    expect(judgementItems(checks).join(' ')).toMatch(/cameraTarget/);
    expect(checks.filter((c) => c.kind === 'needs-visual-judgement').every((c) => c.ok)).toBe(true); // listed, not counted either way
  });
  it('fails a blank frame, a still shot, a shot without the supplied picture, and a picture cut off by the frame edge', () => {
    const still = (n: 'entering' | 'peak' | 'settled') => ({ name: n, mine: frame(30, { box: [5, 5, 12, 12], rgb: PINK }), plain: frame(30) });
    const stillChecks = checkShot({ checkpoints: [still('entering'), still('peak'), still('settled')], supplied: [PINK] });
    expect(stillChecks.find((c) => c.property === 'motionProgression')?.ok).toBe(false);
    const blank = (n: 'entering' | 'peak' | 'settled') => ({ name: n, mine: frame(120), plain: frame(120) });
    const b = checkShot({ checkpoints: [blank('entering'), blank('peak'), blank('settled')], supplied: [PINK] });
    expect(b.find((c) => c.property === 'visibility')?.ok).toBe(false);
    expect(b.find((c) => c.property === 'assetIdentity')?.ok).toBe(false);
    const edge = (n: 'entering' | 'peak' | 'settled') => ({ name: n, mine: frame(30, { box: [0, 0, 20, 14], rgb: PINK }), plain: frame(30) });
    const clipped = checkShot({ checkpoints: [edge('entering'), edge('peak'), edge('settled')], supplied: [PINK] });
    expect(clipped.find((c) => c.property === 'clipping')?.ok).toBe(false);
  });
  it('a camera shot that moves into the picture is not "cut off" by filling the frame: that is judged visually', () => {
    const edge = (n: 'entering' | 'peak' | 'settled') => ({ name: n, mine: frame(30, { box: [0, 0, 20, 14], rgb: PINK }), plain: frame(30) });
    const c = checkShot({ checkpoints: [edge('entering'), edge('peak'), edge('settled')], supplied: [PINK], fillsFrame: true });
    expect(c.find((x) => x.property === 'clipping')?.kind).toBe('needs-visual-judgement');
    expect(c.filter((x) => x.kind === 'mechanical').every((x) => x.ok || x.property === 'motionProgression')).toBe(true);
  });
  it('the plain recipe already showing the colour is not credit for the person\'s picture', () => {
    const p = (n: 'entering' | 'peak' | 'settled') => ({ name: n, mine: frame(30, { box: [2, 2, 12, 12], rgb: PINK }), plain: frame(30, { box: [2, 2, 12, 12], rgb: PINK }) });
    expect(checkShot({ checkpoints: [p('entering'), p('peak'), p('settled')], supplied: [PINK] }).find((c) => c.property === 'assetIdentity')?.ok).toBe(false);
  });
  it('unreadable pictures are judged visually, with only the difference from the plain recipe counted', () => {
    const p = (n: 'entering' | 'peak' | 'settled') => ({ name: n, mine: frame(30, { box: [2, 2, 12, 12], rgb: PINK }), plain: frame(30) });
    const c = checkShot({ checkpoints: [p('entering'), p('peak'), p('settled')], supplied: null });
    expect(c.find((x) => x.property === 'assetIdentity')?.kind).toBe('needs-visual-judgement');
    expect(c.find((x) => x.property === 'differsFromSample')?.ok).toBe(true);
  });
});

describe('scene validation of a film', () => {
  it('renders the clip alone, with and without the person\'s content', () => {
    const c = clip('a', 'SpotlightHeroCard', 300, { screens: ['x'], accent: '#f00', texts: { a: 'b' } });
    expect(soloProject(project([c]), c, false).tracks[0].clips[0].start).toBe(0);
    expect(Object.keys(soloProject(project([c]), c, true).tracks[0].clips[0].props ?? {})).toEqual(['accent']);
    expect(CONTENT_PROPS).toContain('adaptedCode');
  });
  it('checks entering, peak and settled for every shot, and fails the one that never shows the person\'s picture', async () => {
    const good = clip('a', 'SpotlightHeroCard', 0, { screens: ['p1'] });
    const bad = clip('b', 'DeckDealFlyin', 60, { screens: ['p2'] });
    const seen: number[] = [];
    const res = await validateShotScenes(project([good, bad]), {
      picture: async () => frame(10, { box: [0, 0, 20, 10], rgb: PINK }),
      pixels: async (p, f) => {
        seen.push(f);
        const mine = Object.keys(p.tracks[0].clips[0].props ?? {}).includes('screens');
        const id = p.tracks[0].clips[0].id;
        // the good shot shows pink and moves with the frame; the bad one shows nothing of the person's
        return id === 'a' && mine ? frame(30, { box: [2, 2, 8 + (f % 7), 12], rgb: PINK }) : frame(30, { box: [1, 1, 5 + (f % 7), 5], rgb: [90, 90, 90] });
      },
    });
    expect(seen.length).toBe(12); // 2 shots x 3 checkpoints x (with, plain)
    const g = res.find((r) => r.clipId === 'a')!;
    expect(g.state).toBe('passed');
    expect(g.checks?.map((c) => c.frame)).toEqual(expect.arrayContaining(['entering', 'peak', 'settled']));
    const b = res.find((r) => r.clipId === 'b')!;
    expect(b.state).toBe('failed');
    expect(b.note).toMatch(/assetIdentity/);
  });
  it('an abstract recipe has nothing to replace; an unrenderable or out-of-time shot stays pending (never passed)', async () => {
    const abs = clip('r', 'RadialWave', 0);
    const real = clip('s', 'SpotlightHeroCard', 60, { screens: ['x'] });
    const bad = await validateShotScenes(project([abs, real]), { pixels: async () => { throw new Error('boom'); } });
    expect(bad.find((r) => r.clipId === 'r')?.state).toBe('passed');
    expect(bad.find((r) => r.clipId === 's')?.state).toBe('pending');
    expect((await validateShotScenes(project([real]), { pixels: async () => frame(0) }, { budgetMs: -1 }))[0].state).toBe('pending');
  });
  it('overlays the check onto the storyboard\'s scene records, with the shot\'s own fingerprint', () => {
    const base: SceneRecord[] = [
      { n: 1, recipeId: '', component: '', needs: 'text', assets: { state: 'satisfied', refs: [] }, personalization: 'parameterized', validation: { state: 'pending' } },
      { n: 2, recipeId: 'x', component: 'SpotlightHeroCard', needs: 'page', assets: { state: 'satisfied', refs: ['1 page'] }, personalization: 'pending', validation: { state: 'pending' } },
    ];
    const c = clip('a', 'SpotlightHeroCard', 90, { screens: ['x', 'y'] });
    const out = recordScenes(base, project([c]), [{ clipId: 'a', stem: 'SpotlightHeroCard', state: 'passed', frames: [12, 30, 57], note: 'ok', checks: [], judgement: ['cameraTarget'] }]);
    expect(out[1]).toMatchObject({ personalization: 'parameterized', validation: { state: 'passed', frames: [12, 30, 57] }, judgement: ['cameraTarget'] });
    expect(out[1].fingerprint).toHaveLength(32);
    const changed = recordScenes(base, project([clip('a', 'SpotlightHeroCard', 90, { screens: ['x', 'CHANGED'] })]), []);
    expect(changed[1].fingerprint).not.toBe(out[1].fingerprint);
  });
});

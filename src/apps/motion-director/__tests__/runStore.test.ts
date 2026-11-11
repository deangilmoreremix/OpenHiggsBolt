import { describe, expect, it } from 'vitest';
import { completeStage, newRun, startStage, type SceneRecord } from '../lib/productionRun';
import { adaptedOf, adaptedStub, clearCheckpoint, decideResume, loadCheckpoint, saveCheckpoint, RUN_STORE_KEY, type RunCheckpoint } from '../lib/runStore';
import { transplantAdaptation } from '../lib/editFilm';
import type { ProjectData } from '../types';

const mem = () => { const m = new Map<string, string>(); return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } }; };
const scene = (n: number, state: 'passed' | 'pending' = 'passed'): SceneRecord => ({ n, recipeId: `r${n}`, component: 'SpotlightHeroCard', needs: 'page', assets: { state: 'satisfied', refs: ['a'] }, personalization: 'adapted', validation: { state } } as SceneRecord);
const plan = { title: 't', scenes: [{ recipeId: 'x' }] } as never;
const midBuild = (): ProductionRun0 => {
  let r = newRun('make a film', 'autonomous', 1000);
  r = completeStage(r, { stage: 'brief', productName: 'Acme', kind: 'software', features: ['x'], objective: 'sell' });
  r = completeStage(r, { stage: 'direction', chosen: 'Ink' });
  r = completeStage(r, { stage: 'mapping', rows: [{ feature: 'f', firstShot: 's' }] });
  r = completeStage(r, { stage: 'storyboard', scenes: 3, failedChecks: [] });
  r = completeStage(r, { stage: 'assets', scenes: [scene(1)] });
  return startStage(r, 'build');
};
type ProductionRun0 = ReturnType<typeof newRun>;
const cp = (over: Partial<RunCheckpoint> = {}): RunCheckpoint => ({ v: 1, savedAt: 1, run: midBuild(), request: { prompt: 'p', aspectRatio: '16:9', template: 'director' }, storyboard: { plan, capture: null, source: 'director', media: [] }, adapted: [], ...over } as RunCheckpoint);

describe('checkpoint storage', () => {
  it('round-trips and holds no key material', () => {
    const s = mem();
    expect(saveCheckpoint(cp(), s)).toBe(true);
    expect(loadCheckpoint(s)?.run.request).toBe('make a film');
    expect(s.m.get(RUN_STORE_KEY)).not.toMatch(/sk-|apiKey/i);
    clearCheckpoint(s);
    expect(loadCheckpoint(s)).toBeNull();
  });
  it('a corrupt or foreign slot reads as nothing, never throws', () => {
    const s = mem();
    s.setItem(RUN_STORE_KEY, '{not json');
    expect(loadCheckpoint(s)).toBeNull();
    s.setItem(RUN_STORE_KEY, JSON.stringify({ v: 99 }));
    expect(loadCheckpoint(s)).toBeNull();
  });
  it('over quota the large captures are dropped and the loss is recorded', () => {
    const s = mem();
    let first = true;
    const small = { ...s, setItem: (k: string, v: string) => { if (first) { first = false; throw new Error('quota'); } s.setItem(k, v); } };
    expect(saveCheckpoint(cp({ storyboard: { plan, capture: { page: { url: 'data:x' } } as never, source: 'director' } }), small)).toBe(true);
    expect(loadCheckpoint(s)?.storyboardDropped).toBe(true);
    expect(loadCheckpoint(s)?.storyboard?.capture).toBeNull();
  });
});

describe('what a reload does with a stored run', () => {
  it('nothing stored, or a finished/never-started run: no offer', () => {
    expect(decideResume(null).kind).toBe('none');
    expect(decideResume(cp({ run: newRun('x', 'autonomous') })).kind).toBe('none');
  });
  it('an interrupted build resumes at the build stage (the running stage is recorded as interrupted, not completed)', () => {
    const d = decideResume(cp({ adapted: [{ cardId: 'demo:A', nth: 0, adaptedCode: 'x' }] }), { hasKey: true });
    expect(d).toMatchObject({ kind: 'resume', from: 'build', kept: 1 });
  });
  it('stopped before a storyboard existed: start over (nothing is faked)', () => {
    let r = newRun('x', 'autonomous');
    r = completeStage(r, { stage: 'brief', productName: 'Acme', kind: 'software', features: ['x'], objective: 's' });
    r = startStage(r, 'direction');
    expect(decideResume(cp({ run: r, storyboard: undefined })).kind).toBe('restart');
  });
  it('pictures that only lived in the closed tab, a dropped capture and a missing key each need the person', () => {
    const d = decideResume(cp({ storyboard: { plan, capture: null, source: 'director', media: [{ id: '1', kind: 'image', name: 'kitchen.jpg', url: 'blob:abc', size: 1 }] }, storyboardDropped: true }), { hasKey: false });
    expect(d.kind).toBe('needs-input');
    if (d.kind === 'needs-input') { expect(d.needs.join(' ')).toContain('kitchen.jpg'); expect(d.needs.join(' ')).toContain('too large'); expect(d.needs.join(' ')).toContain('OpenAI key'); }
  });
  it('a built film is not "interrupted": its later stages belong to the Workbench', () => {
    let r = midBuild();
    r = completeStage(r, { stage: 'build', scenes: [scene(1)] });
    expect(decideResume(cp({ run: r })).kind).toBe('none');
  });
});

describe('adapted shots survive a resume', () => {
  const clip = (id: string, cardId: string, start: number, props?: Record<string, unknown>) => ({ id, cardId, start, duration: 30, props });
  const project = (clips: ReturnType<typeof clip>[]) => ({ tracks: [{ name: 'Shots', clips }] }) as unknown as ProjectData;
  it('collects adapted shots in film order and transplants them onto a rebuilt film', () => {
    const before = project([clip('a', 'demo:A', 0, { adaptedCode: 'CODE-A1' }), clip('b', 'demo:B', 30), clip('c', 'demo:A', 60, { adaptedCode: 'CODE-A2', adaptedStem: 'A' })]);
    const saved = adaptedOf(before as never);
    expect(saved.map((s) => [s.cardId, s.nth])).toEqual([['demo:A', 0], ['demo:A', 1]]);
    const fresh = project([clip('x', 'demo:A', 0), clip('y', 'demo:B', 30), clip('z', 'demo:A', 60)]);
    const t = transplantAdaptation(adaptedStub(saved) as never, fresh, new Set());
    const codes = t.project.tracks[0].clips.map((c) => c.props?.adaptedCode);
    expect(codes).toEqual(['CODE-A1', undefined, 'CODE-A2']);
    expect(t.kept).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';
import type { ClipData, ProjectData } from '../types';
import { clipFingerprint, filmFingerprint, hash128, shotFingerprints } from '../lib/filmFingerprint';
import { completeStage, finalStatus, newRun, startStage, type ReviewRecord } from '../lib/productionRun';

const clip = (id: string, cardId: string, start: number, props: Record<string, unknown> = {}, label = ''): ClipData => ({ id, cardId, start, duration: 60, props, label } as unknown as ClipData);
const film = (clips: ClipData[], extra: Partial<ProjectData> = {}): ProjectData => ({ name: 'f', fps: 30, width: 1920, height: 1080, tracks: [{ id: 't1', name: 'Shots', clips }], ...extra } as unknown as ProjectData);
const base = () => film([clip('a', 'demo:SpotlightHeroCard', 0, { screens: ['https://x/1.png'], adaptedCode: 'export const A = () => null;', texts: { a: 'b' } }), clip('s', 'audio-clip', 0, { file: 'sfx.mp3', volume: 0.6 })]);

describe('film fingerprint', () => {
  it('is stable across key order and ignores the production record', () => {
    const a = base();
    const b = film([clip('a', 'demo:SpotlightHeroCard', 0, { texts: { a: 'b' }, adaptedCode: 'export const A = () => null;', screens: ['https://x/1.png'] }), clip('s', 'audio-clip', 0, { volume: 0.6, file: 'sfx.mp3' })]);
    expect(filmFingerprint(a)).toBe(filmFingerprint(b));
    expect(filmFingerprint({ ...a, run: { id: 'x' } as never })).toBe(filmFingerprint(a));
  });
  it('changes with any caption, asset, adapted source, timing, sound or size change', () => {
    const f0 = filmFingerprint(base());
    const edits: Array<[string, ProjectData]> = [
      ['caption text', film([clip('a', 'demo:SpotlightHeroCard', 0, { screens: ['https://x/1.png'], adaptedCode: 'export const A = () => null;', texts: { a: 'c' } }), clip('s', 'audio-clip', 0, { file: 'sfx.mp3', volume: 0.6 })])],
      ['asset url', film([clip('a', 'demo:SpotlightHeroCard', 0, { screens: ['https://x/2.png'], adaptedCode: 'export const A = () => null;', texts: { a: 'b' } }), clip('s', 'audio-clip', 0, { file: 'sfx.mp3', volume: 0.6 })])],
      ['adapted source (same length)', film([clip('a', 'demo:SpotlightHeroCard', 0, { screens: ['https://x/1.png'], adaptedCode: 'export const B = () => null;', texts: { a: 'b' } }), clip('s', 'audio-clip', 0, { file: 'sfx.mp3', volume: 0.6 })])],
      ['timing', film([clip('a', 'demo:SpotlightHeroCard', 3, { screens: ['https://x/1.png'], adaptedCode: 'export const A = () => null;', texts: { a: 'b' } }), clip('s', 'audio-clip', 0, { file: 'sfx.mp3', volume: 0.6 })])],
      ['sound volume', film([clip('a', 'demo:SpotlightHeroCard', 0, { screens: ['https://x/1.png'], adaptedCode: 'export const A = () => null;', texts: { a: 'b' } }), clip('s', 'audio-clip', 0, { file: 'sfx.mp3', volume: 0.7 })])],
      ['size', { ...base(), width: 1280 }],
      ['brand', { ...base(), brand: { name: 'Acme' } as never }],
    ];
    for (const [label, p] of edits) expect(filmFingerprint(p), label).not.toBe(f0);
  });
  it('a same-length change to generated source is caught (a length "fingerprint" would miss it)', () => {
    const a = clip('a', 'demo:X', 0, { adaptedCode: 'aaaa' });
    const b = clip('a', 'demo:X', 0, { adaptedCode: 'aaab' });
    expect(clipFingerprint(a)).not.toBe(clipFingerprint(b));
    expect(hash128('x')).toHaveLength(32);
  });
  it('shot fingerprints are per clip: editing one shot leaves the others unchanged', () => {
    const p = film([clip('a', 'demo:A', 0, { x: 1 }), clip('b', 'demo:B', 60, { x: 2 })]);
    const q = film([clip('a', 'demo:A', 0, { x: 1 }), clip('b', 'demo:B', 60, { x: 3 })]);
    const [fp, fq] = [shotFingerprints(p), shotFingerprints(q)];
    expect(fp.a).toBe(fq.a);
    expect(fp.b).not.toBe(fq.b);
  });
});

describe('a stale review cannot approve a changed film', () => {
  const review = (fp: string): ReviewRecord => ({ ran: true, state: 'passed', findings: [], schemaValid: true, coversRequired: true, filmFingerprint: fp, criteria: ['P', 'F', 'V', 'S', 'B', 'D', 'Q'].map((g) => ({ id: `${g}1`, ok: true })) });
  it('review the film, edit a caption, and the approval no longer applies', () => {
    let r = newRun('x', 'autonomous');
    r = completeStage(r, { stage: 'brief', productName: 'A', kind: 'software', features: [], objective: 'o' });
    r = completeStage(r, { stage: 'direction', chosen: 'd' });
    r = completeStage(r, { stage: 'mapping', rows: [{ feature: 'f', firstShot: 's' }] });
    r = completeStage(r, { stage: 'storyboard', scenes: 3, failedChecks: [] });
    const scene = { n: 1, recipeId: 'r', component: 'SpotlightHeroCard', needs: 'page' as const, assets: { state: 'satisfied' as const, refs: [] }, personalization: 'parameterized' as const, validation: { state: 'passed' as const } };
    r = completeStage(r, { stage: 'assets', scenes: [scene] });
    r = completeStage(r, { stage: 'build', scenes: [scene] });
    r = completeStage(r, { stage: 'sound', cues: 3, track: null });
    r = completeStage(startStage(r, 'qa'), { stage: 'qa', issues: [], framesChecked: 5, required: 5, done: 5 });
    const reviewed = base();
    r = completeStage(r, { stage: 'review', review: review(filmFingerprint(reviewed)) });
    expect(finalStatus(r, filmFingerprint(reviewed))).toBe('ready');
    const edited = film([clip('a', 'demo:SpotlightHeroCard', 0, { screens: ['https://x/1.png'], adaptedCode: 'export const A = () => null;', texts: { a: 'EDITED' } }), clip('s', 'audio-clip', 0, { file: 'sfx.mp3', volume: 0.6 })]);
    expect(finalStatus(r, filmFingerprint(edited))).toBe('review-pending');
  });
});

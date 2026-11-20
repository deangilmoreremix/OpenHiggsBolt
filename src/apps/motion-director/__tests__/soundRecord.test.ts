// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { planToProject } from '../lib/buildFilm';
import { soundRecord } from '../lib/soundRecord';
import type { DirectorPlan } from '../lib/directorPlan';

const id = (c: string) => MOTION_TEMPLATES.find((t) => t.componentName === c)!.id;
const plan = (transitions: Array<'cut' | 'flash' | 'whip'>): DirectorPlan => ({ title: 't', summary: '', palette: { background: '#fff', text: '#000', accent: '#f50' }, scenes: [
  { kind: 'title', recipeId: '', durationSec: 3, headline: 'Open', caption: '', transition: 'cut' },
  { kind: 'shot', recipeId: id('SpotlightHeroCard'), durationSec: 6, headline: 'a', caption: 'b', transition: transitions[0] },
  { kind: 'shot', recipeId: id('MultiplaneReal'), durationSec: 5, headline: 'a', caption: 'b', transition: transitions[1] },
  { kind: 'title', recipeId: '', durationSec: 3, headline: 'End', caption: '', transition: transitions[2] },
] });
const without = (p: ReturnType<typeof planToProject>, pick: (c: { start: number; props?: Record<string, unknown> }) => boolean) => ({ ...p, tracks: p.tracks.map((t) => ({ ...t, clips: t.clips.filter((c) => !(c.cardId === 'audio-clip' && /sfxlib/.test(String(c.props?.file ?? '')) && pick(c))) })) });

describe('sound is judged by planned action, not by cut count', () => {
  it('a built film: every planned action has its sound on its frame; plain cuts and title cards are not failures', () => {
    const pl = plan(['flash', 'cut', 'cut']);
    const rec = soundRecord(planToProject(pl, { aspectRatio: '16:9' }), { plan: pl });
    expect(rec.planned).toBe(1); // only the flash is a planned action
    expect(rec.satisfied).toBe(1);
    expect(rec.missing).toEqual([]);
    expect(rec.mistimed).toEqual([]);
    expect(rec.problems).toBe(0);
    expect(rec.transitions.filter((t) => !t.required).every((t) => ['sfx', 'music-only', 'omitted-by-design', 'silent'].includes(t.sound))).toBe(true);
    expect(rec.licence.record).toMatch(/ATTRIBUTION/);
  });
  it('a plain cut with no sound is NOT a problem (music carries it, or it stays silent by design)', () => {
    const pl = plan(['flash', 'cut', 'cut']);
    const p = planToProject(pl, { aspectRatio: '16:9' });
    // remove every cue except the flash's impact
    const only = without(p, (c) => (c.props?.intent as { action?: string } | undefined)?.action !== 'impact');
    const rec = soundRecord(only, { plan: pl });
    expect(rec.problems).toBe(0);
    expect(rec.musicOnly + rec.omittedByDesign + rec.silentTransitions).toBeGreaterThan(0);
  });
  it('a planned hit with its sound removed is reported missing, with its second', () => {
    const pl = plan(['flash', 'cut', 'cut']);
    const p = planToProject(pl, { aspectRatio: '16:9' });
    const rec = soundRecord(without(p, (c) => (c.props?.intent as { action?: string } | undefined)?.action === 'impact'), { plan: pl });
    expect(rec.missing).toEqual([9]);
    expect(rec.problems).toBeGreaterThan(0);
  });
  it('a cue moved off its action\'s frame is reported mistimed', () => {
    const pl = plan(['flash', 'cut', 'cut']);
    const p = planToProject(pl, { aspectRatio: '16:9' });
    const moved = { ...p, tracks: p.tracks.map((t) => ({ ...t, clips: t.clips.map((c) => ((c.props?.intent as { action?: string } | undefined)?.action === 'impact' ? { ...c, start: c.start + 20 } : c)) })) };
    const rec = soundRecord(moved, { plan: pl });
    expect(rec.mistimed.length).toBeGreaterThan(0);
    expect(rec.mistimed[0].offBy).toBeGreaterThan(3);
  });
  it('a silent film has no planned sound, and any sound in it is unexpected', () => {
    const pl = plan(['flash', 'whip', 'cut']);
    const p = planToProject(pl, { aspectRatio: '16:9' });
    const silent = soundRecord(without(p, () => true), { plan: pl, silent: true });
    expect(silent.planned).toBe(0);
    expect(silent.problems).toBe(0);
    const loud = soundRecord(p, { plan: pl, silent: true });
    expect(loud.unexpected).toBeGreaterThan(0);
    expect(loud.problems).toBeGreaterThan(0);
  });
});

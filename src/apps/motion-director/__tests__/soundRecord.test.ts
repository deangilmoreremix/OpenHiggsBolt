// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { planToProject } from '../lib/buildFilm';
import { soundRecord } from '../lib/soundRecord';
import type { DirectorPlan } from '../lib/directorPlan';

const id = (c: string) => MOTION_TEMPLATES.find((t) => t.componentName === c)!.id;
const plan: DirectorPlan = { title: 't', summary: '', palette: { background: '#fff', text: '#000', accent: '#f50' }, scenes: [
  { kind: 'title', recipeId: '', durationSec: 3, headline: 'Open', caption: '', transition: 'cut' },
  { kind: 'shot', recipeId: id('SpotlightHeroCard'), durationSec: 6, headline: 'a', caption: 'b', transition: 'flash' },
  { kind: 'shot', recipeId: id('MultiplaneReal'), durationSec: 5, headline: 'a', caption: 'b', transition: 'whip' },
  { kind: 'title', recipeId: '', durationSec: 3, headline: 'End', caption: '', transition: 'cut' },
] };

describe('the sound record is derived from the timeline', () => {
  it('every cut of a built film has a sound near it, and each cue names its event', () => {
    const rec = soundRecord(planToProject(plan, { aspectRatio: '16:9' }));
    expect(rec.cuts).toBe(3);
    expect(rec.cutsWithSound).toBe(3);
    expect(rec.silentCuts).toEqual([]);
    expect(rec.cues.some((c) => /^cut at/.test(c.event))).toBe(true);
    expect(rec.licence.record).toMatch(/ATTRIBUTION/);
  });
  it('removing the sound from a cut is reported as a silent cut', () => {
    const p = planToProject(plan, { aspectRatio: '16:9' });
    const stripped = { ...p, tracks: p.tracks.map((t) => ({ ...t, clips: t.clips.filter((c) => !(c.cardId === 'audio-clip' && /sfxlib/.test(String(c.props?.file ?? '')) && c.start > 60 && c.start < 130)) })) };
    expect(soundRecord(stripped).silentCuts.length).toBeGreaterThan(0);
  });
});

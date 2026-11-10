// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { planToProject } from '../lib/buildFilm';
import { checkAssembly } from '../lib/filmAssembly';
import type { DirectorPlan } from '../lib/directorPlan';
import type { ProjectData } from '../types';

const palette = { background: '#101018', text: '#ffffff', accent: '#8b6bff' };
const id = (c: string) => MOTION_TEMPLATES.find((t) => t.componentName === c)!.id;
const plan: DirectorPlan = {
  title: 't', summary: '', palette,
  scenes: [
    { kind: 'title', recipeId: '', durationSec: 3, headline: 'Open', caption: '', transition: 'cut' },
    { kind: 'shot', recipeId: id('RowEmbed'), durationSec: 5, headline: 'a', caption: 'b', transition: 'flash' },
    { kind: 'shot', recipeId: id('SpotlightHeroCard'), durationSec: 6, headline: 'a', caption: 'b', transition: 'cut' },
    { kind: 'title', recipeId: '', durationSec: 3, headline: 'End', caption: '', transition: 'cut' },
  ],
};
const built = (): ProjectData => planToProject(plan, { aspectRatio: '16:9' });
const shotsTrack = (p: ProjectData) => p.tracks.find((t) => t.clips.some((c) => c.cardId.startsWith('demo:')))!;

describe('the built film is the storyboard that was approved', () => {
  it('a film built from the plan passes', () => {
    expect(checkAssembly(built(), plan).issues).toEqual([]);
  });

  it('a missing scene is an issue', () => {
    const p = built();
    const t = shotsTrack(p);
    t.clips = t.clips.filter((c) => c.cardId !== 'demo:RowEmbed');
    const { issues } = checkAssembly(p, plan);
    expect(issues.join(' ')).toMatch(/storyboard scenes are missing/);
    expect(issues.join(' ')).toMatch(/RowEmbed/);
  });

  it('recipes in another order are an issue', () => {
    const p = built();
    const [a, b] = shotsTrack(p).clips.filter((c) => c.cardId.startsWith('demo:'));
    [a.cardId, b.cardId] = [b.cardId, a.cardId];
    expect(checkAssembly(p, plan).issues.join(' ')).toMatch(/different order/);
  });

  it('a gap between scenes is an issue', () => {
    const p = built();
    shotsTrack(p).clips.sort((x, y) => x.start - y.start)[2].start += 20;
    expect(checkAssembly(p, plan).issues.join(' ')).toMatch(/gap/);
  });

  it('a requested transition without its seam is warned about', () => {
    const p = built();
    p.tracks.forEach((t) => (t.clips = t.clips.filter((c) => c.cardId !== 'connected-seam')));
    expect(checkAssembly(p, plan).warnings.join(' ')).toMatch(/flash transition after scene 2 has no seam/);
  });

  it('sound running past the end is an issue', () => {
    const p = built();
    const audio = p.tracks.flatMap((t) => t.clips).find((c) => c.cardId === 'audio-clip')!;
    audio.duration += 5000;
    expect(checkAssembly(p, plan).issues.join(' ')).toMatch(/run past the end/);
  });
});

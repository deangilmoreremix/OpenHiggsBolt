// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { planToProject } from '../lib/buildFilm';
import { reviewFilm, reviewSummary } from '../lib/filmReview';
import type { DirectorPlan } from '../lib/directorPlan';
import type { ProjectData } from '../types';

const palette = { background: '#101018', text: '#ffffff', accent: '#8b6bff' };
const id = (c: string) => MOTION_TEMPLATES.find((t) => t.componentName === c)!.id;
const scene = (recipeId: string, kind: 'shot' | 'title' = 'shot', durationSec = 6) => ({ kind, recipeId, durationSec, headline: 'Line', caption: 'Caption words', transition: 'cut' as const });

describe('final review', () => {
  it('passes a clean film and says what it checked', () => {
    const plan: DirectorPlan = { title: 't', summary: '', palette, scenes: [scene(id('SpotlightHeroCard')), scene(id('RowEmbed')), scene(id('ListStackPress')), scene('', 'title', 3)] };
    const items = reviewFilm(planToProject(plan, { aspectRatio: '16:9' }));
    expect(items.filter((i) => !i.ok), JSON.stringify(items.filter((i) => !i.ok))).toEqual([]);
    expect(reviewSummary(items)[0]).toMatch(/passed\./);
  });

  it('names the second of a repeated recipe, a clipped recipe, a short ending and tiny captions', () => {
    const plan: DirectorPlan = { title: 't', summary: '', palette, scenes: [scene(id('RowEmbed')), scene(id('RowEmbed')), scene(id('ListStackPress'), 'shot', 6)] };
    const project: ProjectData = planToProject(plan, { aspectRatio: '16:9' });
    const clips = project.tracks.flatMap((t) => t.clips);
    // Cut the last recipe short, make the ending short and the captions small.
    const lastShot = clips.filter((c) => c.cardId.startsWith('demo:')).pop()!;
    lastShot.duration = 20;
    lastShot.speed = 1;
    clips.filter((c) => c.cardId === 'inkpress-caption').forEach((c) => (c.props.fontSize = 22));
    const items = reviewFilm(project);
    const bad = Object.fromEntries(items.filter((i) => !i.ok).map((i) => [i.code, i.text]));
    expect(bad.F2).toMatch(/plays again at/);
    expect(bad.S3).toMatch(/Cut short/);
    expect(bad.B3).toMatch(/holds only/);
    expect(bad.Q11).toMatch(/too small/);
    expect(reviewSummary(items).slice(1).every((l) => l.startsWith('- '))).toBe(true);
  });
});

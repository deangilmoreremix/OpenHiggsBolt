// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { planToProject, unresolvedScenes } from '../lib/buildFilm';
import type { DirectorPlan } from '../lib/directorPlan';

const palette = { background: '#101018', text: '#ffffff', accent: '#8b6bff' };
const scene = (recipeId: string, kind: 'shot' | 'title' = 'shot', headline = 'Line') => ({ kind, recipeId, durationSec: 4, headline, caption: '', transition: 'cut' as const });

describe('a scene whose recipe cannot be drawn', () => {
  const plan: DirectorPlan = { title: 't', summary: '', palette, scenes: [scene('', 'title', 'Open'), scene('no-such-recipe', 'shot', 'Lost shot'), scene('', 'title', 'Close')] };

  it('is listed, not hidden', () => {
    expect(unresolvedScenes(plan)).toEqual([{ index: 1, recipeId: 'no-such-recipe', headline: 'Lost shot' }]);
  });

  it('keeps its place in the film as a title card', () => {
    const project = planToProject(plan, { aspectRatio: '16:9' });
    const shots = project.tracks.flatMap((t) => t.clips).filter((c) => c.cardId === 'inkpress-title-card');
    expect(shots).toHaveLength(3);
    const total = project.tracks.flatMap((t) => t.clips).reduce((m, c) => Math.max(m, c.start + c.duration), 0);
    expect(total / project.fps).toBeGreaterThanOrEqual(11);
  });
});

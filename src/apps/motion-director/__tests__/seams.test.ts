import { describe, expect, it } from 'vitest';
import { chooseSeams } from '../lib/filmChat';
import { validatePlan, type DirectorPlan, type DirectorScene } from '../lib/directorPlan';
import { planToProject } from '../lib/buildFilm';

const scene = (kind: 'shot' | 'title', recipeId: string, transition: DirectorScene['transition'] = 'cut'): DirectorScene => ({
  kind,
  recipeId,
  durationSec: 3,
  headline: kind === 'title' ? 'Hello' : '',
  caption: '',
  transition,
});
const palette = { background: '#101010', text: '#f5f5f5', accent: '#3366ff' };
const plan = (scenes: DirectorScene[]): DirectorPlan => ({ title: 't', palette, scenes } as DirectorPlan);

describe('chooseSeams', () => {
  const shots = Array.from({ length: 8 }, (_, i) => scene('shot', `brand/feature-zoom`, 'cut'));

  it('dresses some shot-to-shot seams, never two in a row, and respects the caps', () => {
    const out = chooseSeams(plan(shots)).scenes.map((s) => s.transition);
    const panels = out.filter((t) => t === 'wipe' || t === 'barn').length;
    expect(panels).toBeLessThanOrEqual(2);
    expect(out.filter((t) => t === 'dip').length).toBeLessThanOrEqual(2);
    expect(out.filter((t) => t !== 'cut').length).toBeGreaterThan(0);
    out.forEach((t, i) => expect(t !== 'cut' && out[i + 1] !== 'cut' && out[i + 1] !== undefined).toBe(false));
    expect(out[out.length - 1]).toBe('cut');
  });

  it('cuts plainly next to a title card', () => {
    const out = chooseSeams(plan([scene('title', ''), scene('shot', 'brand/hub'), scene('shot', 'brand/feature-zoom'), scene('title', '')])).scenes.map((s) => s.transition);
    expect(out[0]).toBe('cut');
    expect(out[2]).toBe('cut');
  });

  it('dips into the closing logo', () => {
    const out = chooseSeams(plan([scene('shot', 'brand/hub'), scene('shot', 'brand/feature-zoom'), scene('shot', 'brand/logo-reveal')])).scenes.map((s) => s.transition);
    expect(out[1]).toBe('dip');
  });

  it("drops the director's picks beyond a cap", () => {
    const many = Array.from({ length: 6 }, () => scene('shot', 'brand/feature-zoom', 'wipe'));
    const out = chooseSeams(plan(many)).scenes.filter((s) => s.transition === 'wipe' || s.transition === 'barn');
    expect(out.length).toBeLessThanOrEqual(2);
  });
});

describe('seam transitions in the film', () => {
  it('validatePlan keeps the new kinds', () => {
    const p = validatePlan({ title: 't', palette, scenes: [{ ...scene('title', ''), transition: 'wipe' }, { ...scene('title', ''), transition: 'barn' }, { ...scene('title', ''), transition: 'dip' }, scene('title', '')] }, { targetSec: 12 });
    expect(p.scenes.map((s) => s.transition)).toEqual(['wipe', 'barn', 'dip', 'cut']);
  });

  it('planToProject lays a seam card centred on each dressed cut', () => {
    const p = plan([scene('title', '', 'wipe'), scene('title', '', 'barn'), scene('title', '', 'dip'), scene('title', '')]);
    const project = planToProject(p, {} as never);
    const seams = project.tracks.flatMap((t) => t.clips).filter((c) => c.cardId.startsWith('inkpress-seam-'));
    expect(seams.map((c) => c.cardId)).toEqual(['inkpress-seam-wipe', 'inkpress-seam-barn', 'inkpress-seam-dip']);
    for (const c of seams) expect(c.duration).toBeGreaterThanOrEqual(14);
  });
});

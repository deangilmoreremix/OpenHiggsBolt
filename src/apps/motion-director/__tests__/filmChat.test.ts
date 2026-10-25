// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import {
  INK_PRESS_SHOTS,
  ensureRecipes,
  findNamedRecipes,
  inkPressPlan,
  isFilmRequest,
  parseFilmRequest,
  readTemplateAnswer,
  singleShotPlan,
} from '../lib/filmChat';
import { planToProject } from '../lib/buildFilm';
import { checkFilmStructure } from '../lib/filmPipeline';
import { CARDS } from '../cards/registry';

const byComponent = (name: string) => MOTION_TEMPLATES.find((t) => t.componentName === name)!;

describe('film chat requests', () => {
  it('recognises the four README prompts as film requests', () => {
    expect(isFilmRequest('Use video-shotcraft to make a promo for my product.')).toBe(true);
    expect(isFilmRequest('Make a launch film for this repo with the Ink Press template.')).toBe(true);
    expect(isFilmRequest('Use the deck-deal-flyin and row-embed shot cards to present this feature.')).toBe(true);
    expect(isFilmRequest('Design a product close-up inspired by spotlight-hero-card.')).toBe(true);
  });

  it('leaves edit commands to the edit agent', () => {
    for (const edit of ['make the text bigger', 'set the duration to 8s', 'make the video 8s long', 'change the background to red', 'add a caption clip']) {
      expect(isFilmRequest(edit)).toBe(false);
    }
  });

  it('finds shots named by slug, in the order they were named', () => {
    expect(findNamedRecipes('use row-embed then deck-deal-flyin').map((t) => t.componentName)).toEqual(['RowEmbed', 'DeckDealFlyin']);
    expect(findNamedRecipes('a CrashZoomReal moment').map((t) => t.componentName)).toEqual(['CrashZoomReal']);
    expect(findNamedRecipes('make a promo')).toEqual([]);
  });

  it('reads template, single-shot, length and URL from the message', () => {
    expect(parseFilmRequest('Make a launch film with the Ink Press template').template).toBe('inkpress');
    expect(parseFilmRequest('make a promo without ink press').template).toBe('director');
    const single = parseFilmRequest('Design a product close-up inspired by spotlight-hero-card.');
    expect(single.single?.componentName).toBe('SpotlightHeroCard');
    const r = parseFilmRequest('a 30-second promo for https://acme.io');
    expect(r.durationSec).toBe(30);
    expect(r.siteUrl).toBe('https://acme.io');
    expect(r.single).toBeNull();
  });

  it('reads the answer to the Ink Press question', () => {
    expect(readTemplateAnswer('yes')).toBe('inkpress');
    expect(readTemplateAnswer('use ink press')).toBe('inkpress');
    expect(readTemplateAnswer('no, let the director pick')).toBe('director');
    expect(readTemplateAnswer('hmm what about colours')).toBeNull();
  });
});

describe('Ink Press storyboard', () => {
  it('builds the template film: title, product shots, call to action, fitted to length', () => {
    const plan = inkPressPlan({ prompt: 'promo for Acme', durationSec: 30 });
    expect(plan.scenes[0].kind).toBe('title');
    expect(plan.scenes[plan.scenes.length - 1].kind).toBe('title');
    expect(plan.scenes.filter((s) => s.kind === 'shot').map((s) => s.recipeId)).toEqual([...INK_PRESS_SHOTS]);
    expect(plan.scenes[0].headline).toContain('Acme');
    const total = plan.scenes.reduce((sum, s) => sum + s.durationSec, 0);
    expect(Math.abs(total - 30)).toBeLessThan(1);
  });

  it('uses exactly the named shots when the user picks them', () => {
    const picked = [byComponent('DeckDealFlyin'), byComponent('RowEmbed')];
    const plan = inkPressPlan({ prompt: 'present this feature', durationSec: 12, recipes: picked });
    expect(plan.scenes.filter((s) => s.kind === 'shot').map((s) => s.recipeId)).toEqual(picked.map((p) => p.id));
  });

  it('puts missing named shots back into a director plan before the closing card', () => {
    const plan = inkPressPlan({ prompt: 'x', durationSec: 20 });
    const named = byComponent('HitCounter');
    const fixed = ensureRecipes(plan, [named], 20);
    expect(fixed.scenes.some((s) => s.recipeId === named.id)).toBe(true);
    expect(fixed.scenes[fixed.scenes.length - 1].kind).toBe('title');
  });

  it('builds a single adapted shot and a clean full-HD project from a storyboard', () => {
    const single = singleShotPlan(byComponent('SpotlightHeroCard'), { prompt: 'close-up for Acme' });
    expect(single.scenes).toHaveLength(1);
    const project = planToProject(inkPressPlan({ prompt: 'promo for Acme', durationSec: 20 }), { aspectRatio: '16:9' });
    expect([project.width, project.height, project.fps]).toEqual([1920, 1080, 30]);
    for (const clip of project.tracks.flatMap((t) => t.clips)) expect(CARDS[clip.cardId]).toBeDefined();
    const qa = checkFilmStructure(project, { hasProductImages: false });
    expect(qa.issues).toEqual([]);
    expect(qa.warnings.length).toBe(1);
  });
});

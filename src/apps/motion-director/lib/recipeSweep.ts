import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { DEMO_TEXTS } from '../demosrc/_generated/demoTexts';
import { planToProject } from './buildFilm';
import { fallbackTexts, neutralTexts } from './retext';
import type { DirectorPlan } from './directorPlan';
import type { ProjectData } from '../types';

/**
 * Dev / e2e only (never registered in production): renders ONE recipe the way the pipeline would for a person who
 * supplied pictures, a name and some words, so e2e/motion-director-recipe-sweep.spec.ts can measure what each recipe
 * does with them. The result becomes the recipe contract's `renderable` and `personalizable` fields.
 */
const COLORS = ['#ec008c', '#6ed200', '#ff7800', '#00afeb'];

/** Solid-colour pictures as data URLs (1200x800), so a supplied picture is recognisable in a rendered frame. */
const pictures = (): string[] =>
  COLORS.map((color) => {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 800;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  });

const CONTENT = { headline: 'Acme ships releases faster', description: 'Plan, build and ship with Acme.', headings: ['Plan in minutes', 'Release with confidence', 'See every change'], ctas: ['Start free'], nav: ['Pricing', 'Docs', 'Blog'] };

export function sweepProject(stem: string, opts: { withWords?: boolean } = {}): { project: ProjectData; lines: number; replaced: number; neutral: number; durationFrames: number } {
  const template = MOTION_TEMPLATES.find((t) => t.componentName === stem);
  if (!template) throw new Error(`unknown recipe ${stem}`);
  const strings = DEMO_TEXTS[stem] ?? [];
  const texts = opts.withWords === false ? {} : { ...fallbackTexts(strings, CONTENT, 'Acme', { index: 0, headline: 'Acme ships faster', caption: 'Plan in minutes' }), ...neutralTexts(strings, 'Acme', { sitePages: false, hasPictures: true }) };
  const plan: DirectorPlan = {
    title: 'Acme — sweep',
    summary: '',
    palette: { background: '#101018', text: '#ffffff', accent: '#8b6bff' },
    scenes: [{ kind: 'shot', recipeId: template.id, durationSec: template.durationSec || 4, headline: '', caption: '', transition: 'cut' }],
  };
  const shots = pictures();
  const project = planToProject(plan, {
    aspectRatio: '16:9',
    capture: { screens: shots, crops: shots, title: 'Acme' },
    brand: { name: 'Acme', logo: null, accent: '#8b6bff', accent2: '#8b6bff', ink: '#ffffff', paper: '#101018', repo: '', taglines: [], features: [] },
    texts: { 0: texts },
  });
  const shot = project.tracks.flatMap((t) => t.clips).find((c) => c.cardId.startsWith('demo:'));
  // How many lines the product's name alone replaces (a film with no site words).
  const neutral = Object.keys(neutralTexts(strings, 'Acme', { sitePages: false, hasPictures: true })).length;
  return { project, lines: strings.length, replaced: Object.keys(texts).length, neutral, durationFrames: shot?.duration ?? 0 };
}

export function registerSweepHook(): void {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return;
  const hook = {
    stems: MOTION_TEMPLATES.map((t) => t.componentName).filter((s, i, all) => all.indexOf(s) === i),
    /** Frames of the recipe with the person's words, and (`plain`) with the template's own words, to see whether the words changed anything. */
    async render(stem: string, fractions: number[]): Promise<{ lines: number; replaced: number; neutral: number; frames: string[]; plain: string[]; error?: string }> {
      const still = async (project: ProjectData, f: number) => {
        const { renderStillOnWebExport } = await import('../webRenderer');
        const { blob } = await renderStillOnWebExport(project, f, undefined, 0.35, true);
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      };
      try {
        const mine = sweepProject(stem);
        const plain = sweepProject(stem, { withWords: false });
        const at = (n: number, f: number) => Math.min(n - 1, Math.round(n * f));
        const frames: string[] = [];
        const plainFrames: string[] = [];
        for (const f of fractions) {
          frames.push(await still(mine.project, at(mine.durationFrames, f)));
          plainFrames.push(await still(plain.project, at(plain.durationFrames, f)));
        }
        return { lines: mine.lines, replaced: mine.replaced, neutral: mine.neutral, frames, plain: plainFrames };
      } catch (error) {
        return { lines: 0, replaced: 0, neutral: 0, frames: [], plain: [], error: error instanceof Error ? error.message : String(error) };
      }
    },
  };
  (window as unknown as { __recipeSweep?: typeof hook }).__recipeSweep = hook;
}

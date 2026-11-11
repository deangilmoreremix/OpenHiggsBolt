import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { DEMO_TEXTS } from '../demosrc/_generated/demoTexts';
import { planToProject } from './buildFilm';
import { fallbackTexts, neutralTexts } from './retext';
import { layoutFromCapture } from './customerLayout';
import { SAMPLE_LAYOUT } from '../demosrc/_textures/LiveLayoutContext';
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
    // A flat picture would read as a blank frame; a darker grid and a corner label give it structure while the
    // colour still covers most of it.
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = 0; x < c.width; x += 100) ctx.fillRect(x, 0, 6, c.height);
    for (let y = 0; y < c.height; y += 100) ctx.fillRect(0, y, c.width, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 120px sans-serif';
    ctx.fillText(String.fromCharCode(65 + COLORS.indexOf(color)), 60, 170);
    return c.toDataURL('image/png');
  });

/** What a typical marketing site's capture holds (a headline, a description, a dozen headings, a menu, a few calls to action): the words a recipe can take. */
export const SWEEP_CONTENT = {
  headline: 'Acme ships releases faster',
  description: 'Plan, build and ship with Acme: one place for your whole release.',
  headings: ['Plan in minutes', 'Release with confidence', 'See every change', 'Built for teams that ship', 'Automate the boring parts', 'One dashboard for everything', 'Trusted by 4,000 teams', 'Secure by default', 'Integrates with your stack', 'Start in a day, not a quarter', 'Questions, answered', 'Pricing that scales with you'],
  ctas: ['Start free', 'Book a demo', 'Talk to sales', 'See pricing'],
  nav: ['Product', 'Pricing', 'Docs', 'Blog', 'Customers', 'Contact'],
};

/** A synthetic capture for the fidelity specs (e2e/helpers/layout-fixture.ts): the images as data URLs and the layout in the capture's own shape. */
export interface CustomCapture {
  screens: string[];
  cardCrops: string[];
  emptyPlate?: string;
  /** The layout as a capture reports it (lib/customerLayout turns it into the recipes' shape). `identity` uses the SAMPLE layout and no images. */
  captureLayout?: { pageH: number; sections: unknown[]; cards: Array<{ x: number; y: number; width: number; height: number }> };
  identity?: boolean;
  /** A structured document for DocumentTypewriterReveal (lib/documentContent). */
  document?: unknown;
  /** Which captured card is the hero (the recipe's anchor); the capture's own choice when absent. */
  main?: number;
}

export function sweepProject(stem: string, opts: { withWords?: boolean; sample?: boolean; brandOnly?: boolean; custom?: CustomCapture } = {}): { project: ProjectData; lines: number; replaced: number; neutral: number; durationFrames: number } {
  const template = MOTION_TEMPLATES.find((t) => t.componentName === stem);
  if (!template) throw new Error(`unknown recipe ${stem}`);
  const strings = DEMO_TEXTS[stem] ?? [];
  const texts = opts.withWords === false ? {} : { ...fallbackTexts(strings, SWEEP_CONTENT, 'Acme', { index: 0, headline: 'Acme ships faster', caption: 'Plan in minutes' }), ...neutralTexts(strings, 'Acme', { sitePages: false, hasPictures: true }) };
  const plan: DirectorPlan = {
    title: 'Acme — sweep',
    summary: '',
    palette: { background: '#101018', text: '#ffffff', accent: '#8b6bff' },
    scenes: [{ kind: 'shot', recipeId: template.id, durationSec: template.durationSec || 4, headline: '', caption: '', transition: 'cut' }],
  };
  const shots = pictures();
  const custom = opts.custom;
  const customLayout = custom ? (custom.identity ? SAMPLE_LAYOUT : layoutFromCapture({ pages: [{ name: 'home', path: '/', url: '', width: 3840, height: 0, layout: custom.captureLayout as never }], page: { url: '', width: 0, height: 0 }, emptyPlate: custom.emptyPlate ?? null, brand: { background: '#eaeef2', text: null, accent: null, fontFamily: null } }).layout) : undefined;
  if (custom && customLayout && custom.main !== undefined) customLayout.projects.main = custom.main;
  const brand = { name: 'Acme', logo: null, accent: '#8b6bff', accent2: '#8b6bff', ink: '#ffffff', paper: '#101018', repo: '', taglines: [], features: [] };
  const project = planToProject(plan, opts.brandOnly ? { aspectRatio: '16:9', brand } : custom ? { aspectRatio: '16:9', capture: { ...(custom.document ? { document: custom.document } : {}), screens: custom.screens, crops: [], cardCrops: custom.cardCrops, emptyPlate: custom.emptyPlate ?? null, liveLayout: customLayout, title: 'Acme' } } : opts.sample ? { aspectRatio: '16:9' } : {
    aspectRatio: '16:9',
    capture: { screens: shots, crops: shots, title: 'Acme' },
    brand,
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
    async render(stem: string, fractions: number[], mode: { sample?: boolean } = {}): Promise<{ lines: number; replaced: number; neutral: number; frames: string[]; plain: string[]; brand: string[]; sample: string[]; error?: string }> {
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
        const mine = sweepProject(stem, { sample: mode.sample });
        const plain = sweepProject(stem, { withWords: false });
        const at = (n: number, f: number) => Math.min(n - 1, Math.round(n * f));
        const frames: string[] = [];
        const plainFrames: string[] = [];
        // The company's brand alone (no pictures, no words), and the recipe as authored: what the brand changes by itself.
        const brandOnly = sweepProject(stem, { brandOnly: true });
        const sampleOnly = sweepProject(stem, { sample: true });
        const brandFrames: string[] = [];
        const sampleFrames: string[] = [];
        for (const f of fractions) {
          frames.push(await still(mine.project, at(mine.durationFrames, f)));
          plainFrames.push(await still(plain.project, at(plain.durationFrames, f)));
          brandFrames.push(await still(brandOnly.project, at(brandOnly.durationFrames, f)));
          sampleFrames.push(await still(sampleOnly.project, at(sampleOnly.durationFrames, f)));
        }
        return { lines: mine.lines, replaced: mine.replaced, neutral: mine.neutral, frames, plain: plainFrames, brand: brandFrames, sample: sampleFrames };
      } catch (error) {
        return { lines: 0, replaced: 0, neutral: 0, frames: [], plain: [], brand: [], sample: [], error: error instanceof Error ? error.message : String(error) };
      }
    },
  };
  (hook as Record<string, unknown>).frames = async (stem: string, frames: number[], mode: { sample?: boolean; custom?: CustomCapture } = {}, scale = 0.5): Promise<{ frames: string[]; durationFrames: number; error?: string }> => {
    try {
      const { project, durationFrames } = sweepProject(stem, { sample: mode.sample, custom: mode.custom });
      const { renderStillOnWebExport } = await import('../webRenderer');
      const out: string[] = [];
      for (const f of frames) {
        const { blob } = await renderStillOnWebExport(project, Math.min(durationFrames - 1, f), undefined, scale, true);
        out.push(await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        }));
      }
      return { frames: out, durationFrames };
    } catch (error) {
      return { frames: [], durationFrames: 0, error: error instanceof Error ? error.message : String(error) };
    }
  };
  const toDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsDataURL(blob); });
  /** Render frames of ANY project JSON (a saved film reopened) through the export renderer. */
  (hook as Record<string, unknown>).renderProject = async (projectJson: ProjectData, frames: number[], scale = 0.5): Promise<string[]> => {
    const { renderStillOnWebExport } = await import('../webRenderer');
    const out: string[] = [];
    for (const f of frames) out.push(await toDataUrl((await renderStillOnWebExport(projectJson, f, undefined, scale, true)).blob));
    return out;
  };
  /**
   * Adapt ONE shot the way the film pipeline does (exact recipe source + card, the adaptation loop, the sandbox, the acceptance gate), then render
   * its entering/peak/settled frames. `code` stands in for the model (a REFERENCE source, labelled so by the caller); without it the real model is asked.
   */
  (hook as Record<string, unknown>).adaptProof = async (stem: string, args: { custom: CustomCapture; code?: string; scale?: number }) => {
    const [{ adaptShot }, { verifyAdaptation, browserPixels }, directorClient, { renderStillOnWebExport }] = await Promise.all([import('./adaptLoop'), import('./sceneQa'), import('./directorClient'), import('../webRenderer')]);
    const { project } = sweepProject(stem, { custom: args.custom });
    const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.cardId === `demo:${stem}`);
    if (!clip) return { error: `no ${stem} clip` };
    const problems: string[] = [];
    const requests: number[] = [];
    const ctx = { layout: args.custom.captureLayout ?? null, screens: args.custom.screens, crops: args.custom.cardCrops, brand: { name: 'Acme' } };
    const out = await adaptShot(project, clip, ctx, {
      render: async (p, f, signal) => renderStillOnWebExport(p, f, signal, 0.5),
      request: args.code ? async () => { requests.push(1); return { code: args.code as string, notes: 'reference source (not a model)' }; } : async (b) => { requests.push(1); return directorClient.requestAdapt(b); },
      verify: async (trial, c, signal) => { const found = await verifyAdaptation(project, c, trial, { pixels: browserPixels }, signal); problems.push(...found); return found; },
    }, new AbortController().signal).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
    if (!out || 'error' in out) return { adapted: false, requests: requests.length, problems, error: out && 'error' in out ? out.error : undefined };
    const trial: ProjectData = { ...project, tracks: project.tracks.map((t) => ({ ...t, clips: t.clips.map((c) => (c.id === clip.id ? { ...c, props: { ...c.props, ...out.props } } : c)) })) };
    const f = [Math.floor(clip.duration * 0.2), Math.floor(clip.duration * 0.5), Math.max(0, clip.duration - 3)].map((n) => clip.start + n);
    const frames: string[] = [];
    for (const n of f) frames.push(await toDataUrl((await renderStillOnWebExport(trial, n, undefined, args.scale ?? 0.5, true)).blob));
    return { adapted: true, requests: requests.length, problems, notes: out.notes, adaptedCode: out.props.adaptedCode as string, project: trial, frames, frameNumbers: f };
  };
  (window as unknown as { __recipeSweep?: typeof hook }).__recipeSweep = hook;
}

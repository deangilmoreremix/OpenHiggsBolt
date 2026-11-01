import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import type { ClipData, ProjectData } from '../types';
import { fetchRecipeSource, requestAdapt, DirectorError, type AdaptRequest } from './directorClient';
import { checkAdaptedSource } from './shotAdapter';
import { prepareAdapted } from './adaptedRuntime';
import { rulesOf } from './shotRules';
import { drawsSampleScreen, isProductTextureShot } from './productShots';

/**
 * Upstream's coding agent edits each shot's source for the product, looks at stills and fixes what
 * it sees. This is the hosted version: the model rewrites a recipe (route mode `adapt`), the
 * sandbox checks and compiles it, three stills are rendered, and what fails goes back to the model
 * (at most two rounds). A shot keeps its adapted source only when it came out clean; otherwise the
 * plain recipe stays.
 */

export const ADAPT_LIMITS = { shots: 4, rounds: 3, budgetMs: 90_000 } as const;

export type AdaptLog = (label: string, status: 'running' | 'done' | 'error') => void;

export interface AdaptDeps {
  /** Render a still of the project (the browser renderer); rejects when the frame fails. */
  render: (project: ProjectData, frame: number, signal: AbortSignal) => Promise<unknown>;
  /** Optional: a reviewer's blocking findings for the stills of a project at these frames. */
  review?: (project: ProjectData, frames: number[], signal: AbortSignal) => Promise<string[]>;
  request?: (body: AdaptRequest) => Promise<{ code: string; notes: string }>;
  source?: (stem: string) => Promise<string | null>;
}

export interface AdaptContext {
  layout?: unknown;
  screens: string[];
  crops: string[];
  brand?: AdaptRequest['brand'];
  content?: unknown;
}

const stemOf = (c: ClipData) => (c.cardId.startsWith('demo:') ? c.cardId.slice(5) : '');

/** Shots worth adapting: recipes that draw sample screens first, then the ones that already read pages; never fixed-text, technique or already adapted ones. */
export function adaptTargets(project: ProjectData): ClipData[] {
  const out: Array<{ clip: ClipData; weight: number }> = [];
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      const stem = stemOf(clip);
      if (!stem || clip.props?.adaptedCode) continue;
      const template = MOTION_TEMPLATES.find((t) => t.componentName === stem);
      const rules = rulesOf(stem);
      if (!template || !rules || rules.text === 'fixed' || rules.technique) continue;
      out.push({ clip, weight: drawsSampleScreen(template) ? 0 : isProductTextureShot(stem) ? 1 : 2 });
    }
  }
  return out.sort((a, b) => a.weight - b.weight || a.clip.start - b.clip.start).slice(0, ADAPT_LIMITS.shots).map((x) => x.clip);
}

const withClip = (project: ProjectData, id: string, props: Record<string, unknown>): ProjectData => ({
  ...project,
  tracks: project.tracks.map((t) => ({ ...t, clips: t.clips.map((c) => (c.id === id ? { ...c, props: { ...c.props, ...props } } : c)) })),
});

/** Entering, peak and settled frames of a clip (upstream's three stills per shot). */
export const stillFrames = (clip: ClipData): number[] => [Math.floor(clip.duration * 0.2), Math.floor(clip.duration / 2), Math.max(0, clip.duration - 3)].map((f) => clip.start + f);

/** Adapt one shot; resolves to the props to add to the clip, or null when nothing clean came out. */
export async function adaptShot(project: ProjectData, clip: ClipData, ctx: AdaptContext, deps: AdaptDeps, signal: AbortSignal): Promise<{ props: Record<string, unknown>; notes: string } | null> {
  const stem = stemOf(clip);
  const source = await (deps.source ?? fetchRecipeSource)(stem);
  if (!source) return null;
  const request = deps.request ?? requestAdapt;
  const slots = { screens: ctx.screens, crops: ctx.crops, layout: ctx.layout, brand: ctx.brand };
  let problems: string[] = [];
  for (let round = 0; round < ADAPT_LIMITS.rounds; round++) {
    if (signal.aborted) return null;
    let reply: { code: string; notes: string };
    try {
      reply = await request({ recipe: stem, source, layout: ctx.layout, screens: ctx.screens.length, crops: ctx.crops.length, brand: ctx.brand, content: ctx.content, problems });
    } catch (error) {
      // No key, a refusal or a rate limit will not get better on a second round.
      if (error instanceof DirectorError && [401, 403, 429].includes(error.status)) throw error;
      problems = [`the request failed: ${error instanceof Error ? error.message : 'error'}`];
      continue;
    }
    const checked = await checkAdaptedSource(reply.code, stem);
    if (!checked.ok) {
      problems = [`the code was refused: ${checked.error}`];
      continue;
    }
    if (!(await prepareAdapted(reply.code, stem))) {
      problems = ['the code did not compile or run'];
      continue;
    }
    const props = { adaptedCode: reply.code, adaptedStem: stem, ...slots };
    const trial = withClip(project, clip.id, props);
    const failed: string[] = [];
    for (const frame of stillFrames(clip)) {
      try {
        await deps.render(trial, frame, signal);
      } catch (error) {
        if (signal.aborted) return null;
        failed.push(`frame ${frame - clip.start} of the shot failed to render: ${error instanceof Error ? error.message : 'error'}`);
      }
    }
    if (!failed.length && deps.review) failed.push(...(await deps.review(trial, stillFrames(clip), signal).catch(() => [])));
    if (!failed.length) return { props, notes: reply.notes };
    problems = failed.slice(0, 6);
  }
  return null;
}

/** Adapt the film's best shots within the time budget. Never throws except for a missing key / refusal on the first shot. */
export async function adaptFilm(project: ProjectData, ctx: AdaptContext, deps: AdaptDeps, log: AdaptLog, outer?: AbortSignal): Promise<ProjectData> {
  const targets = adaptTargets(project);
  if (!targets.length) return project;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ADAPT_LIMITS.budgetMs);
  outer?.addEventListener('abort', () => controller.abort(), { once: true });
  let result = project;
  let adapted = 0;
  try {
    for (const clip of targets) {
      if (controller.signal.aborted) break;
      const name = MOTION_TEMPLATES.find((t) => t.componentName === stemOf(clip))?.nameEn ?? stemOf(clip);
      log(`Adapting ${name} to your site`, 'running');
      try {
        const done = await adaptShot(result, clip, ctx, deps, controller.signal);
        if (done) {
          result = withClip(result, clip.id, done.props);
          adapted++;
          log(`Adapted ${name}${done.notes ? ` · ${done.notes}` : ''}`, 'done');
        } else {
          log(`Kept the original ${name} (the adapted version did not pass its checks)`, 'done');
        }
      } catch (error) {
        // No key or refusal: say so once and stop asking.
        log(error instanceof Error ? error.message : 'Shot adaptation is unavailable', 'error');
        break;
      }
    }
  } finally {
    clearTimeout(timer);
  }
  if (adapted === 0 && targets.length) log('No shot needed changes beyond words and pictures', 'done');
  return result;
}

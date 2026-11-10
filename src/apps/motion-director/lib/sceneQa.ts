import type { ClipData, ProjectData } from '../types';
import type { SceneRecord } from './productionRun';
import { shotPersonalization } from './personalization';
import { needsOf } from './recipeNeeds';

/**
 * Scene-level visual validation (upstream stage 5: "render at least entering / peak / settled stills of each shot and look").
 * A shot is checked on ITS OWN: the clip alone is rendered with everything the person gave it (pictures, words, adapted
 * source, brand) and again as the plain recipe; if the two frames look alike the person's content never reached the shot,
 * however many props were passed. Abstract recipes have nothing to replace and pass by definition.
 */

/** Props that carry the person's content into a recipe. */
export const CONTENT_PROPS = ['screens', 'crops', 'texts', 'adaptedCode', 'adaptedStem', 'liveLayout', 'cardCrops', 'emptyPlate', 'scenePictures', 'images', 'captions', 'logo', 'name', 'cta', 'url', 'file', 'label', 'text'];

const stemOf = (c: ClipData) => (c.cardId.startsWith('demo:') ? c.cardId.slice(5) : '');

/** The clip alone, at the start of its own project (so a frame of it shows nothing else). */
export function soloProject(project: ProjectData, clip: ClipData, plain: boolean): ProjectData {
  const only: ClipData = { ...clip, start: 0, props: plain ? Object.fromEntries(Object.entries(clip.props ?? {}).filter(([k]) => !CONTENT_PROPS.includes(k))) : { ...clip.props } };
  return {
    ...project,
    ...(plain ? { brand: undefined } : {}),
    tracks: [{ id: 'solo', name: 'solo', clips: [only] } as unknown as ProjectData['tracks'][number]],
  };
}

/** Share of pixels that differ by more than `tol` in any channel. */
export function diffShare(a: { data: Uint8ClampedArray | number[]; width: number; height: number }, b: { data: Uint8ClampedArray | number[]; width: number; height: number }, tol = 24): number {
  if (a.width !== b.width || a.height !== b.height) return 1;
  let d = 0;
  for (let i = 0; i < a.data.length; i += 4) if (Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2])) > tol) d++;
  return d / (a.data.length / 4);
}

export interface SceneQaDeps {
  /** Render one frame of a project to pixels; rejects when the frame cannot be drawn. */
  pixels: (project: ProjectData, frame: number, signal?: AbortSignal) => Promise<{ data: Uint8ClampedArray | number[]; width: number; height: number }>;
}

/** The share of a frame that must differ from the plain recipe for the person's content to count as present. */
export const CONTENT_VISIBLE = 0.01;

export interface SceneQaResult { clipId: string; stem: string; state: 'passed' | 'failed' | 'pending'; frames: number[]; note: string }

export async function validateShotScenes(project: ProjectData, deps: SceneQaDeps, opts: { budgetMs?: number; signal?: AbortSignal; only?: ReadonlySet<string> } = {}): Promise<SceneQaResult[]> {
  const out: SceneQaResult[] = [];
  const started = Date.now();
  const clips = project.tracks.flatMap((t) => t.clips).filter((c) => stemOf(c)).sort((a, b) => a.start - b.start);
  for (const clip of clips) {
    if (opts.only && !opts.only.has(stemOf(clip))) continue;
    const stem = stemOf(clip);
    const { need } = needsOf(stem);
    const peak = Math.floor(clip.duration * 0.5);
    const settled = Math.max(0, clip.duration - 3);
    if (need === 'abstract' || need === 'none') {
      out.push({ clipId: clip.id, stem, state: 'passed', frames: [], note: 'nothing of the person\'s is meant to appear in it' });
      continue;
    }
    if (opts.signal?.aborted || (opts.budgetMs && Date.now() - started > opts.budgetMs)) {
      out.push({ clipId: clip.id, stem, state: 'pending', frames: [], note: 'not checked: out of time' });
      continue;
    }
    try {
      let best = 0;
      for (const f of [peak, settled]) {
        const [mine, plain] = [await deps.pixels(soloProject(project, clip, false), f, opts.signal), await deps.pixels(soloProject(project, clip, true), f, opts.signal)];
        best = Math.max(best, diffShare(mine, plain));
      }
      out.push(best >= CONTENT_VISIBLE
        ? { clipId: clip.id, stem, state: 'passed', frames: [peak, settled], note: `the person's content changes ${(best * 100).toFixed(1)}% of the shot's frame` }
        : { clipId: clip.id, stem, state: 'failed', frames: [peak, settled], note: 'the shot looks the same as the sample recipe: the person\'s content did not reach it' });
    } catch (error) {
      out.push({ clipId: clip.id, stem, state: 'pending', frames: [peak, settled], note: `could not be rendered: ${error instanceof Error ? error.message : 'error'}` });
    }
  }
  return out;
}

/** Overlay what the build and the scene check found onto the storyboard's per-scene records (matched by shot order). */
export function recordScenes(base: SceneRecord[], project: ProjectData, qa: SceneQaResult[]): SceneRecord[] {
  const clips = project.tracks.flatMap((t) => t.clips).filter((c) => stemOf(c)).sort((a, b) => a.start - b.start);
  const shots = base.filter((s) => s.component);
  return base.map((rec) => {
    if (!rec.component) return { ...rec, validation: { state: 'passed' as const, note: 'title or brand scene' } };
    const k = shots.indexOf(rec);
    const clip = clips.find((c, i) => stemOf(c) === rec.component && clips.filter((x, j) => j < i && stemOf(x) === rec.component).length === shots.slice(0, k).filter((s) => s.component === rec.component).length);
    if (!clip) return rec;
    const p = shotPersonalization(clip);
    const v = qa.find((q) => q.clipId === clip.id);
    const personalization = rec.needs === 'abstract' || rec.needs === 'none' ? 'unmodified' : p?.state ?? rec.personalization;
    return { ...rec, personalization, validation: v ? { state: v.state, frames: v.frames, note: v.note } : rec.validation, fingerprint: clip.props?.adaptedCode ? String((clip.props.adaptedCode as string).length) : undefined };
  });
}

/** The browser's own renderer (the export path) as pixels at a quarter of the frame size. */
export const browserPixels: SceneQaDeps['pixels'] = async (project, frame, signal) => {
  const { renderStillOnWebExport } = await import('../webRenderer');
  const { blob } = await renderStillOnWebExport(project, frame, signal, 0.25, true);
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: img.data, width: img.width, height: img.height };
};

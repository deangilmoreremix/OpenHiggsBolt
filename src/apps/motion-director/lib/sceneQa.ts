import type { ClipData, ProjectData } from '../types';
import type { SceneRecord } from './productionRun';
import { shotPersonalization } from './personalization';
import { needsOf } from './recipeNeeds';
import { checkShot, judgementItems, pictureColours, type Checkpoint, type Pixels, type PropertyCheck } from './sceneChecks';
import { clipFingerprint } from './filmFingerprint';

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

export interface SceneQaResult { clipId: string; stem: string; state: 'passed' | 'failed' | 'pending'; frames: number[]; note: string; checks?: PropertyCheck[]; judgement?: string[] }

/** Pixels of a supplied picture, when the browser lets us read them (data: and same-origin URLs); null otherwise. */
export async function readPicture(url: string): Promise<Pixels | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => resolve(i); i.onerror = () => reject(new Error('load')); i.src = url; });
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, 64, 64);
    const d = ctx.getImageData(0, 0, 64, 64);
    return { data: d.data, width: 64, height: 64 };
  } catch { return null; }
}

export interface SceneQaDeps2 extends SceneQaDeps { picture?: (url: string) => Promise<Pixels | null> }

export async function validateShotScenes(project: ProjectData, deps: SceneQaDeps2, opts: { budgetMs?: number; signal?: AbortSignal; only?: ReadonlySet<string> } = {}): Promise<SceneQaResult[]> {
  const out: SceneQaResult[] = [];
  const started = Date.now();
  const clips = project.tracks.flatMap((t) => t.clips).filter((c) => stemOf(c)).sort((a, b) => a.start - b.start);
  for (const clip of clips) {
    if (opts.only && !opts.only.has(stemOf(clip))) continue;
    const stem = stemOf(clip);
    const { need } = needsOf(stem);
    const frames = { entering: Math.floor(clip.duration * 0.2), peak: Math.floor(clip.duration * 0.5), settled: Math.max(0, clip.duration - 3) };
    if (need === 'abstract' || need === 'none') {
      out.push({ clipId: clip.id, stem, state: 'passed', frames: [], note: 'nothing of the person\'s is meant to appear in it', checks: [], judgement: [] });
      continue;
    }
    if (opts.signal?.aborted || (opts.budgetMs && Date.now() - started > opts.budgetMs)) {
      out.push({ clipId: clip.id, stem, state: 'pending', frames: [], note: 'not checked: out of time' });
      continue;
    }
    try {
      const checkpoints: Checkpoint[] = [];
      for (const name of ['entering', 'peak', 'settled'] as const) {
        const f = frames[name];
        checkpoints.push({ name, mine: await deps.pixels(soloProject(project, clip, false), f, opts.signal), plain: await deps.pixels(soloProject(project, clip, true), f, opts.signal) });
      }
      const urls = [...(Array.isArray(clip.props?.screens) ? (clip.props!.screens as string[]) : []), ...(Array.isArray(clip.props?.crops) ? (clip.props!.crops as string[]) : [])].filter((u) => typeof u === 'string').slice(0, 4);
      const read = deps.picture ?? readPicture;
      const pics = (await Promise.all(urls.map((u) => read(u)))).filter((p): p is Pixels => Boolean(p));
      const supplied = pics.length && pics.length === urls.length ? pics.flatMap((p) => pictureColours(p)) : null;
      const checks = checkShot({ checkpoints, supplied });
      const failed = checks.filter((c) => c.kind === 'mechanical' && !c.ok);
      out.push({ clipId: clip.id, stem, state: failed.length ? 'failed' : 'passed', frames: [frames.entering, frames.peak, frames.settled], note: failed.length ? `failed: ${failed.map((c) => `${c.property} (${c.frame}): ${c.detail}`).join('; ')}` : `${checks.filter((c) => c.kind === 'mechanical').length} mechanical checks held at entering, peak and settled`, checks, judgement: judgementItems(checks) });
    } catch (error) {
      out.push({ clipId: clip.id, stem, state: 'pending', frames: [frames.entering, frames.peak, frames.settled], note: `could not be rendered: ${error instanceof Error ? error.message : 'error'}` });
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
    return { ...rec, personalization, validation: v ? { state: v.state, frames: v.frames, note: v.note } : rec.validation, fingerprint: clipFingerprint(clip), checks: v?.checks, judgement: v?.judgement };
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

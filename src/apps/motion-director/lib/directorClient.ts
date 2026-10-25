/**
 * Browser side of the Motion Studio director: calls the capture / director
 * routes, re-validates what comes back, and applies edits to the store through
 * its existing mutators (prop/timing edits share one undo step; adding or
 * removing a clip pushes its own, as in `agentApply.ts`).
 */
import { findClip, useStore } from '../store';
import { CARDS } from '../cards/registry';
import type { ProjectData } from '../types';
import { motionCardId, motionTemplateTitle, resolveMotionTemplate } from '@/data/motionRecipeCatalog';
import { validateEditOps, validatePlan, type DirectorEditOp, type DirectorPlan } from './directorPlan';

export interface SiteCapture {
  url: string;
  title: string;
  page: { url: string; width: number; height: number };
  crops: string[];
  brand: { background: string | null; text: string | null; accent: string | null; fontFamily: string | null };
  transient: boolean;
}

export class DirectorError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new DirectorError(String(data?.message || data?.error || `Request failed (${res.status})`), String(data?.code || data?.error || 'FAILED'), res.status);
  }
  return data as T;
}

export { findSiteUrl } from './filmChat';

export const captureSite = (url: string) => post<SiteCapture>('/api/motion-studio/capture', { url });

export async function requestPlan(body: {
  prompt: string;
  durationSec: number;
  aspectRatio: string;
  capture?: SiteCapture | null;
  brandKit?: Record<string, unknown> | null;
  /** Catalog shot ids the film must use, in this order (named in chat or picked in Templates). */
  requiredRecipes?: string[];
  /** 'inkpress': follow the Ink Press template structure. */
  template?: 'inkpress' | null;
}): Promise<DirectorPlan> {
  const { plan } = await post<{ plan: unknown }>('/api/motion-studio/director', {
    mode: 'plan',
    prompt: body.prompt,
    durationSec: body.durationSec,
    aspectRatio: body.aspectRatio,
    capture: body.capture ? { title: body.capture.title, url: body.capture.url, brand: body.capture.brand, cropCount: body.capture.crops.length } : null,
    brandKit: body.brandKit ?? null,
    requiredRecipes: body.requiredRecipes ?? [],
    template: body.template ?? null,
  });
  return validatePlan(plan, { targetSec: body.durationSec });
}

/** The editable text prop of a card, if it has one. */
const textKey = (cardId: string): string | null => {
  if (cardId === 'inkpress-title-card' || cardId === 'inkpress-caption') return 'text';
  if (cardId === 'text-basic') return 'content';
  if (cardId.startsWith('demo:')) return 'title';
  return null;
};

/** Compact clip list sent to the director for an edit. */
export function clipsForDirector(project: ProjectData) {
  return project.tracks.flatMap((track) =>
    track.clips.map((c) => {
      const key = textKey(c.cardId);
      const card = CARDS[c.cardId];
      return {
        id: c.id,
        recipe: `${c.cardId}${card?.nameEn ? ` (${card.nameEn})` : ''} on ${track.name}`,
        label: c.label ?? '',
        text: key ? String(c.props?.[key] ?? '') : '',
        seconds: Math.round((c.duration / project.fps) * 10) / 10,
      };
    }),
  );
}

export async function requestEdit(instruction: string, project: ProjectData): Promise<{ reply: string; ops: DirectorEditOp[] }> {
  const clips = clipsForDirector(project);
  const raw = await post<unknown>('/api/motion-studio/director', { mode: 'edit', instruction, clips });
  return validateEditOps(raw, new Set(clips.map((c) => c.id)));
}

/** Apply validated director ops to the store. Returns the number applied. */
export function applyDirectorOps(ops: DirectorEditOp[]): number {
  if (!ops.length) return 0;
  const store = useStore.getState();
  store.commit();
  let applied = 0;
  for (const op of ops) {
    const s = useStore.getState();
    const fps = s.project.fps;
    if (op.op === 'set_palette') {
      if (op.background) s.setBackground(op.background);
      for (const track of s.project.tracks) {
        for (const c of track.clips) {
          if (c.cardId === 'inkpress-title-card') s.updateClipProps(c.id, { ...(op.background && { bg: op.background }), ...(op.text && { ink: op.text }), ...(op.accent && { accent: op.accent }) });
          else if (c.cardId === 'bg-paper' && op.background) s.updateClipProps(c.id, { color: op.background });
          else if ((c.cardId.startsWith('demo:') || c.cardId === 'inkpress-caption') && op.accent) s.updateClipProps(c.id, { accent: op.accent });
        }
      }
      applied++;
      continue;
    }
    if (op.op === 'add_shot') {
      const template = resolveMotionTemplate(op.recipeId);
      const cardId = template ? motionCardId(template) : '';
      if (!CARDS[cardId]) continue;
      const after = op.afterClipId ? findClip(s.project, op.afterClipId) : null;
      const shotsTrack = after?.track ?? s.project.tracks.find((t) => t.clips.some((c) => c.cardId.startsWith('demo:'))) ?? s.project.tracks[0];
      const at = after ? after.clip.start + after.clip.duration : shotsTrack ? Math.max(0, ...shotsTrack.clips.map((c) => c.start + c.duration)) : 0;
      // Ripple later clips on that track so the new shot does not overlap them.
      const frames = Math.round(op.seconds * fps);
      if (shotsTrack) for (const c of shotsTrack.clips) if (c.start >= at) s.updateClip(c.id, { start: c.start + frames });
      s.addClip(cardId, shotsTrack?.id, at, { props: { title: op.text }, label: template ? motionTemplateTitle(template).slice(0, 24) : undefined });
      const added = useStore.getState().selectedClipId;
      if (added) useStore.getState().updateClip(added, { duration: frames });
      applied++;
      continue;
    }
    const hit = findClip(s.project, op.clipId);
    if (!hit) continue;
    if (op.op === 'set_text') {
      const key = textKey(hit.clip.cardId);
      if (!key) continue;
      s.updateClipProps(op.clipId, { [key]: op.text });
    } else if (op.op === 'set_duration') {
      s.updateClip(op.clipId, { duration: Math.max(2, Math.round(op.seconds * fps)) });
    } else if (op.op === 'remove') {
      s.removeClip(op.clipId);
    } else if (op.op === 'replace_recipe') {
      const template = resolveMotionTemplate(op.recipeId);
      const cardId = template ? motionCardId(template) : '';
      if (!CARDS[cardId]) continue;
      s.updateClip(op.clipId, { cardId, inOffset: 0 });
    }
    applied++;
  }
  return applied;
}

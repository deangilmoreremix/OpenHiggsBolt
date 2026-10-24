/**
 * Motion Studio AI director — plan contract.
 *
 * The director (server route `/api/motion-studio/director`) asks a model for a
 * storyboard that uses only the existing ShotCraft recipes and cards. It never
 * produces code: every scene is a catalog recipe id plus copy and timing, and
 * every edit is one of a few data operations. This module holds the JSON
 * schemas sent to the model and the validation applied to what comes back, so
 * the server and the browser enforce the same rules. Plain data, no React.
 */
import { MOTION_CATEGORIES, MOTION_TEMPLATES, motionTemplateTitle, resolveMotionTemplate } from '@/data/motionRecipeCatalog';
import { isProductTextureShot } from './productShots';

export type SceneKind = 'shot' | 'title';
export type SceneTransition = 'cut' | 'flash';

export interface DirectorScene {
  kind: SceneKind;
  /** Catalog shot id for `shot` scenes; empty for `title` scenes. */
  recipeId: string;
  durationSec: number;
  /** Big on-screen line (title card text, or the shot's title overlay). */
  headline: string;
  /** Small caption strip under the scene; empty for none. */
  caption: string;
  transition: SceneTransition;
}

export interface DirectorPalette {
  background: string;
  text: string;
  accent: string;
}

export interface DirectorPlan {
  title: string;
  summary: string;
  palette: DirectorPalette;
  scenes: DirectorScene[];
}

export const PLAN_LIMITS = {
  minScenes: 2,
  maxScenes: 14,
  minSceneSec: 1.5,
  maxSceneSec: 12,
  minFilmSec: 5,
  maxFilmSec: 90,
  headlineChars: 70,
  captionChars: 90,
} as const;

const HEX = /^#[0-9a-f]{6}$/i;
const DEFAULT_PALETTE: DirectorPalette = { background: '#f7f4ee', text: '#1c1a17', accent: '#b5651d' };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const hex = (v: unknown, fallback: string) => (typeof v === 'string' && HEX.test(v.trim()) ? v.trim().toLowerCase() : fallback);

/** One line per recipe the model may use. Product-page shots are flagged. */
export function buildCatalogBrief(): string {
  const label = Object.fromEntries(MOTION_CATEGORIES.map((c) => [c.key, c.labelEn]));
  return MOTION_TEMPLATES.map(
    (t) =>
      `${t.id} | ${motionTemplateTitle(t)} | ${label[t.category] ?? t.category} | ${t.durationSec}s${
        isProductTextureShot(t.componentName) ? ' | PRODUCT-PAGE' : ''
      } | ${t.summaryEn}`,
  ).join('\n');
}

const sceneSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['kind', 'recipeId', 'durationSec', 'headline', 'caption', 'transition'],
  properties: {
    kind: { type: 'string', enum: ['shot', 'title'] },
    recipeId: { type: 'string' },
    durationSec: { type: 'number' },
    headline: { type: 'string' },
    caption: { type: 'string' },
    transition: { type: 'string', enum: ['cut', 'flash'] },
  },
} as const;

export const PLAN_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'palette', 'scenes'],
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    palette: {
      type: 'object',
      additionalProperties: false,
      required: ['background', 'text', 'accent'],
      properties: { background: { type: 'string' }, text: { type: 'string' }, accent: { type: 'string' } },
    },
    scenes: { type: 'array', items: sceneSchema },
  },
} as const;

/**
 * Validate a model plan: unknown recipes are dropped, copy is trimmed, colours
 * must be hex, and scene durations are clamped then scaled so the film lands on
 * the requested length. Throws when nothing usable is left.
 */
export function validatePlan(raw: unknown, opts: { targetSec: number }): DirectorPlan {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const palIn = (input.palette && typeof input.palette === 'object' ? input.palette : {}) as Record<string, unknown>;
  const scenesIn = Array.isArray(input.scenes) ? input.scenes : [];

  const scenes: DirectorScene[] = [];
  for (const entry of scenesIn) {
    if (scenes.length >= PLAN_LIMITS.maxScenes) break;
    const s = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
    const kind: SceneKind = s.kind === 'title' ? 'title' : 'shot';
    const headline = text(s.headline, PLAN_LIMITS.headlineChars);
    let recipeId = '';
    if (kind === 'shot') {
      const template = typeof s.recipeId === 'string' ? resolveMotionTemplate(s.recipeId) : undefined;
      // Only individual shots are playable; a grouped card id resolves to its card, not a shot.
      if (!template || !MOTION_TEMPLATES.includes(template)) continue;
      recipeId = template.id;
    } else if (!headline) {
      continue;
    }
    const dur = typeof s.durationSec === 'number' && Number.isFinite(s.durationSec) ? s.durationSec : 3;
    scenes.push({
      kind,
      recipeId,
      durationSec: clamp(dur, PLAN_LIMITS.minSceneSec, PLAN_LIMITS.maxSceneSec),
      headline,
      caption: text(s.caption, PLAN_LIMITS.captionChars),
      transition: s.transition === 'flash' ? 'flash' : 'cut',
    });
  }
  if (scenes.length < PLAN_LIMITS.minScenes) throw new Error('The director returned too few usable scenes');

  // Fit to the requested length without breaking the per-scene bounds.
  const target = clamp(opts.targetSec, PLAN_LIMITS.minFilmSec, PLAN_LIMITS.maxFilmSec);
  for (let pass = 0; pass < 3; pass++) {
    const total = scenes.reduce((sum, s) => sum + s.durationSec, 0);
    if (Math.abs(total - target) < 0.05) break;
    const factor = target / total;
    for (const s of scenes) s.durationSec = clamp(s.durationSec * factor, PLAN_LIMITS.minSceneSec, PLAN_LIMITS.maxSceneSec);
  }
  for (const s of scenes) s.durationSec = Math.round(s.durationSec * 10) / 10;

  return {
    title: text(input.title, 80) || 'Motion Studio film',
    summary: text(input.summary, 400),
    palette: {
      background: hex(palIn.background, DEFAULT_PALETTE.background),
      text: hex(palIn.text, DEFAULT_PALETTE.text),
      accent: hex(palIn.accent, DEFAULT_PALETTE.accent),
    },
    scenes,
  };
}

// ── Edit operations ────────────────────────────────────────────────────────

export type DirectorEditOp =
  | { op: 'set_text'; clipId: string; text: string }
  | { op: 'set_duration'; clipId: string; seconds: number }
  | { op: 'remove'; clipId: string }
  | { op: 'replace_recipe'; clipId: string; recipeId: string }
  | { op: 'add_shot'; afterClipId: string; recipeId: string; seconds: number; text: string }
  | { op: 'set_palette'; background: string; text: string; accent: string };

export const EDIT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'ops'],
  properties: {
    reply: { type: 'string' },
    ops: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['op', 'clipId', 'recipeId', 'seconds', 'text', 'background', 'accent'],
        properties: {
          op: { type: 'string', enum: ['set_text', 'set_duration', 'remove', 'replace_recipe', 'add_shot', 'set_palette'] },
          clipId: { type: 'string' },
          recipeId: { type: 'string' },
          seconds: { type: 'number' },
          text: { type: 'string' },
          background: { type: 'string' },
          accent: { type: 'string' },
        },
      },
    },
  },
} as const;

/** Keep only well-formed ops that reference clips that exist and recipes that exist. */
export function validateEditOps(raw: unknown, clipIds: ReadonlySet<string>): { reply: string; ops: DirectorEditOp[] } {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const ops: DirectorEditOp[] = [];
  const shotId = (v: unknown) => {
    const t = typeof v === 'string' ? resolveMotionTemplate(v) : undefined;
    return t && MOTION_TEMPLATES.includes(t) ? t.id : null;
  };
  for (const entry of Array.isArray(input.ops) ? input.ops.slice(0, 20) : []) {
    const o = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
    const clipId = typeof o.clipId === 'string' ? o.clipId : '';
    const seconds = typeof o.seconds === 'number' && Number.isFinite(o.seconds) ? clamp(o.seconds, PLAN_LIMITS.minSceneSec, PLAN_LIMITS.maxSceneSec) : 3;
    switch (o.op) {
      case 'set_text':
        if (clipIds.has(clipId)) ops.push({ op: 'set_text', clipId, text: text(o.text, PLAN_LIMITS.headlineChars) });
        break;
      case 'set_duration':
        if (clipIds.has(clipId)) ops.push({ op: 'set_duration', clipId, seconds });
        break;
      case 'remove':
        if (clipIds.has(clipId)) ops.push({ op: 'remove', clipId });
        break;
      case 'replace_recipe': {
        const recipeId = shotId(o.recipeId);
        if (clipIds.has(clipId) && recipeId) ops.push({ op: 'replace_recipe', clipId, recipeId });
        break;
      }
      case 'add_shot': {
        const recipeId = shotId(o.recipeId);
        if (recipeId) ops.push({ op: 'add_shot', afterClipId: clipIds.has(clipId) ? clipId : '', recipeId, seconds, text: text(o.text, PLAN_LIMITS.headlineChars) });
        break;
      }
      case 'set_palette':
        if ([o.background, o.text, o.accent].some((v) => typeof v === 'string' && HEX.test(v))) {
          ops.push({
            op: 'set_palette',
            background: hex(o.background, ''),
            text: hex(o.text, ''),
            accent: hex(o.accent, ''),
          });
        }
        break;
    }
  }
  return { reply: text(input.reply, 600) || (ops.length ? 'Done.' : 'I could not turn that into a change.'), ops };
}

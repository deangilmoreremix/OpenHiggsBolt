/**
 * Motion Studio film chat — what a chat message asks for, and the Ink Press
 * storyboard built without a model.
 *
 * The chat is the way into the director: "make a promo for my product" starts
 * a film, "use the deck-deal-flyin and row-embed shot cards" picks the shots by
 * name (names copied straight from the Gallery), "design a product close-up
 * inspired by spotlight-hero-card" builds one shot, and "with the Ink Press
 * template" takes the validated template path. Plain data, no React, so the
 * same rules hold in the entry composer, the studio's Agent panel and tests.
 */
import {
  MOTION_TEMPLATES,
  MOTION_TEMPLATE_CARDS,
  getMotionTemplateCardShot,
  motionTemplateTitle,
  resolveMotionTemplate,
  type MotionCategoryKey,
  type MotionTemplate,
} from '@/data/motionRecipeCatalog';
import { PLAN_LIMITS, validatePlan, type DirectorPalette, type DirectorPlan, type DirectorScene } from './directorPlan';

/** Shots of the Ink Press template, in film order: real pages throughout, launch outro. */
export const INK_PRESS_SHOTS: readonly string[] = [
  'opening/spotlight-hero-card/SpotlightHeroCard',
  'ui-entrance/deck-deal-flyin/DeckDealFlyin',
  'ui-entrance/row-embed/RowEmbed',
  'camera/crash-zoom-punch/CrashZoomReal',
  'ui-entrance/page-waterfall-wall/PageWaterfallWall',
  'outro/outro-group-photo-launch/OutroGroupPhotoLaunch',
];

/* findSiteUrl lives here (not in directorClient) so this module stays free of the browser store. */
/** First web address in a prompt (`https://…`, `www.…`, or `name.tld`). */
export function findSiteUrl(prompt: string): string | null {
  const m = prompt.match(/\bhttps?:\/\/[^\s)'"<>]+|\bwww\.[^\s)'"<>]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|io|app|ai|co|dev|net|org|so|xyz|tech)(?:\/[^\s)'"<>]*)?/i);
  return m ? m[0].replace(/[.,;:!?]+$/, '') : null;
}

export const INK_PRESS_PALETTE: DirectorPalette = { background: '#f7f4ee', text: '#1c1a17', accent: '#b5651d' };

export const INK_PRESS_INTRO =
  'I can build this with the Ink Press template — a validated launch film: a bold paper-and-ink title card, ' +
  'your real pages in product shots (spotlight-hero-card → deck-deal-flyin → row-embed → crash-zoom → ' +
  'page-waterfall-wall), caption strips, flash cuts on the beat, whoosh and impact sound design, and a launch outro. ' +
  'It is the fastest path: your screenshots, copy and logo dropped into a template that is already tuned.\n\n' +
  'Use Ink Press? Or I can let the director pick shots from the whole library — or name the shot cards you want ' +
  '(e.g. “use deck-deal-flyin and row-embed”).';

export type FilmTemplateChoice = 'inkpress' | 'director';

export interface FilmRequest {
  /** The message as the user wrote it. */
  prompt: string;
  /** Shots named in the message, in the order they were named. */
  recipes: MotionTemplate[];
  /** "inspired by <shot>" / "a close-up …": build only this shot. */
  single: MotionTemplate | null;
  /** Ink Press named (or explicitly declined); undefined when not mentioned. */
  template: FilmTemplateChoice | undefined;
  /** Length stated in the message, seconds. */
  durationSec: number | null;
  /** Product URL in the message, if any. */
  siteUrl: string | null;
}

const INK_PRESS_RE = /\bink[\s-]?press\b/i;
const FILM_NOUN_RE =
  /\b(?:promo|promotional|teaser|trailer|walkthrough|walk-through|reel|commercial|explainer|showcase|sizzle|launch\s+(?:film|video)|product\s+(?:film|video)|close-?up)\b/i;
const NEW_FILM_RE = /\b(?:a|an|new|another|my)\s+(?:[\w-]+\s+){0,3}(?:video|film|movie|clip)\b/i;
const VERB_RE = /\b(?:make|create|build|produce|design|generate|cut|present|turn|use|start|direct|film|shoot|want|need)\b/i;
const SHOTCRAFT_RE = /\bvideo[\s-]?shotcraft\b/i;
const SINGLE_RE = /\b(?:inspired\s+by|in\s+the\s+style\s+of|based\s+on|like)\b/i;
const SINGLE_NOUN_RE = /\b(?:close-?up|single\s+shot|one\s+shot|a\s+shot)\b/i;
const DURATION_RE = /\b(\d{1,3})\s*-?\s*(?:s|sec|secs|second|seconds)\b/i;
const MINUTE_RE = /\b(\d)\s*-?\s*(?:min|minute)s?\b/i;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Every name a shot can be called by in chat, longest first so "crash-zoom-punch" wins over "crash-zoom". */
const NAME_INDEX: Array<{ re: RegExp; shot: MotionTemplate }> = (() => {
  const entries: Array<{ name: string; shot: MotionTemplate }> = [];
  for (const shot of MOTION_TEMPLATES) {
    entries.push({ name: shot.componentName, shot });
    if (shot.nameEn.includes('-')) entries.push({ name: shot.nameEn, shot });
  }
  for (const card of MOTION_TEMPLATE_CARDS) {
    const shot = getMotionTemplateCardShot(card);
    if (shot && card.slug.includes('-')) entries.push({ name: card.slug, shot });
  }
  const seen = new Set<string>();
  return entries
    .filter((e) => {
      const key = e.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.name.length - a.name.length)
    .map((e) => ({ re: new RegExp(`(?<![\\w-])${escapeRe(e.name)}(?![\\w-])`, 'i'), shot: e.shot }));
})();

/** Shots named in a message (slug, Gallery name or component name, or a full catalog id), in order of mention. */
export function findNamedRecipes(text: string): MotionTemplate[] {
  const hits: Array<{ at: number; shot: MotionTemplate }> = [];
  let rest = text;
  for (const id of text.match(/\b[a-z-]+\/[a-z0-9-]+(?:\/[A-Za-z0-9]+)?\b/g) ?? []) {
    const t = resolveMotionTemplate(id);
    const shot = t && (MOTION_TEMPLATES.includes(t) ? t : getMotionTemplateCardShot(t));
    if (shot) {
      hits.push({ at: text.indexOf(id), shot });
      rest = rest.replace(id, ' '.repeat(id.length));
    }
  }
  for (const { re, shot } of NAME_INDEX) {
    const m = re.exec(rest);
    if (!m) continue;
    hits.push({ at: m.index, shot });
    // Blank the match so a shorter name inside it ("crash-zoom" in "crash-zoom-punch") cannot match again.
    rest = rest.slice(0, m.index) + ' '.repeat(m[0].length) + rest.slice(m.index + m[0].length);
  }
  const out: MotionTemplate[] = [];
  for (const { shot } of hits.sort((a, b) => a.at - b.at)) if (!out.includes(shot)) out.push(shot);
  return out;
}

/** Read a chat message as a film request. */
export function parseFilmRequest(text: string): FilmRequest {
  const prompt = text.trim();
  const recipes = findNamedRecipes(prompt);
  const minutes = prompt.match(MINUTE_RE);
  const seconds = prompt.match(DURATION_RE);
  const durationSec = minutes ? Number(minutes[1]) * 60 : seconds ? Number(seconds[1]) : null;
  const single =
    recipes.length === 1 && (SINGLE_RE.test(prompt) || SINGLE_NOUN_RE.test(prompt)) && !FILM_NOUN_RE.test(prompt.replace(/close-?up/gi, ''))
      ? recipes[0]
      : null;
  let template: FilmTemplateChoice | undefined;
  if (INK_PRESS_RE.test(prompt)) template = /\b(?:no|not|without|skip|don'?t)\b[^.]{0,20}ink[\s-]?press/i.test(prompt) ? 'director' : 'inkpress';
  return { prompt, recipes, single, template, durationSec, siteUrl: findSiteUrl(prompt) };
}

/** True when a message asks for a new film or shot rather than an edit to the current one. */
export function isFilmRequest(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (SHOTCRAFT_RE.test(t) || INK_PRESS_RE.test(t)) return true;
  if (!VERB_RE.test(t)) return false;
  if (FILM_NOUN_RE.test(t) || NEW_FILM_RE.test(t)) return true;
  // "use the deck-deal-flyin and row-embed shot cards to present this feature"
  return findNamedRecipes(t).length > 0 && /\b(?:use|present|design|make|create|build|show)\b/i.test(t);
}

/** Answer to the Ink Press question: yes / no / not an answer. */
export function readTemplateAnswer(text: string): FilmTemplateChoice | null {
  const t = text.trim().toLowerCase();
  if (INK_PRESS_RE.test(t) && !/\b(?:no|not|without|skip)\b/.test(t)) return 'inkpress';
  if (/^(?:y|yes|yep|yeah|sure|ok|okay|please|do it|go|go ahead|use it|sounds good|perfect|great)\b/.test(t)) return 'inkpress';
  if (/\b(?:no|nope|director|library|other shots|pick (?:the )?shots|choose (?:the )?shots|your choice|you choose|surprise)\b/.test(t)) return 'director';
  return null;
}

// ── Ink Press storyboard without a model ───────────────────────────────────

const SCENE_COPY: Record<MotionCategoryKey, [string, string]> = {
  opening: ['Front and *centre*.', 'Your product, the way customers see it'],
  typography: ['Say it *loud*.', 'The message, set in motion'],
  'ui-entrance': ['Every page, *live*.', 'Real screens, not mock-ups'],
  camera: ['Up close on the *details*.', 'Every pixel, sharp'],
  data: ['The numbers that *matter*.', 'Results you can see'],
  interaction: ['Built to be *used*.', 'Click, type, done'],
  transition: ['And *then*…', ''],
  rhythm: ['On the *beat*.', 'Fast, focused, yours'],
  effects: ['A little *magic*.', 'Polish where it counts'],
  outro: ['Ready when *you* are.', 'Launching now'],
};

/** Product name for on-screen copy: captured page title, brand kit, or "for <Name>" in the prompt. */
export function productNameFrom(prompt: string, hints: { siteTitle?: string | null; businessName?: string | null } = {}): string {
  const clean = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 28);
  if (hints.businessName?.trim()) return clean(hints.businessName);
  if (hints.siteTitle?.trim()) return clean(hints.siteTitle.split(/\s[|–—:-]\s/)[0]);
  const m = prompt.match(/\b(?:for|of|called|named)\s+([A-Z][\w.-]*(?:\s+[A-Z][\w.-]*){0,2})/);
  if (m) return clean(m[1]);
  const url = findSiteUrl(prompt);
  if (url) {
    const host = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/.]/)[0];
    if (host) return clean(host.charAt(0).toUpperCase() + host.slice(1));
  }
  return 'your product';
}

const sceneFor = (shot: MotionTemplate, durationSec: number, transition: DirectorScene['transition']): DirectorScene => {
  const [headline, caption] = SCENE_COPY[shot.category] ?? ['', ''];
  return { kind: 'shot', recipeId: shot.id, durationSec, headline: headline.replace(/\*/g, ''), caption, transition };
};

/**
 * A storyboard built from the Ink Press template (or from the shots the user
 * named) with no model call: title card, the shots, a call-to-action card.
 * Fitted to the requested length by the same validation the director's plans go through.
 */
export function inkPressPlan(opts: {
  prompt: string;
  durationSec: number;
  recipes?: readonly MotionTemplate[];
  productName?: string;
  palette?: Partial<DirectorPalette> | null;
}): DirectorPlan {
  const name = opts.productName || productNameFrom(opts.prompt);
  const shots = (opts.recipes?.length ? opts.recipes : INK_PRESS_SHOTS.map((id) => resolveMotionTemplate(id)!).filter(Boolean)).slice();
  const target = Math.max(PLAN_LIMITS.minFilmSec, Math.min(PLAN_LIMITS.maxFilmSec, opts.durationSec));
  // Keep every scene ≥ ~2s: drop template shots (never named ones) until they fit.
  const maxScenes = Math.max(PLAN_LIMITS.minScenes, Math.floor(target / 2));
  const named = Boolean(opts.recipes?.length);
  while (!named && shots.length + 2 > maxScenes && shots.length > 1) shots.splice(shots.length - 2, 1);
  const withTitles = target >= (shots.length + 2) * PLAN_LIMITS.minSceneSec;
  const scenes: DirectorScene[] = [];
  if (withTitles) {
    scenes.push({ kind: 'title', recipeId: '', durationSec: 2.5, headline: `Meet *${name}*.`, caption: '', transition: 'cut' });
  }
  shots.forEach((shot, i) => scenes.push(sceneFor(shot, shot.durationSec || 4, i === 0 || i === shots.length - 1 ? 'flash' : 'cut')));
  if (withTitles) {
    scenes.push({ kind: 'title', recipeId: '', durationSec: 2.5, headline: `Try *${name}* today.`, caption: '', transition: 'cut' });
  }
  if (scenes.length < PLAN_LIMITS.minScenes) {
    scenes.push({ kind: 'title', recipeId: '', durationSec: 2, headline: `*${name}*.`, caption: '', transition: 'cut' });
  }
  const palette = { ...INK_PRESS_PALETTE, ...Object.fromEntries(Object.entries(opts.palette ?? {}).filter(([, v]) => Boolean(v))) };
  const plan = validatePlan(
    {
      title: `${name === 'your product' ? 'Product' : name} — ${named ? 'shot film' : 'Ink Press'}`,
      summary: named
        ? `Your chosen shots (${shots.map(motionTemplateTitle).join(', ')}) between an Ink Press title and call to action.`
        : 'Ink Press template: title card, real-page product shots, caption strips, flash cuts and a launch outro.',
      palette,
      scenes,
    },
    { targetSec: target },
  );
  return plan;
}

/** One shot, adapted to the product: the shot plus its caption, at its native length. */
export function singleShotPlan(shot: MotionTemplate, opts: { prompt: string; productName?: string; palette?: Partial<DirectorPalette> | null }): DirectorPlan {
  const name = opts.productName || productNameFrom(opts.prompt);
  const durationSec = Math.max(PLAN_LIMITS.minSceneSec, Math.min(PLAN_LIMITS.maxSceneSec, shot.durationSec || 5));
  const palette = { ...INK_PRESS_PALETTE, ...Object.fromEntries(Object.entries(opts.palette ?? {}).filter(([, v]) => Boolean(v))) };
  return {
    title: `${name === 'your product' ? 'Product' : name} — ${motionTemplateTitle(shot)}`,
    summary: `One ${motionTemplateTitle(shot)} shot adapted to ${name}.`,
    palette: palette as DirectorPalette,
    scenes: [{ ...sceneFor(shot, durationSec, 'cut'), headline: name === 'your product' ? '' : name }],
  };
}

/**
 * Make sure every shot the user named is in the plan, in their order, then
 * re-fit the length. The director is asked to use them, but its output is
 * checked rather than trusted.
 */
export function ensureRecipes(plan: DirectorPlan, recipes: readonly MotionTemplate[], targetSec: number): DirectorPlan {
  if (!recipes.length) return plan;
  const missing = recipes.filter((r) => !plan.scenes.some((s) => s.recipeId === r.id));
  if (!missing.length) return plan;
  const scenes = plan.scenes.slice();
  // Insert before a closing title / outro so the call to action stays last.
  const last = scenes[scenes.length - 1];
  const closing = last && (last.kind === 'title' || resolveMotionTemplate(last.recipeId)?.category === 'outro') ? 1 : 0;
  scenes.splice(scenes.length - closing, 0, ...missing.map((r) => sceneFor(r, r.durationSec || 4, 'cut')));
  // Drop unnamed shots first if the plan is now too long.
  while (scenes.length > PLAN_LIMITS.maxScenes) {
    const idx = scenes.findIndex((s) => s.kind === 'shot' && !recipes.some((r) => r.id === s.recipeId));
    if (idx < 0) break;
    scenes.splice(idx, 1);
  }
  return validatePlan({ ...plan, scenes }, { targetSec });
}

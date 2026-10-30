/**
 * Motion Studio film pipeline — the steps the chat runs for "make a promo for
 * my product": capture the real pages → storyboard from shot recipes → build
 * the editable project (beat-synced cuts, sound design) → frame QA.
 *
 * The director model is used when the account has it; without it (no OpenAI
 * key, director down) the Ink Press template storyboard is built locally, so a
 * film request always ends in a film.
 */
import { CARDS } from '../cards/registry';
import { projectEndFrame, type ProjectData } from '../types';
import type { AspectRatio } from '../projectContract';
import type { MediaAttachment } from './mediaUpload';
import { analyzeBeats, syncReport, type DrumMap } from './beatSync';
import { t } from '../i18n';
import { planToProject, type FilmCapture } from './buildFilm';
import { captureSite, requestFrameReview, requestPlan, requestRetext, DirectorError, type SiteCapture } from './directorClient';
import { PLAN_LIMITS, type DirectorPalette, type DirectorPlan } from './directorPlan';
import { buildDesignSpec } from './designSpec';
import { applyFilmRules, applySiteContent, chooseSeams, fitNativeLengths, siteNameOf, ensureRecipes, inkPressPlan, INK_PRESS_SHOTS, productNameFrom, restrictToRecipes, singleShotPlan, type FilmRequest, type FilmTemplateChoice } from './filmChat';
import { isProductTextureShot } from './productShots';
import type { BrandInput } from '../demosrc/_fixtures/Brand';
import { resolveMotionTemplate } from '@/data/motionRecipeCatalog';
import { DEMO_TEXTS } from '../demosrc/_generated/demoTexts';
import { fallbackTexts } from './retext';
import { rulesOfScene } from './shotRules';
import { reviewFilm, type ReviewItem } from './filmReview';

export type ActivityStatus = 'running' | 'done' | 'error';
export type ActivityLog = (label: string, status: ActivityStatus) => void;

export interface FilmBrandKit {
  businessName?: string | null;
  colors?: { primary?: string; secondary?: string; accent?: string; background?: string } | null;
  notes?: string | null;
  /** Logo image URL, stamped on the title / call-to-action cards. */
  logo?: string | null;
}

export interface StoryboardResult {
  plan: DirectorPlan;
  capture: SiteCapture | null;
  /** Who wrote the storyboard. */
  source: 'director' | 'inkpress';
  /** Why the director was not used, when it was asked and failed. */
  note?: string;
  /** Attached videos the film will play as their own scenes before the closing card. */
  videos?: Array<{ name: string; sec: number }>;
  /** The attachments this storyboard was planned with; the build uses exactly these. */
  media?: MediaAttachment[];
}

const brandPalette = (capture: SiteCapture | null, kit: FilmBrandKit | null | undefined): Partial<DirectorPalette> => ({
  background: capture?.brand.background ?? kit?.colors?.background ?? undefined,
  text: capture?.brand.text ?? undefined,
  accent: capture?.brand.accent ?? kit?.colors?.accent ?? kit?.colors?.primary ?? undefined,
});

/** Capture (when the request has a URL) and storyboard the film. */
export async function storyboardFilm(
  req: FilmRequest,
  opts: {
    template: FilmTemplateChoice;
    durationSec: number;
    aspectRatio: AspectRatio;
    brandKit?: FilmBrandKit | null;
    capture?: SiteCapture | null;
    /** Seconds the film already gives to attached videos; the storyboard fills the rest. */
    reservedSec?: number;
    /** Returns true once the person has stopped this storyboard (a capture in progress stops waiting). */
    cancelled?: () => boolean;
  },
  log: ActivityLog,
): Promise<StoryboardResult> {
  const bare = (u: string) => u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
  let capture = opts.capture && (!req.siteUrl || bare(opts.capture.url).startsWith(bare(req.siteUrl))) ? opts.capture : null;
  if (!capture && req.siteUrl) {
    log(`Capturing ${req.siteUrl}`, 'running');
    try {
      capture = await captureSite(req.siteUrl, {
        cancelled: opts.cancelled,
        onProgress: (sec) => log(`Capturing ${req.siteUrl} · ${sec}s (reading the page and taking screenshots)`, 'running'),
      });
      const pages = capture.pages?.length || 1;
      const pulled = [capture.logo ? 'logo' : '', capture.images?.length ? `${capture.images.length} site image${capture.images.length === 1 ? '' : 's'}` : ''].filter(Boolean);
      log(
        capture.partial
          ? `Captured ${capture.title || req.siteUrl} · its words only (no screenshots in time)`
          : `Captured ${capture.title || req.siteUrl} · ${pages} page${pages === 1 ? '' : 's'} (${(capture.pages ?? []).map((p) => p.path).join(', ') || '/'}) · ${capture.crops.length} card crops${pulled.length ? ` · ${pulled.join(' · ')}` : ''}`,
        'done',
      );
      const said = capture.content?.headline || capture.content?.description;
      if (said) log(`Read the site: "${said.slice(0, 90)}"${capture.content?.headings?.length ? ` · ${capture.content.headings.length} sections` : ''}`, 'done');
    } catch (error) {
      log(`Could not capture ${req.siteUrl}: ${error instanceof Error ? error.message : 'failed'}`, 'error');
    }
  }
  // Attached videos play as their own scenes; the storyboard gets what is left of the requested length.
  const planSec = Math.max(PLAN_LIMITS.minFilmSec, opts.durationSec - (opts.reservedSec ?? 0));
  // The site the user gave wins over a Brand Kit company: the Brand Kit names the film only when there is no site.
  const hasSite = Boolean(capture || req.siteUrl);
  const productName = productNameFrom(req.prompt, { siteTitle: capture?.title, siteUrl: capture?.url, businessName: hasSite ? null : opts.brandKit?.businessName });
  const palette = brandPalette(capture, opts.brandKit);

  if (req.single) {
    log(`Designing one ${req.single.nameEn} shot`, 'done');
    return { plan: singleShotPlan(req.single, { prompt: req.prompt, productName, palette, durationSec: req.durationSec }), capture, source: 'inkpress' };
  }

  const required =
    req.recipes.length > 0
      ? req.recipes
      : opts.template === 'inkpress'
        ? INK_PRESS_SHOTS.map((id) => resolveMotionTemplate(id)!).filter(Boolean)
        : [];
  log(opts.template === 'inkpress' ? 'Storyboarding with the Ink Press template' : 'Directing the storyboard', 'running');
  try {
    const plan = await requestPlan({
      prompt: req.prompt,
      durationSec: planSec,
      aspectRatio: opts.aspectRatio,
      capture,
      // The Brand Kit company never names a film of a site the user gave.
      brandKit: opts.brandKit ? { ...opts.brandKit, ...(hasSite ? { businessName: null } : {}) } : null,
      requiredRecipes: required.map((r) => r.id),
      template: opts.template === 'inkpress' ? 'inkpress' : null,
    });
    // Picked / named shots are the whole film (plus framing title cards): no other recipes.
    const siteScenes = Boolean(capture && !capture.partial && capture.page?.url);
    const shaped = restrictToRecipes(ensureRecipes(plan, req.recipes, planSec), req.recipes, planSec, { siteScenes });
    // The shot cards' own rules: a recipe once, caps per kind, one look, openers first and outros last.
    const ruled = applyFilmRules(shaped, { keep: new Set(req.recipes.map((r) => r.id)), siteScenes });
    for (const note of ruled.notes) log(`Shot-card rule: ${note}`, 'done');
    const fitted = fitNativeLengths(ruled.plan, planSec, new Set(req.recipes.map((r) => r.id)));
    log(`Storyboard ready · ${fitted.scenes.length} scenes`, 'done');
    return { plan: chooseSeams(applySiteContent(fitted, capture?.content)), capture, source: 'director' };
  } catch (error) {
    const note =
      error instanceof DirectorError && (error.status === 401 || error.status === 403)
        ? error.message
        : `The AI director could not be reached (${error instanceof Error ? error.message : 'error'}).`;
    const plan = inkPressPlan({ prompt: req.prompt, durationSec: planSec, recipes: req.recipes, productName, palette, content: capture?.content, siteScenes: Boolean(capture && !capture.partial && capture.page?.url) });
    log(`Storyboard ready from the Ink Press template · ${plan.scenes.length} scenes`, 'done');
    return { plan: chooseSeams(plan), capture, source: 'inkpress', note };
  }
}

/**
 * The company the recipe demos should speak as. Only films of a captured site get one
 * (so the studio's own demos keep SmartVideo GO); the plan's palette and the site's own
 * words and font replace the demo's.
 */
export function brandFor(plan: DirectorPlan, capture: SiteCapture | null): BrandInput | undefined {
  const name = capture ? siteNameOf(capture.title || '', capture.url) : '';
  if (!capture || !name) return undefined;
  const content = capture.content;
  const taglines = [content?.headline, content?.description, ...(content?.headings ?? [])].filter((v): v is string => Boolean(v)).map((v) => v.trim().slice(0, 80));
  return {
    name,
    logo: capture.logo ?? null,
    accent: plan.palette.accent,
    accent2: plan.palette.accent,
    ink: plan.palette.text,
    paper: plan.palette.background,
    ...(capture.brand.fontFamily ? { font: capture.brand.fontFamily } : {}),
    repo: capture.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
    motto: content?.headline || taglines[0],
    taglines: taglines.slice(0, 4),
    features: (content?.headings ?? []).slice(0, 6),
  };
}

/**
 * The words each shot draws, in the person's product's voice. The director rewrites a recipe's
 * template text from the site and the storyboard; with no key, or when it cannot be reached,
 * the site's own headline, headings and menu fill the same lines.
 */
export async function writeShotWords(plan: DirectorPlan, capture: SiteCapture | null, product: string, log: ActivityLog): Promise<Record<number, Record<string, string>>> {
  const stringsOf = (recipeId: string) => {
    const t = recipeId ? resolveMotionTemplate(recipeId) : undefined;
    return t ? DEMO_TEXTS[t.componentName] ?? [] : [];
  };
  const hasWords = plan.scenes.some((sc) => sc.kind === 'shot' && stringsOf(sc.recipeId).length > 0);
  if (!hasWords) return {};
  log('Writing your words into the shots', 'running');
  try {
    const texts = await requestRetext({ plan, product, capture });
    if (Object.keys(texts).length) {
      log('Shots now say your words', 'done');
      return texts;
    }
  } catch {
    /* fall through to the site's own words */
  }
  const out: Record<number, Record<string, string>> = {};
  const used = new Set<string>();
  plan.scenes.forEach((sc, i) => {
    if (sc.kind !== 'shot') return;
    const rules = rulesOfScene(sc);
    if (rules?.text === 'fixed') return;
    const map = fallbackTexts(stringsOf(sc.recipeId), capture?.content, product, { index: i, headline: sc.headline, caption: sc.caption }, used, rules?.text === 'structural');
    if (Object.keys(map).length) out[i] = map;
  });
  log(Object.keys(out).length ? 'Filled the shots with your site’s own words' : 'Kept the template words (no site words to use)', 'done');
  return out;
}

/** Approved storyboard → editable project, with the music's beat grid when a track was attached. */
export async function buildFilmProject(
  plan: DirectorPlan,
  opts: { aspectRatio: AspectRatio; capture: SiteCapture | null; media: MediaAttachment[]; logo?: string | null; prompt?: string },
  log: ActivityLog,
): Promise<ProjectData> {
  const images = opts.media.filter((m) => m.kind === 'image').map((m) => m.url);
  // The site's own images lead the card slots, then its card crops, then anything attached.
  const film: FilmCapture | null = opts.capture
    ? {
        // Every captured route of the site, the page asked for first.
        screens: [opts.capture.page.url, ...(opts.capture.pages ?? []).slice(1).map((p) => p.url), ...images].filter(Boolean),
        crops: [...(opts.capture.images ?? []), ...opts.capture.crops, ...images],
        title: opts.capture.title,
        // Where each section of the home page starts, so the insets can show them one at a time.
        sections: (opts.capture.pages?.[0]?.layout?.sections ?? []).map((r) => r.y),
        pageH: opts.capture.pages?.[0]?.layout?.pageH ?? opts.capture.page.height,
        sectionNames: opts.capture.content?.headings ?? [],
        nav: opts.capture.content?.nav ?? [],
        ctas: opts.capture.content?.ctas ?? [],
        address: opts.capture.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
      }
    : images.length
      ? { screens: images, crops: images }
      : null;
  const track = opts.media.find((m) => m.kind === 'audio');
  let beats: number[] = [];
  let drums: Pick<DrumMap, 'downbeats' | 'kicks' | 'snares' | 'hats'> = { downbeats: [], kicks: [], snares: [], hats: [] };
  if (track) {
    log(`Finding the beat in ${track.name}`, 'running');
    const map = await analyzeBeats(track.url).catch(() => null);
    beats = map?.beats ?? [];
    if (map) drums = map;
    log(beats.length ? `Cuts snapped to the beat of ${track.name}` : `No clear beat in ${track.name}; kept the planned timing`, 'done');
  }
  const brand = brandFor(plan, opts.capture);
  const product = brand?.name ?? plan.title.split(/\s[—–-]\s/)[0];
  const texts = await writeShotWords(plan, opts.capture, product, log);
  log('Animating the shots and laying in sound design', 'running');
  const videos = opts.media.filter((m) => m.kind === 'video').map((m) => ({ url: m.url, name: m.name, durationSec: m.durationSec }));
  if (videos.length) log(`Cutting in ${videos.length} attached video${videos.length === 1 ? '' : 's'}`, 'done');
  const project = planToProject(plan, {
    aspectRatio: opts.aspectRatio,
    capture: film,
    music: track ? { url: track.url, name: track.name, beats, downbeats: drums.downbeats, kicks: drums.kicks } : null,
    // A film of a captured site shows that site's logo (none if it had none); the Brand Kit logo is for films with no site.
    logo: opts.capture ? opts.capture.logo ?? null : opts.logo ?? null,
    videos,
    brand,
    texts,
  });
  if (beats.length) {
    const cuts = (project.tracks.find((tr) => tr.name === t('track.shots'))?.clips ?? []).slice(1).map((c) => c.start / project.fps);
    const sync = syncReport(cuts, beats, project.fps);
    const onKick = syncReport(cuts, [...drums.kicks, ...drums.downbeats], project.fps).within;
    log(`Beat sync measured: ${sync.within} of ${sync.cuts} cuts within 3 frames of a beat (worst ${sync.worstFrames} frames)${drums.kicks.length ? `, ${onKick} on a kick or a downbeat` : ''}`, 'done');
  }
  log(`Film built · ${project.tracks.length} tracks`, 'done');
  return { ...project, spec: buildDesignSpec(plan, opts.capture, opts.prompt) };
}

export interface FilmQaReport {
  ok: boolean;
  issues: string[];
  warnings: string[];
  /** Frames rendered by the frame check (0 when the browser cannot render stills). */
  framesChecked: number;
  /** The programmatic part of the final review (lib/filmReview). */
  review?: ReviewItem[];
}

/** Structural check of a built film: every clip resolves, shots run back to back, nothing runs past the end. */
export function checkFilmStructure(project: ProjectData, opts: { hasProductImages: boolean } = { hasProductImages: false }): FilmQaReport {
  const issues: string[] = [];
  const warnings: string[] = [];
  const end = projectEndFrame(project);
  if (end <= 0) issues.push('The film is empty.');
  for (const track of project.tracks) {
    const clips = track.clips.slice().sort((a, b) => a.start - b.start);
    for (const c of clips) {
      if (!CARDS[c.cardId]) issues.push(`${track.name}: clip uses an unknown card (${c.cardId}).`);
      if (c.duration <= 0) issues.push(`${track.name}: a clip has no length.`);
    }
    if (clips.some((c) => c.cardId.startsWith('demo:') || c.cardId === 'inkpress-title-card')) {
      for (let i = 1; i < clips.length; i++) {
        const gap = clips[i].start - (clips[i - 1].start + clips[i - 1].duration);
        if (gap > 1) issues.push(`${track.name}: ${gap}-frame black gap at ${(clips[i].start / project.fps).toFixed(1)}s.`);
        if (gap < -1) issues.push(`${track.name}: shots overlap at ${(clips[i].start / project.fps).toFixed(1)}s.`);
      }
    }
  }
  const productShots = project.tracks.flatMap((t) => t.clips).filter((c) => c.cardId.startsWith('demo:') && isProductTextureShot(c.cardId.slice(5)));
  if (productShots.length && !opts.hasProductImages) {
    warnings.push(`${productShots.length} product shot${productShots.length === 1 ? '' : 's'} show sample pages — add your URL or attach screenshots to put your product on screen.`);
  }
  return { ok: issues.length === 0, issues, warnings, framesChecked: 0, review: reviewFilm(project) };
}

/**
 * Frame QA: render the middle frame of every shot and the film's first and
 * last frame (in the browser, with the same composition the export uses) and
 * report the ones that fail. Skipped when the browser cannot render stills; bounded by `budgetMs`.
 */
export async function checkFilmFrames(project: ProjectData, log: ActivityLog, budgetMs = 20_000): Promise<{ checked: number; failed: string[] }> {
  let render: typeof import('../webRenderer').renderStillOnWebExport;
  try {
    render = (await import('../webRenderer')).renderStillOnWebExport;
  } catch {
    return { checked: 0, failed: [] };
  }
  const shotTrack = project.tracks.find((t) => t.clips.some((c) => c.cardId.startsWith('demo:'))) ?? project.tracks[0];
  const frames = new Set<number>();
  // The middle of every shot, plus the film's first and last frame.
  for (const c of shotTrack?.clips ?? []) frames.add(c.start + Math.floor(c.duration / 2));
  frames.add(0);
  frames.add(Math.max(0, projectEndFrame(project) - 1));
  const list = [...frames].sort((a, b) => a - b);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budgetMs);
  const failed: string[] = [];
  let checked = 0;
  log(`Frame QA · checking ${list.length} frames`, 'running');
  try {
    for (const f of list) {
      if (controller.signal.aborted) break;
      try {
        await render(project, f, controller.signal);
        checked++;
      } catch (error) {
        if (controller.signal.aborted) break;
        failed.push(`${(f / project.fps).toFixed(2)}s: ${error instanceof Error ? error.message : 'render failed'}`);
      }
    }
  } finally {
    clearTimeout(timer);
  }
  log(
    failed.length
      ? `Frame QA · ${failed.length} of ${checked + failed.length} frames failed`
      : checked
        ? `Frame QA · ${checked} frames render cleanly${checked < list.length ? ` (time budget reached at ${checked}/${list.length})` : ''}`
        : 'Frame QA · skipped (this browser cannot render stills)',
    failed.length ? 'error' : 'done',
  );
  return { checked, failed };
}

/** A frame as a small JPEG data URL (the reviewer sees 640 px wide, enough for layout and legibility). */
async function stillToJpeg(blob: Blob, maxW = 800): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxW / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.7);
}

/**
 * Independent review of a built film by a model that sees a few of its frames and the design
 * spec (final-review.md: a reviewer that did not make the film). Best effort: returns [] when
 * there is no key, no spec, the browser cannot render stills, or the model cannot be reached.
 */
export async function reviewFramesWithModel(project: ProjectData, budgetMs = 30_000): Promise<string[]> {
  if (!project.spec) return [];
  let render: typeof import('../webRenderer').renderStillOnWebExport;
  try {
    render = (await import('../webRenderer')).renderStillOnWebExport;
  } catch {
    return [];
  }
  const shotTrack = project.tracks.find((tr) => tr.clips.some((c) => c.cardId.startsWith('demo:') || c.cardId.startsWith('brand-'))) ?? project.tracks[0];
  const clips = (shotTrack?.clips ?? []).slice().sort((a, b) => a.start - b.start);
  const picks = clips.length <= 5 ? clips : [0, 1, 2, 3, 4].map((i) => clips[Math.round((i * (clips.length - 1)) / 4)]);
  const frames = [...new Set(picks.map((c) => c.start + Math.floor(c.duration * 0.6)))].slice(0, 5);
  frames.push(Math.max(0, projectEndFrame(project) - 12));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budgetMs);
  try {
    const images: Array<{ second: number; image: string }> = [];
    for (const f of frames) {
      if (controller.signal.aborted) break;
      const still = await render(project, f, controller.signal);
      images.push({ second: Math.round((f / project.fps) * 10) / 10, image: await stillToJpeg(still.blob) });
    }
    if (!images.length) return [];
    const { findings, summary } = await requestFrameReview({ frames: images, spec: project.spec });
    return [
      findings.length ? `A second reviewer looked at ${images.length} frames:` : `A second reviewer looked at ${images.length} frames and flagged nothing it could see.`,
      ...findings.map((f) => `- ${f.severity === 'fix' ? '✗' : '?'} ${f.second.toFixed(1)}s ${f.text}`),
      ...(summary ? [summary] : []),
    ];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

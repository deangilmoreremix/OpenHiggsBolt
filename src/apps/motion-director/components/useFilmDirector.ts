'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adaptedOf, adaptedStub, clearCheckpoint, decideResume, loadCheckpoint, saveCheckpoint, type AdaptedShot, type ResumeAction, type RunCheckpoint } from '../lib/runStore';
import type { AspectRatio } from '../projectContract';
import type { ProjectData } from '../types';
import type { MediaAttachment } from '../lib/mediaUpload';
import type { MotionTemplate } from '@/data/motionRecipeCatalog';
import { motionTemplateTitle, resolveMotionTemplate } from '@/data/motionRecipeCatalog';
import {
  INK_PRESS_INTRO,
  MAX_PICKED_SHOTS,
  isFilmRequest,
  isQuestion,
  parseFilmRequest,
  readTemplateAnswer,
  reviseRecipes,
  startsDifferentFilm,
  type FilmRequest,
  type FilmTemplateChoice,
} from '../lib/filmChat';
import { videoSceneSec } from '../lib/buildFilm';
import { askDirector, captureSite, DirectorError, requestBrief, requestDirections, requestMapping, requestFinalReview, fetchReferenceFrames, type GuidedContext, type SiteCapture } from '../lib/directorClient';
import type { DirectionOptions, DirectorBrief, DirectorPlan, MappingRow } from '../lib/directorPlan';
import { renderStyleframes, type Styleframe } from '../lib/styleframes';
import { applyReviewFixes, finalReviewLines, reviewShots, reviewStillApplies, runFinalReview } from '../lib/finalReview';
import { ACCEPT_RE, YOU_DECIDE_RE, briefMessage, briefText, directionMessage, directionText, mappingMessage, mappingText, pickDirection, sceneLine } from '../lib/coCreate';
import { releaseLine } from '../lib/releaseCheck';
import { initialSteps, markStep, type FilmStep, type FilmStepId, type FilmStepState } from '../lib/filmSteps';
import {
  buildFilmProject,
  checkFilmFrames,
  stillToJpeg,
  checkFilmStructure,
  storyboardFilm,
  StoryboardError,
  type ActivityStatus,
  type FilmBrandKit,
  type FilmQaReport,
  type StoryboardResult,
} from '../lib/filmPipeline';
import { fixFilm } from '../lib/filmFix';
import { reviewSummary } from '../lib/filmReview';
import { captureQuality, personalisesWithSite } from '../lib/captureQuality';
import { filmPersonalization, summarizePersonalization, type AdaptationOutcome } from '../lib/personalization';
import { completeStage, failStage, recoverRun, finalStatus, finalStatusLine, newRun, reviewCoverage, skipStage, startStage, stepsOf, STAGE_ORDER, type CreationMode, type ProductionRun, type ReviewRecord } from '../lib/productionRun';
import { filmFingerprint } from '../lib/filmFingerprint';
import { materialOf } from '../lib/material';
import { soundRecord } from '../lib/soundRecord';
import { applyFilmEdits, parseFilmEdits } from '../lib/editFilm';
import { briefLines as briefLinesOf } from '../lib/productBrief';
import { sceneRecords } from '../lib/recipeNeeds';
import { browserPixels, recordScenes, validateShotScenes } from '../lib/sceneQa';

/**
 * The film conversation: one chat turns a request into a finished film.
 *
 *   "make a promo for my product" → introduces Ink Press and asks → captures the
 *   pages → storyboard (shot recipe cards, approve / revise) → builds the film
 *   (beat sync, sound design) → frame QA → the film plays in the chat, renders
 *   to MP4, and opens in the Motion Workbench for editing.
 *
 * Shared by the entry composer and the studio's Agent panel.
 */

export interface FilmChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: string;
}

/** `brief` → `direction` → `mapping` are the co-creation steps the person confirms before the storyboard. */
/** The person asked for no sound at all: the film carries no sound clips and the sound stage is waived. */
const SILENT_RE = /\b(?:silent (?:film|video|movie)|no (?:sound|audio|sfx|sound effects)(?: or music)?|without (?:any )?(?:sound|audio)|mute)\b/i;

export type FilmStage = 'idle' | 'offer' | 'brief' | 'direction' | 'mapping' | 'storyboarding' | 'plan' | 'building' | 'film';

/** What a co-creation conversation has settled so far. */
interface GuidedState {
  req: FilmRequest;
  capture: SiteCapture | null;
  notes: string[];
  brief?: DirectorBrief;
  options?: DirectionOptions;
  direction?: string;
  mapping?: MappingRow[];
}

export interface FilmSettings {
  aspectRatio: AspectRatio;
  durationSec: number;
  brandKit?: FilmBrandKit | null;
  media: MediaAttachment[];
  /** Shots picked in the Templates picker; added to any named in chat. */
  pickedRecipes: MotionTemplate[];
}

export interface BuiltFilm {
  project: ProjectData;
  qa: FilmQaReport;
}

let seq = 0;
const msg = (role: FilmChatMessage['role'], content: string): FilmChatMessage => ({
  id: `fm-${Date.now().toString(36)}-${(seq++).toString(36)}`,
  role,
  content,
  ts: new Date().toISOString(),
});

const secs = (p: { scenes: { durationSec: number }[] }) => Math.round(p.scenes.reduce((s, sc) => s + sc.durationSec, 0));

export function useFilmDirector(opts: {
  settings: () => FilmSettings;
  /** Mirror of every message (e.g. into the studio session). */
  onMessage?: (m: FilmChatMessage) => void;
  /** Called when a film is built (the Agent panel installs it straight into the workbench). */
  onBuilt?: (film: BuiltFilm) => void;
  /**
   * The film as it is now where the caller keeps it (the workbench's project). A late review fix is only
   * applied while this is still the film that was reviewed, so edits made in the meantime are never lost.
   */
  currentProject?: () => unknown;
  /** Which messages start a new film (default `isFilmRequest`). */
  isRequest?: (text: string) => boolean;
  /**
   * The chat also edits the current film: while the Ink Press question is
   * open, a message that is not an answer goes back to the caller as an edit
   * (`send` returns false) instead of re-asking.
   */
  editFallback?: boolean;
}) {
  const [messages, setMessages] = useState<FilmChatMessage[]>([]);
  const [stage, setStage] = useState<FilmStage>('idle');
  const [activity, setActivity] = useState<Array<{ label: string; status: ActivityStatus }>>([]);
  const [storyboard, setStoryboard] = useState<StoryboardResult | null>(null);
  /** Two real stills per visual direction, shown while the person chooses (best effort; empty when stills cannot be rendered). */
  const [styleframes, setStyleframes] = useState<Styleframe[]>([]);
  const styleframeUrls = useRef<string[]>([]);
  const setFrames = useCallback((frames: Styleframe[]) => {
    for (const url of styleframeUrls.current) URL.revokeObjectURL(url);
    styleframeUrls.current = frames.flatMap((f) => f.frames);
    setStyleframes(frames);
  }, []);
  useEffect(() => () => { for (const url of styleframeUrls.current) URL.revokeObjectURL(url); }, []);
  const [film, setFilm] = useState<BuiltFilm | null>(null);
  // The film this hook last installed, to tell whether a late review is still about the film on screen.
  const lastFilm = useRef<BuiltFilm | null>(null);
  useEffect(() => {
    lastFilm.current = film;
  }, [film]);
  /** The seven workflow steps (Product → Deliver) with their live state. */
  const [steps, setSteps] = useState<FilmStep[]>(initialSteps);
  const mark = useCallback((id: FilmStepId, state: FilmStepState, detail?: string) => setSteps((prev) => markStep(prev, id, state, detail)), []);
  /** The production run: the one record the step strip, the chat's status lines and the saved project read (lib/productionRun). */
  const [run, setRun] = useState<ProductionRun | null>(null);
  const runRef = useRef<ProductionRun | null>(null);
  // Checkpoints (P6): the run, the request, the approved storyboard and the shots already adapted are stored after every stage and every adapted shot.
  const sbRef = useRef<StoryboardResult | null>(null);
  const adaptedRef = useRef<AdaptedShot[]>([]);
  const checkpointRef = useRef<() => void>(() => undefined);
  /** A run found in storage that was interrupted, and what resuming it would do. */
  const [resumeOffer, setResumeOffer] = useState<{ action: ResumeAction; cp: RunCheckpoint } | null>(null);
  const resumeJob = useRef<{ adapted: AdaptedShot[] } | null>(null);
  const upd = useCallback((fn: (r: ProductionRun) => ProductionRun) => {
    if (!runRef.current) return;
    runRef.current = fn(runRef.current);
    setRun(runRef.current);
    checkpointRef.current();
  }, []);
  /** Fingerprint of the film as it is NOW (the Workbench's copy when the caller keeps one, else this hook's): approvals are tied to it. */
  const curFp = useCallback((): string | undefined => {
    const p = (optsRef.current.currentProject?.() ?? lastFilm.current?.project) as Parameters<typeof filmFingerprint>[0] | undefined;
    return p && Array.isArray((p as { tracks?: unknown }).tracks) ? filmFingerprint(p) : undefined;
  }, []);
  /** A stage that was running when something threw did not finish: say so on the record. */
  const failRunning = useCallback((why: string) => upd((r) => { const id = STAGE_ORDER.find((x) => r.stages[x].status === 'running'); return id ? failStage(r, id, why) : r; }), [upd]);
  const pending = useRef<{ req: FilmRequest; template: FilmTemplateChoice } | null>(null);
  useEffect(() => { sbRef.current = storyboard; if (storyboard) checkpointRef.current(); }, [storyboard]);
  checkpointRef.current = () => {
    const r = runRef.current;
    if (!r) return;
    const sb = sbRef.current;
    saveCheckpoint({
      run: r,
      request: { prompt: pending.current?.req.prompt ?? r.request, aspectRatio: String(pending.current?.req.aspectRatio ?? optsRef.current.settings().aspectRatio), template: pending.current?.template === 'inkpress' ? 'inkpress' : pending.current?.template === 'local' ? 'local' : 'director' },
      ...(sb ? { storyboard: { plan: sb.plan, capture: sb.capture, source: sb.source, note: sb.note, videos: sb.videos, media: sb.media, mapping: sb.mapping, release: sb.release, direction: sb.direction, brief: sb.brief, decisions: sb.decisions, gate: sb.gate } } : {}),
      adapted: adaptedRef.current,
    });
  };
  // On mount: an interrupted production in storage is recovered and offered (Resume / Start over), never silently restarted or dropped.
  useEffect(() => {
    const cp = loadCheckpoint();
    if (!cp) return;
    const action = decideResume(cp);
    if (action.kind !== 'none') setResumeOffer({ action, cp });
    else if (cp.run.stages.build.status === 'completed') { /* a built film is the Workbench's project; the slot is kept for its run record */ }
  }, []);
  const offerReq = useRef<FilmRequest | null>(null);
  const guided = useRef<GuidedState | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  /**
   * Conversation generation: `reset` (e.g. switching sessions) bumps it, and
   * every async step checks it before writing, so a storyboard or film that
   * finishes after the switch never lands in the other session.
   */
  const gen = useRef(0);
  /** The build in progress, so Stop can end shot adaptation and frame QA. */
  const buildController = useRef<AbortController | null>(null);
  // Unmounting (e.g. the rail switching to History) abandons in-flight work too, so a build
  // that finishes later can't install its film into whatever session is open by then.
  useEffect(
    () => () => {
      gen.current++;
    },
    [],
  );

  const say = useCallback((role: FilmChatMessage['role'], content: string) => {
    const m = msg(role, content);
    setMessages((prev) => [...prev, m]);
    optsRef.current.onMessage?.(m);
  }, []);

  const log = useCallback((label: string, status: ActivityStatus) => {
    setActivity((prev) => [...prev.filter((a) => a.status !== 'running'), { label, status }].slice(-8));
  }, []);

  const runStoryboard = useCallback(
    /** `reuseCapture`: only a revision of the storyboard on the table keeps its site capture. */
    async (req: FilmRequest, template: FilmTemplateChoice, reuseCapture = false, known: SiteCapture | null = null) => {
      const my = gen.current;
      const live = () => gen.current === my;
      const glog: typeof log = (label, status) => {
        if (!live()) return;
        log(label, status);
        if (/^Partial capture of /.test(label)) mark('capture', 'warning', label.replace(/^Partial capture of [^·]*· ?/, ''));
        else if (/^Captured /.test(label)) mark('capture', 'done', label.replace(/^Captured [^·]*· ?/, ''));
        else if (/^Could not capture/.test(label)) {
          mark('capture', 'error', label);
          say('assistant', `${label}. The film will use sample pages instead of your site. Send the address again (or attach screenshots) and I'll re-capture.`);
        }
      };
      const s = optsRef.current.settings();
      // A revision carries its own (revised) list; a new film adds the shots picked in Templates.
      const wanted = reuseCapture ? req.recipes : [...req.recipes, ...s.pickedRecipes.filter((r) => !req.recipes.includes(r))];
      // A storyboard holds MAX_PICKED_SHOTS named shots; say so instead of silently losing the rest.
      const recipes = wanted.slice(0, MAX_PICKED_SHOTS);
      if (wanted.length > recipes.length && live()) {
        say('assistant', `A film can hold up to ${MAX_PICKED_SHOTS} chosen shots, so I'm using the first ${MAX_PICKED_SHOTS} (dropped: ${wanted.slice(MAX_PICKED_SHOTS).map((r) => r.slug).join(', ')}).`);
      }
      // "A close-up inspired by X" builds one shot — unless Templates picks add more shots, then it's a film of them all.
      const single = req.single && recipes.every((r) => r === req.single) ? req.single : null;
      const full = { ...req, recipes, single };
      // What the storyboard is planned with is what gets built, even if attachments change before approval.
      // Copy the records too: a video's length is probed after it is attached and lands on the same object.
      const media = s.media.map((m) => ({ ...m }));
      // Attached videos are scenes of the film too: they take their time out of the requested length.
      const videos = media.filter((m) => m.kind === 'video').map((m) => ({ name: m.name, sec: videoSceneSec(m) }));
      pending.current = { req: full, template };
      setStage('storyboarding');
      setStoryboard(null);
      setFilm(null);
      setActivity([]);
      const images = media.filter((m) => m.kind === 'image').length;
      let next = markStep(initialSteps(), 'product', 'done', req.siteUrl ?? 'From your message');
      next = known || (reuseCapture && storyboard?.capture)
        ? markStep(next, 'capture', 'done', 'Reusing the captured pages')
        : req.siteUrl
          ? markStep(next, 'capture', 'active', `Capturing ${req.siteUrl}`)
          : markStep(next, 'capture', images ? 'done' : 'skipped', images ? `${images} attached screenshot${images === 1 ? '' : 's'}` : 'No URL — sample pages');
      setSteps(markStep(next, 'storyboard', 'active'));
      const mode: CreationMode = template === 'local' ? 'local' : template === 'inkpress' ? 'inkpress' : full.single ? 'single' : full.mapping?.length ? 'cocreate' : 'autonomous';
      // A new production starts with no adapted shots of an earlier film (they must never be checkpointed under the new run).
      adaptedRef.current = [];
      resumeJob.current = null;
      runRef.current = { ...startStage(newRun(full.prompt, mode), 'brief'), ...(SILENT_RE.test(full.prompt) ? { silent: true } : {}) };
      setRun(runRef.current);
      if (!req.siteUrl && !media.some((m) => m.kind === 'image')) {
        say('assistant', 'No product URL or screenshots yet, so the product shots will use sample pages. Add your URL to the message (or attach screenshots) any time and I will re-capture.');
      }
      try {
        const result = await storyboardFilm(
          full,
          {
            template,
            durationSec: req.durationSec ?? s.durationSec,
            aspectRatio: req.aspectRatio ?? s.aspectRatio,
            brandKit: s.brandKit,
            capture: known ?? (reuseCapture ? storyboard?.capture ?? null : null),
            reservedSec: videos.reduce((sum, v) => sum + v.sec, 0),
            cancelled: () => !live(),
            media,
            // Stage 0 and 1 outputs are recorded the moment they exist, so later stages (and a reload) can use them.
            onBrief: (b) => live() && upd((r) => startStage(completeStage(r, { stage: 'brief', productName: b.productName, kind: b.kind, features: b.features, objective: b.objective }, { kind: b.kind, features: b.features.length, missing: b.missing }), 'direction')),
            onDirection: (d) => {
              if (!live()) return;
              upd((r) => startStage(completeStage(r, { stage: 'direction', chosen: d.chosen.name }, { source: d.source ?? 'director' }), 'mapping'));
              // Stage 1: the styleframes are rendered NOW, before any shot is chosen, from the direction just chosen.
              void renderStyleframes({ options: { directions: [d.chosen], recommended: 0 }, capture: known ?? null, product: d.chosen.name, opening: true }).then((frames) => {
                if (live() && frames.length) setFrames(frames);
              });
            },
          },
          glog,
        );
        if (!live()) return;
        upd((r) => {
          let x = r;
          const why = mode === 'inkpress' ? 'the Ink Press template fixes its look' : mode === 'single' ? 'a single shot' : 'the director did not produce a direction';
          if (['pending', 'running'].includes(x.stages.direction.status)) {
            // Co-creation: the direction was chosen WITH the person, so that stage happened (recorded as theirs); it is not a skipped operation.
            if (mode === 'cocreate') x = startStage(completeStage(startStage(x, 'direction'), { stage: 'direction', chosen: result.direction?.chosen.name ?? null, userSupplied: true }, { source: 'person' }), 'mapping');
            else x = skipStage(x, 'direction', result.direction ? 'recorded with the storyboard' : why);
          }
          if (result.mapping?.length) x = completeStage(['pending', 'running'].includes(x.stages.mapping.status) ? startStage(x, 'mapping') : x, { stage: 'mapping', rows: result.mapping }, { rows: result.mapping.length });
          else if (['pending', 'running'].includes(x.stages.mapping.status)) x = skipStage(x, 'mapping', mode === 'inkpress' ? 'the Ink Press scenes are the map' : mode === 'single' ? 'a single shot' : 'the director did not produce a feature map');
          // Failures the gate could not repair block the storyboard from being called clean; a pick of the person's own is reported, not blocking.
          x = completeStage(startStage(x, 'storyboard'), { stage: 'storyboard', scenes: result.plan.scenes.length, failedChecks: (result.gate?.failed ?? []).filter((f) => !/your pick/.test(f)) }, { release: result.release?.filter((i) => !i.ok).length ?? 0 });
          return completeStage(startStage(x, 'assets'), { stage: 'assets', scenes: sceneRecords(result.plan, materialOf(result.capture, media)) });
        });
        result.videos = videos;
        result.media = media;
        setStoryboard(result);
        setStage('plan');
        // Stage 1: the chosen direction as still key frames (opening, the site, the close), while the person reads the storyboard.
        setFrames([]);
        if (result.direction) {
          const chosen = result.direction.chosen;
          void renderStyleframes({ options: { directions: [chosen], recommended: 0 }, capture: result.capture, product: result.plan.title, opening: true }).then((frames) => {
            if (live() && frames.length) setFrames(frames);
          });
        }
        const videoSec = videos.reduce((sum, v) => sum + v.sec, 0);
        mark(
          'storyboard',
          'done',
          `${result.plan.scenes.length + videos.length} scene${result.plan.scenes.length + videos.length === 1 ? '' : 's'} · ${Math.round(secs(result.plan) + videoSec)}s · ${result.source === 'director' ? 'AI director' : 'Ink Press'}`,
        );
        if (result.capture) {
          const c = result.capture;
          const headline = c.content?.headline?.replace(/\s+/g, ' ').trim();
          const ctas = (c.content?.ctas ?? []).slice(0, 3);
          const found = [
            `${(c.pages?.length ?? 1)} page${(c.pages?.length ?? 1) === 1 ? '' : 's'}`,
            c.crops.length ? `${c.crops.length} card crop${c.crops.length === 1 ? '' : 's'}` : '',
            c.assets?.length ? `${c.assets.length} found pictures (${[...new Set(c.assets.map((a) => a.category.replace(/_/g, ' ')))].slice(0, 4).join(', ')})` : '',
            c.images?.length ? `${c.images.length} site image${c.images.length === 1 ? '' : 's'}` : '',
            c.logo ? 'the logo' : '',
          ].filter(Boolean);
          say(
            'assistant',
            `I read ${c.title || c.url}${headline ? ` — it says “${headline.slice(0, 120)}”` : ''}${ctas.length ? `, with calls to action ${ctas.map((x) => `“${x}”`).join(', ')}` : ''}. ${
              c.partial
                ? 'The page was too slow to screenshot in time, so the film uses sample pages with your site’s own words. Try again later, or attach screenshots, to use your real pages.'
                : `I captured ${found.join(', ')} to use in the film.`
            }`,
          );
        }
        let clockAt = 0;
        const lines = result.plan.scenes.map((sc) => {
          const line = sceneLine(sc, clockAt);
          clockAt += sc.durationSec;
          return line;
        });
        // Attached videos play just before the closing scene (after a one-scene film), as the build places them.
        lines.splice(lines.length > 1 ? lines.length - 1 : lines.length, 0, ...videos.map((v) => `Your video ${v.name} · ${v.sec}s`));
        const numbered = lines.map((line, i) => `${i + 1}. ${line}`);
        // The method's decisions stay in the chat (the step list only keeps the last few lines):
        // the visual direction (stage 1), the feature → shot map (stage 2) and the release check (stage 3).
        const d = result.direction?.chosen;
        const decided = [
          d ? `Visual direction: ${d.name} — ${d.claim}${d.why ? ` Why: ${d.why}.` : ''}${d.tradeoff ? ` Trade-off: ${d.tradeoff}.` : ''}${result.direction!.others.length ? ` (weighed against ${result.direction!.others.join(', ')})` : ''}` : '',
          result.mapping?.length ? `Feature → shot map:\n${mappingMessage(result.mapping).split('\n').slice(1).filter((l) => /^\d+\./.test(l)).join('\n')}` : '',
          result.release?.length ? releaseLine(result.release) : '',
        ].filter(Boolean);
        const brief = result.brief;
        if (brief) decided.unshift(`Product brief: ${briefLinesOf(brief).join(' · ')}`);
        if (result.gate?.swaps.length) decided.push(`Storyboard gate swapped: ${result.gate.swaps.join('; ')}.`);
        const gateFailed = result.gate?.failed ?? [];
        const stage = runRef.current?.stages.assets;
        if (stage?.status === 'needs-input' || gateFailed.length) decided.push(`Heads up: ${[...gateFailed, ...(stage?.status === 'needs-input' && stage.note ? [stage.note] : [])].join('; ')}. Those shots will play as the plain recipe unless you add what they need (a site URL, or images), and the film will say so.`);
        if (decided.length) say('assistant', decided.join('\n\n'));
        say(
          'assistant',
          `${result.note ? `${result.note} I used the Ink Press template instead.\n\n` : ''}${result.source === 'director' && result.plan.summary ? `${result.plan.summary}\n\n` : ''}Storyboard “${result.plan.title}” — ${lines.length} scene${lines.length === 1 ? '' : 's'}, ${Math.round(secs(result.plan) + videos.reduce((sum, v) => sum + v.sec, 0))}s${personalisesWithSite(result.capture) ? ', using your captured pages' : result.capture ? ', using only your site\'s words (its pages could not be screenshotted)' : ''}:\n${numbered.join('\n')}\n\nApprove to build the film, ask me why I chose something, or tell me what to change.`,
        );
      } catch (error) {
        if (!live()) return;
        failRunning(error instanceof Error ? error.message : 'failed');
        mark('storyboard', 'error', error instanceof Error ? error.message : 'failed');
        if (error instanceof StoryboardError) {
          // Nothing was substituted: the request goes back on the table with the existing choices, so retrying and
          // using the template are the person's decision.
          offerReq.current = req;
          setStage('offer');
          say('assistant', `The AI director could not plan this film: ${error.message}.\n\nNothing was substituted. Choose “Let the director pick shots” to try again, or “Use Ink Press” to build it from the Ink Press template instead.`);
          return;
        }
        setStage('idle');
        say('assistant', `I could not storyboard that: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    },
    [log, mark, say, storyboard?.capture, upd, failRunning, setFrames],
  );


  /** Co-creation (video-shotcraft's guided flow): brief → visual direction → feature-to-shot mapping → storyboard. */
  const guidedContext = useCallback((g: GuidedState, extra: Partial<GuidedContext> = {}): GuidedContext => {
    const set = optsRef.current.settings();
    return {
      prompt: g.req.prompt,
      durationSec: g.req.durationSec ?? set.durationSec,
      aspectRatio: g.req.aspectRatio ?? set.aspectRatio,
      capture: g.capture,
      brandKit: (set.brandKit as Record<string, unknown> | null | undefined) ?? null,
      notes: g.notes,
      requiredRecipes: g.req.recipes.map((r) => r.id),
      ...extra,
    };
  }, []);

  /** Run one co-creation step; its result is the next thing the person confirms. */
  const guidedStep = useCallback(
    async (step: 'brief' | 'direction' | 'mapping') => {
      const g = guided.current;
      if (!g) return;
      const my = gen.current;
      const live = () => gen.current === my && guided.current === g;
      setStage('storyboarding');
      try {
        if (step === 'brief') {
          const brief = await requestBrief(guidedContext(g));
          if (!live()) return;
          g.brief = brief;
          say('assistant', briefMessage(brief, !g.capture));
        } else if (step === 'direction') {
          const options = await requestDirections(guidedContext(g, { brief: g.brief ? briefText(g.brief) : '' }));
          if (!live()) return;
          g.options = options;
          say('assistant', directionMessage(options));
          // Each option as two real frames in its colours, while the person reads (never blocks the choice).
          void renderStyleframes({ options, capture: g.capture ?? null, product: g.req.prompt.slice(0, 60) }).then((frames) => {
            if (live() && frames.length) setFrames(frames);
          });
        } else {
          const mapping = await requestMapping(guidedContext(g, { brief: g.brief ? briefText(g.brief) : '', direction: g.direction ?? '' }));
          if (!live()) return;
          g.mapping = mapping;
          setFrames([]);
          say('assistant', mappingMessage(mapping));
        }
        setStage(step);
      } catch (error) {
        if (!live()) return;
        guided.current = null;
        const noKey = error instanceof DirectorError && (error.code === 'OPENAI_KEY_REQUIRED' || error.code === 'OPENAI_KEY_REJECTED');
        if (noKey) {
          say('assistant', 'Working it out together needs your OpenAI API key (add it in SmartVideo GO Settings). I used the Ink Press template instead.');
          void runStoryboard(g.req, 'inkpress', false, g.capture);
        } else {
          setStage('idle');
          mark('storyboard', 'error', error instanceof Error ? error.message : 'failed');
          say('assistant', `I could not do that step: ${error instanceof Error ? error.message : 'unknown error'}. Send your request again, or choose Ink Press.`);
        }
      }
    },
    [guidedContext, mark, runStoryboard, say],
  );

  /** The person confirmed the shot mapping (or handed the choices over): write the storyboard from everything settled. */
  const guidedFinish = useCallback(() => {
    const g = guided.current;
    if (!g) return;
    guided.current = null;
    const decisions = [
      g.brief ? `Brief:\n${briefText(g.brief)}` : '',
      g.direction ? `Direction: ${g.direction}` : '',
      g.mapping ? `Shot mapping (first choices, in film order):\n${mappingText(g.mapping)}` : '',
      g.notes.length ? `The person's notes:\n${g.notes.join('\n')}` : '',
    ].filter(Boolean);
    const lead = g.mapping
      ? g.mapping.map((m) => resolveMotionTemplate(m.firstShot)).filter((t): t is MotionTemplate => !!t)
      : [];
    const recipes = g.req.recipes.length ? g.req.recipes : lead;
    void runStoryboard(
      // Without a captured site the pages are sample pages; the site address is not captured a second time.
      { ...g.req, prompt: `${g.req.prompt}\n\n${decisions.join('\n\n')}`.slice(0, 3900), recipes, siteUrl: g.capture ? g.req.siteUrl : null, mapping: g.mapping ?? undefined },
      'director',
      false,
      g.capture,
    );
  }, [runStoryboard]);

  /** Start co-creation for the film asked for: read the site, then run the product check. */
  const startCoCreate = useCallback(
    async (req: FilmRequest) => {
      const my = gen.current;
      const live = () => gen.current === my;
      const g: GuidedState = { req, capture: null, notes: [] };
      guided.current = g;
      setStage('storyboarding');
      setStoryboard(null);
      setFilm(null);
      setActivity([]);
      let next = markStep(initialSteps(), 'product', 'done', req.siteUrl ?? 'From your message');
      next = req.siteUrl ? markStep(next, 'capture', 'active', `Capturing ${req.siteUrl}`) : markStep(next, 'capture', 'skipped', 'No URL — sample pages');
      setSteps(markStep(next, 'storyboard', 'active', 'Product check'));
      if (req.siteUrl) {
        log(`Capturing ${req.siteUrl}`, 'running');
        try {
          const capture = await captureSite(req.siteUrl, {
            cancelled: () => !live(),
            onProgress: (sec) => log(`Capturing ${req.siteUrl} · ${sec}s (reading the page and taking screenshots)`, 'running'),
          });
          if (!live()) return;
          g.capture = capture;
          if (captureQuality(capture) === 'complete') {
            log(`Captured ${capture.title || req.siteUrl}`, 'done');
            mark('capture', 'done', `${capture.pages?.length || 1} page${(capture.pages?.length || 1) === 1 ? '' : 's'} · ${capture.crops.length} card crops`);
          } else {
            log(`Partial capture of ${capture.title || req.siteUrl} · its words only`, 'done');
            mark('capture', 'warning', 'The site\'s words only: its pages could not be screenshotted');
          }
        } catch (error) {
          if (!live()) return;
          const label = `Could not capture ${req.siteUrl}: ${error instanceof Error ? error.message : 'failed'}`;
          log(label, 'error');
          mark('capture', 'error', label);
          say('assistant', `${label}. I'll work from your message and sample pages — send the address again (or attach screenshots) and I'll re-capture.`);
        }
      }
      if (!live()) return;
      await guidedStep('brief');
    },
    [guidedStep, log, mark, say],
  );

  /** An answer during co-creation. Returns false when it is a new film instead (the caller handles it). */
  const answerGuided = useCallback(
    (text: string): boolean => {
      const g = guided.current;
      if (!g) return false;
      if (startsDifferentFilm(text, g.req)) {
        guided.current = null;
        return false;
      }
      say('user', text);
      if (YOU_DECIDE_RE.test(text)) {
        say('assistant', 'Understood — I’ll decide the rest and show you the storyboard to approve.');
        guidedFinish();
        return true;
      }
      if (stage === 'brief') {
        if (!ACCEPT_RE.test(text)) g.notes.push(`Brief: ${text}`);
        void guidedStep('direction');
      } else if (stage === 'direction') {
        const options = g.options;
        const i = options ? pickDirection(text, options) : -1;
        if (options && i >= 0) g.direction = directionText(options.directions[i]);
        else if (options && ACCEPT_RE.test(text)) g.direction = directionText(options.directions[options.recommended]);
        else g.direction = `Own direction: ${text}`;
        void guidedStep('mapping');
      } else {
        if (ACCEPT_RE.test(text)) guidedFinish();
        else {
          g.notes.push(`Mapping: ${text}`);
          void guidedStep('mapping');
        }
      }
      return true;
    },
    [guidedFinish, guidedStep, say, stage],
  );

  /** The scene-level edit (defined after the build functions it uses; the chat reaches it through this ref). */
  const editRef = useRef<((text: string) => Promise<boolean>) | null>(null);
  const rebuildRef = useRef<((plan: DirectorPlan, touched: number[], notes: string[], hints?: Record<string, string[]>) => Promise<boolean>) | null>(null);
  /** One automatic correction pass per film: a review that keeps failing is reported, not looped on. */
  const corrected = useRef(false);

  /** Handle a chat message. Returns false when it is not a film request (the caller treats it as an edit). */
  const send = useCallback(
    (raw: string, sendOpts: { force?: boolean } = {}): boolean => {
      const text = raw.trim();
      if (!text) return false;
      if (stage === 'film' && /\b(?:replace|swap|redo|keep|change)\b[^.]*\b(?:scene|shot)\b|\bdramatic (?:ending|finale)\b|\bending\b[^.]*\bdramatic\b/i.test(text)) {
        void (editRef.current?.(text) ?? Promise.resolve(false)).then((handled) => { if (!handled) say('assistant', 'I did not find a scene-level edit in that. Say, for example, “replace the second shot with a different camera movement” or “make the ending more dramatic”.'); });
        return true;
      }
      if (stage === 'storyboarding' || stage === 'building') {
        say('assistant', `I'm still ${stage === 'building' ? 'building the film' : 'working on the storyboard'} — press Stop to cancel it, then send that again.`);
        return true;
      }

      if ((stage === 'brief' || stage === 'direction' || stage === 'mapping') && guided.current) {
        if (answerGuided(text)) return true;
      }

      if (stage === 'offer' && offerReq.current) {
        const answer = readTemplateAnswer(text);
        const extra = parseFilmRequest(text);
        if (answer || extra.recipes.length) {
          say('user', text);
          const base = offerReq.current;
          // Keep what came with the answer: "yes, make it 30 seconds and focus on team features".
          const bareAnswer = /^\W*(?:y|yes|yep|yeah|sure|ok|okay|please|no|nope|go|go ahead|do it|use it|use ink ?press|ink ?press|let the director pick(?: the)? shots?)\W*$/i.test(text);
          const req = {
            ...base,
            prompt: bareAnswer ? base.prompt : `${base.prompt}\n\n${text}`,
            recipes: [...base.recipes, ...extra.recipes.filter((r) => !base.recipes.includes(r))],
            durationSec: extra.durationSec ?? base.durationSec,
            siteUrl: extra.siteUrl ?? base.siteUrl,
          };
          offerReq.current = null;
          void runStoryboard(req, extra.recipes.length && answer !== 'inkpress' ? 'director' : answer ?? 'director');
          return true;
        }
        if (!(optsRef.current.isRequest ?? isFilmRequest)(text)) {
          if (optsRef.current.editFallback) return false;
          say('user', text);
          say('assistant', 'Shall I use the Ink Press template? Say “yes” for Ink Press, “no” to let the director pick shots, or name the shot cards you want.');
          return true;
        }
      }

      // While a storyboard is on the table every message revises it ("use crash-zoom-punch instead"),
      // unless it plainly asks for a different film.
      const different = stage === 'plan' && pending.current ? startsDifferentFilm(text, pending.current.req) : false;
      if (stage === 'plan' && pending.current && !different) {
        // A revision of the storyboard on the table.
        say('user', text);
        const prev = pending.current;
        const extra = parseFilmRequest(text);
        // Shots picked in Templates while the storyboard is open are added to it.
        const picks = optsRef.current.settings().pickedRecipes;
        // A storyboard made without explicit picks keeps its own shots when picks are added to it.
        const open = !prev.req.recipes.length && picks.length
          ? (storyboard?.plan.scenes ?? []).flatMap((sc) => (sc.kind === 'shot' ? [resolveMotionTemplate(sc.recipeId)] : [])).filter((t): t is MotionTemplate => !!t)
          : prev.req.recipes;
        const base = reviseRecipes(open, text);
        const revised = [...base, ...picks.filter((p) => !base.includes(p))];
        const revise = () =>
          void runStoryboard(
            {
              ...prev.req,
              prompt: `${prev.req.prompt}\n\nRevise: ${text}`,
              recipes: revised,
              // A one-shot film follows its revision: "use crash-zoom-punch instead" builds that shot.
              single: prev.req.single ? (revised.length === 1 ? revised[0] : null) : null,
              durationSec: extra.durationSec ?? prev.req.durationSec,
              siteUrl: extra.siteUrl ?? prev.req.siteUrl,
            },
            // A "Create without AI" production stays without AI through revisions (naming a shot is not opting into AI).
            extra.template ?? (prev.template === 'local' ? 'local' : extra.recipes.length ? 'director' : prev.template),
            true,
          );
        // A question about the storyboard gets an answer from the director; a request for a change revises it.
        if (storyboard && !picks.length && isQuestion(text) && prev.template !== 'local') {
          const my = gen.current;
          void askDirector({ message: text, plan: storyboard.plan, capture: storyboard.capture ?? null })
            .then((answer) => {
              if (gen.current !== my) return;
              if (answer.reply) say('assistant', answer.reply);
              if (answer.revise) revise();
            })
            .catch(() => {
              // No director to ask (no key, offline): treat it as feedback on the plan.
              if (gen.current === my) revise();
            });
          return true;
        }
        revise();
        return true;
      }

      // A message that plainly starts a different film is a film request even without a creation verb ("now beta.dev").
      if (!sendOpts.force && !different && !(optsRef.current.isRequest ?? isFilmRequest)(text)) return false;
      say('user', text);
      const req = parseFilmRequest(text);
      const picked = optsRef.current.settings().pickedRecipes;
      if (req.single) {
        say('assistant', `Designing one ${motionTemplateTitle(req.single)} shot, adapted to your product.`);
        void runStoryboard(req, 'inkpress');
      } else if (req.template) {
        void runStoryboard(req, req.template);
      } else if (req.recipes.length || picked.length) {
        const names = [...req.recipes, ...picked.filter((p) => !req.recipes.includes(p))].map(motionTemplateTitle);
        say('assistant', `Building the film around ${names.join(', ')}.`);
        void runStoryboard(req, 'director');
      } else {
        offerReq.current = req;
        setStage('offer');
        say('assistant', INK_PRESS_INTRO);
      }
      return true;
    },
    [answerGuided, runStoryboard, say, stage],
  );

  const chooseTemplate = useCallback(
    (choice: FilmTemplateChoice) => {
      const req = offerReq.current;
      if (!req) return;
      offerReq.current = null;
      say('user', choice === 'local' ? 'Create without AI.' : choice === 'inkpress' ? 'Use Ink Press.' : 'Let the director pick the shots.');
      void runStoryboard(req, choice);
    },
    [runStoryboard, say],
  );

  /** The offer's "Work it out together" button. */
  const coCreate = useCallback(() => {
    const req = offerReq.current;
    if (!req) return;
    offerReq.current = null;
    say('user', 'Work it out together.');
    void startCoCreate(req);
  }, [say, startCoCreate]);

  const approve = useCallback(async () => {
    if (!storyboard) return;
    corrected.current = false;
    const my = gen.current;
    const live = () => gen.current === my;
    const glog: typeof log = (label, status) => {
      if (!live()) return;
      log(label, status);
      if (/^Finding the beat/.test(label)) mark('beat', 'active', label);
      else if (/^Frame QA/.test(label)) mark('qa', status === 'running' ? 'active' : status === 'error' ? 'error' : 'done', label.replace(/^Frame QA · /, ''));
    };
    const s = optsRef.current.settings();
    // Stop aborts this: shot adaptation and frame QA run on it, so they end instead of running on unseen.
    const buildAbort = new AbortController();
    buildController.current = buildAbort;
    setStage('building');
    mark('animate', 'active', 'Building the Remotion project');
    // A storyboard from an earlier session has no run in memory: start one so the build is recorded like any other.
    if (!runRef.current) { runRef.current = newRun(pending.current?.req.prompt ?? storyboard.plan.title, 'autonomous'); setRun(runRef.current); }
    upd((r) => startStage(r, 'build'));
    if (!resumeJob.current) adaptedRef.current = [];
    try {
      // Build with the attachments the approved storyboard was planned with (a revision picks up new ones).
      const media = storyboard.media ?? s.media;
      let adaptation: AdaptationOutcome | null = null;
      const buildOut = await buildFilmProject(storyboard.plan, { aspectRatio: pending.current?.req.aspectRatio ?? s.aspectRatio, capture: storyboard.capture, media, logo: s.brandKit?.logo ?? null, prompt: pending.current?.req.prompt, mapping: storyboard.mapping, release: storyboard.release, onAdaptation: (o) => { adaptation = o; }, noAi: pending.current?.template === 'local', onShot: (pr) => { adaptedRef.current = adaptedOf(pr); checkpointRef.current(); }, ...(resumeJob.current ? { reuse: { project: adaptedStub(resumeJob.current.adapted) as never, touchedStems: [] } } : {}), direction: storyboard.direction ? `${storyboard.direction.chosen.name}: ${storyboard.direction.chosen.claim}${storyboard.direction.chosen.tradeoff ? ` Trade-off: ${storyboard.direction.chosen.tradeoff}.` : ''}` : undefined, signal: buildAbort.signal }, glog);
      resumeJob.current = null;
      // Findings the program can repair safely are repaired once, and said.
      const fixedFilm = fixFilm(buildOut);
      // A silent film carries no sound clips at all (no music, no effects).
      const project = runRef.current?.silent ? { ...fixedFilm.project, tracks: fixedFilm.project.tracks.map((t) => ({ ...t, clips: t.clips.filter((c) => c.cardId !== 'audio-clip') })) } : fixedFilm.project;
      const fixed = fixedFilm.fixed;
      const qa = checkFilmStructure(project, { hasProductImages: Boolean(storyboard.capture) || media.some((m) => m.kind === 'image'), plan: storyboard.plan, videos: media.filter((m) => m.kind === 'video').length });
      const cuts = project.tracks.flatMap((t) => t.clips).filter((c) => c.cardId === 'audio-clip' && /sfxlib/.test(String(c.props?.file ?? ''))).length;
      const musicClip = project.tracks.flatMap((t) => t.clips).find((c) => c.cardId === 'audio-clip' && /bgmlib|^blob:/.test(String(c.props?.file ?? '')));
      const music = media.find((m) => m.kind === 'audio') ?? (musicClip ? { name: String(musicClip.label ?? 'music') } : undefined);
      // What became of each recipe shot: adapted, parameterised (it draws the person's own pictures or words) or the plain demo.
      const made = summarizePersonalization(filmPersonalization(project));
      const adaptLine = (() => {
        const a = adaptation as AdaptationOutcome | null;
        if (!a) return '';
        if (a.kind === 'skipped') return `Shot adaptation did not run: ${a.reason}.`;
        if (a.kind === 'stopped') return `Shot adaptation stopped after ${a.adapted} of ${a.attempted}: ${a.reason}`;
        return `Shot adaptation: ${a.adapted} of ${a.attempted} shots rewritten for your product${a.adapted === 0 ? ' (the rest keep their plain recipes)' : ''}.`;
      })();
      mark('animate', made.total > 0 && made.personalized === 0 ? 'warning' : 'done', made.total ? made.line : `${project.tracks.reduce((n, t) => n + t.clips.length, 0)} clips on ${project.tracks.length} tracks`);
      mark('beat', 'done', `${cuts} SFX hits${music ? ` · cuts on the beat of ${music.name}` : ' · attach music to beat-sync the cuts'}`);
      // Stage 5 closes only after each shot was looked at on its own: the person's content must change the shot's frames.
      glog('Checking each shot on its own against the plain recipe', 'running');
      const sceneChecks = await validateShotScenes(project, { pixels: browserPixels }, { budgetMs: 60_000, signal: buildAbort.signal }).catch(() => []);
      if (!live()) return;
      const material = materialOf(storyboard.capture, media, { brandLogo: Boolean(s.brandKit?.logo) });
      const scenes = recordScenes(sceneRecords(storyboard.plan, material), project, sceneChecks);
      upd((r) => completeStage(r, { stage: 'build', scenes }, { adapted: made.adapted, parameterized: made.parameterized, unmodified: made.unmodified }));
      const snd = soundRecord(project, { plan: storyboard.plan, silent: Boolean(runRef.current?.silent) });
      if (runRef.current?.silent) { upd((r) => startStage(skipStage(r, 'sound', 'the person asked for a silent film'), 'qa')); } else
      upd((r) => startStage(completeStage(startStage(r, 'sound'), { stage: 'sound', cues: cuts, track: music?.name ?? null, problems: snd.problems }, { cues: cuts, planned: snd.planned, satisfied: snd.satisfied, optionalSounded: snd.optionalSounded, musicOnly: snd.musicOnly, silentTransitions: snd.silentTransitions, music: snd.music?.name ?? null, missingAt: snd.missing, mistimed: snd.mistimed.length }), 'qa'));
      const frames = await checkFilmFrames(project, glog, undefined, buildAbort.signal);
      if (!live()) return;
      qa.framesChecked = frames.checked;
      qa.issues.push(...frames.failed.map((f) => `Frame ${f}`));
      qa.ok = qa.issues.length === 0;
      // A check that ran out of time is said to be partial, not passed.
      const planned = frames.total ?? frames.checked;
      const partial = planned > frames.checked + frames.failed.length;
      if (partial) qa.warnings.push(`Frame QA is incomplete: ${frames.checked + frames.failed.length} of ${planned} frames were checked.`);
      // Required = the frames the check planned; done = those really inspected (a check cut short by its budget, or that could not render, is partial).
      upd((r) => ({ ...completeStage(r, { stage: 'qa', issues: qa.issues, framesChecked: qa.framesChecked, required: planned, done: frames.checked + frames.failed.length }, { warnings: qa.warnings.length, required: planned, done: frames.checked + frames.failed.length }), fingerprints: { build: filmFingerprint(project) } }));
      const built = { project: { ...project, run: runRef.current ?? undefined }, qa };
      setFilm(built);
      setStage('film');
      if (!frames.checked && !frames.failed.length) mark('qa', qa.ok ? 'done' : 'error', qa.ok ? 'Structure checked' : `${qa.issues.length} issue(s)`);
      else if (!qa.ok) mark('qa', 'error', `${qa.issues.length} issue(s)`);
      // Built is not delivered: the step turns done when an MP4 has actually been rendered (markDelivered).
      mark('deliver', 'todo', 'Render the MP4 to finish');
      optsRef.current.onBuilt?.(built);
      say(
        'assistant',
        [
          `${runRef.current ? finalStatusLine(runRef.current) : 'Draft'}.\nThe draft: ${Math.round(project.tracks.reduce((m, t) => t.clips.reduce((mm, c) => Math.max(mm, c.start + c.duration), m), 0) / project.fps)}s at ${project.width}×${project.height}, ${project.fps} fps, ${project.tracks.map((t) => t.name).join(' / ')} tracks.`,
          made.total ? `${made.line}.` : '',
          ...made.details,
          adaptLine,
          qa.ok ? (partial ? `Frame QA found no problems in the ${qa.framesChecked} of ${planned} frames it had time to check.` : `Frame QA passed${qa.framesChecked ? ` (${qa.framesChecked} frames rendered)` : ''}.`) : `Frame QA found ${qa.issues.length} issue${qa.issues.length === 1 ? '' : 's'}:\n- ${qa.issues.join('\n- ')}`,
          ...qa.warnings,
          ...(qa.review ? reviewSummary(qa.review) : []),
          ...(fixed.length ? ['Fixed before showing you:', ...fixed.map((f) => `- ${f}`)] : []),
          runRef.current && runRef.current.stages.build.status !== 'completed' ? `Build check: ${runRef.current.stages.build.note ?? 'not clean'}.` : '',
          'Play it here, render the MP4, or open it in the Motion Workbench to edit shots, copy, timing and sound.',
        ].filter(Boolean).join('\n'),
      );
      // Stage 7: the independent reviewer (a model that did not make the film) gets the spec, every shot's card,
      // its reference frames next to the film's, the seams and the two checklists; it arrives as a follow-up,
      // and a seam it fails goes back to a plain cut (stage 3).
      upd((r) => startStage(r, 'review'));
      if (pending.current?.template === 'local') {
        // Created without AI: no model is called, so there is no AI creative review. The technical checks above stand; the review is recorded as not performed.
        upd((r) => completeStage(r, { stage: 'review', review: { ran: false, state: 'unavailable', findings: [], note: 'AI creative review not performed (created without AI)' } }));
        say('assistant', `AI creative review: not performed (this film was created without AI, no model was called). ${runRef.current ? finalStatusLine(runRef.current) : ''} It can still be previewed, edited in the Workbench and exported as an MP4.`);
        return;
      }
      void runFinalReview(project, {
        frame: async (p, f, signal) => stillToJpeg((await (await import('../webRenderer')).renderStillOnWebExport(p, f, signal, 0.25)).blob, 480),
        reference: fetchReferenceFrames,
        request: (body) => requestFinalReview(body),
      })
        .then((report) => {
          if (!live()) return;
          // The reviewer answered: record what it found, with the shot and the second, and whether it passed.
          // A reviewer that returned no checks did not review anything: that is "did not run", never "passed".
          if (!report.items.length) {
            upd((r) => completeStage(r, { stage: 'review', review: { ran: false, state: 'unavailable', findings: [], note: 'the reviewer returned no checks' } }));
            say('assistant', `The independent review did not run (the reviewer returned no checks), so this film is a draft that passed the technical checks, not a reviewed film. ${runRef.current ? finalStatusLine(runRef.current) : ''}`);
            return;
          }
          const fails = report.items.filter((i) => !i.ok);
          const cover = reviewCoverage(report.items);
          const record: ReviewRecord = { ran: true, schemaValid: true, criteria: report.items.map((i) => ({ id: i.id, ok: i.ok })), coversRequired: cover.coversRequired, missingGroups: cover.missingGroups, filmFingerprint: filmFingerprint(project), state: fails.length ? 'failed' : cover.coversRequired ? 'passed' : 'incomplete', findings: fails.map((i) => ({ frame: i.seconds.length ? Math.round(i.seconds[0] * project.fps) : undefined, text: `${i.id}: ${i.text}`, severity: 'fix' as const })) };
          upd((r) => completeStage(r, { stage: 'review', review: record }, { fails: fails.length, checks: report.items.length }));
          const { project: repaired0, fixed } = applyReviewFixes(project, report.items);
          const repaired = { ...repaired0, run: runRef.current ?? undefined };
          // Only the film that was reviewed is repaired: if it was edited (here or in the workbench) while the
          // review ran, the fix is offered instead of replacing the edited film.
          const reader = optsRef.current.currentProject;
          const unchanged = reviewStillApplies({ installed: lastFilm.current, reviewed: built, current: reader, project });
          if (unchanged) {
            // The film as it is, with the run as it now stands (the review's outcome is part of what is saved), and any seam repair.
            const next = { ...built, project: fixed.length ? repaired : { ...built.project, run: runRef.current ?? undefined } };
            setFilm(next);
            optsRef.current.onBuilt?.(next);
          }
          const notes = !fixed.length ? [] : unchanged ? ['Fixed from the review:', ...fixed.map((f) => `- ${f}`)] : ['The film was edited while the review ran, so I left it as it is. To apply the review:', ...fixed.map((f) => `- ${f.replace(' is a plain cut now (the reviewer failed it).', ': make it a plain cut in the Transitions track.')}`)];
          say('assistant', [...finalReviewLines(report), ...(cover.coversRequired ? [] : [`The review did not cover ${cover.missingGroups.join(', ')}, so it cannot certify the film.`]), ...notes, runRef.current ? `Status: ${finalStatusLine(runRef.current, curFp())}.` : ''].filter(Boolean).join('\n'));
          // Correction loop: a shot the reviewer failed (stage 5) is rebuilt on its own with the reviewer's note as its starting problem;
          // the rest of the film is kept. One pass only; the film then needs a new review (status: review pending).
          const shotFails = report.items.filter((i) => !i.ok && i.stage === '5' && i.seconds.length);
          if (shotFails.length && !corrected.current && unchanged) {
            corrected.current = true;
            const shots = reviewShots(project);
            const hints: Record<string, string[]> = {};
            const idx = new Set<number>();
            for (const f of shotFails) {
              const frame = Math.round(f.seconds[0] * project.fps);
              const at = shots.findIndex((x) => frame >= x.clip.start && frame < x.clip.start + x.clip.duration);
              if (at < 0 || !shots[at].stem) continue;
              idx.add(at);
              hints[shots[at].stem!] = [...(hints[shots[at].stem!] ?? []), `${f.id}: ${f.text}`];
            }
            if (idx.size && storyboard) void rebuildRef.current?.(storyboard.plan, [...idx], [`Correcting from the review: rebuilding shot${idx.size === 1 ? '' : 's'} ${[...idx].map((i) => i + 1).join(', ')} with the reviewer's notes.`], hints);
          }
        })
        .catch((error) => {
          // No key or no answer: the program's checks above stand, but say the review did not happen.
          if (!live()) return;
          log(`Final review skipped: ${error instanceof Error ? error.message : 'no answer'}`, 'error');
          upd((r) => completeStage(r, { stage: 'review', review: { ran: false, state: 'unavailable', findings: [], note: error instanceof Error ? error.message.slice(0, 80) : 'no answer' } }));
          say('assistant', `The independent review did not run (${error instanceof Error ? error.message : 'no answer'}), so this film is a draft that passed the technical checks, not a reviewed film. ${runRef.current ? finalStatusLine(runRef.current) : ''}`);
        });
    } catch (error) {
      if (!live()) return;
      failRunning(error instanceof Error ? error.message : 'failed');
      setStage('plan');
      mark('animate', 'error', error instanceof Error ? error.message : 'failed');
      log(error instanceof Error ? error.message : 'Could not build the film', 'error');
      say('assistant', `Building the film failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }, [log, mark, say, storyboard, upd, failRunning]);

  /** Rebuild the film from a (possibly edited) storyboard: only `touched` scenes are rebuilt and re-checked, the rest keep their adapted source and their record. */
  const rebuildFilm = useCallback(async (plan: DirectorPlan, touched: number[], notes: string[], hints?: Record<string, string[]>): Promise<boolean> => {
    if (!storyboard || !film) return false;
    const my = gen.current;
    const live = () => gen.current === my;
    const s = optsRef.current.settings();
    const media = storyboard.media ?? s.media;
    const abort = new AbortController();
    buildController.current = abort;
    setStage('building');
    mark('animate', 'active', 'Rebuilding the changed scenes');
    upd((r) => startStage(r, 'build'));
    try {
      const touchedStems = touched.map((i) => resolveMotionTemplate(plan.scenes[i].recipeId)?.componentName).filter((x): x is string => Boolean(x));
      const out = await buildFilmProject(plan, { noAi: pending.current?.template === 'local', ...(hints ? { hints } : {}), aspectRatio: pending.current?.req.aspectRatio ?? s.aspectRatio, capture: storyboard.capture, media, logo: s.brandKit?.logo ?? null, prompt: pending.current?.req.prompt, mapping: storyboard.mapping, release: storyboard.release, reuse: { project: film.project, touchedStems }, signal: abort.signal, targetedCapture: false }, log);
      const fixed0 = fixFilm(out).project;
      // A silent film stays silent when a scene is rebuilt (the same filtering as the first build).
      const project = runRef.current?.silent ? { ...fixed0, tracks: fixed0.tracks.map((t) => ({ ...t, clips: t.clips.filter((c) => c.cardId !== 'audio-clip') })) } : fixed0;
      const only = new Set(touchedStems);
      const checks = await validateShotScenes(project, { pixels: browserPixels }, { budgetMs: 45_000, signal: abort.signal, only }).catch(() => []);
      if (!live()) return true;
      const prior = runRef.current?.scenes ?? [];
      const fresh = recordScenes(sceneRecords(plan, materialOf(storyboard.capture, media)), project, checks);
      // Scenes the edit did not touch keep the record they had earned; only the touched ones are re-checked.
      // ...and only while the shot is byte-for-byte the shot that earned it (its fingerprint covers all its props, timing and source).
      const scenes = fresh.map((rec, i) => (touched.includes(i) || !prior[i] || !prior[i].fingerprint || prior[i].fingerprint !== rec.fingerprint ? rec : prior[i]));
      upd((r) => ({ ...r, review: { ran: false, state: 'not-run', findings: [] }, stages: { ...r.stages, review: { status: 'pending', attempts: 0 } } }));
      upd((r) => completeStage(r, { stage: 'build', scenes }, { edited: touched.length }));
      const qa = checkFilmStructure(project, { hasProductImages: Boolean(storyboard.capture) || media.some((m) => m.kind === 'image'), plan: plan, videos: media.filter((m) => m.kind === 'video').length });
      const fr = await checkFilmFrames(project, log, undefined, abort.signal);
      qa.issues.push(...fr.failed.map((f) => `Frame ${f}`));
      upd((r) => ({ ...completeStage(startStage(r, 'qa'), { stage: 'qa', issues: qa.issues, framesChecked: fr.checked, required: fr.total, done: fr.checked + fr.failed.length }), fingerprints: { build: filmFingerprint(project) } }));
      const built = { project: { ...project, run: runRef.current ?? undefined }, qa };
      setStoryboard({ ...storyboard, plan: plan });
      setFilm(built);
      setStage('film');
      optsRef.current.onBuilt?.(built);
      say('assistant', [...notes, `Rebuilt the film from the edited storyboard: scene${touched.length === 1 ? '' : 's'} ${touched.map((i) => i + 1).join(', ') || '—'} changed, the others kept. ${runRef.current ? finalStatusLine(runRef.current) : ''}.`].filter(Boolean).join('\n'));
    } catch (error) {
      if (!live()) return true;
      failRunning(error instanceof Error ? error.message : 'failed');
      setStage('film');
      say('assistant', `The edit failed (${error instanceof Error ? error.message : 'error'}); the film is as it was.`);
    }
    return true;
  }, [film, say, storyboard, upd, failRunning, mark, log]);

  /**
   * Scene-level edits of the finished film ("keep the first scene, replace the second shot, make the ending more dramatic"):
   * the storyboard is edited, the film is rebuilt from it (timing, seams and sound cues are recalculated by the code that
   * built it), untouched shots keep their adapted source, and only the touched shots are checked again. The earlier review
   * no longer applies to the changed film, so the status goes back to "review pending".
   */
  const editFilm = useCallback(async (text: string) => {
    if (!storyboard || !film) return false;
    const edits = parseFilmEdits(text, storyboard.plan);
    if (!edits.length) return false;
    say('user', text);
    const brief = storyboard.brief;
    if (!brief) { say('assistant', 'This film was made before the brief was recorded, so I cannot check an edit against it. Rebuild it from the chat, or edit it in the Workbench.'); return true; }
    const res = applyFilmEdits(storyboard.plan, edits, { brief });
    if (!res.touched.length && !edits.some((e) => e.kind === 'dramatic-ending')) { say('assistant', [...res.notes, ...res.refused, 'Nothing was changed.'].join('\n')); return true; }
    return rebuildFilm(res.plan, res.touched, [...res.notes, ...res.refused]);
  }, [film, say, storyboard, rebuildFilm]);

  editRef.current = editFilm;
  rebuildRef.current = rebuildFilm;

  /** Resume the interrupted production: the stored storyboard and the shots already adapted are kept; only the rest is built. */
  const [resumeGo, setResumeGo] = useState(0);
  const resumeRun = useCallback(() => {
    if (!resumeOffer || resumeOffer.action.kind !== 'resume') return;
    const { cp, action } = resumeOffer;
    runRef.current = recoverRun(cp.run);
    setRun(runRef.current);
    pending.current = { req: { prompt: cp.request.prompt, recipes: [], single: null, template: undefined, durationSec: null, siteUrl: null, aspectRatio: (['16:9', '9:16', '1:1'].includes(cp.request.aspectRatio) ? cp.request.aspectRatio : null) as FilmRequest['aspectRatio'] } as FilmRequest, template: cp.request.template };
    adaptedRef.current = cp.adapted;
    resumeJob.current = { adapted: cp.adapted };
    setStoryboard(cp.storyboard as StoryboardResult);
    setStage('plan');
    setResumeOffer(null);
    say('assistant', `Resuming the interrupted film at the ${action.from} stage: the storyboard and ${action.kept} already-adapted shot${action.kept === 1 ? '' : 's'} are kept; the rest is built now.`);
    setResumeGo((n) => n + 1);
  }, [resumeOffer, say]);
  useEffect(() => { if (resumeGo && resumeJob.current && storyboard) void approve(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeGo]);
  /** "Start over": the stored run is dropped. */
  const discardRun = useCallback(() => { clearCheckpoint(); adaptedRef.current = []; setResumeOffer(null); }, []);

  /** An MP4 was rendered from the film: only now is it delivered. */
  const markDelivered = useCallback(() => mark('deliver', 'done', 'MP4 rendered'), [mark]);

  // An MP4 rendered from the workbench toolbar delivers the film too.
  useEffect(() => {
    const onExported = () => markDelivered();
    window.addEventListener('motion-director:film-exported', onExported);
    return () => window.removeEventListener('motion-director:film-exported', onExported);
  }, [markDelivered]);

  const revise = useCallback(() => {
    say('assistant', 'What should change? Name shots to swap in (e.g. “use crash-zoom-punch instead”), a new length, or new copy.');
  }, [say]);

  /**
   * Stop what is running. A storyboard in progress is dropped (back to a fresh chat
   * turn); a film being built is dropped and the approved storyboard stays on the
   * table to approve again or revise. Any result that arrives later is ignored.
   */
  const stop = useCallback(() => {
    if (stage !== 'storyboarding' && stage !== 'building') return;
    gen.current++;
    buildController.current?.abort();
    setActivity([]);
    setSteps((prev) => prev.map((st) => (st.state === 'active' ? { ...st, state: 'todo', detail: 'Stopped' } : st)));
    if (stage === 'storyboarding') {
      pending.current = null;
      guided.current = null;
      setStoryboard(null);
      setStage('idle');
      say('assistant', 'Stopped. Tell me what to make next.');
    } else {
      setFilm(null);
      setStage('plan');
      say('assistant', 'Stopped building the film. The storyboard is still here: approve it again or tell me what to change.');
    }
  }, [say, stage]);

  const reset = useCallback(() => {
    gen.current++;
    clearCheckpoint();
    adaptedRef.current = [];
    resumeJob.current = null;
    pending.current = null;
    offerReq.current = null;
    guided.current = null;
    setStage('idle');
    setStoryboard(null);
    setFilm(null);
    setActivity([]);
    setMessages([]);
    setSteps(initialSteps());
    setFrames([]);
  }, [setFrames]);

  // The strip shows what the run recorded for the stages it covers (storyboard, build, sound, QA + review); capture and product keep their own detail.
  const shownSteps = run
    ? steps.map((st) => {
        if (!['storyboard', 'animate', 'beat', 'qa'].includes(st.id)) return st;
        const d = stepsOf(run).find((x) => x.id === st.id);
        return d && d.state !== 'todo' ? { ...st, state: d.state, detail: d.detail ?? st.detail } : st;
      })
    : steps;
  return { messages, stage, activity, steps: shownSteps, run, status: run ? finalStatus(run, curFp()) : null, storyboard, film, styleframes, send, chooseTemplate, coCreate, approve, revise, markDelivered, stop, reset, resumeOffer, resumeRun, discardRun };
}

export type FilmDirector = ReturnType<typeof useFilmDirector>;

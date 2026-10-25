'use client';

import { useCallback, useRef, useState } from 'react';
import type { AspectRatio } from '../projectContract';
import type { ProjectData } from '../types';
import type { MediaAttachment } from '../lib/mediaUpload';
import type { MotionTemplate } from '@/data/motionRecipeCatalog';
import { motionTemplateTitle } from '@/data/motionRecipeCatalog';
import {
  INK_PRESS_INTRO,
  isFilmRequest,
  parseFilmRequest,
  readTemplateAnswer,
  type FilmRequest,
  type FilmTemplateChoice,
} from '../lib/filmChat';
import {
  buildFilmProject,
  checkFilmFrames,
  checkFilmStructure,
  storyboardFilm,
  type ActivityStatus,
  type FilmBrandKit,
  type FilmQaReport,
  type StoryboardResult,
} from '../lib/filmPipeline';

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

export type FilmStage = 'idle' | 'offer' | 'storyboarding' | 'plan' | 'building' | 'film';

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

const NEW_FILM_RE = /\b(?:new|another|different|separate)\s+(?:[\w-]+\s+)?(?:film|video|promo|teaser|trailer|shot)\b/i;

const secs = (p: { scenes: { durationSec: number }[] }) => Math.round(p.scenes.reduce((s, sc) => s + sc.durationSec, 0));

export function useFilmDirector(opts: {
  settings: () => FilmSettings;
  /** Mirror of every message (e.g. into the studio session). */
  onMessage?: (m: FilmChatMessage) => void;
  /** Called when a film is built (the Agent panel installs it straight into the workbench). */
  onBuilt?: (film: BuiltFilm) => void;
}) {
  const [messages, setMessages] = useState<FilmChatMessage[]>([]);
  const [stage, setStage] = useState<FilmStage>('idle');
  const [activity, setActivity] = useState<Array<{ label: string; status: ActivityStatus }>>([]);
  const [storyboard, setStoryboard] = useState<StoryboardResult | null>(null);
  const [film, setFilm] = useState<BuiltFilm | null>(null);
  const pending = useRef<{ req: FilmRequest; template: FilmTemplateChoice } | null>(null);
  const offerReq = useRef<FilmRequest | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const say = useCallback((role: FilmChatMessage['role'], content: string) => {
    const m = msg(role, content);
    setMessages((prev) => [...prev, m]);
    optsRef.current.onMessage?.(m);
  }, []);

  const log = useCallback((label: string, status: ActivityStatus) => {
    setActivity((prev) => [...prev.filter((a) => a.status !== 'running'), { label, status }].slice(-8));
  }, []);

  const runStoryboard = useCallback(
    async (req: FilmRequest, template: FilmTemplateChoice) => {
      const s = optsRef.current.settings();
      const recipes = [...req.recipes, ...s.pickedRecipes.filter((r) => !req.recipes.includes(r))];
      const full = { ...req, recipes };
      pending.current = { req: full, template };
      setStage('storyboarding');
      setStoryboard(null);
      setFilm(null);
      setActivity([]);
      if (!req.siteUrl && !s.media.some((m) => m.kind === 'image')) {
        say('assistant', 'No product URL or screenshots yet, so the product shots will use sample pages. Add your URL to the message (or attach screenshots) any time and I will re-capture.');
      }
      try {
        const result = await storyboardFilm(
          full,
          { template, durationSec: req.durationSec ?? s.durationSec, aspectRatio: s.aspectRatio, brandKit: s.brandKit, capture: storyboard?.capture ?? null },
          log,
        );
        setStoryboard(result);
        setStage('plan');
        const lines = result.plan.scenes.map((sc, i) => `${i + 1}. ${sc.kind === 'title' ? 'Title card' : sc.recipeId.split('/')[1]} · ${sc.durationSec}s${sc.headline ? ` — “${sc.headline.replace(/\*/g, '')}”` : ''}`);
        say(
          'assistant',
          `${result.note ? `${result.note} I used the Ink Press template instead.\n\n` : ''}Storyboard “${result.plan.title}” — ${result.plan.scenes.length} scene${result.plan.scenes.length === 1 ? '' : 's'}, ${secs(result.plan)}s${result.capture ? ', using your captured pages' : ''}:\n${lines.join('\n')}\n\nApprove to build the film, or tell me what to change.`,
        );
      } catch (error) {
        setStage('idle');
        say('assistant', `I could not storyboard that: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    },
    [log, say, storyboard?.capture],
  );

  /** Handle a chat message. Returns false when it is not a film request (the caller treats it as an edit). */
  const send = useCallback(
    (raw: string, sendOpts: { force?: boolean } = {}): boolean => {
      const text = raw.trim();
      if (!text) return false;
      if (stage === 'storyboarding' || stage === 'building') return true;

      if (stage === 'offer' && offerReq.current) {
        const answer = readTemplateAnswer(text);
        const extra = parseFilmRequest(text);
        if (answer || extra.recipes.length) {
          say('user', text);
          const req = { ...offerReq.current, recipes: [...offerReq.current.recipes, ...extra.recipes], siteUrl: extra.siteUrl ?? offerReq.current.siteUrl };
          offerReq.current = null;
          void runStoryboard(req, extra.recipes.length && answer !== 'inkpress' ? 'director' : answer ?? 'director');
          return true;
        }
        if (!isFilmRequest(text)) {
          say('user', text);
          say('assistant', 'Shall I use the Ink Press template? Say “yes” for Ink Press, “no” to let the director pick shots, or name the shot cards you want.');
          return true;
        }
      }

      // While a storyboard is on the table every message revises it ("use crash-zoom-punch instead"),
      // unless it plainly asks for a different film.
      if (stage === 'plan' && pending.current && !NEW_FILM_RE.test(text)) {
        // A revision of the storyboard on the table.
        say('user', text);
        const prev = pending.current;
        const extra = parseFilmRequest(text);
        void runStoryboard(
          {
            ...prev.req,
            prompt: `${prev.req.prompt}\n\nRevise: ${text}`,
            recipes: [...prev.req.recipes, ...extra.recipes.filter((r) => !prev.req.recipes.includes(r))],
            durationSec: extra.durationSec ?? prev.req.durationSec,
            siteUrl: extra.siteUrl ?? prev.req.siteUrl,
          },
          extra.template ?? (extra.recipes.length ? 'director' : prev.template),
        );
        return true;
      }

      if (!sendOpts.force && !isFilmRequest(text)) return false;
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
    [runStoryboard, say, stage],
  );

  const chooseTemplate = useCallback(
    (choice: FilmTemplateChoice) => {
      const req = offerReq.current;
      if (!req) return;
      offerReq.current = null;
      say('user', choice === 'inkpress' ? 'Use Ink Press.' : 'Let the director pick the shots.');
      void runStoryboard(req, choice);
    },
    [runStoryboard, say],
  );

  const approve = useCallback(async () => {
    if (!storyboard) return;
    const s = optsRef.current.settings();
    setStage('building');
    try {
      const project = await buildFilmProject(storyboard.plan, { aspectRatio: s.aspectRatio, capture: storyboard.capture, media: s.media }, log);
      const qa = checkFilmStructure(project, { hasProductImages: Boolean(storyboard.capture) || s.media.some((m) => m.kind === 'image') });
      const frames = await checkFilmFrames(project, log);
      qa.framesChecked = frames.checked;
      qa.issues.push(...frames.failed.map((f) => `Frame ${f}`));
      qa.ok = qa.issues.length === 0;
      const built = { project, qa };
      setFilm(built);
      setStage('film');
      optsRef.current.onBuilt?.(built);
      say(
        'assistant',
        [
          `Your film is ready: ${Math.round(project.tracks.reduce((m, t) => t.clips.reduce((mm, c) => Math.max(mm, c.start + c.duration), m), 0) / project.fps)}s at ${project.width}×${project.height}, ${project.fps} fps, ${project.tracks.map((t) => t.name).join(' / ')} tracks.`,
          qa.ok ? `Frame QA passed${qa.framesChecked ? ` (${qa.framesChecked} frames rendered)` : ''}.` : `Frame QA found ${qa.issues.length} issue${qa.issues.length === 1 ? '' : 's'}:\n- ${qa.issues.join('\n- ')}`,
          ...qa.warnings,
          'Play it here, render the MP4, or open it in the Motion Workbench to edit shots, copy, timing and sound.',
        ].join('\n'),
      );
    } catch (error) {
      setStage('plan');
      log(error instanceof Error ? error.message : 'Could not build the film', 'error');
      say('assistant', `Building the film failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }, [log, say, storyboard]);

  const revise = useCallback(() => {
    say('assistant', 'What should change? Name shots to swap in (e.g. “use crash-zoom-punch instead”), a new length, or new copy.');
  }, [say]);

  const reset = useCallback(() => {
    pending.current = null;
    offerReq.current = null;
    setStage('idle');
    setStoryboard(null);
    setFilm(null);
    setActivity([]);
  }, []);

  return { messages, stage, activity, storyboard, film, send, chooseTemplate, approve, revise, reset };
}

export type FilmDirector = ReturnType<typeof useFilmDirector>;

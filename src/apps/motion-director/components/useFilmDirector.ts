'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AspectRatio } from '../projectContract';
import type { ProjectData } from '../types';
import type { MediaAttachment } from '../lib/mediaUpload';
import type { MotionTemplate } from '@/data/motionRecipeCatalog';
import { motionTemplateTitle, resolveMotionTemplate } from '@/data/motionRecipeCatalog';
import {
  INK_PRESS_INTRO,
  MAX_PICKED_SHOTS,
  isFilmRequest,
  parseFilmRequest,
  readTemplateAnswer,
  reviseRecipes,
  startsDifferentFilm,
  type FilmRequest,
  type FilmTemplateChoice,
} from '../lib/filmChat';
import { videoSceneSec } from '../lib/buildFilm';
import { initialSteps, markStep, type FilmStep, type FilmStepId, type FilmStepState } from '../lib/filmSteps';
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

const secs = (p: { scenes: { durationSec: number }[] }) => Math.round(p.scenes.reduce((s, sc) => s + sc.durationSec, 0));

export function useFilmDirector(opts: {
  settings: () => FilmSettings;
  /** Mirror of every message (e.g. into the studio session). */
  onMessage?: (m: FilmChatMessage) => void;
  /** Called when a film is built (the Agent panel installs it straight into the workbench). */
  onBuilt?: (film: BuiltFilm) => void;
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
  const [film, setFilm] = useState<BuiltFilm | null>(null);
  /** The seven workflow steps (Product → Deliver) with their live state. */
  const [steps, setSteps] = useState<FilmStep[]>(initialSteps);
  const mark = useCallback((id: FilmStepId, state: FilmStepState, detail?: string) => setSteps((prev) => markStep(prev, id, state, detail)), []);
  const pending = useRef<{ req: FilmRequest; template: FilmTemplateChoice } | null>(null);
  const offerReq = useRef<FilmRequest | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  /**
   * Conversation generation: `reset` (e.g. switching sessions) bumps it, and
   * every async step checks it before writing, so a storyboard or film that
   * finishes after the switch never lands in the other session.
   */
  const gen = useRef(0);
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
    async (req: FilmRequest, template: FilmTemplateChoice, reuseCapture = false) => {
      const my = gen.current;
      const live = () => gen.current === my;
      const glog: typeof log = (label, status) => {
        if (!live()) return;
        log(label, status);
        if (/^Captured /.test(label)) mark('capture', 'done', label.replace(/^Captured [^·]*· ?/, ''));
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
      next = reuseCapture && storyboard?.capture
        ? markStep(next, 'capture', 'done', 'Reusing the captured pages')
        : req.siteUrl
          ? markStep(next, 'capture', 'active', `Capturing ${req.siteUrl}`)
          : markStep(next, 'capture', images ? 'done' : 'skipped', images ? `${images} attached screenshot${images === 1 ? '' : 's'}` : 'No URL — sample pages');
      setSteps(markStep(next, 'storyboard', 'active'));
      if (!req.siteUrl && !media.some((m) => m.kind === 'image')) {
        say('assistant', 'No product URL or screenshots yet, so the product shots will use sample pages. Add your URL to the message (or attach screenshots) any time and I will re-capture.');
      }
      try {
        const result = await storyboardFilm(
          full,
          {
            template,
            durationSec: req.durationSec ?? s.durationSec,
            aspectRatio: s.aspectRatio,
            brandKit: s.brandKit,
            capture: reuseCapture ? storyboard?.capture ?? null : null,
            reservedSec: videos.reduce((sum, v) => sum + v.sec, 0),
          },
          glog,
        );
        if (!live()) return;
        result.videos = videos;
        result.media = media;
        setStoryboard(result);
        setStage('plan');
        const videoSec = videos.reduce((sum, v) => sum + v.sec, 0);
        mark(
          'storyboard',
          'done',
          `${result.plan.scenes.length + videos.length} scene${result.plan.scenes.length + videos.length === 1 ? '' : 's'} · ${Math.round(secs(result.plan) + videoSec)}s · ${result.source === 'director' ? 'AI director' : 'Ink Press'}`,
        );
        const lines = result.plan.scenes.map((sc) => `${sc.kind === 'title' ? 'Title card' : sc.recipeId.split('/')[1]} · ${sc.durationSec}s${sc.headline ? ` — “${sc.headline.replace(/\*/g, '')}”` : ''}`);
        // Attached videos play just before the closing scene (after a one-scene film), as the build places them.
        lines.splice(lines.length > 1 ? lines.length - 1 : lines.length, 0, ...videos.map((v) => `Your video ${v.name} · ${v.sec}s`));
        const numbered = lines.map((line, i) => `${i + 1}. ${line}`);
        say(
          'assistant',
          `${result.note ? `${result.note} I used the Ink Press template instead.\n\n` : ''}Storyboard “${result.plan.title}” — ${lines.length} scene${lines.length === 1 ? '' : 's'}, ${Math.round(secs(result.plan) + videos.reduce((sum, v) => sum + v.sec, 0))}s${result.capture ? ', using your captured pages' : ''}:\n${numbered.join('\n')}\n\nApprove to build the film, or tell me what to change.`,
        );
      } catch (error) {
        if (!live()) return;
        setStage('idle');
        mark('storyboard', 'error', error instanceof Error ? error.message : 'failed');
        say('assistant', `I could not storyboard that: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    },
    [log, mark, say, storyboard?.capture],
  );

  /** Handle a chat message. Returns false when it is not a film request (the caller treats it as an edit). */
  const send = useCallback(
    (raw: string, sendOpts: { force?: boolean } = {}): boolean => {
      const text = raw.trim();
      if (!text) return false;
      if (stage === 'storyboarding' || stage === 'building') {
        say('assistant', `I'm still ${stage === 'building' ? 'building the film' : 'working on the storyboard'} — press Stop to cancel it, then send that again.`);
        return true;
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
          extra.template ?? (extra.recipes.length ? 'director' : prev.template),
          true,
        );
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
    const my = gen.current;
    const live = () => gen.current === my;
    const glog: typeof log = (label, status) => {
      if (!live()) return;
      log(label, status);
      if (/^Finding the beat/.test(label)) mark('beat', 'active', label);
      else if (/^Frame QA/.test(label)) mark('qa', status === 'running' ? 'active' : status === 'error' ? 'error' : 'done', label.replace(/^Frame QA · /, ''));
    };
    const s = optsRef.current.settings();
    setStage('building');
    mark('animate', 'active', 'Building the Remotion project');
    try {
      // Build with the attachments the approved storyboard was planned with (a revision picks up new ones).
      const media = storyboard.media ?? s.media;
      const project = await buildFilmProject(storyboard.plan, { aspectRatio: s.aspectRatio, capture: storyboard.capture, media, logo: s.brandKit?.logo ?? null }, glog);
      const qa = checkFilmStructure(project, { hasProductImages: Boolean(storyboard.capture) || media.some((m) => m.kind === 'image') });
      const cuts = project.tracks.flatMap((t) => t.clips).filter((c) => c.cardId === 'audio-clip' && /sfxlib/.test(String(c.props?.file ?? ''))).length;
      const music = media.find((m) => m.kind === 'audio');
      mark('animate', 'done', `${project.tracks.reduce((n, t) => n + t.clips.length, 0)} clips on ${project.tracks.length} tracks`);
      mark('beat', 'done', `${cuts} SFX hits${music ? ` · cuts on the beat of ${music.name}` : ' · attach music to beat-sync the cuts'}`);
      const frames = await checkFilmFrames(project, glog);
      if (!live()) return;
      qa.framesChecked = frames.checked;
      qa.issues.push(...frames.failed.map((f) => `Frame ${f}`));
      qa.ok = qa.issues.length === 0;
      const built = { project, qa };
      setFilm(built);
      setStage('film');
      if (!frames.checked && !frames.failed.length) mark('qa', qa.ok ? 'done' : 'error', qa.ok ? 'Structure checked' : `${qa.issues.length} issue(s)`);
      else if (!qa.ok) mark('qa', 'error', `${qa.issues.length} issue(s)`);
      mark('deliver', 'done', 'MP4 · Motion Workbench');
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
      if (!live()) return;
      setStage('plan');
      mark('animate', 'error', error instanceof Error ? error.message : 'failed');
      log(error instanceof Error ? error.message : 'Could not build the film', 'error');
      say('assistant', `Building the film failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }, [log, mark, say, storyboard]);

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
    setActivity([]);
    setSteps((prev) => prev.map((st) => (st.state === 'active' ? { ...st, state: 'todo', detail: 'Stopped' } : st)));
    if (stage === 'storyboarding') {
      pending.current = null;
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
    pending.current = null;
    offerReq.current = null;
    setStage('idle');
    setStoryboard(null);
    setFilm(null);
    setActivity([]);
    setMessages([]);
    setSteps(initialSteps());
  }, []);

  return { messages, stage, activity, steps, storyboard, film, send, chooseTemplate, approve, revise, stop, reset };
}

export type FilmDirector = ReturnType<typeof useFilmDirector>;

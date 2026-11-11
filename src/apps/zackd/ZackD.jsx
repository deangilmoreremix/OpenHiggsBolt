'use client';

// SmartVideo GO: Zack D studio. One question -> curiosity-loop script -> 3D character sheets -> keyframes -> Veo
// clips -> final cut (+ optional voice, music, burned-in captions). Adapted from
// https://github.com/Anil-matcha/zack-d-films-ai-video-generator (MIT, see NOTICE.md).
//
// Built like the package video studios (packages/studio/src/components/VideoStudio.jsx): bg-app-bg root, a max-w-7xl
// gallery of result cards (hover-play, overlay actions, mobile actions, lightbox), an empty-state hero, and the shared
// floating PromptComposer whose action button follows the pipeline. Same prop contract as those studios
// (`onGeneration*` callbacks), toasts from react-hot-toast.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  PromptComposer, PromptTextarea, PromptFooter, PromptControls, PromptAction, PromptPopover, PromptPopoverHeader,
  PromptMenuList, PromptMenuItem, PromptChevronIcon, PromptAspectRatioIcon, promptControlClassName, PROMPT_CONTROL_LABEL_CLASS,
} from 'studio/src/components/prompt/PromptComposer';
import MobileGenerationActions, { GenerationCopyButtons } from 'studio/src/components/MobileGenerationActions.jsx';
import TemplateBanner from 'studio/src/components/TemplateBanner.jsx';
import { PublishStep, useSocialPublish } from '@/components/SocialPublishProvider';
import { scopedPersistKey } from 'studio/src/persistKey.js';
import * as muapi from 'studio/src/muapi.js';
import { createJobs, pool } from './jobs.js';
import {
  SEED_TOPICS, LOOKS, DEFAULT_LOOK, TTS_VOICES, DEFAULT_VOICE, DEFAULT_TTS_SPEED, UPSTREAM_VOICE, DEFAULT_EXTRAS,
  CAPTION_LANGUAGES, CAPTION_THEMES, DEFAULT_CAPTION_LANGUAGE, DEFAULT_CAPTION_THEME, isPlaceholderUrl,
  characterSheetPrompt, keyframePrompt, clipPrompt, narrationText, allShots, totalDuration, starterBeatMap,
} from './zackdPrompts.js';
import { buildSrt } from './finalCutPlan.js';
import { TEMPLATES, TEMPLATE_ATTRIBUTION, templateToProject } from './templates.js';

const STORE_KEY = 'zackd_project_v1';
const HISTORY_KEY = 'hg_zackd_history';
const PENDING_KEY = 'zackd_pending_v1';
const CONCURRENCY = 3;
const MAX_PENDING_AGE_MS = 60 * 60 * 1000;

// A request that timed out, lost the connection or was cancelled may still finish at the provider: keep its record so a
// later visit can recover it. Only a success or a confirmed provider failure removes it.
const isRecoverable = (e) => e?.name === 'AbortError' || /timed out|failed to fetch|network/i.test(String(e?.message));
const newPid = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const blank = () => ({
  pid: newPid(), topic: '', map: null, approved: false, look: DEFAULT_LOOK, sheets: {}, shots: {}, voice: DEFAULT_VOICE,
  narration: null, music: null, templateId: null, captionLang: DEFAULT_CAPTION_LANGUAGE, captionTheme: DEFAULT_CAPTION_THEME, ...DEFAULT_EXTRAS,
});

// Class strings copied from VideoStudio.jsx so the cards and sections match.
const CARD = 'relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col';
const OVERLAY_BTN = 'p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 disabled:opacity-40';
const SECTION_LABEL = 'text-[11px] font-semibold text-white/30 uppercase tracking-wider';
const GRID = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up';
const SHOT_GRID = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full pt-4 animate-fade-in-up';
const FIELD = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-primary/45 transition-colors disabled:opacity-60';
const SAMPLES = ['beat_1_a', 'beat_1_b', 'beat_2_a', 'beat_3_a'].map((id) => `/zackd/templates/swallow-gum/keyframes/${id}.png`);

function downloadFile(url, name) {
  const a = document.createElement('a');
  a.href = url; a.download = name; a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
);
const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
);
const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
);

/** One result card, same anatomy as the Video Studio gallery: hover-play media, overlay actions, mobile actions, footer. */
function MediaCard({ id, label, kind, url, prompt, aspect = 'aspect-[9/16]', pending, disabled, onRedo, onRedoKeyframe, onOpen, onCopyError }) {
  const name = `${id.replace(/[^a-z0-9]+/gi, '-')}.${kind === 'video' ? 'mp4' : 'png'}`;
  const actions = [];
  if (url) actions.push({ kind: 'download', label: 'Download', onSelect: () => downloadFile(url, name) });
  if (onRedo) actions.push({ kind: 'redo', label: url ? 'Redo' : 'Generate', onSelect: onRedo, disabled });
  if (onRedoKeyframe) actions.push({ kind: 'redo', label: 'Redo keyframe', onSelect: onRedoKeyframe, disabled });
  return (
    <div className={`${CARD} ${url ? 'cursor-pointer' : ''}`} data-result-card={id} onClick={() => url && !pending && onOpen?.(url, kind)}>
      {pending ? (
        <div className={`w-full ${aspect} bg-white/5 animate-pulse flex items-center justify-center text-[10px] text-white/40`}>Generating…</div>
      ) : url && kind === 'video' ? (
        <video
          src={url} className={`w-full ${aspect} object-cover bg-black/40 hover:opacity-80`} loop muted playsInline controls={false} preload="metadata"
          onMouseOver={(e) => { const r = e.currentTarget.play?.(); r?.catch?.(() => {}); }}
          onMouseOut={(e) => { e.currentTarget.pause?.(); try { e.currentTarget.currentTime = 0; } catch { /* not ready */ } }}
        />
      ) : url ? (
        <img src={url} alt="" className={`w-full ${aspect} object-cover bg-black/40 hover:opacity-80`} />
      ) : (
        <div className={`w-full ${aspect} bg-white/[0.03] flex items-center justify-center text-[11px] text-white/30`}>Not generated yet</div>
      )}
      <div className="absolute top-2 right-2 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {prompt && url && <GenerationCopyButtons prompt={prompt} onCopyError={onCopyError} />}
        {url && <button type="button" title="Download" aria-label={`Download ${label}`} onClick={(e) => { e.stopPropagation(); downloadFile(url, name); }} className={OVERLAY_BTN}><DownloadIcon /></button>}
        {onRedoKeyframe && <button type="button" title="Redo keyframe" aria-label={`Redo keyframe ${label}`} disabled={disabled} onClick={(e) => { e.stopPropagation(); onRedoKeyframe(); }} className={OVERLAY_BTN}><ImageIcon /></button>}
        {onRedo && <button type="button" title={url ? 'Redo' : 'Generate'} aria-label={`${url ? 'Redo' : 'Generate'} ${label}`} disabled={disabled} onClick={(e) => { e.stopPropagation(); onRedo(); }} className={OVERLAY_BTN}><RedoIcon /></button>}
      </div>
      <MobileGenerationActions prompt={url ? prompt : undefined} onCopyError={onCopyError} actions={actions} />
      <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5">
        <p className="text-white/70 text-xs line-clamp-3">{label}</p>
      </div>
    </div>
  );
}

function Lightbox({ media, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!media) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm animate-fade-in flex items-center justify-center p-4" role="dialog" onClick={onClose}>
      {media.kind === 'video'
        ? <video src={media.url} className="max-w-[95vw] max-h-[95vh] rounded-2xl animate-scale-up" controls autoPlay loop playsInline onClick={(e) => e.stopPropagation()} />
        : <img src={media.url} alt="" className="max-w-[95vw] max-h-[95vh] rounded-2xl animate-scale-up" onClick={(e) => e.stopPropagation()} />}
      <button type="button" aria-label="Close" onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white">✕</button>
    </div>
  );
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

// Publishing needs a hosted URL, but the final cut only exists as an in-browser blob: upload it first.
function PostFinalToSocial({ apiKey, final, busy, onError }) {
  const { openPublish } = useSocialPublish();
  const [uploading, setUploading] = useState(false);
  // An upload that finishes for an older cut (re-render, new project, template, unmount) must not open the
  // publish modal with a video that is no longer on screen.
  const current = useRef(final);
  current.current = final;
  useEffect(() => () => { current.current = null; }, []);
  // Instagram only takes MP4/MOV; the in-browser renderer falls back to WebM on some browsers.
  const unsupported = final && final.ext && final.ext !== 'mp4';
  async function go() {
    const started = final;
    if (uploading || !started?.blob || unsupported) return;
    setUploading(true);
    try {
      const file = new File([started.blob], `zackd-short.${started.ext || 'mp4'}`, { type: started.blob.type || 'video/mp4' });
      const url = await muapi.uploadFile(apiKey, file);
      if (current.current !== started) return;
      openPublish({ mediaUrl: url, mediaType: 'video', title: started.topic ? String(started.topic).slice(0, 50) : 'Zack D short' });
    } catch (e) { if (current.current === started) onError(e?.message || 'Could not upload the video for publishing.'); }
    setUploading(false);
  }
  return (
    <button
      type="button" className={promptControlClassName({ compact: true })} disabled={busy || uploading || !apiKey || unsupported} onClick={go}
      title={unsupported ? 'This cut was rendered as WebM, which Instagram and TikTok reject. Re-render in a browser that can make MP4 (Chrome or Edge) to post it.' : undefined}
    >
      <span className={PROMPT_CONTROL_LABEL_CLASS}>{uploading ? 'Uploading…' : unsupported ? 'Post (needs MP4)' : 'Post to social'}</span>
    </button>
  );
}

export default function ZackD({
  apiKey, templateData, droppedFiles, onFilesHandled, onGenerationStart, onGenerationEnd, onGenerationComplete, onGenerationError,
}) {
  // Zack D takes a topic, not files: acknowledge dropped files so the shell does not hand them to another studio later.
  useEffect(() => { if (droppedFiles?.length) onFilesHandled?.(); }, [droppedFiles, onFilesHandled]);
  const storeKey = useMemo(() => scopedPersistKey(STORE_KEY, apiKey), [apiKey]);
  const historyKey = useMemo(() => scopedPersistKey(HISTORY_KEY, apiKey), [apiKey]);
  const pendingKey = useMemo(() => scopedPersistKey(PENDING_KEY, apiKey), [apiKey]);
  // the id of the project that was saved last time, read before any effect can overwrite it
  const storedPid = useMemo(() => { try { return JSON.parse(localStorage.getItem(scopedPersistKey(STORE_KEY, apiKey)) || '{}').pid || null; } catch { return null; } }, [apiKey]);
  const seedPrompt = templateData?.prompt || '';
  const [project, setProject] = useState(blank);
  const [history, setHistory] = useState([]);
  const [pending, setPending] = useState(() => new Set());
  const recoveryLocks = useRef(new Map()); // pending key -> id of the project whose recovered job holds it
  const pendingRef = useRef(pending); // current pending keys, for guards that run inside async work
  pendingRef.current = pending;
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [final, setFinal] = useState(null); // { url, blob, ext, warning, saved } not persisted (blob URLs die with the page)
  const [captioned, setCaptioned] = useState(null); // { url } burned-in captions result (remote URL)
  const proj = useRef(project);
  proj.current = project;
  const abort = useRef(null);
  const finalRef = useRef(null);
  const jobs = useMemo(() => createJobs(muapi, apiKey), [apiKey]);

  // ---- persistence ------------------------------------------------------------------------------------------------
  useEffect(() => {
    let loaded = blank();
    try { loaded = { ...blank(), ...JSON.parse(localStorage.getItem(storeKey) || '{}') }; } catch { /* corrupt or unavailable storage: start fresh */ }
    if (!loaded.topic && seedPrompt) loaded.topic = String(seedPrompt).slice(0, 200);
    setProject(loaded);
    setHistory(readJson(historyKey, []));
  }, [storeKey, historyKey, seedPrompt]);
  useEffect(() => { try { localStorage.setItem(storeKey, JSON.stringify(project)); } catch { /* quota/private mode */ } }, [project, storeKey]);
  const addHistory = (url) => setHistory((h) => {
    const next = [{ id: `${Date.now()}`, url, prompt: proj.current.topic, ts: Date.now() }, ...h.filter((x) => x.url !== url)].slice(0, 30);
    try { localStorage.setItem(historyKey, JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  });
  useEffect(() => () => { abort.current?.abort(); }, []);
  useEffect(() => () => { if (finalRef.current) URL.revokeObjectURL(finalRef.current); }, []);

  const set = useCallback((patch) => setProject((p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) })), []);
  const sheets = project.map?.character_sheets || [];
  const shots = project.map ? allShots(project.map) : [];
  const hasKey = !!apiKey;
  const lookLabel = LOOKS[project.look]?.label.replace(' (upstream)', '') || 'Look';

  const fail = (message) => {
    toast.error(message);
    onGenerationError?.(message);
  };

  // ---- pending jobs: resumed after a reload through the app's own resumeGeneration -------------------------------------
  const readPending = () => { const list = readJson(pendingKey, []); return Array.isArray(list) ? list.filter((j) => j && Date.now() - j.ts < MAX_PENDING_AGE_MS) : []; };
  const writePending = (list) => { try { localStorage.setItem(pendingKey, JSON.stringify(list)); } catch { /* ignore */ } };
  const applyResult = useCallback((meta, url) => {
    if (!url || isPlaceholderUrl(url)) return;
    setProject((p) => {
      if (meta.slot === 'sheet') return { ...p, sheets: { ...p.sheets, [meta.id]: { url } } };
      if (meta.slot === 'keyframe') return { ...p, shots: { ...p.shots, [meta.id]: { ...(p.shots[meta.id] || {}), keyframe: url, clip: null } } };
      if (meta.slot === 'clip') return { ...p, shots: { ...p.shots, [meta.id]: { ...(p.shots[meta.id] || {}), clip: url } } };
      if (meta.slot === 'narration') return { ...p, narration: url, mixVoice: true };
      if (meta.slot === 'music') return { ...p, music: url, mixVoice: true };
      return p;
    });
  }, []);
  const pendingKeyOf = (j) => (j.slot === 'sheet' ? `sheet:${j.id}` : j.slot === 'keyframe' ? `kf:${j.id}` : j.slot === 'clip' ? `clip:${j.id}` : j.slot);
  useEffect(() => {
    if (!apiKey || typeof muapi.resumeGeneration !== 'function') return undefined;
    const list = readPending();
    writePending(list);
    // resumed jobs show as in progress, and the action button waits for them, so a paid request is not submitted twice
    // Only the project that is shown now is locked. A recovered job of an older project keeps polling (its result is
    // discarded), but it must not disable this project's actions. The shown project is read from storage, because the
    // project state itself is hydrated by a separate effect, and the effect that saves the project overwrites the stored
    // one on mount, so the id is read during render (see storedPid), before any effect runs.
    const shownPid = storedPid;
    const locking = list.filter((j) => !j.pid || !shownPid || j.pid === shownPid);
    if (locking.length) setPending((p) => new Set([...p, ...locking.map(pendingKeyOf)]));
    locking.forEach((j) => { if (j.pid) recoveryLocks.current.set(pendingKeyOf(j), j.pid); });
    const ctl = new AbortController();
    list.forEach(async (j) => {
      let settled = true; // false = the job may still be running: keep its record so a later visit can pick it up
      try {
        const r = await muapi.resumeGeneration(apiKey, j.rid, { signal: ctl.signal }); // default 30 min, like a normal clip
        if (!j.pid || j.pid === proj.current.pid) { applyResult(j, r?.url); toast('Recovered a generation that was still running'); }
      } catch (e) { if (ctl.signal.aborted || isRecoverable(e)) settled = false; /* else a confirmed failure: drop it */ }
      if (settled) writePending(readPending().filter((x) => x.rid !== j.rid)); // a local cancel keeps it for the next load
      if (recoveryLocks.current.get(pendingKeyOf(j)) === j.pid) recoveryLocks.current.delete(pendingKeyOf(j));
      setPending((p) => { const n = new Set(p); n.delete(pendingKeyOf(j)); return n; });
    });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, pendingKey]);

  async function tracked(slot, id, run) {
    const pid = proj.current.pid; // the project this job belongs to
    const rids = [];
    let keep = false;
    const onRequestId = (r) => { rids.push(r); writePending([...readPending(), { rid: r, slot, id, pid, ts: Date.now() }]); };
    try {
      const out = await run(onRequestId);
      if (proj.current.pid === pid) applyResult({ slot, id }, out.url); // a new project/template started meanwhile: drop it
      return out;
    } catch (e) { keep = isRecoverable(e); throw e; }
    finally { if (rids.length && !keep) writePending(readPending().filter((x) => !rids.includes(x.rid))); }
  }
  const genSheet = (sh) => tracked('sheet', sh.id, (onRequestId) => jobs.image({ prompt: characterSheetPrompt(sh, { look: proj.current.look, boost: proj.current.consistencyBoost }), aspect: '16:9', onRequestId }));
  const genKeyframe = (shot) => tracked('keyframe', shot.shot_id, (onRequestId) => jobs.image({ prompt: keyframePrompt(shot, proj.current.map.character_sheets, { look: proj.current.look, boost: proj.current.consistencyBoost }), aspect: '9:16', onRequestId }));
  const genClip = async (shot) => {
    const kf = proj.current.shots[shot.shot_id]?.keyframe;
    if (!kf) throw new Error('Generate the keyframe first.');
    if (pendingRef.current.has(`kf:${shot.shot_id}`)) throw new Error('This shot\'s keyframe is still being generated. Wait for it before animating.');
    return tracked('clip', shot.shot_id, (onRequestId) => jobs.clip({ imageUrl: kf, prompt: clipPrompt(shot), onRequestId }));
  };
  const genNarration = () => tracked('narration', 'narration', (onRequestId) => jobs.narration({ text: narrationText(proj.current.map), voice: proj.current.voice, speed: DEFAULT_TTS_SPEED, onRequestId }));
  const genMusic = () => tracked('music', 'music', (onRequestId) => jobs.music({ prompt: `Underscore for a short about: ${proj.current.topic}`, duration: Math.ceil(totalDuration(proj.current.map)) + 5, onRequestId }));

  // A batch of paid jobs with a cost confirmation, per-card pending state and the shell's generation callbacks.
  async function batch(label, items, keyOf, fn, confirmText) {
    items = items.filter((i) => !pending.has(keyOf(i))); // never submit a second paid request for a slot that is still running
    if (busy || !items.length) return;
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true); onGenerationStart?.();
    setPending((p) => new Set([...p, ...items.map(keyOf)]));
    abort.current = new AbortController();
    let done = 0;
    setProgress(`${label}: 0/${items.length}`);
    const results = await pool(items, CONCURRENCY, async (item) => {
      try { return await fn(item); } finally {
        done += 1; setProgress(`${label}: ${done}/${items.length}`);
        setPending((p) => { const n = new Set(p); n.delete(keyOf(item)); return n; });
      }
    });
    const failed = results.filter((r) => !r.ok && r.error?.name !== 'AbortError');
    if (failed.length) fail(`${failed.length} of ${items.length} failed: ${String(failed[0].error?.message || 'error').replace(/[.\s]+$/, '')}. Use Redo to retry them.`);
    else toast.success(`${label} ready`);
    setBusy(false); setProgress(''); onGenerationEnd?.();
  }

  // ---- pipeline: the action button always runs the next step ----------------------------------------------------------
  const sheetsTodo = sheets.filter((x) => !project.sheets[x.id]);
  const kfTodo = shots.filter((x) => !project.shots[x.shot_id]?.keyframe);
  const clipTodo = shots.filter((x) => !project.shots[x.shot_id]?.clip);
  const next = (() => {
    if (!project.map) return { id: 'script', label: 'Write script', disabled: !project.topic.trim() };
    if (!project.approved) return { id: 'approve', label: 'Approve script' };
    // The sheets only anchor the keyframes, so a project that already has its keyframes (e.g. a finished template) skips them.
    if (kfTodo.length && sheetsTodo.length) return { id: 'sheets', label: `Generate ${sheetsTodo.length} character sheet${sheetsTodo.length > 1 ? 's' : ''}` };
    if (kfTodo.length) return { id: 'keyframes', label: `Generate ${kfTodo.length} keyframe${kfTodo.length > 1 ? 's' : ''}` };
    if (clipTodo.length) return { id: 'clips', label: `Animate ${clipTodo.length} clip${clipTodo.length > 1 ? 's' : ''}` };
    return { id: 'final', label: final ? 'Render again' : 'Render final cut' };
  })();

  // Media steps are paid MuAPI calls on the user's own key; approving also starts the sheets, so it needs the key too.
  const needsKey = ['sheets', 'keyframes', 'clips'].includes(next.id) || (next.id === 'approve' && kfTodo.length > 0);
  const runSheets = () => batch('Character sheets', sheetsTodo, (x) => `sheet:${x.id}`, genSheet, `Generate ${sheetsTodo.length} character sheet image(s)?`);
  const runKeyframes = () => batch('Keyframes', kfTodo, (x) => `kf:${x.shot_id}`, genKeyframe, `Generate ${kfTodo.length} keyframe image(s)?`);
  const runClips = () => batch('Clips', clipTodo, (x) => `clip:${x.shot_id}`, genClip, `Generate ${clipTodo.length} video clip(s) with Veo 3.1? This is the most expensive step.`);

  // A new project/template/script replaces the old one: its recovered jobs keep polling but their results are discarded,
  // so they must stop locking the new project's cards and pipeline.
  const releaseRecoveryLocks = () => {
    if (!recoveryLocks.current.size) return;
    const held = new Set(recoveryLocks.current.keys());
    recoveryLocks.current.clear();
    setPending((p) => new Set([...p].filter((k) => !held.has(k))));
  };

  function writeScript() {
    if (busy || !project.topic.trim()) return;
    // MuAPI has no text endpoint, so the script is an editable starter beat map (the upstream scripts' own default
    // is also a fixed skeleton); nothing is generated or charged until the script is approved.
    releaseRecoveryLocks();
    set({ pid: newPid(), map: starterBeatMap(project.topic), approved: false, sheets: {}, shots: {}, narration: null, music: null, templateId: null });
    setFinal(null); setCaptioned(null);
  }

  function loadTemplate(t) {
    if (busy) return;
    if (project.map && !window.confirm('Replace the current project with this template?')) return;
    releaseRecoveryLocks();
    setProject({ ...blank(), ...templateToProject(t, window.location.origin), look: project.look, voice: project.voice, approved: t.kind === 'finished', templateId: t.id });
    setFinal(null); setCaptioned(null); setOpenDropdown(null);
  }
  const newProject = () => {
    if (!window.confirm('Start a new project? The current one will be cleared from this browser.')) return;
    releaseRecoveryLocks();
    setProject(blank()); setFinal(null); setCaptioned(null);
  };

  async function assemble() {
    if (busy) return;
    const missing = shots.filter((s) => !project.shots[s.shot_id]?.clip);
    if (missing.length) { fail(`${missing.length} shot(s) have no clip yet.`); return; }
    setBusy(true); onGenerationStart?.(); setProgress('Rendering 0%');
    abort.current = new AbortController();
    try {
      const { renderFinalCut } = await import('./finalCut.js'); // loads the renderer only when needed
      const out = await renderFinalCut({
        shots: shots.map((s) => ({ src: project.shots[s.shot_id].clip, planned: s.duration_sec, zoom: s.zoom_impact })),
        narrationUrl: project.narration, musicUrl: project.music, keepClipAudio: project.keepClipAudio !== false,
        mixVoice: !!project.mixVoice, trimToPlanned: !!project.trimToPlanned, signal: abort.current.signal,
        onProgress: (p) => setProgress(`Rendering ${Math.round(p * 100)}%`),
      });
      if (out.ok) {
        if (finalRef.current) URL.revokeObjectURL(finalRef.current);
        const url = URL.createObjectURL(out.blob);
        finalRef.current = url;
        setCaptioned(null);
        setFinal({ url, blob: out.blob, ext: out.extension, warning: out.warning, saved: false, topic: proj.current.topic, durations: out.durations, hasNarration: !!(out.hasAudio !== false && project.mixVoice && project.narration) }); // from the inputs this render was started with (project), not the live state, which can change while it encodes
        toast.success('Final cut ready');
        onGenerationComplete?.({ url, model: 'zackd', prompt: project.topic, type: 'video' });
      } else if (out.reason !== 'cancelled') fail(out.error);
    } catch (e) { fail(e?.message || 'The final cut failed.'); }
    setBusy(false); setProgress(''); onGenerationEnd?.();
  }

  // Opt-in, paid: upload the rendered cut to MuAPI, then burn animated captions in with ai-captions (Vadoo).
  async function burnCaptions() {
    if (busy || !final?.blob) return;
    if (!project.narration) { fail('Captions are generated from the spoken audio. Add narration first.'); return; }
    if (!final.hasNarration) { fail('This cut does not include the narration. Mix it in (Advanced) and render again before burning captions.'); return; }
    if (!window.confirm('Burn captions into the video with MuAPI AI Captions? About $0.20 minimum ($0.005 per second), and it takes a few minutes.')) return;
    setBusy(true); onGenerationStart?.(); setProgress('Uploading the video…');
    abort.current = new AbortController();
    try {
      const file = new File([final.blob], `zackd-cut.${final.ext || 'mp4'}`, { type: final.blob.type || 'video/mp4' });
      const videoUrl = await muapi.uploadFile(apiKey, file);
      setProgress('Burning captions (2-3 minutes)…');
      const { url } = await jobs.captions({ videoUrl, language: project.captionLang, theme: project.captionTheme });
      setCaptioned({ url, topic: final.topic }); addHistory(url);
      toast.success('Captions ready');
      onGenerationComplete?.({ url, model: 'ai-captions', prompt: project.topic, type: 'video' });
    } catch (e) { fail(e?.message || 'Burning captions failed.'); }
    setBusy(false); setProgress(''); onGenerationEnd?.();
  }

  function onAction() {
    setOpenDropdown(null);
    if (next.id === 'script') writeScript();
    else if (next.id === 'approve') { set({ approved: true }); if (sheetsTodo.length && kfTodo.length) runSheets(); }
    else if (next.id === 'sheets') runSheets();
    else if (next.id === 'keyframes') runKeyframes();
    else if (next.id === 'clips') runClips();
    else assemble();
  }

  const toggleDropdown = (type) => (e) => { e.stopPropagation(); setOpenDropdown((p) => (p === type ? null : type)); };
  const extraRow = (key, id, label, hint) => (
    <label key={id} className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs text-white/80" title={hint}>
      <input type="checkbox" id={id} className="mt-0.5" checked={key === 'keepClipAudio' ? project.keepClipAudio !== false : !!project[key]} onChange={(e) => set({ [key]: e.target.checked })} />
      <span>{label}</span>
    </label>
  );

  const finalCutCard = final && (
    <section className="w-full" id="z-final">
      <h2 className={SECTION_LABEL}>Final cut</h2>
      <p className="text-xs text-white/40 mt-1">Rendered in your browser. By default each clip keeps its real length and its own sound, like upstream.</p>
      <div className="flex flex-col items-center gap-4 pt-4">
        <video src={final.url} className="max-h-[60vh] rounded-3xl border border-white/10 object-contain bg-black" style={{ aspectRatio: '9 / 16' }} controls loop playsInline preload="auto" />
        {final.warning && <p className="text-xs text-white/50">{final.warning}</p>}
        <div className="flex flex-wrap gap-2 justify-center">
          <button type="button" className={promptControlClassName({ compact: true })} onClick={() => downloadFile(final.url, `zackd-short.${final.ext}`)}><span className={PROMPT_CONTROL_LABEL_CLASS}>Download video</span></button>
          <PostFinalToSocial apiKey={apiKey} final={final} busy={busy} onError={fail} />
          <button type="button" className={promptControlClassName({ compact: true })} onClick={() => { const u = URL.createObjectURL(new Blob([buildSrt(project.map.beats, undefined, final.durations)], { type: 'text/plain' })); downloadFile(u, 'zackd-short.srt'); setTimeout(() => URL.revokeObjectURL(u), 2000); }}><span className={PROMPT_CONTROL_LABEL_CLASS}>Captions (.srt)</span></button>
          <button type="button" className={promptControlClassName({ compact: true })} onClick={newProject}><span className={PROMPT_CONTROL_LABEL_CLASS}>New project</span></button>
        </div>
        <p className="text-xs text-white/40">The .srt is a free, separate caption file. To burn animated captions into the video, use the option below.</p>
        <div className={`${CARD} p-4 gap-3 w-full max-w-3xl`}>
          <h3 className="text-sm font-semibold text-white">Burn captions into the video</h3>
          <p className="text-xs text-white/50">Animated, word-by-word captions in a viral style. Paid: about $0.20 minimum ($0.005 per second), 2-3 minutes. Needs narration.</p>
          <div className="flex gap-2 items-center flex-wrap">
            <select aria-label="Caption language" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none min-w-[150px]" value={project.captionLang} onChange={(e) => set({ captionLang: e.target.value })}>
              {CAPTION_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Caption theme">
            {CAPTION_THEMES.map((t) => (
              <button key={t.value} type="button" aria-pressed={project.captionTheme === t.value} onClick={() => set({ captionTheme: t.value })}
                className={promptControlClassName({ compact: true, active: project.captionTheme === t.value })}><span className={PROMPT_CONTROL_LABEL_CLASS}>{t.label}</span></button>
            ))}
          </div>
          <div>
            <button type="button" disabled={busy || !hasKey || !project.narration || !final.hasNarration} onClick={burnCaptions} className={promptControlClassName({ active: true })}><span className={PROMPT_CONTROL_LABEL_CLASS}>{captioned ? 'Burn again' : 'Burn captions'}</span></button>
          </div>
          {!project.narration && <p className="text-xs text-white/40">Generate narration first: captions are transcribed from the spoken audio.</p>}
          {project.narration && !final.hasNarration && <p className="text-xs text-white/40">This cut does not contain the narration. Turn on “Mix in the narration and music” in Advanced and render again, then burn captions.</p>}
          {captioned && (
            <>
              <video src={captioned.url} className="max-h-[60vh] rounded-2xl bg-black border border-white/10" style={{ aspectRatio: '9 / 16' }} controls loop playsInline />
              <a className={promptControlClassName({ compact: true })} href={captioned.url} target="_blank" rel="noopener noreferrer"><span className={PROMPT_CONTROL_LABEL_CLASS}>Open / download captioned video</span></a>
              <PublishStep mediaUrl={captioned.url} mediaType="video" title={captioned.topic ? String(captioned.topic).slice(0, 50) : 'Zack D short'} />
            </>
          )}
        </div>
      </div>
    </section>
  );

  const template = TEMPLATES.find((t) => t.id === project.templateId);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden" onClick={() => setOpenDropdown(null)}>
      {/* ── CENTRAL GALLERY AREA ── */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2">
        {project.map ? (
          <div className="flex flex-col gap-10 pt-4">
            <section>
              <div className="flex items-center gap-3">
                <h2 className={SECTION_LABEL}>Script</h2>
                {!project.approved && (
                  <button type="button" disabled={busy || !project.topic.trim()} className={promptControlClassName({ compact: true })}
                    onClick={() => { if (window.confirm('Write a new script from the topic? Your edits to this script are replaced.')) writeScript(); }}>
                    <span className={PROMPT_CONTROL_LABEL_CLASS}>Rewrite script</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-white/40 mt-1">
                {project.approved
                  ? `${project.map.beats.length} beats · ${shots.length} shots · about ${Math.round(totalDuration(project.map))}s planned`
                  : `Gate 1: review the beat map (${project.map.beats.length} beats, ${shots.length} shots). Edit anything, then approve.`}
              </p>
              <div className={GRID}>
                {project.map.beats.map((b, bi) => (
                  <div key={b.beat_id} className={`${CARD} p-3 gap-2`}>
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Beat {bi + 1}{b.hook ? ' · Hook' : ''} · {b.title_en}</div>
                    <textarea className={`${FIELD} text-sm`} rows={3} maxLength={400} disabled={busy || pending.has('narration')} aria-label={`Narration, beat ${bi + 1}`} value={b.narration}
                      onChange={(e) => {
                        const text = e.target.value;
                        // the generated voice-over now speaks the old text: drop it (and a cut that mixed it in) so it must be regenerated
                        if (project.narration && final?.hasNarration) setFinal(null);
                        set((p) => ({ narration: null, map: { ...p.map, beats: p.map.beats.map((x) => (x.beat_id === b.beat_id ? { ...x, narration: text } : x)) } }));
                      }} />
                    {b.shots.map((sh) => (
                      <div key={sh.shot_id} className="flex flex-col gap-1">
                        <span className="text-[10px] text-white/40">{sh.shot_id} · {sh.duration_sec}s planned{sh.zoom_impact ? ' · zoom' : ''}</span>
                        <textarea className={`${FIELD} text-xs`} rows={2} maxLength={400} disabled={busy} aria-label={`Scene, ${sh.shot_id}`} value={sh.scene_description}
                          onChange={(e) => set((p) => ({ map: { ...p.map, beats: p.map.beats.map((x) => ({ ...x, shots: x.shots.map((y) => (y.shot_id === sh.shot_id ? { ...y, scene_description: e.target.value } : y)) })) } }))} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            {project.approved && (
              <>
                <section>
                  <h2 className={SECTION_LABEL}>Character sheets</h2>
                  <p className="text-xs text-white/40 mt-1">The consistency anchors. Each keyframe names the sheets it is anchored on.</p>
                  <div className={GRID}>
                    {sheets.map((x) => (
                      <MediaCard key={x.id} id={`sheet:${x.id}`} label={`${x.id.replace(/_/g, ' ')}: ${x.description}`} kind="image" aspect="aspect-video"
                        url={project.sheets[x.id]?.url} prompt={characterSheetPrompt(x, { look: project.look, boost: project.consistencyBoost })}
                        pending={pending.has(`sheet:${x.id}`)} disabled={busy || !hasKey || pending.has(`sheet:${x.id}`)} onOpen={(u, k) => setLightbox({ url: u, kind: k })} onCopyError={fail}
                        onRedo={() => batch('Character sheet', [x], (i) => `sheet:${i.id}`, genSheet)} />
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className={SECTION_LABEL}>Shots</h2>
                  <p className="text-xs text-white/40 mt-1">Keyframes first, then each one is animated with Veo 3.1. Hover a card to play it.</p>
                  <div className={SHOT_GRID}>
                    {shots.map((x) => {
                      const e = project.shots[x.shot_id] || {};
                      const asClip = e.keyframe && (e.clip || pending.has(`clip:${x.shot_id}`));
                      const label = `${x.shot_id} · ${x.camera_move.replace(/_/g, ' ')}`;
                      return asClip ? (
                        <MediaCard key={x.shot_id} id={`clip:${x.shot_id}`} label={label} kind="video" url={e.clip} prompt={clipPrompt(x)}
                          pending={pending.has(`clip:${x.shot_id}`)} disabled={busy || !hasKey || pending.has(`clip:${x.shot_id}`) || pending.has(`kf:${x.shot_id}`)} onOpen={(u, k) => setLightbox({ url: u, kind: k })} onCopyError={fail}
                          onRedo={() => batch('Clip', [x], (i) => `clip:${i.shot_id}`, genClip, 'Generate this clip?')}
                          onRedoKeyframe={e.clip ? () => batch('Keyframe', [x], (i) => `kf:${i.shot_id}`, genKeyframe, 'Regenerate this keyframe? The current clip is discarded and must be animated again (paid).') : undefined} />
                      ) : (
                        <MediaCard key={x.shot_id} id={`kf:${x.shot_id}`} label={label} kind="image" url={e.keyframe} prompt={keyframePrompt(x, sheets, { look: project.look, boost: project.consistencyBoost })}
                          pending={pending.has(`kf:${x.shot_id}`)} disabled={busy || !hasKey || pending.has(`kf:${x.shot_id}`) || pending.has(`clip:${x.shot_id}`)} onOpen={(u, k) => setLightbox({ url: u, kind: k })} onCopyError={fail}
                          onRedo={() => batch('Keyframe', [x], (i) => `kf:${i.shot_id}`, genKeyframe)} />
                      );
                    })}
                  </div>
                </section>

                {clipTodo.length === 0 && (
                  <section>
                    <h2 className={SECTION_LABEL}>Voice and music</h2>
                    <p className="text-xs text-white/40 mt-1">Optional. Upstream generates narration but never mixes it into the video; the "Mix in the narration and music" option in Advanced puts them in the cut.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-4">
                      {[
                        ['Narration', 'narration', project.narration, 'Generate narration', genNarration, 'Generate narration audio?'],
                        ['Music', 'music', project.music, 'Generate music (optional)', genMusic, 'Generate a music track?'],
                      ].map(([title, key, url, genLabel, gen, confirmText]) => (
                        <div key={key} className={`${CARD} p-3 gap-2`}>
                          <div className="text-xs font-semibold text-white">{title}</div>
                          {key === 'narration' && <p className="text-xs text-white/50 line-clamp-3">{narrationText(project.map)}</p>}
                          {url && <audio src={url} controls className="w-full" />}
                          {pending.has(key) && <div className="text-[11px] text-white/40 animate-pulse">Generating…</div>}
                          <div>
                            <button type="button" disabled={busy || !hasKey || pending.has(key)} className={promptControlClassName({ compact: true })}
                              onClick={() => batch(title, [1], () => key, gen, confirmText)}><span className={PROMPT_CONTROL_LABEL_CLASS}>{url ? `Regenerate ${title.toLowerCase()}` : genLabel}</span></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {finalCutCard}

            {history.length > 0 && (
              <section>
                <h2 className={SECTION_LABEL}>History</h2>
                <div className={SHOT_GRID}>
                  {history.map((h) => <MediaCard key={h.id} id={`history:${h.id}`} label={h.prompt || 'Zack D short'} kind="video" url={h.url} prompt={h.prompt} onOpen={(u, k) => setLightbox({ url: u, kind: k })} onCopyError={fail} />)}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[50vh] animate-fade-in-up">
            <div className="flex items-center justify-center gap-1.5 md:gap-3 mb-8 select-none">
              {SAMPLES.map((src, i) => (
                <div key={src} className={`w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden ${['-rotate-[12deg]', '-rotate-[4deg] -ml-3', 'rotate-[4deg] -ml-3', 'rotate-[12deg] -ml-3'][i]}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-center px-4 flex flex-col items-center">
              <span className="text-white font-black uppercase text-xl sm:text-3xl tracking-wide mb-1 opacity-90">Start creating with</span>
              <span className="text-[#22d3ee] font-black uppercase text-2xl sm:text-4xl sm:mt-1 tracking-tight">Zack D Studio</span>
            </h1>
            <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4">
              Ask one curiosity question and turn it into a 9:16 3D animated explainer short. You get a starter script to edit; nothing is generated or charged until you approve it.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-6 px-4">
              {TEMPLATES.map((t) => (
                <button key={t.id} type="button" className={promptControlClassName({ compact: true })} onClick={() => loadTemplate(t)}>
                  <span className={PROMPT_CONTROL_LABEL_CLASS}>{t.kind === 'finished' ? 'Try the demo project' : t.title}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/30 mt-3">{TEMPLATE_ATTRIBUTION}</p>
          </div>
        )}
      </div>

      {/* ── BOTTOM PROMPT BAR ── */}
      <PromptComposer>
        <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
          <TemplateBanner isApplied={!!template} label={template ? `Template loaded: ${template.title}` : ''} onClear={newProject} />
          {progress && <div className="text-xs text-white/60" role="status">{progress}</div>}
          {!hasKey && project.map && <div className="text-xs text-white/40">Add your MuAPI key in Settings to generate media.</div>}
          <div className="flex items-start gap-2.5">
            <PromptTextarea
              id="z-prompt-textarea" data-studio-prompt="" aria-label="Topic" maxLength={200} disabled={busy}
              placeholder="Ask one curiosity question, e.g. What happens when you swallow gum?"
              value={project.topic} onChange={(e) => set({ topic: e.target.value })}
            />
          </div>
          <PromptFooter>
            <PromptControls>
              <div className="relative">
                <button type="button" id="z-look-btn" onClick={toggleDropdown('look')} className={promptControlClassName({ active: openDropdown === 'look' })}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  <span className={PROMPT_CONTROL_LABEL_CLASS}>{lookLabel}</span><PromptChevronIcon />
                </button>
                {openDropdown === 'look' && (
                  <PromptPopover onClick={(e) => e.stopPropagation()}>
                    <PromptPopoverHeader>Look</PromptPopoverHeader>
                    <PromptMenuList>
                      {Object.entries(LOOKS).map(([id, l]) => (
                        <PromptMenuItem key={id} selected={project.look === id} description={id === DEFAULT_LOOK ? 'Exactly upstream' : 'Extra look, not in upstream'}
                          onClick={(e) => { e.stopPropagation(); set({ look: id }); setOpenDropdown(null); }}>{l.label}</PromptMenuItem>
                      ))}
                    </PromptMenuList>
                  </PromptPopover>
                )}
              </div>

              <div className="relative">
                <button type="button" id="z-voice-btn" onClick={toggleDropdown('voice')} className={promptControlClassName({ active: openDropdown === 'voice' })}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" /></svg>
                  <span className={PROMPT_CONTROL_LABEL_CLASS}>{project.voice.replace(/_/g, ' ')}</span><PromptChevronIcon />
                </button>
                {openDropdown === 'voice' && (
                  <PromptPopover onClick={(e) => e.stopPropagation()}>
                    <PromptPopoverHeader>Narration voice</PromptPopoverHeader>
                    <PromptMenuList>
                      {TTS_VOICES.map((v) => (
                        <PromptMenuItem key={v} selected={project.voice === v} description={v === UPSTREAM_VOICE ? 'Upstream default (not verified on MuAPI)' : undefined}
                          onClick={(e) => { e.stopPropagation(); set({ voice: v }); setOpenDropdown(null); }}>{v.replace(/_/g, ' ')}</PromptMenuItem>
                      ))}
                    </PromptMenuList>
                  </PromptPopover>
                )}
              </div>

              <div className={`${promptControlClassName()} cursor-default`} id="z-ar-btn" title="Zack D shorts are always vertical 9:16">
                <PromptAspectRatioIcon /><span className={PROMPT_CONTROL_LABEL_CLASS}>9:16</span>
              </div>

              <div className="relative">
                <button type="button" id="z-templates-btn" onClick={toggleDropdown('templates')} className={promptControlClassName({ active: openDropdown === 'templates' })}>
                  <span className={PROMPT_CONTROL_LABEL_CLASS}>Templates</span><PromptChevronIcon />
                </button>
                {openDropdown === 'templates' && (
                  <PromptPopover onClick={(e) => e.stopPropagation()} className="min-w-[240px]">
                    <PromptPopoverHeader>Templates</PromptPopoverHeader>
                    <PromptMenuList>
                      {TEMPLATES.map((t) => (
                        <PromptMenuItem key={t.id} description={t.kind === 'finished' ? 'Script + keyframes + clips' : 'Script only'}
                          onClick={(e) => { e.stopPropagation(); loadTemplate(t); }}>{t.title}</PromptMenuItem>
                      ))}
                    </PromptMenuList>
                    <PromptPopoverHeader className="mt-3">Ideas</PromptPopoverHeader>
                    <PromptMenuList>
                      {SEED_TOPICS.map((t) => (
                        <PromptMenuItem key={t.topic} description={t.hook}
                          onClick={(e) => { e.stopPropagation(); set({ topic: t.topic }); setOpenDropdown(null); }}>{t.topic}</PromptMenuItem>
                      ))}
                    </PromptMenuList>
                  </PromptPopover>
                )}
              </div>

              <div className="relative">
                <button type="button" id="z-advanced-btn" onClick={toggleDropdown('advanced')} className={promptControlClassName({ active: openDropdown === 'advanced' })}>
                  <span className={PROMPT_CONTROL_LABEL_CLASS}>Advanced</span><PromptChevronIcon />
                </button>
                {openDropdown === 'advanced' && (
                  <PromptPopover onClick={(e) => e.stopPropagation()} className="min-w-[300px]">
                    <PromptPopoverHeader>Final cut and prompts</PromptPopoverHeader>
                    {extraRow('keepClipAudio', 'zackd-keep-clip-audio', "Keep the clips' own sound (Veo audio)", 'Upstream always keeps it')}
                    {extraRow('mixVoice', 'zackd-mix-voice', 'Mix in the narration and music I generated', 'Extra: upstream generates them but never mixes them into the video')}
                    {extraRow('trimToPlanned', 'zackd-trim-planned', 'Trim each clip to its planned 2-4 s shot length', 'Extra: upstream uses each clip at its full length')}
                    {extraRow('consistencyBoost', 'zackd-boost', 'Add character descriptions to the image prompts', 'Extra: upstream only names the character sheets')}
                  </PromptPopover>
                )}
              </div>
            </PromptControls>

            <PromptAction onClick={onAction} disabled={busy || pending.size > 0 || !!next.disabled || (needsKey && !hasKey)} data-step={next.id} title={needsKey && !hasKey ? 'Add your MuAPI key in Settings to generate media' : undefined}>
              {busy ? (<><span className="animate-spin inline-block text-black">◌</span> Working</>) : <span>{next.label}</span>}
            </PromptAction>
          </PromptFooter>
        </div>
      </PromptComposer>

      <Lightbox media={lightbox} onClose={() => setLightbox(null)} />
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} toastOptions={{ duration: 5000, style: { background: '#18181b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '13px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', maxWidth: '440px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: '12px 16px' } }} />
    </div>
  );
}

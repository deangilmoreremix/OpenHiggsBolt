'use client';

// SmartVideo GO — Zack D studio: one topic -> curiosity-loop script -> 3D character sheets ->
// keyframes -> Veo motion clips -> narration + music -> final 9:16 short (rendered in the browser).
// Adapted from https://github.com/Anil-matcha/zack-d-films-ai-video-generator (MIT, see NOTICE.md).
// Same shape as the other app-style studios (Storyboard): `{ apiKey, templateData }` from StandaloneShell.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clapperboard, Loader2, AlertCircle, Download, Share2 } from 'lucide-react';
import { PublishStep, useSocialPublish } from '@/components/SocialPublishProvider';
import { panels, buttons, semantic, iconBadge, optionStyle, tabStyle } from '@/shared/styles/designTokens';
import { scopedPersistKey } from 'studio/src/persistKey.js';
import * as muapi from 'studio/src/muapi.js';
import { createJobs, pool } from './jobs.js';
import {
  SEED_TOPICS, LOOKS, DEFAULT_LOOK, TTS_VOICES, DEFAULT_VOICE, DEFAULT_TTS_SPEED,
  CAPTION_LANGUAGES, CAPTION_THEMES, DEFAULT_CAPTION_LANGUAGE, DEFAULT_CAPTION_THEME,
  starterBeatMap, characterSheetPrompt, keyframePrompt, clipPrompt, narrationText, allShots, totalDuration,
} from './zackdPrompts.js';
import { buildSrt } from './finalCutPlan.js';
import { TEMPLATES, TEMPLATE_ATTRIBUTION, templateToProject } from './templates.js';

const STORE_KEY = 'zackd_project_v1';
const CONCURRENCY = 3;
const STAGES = [
  ['topic', 'Topic'], ['script', 'Script'], ['visuals', 'Characters & keyframes'],
  ['clips', 'Motion clips'], ['audio', 'Voice & music'], ['final', 'Final cut'],
];

const blank = () => ({ stage: 'topic', topic: '', map: null, look: DEFAULT_LOOK, sheets: {}, shots: {}, voice: DEFAULT_VOICE, narration: null, music: null, captionLang: DEFAULT_CAPTION_LANGUAGE, captionTheme: DEFAULT_CAPTION_THEME, keepClipAudio: true });

const labelStyle = { color: semantic.textLabel };
const inputStyle = { ...panels.card, color: 'white' };
const BTN = 'px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_MAIN = 'px-5 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed';

function Section({ title, hint, children }) {
  return (
    <section className="rounded-xl p-6 space-y-4" style={panels.glass}>
      {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
      {hint && <p className="text-xs" style={{ color: semantic.textSecondary }}>{hint}</p>}
      {children}
    </section>
  );
}

function MediaCard({ label, children, action }) {
  return (
    <div className="rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-colors p-3 space-y-2">
      <div className="text-xs" style={{ color: semantic.textMuted }}>{label}</div>
      {children}
      {action}
    </div>
  );
}

// Publishing needs a hosted URL, but the final cut only exists as an in-browser blob: upload it first.
function PostFinalToSocial({ apiKey, final, busy, setError, className, style }) {
  const { openPublish } = useSocialPublish();
  const [uploading, setUploading] = React.useState(false);
  // The cut this button currently belongs to: an upload that finishes for an older cut (re-render, new project,
  // template, unmount) must not open the publish modal with a video that is no longer on screen.
  const current = React.useRef(final);
  current.current = final;
  React.useEffect(() => () => { current.current = null; }, []);
  // Instagram only takes MP4/MOV; the in-browser renderer falls back to WebM on some browsers.
  const unsupported = final && final.ext && final.ext !== 'mp4';
  async function go() {
    const started = final;
    if (uploading || !started?.blob || unsupported) return;
    setUploading(true); setError('');
    try {
      const file = new File([started.blob], `zackd-short.${started.ext || 'mp4'}`, { type: started.blob.type || 'video/mp4' });
      const url = await muapi.uploadFile(apiKey, file);
      if (current.current !== started) return;
      openPublish({ mediaUrl: url, mediaType: 'video', title: started.topic ? String(started.topic).slice(0, 50) : 'Zack D short' });
    } catch (e) { if (current.current === started) setError(e?.message || 'Could not upload the video for publishing.'); }
    setUploading(false);
  }
  return (
    <button
      className={className} style={style} disabled={busy || uploading || !apiKey || unsupported} onClick={go}
      title={unsupported ? 'This cut was rendered as WebM, which Instagram and TikTok reject. Re-render in a browser that can make MP4 (Chrome or Edge) to post it.' : undefined}
    >
      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />} {uploading ? 'Uploading…' : unsupported ? 'Post (needs MP4)' : 'Post to social'}
    </button>
  );
}

export default function ZackD({ apiKey, templateData }) {
  const storeKey = useMemo(() => scopedPersistKey(STORE_KEY, apiKey), [apiKey]);
  const seedPrompt = templateData?.prompt || '';
  const [project, setProject] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [captioned, setCaptioned] = useState(null); // { url } — burned-in captions result (remote URL, not persisted)
  const [final, setFinal] = useState(null); // { url, blob, ext, warning, saved } — not persisted (blob URLs die with the page)
  const proj = useRef(project);
  proj.current = project;
  const abort = useRef(null);
  const jobs = useMemo(() => createJobs(muapi, apiKey), [apiKey]);

  // Load the saved project for this identity, and seed the topic from a template hand-off.
  useEffect(() => {
    let loaded = blank();
    try { loaded = { ...blank(), ...JSON.parse(localStorage.getItem(storeKey) || '{}') }; } catch { /* corrupt or unavailable storage: start fresh */ }
    if (!loaded.topic && seedPrompt) loaded.topic = String(seedPrompt).slice(0, 200);
    setProject(loaded);
  }, [storeKey, seedPrompt]);

  useEffect(() => {
    try { localStorage.setItem(storeKey, JSON.stringify(project)); } catch { /* quota/private mode: keep working in memory */ }
  }, [project, storeKey]);

  useEffect(() => () => { abort.current?.abort(); }, []);
  useEffect(() => () => { if (final?.url) URL.revokeObjectURL(final.url); }, [final]);

  const set = useCallback((patch) => setProject((p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) })), []);
  const go = (stage) => set({ stage });
  const sheets = project.map?.character_sheets || [];
  const shots = project.map ? allShots(project.map) : [];
  const hasKey = !!apiKey;

  // Run a batch of media jobs with a busy lock, progress text and a cost confirmation.
  async function batch(label, items, fn, confirmText) {
    if (busy || !items.length) return;
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true); setError('');
    let done = 0;
    setProgress(`${label}: 0/${items.length}`);
    const results = await pool(items, CONCURRENCY, async (item) => {
      try { return await fn(item); } finally { done += 1; setProgress(`${label}: ${done}/${items.length}`); }
    });
    const failed = results.filter((r) => !r.ok);
    if (failed.length) setError(`${failed.length} of ${items.length} failed: ${failed[0].error?.message || 'error'}. Use Redo to retry them.`);
    setBusy(false); setProgress('');
  }

  const genSheet = async (sh) => {
    const { url } = await jobs.image({ prompt: characterSheetPrompt(sh, { look: proj.current.look }), aspect: '16:9' });
    set((p) => ({ sheets: { ...p.sheets, [sh.id]: { url } } }));
  };
  const genKeyframe = async (shot) => {
    const { url } = await jobs.image({ prompt: keyframePrompt(shot, sheets, { look: proj.current.look }), aspect: '9:16' });
    set((p) => ({ shots: { ...p.shots, [shot.shot_id]: { keyframe: url, clip: null } } }));
  };
  const genClip = async (shot) => {
    const kf = proj.current.shots[shot.shot_id]?.keyframe;
    if (!kf) throw new Error('Generate the keyframe first.');
    const { url } = await jobs.clip({ imageUrl: kf, prompt: clipPrompt(shot) });
    set((p) => ({ shots: { ...p.shots, [shot.shot_id]: { ...p.shots[shot.shot_id], clip: url } } }));
  };
  const genNarration = async () => {
    const { url } = await jobs.narration({ text: narrationText(proj.current.map), voice: proj.current.voice, speed: DEFAULT_TTS_SPEED });
    set({ narration: url });
  };
  const genMusic = async () => {
    const { url } = await jobs.music({ prompt: `Underscore for a short about: ${proj.current.topic}`, duration: Math.ceil(totalDuration(proj.current.map)) + 5 });
    set({ music: url });
  };

  async function assemble() {
    if (busy) return;
    const missing = shots.filter((s) => !project.shots[s.shot_id]?.clip);
    if (missing.length) { setError(`${missing.length} shot(s) have no clip yet.`); return; }
    setCaptioned(null); // a captioned copy belongs to the previous cut
    setBusy(true); setError(''); setProgress('Rendering 0%');
    abort.current = new AbortController();
    try {
      const { renderFinalCut } = await import('./finalCut.js'); // loads the renderer only when needed
      const out = await renderFinalCut({
        shots: shots.map((s) => ({ src: project.shots[s.shot_id].clip, duration: s.duration_sec, zoom: s.zoom_impact })),
        narrationUrl: project.narration, musicUrl: project.music, keepClipAudio: project.keepClipAudio !== false, signal: abort.current.signal,
        onProgress: (p) => setProgress(`Rendering ${Math.round(p * 100)}%`),
      });
      if (out.ok) setCaptioned(null);
      if (out.ok) setFinal({ url: URL.createObjectURL(out.blob), blob: out.blob, ext: out.extension, warning: out.warning, topic: proj.current.topic });
      else if (out.reason !== 'cancelled') setError(out.error);
    } catch (e) { setError(e?.message || 'The final cut failed.'); }
    setBusy(false); setProgress('');
  }

  // Opt-in, paid: upload the rendered cut to MuAPI, then burn animated captions in with ai-captions (Vadoo).
  async function burnCaptions() {
    if (busy || !final?.blob) return;
    if (!project.narration) { setError('Captions are generated from the spoken audio. Add narration first.'); return; }
    if (!window.confirm('Burn captions into the video with MuAPI AI Captions? About $0.20 minimum ($0.005 per second), and it takes a few minutes.')) return;
    setBusy(true); setError(''); setProgress('Uploading the video…');
    try {
      const file = new File([final.blob], `zackd-cut.${final.ext || 'mp4'}`, { type: final.blob.type || 'video/mp4' });
      const videoUrl = await muapi.uploadFile(apiKey, file);
      setProgress('Burning captions (2-3 minutes)…');
      const { url } = await jobs.captions({ videoUrl, language: project.captionLang, theme: project.captionTheme });
      setCaptioned({ url, topic: final.topic });
    } catch (e) { setError(e?.message || 'Burning captions failed.'); }
    setBusy(false); setProgress('');
  }

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // Load an upstream template. Never calls a paid API; a finished demo also brings its keyframes and clips.
  const useTemplate = (t) => {
    if (busy) return;
    if (project.map && !window.confirm('Replace the current project with this template?')) return;
    setProject({ ...blank(), ...templateToProject(t, window.location.origin), look: project.look, voice: project.voice });
    setFinal(null); setCaptioned(null); setError('');
  };

  const writeScript = () => {
    if (!project.topic.trim()) return;
    set({ map: starterBeatMap(project.topic), sheets: {}, shots: {}, narration: null, stage: 'script' });
    setFinal(null); setCaptioned(null); setError('');
  };

  // ── views ────────────────────────────────────────────────────────────────────
  const StepButtons = ({ back, next, nextLabel, nextDisabled }) => (
    <div className="flex gap-2">
      {back && <button className={BTN} style={buttons.ghost} onClick={() => go(back)}>Back</button>}
      <button className={BTN_MAIN} style={buttons.primary} disabled={busy || nextDisabled} onClick={() => go(next)}>{nextLabel}</button>
    </div>
  );

  const viewTopic = (
    <>
      <Section title="Topic" hint="One curiosity-driven question. You get a starter beat map to edit — nothing is generated (or charged) until you approve it.">
        <label className="block text-xs font-medium mb-1" style={labelStyle} htmlFor="zackd-topic">TOPIC</label>
        <input id="zackd-topic" className="w-full rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/45" style={inputStyle} maxLength={200}
          placeholder="e.g. What happens when you swallow gum?" value={project.topic} onChange={(e) => set({ topic: e.target.value })} />
        <div className="flex gap-2 flex-wrap">
          <button className={BTN_MAIN} style={buttons.primary} disabled={!project.topic.trim()} onClick={writeScript}>{project.map ? 'Rewrite starter script' : 'Write starter script'}</button>
          {project.map && <button className={BTN} style={buttons.ghost} onClick={() => go('script')}>Continue current project</button>}
        </div>
      </Section>
      <Section title="Templates" hint={TEMPLATE_ATTRIBUTION}>
        <div className="grid gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-colors p-3 space-y-2 flex flex-col">
              {t.demo && <video src={t.demo} poster={t.poster} controls preload="none" playsInline className="w-full rounded-md bg-black" style={{ aspectRatio: '9 / 16', maxHeight: 320 }} />}
              {!t.demo && t.beats?.[0]?.narration && (
                <blockquote className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-xs italic" style={{ color: semantic.textSecondary }}>
                  “{t.beats[0].narration}”
                  <span className="block mt-1 not-italic" style={{ color: semantic.textMuted }}>{t.beats.length} beat{t.beats.length === 1 ? '' : 's'} · no media, you generate the keyframes and clips</span>
                </blockquote>
              )}
              <div className="text-sm font-medium text-white">{t.title}</div>
              <p className="text-xs flex-1" style={{ color: semantic.textSecondary }}>{t.description}</p>
              <button className={t.kind === 'finished' ? BTN_MAIN : BTN} style={t.kind === 'finished' ? buttons.primary : buttons.ghost} disabled={busy} onClick={() => useTemplate(t)}>
                {t.kind === 'finished' ? 'Use as template' : 'Use script'}
              </button>
            </div>
          ))}
        </div>
      </Section>
      <div className="grid gap-3 sm:grid-cols-2">
        {SEED_TOPICS.map((t) => (
          <button key={t.topic} className="text-left rounded-lg p-3 border border-white/10 bg-[#0a0a0a] hover:border-primary/50 transition-colors" onClick={() => set({ topic: t.topic })}>
            <div className="text-sm font-medium text-white">{t.topic}</div>
            <div className="text-xs mt-1" style={{ color: semantic.textSecondary }}>{t.hook}</div>
          </button>
        ))}
      </div>
    </>
  );

  const viewScript = project.map && (
    <>
      <Section title="Script" hint={`Gate 1: ${project.map.beats.length} beats, ${shots.length} shots, about ${Math.round(totalDuration(project.map))}s. Edit anything, then approve.`}>
        {project.map.beats.map((b, bi) => (
          <div key={b.beat_id} className="rounded-lg p-3 space-y-2" style={panels.card}>
            <div className="text-xs" style={{ color: semantic.textMuted }}>Beat {bi + 1}{b.hook ? ' · Hook' : ''} · {b.title_en}</div>
            <textarea className="w-full rounded-lg px-2 py-1 text-sm outline-none focus:border-primary/45" style={{ ...inputStyle, background: 'rgba(255,255,255,0.05)' }} rows={2} maxLength={400}
              aria-label={`Narration, beat ${bi + 1}`} value={b.narration}
              onChange={(e) => set((p) => ({ map: { ...p.map, beats: p.map.beats.map((x) => (x.beat_id === b.beat_id ? { ...x, narration: e.target.value } : x)) } }))} />
            {b.shots.map((sh) => (
              <div key={sh.shot_id} className="flex gap-2 items-start">
                <span className="text-xs w-24 shrink-0 pt-1" style={{ color: semantic.textMuted }}>{sh.shot_id} · {sh.duration_sec}s{sh.zoom_impact ? ' · zoom' : ''}</span>
                <textarea className="flex-1 rounded-lg px-2 py-1 text-xs outline-none focus:border-primary/45" style={{ ...inputStyle, background: 'rgba(255,255,255,0.05)' }} rows={2} maxLength={400}
                  aria-label={`Scene, ${sh.shot_id}`} value={sh.scene_description}
                  onChange={(e) => set((p) => ({ map: { ...p.map, beats: p.map.beats.map((x) => ({ ...x, shots: x.shots.map((y) => (y.shot_id === sh.shot_id ? { ...y, scene_description: e.target.value } : y)) })) } }))} />
              </div>
            ))}
          </div>
        ))}
      </Section>
      <StepButtons back="topic" next="visuals" nextLabel="Approve script" />
    </>
  );

  const todoSheets = sheets.filter((s) => !project.sheets[s.id]);
  const todoKeyframes = shots.filter((s) => !project.shots[s.shot_id]?.keyframe);
  const viewVisuals = (
    <>
      <Section title="Look" hint="Gate 2: pick the look, render character sheets (the consistency anchors), then keyframes. Each image is a paid call on your MuAPI key.">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(LOOKS).map(([id, l]) => (
            <button key={id} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={optionStyle(project.look === id)} aria-pressed={project.look === id} onClick={() => set({ look: id })}>{l.label}</button>
          ))}
        </div>
      </Section>
      <Section title="Character sheets">
        <button className={BTN_MAIN} style={buttons.primary} disabled={busy || !hasKey}
          onClick={() => batch('Character sheets', todoSheets.length ? todoSheets : sheets, genSheet, `Generate ${todoSheets.length || sheets.length} character sheet image(s)?`)}>
          Generate {todoSheets.length || 'all'} character sheet(s)
        </button>
        <div className="grid gap-3 sm:grid-cols-2">
          {sheets.map((sh) => (
            <MediaCard key={sh.id} label={`${sh.id.replace(/_/g, ' ')} — ${sh.description}`}
              action={<button className={`${BTN} w-full`} style={buttons.ghost} disabled={busy || !hasKey} onClick={() => batch('Character sheet', [sh], genSheet)}>{project.sheets[sh.id] ? 'Redo' : 'Generate'}</button>}>
              {project.sheets[sh.id]?.url && <img src={project.sheets[sh.id].url} alt="" className="w-full rounded-md" />}
            </MediaCard>
          ))}
        </div>
      </Section>
      <Section title="Keyframes">
        <button className={BTN_MAIN} style={buttons.primary} disabled={busy || !hasKey}
          onClick={() => batch('Keyframes', todoKeyframes.length ? todoKeyframes : shots, genKeyframe, `Generate ${todoKeyframes.length || shots.length} keyframe image(s)?`)}>
          Generate {todoKeyframes.length || 'all'} keyframe(s)
        </button>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {shots.map((sh) => (
            <MediaCard key={sh.shot_id} label={sh.shot_id}
              action={<button className={`${BTN} w-full`} style={buttons.ghost} disabled={busy || !hasKey} onClick={() => batch('Keyframe', [sh], genKeyframe)}>{project.shots[sh.shot_id]?.keyframe ? 'Redo' : 'Generate'}</button>}>
              {project.shots[sh.shot_id]?.keyframe && <img src={project.shots[sh.shot_id].keyframe} alt="" className="w-full rounded-md" />}
            </MediaCard>
          ))}
        </div>
      </Section>
      <StepButtons back="script" next="clips" nextLabel="Approve keyframes" nextDisabled={todoKeyframes.length > 0} />
    </>
  );

  const todoClips = shots.filter((s) => !project.shots[s.shot_id]?.clip);
  const viewClips = (
    <>
      <Section title="Motion clips" hint="Animate each keyframe with Veo 3.1 (fast, with the standard model as fallback). Clips take a few minutes each and are the most expensive step.">
        <button className={BTN_MAIN} style={buttons.primary} disabled={busy || !hasKey || todoKeyframes.length > 0}
          onClick={() => batch('Clips', todoClips.length ? todoClips : shots, genClip, `Generate ${todoClips.length || shots.length} video clip(s) with Veo 3.1? This is the most expensive step.`)}>
          Generate {todoClips.length || 'all'} clip(s)
        </button>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {shots.map((sh) => {
            const e = project.shots[sh.shot_id];
            return (
              <MediaCard key={sh.shot_id} label={`${sh.shot_id} · ${sh.camera_move.replace(/_/g, ' ')}`}
                action={<button className={`${BTN} w-full`} style={buttons.ghost} disabled={busy || !hasKey || !e?.keyframe} onClick={() => batch('Clip', [sh], genClip, 'Generate this clip?')}>{e?.clip ? 'Redo' : 'Generate'}</button>}>
                {e?.clip ? <video src={e.clip} controls muted loop playsInline preload="metadata" className="w-full rounded-md" />
                  : e?.keyframe && <img src={e.keyframe} alt="" className="w-full rounded-md opacity-60" />}
              </MediaCard>
            );
          })}
        </div>
      </Section>
      <StepButtons back="visuals" next="audio" nextLabel="Continue to audio" nextDisabled={todoClips.length > 0} />
    </>
  );

  const viewAudio = (
    <>
      <Section title="Narration" hint="Preset MiniMax voices; cloning from a voice sample is not supported yet.">
        <p className="text-xs" style={{ color: semantic.textSecondary }}>{project.map && narrationText(project.map)}</p>
        <div className="flex gap-2 items-center flex-wrap">
          <select aria-label="Voice" className="rounded-lg px-2 py-1.5 text-sm outline-none" style={inputStyle} value={project.voice} onChange={(e) => set({ voice: e.target.value })}>
            {TTS_VOICES.map((v) => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
          </select>
          <button className={BTN_MAIN} style={buttons.primary} disabled={busy || !hasKey} onClick={() => batch('Narration', [1], genNarration, 'Generate narration audio?')}>{project.narration ? 'Regenerate narration' : 'Generate narration'}</button>
        </div>
        {project.narration && <audio src={project.narration} controls className="w-full" />}
      </Section>
      <Section title="Background music (optional)">
        <button className={BTN} style={buttons.ghost} disabled={busy || !hasKey} onClick={() => batch('Music', [1], genMusic, 'Generate a music track?')}>{project.music ? 'Regenerate music' : 'Generate music'}</button>
        {project.music && <audio src={project.music} controls className="w-full" />}
      </Section>
      <StepButtons back="clips" next="final" nextLabel="Continue to final cut" />
    </>
  );

  const viewFinal = (
    <>
      <Section title="Final cut" hint="Rendered in your browser: transitions between shots, impact zooms, narration with music ducked underneath. It can take a minute or two.">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: semantic.textSecondary }}>
          <input type="checkbox" id="zackd-keep-clip-audio" checked={project.keepClipAudio !== false} onChange={(e) => set({ keepClipAudio: e.target.checked })} />
          <span>Keep the clips' own sound (Veo audio), quieter under narration</span>
        </label>
        {!project.narration && <p className="text-xs" style={{ color: semantic.textMuted }}>{project.keepClipAudio === false ? 'No narration and clip sound is off, so the video will be silent.' : "No narration yet. The cut will use the clips' own sound."}</p>}
        <div className="flex gap-2 flex-wrap">
          <button className={BTN_MAIN} style={buttons.primary} disabled={busy} onClick={assemble}>{final ? 'Re-render' : 'Render video'}</button>
          {busy && abort.current && <button className={BTN} style={buttons.ghost} onClick={() => abort.current?.abort()}>Cancel</button>}
        </div>
        {final && (
          <>
            <video src={final.url} controls className="rounded-lg bg-black" style={{ maxHeight: '70vh', aspectRatio: '9 / 16' }} />
            {final.warning && <p className="text-xs" style={{ color: semantic.textSecondary }}>{final.warning}</p>}
            <div className="flex gap-2 flex-wrap">
              <button className={`${BTN} flex items-center gap-2`} style={buttons.ghost} onClick={() => download(final.blob, `zackd-short.${final.ext}`)}><Download size={14} /> Download video</button>
              <PostFinalToSocial apiKey={apiKey} final={final} busy={busy} setError={setError} className={`${BTN} flex items-center gap-2`} style={buttons.ghost} />
              <button className={`${BTN} flex items-center gap-2`} style={buttons.ghost} onClick={() => download(new Blob([buildSrt(project.map.beats)], { type: 'text/plain' }), 'zackd-short.srt')}><Download size={14} /> Captions (.srt)</button>
            </div>
            <p className="text-xs" style={{ color: semantic.textMuted }}>The .srt is a free, separate caption file. To burn animated captions into the video, use the option below.</p>
            <div className="rounded-xl p-4 space-y-3" style={panels.card}>
              <h3 className="text-sm font-semibold text-white">Burn captions into the video</h3>
              <p className="text-xs" style={{ color: semantic.textSecondary }}>Animated, word-by-word captions in a viral style. Paid: about $0.20 minimum ($0.005 per second), 2-3 minutes. Needs narration.</p>
              <div className="flex gap-2 items-center flex-wrap">
                <select aria-label="Caption language" className="rounded-lg px-2 py-1.5 text-sm outline-none" style={inputStyle} value={project.captionLang} onChange={(e) => set({ captionLang: e.target.value })}>
                  {CAPTION_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex gap-2 flex-wrap" role="group" aria-label="Caption theme">
                {CAPTION_THEMES.map((t) => (
                  <button key={t.value} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={optionStyle(project.captionTheme === t.value)} aria-pressed={project.captionTheme === t.value} onClick={() => set({ captionTheme: t.value })}>{t.label}</button>
                ))}
              </div>
              <button className={BTN_MAIN} style={buttons.primary} disabled={busy || !hasKey || !project.narration} onClick={burnCaptions}>{captioned ? 'Burn again' : 'Burn captions'}</button>
              {!project.narration && <p className="text-xs" style={{ color: semantic.textMuted }}>Generate narration first: captions are transcribed from the spoken audio.</p>}
              {captioned && (
                <>
                  <video src={captioned.url} controls className="rounded-lg bg-black" style={{ maxHeight: '70vh', aspectRatio: '9 / 16' }} />
                  <a className={`${BTN} inline-flex items-center gap-2`} style={buttons.ghost} href={captioned.url} target="_blank" rel="noopener noreferrer"><Download size={14} /> Open / download captioned video</a>
                  <PublishStep mediaUrl={captioned.url} mediaType="video" title={captioned.topic ? String(captioned.topic).slice(0, 50) : 'Zack D short'} />
                </>
              )}
            </div>
          </>
        )}
      </Section>
      <div className="flex gap-2">
        <button className={BTN} style={buttons.ghost} onClick={() => go('audio')}>Back</button>
        <button className={BTN} style={buttons.ghost} onClick={() => { if (window.confirm('Start a new project? The current one will be cleared from this browser.')) { setProject(blank()); setFinal(null); setCaptioned(null); } }}>New project</button>
      </div>
    </>
  );

  const VIEWS = { topic: viewTopic, script: viewScript, visuals: viewVisuals, clips: viewClips, audio: viewAudio, final: viewFinal };
  const stage = project.map || project.stage === 'topic' ? project.stage : 'topic';

  return (
    <div className="h-full flex flex-col overflow-hidden text-white">
      <div className="flex-shrink-0 h-12 flex items-center gap-3 px-6 z-10" style={panels.subHeader}>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={iconBadge}><Clapperboard size={15} /></span>
        <h1 className="text-sm font-semibold">Zack D Studio</h1>
        {project.topic && <span className="text-xs truncate" style={{ color: semantic.textMuted }}>— {project.topic}</span>}
        {busy && <span className="ml-auto flex items-center gap-2 text-xs" style={{ color: semantic.textSecondary }} role="status"><Loader2 size={14} className="animate-spin" />{progress}</span>}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
          <nav className="flex gap-2 flex-wrap" aria-label="Steps">
            {STAGES.map(([id, label], i) => (
              <button key={id} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40" style={id === stage ? buttons.activePill : tabStyle(false)}
                aria-current={id === stage ? 'step' : undefined} disabled={busy || (id !== 'topic' && !project.map)} onClick={() => go(id)}>{i + 1}. {label}</button>
            ))}
          </nav>
          {!hasKey && <div className="rounded-xl p-3 flex items-center gap-2 text-sm" style={{ ...panels.glass, color: semantic.textSecondary }}><AlertCircle size={14} /> Add your MuAPI key in Settings to generate media.</div>}
          {error && <div role="alert" className="rounded-xl p-4 flex items-start gap-2 text-sm border border-red-500/40 text-red-300" style={panels.glass}><AlertCircle size={14} className="mt-0.5 flex-shrink-0" />{error}</div>}
          {VIEWS[stage]}
        </div>
      </div>
    </div>
  );
}

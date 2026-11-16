'use client';

// Media Hub — download video/audio from 1000+ sites (yt-dlp), transcribe with speaker labels,
// then summarize / translate / chat with the transcript. Backend: /api/media-hub (lib/mediaHub/core.mjs).
// Themed with the app's cyan primary (#22d3ee) on near-black.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const API = '/api/media-hub';
const SETTINGS_KEY = 'mediaHub.settings.v1';
const ACTIVE = ['queued', 'downloading', 'processing'];
const QUALITIES = [['best', 'Best'], ['2160', '4K'], ['1440', '1440p'], ['1080', '1080p'], ['720', '720p'], ['480', '480p'], ['360', '360p']];
const AI_ACTIONS = [['summarize', 'Summarize'], ['keypoints', 'Key points'], ['chapters', 'Chapters'], ['faq', 'FAQ'], ['mindmap', 'Mind map'], ['cleanup', 'Clean up']];
const STATUS_LABEL = { queued: 'Queued', downloading: 'Downloading', processing: 'Processing', completed: 'Ready', failed: 'Failed', paused: 'Paused', canceled: 'Canceled' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtBytes = (n) => (n == null ? '' : n > 1e9 ? `${(n / 1e9).toFixed(2)} GB` : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
const fmtClock = (s) => { s = Math.max(0, Math.floor(s || 0)); const m = Math.floor(s / 60); return `${m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : m}:${String(s % 60).padStart(2, '0')}`; };
const parseClock = (t) => t.split(':').map(Number).reduce((a, n) => a * 60 + n, 0);

// Escape-first minimal markdown → HTML (headings, bold, bullets, [mm:ss] seek links).
function md(text) {
  const out = []; let list = false;
  for (const raw of String(text || '').split('\n')) {
    const l = esc(raw)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[((?:\d+:)?\d{1,2}:\d{2})\]/g, '<a href="#" data-seek="$1" class="mh-ts">[$1]</a>');
    const b = /^\s*(?:[-*•]|\d+\.)\s+(.*)/.exec(l);
    if (b) { if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${b[1]}</li>`); continue; }
    if (list) { out.push('</ul>'); list = false; }
    const hd = /^#{1,4}\s+(.*)/.exec(l);
    out.push(hd ? `<h4>${hd[1]}</h4>` : l.trim() ? `<p>${l}</p>` : '');
  }
  if (list) out.push('</ul>');
  return out.join('');
}

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

const loadSettings = () => {
  try { return { kind: 'openai', baseUrl: '', model: '', apiKey: '', language: '', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch { return { kind: 'openai', baseUrl: '', model: '', apiKey: '', language: '' }; }
};
const providerOf = (s) => ({ kind: s.kind, baseUrl: s.baseUrl || undefined, model: s.model || undefined, apiKey: s.apiKey || undefined });

const CSS = `
.mh{--c:#22d3ee;--c-hover:#06b6d4;--on:#000;--soft:rgba(34,211,238,.12);--line:rgba(255,255,255,.08);--card:#111;--bg:#030303;color:#fff;background:var(--bg);height:100%;overflow-y:auto;font-family:Inter,system-ui,sans-serif}
.mh *{box-sizing:border-box}
.mh .card{background:var(--card);border:1px solid var(--line);border-radius:14px}
.mh .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:600;border:1px solid var(--line);background:transparent;color:#e4e4e7;cursor:pointer;transition:.15s;text-decoration:none}
.mh .btn:hover:not(:disabled){border-color:var(--c);color:var(--c)}.mh .btn:disabled{opacity:.45;cursor:not-allowed}
.mh .btn-primary{background:var(--c);color:var(--on);border-color:var(--c)}.mh .btn-primary:hover:not(:disabled){background:var(--c-hover);color:#000;border-color:var(--c-hover)}
.mh .btn-sm{padding:4px 9px;font-size:12px;border-radius:8px}
.mh input,.mh select,.mh textarea{background:#050505;border:1px solid var(--line);border-radius:10px;color:#fff;padding:8px 10px;font-size:13px;width:100%;outline:none;font-family:inherit}
.mh input[type=checkbox]{width:auto}
.mh input:focus,.mh select:focus,.mh textarea:focus{border-color:var(--c);box-shadow:0 0 0 3px var(--soft)}
.mh .lbl{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#a1a1aa;margin-bottom:4px}
.mh .pill{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;border:1px solid var(--line);color:#a1a1aa;white-space:nowrap}
.mh .pill.ok{color:var(--c);border-color:var(--c);background:var(--soft)}.mh .pill.bad{color:#f87171;border-color:#f87171}
.mh .bar{height:4px;background:#27272a;border-radius:99px;overflow:hidden;margin-top:8px}.mh .bar>i{display:block;height:100%;background:var(--c);transition:width .4s}
.mh .tab{padding:8px 14px;font-size:13px;font-weight:600;color:#a1a1aa;border:0;border-bottom:2px solid transparent;background:none;cursor:pointer}.mh .tab.on{color:var(--c);border-bottom-color:var(--c)}
.mh .job{padding:10px;border-radius:12px;border:1px solid transparent;cursor:pointer}.mh .job:hover{background:rgba(255,255,255,.03)}.mh .job.sel{border-color:var(--c);background:var(--soft)}
.mh .seg{display:flex;gap:10px;padding:7px 8px;border-radius:8px;cursor:pointer;font-size:14px;line-height:1.5}.mh .seg:hover{background:rgba(255,255,255,.04)}
.mh .seg.now{background:var(--soft);box-shadow:inset 2px 0 var(--c)}.mh .seg .t{color:#71717a;font-variant-numeric:tabular-nums;flex:none;width:46px;font-size:12px;padding-top:2px}
.mh .spk{font-weight:700;color:var(--c)}
.mh .out{font-size:14px;line-height:1.6;color:#e4e4e7}.mh .out ul{margin:6px 0 6px 18px;list-style:disc}.mh .out h4{margin:12px 0 4px;font-weight:700;color:#fff}.mh .out p{margin:4px 0}
.mh .out code{background:#27272a;padding:0 4px;border-radius:4px}.mh .mh-ts{color:var(--c);font-weight:600;text-decoration:none}
.mh .bubble{max-width:85%;padding:8px 12px;border-radius:12px;font-size:14px}.mh .bubble.me{align-self:flex-end;background:var(--c);color:#000}
.mh .bubble.ai{align-self:flex-start;background:#18181b;border:1px solid var(--line)}
.mh .grid2{display:grid;gap:20px;padding:16px 24px 32px;grid-template-columns:minmax(300px,420px) minmax(0,1fr);align-items:start}
@media(max-width:900px){.mh .grid2{grid-template-columns:1fr;padding:12px}}
.mh .toast{position:fixed;bottom:20px;right:20px;z-index:60;padding:10px 16px;border-radius:12px;background:#0a0a0a;border:1px solid var(--c);color:#fff;font-size:13px;box-shadow:0 0 24px rgba(34,211,238,.25)}
.mh .toast.err{border-color:#f87171}
`;

function Settings({ settings, onSave, onClose }) {
  const [s, setS] = useState(settings);
  const set = (k) => (e) => setS((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: 'min(520px,100%)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: '#0a0a0a' }} role="dialog" aria-label="AI provider settings">
        <h3 style={{ fontWeight: 700, fontSize: 18 }}>AI provider</h3>
        <p style={{ fontSize: 12, color: '#a1a1aa' }}>Used for transcription (OpenAI-compatible only), summaries, translation and chat. Your key stays in this browser and is sent only with your own requests.</p>
        <div><label className="lbl">Provider</label><select value={s.kind} onChange={set('kind')}><option value="openai">OpenAI-compatible (OpenAI, Groq, DeepSeek, OpenRouter, Ollama, LM Studio…)</option><option value="anthropic">Anthropic</option></select></div>
        <div><label className="lbl">Base URL (optional)</label><input value={s.baseUrl} onChange={set('baseUrl')} placeholder="Default (provider)" /></div>
        <div><label className="lbl">Model (optional)</label><input value={s.model} onChange={set('model')} placeholder={s.kind === 'anthropic' ? 'claude-sonnet-5-5' : 'gpt-4o-mini'} /></div>
        <div><label className="lbl">API key</label><input type="password" value={s.apiKey} onChange={set('apiKey')} placeholder="Stored in this browser only" autoComplete="off" /></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave({ ...s, baseUrl: s.baseUrl.trim(), model: s.model.trim(), apiKey: s.apiKey.trim() })}>Save</button></div>
      </div>
    </div>
  );
}

function AddForm({ onAdded, notify }) {
  const [urls, setUrls] = useState('');
  const [o, setO] = useState({ mode: 'video', quality: 'best', container: 'auto', audioFormat: 'mp3', subtitles: false, playlist: false });
  const [busy, setBusy] = useState(false);
  const audio = o.mode === 'audio';
  const submit = async () => {
    const list = urls.split(/\s+/).filter(Boolean);
    if (!list.length) return notify('Paste at least one link', true);
    setBusy(true);
    try {
      const r = await api('/jobs', { method: 'POST', body: { urls: list, options: o } });
      setUrls(''); onAdded(r.jobs); notify(`Queued ${r.jobs.length} download${r.jobs.length > 1 ? 's' : ''}`);
    } catch (e) { notify(e.message, true); } finally { setBusy(false); }
  };
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea rows={3} value={urls} onChange={(e) => setUrls(e.target.value)} spellCheck={false} placeholder="Paste one or more links (YouTube, TikTok, X, Vimeo, SoundCloud, direct files…)" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label className="lbl">Type</label><select value={o.mode} onChange={(e) => setO({ ...o, mode: e.target.value })}><option value="video">Video</option><option value="audio">Audio only</option></select></div>
        {!audio && <div><label className="lbl">Quality</label><select value={o.quality} onChange={(e) => setO({ ...o, quality: e.target.value })}>{QUALITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>}
        <div><label className="lbl">Container / format</label>
          {audio
            ? <select value={o.audioFormat} onChange={(e) => setO({ ...o, audioFormat: e.target.value })}>{['mp3', 'm4a', 'opus', 'wav', 'flac'].map((v) => <option key={v} value={v}>{v.toUpperCase()}</option>)}</select>
            : <select value={o.container} onChange={(e) => setO({ ...o, container: e.target.value })}>{['auto', 'mp4', 'mkv', 'webm'].map((v) => <option key={v} value={v}>{v === 'auto' ? 'Auto (MP4/MKV)' : v.toUpperCase()}</option>)}</select>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#d4d4d8' }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={o.subtitles} onChange={(e) => setO({ ...o, subtitles: e.target.checked })} /> Subtitles</label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={o.playlist} onChange={(e) => setO({ ...o, playlist: e.target.checked })} /> Whole playlist</label>
      </div>
      <button className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={busy} onClick={submit}>Add to queue</button>
    </div>
  );
}

function Queue({ jobs, sel, onSelect, onAction, onRemove }) {
  return (
    <div className="card" style={{ padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 8px' }}><b style={{ fontSize: 14 }}>Library &amp; queue</b><span style={{ fontSize: 12, color: '#71717a' }}>saved on the server</span></div>
      {!jobs.length && <p style={{ fontSize: 14, color: '#71717a', textAlign: 'center', padding: '24px 12px' }}>Nothing here yet — paste a link above.</p>}
      {jobs.map((j) => {
        const act = ACTIVE.includes(j.status);
        const meta = act ? [j.progress ? `${j.progress.toFixed(0)}%` : '', j.speed ? `${fmtBytes(j.speed)}/s` : '', j.eta ? `${j.eta}s left` : ''].filter(Boolean).join(' · ') : j.status === 'failed' ? j.error : [fmtBytes(j.size), j.duration ? fmtClock(j.duration) : ''].filter(Boolean).join(' · ');
        return (
          <div key={j.id} className={`job ${j.id === sel ? 'sel' : ''}`} onClick={() => onSelect(j.id)}>
            <div style={{ display: 'flex', gap: 12 }}>
              {j.thumbnail ? <img src={j.thumbnail} alt="" referrerPolicy="no-referrer" style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 8, flex: 'none', background: '#27272a' }} />
                : <div style={{ width: 72, height: 48, borderRadius: 8, flex: 'none', background: '#27272a', display: 'grid', placeItems: 'center', color: '#71717a' }}>{j.options.mode === 'audio' ? '♪' : '▶'}</div>}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, minWidth: 0 }}>
                  <span className={`pill ${j.status === 'completed' ? 'ok' : j.status === 'failed' ? 'bad' : ''}`}>{STATUS_LABEL[j.status] || j.status}</span>
                  {j.hasTranscript && <span className="pill ok">Transcript</span>}
                  <span style={{ fontSize: 12, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</span>
                </div>
              </div>
            </div>
            {act && <div className="bar"><i style={{ width: `${j.progress || 3}%` }} /></div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
              {act && j.status !== 'processing' && <button className="btn btn-sm" onClick={() => onAction(j, 'pause')}>Pause</button>}
              {['paused', 'failed', 'canceled'].includes(j.status) && <button className="btn btn-sm" onClick={() => onAction(j, 'resume')}>{j.status === 'failed' ? 'Retry' : 'Resume'}</button>}
              {act && <button className="btn btn-sm" onClick={() => onAction(j, 'cancel')}>Cancel</button>}
              {!act && <button className="btn btn-sm" onClick={() => onRemove(j)}>Remove</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TranscriptPane({ job, tr, status, settings, setSettings, playerRef, onChanged, notify, onRename }) {
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState('openai');
  const [diarize, setDiarize] = useState(true);
  const [busy, setBusy] = useState(false);
  const [redo, setRedo] = useState(false);
  const seek = (t) => { const p = playerRef.current; if (p) { p.currentTime = t; p.play?.().catch(() => {}); } };

  if (job.transcribing) return <p style={{ fontSize: 14 }}>Transcribing… {job.transcribeProgress != null ? `${job.transcribeProgress}%` : ''}</p>;
  if (!tr || redo) {
    const go = async () => {
      setBusy(true);
      try {
        const k = settings.kind === 'openai';
        await api(`/jobs/${job.id}/transcribe`, { method: 'POST', body: { provider: engine, diarize: diarize && engine === 'openai', language: settings.language?.trim() || undefined, baseUrl: k ? settings.baseUrl || undefined : undefined, apiKey: k ? settings.apiKey || undefined : undefined } });
        notify('Transcript ready'); setRedo(false); onChanged();
      } catch (e) { notify(e.message, true); } finally { setBusy(false); }
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 460 }}>
        <p style={{ fontSize: 14, color: '#a1a1aa' }}>Create a timestamped transcript. Cloud mode uses your API key (AI settings) and can label who is speaking.</p>
        <div><label className="lbl">Engine</label><select value={engine} onChange={(e) => setEngine(e.target.value)}><option value="openai">Cloud (OpenAI-compatible API)</option><option value="local" disabled={!status?.localWhisper}>{status?.localWhisper ? 'Local Whisper (on the server)' : 'Local Whisper (not installed on server)'}</option></select></div>
        <div><label className="lbl">Language</label><input value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })} placeholder="auto-detect (e.g. en, es, de)" /></div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}><input type="checkbox" checked={diarize} onChange={(e) => setDiarize(e.target.checked)} /> Label speakers (cloud only)</label>
        <button className="btn btn-primary" disabled={busy} onClick={go}>{busy ? 'Transcribing…' : 'Transcribe'}</button>
      </div>
    );
  }
  const names = tr.speakerNames || {};
  const q = query.toLowerCase();
  const segs = tr.segments.filter((s) => !q || s.text.toLowerCase().includes(q) || (s.speaker && (names[s.speaker] || s.speaker).toLowerCase().includes(q)));
  const exportAs = async (fmt) => {
    try {
      const res = await fetch(`${API}/jobs/${job.id}/transcript?format=${fmt}`);
      if (!res.ok) throw new Error('Export failed');
      const a = document.createElement('a'); a.href = URL.createObjectURL(await res.blob()); a.download = `${job.title.slice(0, 60).replace(/[^\w.-]+/g, '_')}.${fmt}`; document.body.append(a); a.click(); a.remove();
    } catch (e) { notify(e.message, true); }
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 180 }}><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search text or speaker…" /></div>
        {['txt', 'md', 'srt', 'vtt', 'json'].map((f) => <button key={f} className="btn btn-sm" onClick={() => exportAs(f)}>{f.toUpperCase()}</button>)}
      </div>
      {Object.keys(names).length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#71717a' }}>Speakers:</span>
          {Object.keys(names).map((k) => <SpeakerInput key={`${job.id}-${k}-${names[k]}`} id={k} value={names[k]} onCommit={(v) => onRename(k, v)} />)}
        </div>
      )}
      <div style={{ maxHeight: 380, overflow: 'auto' }}>
        {segs.map((s, i) => { const who = s.speaker ? names[s.speaker] || s.speaker : ''; return (
          <div key={i} className="seg" data-s={s.start} data-e={s.end} onClick={() => seek(s.start)}>
            <span className="t">{fmtClock(s.start)}</span><span>{who && <span className="spk">{who}: </span>}{s.text}</span>
          </div>); })}
        {!segs.length && <p style={{ fontSize: 14, padding: 12, color: '#71717a' }}>No matches.</p>}
      </div>
      <div style={{ fontSize: 12, color: '#71717a', marginTop: 12 }}>{tr.provider === 'local' ? 'Local Whisper' : tr.model}{tr.language ? ` · ${tr.language}` : ''}{tr.diarized ? ' · speaker labels' : ''}</div>
      <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => setRedo(true)}>Re-transcribe</button>
    </div>
  );
}

function SpeakerInput({ id, value, onCommit }) {
  const [v, setV] = useState(value);
  return <input aria-label={`Rename ${id}`} style={{ width: 120, padding: '4px 8px' }} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onCommit(v)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />;
}

function AiPane({ job, settings, store, setStore, notify }) {
  const [lang, setLang] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState('');
  const logRef = useRef(null);
  const out = store.out[job.id];
  const chat = store.chat[job.id] || [];
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = 1e9; }, [chat.length]);
  const run = async (action, label, extra = {}) => {
    setLoading(label);
    try { const r = await api(`/jobs/${job.id}/ai`, { method: 'POST', body: { action, provider: providerOf(settings), ...extra } }); setStore((s) => ({ ...s, out: { ...s.out, [job.id]: r.text } })); }
    catch (e) { setStore((s) => ({ ...s, out: { ...s.out, [job.id]: `**Error:** ${e.message}` } })); }
    setLoading('');
  };
  const send = async () => {
    const text = q.trim(); if (!text) return;
    const msgs = [...chat, { role: 'user', content: text }]; setQ('');
    setStore((s) => ({ ...s, chat: { ...s.chat, [job.id]: msgs } }));
    let reply;
    try { reply = (await api(`/jobs/${job.id}/ai`, { method: 'POST', body: { action: 'chat', messages: msgs, provider: providerOf(settings) } })).text; } catch (e) { reply = `⚠ ${e.message}`; }
    setStore((s) => ({ ...s, chat: { ...s.chat, [job.id]: [...msgs, { role: 'assistant', content: reply }] } }));
  };
  if (!job.hasTranscript) return <p style={{ fontSize: 14, color: '#a1a1aa' }}>Transcribe this item first — the AI works from the transcript.</p>;
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {AI_ACTIONS.map(([a, l]) => <button key={a} className="btn btn-sm" disabled={!!loading} onClick={() => run(a, l)}>{l}</button>)}
        <input style={{ width: 150 }} value={lang} onChange={(e) => setLang(e.target.value)} placeholder="Language, e.g. Spanish" />
        <button className="btn btn-sm" disabled={!!loading} onClick={() => (lang.trim() ? run('translate', 'Translating', { lang: lang.trim() }) : notify('Enter a target language', true))}>Translate</button>
      </div>
      <div className="card out" style={{ padding: 16, marginTop: 12, minHeight: 80 }}>
        {loading ? <p style={{ color: '#a1a1aa' }}>{loading}…</p> : out ? <div dangerouslySetInnerHTML={{ __html: md(out) }} /> : <p style={{ color: '#71717a' }}>Pick an action to generate output.</p>}
      </div>
      <div style={{ margin: '20px 0 4px', fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: '#a1a1aa' }}>Chat with the transcript</div>
      <div ref={logRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflow: 'auto' }}>
        {chat.map((m, i) => (m.role === 'user' ? <div key={i} className="bubble me">{m.content}</div> : <div key={i} className="bubble ai out" dangerouslySetInnerHTML={{ __html: md(m.content) }} />))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask about this video…" />
        <button className="btn btn-primary" onClick={send}>Send</button>
      </div>
    </div>
  );
}

function Detail({ job, status, settings, setSettings, store, setStore, refresh, notify }) {
  const [link, setLink] = useState(null);
  const [tr, setTr] = useState(null);
  const [tab, setTab] = useState('transcript');
  const playerRef = useRef(null);
  const boxRef = useRef(null);
  const done = job.status === 'completed';

  useEffect(() => { // signed, expiring media link
    setLink(null);
    if (!done) return undefined;
    let live = true;
    api(`/jobs/${job.id}/link`).then((r) => live && setLink(r)).catch((e) => live && notify(e.message, true));
    return () => { live = false; };
  }, [job.id, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTr = useCallback(() => {
    if (!job.hasTranscript) { setTr(null); return Promise.resolve(); }
    return api(`/jobs/${job.id}/transcript`).then((r) => setTr(r.transcript)).catch((e) => notify(e.message, true));
  }, [job.id, job.hasTranscript]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadTr(); }, [loadTr]);

  const onTime = () => { // highlight + follow the current segment
    const p = playerRef.current; const box = boxRef.current; if (!p || !box) return;
    const t = p.currentTime; let cur = null;
    box.querySelectorAll('.seg').forEach((el) => { const on = t >= +el.dataset.s && t < +el.dataset.e; el.classList.toggle('now', on); if (on) cur = el; });
    const scroller = cur?.parentElement; if (cur && !p.paused && scroller.scrollHeight > scroller.clientHeight) scroller.scrollTop = cur.offsetTop - scroller.clientHeight / 3;
  };
  const onClick = (e) => { const a = e.target.closest?.('[data-seek]'); if (a) { e.preventDefault(); const p = playerRef.current; if (p) { p.currentTime = parseClock(a.dataset.seek); p.play?.().catch(() => {}); } } };

  const rename = async (k, v) => { try { setTr((await api(`/jobs/${job.id}/transcript`, { method: 'PUT', body: { speakerNames: { [k]: v } } })).transcript); } catch (e) { notify(e.message, true); } };
  const changed = () => { loadTr(); refresh(); };

  const Media = job.options.mode === 'audio' ? 'audio' : 'video';
  return (
    <div className="card" style={{ minHeight: 420, minWidth: 0 }} ref={boxRef} onClick={onClick}>
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
        <div style={{ fontSize: 12, color: '#71717a' }}>{[job.uploader, job.url.replace(/^https?:\/\//, '').slice(0, 60)].filter(Boolean).join(' · ')}</div>
      </div>
      {!done && <p style={{ padding: '0 16px 24px', fontSize: 14, color: '#a1a1aa' }}>{job.status === 'failed' ? `Download failed: ${job.error}` : 'Available once the download finishes.'}</p>}
      {done && (
        <>
          <div style={{ padding: '0 16px' }}>
            {link && <Media ref={playerRef} src={link.url} controls preload="metadata" onTimeUpdate={onTime} style={job.options.mode === 'audio' ? { width: '100%' } : { width: '100%', maxHeight: 340, background: '#000', borderRadius: 10 }} />}
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            {link && <a className="btn btn-sm" href={link.downloadUrl}>Save to this computer</a>}
            {link && <span className="pill">{link.filename.slice(-40)}</span>}
          </div>
          <div style={{ display: 'flex', padding: '0 8px', borderBottom: '1px solid var(--line)' }}>
            <button className={`tab ${tab === 'transcript' ? 'on' : ''}`} onClick={() => setTab('transcript')}>Transcript</button>
            <button className={`tab ${tab === 'ai' ? 'on' : ''}`} onClick={() => setTab('ai')}>AI · Summary &amp; chat</button>
          </div>
          <div style={{ padding: 16 }}>
            {tab === 'transcript'
              ? <TranscriptPane job={job} tr={tr} status={status} settings={settings} setSettings={setSettings} playerRef={playerRef} onChanged={changed} notify={notify} onRename={rename} />
              : <AiPane job={job} settings={settings} store={store} setStore={setStore} notify={notify} />}
          </div>
        </>
      )}
    </div>
  );
}

export default function MediaHub() {
  const [jobs, setJobs] = useState([]);
  const [sel, setSel] = useState(null);
  const [status, setStatus] = useState(null);
  const [statusErr, setStatusErr] = useState('');
  const [settings, setSettingsState] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [store, setStore] = useState({ out: {}, chat: {} });
  const [toast, setToast] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const timer = useRef(null);
  const alive = useRef(true);
  const activeRef = useRef(false);

  const notify = useCallback((msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 4500); }, []);
  const setSettings = useCallback((s) => { setSettingsState(s); try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ } }, []);

  const refresh = useCallback(async () => {
    try {
      const { jobs: list } = await api('/jobs');
      setJobs(list); setLoadErr('');
      setSel((cur) => cur ?? list[0]?.id ?? null);
      activeRef.current = list.some((x) => ACTIVE.includes(x.status) || x.transcribing);
    } catch (e) { setLoadErr(e.message); }
    clearTimeout(timer.current);
    if (alive.current) timer.current = setTimeout(refresh, activeRef.current ? 1200 : 6000);
  }, []);

  useEffect(() => {
    alive.current = true;
    api('/status').then(setStatus).catch((e) => setStatusErr(e.message));
    refresh();
    return () => { alive.current = false; clearTimeout(timer.current); };
  }, [refresh]);

  const job = useMemo(() => jobs.find((j) => j.id === sel) || null, [jobs, sel]);
  const action = async (j, act) => { try { await api(`/jobs/${j.id}/${act}`, { method: 'POST' }); refresh(); } catch (e) { notify(e.message, true); } };
  const remove = async (j) => {
    const files = j.hasFile && window.confirm('Also delete the downloaded file and transcript from the server?');
    try { await api(`/jobs/${j.id}?files=${files ? 1 : 0}`, { method: 'DELETE' }); if (sel === j.id) setSel(null); refresh(); } catch (e) { notify(e.message, true); }
  };

  const chip = statusErr ? { t: statusErr, bad: true } : !status ? { t: 'checking engine…' } : status.downloads ? { t: `yt-dlp ${status.ytDlp}`, ok: true } : { t: `Engine missing: ${[!status.ytDlp && 'yt-dlp', !status.ffmpeg && 'ffmpeg'].filter(Boolean).join(' + ')}`, bad: true };

  return (
    <div className="mh">
      <style>{CSS}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', padding: '24px 24px 8px' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.01em' }}>Media <span style={{ color: 'var(--c)' }}>Hub</span></h1>
          <p style={{ fontSize: 14, color: '#a1a1aa' }}>Download from 1000+ sites · transcribe with speaker labels · summarize, translate &amp; chat</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`pill ${chip.ok ? 'ok' : chip.bad ? 'bad' : ''}`}>{chip.t}</span>
          <button className="btn btn-sm" onClick={() => setShowSettings(true)}>⚙ AI settings</button>
        </div>
      </div>
      <div className="grid2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <AddForm onAdded={(list) => { if (list[0]) setSel(list[0].id); refresh(); }} notify={notify} />
          {loadErr && <p style={{ color: '#f87171', fontSize: 14 }}>{loadErr}</p>}
          <Queue jobs={jobs} sel={sel} onSelect={setSel} onAction={action} onRemove={remove} />
        </div>
        {job
          ? <Detail key={job.id} job={job} status={status} settings={settings} setSettings={setSettings} store={store} setStore={setStore} refresh={refresh} notify={notify} />
          : <div className="card" style={{ minHeight: 420, display: 'grid', placeItems: 'center', color: '#71717a', textAlign: 'center', padding: 40 }}><div><div style={{ fontSize: 36, color: 'var(--c)' }}>⬇</div>Select an item to play it, transcribe it and chat with it.</div></div>}
      </div>
      {showSettings && <Settings settings={settings} onClose={() => setShowSettings(false)} onSave={(s) => { setSettings(s); setShowSettings(false); notify('AI settings saved'); }} />}
      {toast && <div className={`toast ${toast.err ? 'err' : ''}`} role="status">{toast.msg}</div>}
    </div>
  );
}

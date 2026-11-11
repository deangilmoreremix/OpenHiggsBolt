'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { colors, semantic } from '@/shared/styles/designTokens';

export interface HelpSource {
  id: string;
  title: string;
  url: string;
  kind: 'studio' | 'academy' | 'reseller' | 'app';
}
interface Msg {
  role: 'user' | 'assistant';
  content: string;
  sources?: HelpSource[];
  error?: string;
  pending?: boolean;
  /** Shown when the customer tries to ask but has no (valid) OpenAI key. */
  needsKey?: 'missing' | 'invalid';
}

const ENDPOINT = '/api/help/chat';

const STUDIO_SUGGESTIONS: Record<string, string[]> = {
  apps: ['How do I connect Stripe to my app?', 'Why did a payment succeed but credits did not appear?', 'How do I connect my own domain?'],
  image: ['How do I generate an image from a prompt?', 'How many reference images can I upload?'],
  video: ['How do I create a video from an image?', 'What should I do if a generation fails?'],
  lipsync: ['How do I lip sync a video to audio?'],
  storyboard: ['How do I build a storyboard?'],
  workflows: ['How do I build a workflow?'],
};
const GENERIC = ['What can I do in this studio?', 'Where do I start as a beginner?', 'How do I fix a failed generation?'];

/** Turn [S1] markers into numbered links to the matching source. */
export function linkCitations(text: string, sources: HelpSource[] = []): string {
  return text.replace(/\s?\[S(\d+)\]/g, (_m, n: string) => {
    const s = sources[Number(n) - 1];
    return s ? ` [${n}](${s.url})` : '';
  });
}
export function citedSources(text: string, sources: HelpSource[] = []): HelpSource[] {
  const ids = [...text.matchAll(/\[S(\d+)\]/g)].map((m) => Number(m[1]) - 1);
  const uniq = [...new Set(ids)].map((i) => sources[i]).filter(Boolean);
  const urls = new Set<string>();
  return uniq.filter((s) => (urls.has(s.url) ? false : (urls.add(s.url), true)));
}

export default function HelpAgent({
  studioId = null,
  studioLabel = null,
  onRequestApiKey,
}: {
  studioId?: string | null;
  studioLabel?: string | null;
  /** Opens the API keys modal (available inside the studio shell). */
  onRequestApiKey?: () => void;
}) {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let off = false;
    fetch(ENDPOINT, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((j) => { if (!off) setAvailable(!!j.available); })
      .catch(() => !off && setAvailable(false));
    return () => { off = true; };
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'end' }); }, [msgs]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    const history = [...msgs.filter((m) => !m.error && !m.pending), { role: 'user' as const, content: question }];
    setMsgs((m) => [...m, { role: 'user', content: question }, { role: 'assistant', content: '', pending: true }]);
    setInput('');
    setBusy(true);
    const ctl = new AbortController();
    abortRef.current = ctl;
    const patch = (fn: (m: Msg) => Msg) => setMsgs((all) => all.map((m, i) => (i === all.length - 1 ? fn(m) : m)));
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-6).map(({ role, content }) => ({ role, content })), studioId }),
      });
      if (res.status === 409) {
        patch((m) => ({ ...m, pending: false, needsKey: 'missing' }));
        return;
      }
      if (!res.ok || !res.body) {
        const msg = res.status === 429 ? 'You are asking quickly — please wait a moment and try again.' : res.status === 401 ? 'Please sign in to use the assistant.' : res.status === 403 ? 'The assistant is not included in your plan.' : 'The assistant is unavailable right now.';
        patch((m) => ({ ...m, pending: false, error: msg }));
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const block = buf.slice(0, i); buf = buf.slice(i + 2);
          const ev = /^event: (.+)$/m.exec(block)?.[1];
          const raw = /^data: (.+)$/m.exec(block)?.[1];
          if (!ev || !raw) continue;
          const data = JSON.parse(raw);
          if (ev === 'sources') patch((m) => ({ ...m, sources: data }));
          else if (ev === 'delta') patch((m) => ({ ...m, content: m.content + data.text }));
          else if (ev === 'error') {
            if (data.code === 'OPENAI_KEY_INVALID') patch((m) => ({ ...m, pending: false, needsKey: 'invalid' }));
            else patch((m) => ({ ...m, error: data.message }));
          }
          else if (ev === 'done') patch((m) => ({ ...m, pending: false }));
        }
      }
      patch((m) => ({ ...m, pending: false }));
    } catch (e) {
      if ((e as Error).name !== 'AbortError') patch((m) => ({ ...m, pending: false, error: 'Connection lost. Please try again.' }));
    } finally {
      setBusy(false);
    }
  }, [busy, msgs, studioId]);

  if (!available) return null;
  const suggestions = (studioId && STUDIO_SUGGESTIONS[studioId]) || GENERIC;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask SmartVideo — open the help assistant"
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2"
          style={{ background: colors.primary, color: '#000' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          Ask SmartVideo
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Ask SmartVideo help assistant"
          className="fixed z-[70] flex flex-col overflow-hidden border shadow-[0_20px_60px_rgba(0,0,0,0.7)] inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[600px] sm:max-h-[calc(100vh-2.5rem)] sm:w-[400px] sm:rounded-2xl"
          style={{ background: '#0a0a0a', borderColor: 'var(--glass-border)' }}
          data-testid="help-agent"
        >
          <header className="flex items-center justify-between gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--glass-border)' }}>
            <div>
              <h2 className="text-sm font-extrabold text-white">Ask SmartVideo</h2>
              <p className="text-[11px]" style={{ color: semantic.textSecondary }}>{studioLabel ? `Help for ${studioLabel} and the whole app` : 'Help for every studio, the Academy and reseller setup'}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close help assistant" className="rounded px-2 py-1 text-xs font-semibold" style={{ color: colors.primary }}>Close</button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            {msgs.length === 0 && (
              <div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>Ask how to do anything in SmartVideo GO AI. Answers come from our studio guides and courses, and link to the page they came from.</p>
                <div className="mt-3 flex flex-col gap-2">
                  {suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="rounded-lg border px-3 py-2 text-left text-xs font-semibold" style={{ borderColor: 'rgba(34,211,238,0.3)', color: colors.primary, background: 'rgba(34,211,238,0.06)' }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
                {m.role === 'user' ? (
                  <p className="max-w-[85%] rounded-2xl px-3 py-2 text-sm" style={{ background: 'rgba(34,211,238,0.15)', color: '#fff' }}>{m.content}</p>
                ) : (
                  <div className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {m.content ? (
                      <div className="help-md space-y-2 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_p]:my-1">
                        <ReactMarkdown
                          components={{ a: ({ href, children }) => <a href={href} style={{ color: colors.primary }}>{children}</a> }}
                        >
                          {linkCitations(m.content, m.sources)}
                        </ReactMarkdown>
                      </div>
                    ) : m.pending ? (
                      <span style={{ color: semantic.textSecondary }}>Thinking…</span>
                    ) : null}
                    {m.needsKey && (
                      <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.06)' }} data-testid="help-needs-key">
                        <p className="text-sm font-bold text-white">{m.needsKey === 'invalid' ? 'Your OpenAI key was rejected' : 'Add your OpenAI key to get an answer'}</p>
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>
                          {m.needsKey === 'invalid' ? 'OpenAI did not accept the saved key. Update it in the API keys settings, then ask again.' : 'Ask SmartVideo runs on your own OpenAI account. Add your key in the API keys settings, then ask again.'}
                        </p>
                        {onRequestApiKey ? (
                          <button type="button" onClick={() => { setOpen(false); onRequestApiKey(); }} className="mt-2 rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: colors.primary, color: '#000' }}>Open API keys</button>
                        ) : (
                          <a href="/studio" className="mt-2 inline-block rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: colors.primary, color: '#000' }}>Go to the studio to add your key</a>
                        )}
                      </div>
                    )}
                    {m.error && <p role="alert" className="mt-1 text-xs" style={{ color: semantic.error }}>{m.error}</p>}
                    {!m.pending && !m.error && m.sources && m.sources.length > 0 && (() => {
                      const cited = citedSources(m.content, m.sources);
                      const list = cited.length ? cited : m.sources.slice(0, 3);
                      return (
                        <div className="mt-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>{cited.length ? 'Sources' : 'Related pages'}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {list.map((s) => (
                              <a key={s.id} href={s.url} className="rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ borderColor: 'rgba(34,211,238,0.3)', color: colors.primary }}>{s.title}</a>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form
            className="flex items-end gap-2 border-t p-3"
            style={{ borderColor: 'var(--glass-border)' }}
            onSubmit={(e) => { e.preventDefault(); void send(input); }}
          >
            <label htmlFor="help-agent-input" className="sr-only">Your question</label>
            <textarea
              id="help-agent-input"
              ref={inputRef}
              value={input}
              rows={1}
              maxLength={1500}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } }}
              placeholder="Ask a question…"
              className="max-h-28 min-h-[40px] flex-1 resize-none rounded-lg border bg-black px-3 py-2 text-sm text-white focus:outline-none"
              style={{ borderColor: 'var(--glass-border)' }}
            />
            <button type="submit" disabled={busy || !input.trim()} className="rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40" style={{ background: colors.primary, color: '#000' }}>Send</button>
          </form>
          <p className="px-3 pb-2 text-[10px]" style={{ color: semantic.textMuted }}>Uses your own OpenAI key — usage is billed to your OpenAI account. AI answers can be wrong; check the linked page. Never paste API keys here.</p>
        </section>
      )}
    </>
  );
}

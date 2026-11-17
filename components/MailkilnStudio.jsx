'use client';

// Mailkiln studio tab. Embeds the vendored upstream dashboard (apps/warmbly-web, rebranded at build time and built to
// public/mailkiln-app by `pnpm run build:mailkiln`) and its Help site (public/mailkiln-help) in same-origin iframes with a
// Dashboard / Help switch. The dashboard runs on recorded demo data until a real backend is configured; see
// apps/warmbly-web/UPSTREAM.md and apps/mailkiln-brand/README.md.
import { useCallback, useEffect, useRef, useState } from 'react';

const APP = '/mailkiln-app';
const HELP = '/mailkiln-help';

async function isBuilt(base) {
  try {
    const res = await fetch(`${base}/index.html`, { cache: 'no-store' });
    if (!res.ok) return false;
    // An unbuilt checkout answers unknown paths with the host's own page, so confirm it is the built site.
    return (await res.text()).includes(`${base}/`);
  } catch {
    return false;
  }
}

const tabStyle = (on) => ({ padding: '4px 12px', borderRadius: 8, border: 0, background: on ? 'rgba(128,128,128,.18)' : 'transparent', color: 'inherit', cursor: 'pointer', font: 'inherit', fontSize: 13, opacity: on ? 1 : 0.7, fontWeight: on ? 600 : 400 });
const frameStyle = (on) => ({ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, background: '#fff', display: on ? 'block' : 'none' });

export default function MailkilnStudio({ route = '/app/emails', help = false }) {
  const [state, setState] = useState({ ready: false, app: false, help: false });
  const [tab, setTab] = useState(help ? 'help' : 'app');
  const [helpSrc, setHelpSrc] = useState(`${HELP}/`);
  const appFrame = useRef(null);

  useEffect(() => {
    let live = true;
    Promise.all([isBuilt(APP), isBuilt(HELP)]).then(([app, hlp]) => { if (live) setState({ ready: true, app, help: hlp }); });
    return () => { live = false; };
  }, []);

  // A help link clicked inside the dashboard opens the Help tab instead of a new browser tab.
  const wire = useCallback(() => {
    try {
      appFrame.current?.contentDocument?.addEventListener('click', (e) => {
        const a = e.target.closest && e.target.closest(`a[href^="${HELP}/"]`);
        if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault(); e.stopPropagation();
        setHelpSrc(a.getAttribute('href')); setTab('help');
      }, true);
    } catch { /* cross-origin dashboard: links open normally */ }
  }, []);

  if (!state.ready) return <div style={{ position: 'absolute', inset: 0 }} aria-busy="true" />;
  if (!state.app) return <div style={{ padding: 24 }}>The Mailkiln dashboard has not been built yet. Run <code>pnpm run build:mailkiln</code>.</div>;
  const active = state.help ? tab : 'app';
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {state.help && (
        <div role="tablist" aria-label="Mailkiln" style={{ display: 'flex', gap: 4, padding: '6px 10px', borderBottom: '1px solid rgba(128,128,128,.25)', background: 'rgba(128,128,128,.06)' }}>
          <button type="button" role="tab" aria-selected={active === 'app'} style={tabStyle(active === 'app')} onClick={() => setTab('app')}>Dashboard</button>
          <button type="button" role="tab" aria-selected={active === 'help'} style={tabStyle(active === 'help')} onClick={() => setTab('help')}>Help</button>
        </div>
      )}
      <div style={{ position: 'relative', flex: '1 1 0%', minHeight: 0 }}>
        <iframe ref={appFrame} data-frame="app" title="Mailkiln" src={`${APP}${route}`} onLoad={wire} allow="clipboard-read; clipboard-write; fullscreen" style={frameStyle(active === 'app')} />
        {state.help && <iframe data-frame="help" title="Mailkiln Help" src={helpSrc} allow="clipboard-read; clipboard-write; fullscreen" style={frameStyle(active === 'help')} />}
      </div>
    </div>
  );
}

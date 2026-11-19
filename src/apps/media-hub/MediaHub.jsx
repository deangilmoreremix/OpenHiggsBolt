'use client';

import { useRef, useState } from 'react';

// Media Hub — hosts the vendored upstream VidBee web app (apps/vidbee) in an iframe, themed with this app's
// cyan palette in light and dark. All download / queue / RSS / transcription UI is upstream's. Access is enforced
// server-side by app/vidbee/[[...path]]/route.ts (Clerk auth + VIDBEE_ALLOWED_USERS).
// The Light / Dark / System switch is applied inside the iframe through upstream's own theme setting (host/web-shim.js).
const THEMES = ['light', 'dark', 'system'];

function savedTheme() {
  try {
    const t = window.localStorage.getItem('media-hub-theme');
    return THEMES.includes(t) ? t : 'dark';
  } catch {
    return 'dark';
  }
}

export default function MediaHub() {
  const frame = useRef(null);
  const [theme, setTheme] = useState(savedTheme);
  const [initial] = useState(theme); // the first load uses the saved theme; later changes are posted, not reloaded

  const choose = (t) => {
    setTheme(t);
    try { window.localStorage.setItem('media-hub-theme', t); } catch { /* storage unavailable */ }
    frame.current?.contentWindow?.postMessage({ type: 'vidbee-theme', theme: t }, window.location.origin);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        {THEMES.map((t) => {
          const on = t === theme;
          return (
            <button
              key={t}
              type="button"
              onClick={() => choose(t)}
              aria-pressed={on}
              style={{
                font: '600 11px system-ui', padding: '3px 10px', borderRadius: 999, background: 'transparent', cursor: 'pointer',
                color: on ? '#22d3ee' : '#a1a1aa', border: `1px solid ${on ? 'rgba(34,211,238,.5)' : 'rgba(255,255,255,.12)'}`,
              }}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          );
        })}
      </div>
      <iframe
        ref={frame}
        title="Media Hub"
        src={`/vidbee?theme=${initial}`}
        allow="clipboard-write; fullscreen"
        style={{ flex: 1, width: '100%', minHeight: 0, border: 0, background: '#050505', display: 'block' }}
      />
    </div>
  );
}

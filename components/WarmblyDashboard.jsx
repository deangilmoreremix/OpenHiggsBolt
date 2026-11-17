'use client';

// Warmbly Studio tab. Embeds the vendored upstream dashboard (apps/warmbly-web, built to public/warmbly-app by
// `pnpm run build:warmbly`) in a same-origin iframe. It runs on recorded demo data until a real Warmbly backend is
// configured (see apps/warmbly-web/UPSTREAM.md). When the build is missing the earlier in-repo studio is shown.
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const APP_BASE = '/warmbly-app';
const ClassicStudio = dynamic(() => import('../src/apps/warmbly-studio').then((m) => m.WarmblyStudio), { ssr: false });

async function dashboardIsBuilt() {
  try {
    const res = await fetch(`${APP_BASE}/index.html`, { cache: 'no-store' });
    if (!res.ok) return false;
    // An unbuilt checkout answers unknown paths with the host's own page, so confirm it is the dashboard's.
    return (await res.text()).includes(`${APP_BASE}/assets/`);
  } catch {
    return false;
  }
}

export default function WarmblyDashboard({ route = '/app/emails' }) {
  const [built, setBuilt] = useState(null);
  useEffect(() => {
    let live = true;
    dashboardIsBuilt().then((ok) => { if (live) setBuilt(ok); });
    return () => { live = false; };
  }, []);

  if (built === null) return <div style={{ position: 'absolute', inset: 0 }} aria-busy="true" />;
  if (!built) return <div style={{ position: 'absolute', inset: 0, padding: 12 }}><ClassicStudio /></div>;
  return (
    <iframe
      title="Warmbly Studio"
      src={`${APP_BASE}${route}`}
      allow="clipboard-read; clipboard-write; fullscreen"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, background: '#fff' }}
    />
  );
}

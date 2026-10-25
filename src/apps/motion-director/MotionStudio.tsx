'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MemoryRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { applyLocaleToDocument, localeTitle, useLocale } from './i18n';
import { applySession } from './lib/sessionAdapter';
import { useStore } from './store';
import './styles.css';

/**
 * Motion Studio — the ported Remotion motion workbench.
 *
 * Rendered on demand (`next/dynamic`, `ssr: false`) exactly like every other
 * studio in `components/StandaloneShell.js`: the workbench is a browser-only
 * editor that mounts ~150 Remotion shot cards and a `<Player>`, so it must not
 * run during server rendering.
 *
 * This wrapper owns the three things the Next.js host needs to provide that the
 * original `workbench/src/main.tsx` used to own:
 *   - the `.ms-root` host class (keeps the workbench's global `body` typography
 *     rules from leaking into the rest of SmartVideo GO)
 *   - the browser title and page language
 *
 * Internally it is a tiny single-page router: the entry page (`/new`) lets the
 * user describe their video, pick an aspect ratio / duration / brand / recipe,
 * and seeds the workbench store; the workbench (`/`) is the editor proper. The
 * entry is shown on first visit only — once a project exists, returning users
 * land straight in the workbench.
 */
const MotionStudioWorkbench = dynamic(() => import('./App').then((m) => m.App), { ssr: false });
const MotionStudioEntry = dynamic(() => import('./pages/MotionStudioEntry').then((m) => m.default), { ssr: false });

const ENTRY_SEEN_KEY = 'motion-studio:entry-seen-v1';

/** Host URL of the Motion Studio workspace (the INPUT step is `<root>/new`). */
const STUDIO_ROOT_PATH = '/studio/motion-director';

/** `<root>/new` — the INPUT step (prompt composer, aspect ratio, duration). */
const INPUT_PATH_RE = /\/motion-studio\/new\/?$/;

/** True when the browser is on the INPUT step of the studio. */
const isInputPath = () =>
  typeof window !== 'undefined' && INPUT_PATH_RE.test(window.location.pathname);

/**
 * Keeps the address bar in step with the internal (MemoryRouter) route.
 *
 * The internal router is a MemoryRouter, so the browser URL never followed the
 * step the user is on: after Generate the editor took over while the URL still
 * said `/studio/motion-studio/new`, and a reload of that URL bounced the user
 * back into the input step. This writes the studio root back into the URL
 * (query + hash preserved) as soon as the editor route is mounted.
 */
const RouteSync = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (location.pathname !== '/') return;
    const { pathname, search, hash } = window.location;
    if (!INPUT_PATH_RE.test(pathname)) return;
    window.history.replaceState(window.history.state, '', `${STUDIO_ROOT_PATH}${search}${hash}`);
  }, [location.pathname]);

  return null;
};

const MotionStudioSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const sessions = useStore((s) => s.sessions);
  const session = sessions.find((s) => s.id === sessionId);

  useEffect(() => {
    if (session) {
      applySession(useStore, session);
    }
  }, [session]);

  if (!session) return <Navigate to="/" replace />;
  return <MotionStudioWorkbench />;
};

export default function MotionStudio() {
  const locale = useLocale((s) => s.locale);

  useEffect(() => {
    const desired = localeTitle(locale);
    applyLocaleToDocument(locale);
    // The App Router applies the root layout's metadata on hydration, which can
    // land after the studio has set its own title and would clobber it. Re-assert
    // the studio title for a short window and stop, so the workbench's own
    // locale switch stays in control afterwards.
    let stop = false;
    const enforce = () => {
      if (!stop && document.title !== desired) document.title = desired;
    };
    let frames = 2;
    const tick = () => {
      if (frames-- <= 0) return;
      enforce();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const id = window.setInterval(enforce, 400);
    const timeout = window.setTimeout(() => {
      window.clearInterval(id);
      stop = true;
    }, 4000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(timeout);
      stop = true;
    };
  }, [locale]);

  const hasSeenEntry =
    typeof window !== 'undefined' && !!window.localStorage.getItem(ENTRY_SEEN_KEY);
  // `/new` always means "input step"; the studio root means "editor" once the
  // entry has been seen, and "input step" on a first visit.
  const initialRoute = isInputPath() || !hasSeenEntry ? '/new' : '/';

  return (
    <div className="ms-root">
      <MemoryRouter initialEntries={[initialRoute]}>
        <RouteSync />
        <Routes>
          <Route path="/new" element={<MotionStudioEntry />} />
          <Route path="/motion/new" element={<MotionStudioEntry />} />
          <Route path="/" element={<MotionStudioWorkbench />} />
          <Route path="/motion" element={<MotionStudioWorkbench />} />
          <Route path="/motion/:sessionId" element={<MotionStudioSession />} />
          <Route path="*" element={<Navigate to={initialRoute} replace />} />
        </Routes>
      </MemoryRouter>
    </div>
  );
}

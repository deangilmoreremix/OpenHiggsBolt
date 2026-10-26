'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { MemoryRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
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
 * Internally it is a tiny single-page router: the chat (`/new`, shown at the
 * studio root URL) is where films are made; the workbench (`/`, shown at
 * `<root>/workbench`) is the editor, opened from the chat's "Open in Motion
 * Workbench" or the "Continue editing" tile. The tab always opens the chat.
 */
const MotionStudioWorkbench = dynamic(() => import('./App').then((m) => m.App), { ssr: false });
const MotionStudioEntry = dynamic(() => import('./pages/MotionStudioEntry').then((m) => m.default), { ssr: false });

/** Host URL of Motion Director: the chat. The editor lives at `<root>/workbench`. */
const STUDIO_ROOT_PATH = '/studio/motion-director';
const WORKBENCH_PATH = `${STUDIO_ROOT_PATH}/workbench`;

/** `<root>/workbench` — the Motion Workbench (editor). */
const WORKBENCH_PATH_RE = /\/motion-director\/workbench\/?$/;

const isWorkbenchPath = (pathname: string | null | undefined) => WORKBENCH_PATH_RE.test(pathname ?? '');

/**
 * Keeps the address bar and the internal (MemoryRouter) route in step, both ways.
 *
 * - Internal → URL: the chat shows as the studio root, the editor as
 *   `<root>/workbench`, so a reload lands where the user was.
 * - URL → internal: clicking the Motion Director tab (which pushes the studio
 *   root) while the editor is open goes back to the chat, and Back / Forward
 *   onto `<root>/workbench` opens the editor again. Before, the studio opened
 *   the editor on every visit after the first, with no way back from the tab.
 */
const RouteSync = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = usePathname();
  const inEditor = location.pathname === '/' || location.pathname.startsWith('/motion');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { pathname: current, search, hash } = window.location;
    if (!current.startsWith(STUDIO_ROOT_PATH)) return;
    const want = inEditor ? WORKBENCH_PATH : STUDIO_ROOT_PATH;
    if (current.replace(/\/$/, '') !== want) window.history.replaceState(window.history.state, '', `${want}${search}${hash}`);
    // Only the internal route drives this direction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inEditor]);

  useEffect(() => {
    if (!pathname || !pathname.startsWith(STUDIO_ROOT_PATH)) return;
    if (inEditor && !isWorkbenchPath(pathname)) navigate('/new');
    // Back / Forward onto the workbench URL reopens the editor.
    else if (!inEditor && isWorkbenchPath(pathname)) navigate('/');
    // Only a URL change drives this direction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

  // The tab opens the chat; only the workbench URL (a reload in the editor) opens the editor.
  const initialRoute = typeof window !== 'undefined' && isWorkbenchPath(window.location.pathname) ? '/' : '/new';

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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LESSON_IDS } from '@/content/resellerAcademy';
import { WORKSHOP_APP_IDS } from '@/lib/resellerAcademyApps';
import {
  emptyProgress,
  loadLocal,
  markPhase,
  mergeProgress,
  saveLocal,
  sanitizeProgress,
  selectApp,
  setLessonComplete,
  toggleCheck,
  visitLesson,
  type AcademyProgress,
  type Phase,
} from '@/lib/resellerAcademyProgress';

export type SyncState = 'local' | 'syncing' | 'saved' | 'offline';

const ENDPOINT = '/api/reseller/academy/progress';

/**
 * Progress for the Reseller Academy. Always works from localStorage; syncs to
 * the account when the API is available. Educational only — nothing here
 * touches access/entitlements.
 *
 * `syncRemote` can be disabled (tests / previews).
 */
export function useAcademyProgress(syncRemote = true) {
  const [progress, setProgress] = useState<AcademyProgress>(() => emptyProgress());
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState>('local');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(progress);
  latest.current = progress;

  // hydrate: local first (instant), then merge the account copy
  useEffect(() => {
    let cancelled = false;
    const local = loadLocal(LESSON_IDS, WORKSHOP_APP_IDS);
    setProgress(local);
    setReady(true);
    if (!syncRemote) return;
    (async () => {
      try {
        const res = await fetch(ENDPOINT, { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { progress: unknown };
        const remote = body.progress ? sanitizeProgress(body.progress, LESSON_IDS, WORKSHOP_APP_IDS) : null;
        if (cancelled) return;
        const merged = mergeProgress(local, remote);
        setProgress(merged);
        saveLocal(merged);
        setSync('saved');
      } catch {
        if (!cancelled) setSync('offline');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [syncRemote]);

  const push = useCallback(
    (p: AcademyProgress) => {
      saveLocal(p);
      if (!syncRemote) return;
      if (timer.current) clearTimeout(timer.current);
      setSync('syncing');
      timer.current = setTimeout(async () => {
        try {
          const res = await fetch(ENDPOINT, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ progress: latest.current }),
          });
          setSync(res.ok ? 'saved' : 'offline');
        } catch {
          setSync('offline');
        }
      }, 600);
    },
    [syncRemote],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const apply = useCallback(
    (fn: (p: AcademyProgress, now: number) => AcademyProgress) => {
      setProgress((cur) => {
        const next = fn(cur, Date.now());
        if (next !== cur) push(next);
        return next;
      });
    },
    [push],
  );

  return {
    progress,
    ready,
    sync,
    selectApp: (id: string | null) => apply((p, n) => selectApp(p, id, n)),
    visit: (lessonId: string) => apply((p, n) => visitLesson(p, lessonId, n)),
    phase: (lessonId: string, ph: Phase) => apply((p, n) => markPhase(p, lessonId, ph, n)),
    toggle: (lessonId: string, i: number) => apply((p, n) => toggleCheck(p, lessonId, i, n)),
    complete: (lessonId: string, done: boolean) => apply((p, n) => setLessonComplete(p, lessonId, done, n)),
  };
}

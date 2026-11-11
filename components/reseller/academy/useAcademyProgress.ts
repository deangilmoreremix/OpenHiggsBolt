'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LESSON_IDS } from '@/content/resellerAcademy';
import { WORKSHOP_APP_IDS } from '@/lib/resellerAcademyApps';
import {
  emptyProgress,
  loadLocal,
  loadOwner,
  saveOwner,
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
        const body = (await res.json()) as { progress: unknown; owner?: unknown };
        const owner = typeof body.owner === 'string' ? body.owner : null;
        const remote = body.progress ? sanitizeProgress(body.progress, LESSON_IDS, WORKSHOP_APP_IDS) : null;
        if (cancelled) return;
        // Browser progress saved by a different account must never reach this one.
        const storedOwner = loadOwner();
        const foreign = !!owner && !!storedOwner && storedOwner !== owner;
        // Merge against the CURRENT state, so work done while this request was pending is kept.
        const merged = mergeProgress(foreign ? emptyProgress() : latest.current, remote);
        if (owner) saveOwner(owner);
        setProgress(merged);
        saveLocal(merged);
        if (merged !== remote && merged.updatedAt > 0) push(merged); // newer browser progress goes up now
        else setSync('saved');
      } catch {
        if (!cancelled) setSync('offline');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [syncRemote, push]);

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

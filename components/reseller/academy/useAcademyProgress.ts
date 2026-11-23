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
  setCheck,
  setLessonComplete,
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
  // Edits made before the account copy has loaded are replayed on top of it, never merged over it.
  const hydrated = useRef(!syncRemote);
  const pending = useRef<Array<(p: AcademyProgress, now: number) => AcademyProgress>>([]);

  // One save at a time, always sending the latest state, so a slow older request can never land
  // after (and overwrite) a newer one.
  const sending = useRef(false);
  const again = useRef(false);
  const flush = useCallback(async () => {
    if (sending.current) {
      again.current = true;
      return;
    }
    sending.current = true;
    try {
      let ok = false;
      do {
        again.current = false;
        const res = await fetch(ENDPOINT, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ progress: latest.current }),
        });
        ok = res.ok;
      } while (again.current);
      setSync(ok ? 'saved' : 'offline');
    } catch {
      setSync('offline');
    } finally {
      sending.current = false;
    }
  }, []);

  const push = useCallback(
    (p: AcademyProgress) => {
      saveLocal(p);
      if (!syncRemote) return;
      if (timer.current) clearTimeout(timer.current);
      setSync('syncing');
      timer.current = setTimeout(() => void flush(), 600);
    },
    [syncRemote, flush],
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
        // Merge the browser copy as it was on load (not the edited state), then replay edits the
        // learner made while this request was pending on top, so neither side loses work.
        const base = mergeProgress(foreign ? emptyProgress() : local, remote);
        const edits = pending.current;
        pending.current = [];
        hydrated.current = true;
        const merged = edits.reduce((p, fn) => fn(p, Date.now()), base);
        if (owner) saveOwner(owner);
        setProgress(merged);
        saveLocal(merged);
        if (edits.length > 0 || (base !== remote && base.updatedAt > 0)) push(merged); // newer browser progress goes up now
        else setSync('saved');
      } catch {
        if (cancelled) return;
        // account copy unreachable: keep working from the browser copy, edits included
        hydrated.current = true;
        pending.current = [];
        saveLocal(latest.current);
        setSync('offline');
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
      if (!hydrated.current) {
        // show the edit now, but do not save or upload until the account copy has loaded
        pending.current.push(fn);
        setProgress((cur) => fn(cur, Date.now()));
        return;
      }
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
    toggle: (lessonId: string, i: number) => {
      // capture the learner's intent now, so replaying it after hydration sets (not flips) the box
      const checked = !(latest.current.checks[lessonId] ?? []).includes(i);
      apply((p, n) => setCheck(p, lessonId, i, checked, n));
    },
    complete: (lessonId: string, done: boolean) => apply((p, n) => setLessonComplete(p, lessonId, done, n)),
  };
}

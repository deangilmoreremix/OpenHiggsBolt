'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  emptyCourseProgress,
  loadCourseLocal,
  loadCourseOwner,
  markStepDone,
  mergeCourseProgress,
  sanitizeCourseProgress,
  saveCourseLocal,
  saveCourseOwner,
  setCourseCheck,
  setCourseLessonComplete,
  unionCourseProgress,
  visitStep,
  type CourseProgress,
} from '@/lib/academyCourseProgress';

/** local = browser only (signed out, or the account store is not available yet) */
export type CourseSyncState = 'local' | 'syncing' | 'saved' | 'offline';

const ENDPOINT = '/api/academy/progress';
/** Backoff between attempts to reach the account after a failed first load (the last value repeats). */
const RETRY_MS = [2000, 5000, 15000, 30000];
/** A request that has not answered by then is abandoned and treated as a retryable failure (it must never hold the save queue forever). */
const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, init: RequestInit = {}, inflight?: Set<AbortController>): Promise<Response> {
  const ctl = new AbortController();
  inflight?.add(ctl);
  const t = setTimeout(() => ctl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(t);
    inflight?.delete(ctl);
  }
}

/** One learner action, kept as data so it can be saved in the browser while the account is unreachable. */
type Edit =
  | { k: 'visit'; l: string; s: string }
  | { k: 'step'; l: string; s: string }
  | { k: 'check'; l: string; i: number; c: boolean }
  | { k: 'complete'; l: string; d: boolean };

const editFn = (e: Edit) => (p: CourseProgress, now: number): CourseProgress =>
  e.k === 'visit' ? visitStep(p, e.l, e.s, now)
  : e.k === 'step' ? markStepDone(p, e.l, e.s, now)
  : e.k === 'check' ? setCourseCheck(p, e.l, e.i, e.c, now)
  : setCourseLessonComplete(p, e.l, e.d, now);

/** Per-user key: edits made before the account answered, never shared with another account. */
const pendingKey = (userId: string) => `academy-course-pending:v1:${userId}`;
const MAX_PENDING = 500;

function loadPending(userId: string | null | undefined, ids: readonly string[]): Edit[] {
  if (!userId) return [];
  try {
    const raw = window.localStorage.getItem(pendingKey(userId));
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    const ok = new Set(ids);
    return arr.filter((e): e is Edit => !!e && typeof e === 'object' && ok.has((e as Edit).l) && (
      ((e.k === 'visit' || e.k === 'step') && typeof e.s === 'string' && e.s.length > 0 && e.s.length <= 80)
      || (e.k === 'check' && Number.isInteger(e.i) && typeof e.c === 'boolean')
      || (e.k === 'complete' && typeof e.d === 'boolean')
    )).slice(-MAX_PENDING);
  } catch {
    return [];
  }
}
function savePending(userId: string | null | undefined, edits: readonly Edit[]) {
  if (!userId) return;
  try {
    if (edits.length) window.localStorage.setItem(pendingKey(userId), JSON.stringify(edits.slice(-MAX_PENDING)));
    else window.localStorage.removeItem(pendingKey(userId));
  } catch {
    /* storage unavailable: edits stay in memory */
  }
}

/**
 * Academy course progress. Always works from the browser; when the learner is
 * signed in it also saves to their account so it follows them across devices.
 * Same engine as the reseller course's hook: local-first hydrate, edits made
 * before the account copy arrives are replayed on top of it, one save at a
 * time, and a browser copy that belongs to another account is never shared.
 *
 * `syncRemote` can be turned off (tests / previews). `userId` is the signed-in user as the server
 * saw them (null when signed out): while the account is unreachable, edits are kept in this browser
 * under that user's own key and replayed on top of the account copy once it loads.
 */
export function useCourseProgress(lessonIds: readonly string[], syncRemote = true, userId: string | null = null) {
  const userRef = useRef(userId);
  userRef.current = userId;
  const idsRef = useRef(lessonIds);
  idsRef.current = lessonIds;
  const [progress, setProgress] = useState<CourseProgress>(() => emptyCourseProgress());
  /** true once progress can be trusted for resuming: browser copy loaded and, when signed in, the account request settled */
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<CourseSyncState>('local');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(progress);
  latest.current = progress;
  const hydrated = useRef(!syncRemote);
  // edits made before the account answered; `saved` ones were loaded from this browser's per-user copy
  const pending = useRef<Edit[]>([]);
  // signed out, or the account store is not available: stay browser-only without error noise
  const remoteOff = useRef(!syncRemote);

  const sending = useRef(false);
  const again = useRef(false);
  // a save failed and has not been retried successfully yet (the state in `latest` is still unsaved)
  const dirty = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttempt = useRef(0);
  // set when the hook unmounts: nothing may be sent, retried or scheduled after that
  const disposed = useRef(false);
  const inflight = useRef(new Set<AbortController>());
  const flush = useCallback(async () => {
    if (disposed.current) return;
    if (sending.current) {
      again.current = true;
      return;
    }
    sending.current = true;
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    let retryable = false;
    try {
      let ok = false;
      do {
        again.current = false;
        const res = await fetchWithTimeout(ENDPOINT, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ progress: latest.current }),
        }, inflight.current);
        if (disposed.current) return;
        ok = res.ok;
        if (ok) {
          // the account already holds newer progress (another device saved meanwhile): adopt it
          // without losing what this device did, and send the combined copy back
          const body = (await res.json().catch(() => null)) as { stale?: boolean; progress?: unknown } | null;
          if (disposed.current) return;
          if (body?.stale && body.progress) {
            const theirs = sanitizeCourseProgress(body.progress, idsRef.current);
            const merged = unionCourseProgress(latest.current, theirs);
            if (JSON.stringify(merged) !== JSON.stringify(latest.current)) {
              latest.current = merged;
              setProgress(merged);
              saveCourseLocal(merged);
              if (JSON.stringify(merged) !== JSON.stringify(theirs)) again.current = true;
            }
          }
        }
        // 4xx other than timeout / rate limit will not succeed by repeating the same request
        retryable = !ok && (res.status >= 500 || res.status === 408 || res.status === 429);
      } while (again.current && !disposed.current);
      if (disposed.current) return;
      dirty.current = !ok;
      if (ok) retryAttempt.current = 0;
      setSync(ok ? 'saved' : 'offline');
    } catch {
      if (disposed.current) return;
      dirty.current = true;
      retryable = true;
      setSync('offline');
    } finally {
      sending.current = false;
    }
    if (disposed.current) return;
    // keep the unsaved state and try again later (same backoff as the first load, never a tight loop);
    // it goes through the same conditional write, so a stale retry still cannot overwrite newer progress
    if (dirty.current && retryable) {
      retryTimer.current = setTimeout(() => void flush(), RETRY_MS[Math.min(retryAttempt.current++, RETRY_MS.length - 1)]);
    }
  }, []);

  const push = useCallback(
    (p: CourseProgress) => {
      saveCourseLocal(p);
      if (remoteOff.current) return;
      if (timer.current) clearTimeout(timer.current);
      setSync('syncing');
      timer.current = setTimeout(() => void flush(), 600);
    },
    [flush],
  );

  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    // a browser copy that belongs to another account is not even shown to this one
    const storedOwner0 = loadCourseOwner();
    const local = userRef.current && storedOwner0 && storedOwner0 !== userRef.current ? emptyCourseProgress() : loadCourseLocal(idsRef.current);
    const saved = syncRemote ? loadPending(userRef.current, idsRef.current) : [];
    const savedCount = saved.length; // `saved` itself is the queue and grows as the learner acts
    pending.current = saved;
    setProgress(saved.reduce((p, e) => editFn(e)(p, Date.now()), local));
    // browser-only: local progress is the whole truth. Signed in: `ready` waits until the account
    // copy has settled, so resume/visit never run against empty local state and clobber the saved place.
    if (!syncRemote) {
      setReady(true);
      return;
    }
    const hydrate = async () => {
      try {
        const res = await fetchWithTimeout(ENDPOINT, { cache: 'no-store' }, inflight.current);
        if (res.status === 401 || res.status === 404) {
          // signed out, or the route is unavailable: browser-only, replay edits locally (a 503 is transient and retried below)
          if (cancelled) return;
          remoteOff.current = true;
          hydrated.current = true;
          const edits = pending.current;
          pending.current = [];
          if (res.status !== 401 && edits.length) saveCourseLocal(latest.current);
          // 401: the learner is signed out, so edits kept for a signed-in user are not theirs to merge into the shared browser copy
          if (res.status === 401 && savedCount) {
            const rest = edits.slice(savedCount);
            const shown = rest.reduce((p, e) => editFn(e)(p, Date.now()), local);
            latest.current = shown;
            setProgress(shown);
            if (rest.length) saveCourseLocal(shown);
          }
          setSync('local');
          setReady(true);
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { progress: unknown; owner?: unknown };
        const owner = typeof body.owner === 'string' ? body.owner : null;
        const remote = body.progress ? sanitizeCourseProgress(body.progress, idsRef.current) : null;
        if (cancelled) return;
        const storedOwner = loadCourseOwner();
        const foreign = !!owner && !!storedOwner && storedOwner !== owner;
        const base = mergeCourseProgress(foreign ? emptyCourseProgress() : local, remote);
        // edits kept from an earlier visit only count when this really is the same account
        const mismatch = savedCount > 0 && !!owner && owner !== userRef.current;
        const edits = mismatch ? pending.current.slice(savedCount) : pending.current;
        pending.current = [];
        hydrated.current = true;
        const merged = edits.reduce((p, e) => editFn(e)(p, Date.now()), base);
        if (owner) saveCourseOwner(owner);
        latest.current = merged; // a save queued right now must read this, not the previous render's state
        setProgress(merged);
        saveCourseLocal(merged); // now in the owner-tagged browser copy, so the per-user pending copy can go
        if (!mismatch) savePending(userRef.current, []);
        setReady(true);
        if (edits.length > 0 || (base !== remote && base.updatedAt > 0)) push(merged);
        else setSync('saved');
      } catch {
        if (cancelled) return;
        // Ownership of the browser copy and the account copy are both unknown, so NOTHING is uploaded:
        // `hydrated` stays false (edits queue in memory and are replayed once the account answers, on top
        // of the right base) and the request is retried with backoff.
        setSync('offline');
        setReady(true);
        retry = setTimeout(() => void hydrate(), RETRY_MS[Math.min(attempt++, RETRY_MS.length - 1)]);
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
    };
  }, [syncRemote, push]);

  // connectivity back / tab visible again: retry an unsaved change now instead of waiting for the backoff
  useEffect(() => {
    const retryNow = () => {
      if (disposed.current || !dirty.current || !hydrated.current || remoteOff.current || sending.current) return;
      retryAttempt.current = 0;
      void flush();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') retryNow();
    };
    window.addEventListener('online', retryNow);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', retryNow);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [flush]);

  useEffect(() => {
    disposed.current = false; // (re-armed for React strict-mode's mount, unmount, mount)
    const requests = inflight.current;
    return () => {
      disposed.current = true;
      if (timer.current) clearTimeout(timer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
      timer.current = null;
      retryTimer.current = null;
      requests.forEach((c) => c.abort());
    };
  }, []);

  const apply = useCallback(
    (edit: Edit) => {
      const fn = editFn(edit);
      if (!hydrated.current) {
        pending.current.push(edit);
        savePending(userRef.current, pending.current);
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
    visit: (lessonId: string, stepId: string) => apply({ k: 'visit', l: lessonId, s: stepId }),
    stepDone: (lessonId: string, stepId: string) => apply({ k: 'step', l: lessonId, s: stepId }),
    check: (lessonId: string, index: number) => {
      // capture the learner's intent now, so replaying it after hydration sets (not flips) the box
      const checked = !(latest.current.checks[lessonId] ?? []).includes(index);
      apply({ k: 'check', l: lessonId, i: index, c: checked });
    },
    complete: (lessonId: string, done: boolean) => apply({ k: 'complete', l: lessonId, d: done }),
  };
}

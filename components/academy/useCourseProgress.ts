'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  emptyCourseProgress,
  loadCourseLocal,
  clearCourseOwner,
  loadCourseOwner,
  sameCourseProgress,
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

/** Per-user key: edits made before the account answered, never shared with another account. Signed-out visitors use the guest key. */
const pendingKey = (userId: string | null | undefined) => `academy-course-pending:v1:${userId || 'guest'}`;
const MAX_PENDING = 5000; // only a guard against corrupt storage: compaction below keeps real queues far smaller

/**
 * Shrink an action list without changing what replaying it produces: only the last `visit` per track
 * matters, repeated step marks collapse, and each checkbox / lesson completion keeps its last value.
 * Completions, ticks and finished steps are never dropped, however long the outage.
 */
function compactEdits(edits: readonly Edit[]): Edit[] {
  const out = new Map<string, Edit>();
  for (const e of edits) {
    const key = e.k === 'visit' ? `v:${e.l.slice(0, e.l.indexOf('/'))}` : e.k === 'step' ? `s:${e.l}|${e.s}` : e.k === 'check' ? `c:${e.l}|${e.i}` : `d:${e.l}`;
    if (e.k === 'step' && out.has(key)) continue;
    out.delete(key);
    out.set(key, e);
  }
  return [...out.values()];
}

function loadPending(userId: string | null | undefined, ids: readonly string[]): Edit[] {
  try {
    const raw = window.localStorage.getItem(pendingKey(userId));
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    const ok = new Set(ids);
    return compactEdits(arr.slice(-MAX_PENDING).filter((e): e is Edit => !!e && typeof e === 'object' && ok.has((e as Edit).l) && (
      ((e.k === 'visit' || e.k === 'step') && typeof e.s === 'string' && e.s.length > 0 && e.s.length <= 80)
      || (e.k === 'check' && Number.isInteger(e.i) && typeof e.c === 'boolean')
      || (e.k === 'complete' && typeof e.d === 'boolean')
    )));
  } catch {
    return [];
  }
}
function savePending(userId: string | null | undefined, edits: readonly Edit[]) {
  try {
    if (edits.length) window.localStorage.setItem(pendingKey(userId), JSON.stringify(compactEdits(edits).slice(-MAX_PENDING)));
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
  // edits loaded from this browser's per-user (or guest) copy at mount, kept apart from `pending` so compaction can merge both
  const persisted = useRef<Edit[]>([]);
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
        let parseFailed = false;
        if (ok) {
          // the account already holds newer progress (another device saved meanwhile): adopt it
          // without losing what this device did, and send the combined copy back
          type StaleBody = { stale?: boolean; progress?: unknown };
          let body = null as StaleBody | null;
          try {
            body = (await res.json()) as StaleBody;
          } catch {
            parseFailed = true; // a 200 we cannot read is not a confirmed save: retry
          }
          if (disposed.current) return;
          if (body?.stale && body.progress) {
            const theirs = sanitizeCourseProgress(body.progress, idsRef.current);
            const merged = unionCourseProgress(latest.current, theirs);
            if (!sameCourseProgress(merged, latest.current)) {
              latest.current = merged;
              setProgress(merged);
              saveCourseLocal(merged);
              if (!sameCourseProgress(merged, theirs)) again.current = true;
            }
          }
        }
        if (parseFailed) ok = false;
        // 4xx other than timeout / rate limit will not succeed by repeating the same request
        retryable = parseFailed || (!ok && (res.status >= 500 || res.status === 408 || res.status === 429));
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
    // A browser copy tagged as another account's is not shown to this visitor, signed-out visitors
    // included (an untagged copy is the guest copy).
    const taggedOwner = loadCourseOwner();
    const tagged = !!taggedOwner && taggedOwner !== userRef.current;
    const fullLocal = loadCourseLocal(idsRef.current);
    const local = tagged ? emptyCourseProgress() : fullLocal;
    const key = userRef.current;
    persisted.current = syncRemote ? loadPending(key, idsRef.current) : [];
    pending.current = [];
    setProgress(persisted.current.reduce((p, e) => editFn(e)(p, Date.now()), local));
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
          // Signed out: kept guest edits join the browser copy. A signed-in user who lost the session (401)
          // keeps their own kept edits in storage; only edits made this visit are merged.
          const guest = !key;
          const all = res.status === 401 && !guest ? pending.current : [...persisted.current, ...pending.current];
          pending.current = [];
          const shown = all.reduce((p, e) => editFn(e)(p, Date.now()), local);
          latest.current = shown;
          setProgress(shown);
          if (all.length) {
            if (tagged) clearCourseOwner(); // the shared copy no longer belongs to that account
            saveCourseLocal(shown);
            if (guest || res.status !== 401) savePending(key, []);
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
        const base = mergeCourseProgress(foreign ? emptyCourseProgress() : key ? local : fullLocal, remote);
        // edits kept from an earlier visit only count when this really is the same account
        const mismatch = persisted.current.length > 0 && !!owner && owner !== key;
        const edits = compactEdits(mismatch ? pending.current : [...persisted.current, ...pending.current]);
        pending.current = [];
        hydrated.current = true;
        const merged = edits.reduce((p, e) => editFn(e)(p, Date.now()), base);
        if (owner) saveCourseOwner(owner);
        latest.current = merged; // a save queued right now must read this, not the previous render's state
        setProgress(merged);
        saveCourseLocal(merged); // now in the owner-tagged browser copy, so the per-user pending copy can go
        if (!mismatch) savePending(key, []);
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
        pending.current = compactEdits([...pending.current, edit]);
        savePending(userRef.current, [...persisted.current, ...pending.current]);
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

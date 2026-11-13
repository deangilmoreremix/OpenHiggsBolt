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
  visitStep,
  type CourseProgress,
} from '@/lib/academyCourseProgress';

/** local = browser only (signed out, or the account store is not available yet) */
export type CourseSyncState = 'local' | 'syncing' | 'saved' | 'offline';

const ENDPOINT = '/api/academy/progress';
/** Backoff between attempts to reach the account after a failed first load (the last value repeats). */
const RETRY_MS = [2000, 5000, 15000, 30000];

/**
 * Academy course progress. Always works from the browser; when the learner is
 * signed in it also saves to their account so it follows them across devices.
 * Same engine as the reseller course's hook: local-first hydrate, edits made
 * before the account copy arrives are replayed on top of it, one save at a
 * time, and a browser copy that belongs to another account is never shared.
 *
 * `syncRemote` can be turned off (tests / previews).
 */
export function useCourseProgress(lessonIds: readonly string[], syncRemote = true) {
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
  const pending = useRef<Array<(p: CourseProgress, now: number) => CourseProgress>>([]);
  // signed out, or the account store is not available: stay browser-only without error noise
  const remoteOff = useRef(!syncRemote);

  const sending = useRef(false);
  const again = useRef(false);
  // a save failed and has not been retried successfully yet (the state in `latest` is still unsaved)
  const dirty = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttempt = useRef(0);
  const flush = useCallback(async () => {
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
        const res = await fetch(ENDPOINT, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ progress: latest.current }),
        });
        ok = res.ok;
        // 4xx other than timeout / rate limit will not succeed by repeating the same request
        retryable = !ok && (res.status >= 500 || res.status === 408 || res.status === 429);
      } while (again.current);
      dirty.current = !ok;
      if (ok) retryAttempt.current = 0;
      setSync(ok ? 'saved' : 'offline');
    } catch {
      dirty.current = true;
      retryable = true;
      setSync('offline');
    } finally {
      sending.current = false;
    }
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
    const local = loadCourseLocal(idsRef.current);
    setProgress(local);
    // browser-only: local progress is the whole truth. Signed in: `ready` waits until the account
    // copy has settled, so resume/visit never run against empty local state and clobber the saved place.
    if (!syncRemote) {
      setReady(true);
      return;
    }
    const hydrate = async () => {
      try {
        const res = await fetch(ENDPOINT, { cache: 'no-store' });
        if (res.status === 401 || res.status === 404 || res.status === 503) {
          // signed out, or the progress table is not set up yet: browser-only, replay edits locally
          if (cancelled) return;
          remoteOff.current = true;
          hydrated.current = true;
          const edits = pending.current;
          pending.current = [];
          if (edits.length) saveCourseLocal(latest.current);
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
        const edits = pending.current;
        pending.current = [];
        hydrated.current = true;
        const merged = edits.reduce((p, fn) => fn(p, Date.now()), base);
        if (owner) saveCourseOwner(owner);
        latest.current = merged; // a save queued right now must read this, not the previous render's state
        setProgress(merged);
        saveCourseLocal(merged);
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
      if (!dirty.current || !hydrated.current || remoteOff.current || sending.current) return;
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

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (retryTimer.current) clearTimeout(retryTimer.current);
  }, []);

  const apply = useCallback(
    (fn: (p: CourseProgress, now: number) => CourseProgress) => {
      if (!hydrated.current) {
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
    visit: (lessonId: string, stepId: string) => apply((p, n) => visitStep(p, lessonId, stepId, n)),
    stepDone: (lessonId: string, stepId: string) => apply((p, n) => markStepDone(p, lessonId, stepId, n)),
    check: (lessonId: string, index: number) => {
      // capture the learner's intent now, so replaying it after hydration sets (not flips) the box
      const checked = !(latest.current.checks[lessonId] ?? []).includes(index);
      apply((p, n) => setCourseCheck(p, lessonId, index, checked, n));
    },
    complete: (lessonId: string, done: boolean) => apply((p, n) => setCourseLessonComplete(p, lessonId, done, n)),
  };
}

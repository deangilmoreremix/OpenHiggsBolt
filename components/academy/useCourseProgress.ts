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
    const local = loadCourseLocal(idsRef.current);
    setProgress(local);
    setReady(true);
    if (!syncRemote) return;
    (async () => {
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
        setProgress(merged);
        saveCourseLocal(merged);
        if (edits.length > 0 || (base !== remote && base.updatedAt > 0)) push(merged);
        else setSync('saved');
      } catch {
        if (cancelled) return;
        hydrated.current = true;
        pending.current = [];
        saveCourseLocal(latest.current);
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

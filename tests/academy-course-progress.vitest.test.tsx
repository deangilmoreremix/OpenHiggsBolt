// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { useCourseProgress } from '@/components/academy/useCourseProgress';
import {
  COURSE_OWNER_KEY, COURSE_STORAGE_KEY, courseContinueTarget, hasStarted, emptyCourseProgress, firstUndoneStep, lessonPercent, markStepDone,
  mergeCourseProgress, sameCourseProgress, checksKey, overallPercent, sanitizeCourseProgress, setCourseCheck, setCourseLessonComplete, visitStep,
} from '@/lib/academyCourseProgress';

const IDS = ['ugc/01-a', 'ugc/02-b', '02-ai-filmmaking/01-c'];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('course progress helpers', () => {
  it('sanitizes untrusted input and drops unknown lessons, bad indexes and oversized ids', () => {
    const p = sanitizeCourseProgress({ updatedAt: 7.9, last: { ugc: { lessonId: 'nope/x', stepId: 'x', at: 1 }, '02-ai-filmmaking': { lessonId: 'ugc/01-a', stepId: 's', at: 1 }, bad: 5 }, completedLessons: ['ugc/01-a', 'zzz', 'ugc/01-a'], stepsDone: { 'ugc/01-a': ['s1', 's1', 5, 'x'.repeat(200)], bad: ['s'] }, checks: { 'ugc/01-a': [2, 0, -1, 99, 'a', 2] } }, IDS);
    expect(p.updatedAt).toBe(7);
    expect(p.last).toEqual({}); // unknown lessons and a lesson filed under the wrong track are dropped
    expect(p.completedLessons).toEqual(['ugc/01-a']);
    expect(p.stepsDone).toEqual({}); // 'ugc/01-a' is completed, so its per-step detail is dropped
    expect(p.checks).toEqual({ 'ugc/01-a': [0, 2] });
    expect(sanitizeCourseProgress('junk', IDS)).toEqual(emptyCourseProgress());
  });
  it('visiting, finishing steps, ticking and completing are idempotent and move the clock forward', () => {
    let p = emptyCourseProgress();
    const v = visitStep(p, 'ugc/01-a', 'intro', 100);
    expect(v.last.ugc).toMatchObject({ lessonId: 'ugc/01-a', stepId: 'intro' });
    expect(visitStep(v, 'ugc/01-a', 'intro', 200)).toBe(v);
    p = markStepDone(v, 'ugc/01-a', 'intro', 100);
    expect(markStepDone(p, 'ugc/01-a', 'intro', 300)).toBe(p);
    p = setCourseCheck(p, 'ugc/01-a', 1, true, 100);
    expect(setCourseCheck(p, 'ugc/01-a', 1, true, 400)).toBe(p);
    expect(setCourseCheck(p, 'ugc/01-a', 1, false, 500).checks).toEqual({});
    p = setCourseLessonComplete(p, 'ugc/01-a', true, 100);
    expect(p.completedLessons).toEqual(['ugc/01-a']);
    expect(p.updatedAt).toBeGreaterThan(v.updatedAt);
  });
  it('each track remembers its own place: visiting one never overwrites another', () => {
    let p = visitStep(emptyCourseProgress(), '02-ai-filmmaking/01-c', 'concept', 10);
    p = visitStep(p, 'ugc/01-a', 'overview', 20);
    expect(p.last['02-ai-filmmaking']).toMatchObject({ lessonId: '02-ai-filmmaking/01-c', stepId: 'concept' });
    expect(p.last.ugc).toMatchObject({ lessonId: 'ugc/01-a' });
    // continue within one area picks that area's most recent position
    expect(courseContinueTarget(p, ['02-ai-filmmaking/01-c'])).toEqual({ lessonId: '02-ai-filmmaking/01-c', stepId: 'concept' });
    expect(courseContinueTarget(p, IDS)?.lessonId).toBe('ugc/01-a');
    expect(hasStarted(p, ['ugc/02-b'])).toBe(false);
    expect(hasStarted(p, IDS)).toBe(true);
  });
  it('percentages and the continue target', () => {
    let p = emptyCourseProgress();
    expect(courseContinueTarget(p, IDS)).toEqual({ lessonId: 'ugc/01-a', stepId: null });
    p = visitStep(p, 'ugc/02-b', 'concept', 10);
    expect(courseContinueTarget(p, IDS)).toEqual({ lessonId: 'ugc/02-b', stepId: 'concept' });
    p = markStepDone(p, 'ugc/02-b', 'intro', 11);
    expect(lessonPercent(p, 'ugc/02-b', 4)).toBe(25);
    p = setCourseLessonComplete(p, 'ugc/02-b', true, 12);
    expect(lessonPercent(p, 'ugc/02-b', 4)).toBe(100);
    expect(courseContinueTarget(p, IDS)).toEqual({ lessonId: 'ugc/01-a', stepId: null });
    expect(overallPercent(p, IDS)).toBe(33);
    expect(firstUndoneStep(markStepDone(emptyCourseProgress(), 'ugc/01-a', 'a', 1), 'ugc/01-a', ['a', 'b'])).toBe('b');
  });
  it('merge is last-write-wins and the account wins ties', () => {
    const a = { ...emptyCourseProgress(), updatedAt: 5 };
    const b = { ...emptyCourseProgress(), updatedAt: 5, last: { ugc: { lessonId: 'ugc/01-a', stepId: 's', at: 5 } } };
    expect(mergeCourseProgress(a, b)).toBe(b);
    expect(mergeCourseProgress({ ...a, updatedAt: 9 }, b).updatedAt).toBe(9);
    expect(mergeCourseProgress(a, null)).toBe(a);
  });
});

describe('checklist tick keys', () => {
  it('the first checklist step keeps the lesson key; later ones are namespaced and kept apart', () => {
    expect(checksKey('ugc/01-a', 'check-yourself', 'check-yourself')).toBe('ugc/01-a');
    expect(checksKey('ugc/01-a', 'check-your-work', 'check-yourself')).toBe('ugc/01-a#check-your-work');
    let p = setCourseCheck(emptyCourseProgress(), checksKey('ugc/01-a', 'check-yourself', 'check-yourself'), 0, true, 1);
    p = setCourseCheck(p, checksKey('ugc/01-a', 'check-your-work', 'check-yourself'), 0, true, 2);
    p = setCourseCheck(p, checksKey('ugc/01-a', 'check-your-work', 'check-yourself'), 0, false, 3);
    expect(p.checks).toEqual({ 'ugc/01-a': [0] }); // ticking and unticking step 2 never touches step 1
    const q = setCourseCheck(p, 'ugc/01-a#check-your-work', 2, true, 4);
    expect(sanitizeCourseProgress(q, IDS).checks).toEqual({ 'ugc/01-a': [0], 'ugc/01-a#check-your-work': [2] });
    // unknown lessons and empty/oversized suffixes are still dropped
    expect(sanitizeCourseProgress({ checks: { 'zzz#x': [0], 'ugc/01-a#': [0], ['ugc/01-a#' + 'x'.repeat(100)]: [0] } }, IDS).checks).toEqual({});
  });
});

describe('sameCourseProgress', () => {
  it('compares structurally, ignoring key order', () => {
    const a = { ...emptyCourseProgress(), checks: { x: [1], y: [2] }, stepsDone: { p: ['a'], q: ['b'] } };
    const b = { ...emptyCourseProgress(), stepsDone: { q: ['b'], p: ['a'] }, checks: { y: [2], x: [1] } };
    expect(sameCourseProgress(a, b)).toBe(true);
    expect(sameCourseProgress(a, { ...b, checks: { y: [2], x: [1, 3] } })).toBe(false);
  });
});

describe('useCourseProgress', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => { localStorage.clear(); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  const isPut = (c: unknown[]) => (c[1] as RequestInit | undefined)?.method === 'PUT';

  it('remembers where the learner is in the browser and restores it after a reload', async () => {
    fetchMock.mockResolvedValue(json({ error: 'UNAUTHENTICATED' }, 401));
    const first = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(first.result.current.sync).toBe('local'));
    act(() => { first.result.current.visit('ugc/02-b', 'do-it'); first.result.current.stepDone('ugc/02-b', 'concept'); });
    expect(JSON.parse(localStorage.getItem(COURSE_STORAGE_KEY)!).last.ugc.stepId).toBe('do-it');
    first.unmount();
    const second = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(second.result.current.ready).toBe(true));
    expect(second.result.current.progress.last.ugc).toMatchObject({ lessonId: 'ugc/02-b', stepId: 'do-it' });
    expect(second.result.current.progress.stepsDone['ugc/02-b']).toEqual(['concept']);
  });

  it('signed out (401) or route unavailable (404): browser only, never tries to save to the account', async () => {
    for (const status of [401, 404]) {
      fetchMock.mockReset();
      fetchMock.mockResolvedValue(json({}, status));
      const { result, unmount } = renderHook(() => useCourseProgress(IDS, true));
      await waitFor(() => expect(result.current.sync).toBe('local'));
      act(() => result.current.complete('ugc/01-a', true));
      await new Promise((r) => setTimeout(r, 800));
      expect(fetchMock.mock.calls.some(isPut)).toBe(false);
      expect(result.current.progress.completedLessons).toEqual(['ugc/01-a']);
      unmount();
      localStorage.clear();
    }
  });

  it('keeps work done while the first account request is pending and replays it on top', async () => {
    let release!: (r: Response) => void;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => (init?.method === 'PUT' ? Promise.resolve(json({ ok: true })) : new Promise<Response>((res) => { release = res; })));
    const { result } = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    act(() => result.current.visit('ugc/02-b', 'concept')); // before the account copy arrived
    const saved = setCourseLessonComplete(emptyCourseProgress(), 'ugc/01-a', true, 4000);
    await act(async () => { release(json({ progress: saved, owner: 'userA' })); });
    await waitFor(() => expect(fetchMock.mock.calls.some(isPut)).toBe(true), { timeout: 3000 });
    expect(result.current.progress.completedLessons).toEqual(['ugc/01-a']);
    expect(result.current.progress.last.ugc.lessonId).toBe('ugc/02-b');
    const sent = JSON.parse(((fetchMock.mock.calls.find(isPut)![1]) as RequestInit).body as string).progress;
    expect(sent.completedLessons).toEqual(['ugc/01-a']);
    expect(sent.last.ugc.stepId).toBe('concept');
  });

  it('signed in: not ready until the account copy has settled, so resume never runs on empty local state', async () => {
    let release!: (r: Response) => void;
    fetchMock.mockImplementation(() => new Promise<Response>((res) => { release = res; }));
    const { result } = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.ready).toBe(false);
    const saved = visitStep(emptyCourseProgress(), 'ugc/02-b', 'do-it', 4000);
    await act(async () => { release(json({ progress: saved, owner: 'userA' })); });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.progress.last.ugc.stepId).toBe('do-it');
  });

  it('ready also settles when the account request fails or the learner is signed out', async () => {
    fetchMock.mockRejectedValue(new Error('net'));
    const a = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(a.result.current.ready).toBe(true));
    a.unmount();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(json({}, 401));
    const b = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(b.result.current.ready).toBe(true));
    b.unmount();
    const c = renderHook(() => useCourseProgress(IDS, false));
    await waitFor(() => expect(c.result.current.ready).toBe(true));
  });

  it('uploads newer browser progress when the account copy is missing', async () => {
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(setCourseLessonComplete(emptyCourseProgress(), 'ugc/01-a', true, 5000)));
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => Promise.resolve(init?.method === 'PUT' ? json({ ok: true }) : json({ progress: null, owner: 'userA' })));
    const { result } = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(fetchMock.mock.calls.some(isPut)).toBe(true), { timeout: 3000 });
    await waitFor(() => expect(result.current.sync).toBe('saved'));
  });

  it('never gives one account the browser progress of another', async () => {
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(setCourseLessonComplete(emptyCourseProgress(), 'ugc/01-a', true, 9000)));
    localStorage.setItem(COURSE_OWNER_KEY, 'userA');
    fetchMock.mockResolvedValue(json({ progress: null, owner: 'userB' }));
    const { result } = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(result.current.sync).toBe('saved'));
    expect(result.current.progress.completedLessons).toEqual([]);
    expect(localStorage.getItem(COURSE_OWNER_KEY)).toBe('userB');
    expect(fetchMock.mock.calls.some(isPut)).toBe(false);
  });

  it('replays a checkbox as set, not flip, after the account copy loads', async () => {
    let release!: (r: Response) => void;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => (init?.method === 'PUT' ? Promise.resolve(json({ ok: true })) : new Promise<Response>((res) => { release = res; })));
    const { result } = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    act(() => result.current.check('ugc/01-a', 0));
    const remote = setCourseCheck({ ...emptyCourseProgress(), updatedAt: 4000 }, 'ugc/01-a', 0, true, 4000);
    await act(async () => { release(json({ progress: remote, owner: 'userA' })); });
    await waitFor(() => expect(result.current.sync).not.toBe('local'));
    expect(result.current.progress.checks['ugc/01-a']).toEqual([0]);
  });

  it('another account\'s browser copy is never uploaded when the first account request fails; normal after a later success', async () => {
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(setCourseLessonComplete(emptyCourseProgress(), 'ugc/01-a', true, Date.now() + 10_000)));
    localStorage.setItem(COURSE_OWNER_KEY, 'userA');
    let gets = 0;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return Promise.resolve(json({ ok: true }));
      gets++;
      return Promise.resolve(gets === 1 ? json({ error: 'x' }, 500) : json({ progress: null, owner: 'userB' }));
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { result } = renderHook(() => useCourseProgress(IDS, true));
      await waitFor(() => expect(result.current.sync).toBe('offline'));
      act(() => result.current.visit('ugc/02-b', 'concept')); // B works while the account is unreachable
      await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
      expect(fetchMock.mock.calls.some(isPut)).toBe(false);
      // retry succeeds: A's copy is dropped, B's own edit is kept and saved to B's account
      await act(async () => { await vi.advanceTimersByTimeAsync(2500); });
      await waitFor(() => expect(fetchMock.mock.calls.some(isPut)).toBe(true));
      const sent = JSON.parse(((fetchMock.mock.calls.find(isPut)![1]) as RequestInit).body as string).progress;
      expect(sent.completedLessons).toEqual([]);
      expect(sent.last.ugc.stepId).toBe('concept');
      expect(localStorage.getItem(COURSE_OWNER_KEY)).toBe('userB');
    } finally {
      vi.useRealTimers();
    }
  });

  it('a failed save is kept and retried when connectivity returns, with no further edits needed', async () => {
    let putFails = true;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => {
      if (init?.method !== 'PUT') return Promise.resolve(json({ progress: null, owner: 'userA' }));
      return putFails ? Promise.reject(new Error('offline')) : Promise.resolve(json({ ok: true }));
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { result } = renderHook(() => useCourseProgress(IDS, true));
      await waitFor(() => expect(result.current.sync).toBe('saved'));
      act(() => result.current.complete('ugc/01-a', true));
      await act(async () => { await vi.advanceTimersByTimeAsync(700); });
      await waitFor(() => expect(result.current.sync).toBe('offline'));
      const puts = () => fetchMock.mock.calls.filter(isPut).length;
      expect(puts()).toBe(1);
      // connectivity returns: the unsaved completion is sent, nothing else was edited
      putFails = false;
      await act(async () => { window.dispatchEvent(new Event('online')); });
      await waitFor(() => expect(result.current.sync).toBe('saved'));
      expect(puts()).toBe(2);
      expect(JSON.parse((fetchMock.mock.calls.filter(isPut)[1][1] as RequestInit).body as string).progress.completedLessons).toEqual(['ugc/01-a']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a failed save also retries by itself with backoff, and stops once it is saved', async () => {
    let fails = 2;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => {
      if (init?.method !== 'PUT') return Promise.resolve(json({ progress: null, owner: 'userA' }));
      return fails-- > 0 ? Promise.resolve(json({ error: 'x' }, 503)) : Promise.resolve(json({ ok: true }));
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { result, unmount } = renderHook(() => useCourseProgress(IDS, true));
      await waitFor(() => expect(result.current.sync).toBe('saved'));
      act(() => result.current.complete('ugc/01-a', true));
      await act(async () => { await vi.advanceTimersByTimeAsync(700); });
      expect(fetchMock.mock.calls.filter(isPut).length).toBe(1);
      await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
      expect(fetchMock.mock.calls.filter(isPut).length).toBe(2);
      await act(async () => { await vi.advanceTimersByTimeAsync(5100); });
      await waitFor(() => expect(result.current.sync).toBe('saved'));
      expect(fetchMock.mock.calls.filter(isPut).length).toBe(3);
      await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
      expect(fetchMock.mock.calls.filter(isPut).length).toBe(3); // no further retries once saved
      unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('edits made while the account is unreachable survive a reload, stay private to that user, and sync once', async () => {
    let getOk = false;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return Promise.resolve(json({ ok: true }));
      return Promise.resolve(getOk ? json({ progress: null, owner: 'userB' }) : json({ error: 'x' }, 500));
    });
    const puts = () => fetchMock.mock.calls.filter(isPut);
    const first = renderHook(() => useCourseProgress(IDS, true, 'userB'));
    await waitFor(() => expect(first.result.current.sync).toBe('offline'));
    act(() => first.result.current.complete('ugc/01-a', true));
    first.unmount();
    // reload while still offline: the work is still shown, nothing uploaded
    const second = renderHook(() => useCourseProgress(IDS, true, 'userB'));
    await waitFor(() => expect(second.result.current.sync).toBe('offline'));
    expect(second.result.current.progress.completedLessons).toEqual(['ugc/01-a']);
    expect(puts().length).toBe(0);
    second.unmount();
    // a different account on the same browser never sees or uploads it
    const other = renderHook(() => useCourseProgress(IDS, true, 'userC'));
    await waitFor(() => expect(other.result.current.sync).toBe('offline'));
    expect(other.result.current.progress.completedLessons).toEqual([]);
    other.unmount();
    // the account answers: B's edit is sent once and the pending copy is cleared
    getOk = true;
    const third = renderHook(() => useCourseProgress(IDS, true, 'userB'));
    await waitFor(() => expect(puts().length).toBe(1), { timeout: 3000 });
    expect(JSON.parse((puts()[0][1] as RequestInit).body as string).progress.completedLessons).toEqual(['ugc/01-a']);
    expect(Object.keys(localStorage).filter((k) => k.includes('pending'))).toEqual([]);
    third.unmount();
    // ...and as C afterwards: nothing of B's is visible or uploaded
    const c = renderHook(() => useCourseProgress(IDS, true, 'userC'));
    await waitFor(() => expect(c.result.current.ready).toBe(true));
    expect(c.result.current.progress.completedLessons).toEqual([]);
    await new Promise((r) => setTimeout(r, 800));
    expect(puts().length).toBe(1);
  });

  it('a 503 from the account store is transient: it retries and then syncs instead of going browser-only', async () => {
    let gets = 0;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return Promise.resolve(json({ ok: true }));
      gets++;
      return Promise.resolve(gets === 1 ? json({ error: 'STORE_UNAVAILABLE' }, 503) : json({ progress: null, owner: 'userA' }));
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { result } = renderHook(() => useCourseProgress(IDS, true, 'userA'));
      await waitFor(() => expect(result.current.sync).toBe('offline'));
      await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
      await waitFor(() => expect(result.current.sync).toBe('saved'));
      act(() => result.current.complete('ugc/01-a', true));
      await act(async () => { await vi.advanceTimersByTimeAsync(700); });
      await waitFor(() => expect(fetchMock.mock.calls.some(isPut)).toBe(true));
    } finally {
      vi.useRealTimers();
    }
  });

  it('a hung save times out and is retried instead of blocking every later save', async () => {
    let hang = true;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => {
      if (init?.method !== 'PUT') return Promise.resolve(json({ progress: null, owner: 'userA' }));
      if (!hang) return Promise.resolve(json({ ok: true }));
      return new Promise<Response>((_res, rej) => init.signal?.addEventListener('abort', () => rej(new Error('aborted'))));
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { result } = renderHook(() => useCourseProgress(IDS, true, 'userA'));
      await waitFor(() => expect(result.current.sync).toBe('saved'));
      act(() => result.current.complete('ugc/01-a', true));
      await act(async () => { await vi.advanceTimersByTimeAsync(700); });
      expect(fetchMock.mock.calls.filter(isPut).length).toBe(1);
      hang = false;
      await act(async () => { await vi.advanceTimersByTimeAsync(20000); }); // timeout, then the backoff retry
      await waitFor(() => expect(result.current.sync).toBe('saved'));
      expect(fetchMock.mock.calls.filter(isPut).length).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a stale save response brings in newer progress from another device and keeps this device\'s own', async () => {
    const other = setCourseLessonComplete(emptyCourseProgress(), 'ugc/02-b', true, Date.now() + 5000);
    let puts = 0;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => {
      if (init?.method !== 'PUT') return Promise.resolve(json({ progress: null, owner: 'userA' }));
      puts++;
      return Promise.resolve(puts === 1 ? json({ ok: true, stale: true, progress: other }) : json({ ok: true }));
    });
    const { result } = renderHook(() => useCourseProgress(IDS, true, 'userA'));
    await waitFor(() => expect(result.current.sync).toBe('saved'));
    act(() => result.current.complete('ugc/01-a', true));
    await waitFor(() => expect(result.current.progress.completedLessons.sort()).toEqual(['ugc/01-a', 'ugc/02-b']), { timeout: 3000 });
    await waitFor(() => expect(puts).toBe(2), { timeout: 3000 }); // the union is sent back so the account has both
    const last = JSON.parse((fetchMock.mock.calls.filter(isPut)[1][1] as RequestInit).body as string).progress;
    expect(last.completedLessons.sort()).toEqual(['ugc/01-a', 'ugc/02-b']);
  });

  it('after unmount a pending save that fails or times out is not retried and leaves no timer behind', async () => {
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => {
      if (init?.method !== 'PUT') return Promise.resolve(json({ progress: null, owner: 'userA' }));
      return new Promise<Response>((_res, rej) => init.signal?.addEventListener('abort', () => rej(new Error('aborted'))));
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { result, unmount } = renderHook(() => useCourseProgress(IDS, true, 'userA'));
      await waitFor(() => expect(result.current.sync).toBe('saved'));
      act(() => result.current.complete('ugc/01-a', true));
      await act(async () => { await vi.advanceTimersByTimeAsync(700); });
      expect(fetchMock.mock.calls.filter(isPut).length).toBe(1); // the save is in flight
      unmount();
      await act(async () => { await vi.advanceTimersByTimeAsync(120000); });
      expect(fetchMock.mock.calls.filter(isPut).length).toBe(1);
      expect(vi.getTimerCount()).toBe(0);
      window.dispatchEvent(new Event('online'));
      await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
      expect(fetchMock.mock.calls.filter(isPut).length).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a long outage keeps every completion, tick and finished step across a reload (the queue is compacted, not truncated)', async () => {
    const MANY = Array.from({ length: 200 }, (_, i) => `ugc/l${String(i).padStart(3, '0')}`);
    fetchMock.mockResolvedValue(json({ error: 'x' }, 500));
    const first = renderHook(() => useCourseProgress(MANY, true, 'userB'));
    await waitFor(() => expect(first.result.current.sync).toBe('offline'));
    act(() => {
      MANY.forEach((id) => {
        first.result.current.visit(id, 'a');
        first.result.current.stepDone(id, 'a');
        first.result.current.stepDone(id, 'b');
        first.result.current.stepDone(id, 'c');
        first.result.current.check(id, 0);
        first.result.current.complete(id, true);
      });
      // repeated automatic step visits must not crowd anything out
      for (let n = 0; n < 300; n++) first.result.current.visit(MANY[n % 200], `s${n}`);
      MANY.slice(0, 3).forEach((id) => first.result.current.check(id, 1));
    });
    first.unmount();
    const second = renderHook(() => useCourseProgress(MANY, true, 'userB'));
    await waitFor(() => expect(second.result.current.sync).toBe('offline'));
    expect(second.result.current.progress.completedLessons.length).toBe(200);
    expect(second.result.current.progress.checks[MANY[0]]).toEqual([0, 1]);
    expect(second.result.current.progress.checks[MANY[199]]).toEqual([0]);
  });

  it('a malformed 200 body to a save is a retryable failure, not a silent success', async () => {
    let puts = 0;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => {
      if (init?.method !== 'PUT') return Promise.resolve(json({ progress: null, owner: 'userA' }));
      puts++;
      return Promise.resolve(puts === 1 ? new Response('<html>oops', { status: 200 }) : json({ ok: true }));
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { result } = renderHook(() => useCourseProgress(IDS, true, 'userA'));
      await waitFor(() => expect(result.current.sync).toBe('saved'));
      act(() => result.current.complete('ugc/01-a', true));
      await act(async () => { await vi.advanceTimersByTimeAsync(700); });
      await waitFor(() => expect(result.current.sync).toBe('offline'));
      await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
      await waitFor(() => expect(result.current.sync).toBe('saved'));
      expect(puts).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('signed out: edits made before the first answer survive a reload and land in the browser copy on 401', async () => {
    let release!: (r: Response) => void;
    fetchMock.mockImplementation(() => new Promise<Response>((res) => { release = res; }));
    const first = renderHook(() => useCourseProgress(IDS, true, null));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    act(() => first.result.current.complete('ugc/01-a', true));
    first.unmount();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(json({ error: 'UNAUTHENTICATED' }, 401));
    const second = renderHook(() => useCourseProgress(IDS, true, null));
    await waitFor(() => expect(second.result.current.sync).toBe('local'));
    expect(second.result.current.progress.completedLessons).toEqual(['ugc/01-a']);
    expect(JSON.parse(localStorage.getItem(COURSE_STORAGE_KEY)!).completedLessons).toEqual(['ugc/01-a']);
    expect(Object.keys(localStorage).filter((k) => k.includes('pending'))).toEqual([]);
  });

  it('a signed-out visitor never sees progress tagged as another account\'s; an untagged copy is the guest copy', async () => {
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(setCourseLessonComplete(emptyCourseProgress(), 'ugc/01-a', true, 9000)));
    localStorage.setItem(COURSE_OWNER_KEY, 'userA');
    fetchMock.mockImplementation(() => new Promise<Response>(() => {})); // answer still pending
    const tagged = renderHook(() => useCourseProgress(IDS, true, null));
    expect(tagged.result.current.progress.completedLessons).toEqual([]);
    tagged.unmount();
    localStorage.removeItem(COURSE_OWNER_KEY);
    const guest = renderHook(() => useCourseProgress(IDS, true, null));
    expect(guest.result.current.progress.completedLessons).toEqual(['ugc/01-a']);
  });

  it('signed out with a copy tagged as account A\'s: the 401 hands the shared copy to the guest, so the guest\'s work survives a refresh and A\'s own copy is kept for A', async () => {
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(setCourseLessonComplete(emptyCourseProgress(), 'ugc/01-a', true, 9000)));
    localStorage.setItem(COURSE_OWNER_KEY, 'userA');
    fetchMock.mockResolvedValue(json({ error: 'UNAUTHENTICATED' }, 401));
    const first = renderHook(() => useCourseProgress(IDS, true, null));
    await waitFor(() => expect(first.result.current.sync).toBe('local'));
    expect(first.result.current.progress.completedLessons).toEqual([]);
    expect(localStorage.getItem(COURSE_OWNER_KEY)).toBeNull(); // no edits yet, and the tag is already no longer A's
    act(() => first.result.current.complete('ugc/02-b', true));
    first.unmount();
    const second = renderHook(() => useCourseProgress(IDS, true, null));
    await waitFor(() => expect(second.result.current.sync).toBe('local'));
    expect(second.result.current.progress.completedLessons).toEqual(['ugc/02-b']);
    second.unmount();
    // A signs in again: A's own browser copy comes back (it is not shown to the guest, nor lost)
    fetchMock.mockResolvedValue(json({ progress: null, owner: 'userA' }));
    const a = renderHook(() => useCourseProgress(IDS, true, 'userA'));
    await waitFor(() => expect(a.result.current.ready).toBe(true));
    expect(a.result.current.progress.completedLessons).toContain('ugc/01-a');
  });

  it('if A\'s copy cannot be parked, nothing is taken over: A\'s copy and tag stay and the guest\'s edits are kept, then it retries', async () => {
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(setCourseLessonComplete(emptyCourseProgress(), 'ugc/01-a', true, 9000)));
    localStorage.setItem(COURSE_OWNER_KEY, 'userA');
    fetchMock.mockResolvedValue(json({ error: 'UNAUTHENTICATED' }, 401));
    const real = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (k.includes(':account:')) throw new Error('quota');
      return real.call(this, k, v);
    });
    const first = renderHook(() => useCourseProgress(IDS, true, null));
    await waitFor(() => expect(first.result.current.sync).toBe('local'));
    act(() => first.result.current.complete('ugc/02-b', true));
    expect(localStorage.getItem(COURSE_OWNER_KEY)).toBe('userA');
    expect(JSON.parse(localStorage.getItem(COURSE_STORAGE_KEY)!).completedLessons).toEqual(['ugc/01-a']);
    expect(first.result.current.progress.completedLessons).toEqual(['ugc/02-b']);
    first.unmount();
    // storage works again: the guest's kept edit is still there and the takeover now succeeds
    spy.mockRestore();
    const second = renderHook(() => useCourseProgress(IDS, true, null));
    await waitFor(() => expect(second.result.current.sync).toBe('local'));
    expect(second.result.current.progress.completedLessons).toEqual(['ugc/02-b']);
    expect(localStorage.getItem(COURSE_OWNER_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem('academy-course-progress:v1:account:userA')!).completedLessons).toEqual(['ugc/01-a']);
  });

  it('a corrupt parked copy is left in place, not destroyed', async () => {
    const key = 'academy-course-progress:v1:account:userA';
    localStorage.setItem(key, '{"v":1,"updatedAt":9000,"completedLessons":["ugc/01');
    fetchMock.mockResolvedValue(json({ progress: null, owner: 'userA' }));
    const { result } = renderHook(() => useCourseProgress(IDS, true, 'userA'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(localStorage.getItem(key)).toBe('{"v":1,"updatedAt":9000,"completedLessons":["ugc/01');
  });

  it('a parked completion survives even when the account copy is newer', async () => {
    localStorage.setItem('academy-course-progress:v1:account:userA', JSON.stringify(setCourseLessonComplete(emptyCourseProgress(), 'ugc/01-a', true, 9000)));
    const remote = setCourseLessonComplete(emptyCourseProgress(), 'ugc/02-b', true, Date.now() + 10_000);
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => Promise.resolve(init?.method === 'PUT' ? json({ ok: true }) : json({ progress: remote, owner: 'userA' })));
    const { result } = renderHook(() => useCourseProgress(IDS, true, 'userA'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect([...result.current.progress.completedLessons].sort()).toEqual(['ugc/01-a', 'ugc/02-b']);
  });

  it('same account: a completion made while saves were failing survives a newer account copy and is sent back; another account\'s copy is never merged', async () => {
    const remoteOld = setCourseLessonComplete(emptyCourseProgress(), 'ugc/02-b', true, 1000);
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => (init?.method === 'PUT' ? Promise.reject(new Error('offline')) : Promise.resolve(json({ progress: remoteOld, owner: 'userA' }))));
    const first = renderHook(() => useCourseProgress(IDS, true, 'userA'));
    await waitFor(() => expect(first.result.current.sync).toBe('saved'));
    act(() => first.result.current.complete('ugc/01-a', true));
    await waitFor(() => expect(first.result.current.sync).toBe('offline'), { timeout: 3000 });
    first.unmount();
    // another device saved newer progress meanwhile
    const remote = setCourseLessonComplete(emptyCourseProgress(), 'ugc/02-b', true, Date.now() + 10_000);
    fetchMock.mockReset();
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => Promise.resolve(init?.method === 'PUT' ? json({ ok: true }) : json({ progress: remote, owner: 'userA' })));
    const { result } = renderHook(() => useCourseProgress(IDS, true, 'userA'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect([...result.current.progress.completedLessons].sort()).toEqual(['ugc/01-a', 'ugc/02-b']);
    await waitFor(() => expect(fetchMock.mock.calls.some(isPut)).toBe(true), { timeout: 3000 });
    expect([...JSON.parse(((fetchMock.mock.calls.find(isPut)![1]) as RequestInit).body as string).progress.completedLessons].sort()).toEqual(['ugc/01-a', 'ugc/02-b']);
    cleanup();
    // a copy tagged for another account is not mixed in
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(setCourseLessonComplete(emptyCourseProgress(), 'ugc/01-a', true, 5000)));
    localStorage.setItem(COURSE_OWNER_KEY, 'userA');
    fetchMock.mockReset();
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => Promise.resolve(init?.method === 'PUT' ? json({ ok: true }) : json({ progress: remote, owner: 'userB' })));
    const other = renderHook(() => useCourseProgress(IDS, true, 'userB'));
    await waitFor(() => expect(other.result.current.ready).toBe(true));
    expect(other.result.current.progress.completedLessons).toEqual(['ugc/02-b']);
  });

  it('a removal made on another device stays removed when an old browser snapshot is hydrated, and nothing is uploaded back', async () => {
    // device 1 completed the lesson and synced; this browser still holds that snapshot
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(setCourseCheck(setCourseLessonComplete(emptyCourseProgress(), 'ugc/01-a', true, 5000), 'ugc/02-b', 0, true, 5001)));
    localStorage.setItem(COURSE_OWNER_KEY, 'userA');
    // device 2 (same account) marked it not complete and unticked the box, and synced
    const remote = { ...emptyCourseProgress(), updatedAt: Date.now() + 10_000 };
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => Promise.resolve(init?.method === 'PUT' ? json({ ok: true }) : json({ progress: remote, owner: 'userA' })));
    const { result } = renderHook(() => useCourseProgress(IDS, true, 'userA'));
    await waitFor(() => expect(result.current.sync).toBe('saved'));
    expect(result.current.progress.completedLessons).toEqual([]);
    expect(result.current.progress.checks).toEqual({});
    await new Promise((r) => setTimeout(r, 800));
    expect(fetchMock.mock.calls.some(isPut)).toBe(false);
  });

  it('a successful save acknowledges the unsynced queue: those edits are not replayed again later', async () => {
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => Promise.resolve(init?.method === 'PUT' ? json({ ok: true }) : json({ progress: null, owner: 'userA' })));
    const first = renderHook(() => useCourseProgress(IDS, true, 'userA'));
    await waitFor(() => expect(first.result.current.sync).toBe('saved'));
    act(() => first.result.current.complete('ugc/01-a', true));
    await waitFor(() => expect(fetchMock.mock.calls.some(isPut)).toBe(true), { timeout: 3000 });
    await waitFor(() => expect(first.result.current.sync).toBe('saved'));
    expect(Object.keys(localStorage).filter((k) => k.includes('pending'))).toEqual([]);
  });

  it('a tick on a later checklist step is kept offline across a reload and stays apart from the first checklist', async () => {
    fetchMock.mockResolvedValue(json({ error: 'x' }, 500));
    const first = renderHook(() => useCourseProgress(IDS, true, 'userB'));
    await waitFor(() => expect(first.result.current.sync).toBe('offline'));
    act(() => { first.result.current.check('ugc/01-a', 0); first.result.current.check('ugc/01-a#check-your-work', 0); });
    first.unmount();
    const second = renderHook(() => useCourseProgress(IDS, true, 'userB'));
    await waitFor(() => expect(second.result.current.sync).toBe('offline'));
    expect(second.result.current.progress.checks).toEqual({ 'ugc/01-a': [0], 'ugc/01-a#check-your-work': [0] });
  });

  it('sends one save at a time with the latest state', async () => {
    const puts: { body: string; done: (r: Response) => void }[] = [];
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => {
      if (init?.method !== 'PUT') return Promise.resolve(json({ progress: null, owner: 'userA' }));
      return new Promise<Response>((res) => puts.push({ body: init.body as string, done: res }));
    });
    const { result } = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(result.current.sync).toBe('saved'));
    act(() => result.current.complete('ugc/01-a', true));
    await waitFor(() => expect(puts.length).toBe(1), { timeout: 3000 });
    act(() => result.current.complete('ugc/02-b', true));
    await new Promise((r) => setTimeout(r, 900));
    expect(puts.length).toBe(1);
    await act(async () => { puts[0].done(json({ ok: true })); });
    await waitFor(() => expect(puts.length).toBe(2), { timeout: 3000 });
    expect(JSON.parse(puts[1].body).progress.completedLessons).toEqual(['ugc/01-a', 'ugc/02-b']);
    await act(async () => { puts[1].done(json({ ok: true })); });
    await waitFor(() => expect(result.current.sync).toBe('saved'));
  });
});

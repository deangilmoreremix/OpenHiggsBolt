// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { useCourseProgress } from '@/components/academy/useCourseProgress';
import {
  COURSE_OWNER_KEY, COURSE_STORAGE_KEY, courseContinueTarget, emptyCourseProgress, firstUndoneStep, lessonPercent, markStepDone,
  mergeCourseProgress, overallPercent, sanitizeCourseProgress, setCourseCheck, setCourseLessonComplete, visitStep,
} from '@/lib/academyCourseProgress';

const IDS = ['ugc/01-a', 'ugc/02-b', '02-ai-filmmaking/01-c'];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('course progress helpers', () => {
  it('sanitizes untrusted input and drops unknown lessons, bad indexes and oversized ids', () => {
    const p = sanitizeCourseProgress({ updatedAt: 7.9, lastLessonId: 'nope', lastStepId: 'x', completedLessons: ['ugc/01-a', 'zzz', 'ugc/01-a'], stepsDone: { 'ugc/01-a': ['s1', 's1', 5, 'x'.repeat(200)], bad: ['s'] }, checks: { 'ugc/01-a': [2, 0, -1, 99, 'a', 2] } }, IDS);
    expect(p.updatedAt).toBe(7);
    expect(p.lastLessonId).toBeNull();
    expect(p.lastStepId).toBeNull();
    expect(p.completedLessons).toEqual(['ugc/01-a']);
    expect(p.stepsDone).toEqual({ 'ugc/01-a': ['s1'] });
    expect(p.checks).toEqual({ 'ugc/01-a': [0, 2] });
    expect(sanitizeCourseProgress('junk', IDS)).toEqual(emptyCourseProgress());
  });
  it('visiting, finishing steps, ticking and completing are idempotent and move the clock forward', () => {
    let p = emptyCourseProgress();
    const v = visitStep(p, 'ugc/01-a', 'intro', 100);
    expect(v.lastLessonId).toBe('ugc/01-a');
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
    const b = { ...emptyCourseProgress(), updatedAt: 5, lastLessonId: 'ugc/01-a' };
    expect(mergeCourseProgress(a, b)).toBe(b);
    expect(mergeCourseProgress({ ...a, updatedAt: 9 }, b).updatedAt).toBe(9);
    expect(mergeCourseProgress(a, null)).toBe(a);
  });
});

describe('useCourseProgress', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => { localStorage.clear(); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
  const isPut = (c: unknown[]) => (c[1] as RequestInit | undefined)?.method === 'PUT';

  it('remembers where the learner is in the browser and restores it after a reload', async () => {
    fetchMock.mockResolvedValue(json({ error: 'UNAUTHENTICATED' }, 401));
    const first = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(first.result.current.sync).toBe('local'));
    act(() => { first.result.current.visit('ugc/02-b', 'do-it'); first.result.current.stepDone('ugc/02-b', 'concept'); });
    expect(JSON.parse(localStorage.getItem(COURSE_STORAGE_KEY)!).lastStepId).toBe('do-it');
    first.unmount();
    const second = renderHook(() => useCourseProgress(IDS, true));
    await waitFor(() => expect(second.result.current.ready).toBe(true));
    expect(second.result.current.progress.lastLessonId).toBe('ugc/02-b');
    expect(second.result.current.progress.lastStepId).toBe('do-it');
    expect(second.result.current.progress.stepsDone['ugc/02-b']).toEqual(['concept']);
  });

  it('signed out (401) or table missing (503): browser only, never tries to save to the account', async () => {
    for (const status of [401, 503]) {
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
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.visit('ugc/02-b', 'concept')); // before the account copy arrived
    const saved = setCourseLessonComplete(emptyCourseProgress(), 'ugc/01-a', true, 4000);
    await act(async () => { release(json({ progress: saved, owner: 'userA' })); });
    await waitFor(() => expect(fetchMock.mock.calls.some(isPut)).toBe(true), { timeout: 3000 });
    expect(result.current.progress.completedLessons).toEqual(['ugc/01-a']);
    expect(result.current.progress.lastLessonId).toBe('ugc/02-b');
    const sent = JSON.parse(((fetchMock.mock.calls.find(isPut)![1]) as RequestInit).body as string).progress;
    expect(sent.completedLessons).toEqual(['ugc/01-a']);
    expect(sent.lastStepId).toBe('concept');
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
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.check('ugc/01-a', 0));
    const remote = setCourseCheck({ ...emptyCourseProgress(), updatedAt: 4000 }, 'ugc/01-a', 0, true, 4000);
    await act(async () => { release(json({ progress: remote, owner: 'userA' })); });
    await waitFor(() => expect(result.current.sync).not.toBe('local'));
    expect(result.current.progress.checks['ugc/01-a']).toEqual([0]);
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

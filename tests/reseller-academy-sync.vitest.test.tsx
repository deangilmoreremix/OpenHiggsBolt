// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { useAcademyProgress } from '@/components/reseller/academy/useAcademyProgress';
import { WORKSHOP_APP_IDS } from '@/lib/resellerAcademyApps';
import { PROGRESS_STORAGE_KEY, emptyProgress, setLessonComplete } from '@/lib/resellerAcademyProgress';

const OWNER_KEY = `${PROGRESS_STORAGE_KEY}:owner`;
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => { localStorage.clear(); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('academy progress sync (review fixes)', () => {
  it('keeps work done while the first account request is still pending', async () => {
    let release!: (r: Response) => void;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => (init?.method === 'PUT' ? Promise.resolve(json({ ok: true })) : new Promise<Response>((res) => { release = res; })));
    const { result } = renderHook(() => useAcademyProgress(true));
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.selectApp(WORKSHOP_APP_IDS[0]));
    const older = { ...emptyProgress(), updatedAt: 1 };
    await act(async () => { release(json({ progress: older, owner: 'userA' })); });
    await waitFor(() => expect(result.current.sync).not.toBe('local'));
    expect(result.current.progress.selectedAppId).toBe(WORKSHOP_APP_IDS[0]);
  });

  it('uploads newer browser progress when the account copy is older or missing', async () => {
    const local = setLessonComplete(emptyProgress(), '1.1', true, 5000);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(local));
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => Promise.resolve(init?.method === 'PUT' ? json({ ok: true }) : json({ progress: null, owner: 'userA' })));
    const { result } = renderHook(() => useAcademyProgress(true));
    await waitFor(() => expect(fetchMock.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'PUT')).toBe(true), { timeout: 3000 });
    const put = fetchMock.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === 'PUT')!;
    expect(JSON.parse((put[1] as RequestInit).body as string).progress.completedLessons).toEqual(['1.1']);
    await waitFor(() => expect(result.current.sync).toBe('saved'));
  });

  it('never gives one account the browser progress of another', async () => {
    const other = setLessonComplete(emptyProgress(), '1.1', true, 9000);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(other));
    localStorage.setItem(OWNER_KEY, 'userA');
    fetchMock.mockImplementation(() => Promise.resolve(json({ progress: null, owner: 'userB' })));
    const { result } = renderHook(() => useAcademyProgress(true));
    await waitFor(() => expect(result.current.sync).toBe('saved'));
    expect(result.current.progress.completedLessons).toEqual([]);
    expect(JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)!).completedLessons).toEqual([]);
    expect(localStorage.getItem(OWNER_KEY)).toBe('userB');
    expect(fetchMock.mock.calls.every((c) => (c[1] as RequestInit | undefined)?.method !== 'PUT')).toBe(true);
  });

  it('a first edit on a new browser does not wipe the account\'s saved progress', async () => {
    let release!: (r: Response) => void;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => (init?.method === 'PUT' ? Promise.resolve(json({ ok: true })) : new Promise<Response>((res) => { release = res; })));
    const { result } = renderHook(() => useAcademyProgress(true));
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.visit('1.2')); // edit before the account copy has arrived
    const saved = setLessonComplete(emptyProgress(), '1.1', true, 4000);
    await act(async () => { release(json({ progress: saved, owner: 'userA' })); });
    await waitFor(() => expect(fetchMock.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'PUT')).toBe(true), { timeout: 3000 });
    expect(result.current.progress.completedLessons).toEqual(['1.1']);
    expect(result.current.progress.lastLessonId).toBe('1.2');
    const put = fetchMock.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === 'PUT')!;
    const sent = JSON.parse((put[1] as RequestInit).body as string).progress;
    expect(sent.completedLessons).toEqual(['1.1']);
    expect(sent.lastLessonId).toBe('1.2');
  });

  it('replays what the learner chose for a checkbox, not a flip, after the account copy loads', async () => {
    let release!: (r: Response) => void;
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => (init?.method === 'PUT' ? Promise.resolve(json({ ok: true })) : new Promise<Response>((res) => { release = res; })));
    const { result } = renderHook(() => useAcademyProgress(true));
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.toggle('1.1', 0)); // the learner ticks box 0 on a new browser
    const remote = { ...emptyProgress(), updatedAt: 4000, checks: { '1.1': [0] } }; // already ticked on the account
    await act(async () => { release(json({ progress: remote, owner: 'userA' })); });
    await waitFor(() => expect(result.current.sync).not.toBe('local'));
    expect(result.current.progress.checks['1.1']).toEqual([0]);
  });

  it('sends one save at a time, so an older request cannot land after a newer one', async () => {
    const puts: { body: string; done: (r: Response) => void }[] = [];
    fetchMock.mockImplementation((_u: string, init?: RequestInit) => {
      if (init?.method !== 'PUT') return Promise.resolve(json({ progress: null, owner: 'userA' }));
      return new Promise<Response>((res) => puts.push({ body: init.body as string, done: res }));
    });
    const { result } = renderHook(() => useAcademyProgress(true));
    await waitFor(() => expect(result.current.sync).toBe('saved'));
    act(() => result.current.complete('1.1', true));
    await waitFor(() => expect(puts.length).toBe(1), { timeout: 3000 });
    act(() => result.current.complete('1.2', true)); // second edit while the first save is still in flight
    await new Promise((r) => setTimeout(r, 900));
    expect(puts.length).toBe(1); // the second save waits for the first
    await act(async () => { puts[0].done(json({ ok: true })); });
    await waitFor(() => expect(puts.length).toBe(2), { timeout: 3000 });
    expect(JSON.parse(puts[1].body).progress.completedLessons).toEqual(['1.1', '1.2']);
    await act(async () => { puts[1].done(json({ ok: true })); });
    await waitFor(() => expect(result.current.sync).toBe('saved'));
  });
});

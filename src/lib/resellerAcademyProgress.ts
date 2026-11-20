/**
 * Reseller Academy progress — EDUCATIONAL ACTIVITY ONLY.
 *
 * This module never imports, reads or writes entitlements. Nothing here can
 * grant, revoke or change anyone's access; access is decided solely by
 * `canAccessTraining` in src/lib/resellerAccess.ts (unchanged).
 *
 * State is stored in localStorage (always) and synced to the
 * `reseller_academy_progress` table through /api/reseller/academy/progress
 * when that API is available. Sync failures are silent: the learner keeps
 * working with local progress.
 */

export const PROGRESS_VERSION = 1;
export const PROGRESS_STORAGE_KEY = 'reseller-academy-progress:v1';
export const MAX_APP_ID_LENGTH = 80;

export type Phase = 'learn' | 'follow' | 'complete' | 'verify';
export const PHASES: Phase[] = ['learn', 'follow', 'complete', 'verify'];

export interface AcademyProgress {
  v: typeof PROGRESS_VERSION;
  updatedAt: number;
  selectedAppId: string | null;
  lastLessonId: string | null;
  completedLessons: string[];
  /** lessonId -> indexes of "Complete" checklist items the learner ticked (self-reported). */
  checks: Record<string, number[]>;
  /** lessonId -> phases the learner has moved past. */
  phases: Record<string, Phase[]>;
}

export const emptyProgress = (now = 0): AcademyProgress => ({
  v: PROGRESS_VERSION,
  updatedAt: now,
  selectedAppId: null,
  lastLessonId: null,
  completedLessons: [],
  checks: {},
  phases: {},
});

/* ---------------------------- sanitising ---------------------------- */

const uniq = <T,>(xs: T[]): T[] => [...new Set(xs)];

/**
 * Coerce untrusted input (localStorage / request body) into a valid state.
 * `lessonIds` (and optional `appIds`) are the allow-lists; unknown ids are dropped.
 */
export function sanitizeProgress(
  input: unknown,
  lessonIds: readonly string[],
  appIds?: readonly string[],
): AcademyProgress {
  const out = emptyProgress();
  if (!input || typeof input !== 'object') return out;
  const o = input as Record<string, unknown>;
  const ids = new Set(lessonIds);

  out.updatedAt = typeof o.updatedAt === 'number' && Number.isFinite(o.updatedAt) && o.updatedAt >= 0 ? Math.floor(o.updatedAt) : 0;

  if (typeof o.selectedAppId === 'string' && o.selectedAppId.length <= MAX_APP_ID_LENGTH && (!appIds || appIds.includes(o.selectedAppId))) {
    out.selectedAppId = o.selectedAppId;
  }
  if (typeof o.lastLessonId === 'string' && ids.has(o.lastLessonId)) out.lastLessonId = o.lastLessonId;

  if (Array.isArray(o.completedLessons)) {
    out.completedLessons = uniq(o.completedLessons.filter((x): x is string => typeof x === 'string' && ids.has(x)));
  }
  if (o.checks && typeof o.checks === 'object') {
    for (const [k, v] of Object.entries(o.checks as Record<string, unknown>)) {
      if (!ids.has(k) || !Array.isArray(v)) continue;
      const idx = uniq(v.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < 50));
      if (idx.length) out.checks[k] = idx.sort((a, b) => a - b);
    }
  }
  if (o.phases && typeof o.phases === 'object') {
    for (const [k, v] of Object.entries(o.phases as Record<string, unknown>)) {
      if (!ids.has(k) || !Array.isArray(v)) continue;
      const ph = uniq(v.filter((p): p is Phase => PHASES.includes(p as Phase)));
      if (ph.length) out.phases[k] = ph;
    }
  }
  return out;
}

/* ------------------------------ updates ----------------------------- */

const touch = (p: AcademyProgress, now: number): AcademyProgress => ({ ...p, updatedAt: Math.max(now, p.updatedAt + 1) });

export function selectApp(p: AcademyProgress, appId: string | null, now: number): AcademyProgress {
  return touch({ ...p, selectedAppId: appId }, now);
}

export function visitLesson(p: AcademyProgress, lessonId: string, now: number): AcademyProgress {
  if (p.lastLessonId === lessonId) return p;
  return touch({ ...p, lastLessonId: lessonId }, now);
}

export function markPhase(p: AcademyProgress, lessonId: string, phase: Phase, now: number): AcademyProgress {
  const cur = p.phases[lessonId] ?? [];
  if (cur.includes(phase)) return p;
  return touch({ ...p, phases: { ...p.phases, [lessonId]: [...cur, phase] } }, now);
}

export function toggleCheck(p: AcademyProgress, lessonId: string, index: number, now: number): AcademyProgress {
  const cur = p.checks[lessonId] ?? [];
  const next = cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index].sort((a, b) => a - b);
  const checks = { ...p.checks };
  if (next.length) checks[lessonId] = next;
  else delete checks[lessonId];
  return touch({ ...p, checks }, now);
}

/** Idempotent version of toggleCheck: sets the box to the value the learner chose. */
export function setCheck(p: AcademyProgress, lessonId: string, index: number, checked: boolean, now: number): AcademyProgress {
  const cur = p.checks[lessonId] ?? [];
  if (cur.includes(index) === checked) return p;
  return toggleCheck(p, lessonId, index, now);
}

export function setLessonComplete(p: AcademyProgress, lessonId: string, done: boolean, now: number): AcademyProgress {
  const has = p.completedLessons.includes(lessonId);
  if (done === has) return p;
  return touch(
    { ...p, completedLessons: done ? [...p.completedLessons, lessonId] : p.completedLessons.filter((x) => x !== lessonId) },
    now,
  );
}

/* ----------------------------- derivations ----------------------------- */

export const percentComplete = (p: AcademyProgress, total: number): number =>
  total <= 0 ? 0 : Math.round((p.completedLessons.length / total) * 100);

/** First lesson not completed, or null when every lesson is done. */
export function firstIncomplete(p: AcademyProgress, lessonIds: readonly string[]): string | null {
  return lessonIds.find((id) => !p.completedLessons.includes(id)) ?? null;
}

/** Where "Continue Learning" goes: the last visited lesson if not finished, else the first unfinished one. */
export function continueTarget(p: AcademyProgress, lessonIds: readonly string[]): string | null {
  if (p.lastLessonId && lessonIds.includes(p.lastLessonId) && !p.completedLessons.includes(p.lastLessonId)) return p.lastLessonId;
  return firstIncomplete(p, lessonIds) ?? lessonIds[0] ?? null;
}

/**
 * App launch milestones, derived from completed lessons (self-reported —
 * these are never "verified" by the course and never affect access).
 */
export const LAUNCH_MILESTONES: { key: string; label: string; lessonId: string }[] = [
  { key: 'source', label: 'Source code forked to my GitHub', lessonId: '3.2' },
  { key: 'muapi', label: 'MuAPI key obtained', lessonId: '4.1' },
  { key: 'database', label: 'Database tables created', lessonId: '5.3' },
  { key: 'signin', label: 'Google sign-in configured', lessonId: '5.4' },
  { key: 'deployed', label: 'App deployed on Vercel', lessonId: '6.3' },
  { key: 'stripe-account', label: 'Stripe account created', lessonId: '7.2' },
  { key: 'stripe-test', label: 'Test purchase completed', lessonId: '8.4' },
  { key: 'pricing', label: 'Credit-pack prices set', lessonId: '9.2' },
  { key: 'domain', label: 'Own domain connected', lessonId: '10.2' },
  { key: 'tested', label: 'Full customer test completed', lessonId: '11.1' },
  { key: 'live-ready', label: 'Live payment readiness checked', lessonId: '11.2' },
];

export const milestoneStatus = (p: AcademyProgress) =>
  LAUNCH_MILESTONES.map((m) => ({ ...m, done: p.completedLessons.includes(m.lessonId) }));

/* -------------------------------- merging ------------------------------- */

/** Last-write-wins on `updatedAt`. Ties prefer the server copy. */
export function mergeProgress(local: AcademyProgress, remote: AcademyProgress | null): AcademyProgress {
  if (!remote) return local;
  return local.updatedAt > remote.updatedAt ? local : remote;
}

/* ----------------------------- localStorage ----------------------------- */

export function loadLocal(lessonIds: readonly string[], appIds?: readonly string[]): AcademyProgress {
  try {
    if (typeof window === 'undefined') return emptyProgress();
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? sanitizeProgress(JSON.parse(raw), lessonIds, appIds) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

/**
 * Browser progress is tagged with the account that last synced it, so a second learner
 * on the same browser never inherits (or overwrites with) the first learner's progress.
 */
const OWNER_KEY = `${PROGRESS_STORAGE_KEY}:owner`;
export function loadOwner(): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}
export function saveOwner(owner: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(OWNER_KEY, owner);
  } catch {
    /* storage unavailable */
  }
}

export function saveLocal(p: AcademyProgress): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable (private mode / quota): progress stays in memory */
  }
}

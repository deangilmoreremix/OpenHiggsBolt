/**
 * Progress for the main Academy (every track, plus the "Build with AI" course):
 * which step the learner is on, which steps they have gone through, which
 * checklist boxes they ticked and which lessons they marked complete.
 *
 * Pure, no React. Lesson ids are `track/slug`. Kept separate from the reseller
 * course's progress on purpose (different storage keys and endpoint). Educational
 * only: nothing here touches access or entitlements.
 */

export const COURSE_STORAGE_KEY = 'academy-course-progress:v1';
export const COURSE_OWNER_KEY = `${COURSE_STORAGE_KEY}:owner`;
export const COURSE_PROGRESS_VERSION = 1;

const MAX_STEP_ID = 80;
const MAX_STEPS_PER_LESSON = 60;
const MAX_CHECK_INDEX = 50;

export interface CourseProgress {
  v: 1;
  /** Epoch ms of the last change (last-write-wins clock). */
  updatedAt: number;
  /** Resume pointer: the lesson and step the learner was last on. */
  lastLessonId: string | null;
  lastStepId: string | null;
  completedLessons: string[];
  /** Steps the learner has gone through, per lesson. */
  stepsDone: Record<string, string[]>;
  /** Ticked checklist indexes, per lesson. */
  checks: Record<string, number[]>;
}

export const emptyCourseProgress = (now = 0): CourseProgress => ({
  v: COURSE_PROGRESS_VERSION,
  updatedAt: now,
  lastLessonId: null,
  lastStepId: null,
  completedLessons: [],
  stepsDone: {},
  checks: {},
});

/** Coerce untrusted input (storage, network) into a valid state, dropping unknown lessons. */
export function sanitizeCourseProgress(input: unknown, lessonIds: readonly string[]): CourseProgress {
  const ok = new Set(lessonIds);
  const out = emptyCourseProgress();
  if (!input || typeof input !== 'object') return out;
  const o = input as Record<string, unknown>;
  const t = Number(o.updatedAt);
  out.updatedAt = Number.isFinite(t) && t >= 0 ? Math.floor(t) : 0;
  const lesson = typeof o.lastLessonId === 'string' && ok.has(o.lastLessonId) ? o.lastLessonId : null;
  out.lastLessonId = lesson;
  out.lastStepId = lesson && typeof o.lastStepId === 'string' && o.lastStepId.length <= MAX_STEP_ID ? o.lastStepId : null;
  if (Array.isArray(o.completedLessons)) {
    out.completedLessons = [...new Set(o.completedLessons.filter((x): x is string => typeof x === 'string' && ok.has(x)))];
  }
  if (o.stepsDone && typeof o.stepsDone === 'object') {
    for (const [k, v] of Object.entries(o.stepsDone as Record<string, unknown>)) {
      if (!ok.has(k) || !Array.isArray(v)) continue;
      const ids = [...new Set(v.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= MAX_STEP_ID))].slice(0, MAX_STEPS_PER_LESSON);
      if (ids.length) out.stepsDone[k] = ids;
    }
  }
  if (o.checks && typeof o.checks === 'object') {
    for (const [k, v] of Object.entries(o.checks as Record<string, unknown>)) {
      if (!ok.has(k) || !Array.isArray(v)) continue;
      const idx = [...new Set(v.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < MAX_CHECK_INDEX))].sort((a, b) => a - b);
      if (idx.length) out.checks[k] = idx;
    }
  }
  return out;
}

/* ------------------------------ updates ----------------------------- */

const touch = (p: CourseProgress, now: number): CourseProgress => ({ ...p, updatedAt: Math.max(now, p.updatedAt + 1) });

/** Remember where the learner is. No-op (same reference) when nothing changed. */
export function visitStep(p: CourseProgress, lessonId: string, stepId: string, now: number): CourseProgress {
  if (p.lastLessonId === lessonId && p.lastStepId === stepId) return p;
  return touch({ ...p, lastLessonId: lessonId, lastStepId: stepId }, now);
}

export function markStepDone(p: CourseProgress, lessonId: string, stepId: string, now: number): CourseProgress {
  const cur = p.stepsDone[lessonId] ?? [];
  if (cur.includes(stepId) || cur.length >= MAX_STEPS_PER_LESSON) return p;
  return touch({ ...p, stepsDone: { ...p.stepsDone, [lessonId]: [...cur, stepId] } }, now);
}

/** Idempotent: sets a checklist box to the value the learner chose. */
export function setCourseCheck(p: CourseProgress, lessonId: string, index: number, checked: boolean, now: number): CourseProgress {
  const cur = p.checks[lessonId] ?? [];
  if (cur.includes(index) === checked) return p;
  const next = checked ? [...cur, index].sort((a, b) => a - b) : cur.filter((i) => i !== index);
  const checks = { ...p.checks };
  if (next.length) checks[lessonId] = next;
  else delete checks[lessonId];
  return touch({ ...p, checks }, now);
}

export function setCourseLessonComplete(p: CourseProgress, lessonId: string, done: boolean, now: number): CourseProgress {
  const has = p.completedLessons.includes(lessonId);
  if (done === has) return p;
  return touch({ ...p, completedLessons: done ? [...p.completedLessons, lessonId] : p.completedLessons.filter((x) => x !== lessonId) }, now);
}

/* ----------------------------- derivations ----------------------------- */

/** Percent of a lesson's steps the learner has gone through (100 when the lesson is marked complete). */
export function lessonPercent(p: CourseProgress, lessonId: string, stepCount: number): number {
  if (p.completedLessons.includes(lessonId)) return 100;
  if (stepCount <= 0) return 0;
  return Math.min(100, Math.round(((p.stepsDone[lessonId]?.length ?? 0) / stepCount) * 100));
}

export const overallPercent = (p: CourseProgress, lessonIds: readonly string[]): number =>
  lessonIds.length === 0 ? 0 : Math.round((lessonIds.filter((id) => p.completedLessons.includes(id)).length / lessonIds.length) * 100);

/** "Continue where you left off": last visited lesson if unfinished, else the first unfinished one. */
export function courseContinueTarget(p: CourseProgress, lessonIds: readonly string[]): { lessonId: string; stepId: string | null } | null {
  if (p.lastLessonId && lessonIds.includes(p.lastLessonId) && !p.completedLessons.includes(p.lastLessonId)) {
    return { lessonId: p.lastLessonId, stepId: p.lastStepId };
  }
  const next = lessonIds.find((id) => !p.completedLessons.includes(id));
  return next ? { lessonId: next, stepId: null } : null;
}

/** First step the learner has not gone through yet (falls back to the first step). */
export function firstUndoneStep(p: CourseProgress, lessonId: string, stepIds: readonly string[]): string | null {
  const done = p.stepsDone[lessonId] ?? [];
  return stepIds.find((id) => !done.includes(id)) ?? stepIds[0] ?? null;
}

/** Last-write-wins on `updatedAt`; ties prefer the account copy. */
export function mergeCourseProgress(local: CourseProgress, remote: CourseProgress | null): CourseProgress {
  if (!remote) return local;
  return local.updatedAt > remote.updatedAt ? local : remote;
}

/* ----------------------------- localStorage ----------------------------- */

export function loadCourseLocal(lessonIds: readonly string[]): CourseProgress {
  try {
    if (typeof window === 'undefined') return emptyCourseProgress();
    const raw = window.localStorage.getItem(COURSE_STORAGE_KEY);
    return raw ? sanitizeCourseProgress(JSON.parse(raw), lessonIds) : emptyCourseProgress();
  } catch {
    return emptyCourseProgress();
  }
}

export function saveCourseLocal(p: CourseProgress): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable (private mode / quota): progress stays in memory */
  }
}

export function loadCourseOwner(): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(COURSE_OWNER_KEY);
  } catch {
    return null;
  }
}

export function saveCourseOwner(owner: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(COURSE_OWNER_KEY, owner);
  } catch {
    /* storage unavailable */
  }
}

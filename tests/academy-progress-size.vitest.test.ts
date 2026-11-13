import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllTracks, getLessonMarkdown } from '@/lib/academyLessons';
import { parseLesson } from '@/lib/academySteps';
import {
  emptyCourseProgress, markStepDone, sanitizeCourseProgress, setCourseCheck, setCourseLessonComplete, visitStep, type CourseProgress,
} from '@/lib/academyCourseProgress';

const upsert = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: 'user_1' }) }));
vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      upsert: (row: unknown) => { upsert(row); return { select: async () => ({ data: [{ clerk_user_id: 'user_1' }], error: null }) }; },
    }),
  }),
}));

const PG_LIMIT = 65536; // CHECK pg_column_size(state) <= 65536 on public.academy_progress (cannot be changed)
const lessons = () => getAllTracks().flatMap((t) => t.lessons.map((l) => ({ track: t.slug, id: `${t.slug}/${l.slug}`, parsed: parseLesson(getLessonMarkdown(t.slug, l.slug)) })));

/** Every lesson of the checked-in course driven the way the player does it: every step seen and finished, every box ticked, lesson completed. */
function fullCourse(complete: boolean): CourseProgress {
  let p = emptyCourseProgress();
  let now = 1_700_000_000_000;
  for (const l of lessons()) {
    for (const s of l.parsed.steps) {
      p = visitStep(p, l.id, s.id, now++);
      p = markStepDone(p, l.id, s.id, now++);
      (s.checklist ?? []).forEach((_, i) => { p = setCourseCheck(p, l.id, i, true, now++); });
    }
    if (complete) p = setCourseLessonComplete(p, l.id, true, now++);
  }
  return p;
}

describe('academy progress size', () => {
  beforeEach(() => upsert.mockReset());

  it('the whole course, fully done, fits the route and the database column with room to spare', async () => {
    const { PUT } = await import('@/app/api/academy/progress/route');
    expect(lessons().length).toBeGreaterThan(100);
    for (const complete of [true, false]) {
      const body = JSON.stringify({ progress: fullCourse(complete) });
      expect(Buffer.byteLength(body)).toBeLessThan(PG_LIMIT);
      const res = await PUT(new Request('http://x/api/academy/progress', { method: 'PUT', body }) as never);
      expect(res.status).toBe(200);
      const stored = upsert.mock.calls.at(-1)![0].state as CourseProgress;
      expect(Buffer.byteLength(JSON.stringify(stored))).toBeLessThan(PG_LIMIT * 0.75);
    }
    // the fully completed course (the realistic worst case) is far smaller than the limit
    expect(Buffer.byteLength(JSON.stringify({ progress: fullCourse(true) }))).toBeLessThan(PG_LIMIT / 4);
  });

  it('a body over the 64 KiB limit is still refused', async () => {
    const { PUT } = await import('@/app/api/academy/progress/route');
    const res = await PUT(new Request('http://x/api/academy/progress', { method: 'PUT', body: 'x'.repeat(PG_LIMIT + 1) }) as never);
    expect(res.status).toBe(413);
  });

  it('completed lessons keep no per-step detail, and old saved state is migrated on read', () => {
    const ids = lessons().map((l) => l.id);
    const old = { v: 1, updatedAt: 5, last: {}, completedLessons: [ids[0]], stepsDone: { [ids[0]]: ['a', 'b'], [ids[1]]: ['a'] }, checks: { [ids[0]]: [0, 1] } };
    const p = sanitizeCourseProgress(old, ids);
    expect(p.stepsDone).toEqual({ [ids[1]]: ['a'] });
    expect(p.checks[ids[0]]).toEqual([0, 1]);
    const done = setCourseLessonComplete(markStepDone(emptyCourseProgress(), ids[2], 's', 1), ids[2], true, 2);
    expect(done.stepsDone[ids[2]]).toBeUndefined();
    expect(markStepDone(done, ids[2], 't', 3)).toBe(done);
  });
});

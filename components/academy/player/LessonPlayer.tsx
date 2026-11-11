'use client';

import React from 'react';
import { LessonViewer } from '../AssetGallery';
import { AcademyCard, cx } from '../primitives';
import { parseLesson } from '@/lib/academySteps';
import { firstUndoneStep, lessonPercent, type CourseProgress } from '@/lib/academyCourseProgress';
import { colors, semantic } from '@/shared/styles/designTokens';
import { useLessonMarkdown } from './useLessonMarkdown';

export interface LessonPlayerActions {
  visit: (lessonId: string, stepId: string) => void;
  stepDone: (lessonId: string, stepId: string) => void;
  check: (lessonId: string, index: number) => void;
  complete: (lessonId: string, done: boolean) => void;
}

export interface LessonPlayerProps {
  track: string;
  lessonSlug: string;
  lessonTitle: string;
  progress: CourseProgress;
  ready: boolean;
  actions: LessonPlayerActions;
  /** Step to open (from a deep link). Beats the saved position. */
  initialStepId?: string | null;
  /** Called whenever the open step changes (keeps the address bar in step). */
  onStepChange?: (stepId: string) => void;
  /** Where "Next lesson" goes; omit on the last lesson. */
  next?: { title: string; go: () => void } | null;
}

/**
 * One lesson as a self-paced course: one step per screen, Back / Next, a
 * progress bar, tickable checklists that are saved, and it opens where the
 * learner left off. Nothing is locked; the learner can jump to any step.
 */
export function LessonPlayer({ track, lessonSlug, lessonTitle, progress, ready, actions, initialStepId, onStepChange, next }: LessonPlayerProps) {
  const lessonId = `${track}/${lessonSlug}`;
  const { md, loading } = useLessonMarkdown(track, lessonSlug);
  const parsed = React.useMemo(() => (md == null ? null : parseLesson(md)), [md]);
  const steps = parsed?.steps ?? [];
  const [index, setIndex] = React.useState(0);
  // which lesson the step index has been positioned for (saved or deep-linked step applied)
  const [positioned, setPositioned] = React.useState<string | null>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const focusOnChange = React.useRef(false);

  // open at the right step once the lesson and the saved progress are both known
  React.useEffect(() => {
    if (!parsed || !ready || positioned === lessonId) return;
    const ids = parsed.steps.map((s) => s.id);
    const wanted =
      (initialStepId && ids.includes(initialStepId) ? initialStepId : null) ??
      (progress.lastLessonId === lessonId && progress.lastStepId && ids.includes(progress.lastStepId) ? progress.lastStepId : null) ??
      firstUndoneStep(progress, lessonId, ids);
    setIndex(Math.max(0, wanted ? ids.indexOf(wanted) : 0));
    setPositioned(lessonId);
  }, [parsed, ready, lessonId, initialStepId, progress, positioned]);

  const step = steps[Math.min(index, Math.max(steps.length - 1, 0))];
  // remember where the learner is whenever the open step changes
  React.useEffect(() => {
    // only once the step has been positioned, so opening a lesson never overwrites the saved step with step 1
    if (!step || !ready || positioned !== lessonId) return;
    actions.visit(lessonId, step.id);
    onStepChange?.(step.id);
    if (focusOnChange.current) headingRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, lessonId, ready, positioned]);

  if (loading || !parsed) {
    return (
      <AcademyCard>
        <div className="py-10 text-center text-sm" style={{ color: semantic.textSecondary }}>Loading lesson…</div>
      </AcademyCard>
    );
  }

  const done = progress.stepsDone[lessonId] ?? [];
  const complete = progress.completedLessons.includes(lessonId);
  const percent = lessonPercent(progress, lessonId, steps.length);
  const isLast = index >= steps.length - 1;
  const ticks = progress.checks[lessonId] ?? [];

  const go = (i: number) => {
    focusOnChange.current = true;
    setIndex(Math.min(Math.max(i, 0), steps.length - 1));
  };
  const onNext = () => {
    if (!step) return;
    actions.stepDone(lessonId, step.id);
    go(index + 1);
  };
  const onFinish = () => {
    if (!step) return;
    actions.stepDone(lessonId, step.id);
    actions.complete(lessonId, true);
  };

  return (
    <div data-testid="lesson-player">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: semantic.textSecondary }}>
        {parsed.minutes ? <span>About {parsed.minutes} minutes</span> : null}
        {parsed.outcome ? <span>You will finish with: {parsed.outcome}</span> : null}
        {complete && <span className="rounded-full px-2 py-0.5 font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>Lesson complete ✓</span>}
      </div>

      <div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: semantic.textSecondary }}>
        <span>Step {Math.min(index + 1, steps.length)} of {steps.length}</span>
        <span>{percent}% of this lesson</span>
      </div>
      <div
        role="progressbar"
        aria-label={`Progress through ${lessonTitle}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mb-4 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: colors.primary }} />
      </div>

      {steps.length > 1 && (
        <nav aria-label="Lesson steps" className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {steps.map((s, i) => {
            const isDone = complete || done.includes(s.id);
            const isCurrent = i === index;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-current={isCurrent ? 'step' : undefined}
                title={s.title}
                className={cx('flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors')}
                style={
                  isCurrent
                    ? { borderColor: colors.primary, background: semantic.activeAccent, color: colors.primary }
                    : { borderColor: 'var(--border-color)', color: isDone ? '#34d399' : semantic.textMuted }
                }
              >
                <span aria-hidden="true">{isDone ? '✓' : i + 1}</span>
                <span className="max-w-[140px] truncate">{s.title}</span>
                {isDone && <span className="sr-only">(done)</span>}
              </button>
            );
          })}
        </nav>
      )}

      {step && (
        <AcademyCard>
          {step.group && <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: colors.primary }}>{step.group}</p>}
          <h3 ref={headingRef} tabIndex={-1} className="mb-3 text-lg font-extrabold text-white outline-none">{step.title}</h3>
          {step.markdown && <LessonViewer markdown={step.markdown} track={track} />}
          {step.kind === 'checklist' && step.checklist && (
            <fieldset className="mt-2">
              <legend className="mb-2 text-xs" style={{ color: semantic.textSecondary }}>
                These are your own notes. Tick each one when it is true ({ticks.filter((t) => t < (step.checklist?.length ?? 0)).length} of {step.checklist.length} ticked).
              </legend>
              <ul className="space-y-2">
                {step.checklist.map((item, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-white">
                      <input
                        type="checkbox"
                        checked={ticks.includes(i)}
                        onChange={() => actions.check(lessonId, i)}
                        className="mt-1 h-4 w-4 accent-[#22d3ee]"
                      />
                      <span>{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
        </AcademyCard>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index <= 0}
          className="rounded-lg border px-4 py-2 text-xs font-semibold disabled:opacity-40"
          style={{ borderColor: 'var(--border-color)', color: semantic.textSecondary }}
        >
          ← Back
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {complete && (
            <button
              type="button"
              onClick={() => actions.complete(lessonId, false)}
              className="rounded-lg px-3 py-2 text-[11px] underline"
              style={{ color: semantic.textMuted }}
            >
              Mark as not complete
            </button>
          )}
          {!isLast && (
            <button type="button" onClick={onNext} className="rounded-lg px-5 py-2 text-xs font-bold text-black" style={{ background: colors.primary }}>
              Next step →
            </button>
          )}
          {isLast && !complete && (
            <button type="button" onClick={onFinish} className="rounded-lg px-5 py-2 text-xs font-bold text-black" style={{ background: colors.primary }}>
              Mark lesson complete ✓
            </button>
          )}
          {isLast && complete && next && (
            <button type="button" onClick={next.go} className="rounded-lg px-5 py-2 text-xs font-bold text-black" style={{ background: colors.primary }}>
              Next lesson: {next.title} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { semantic, colors } from '@/shared/styles/designTokens';
import { ActionButton, AcademyCard, Pill } from '@/components/academy/primitives';
import type { Lesson } from '@/content/resellerAcademy';
import { PHASES, type AcademyProgress, type Phase } from '@/lib/resellerAcademyProgress';
import { Rich } from './Rich';
import { CopyBlock } from './CopyBlock';
import { AppPanel } from './AppPanel';

const PHASE_LABEL: Record<Phase, string> = { learn: 'Learn', follow: 'Follow along', complete: 'Complete', verify: 'Verify' };

export interface LessonViewProps {
  lesson: Lesson;
  moduleTitle: string;
  progress: AcademyProgress;
  nextLessonId: string | null;
  onPhase: (lessonId: string, p: Phase) => void;
  onToggle: (lessonId: string, i: number) => void;
  onComplete: (lessonId: string, done: boolean) => void;
  onGo: (lessonId: string) => void;
}

export function LessonView({ lesson, moduleTitle, progress, nextLessonId, onPhase, onToggle, onComplete, onGo }: LessonViewProps) {
  const [phase, setPhase] = useState<Phase>('learn');
  const done = progress.completedLessons.includes(lesson.id);
  const passed = progress.phases[lesson.id] ?? [];
  const checks = progress.checks[lesson.id] ?? [];

  // a new lesson always starts at LEARN
  useEffect(() => {
    setPhase('learn');
  }, [lesson.id]);

  const idx = PHASES.indexOf(phase);
  const advance = () => {
    onPhase(lesson.id, phase);
    if (idx < PHASES.length - 1) setPhase(PHASES[idx + 1]);
  };

  return (
    <article aria-labelledby="lesson-title">
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.primary }}>{moduleTitle}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h2 id="lesson-title" className="text-xl font-extrabold text-white">{lesson.id} · {lesson.title}</h2>
        {done && <Pill tone="primary">Completed</Pill>}
      </div>
      <p className="mt-1 text-xs" style={{ color: semantic.textSecondary }}>
        About {lesson.minutes} min · Outcome: {lesson.outcome}
      </p>

      <ol className="mt-4 grid grid-cols-4 gap-1.5" aria-label="Lesson steps">
        {PHASES.map((p, i) => {
          const isCur = p === phase;
          const isDone = passed.includes(p) || (done && p !== 'verify') || (done && p === 'verify');
          return (
            <li key={p}>
              <button
                type="button"
                onClick={() => setPhase(p)}
                aria-current={isCur ? 'step' : undefined}
                className="w-full rounded-lg border px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide"
                style={{
                  borderColor: isCur ? colors.primary : 'var(--glass-border)',
                  background: isCur ? 'rgba(34,211,238,0.12)' : isDone ? 'rgba(74,222,128,0.07)' : 'transparent',
                  color: isCur ? colors.primary : isDone ? semantic.success : semantic.textSecondary,
                }}
              >
                <span className="block text-[10px] opacity-70">{i + 1}</span>
                {PHASE_LABEL[p]}{isDone && !isCur ? ' ✓' : ''}
              </button>
            </li>
          );
        })}
      </ol>

      <AcademyCard className="mt-4">
        {phase === 'learn' && (
          <div>
            <div className="max-w-[68ch] space-y-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>
              {lesson.learn.map((t, i) => <p key={i}><Rich text={t} /></p>)}
            </div>
            {lesson.appPanel && <AppPanel appId={progress.selectedAppId} kind={lesson.appPanel} />}
            {lesson.advanced && lesson.advanced.length > 0 && (
              <details className="mt-4 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--glass-border)' }}>
                <summary className="cursor-pointer text-xs font-semibold" style={{ color: semantic.textSecondary }}>Go deeper (optional)</summary>
                <div className="mt-2 space-y-2 text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>
                  {lesson.advanced.map((t, i) => <p key={i}><Rich text={t} /></p>)}
                </div>
              </details>
            )}
          </div>
        )}

        {phase === 'follow' && (
          <ol className="max-w-[68ch] space-y-4">
            {lesson.follow.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(34,211,238,0.15)', color: colors.primary }}>{i + 1}</span>
                <div className="min-w-0 flex-1 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <p><Rich text={s.text} /></p>
                  {s.link && (
                    <a
                      href={s.link.url}
                      {...(s.link.url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="mt-1 inline-block text-xs font-semibold underline"
                      style={{ color: colors.primary }}
                    >
                      {s.link.label} ↗
                    </a>
                  )}
                  {s.copy && <CopyBlock label={s.copy.label} value={s.copy.value} />}
                  {s.expect && <p className="mt-1 text-xs" style={{ color: semantic.success }}>You should see: {s.expect}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}

        {phase === 'complete' && (
          <div className="max-w-[68ch]">
            <p className="mb-3 text-xs" style={{ color: semantic.textSecondary }}>Tick each item as you finish it. These are your own notes — the course cannot check your external accounts.</p>
            <ul className="space-y-2">
              {lesson.complete.map((c, i) => {
                const on = checks.includes(i);
                return (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-3 text-sm" style={{ color: on ? semantic.success : 'rgba(255,255,255,0.9)' }}>
                      <input type="checkbox" checked={on} onChange={() => onToggle(lesson.id, i)} className="mt-1 h-4 w-4 accent-cyan-400" />
                      <span className={on ? 'line-through decoration-1' : ''}>{c}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {phase === 'verify' && (
          <div className="max-w-[68ch] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.primary }}>How to check it worked</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {lesson.verify.map((v, i) => <li key={i}><Rich text={v} /></li>)}
            </ul>
            {lesson.mistakes.length > 0 && (
              <div>
                <h3 className="mt-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#fbbf24' }}>Common mistakes</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs" style={{ color: semantic.textSecondary }}>
                  {lesson.mistakes.map((m, i) => <li key={i}><Rich text={m} /></li>)}
                </ul>
              </div>
            )}
            {lesson.troubleshooting.length > 0 && (
              <div>
                <h3 className="mt-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>If something is wrong</h3>
                <div className="mt-1 space-y-1.5">
                  {lesson.troubleshooting.map((t, i) => (
                    <details key={i} className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--glass-border)' }}>
                      <summary className="cursor-pointer text-xs font-semibold text-white">{t.problem}</summary>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: semantic.textSecondary }}><Rich text={t.fix} /></p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AcademyCard>

      {/* one principal action per stage */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {phase !== 'verify' ? (
          <ActionButton variant="primary" onClick={advance}>
            Next: {PHASE_LABEL[PHASES[idx + 1]]} →
          </ActionButton>
        ) : done ? (
          <>
            {nextLessonId && <ActionButton variant="primary" onClick={() => onGo(nextLessonId)}>Continue to lesson {nextLessonId} →</ActionButton>}
            <ActionButton variant="ghost" onClick={() => onComplete(lesson.id, false)}>Mark as not complete</ActionButton>
          </>
        ) : (
          <ActionButton
            variant="primary"
            onClick={() => {
              onPhase(lesson.id, 'verify');
              onComplete(lesson.id, true);
              if (nextLessonId) onGo(nextLessonId);
            }}
          >
            Mark complete{nextLessonId ? ' and continue' : ''}
          </ActionButton>
        )}
        {phase !== 'learn' && (
          <button type="button" className="text-xs underline" style={{ color: semantic.textSecondary }} onClick={() => setPhase(PHASES[idx - 1])}>← Back</button>
        )}
      </div>
    </article>
  );
}

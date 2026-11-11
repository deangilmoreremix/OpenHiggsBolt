'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { semantic, colors } from '@/shared/styles/designTokens';
import { AcademyCard, ActionButton, Pill, SectionTitle } from '@/components/academy/primitives';
import { ALL_LESSONS, GLOSSARY, LESSON_IDS, MODULES, getLesson, getModuleOf, nextLessonId } from '@/content/resellerAcademy';
import {
  continueTarget,
  LAUNCH_MILESTONES,
  milestoneStatus,
  percentComplete,
} from '@/lib/resellerAcademyProgress';
import { RESELLER_APPS } from '@/packages/studio/src/components/AppsStudio';
import { getWorkshop } from '@/lib/resellerAcademyApps';
import { LessonView } from './LessonView';
import { useAcademyProgress } from './useAcademyProgress';

type View = { kind: 'dashboard' } | { kind: 'lesson'; id: string };

/* ------------------------------ navigation ------------------------------ */

function CourseNav({ current, completed, onGo, onDashboard }: { current: View; completed: string[]; onGo: (id: string) => void; onDashboard: () => void }) {
  return (
    <nav aria-label="Course navigation" className="space-y-4">
      <button
        type="button"
        onClick={onDashboard}
        aria-current={current.kind === 'dashboard' ? 'page' : undefined}
        className="w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold"
        style={{ borderColor: current.kind === 'dashboard' ? colors.primary : 'var(--glass-border)', color: current.kind === 'dashboard' ? colors.primary : 'white' }}
      >
        Academy dashboard
      </button>
      {MODULES.map((m) => {
        const doneCount = m.lessons.filter((l) => completed.includes(l.id)).length;
        return (
          <section key={m.id} aria-label={`Module ${m.id}`}>
            <h3 className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>
              <span>Module {m.id}</span>
              <span>{doneCount}/{m.lessons.length}</span>
            </h3>
            <p className="mb-1 text-xs font-semibold text-white">{m.title}</p>
            <ul className="space-y-0.5">
              {m.lessons.map((l) => {
                const isDone = completed.includes(l.id);
                const isCur = current.kind === 'lesson' && current.id === l.id;
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => onGo(l.id)}
                      aria-current={isCur ? 'page' : undefined}
                      className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs"
                      style={{
                        background: isCur ? 'rgba(34,211,238,0.12)' : 'transparent',
                        color: isCur ? colors.primary : isDone ? semantic.success : semantic.textSecondary,
                      }}
                    >
                      <span aria-hidden className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border text-[9px]" style={{ borderColor: 'currentColor' }}>{isDone ? '✓' : ''}</span>
                      <span><span className="sr-only">{isDone ? 'Completed: ' : 'Not completed: '}</span>{l.id} {l.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}

/* ------------------------------- resources ------------------------------- */

function ResourcePanel({ lessonId, appId }: { lessonId: string | null; appId: string | null }) {
  const lesson = lessonId ? getLesson(lessonId) : null;
  const app = appId ? RESELLER_APPS.find((a: { id: string }) => a.id === appId) : null;
  const w = appId ? getWorkshop(appId) : null;
  return (
    <aside aria-label="Resources" className="space-y-5 text-xs">
      {app && (
        <section>
          <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Your application</h3>
          <p className="font-semibold text-white">{app.name}</p>
          <ul className="mt-1 space-y-1">
            {w?.repoUrl && <li><a className="underline" style={{ color: colors.primary }} href={w.repoUrl} target="_blank" rel="noopener noreferrer">Source repository ↗</a></li>}
            {w?.demoUrl && <li><a className="underline" style={{ color: colors.primary }} href={w.demoUrl} target="_blank" rel="noopener noreferrer">Live demo ↗</a></li>}
            <li><a className="underline" style={{ color: colors.primary }} href={`/academy/reseller/apps/${app.id}`}>App workshop</a></li>
            <li><a className="underline" style={{ color: colors.primary }} href={`/reseller/deployment#app-${app.id}`}>Deployment guide</a></li>
            <li><a className="underline" style={{ color: colors.primary }} href={`/studio/apps#app-card-${app.id}`}>Back to Reseller Studio</a></li>
          </ul>
        </section>
      )}
      {lesson && lesson.resources.length > 0 && (
        <section>
          <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Links for this lesson</h3>
          <ul className="space-y-1">
            {lesson.resources.map((r) => (
              <li key={r.url}><a className="underline" style={{ color: colors.primary }} href={r.url} target="_blank" rel="noopener noreferrer">{r.label} ↗</a></li>
            ))}
          </ul>
        </section>
      )}
      {lesson && lesson.glossary.length > 0 && (
        <section>
          <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Key terms</h3>
          <dl className="space-y-2">
            {lesson.glossary.filter((g) => GLOSSARY[g]).map((g) => (
              <div key={g}>
                <dt className="font-semibold text-white">{GLOSSARY[g].term}</dt>
                <dd className="leading-relaxed" style={{ color: semantic.textSecondary }}>{GLOSSARY[g].plain}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {!app && <p style={{ color: semantic.textSecondary }}>Choose your application on the dashboard to see its links here.</p>}
    </aside>
  );
}

/* -------------------------------- dashboard ------------------------------- */

function Dashboard({ p, onGo, onSelect }: { p: ReturnType<typeof useAcademyProgress>; onGo: (id: string) => void; onSelect: (id: string | null) => void }) {
  const progress = p.progress;
  const pct = percentComplete(progress, LESSON_IDS.length);
  const target = continueTarget(progress, LESSON_IDS);
  const targetLesson = target ? getLesson(target) : null;
  const curModule = target ? getModuleOf(target) : null;
  const started = progress.completedLessons.length > 0 || !!progress.lastLessonId;
  const miles = milestoneStatus(progress);
  const app = progress.selectedAppId ? RESELLER_APPS.find((a: { id: string }) => a.id === progress.selectedAppId) : null;

  return (
    <div className="space-y-5">
      <AcademyCard>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.primary }}>Start here</p>
        <h2 className="mt-1 text-2xl font-extrabold text-white">Launch your own AI application business</h2>
        <p className="mt-2 max-w-[68ch] text-sm leading-relaxed" style={{ color: semantic.textSecondary }}>
          Follow 12 short modules from choosing one of the 38 apps to taking real customers. Each lesson has four steps — Learn, Follow along, Complete, Verify — and always tells you what to do next. No programming needed.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {target && (
            <ActionButton variant="primary" onClick={() => onGo(target)}>
              {started ? 'Continue Learning' : 'Start Module 1'} → {targetLesson ? `${targetLesson.id} ${targetLesson.title}` : ''}
            </ActionButton>
          )}
          <span className="text-xs" style={{ color: semantic.textMuted }}>
            {p.sync === 'saved' ? 'Progress saved to your account' : p.sync === 'syncing' ? 'Saving…' : p.sync === 'offline' ? 'Saved in this browser' : 'Saved in this browser'}
          </span>
        </div>
        <div className="mt-4" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors.primary }} />
          </div>
          <p className="mt-1 text-xs" style={{ color: semantic.textSecondary }}>{pct}% complete · {progress.completedLessons.length} of {ALL_LESSONS.length} lessons</p>
        </div>
        {curModule && <p className="mt-2 text-xs" style={{ color: semantic.textSecondary }}>Current module: <span className="font-semibold text-white">Module {curModule.id} — {curModule.title}</span></p>}
      </AcademyCard>

      <div className="grid gap-5 md:grid-cols-2">
        <AcademyCard>
          <SectionTitle hint="saved">Your application</SectionTitle>
          <label className="block text-xs font-semibold text-white" htmlFor="app-select">Selected application</label>
          <select
            id="app-select"
            value={progress.selectedAppId ?? ''}
            onChange={(e) => onSelect(e.target.value || null)}
            className="mt-1 w-full rounded-lg border bg-black px-3 py-2 text-sm text-white"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <option value="">Choose an app…</option>
            {RESELLER_APPS.map((a: { id: string; name: string }) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {app && (
            <p className="mt-2 text-xs" style={{ color: semantic.textSecondary }}>
              <a className="underline" style={{ color: colors.primary }} href={`/academy/reseller/apps/${app.id}`}>Open the {app.name} workshop</a>
              {' · '}
              <a className="underline" style={{ color: colors.primary }} href={`/studio/apps#app-card-${app.id}`}>Back to Reseller Studio</a>
            </p>
          )}
          <p className="mt-3 text-xs"><a className="underline" style={{ color: colors.primary }} href="/studio/apps">Browse the Reseller Studio</a></p>
        </AcademyCard>

        <AcademyCard>
          <SectionTitle hint="self-reported">Launch-readiness checklist</SectionTitle>
          <ul className="space-y-1.5">
            {miles.map((m) => (
              <li key={m.key} className="flex items-start gap-2 text-xs" style={{ color: m.done ? semantic.success : semantic.textSecondary }}>
                <span aria-hidden>{m.done ? '✓' : '○'}</span>
                <span><span className="sr-only">{m.done ? 'Done: ' : 'Not done: '}</span>{m.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px]" style={{ color: semantic.textMuted }}>{miles.filter((m) => m.done).length} of {LAUNCH_MILESTONES.length}. These reflect lessons you marked complete — they are not checked against your accounts.</p>
        </AcademyCard>
      </div>

      <AcademyCard>
        <SectionTitle hint="12 modules">Course roadmap</SectionTitle>
        <ol className="grid gap-2 sm:grid-cols-2">
          {MODULES.map((m) => {
            const d = m.lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
            const first = m.lessons.find((l) => !progress.completedLessons.includes(l.id)) ?? m.lessons[0];
            return (
              <li key={m.id}>
                <button type="button" onClick={() => onGo(first.id)} className="w-full rounded-xl border p-3 text-left" style={{ borderColor: d === m.lessons.length ? 'rgba(74,222,128,0.4)' : 'var(--glass-border)' }}>
                  <span className="flex items-center justify-between gap-2 text-xs font-bold text-white">
                    <span>{m.id}. {m.title}</span>
                    {d === m.lessons.length ? <Pill tone="primary">Done</Pill> : <span style={{ color: semantic.textMuted }}>{d}/{m.lessons.length}</span>}
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed" style={{ color: semantic.textSecondary }}>{m.outcome}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </AcademyCard>
    </div>
  );
}

/* --------------------------------- drawers -------------------------------- */

function Drawer({ open, onClose, side, title, children }: { open: boolean; onClose: () => void; side: 'left' | 'right'; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label={`Close ${title}`} className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`absolute top-0 bottom-0 w-[88%] max-w-sm overflow-y-auto p-4 ${side === 'left' ? 'left-0' : 'right-0'}`} style={{ background: '#0a0a0a', borderRight: side === 'left' ? '1px solid var(--glass-border)' : undefined, borderLeft: side === 'right' ? '1px solid var(--glass-border)' : undefined }}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-white">{title}</span>
          <button type="button" onClick={onClose} className="rounded px-2 py-1 text-xs" style={{ color: colors.primary }}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------- shell --------------------------------- */

/**
 * The three-pane Reseller Academy (course navigation | lesson | resources).
 * Rendered ONLY inside the existing entitled branch of ResellerAcademyView.
 */
export default function ResellerAcademyShell({ syncRemote = true }: { syncRemote?: boolean }) {
  const p = useAcademyProgress(syncRemote);
  const [view, setView] = useState<View>({ kind: 'dashboard' });
  const [navOpen, setNavOpen] = useState(false);
  const [resOpen, setResOpen] = useState(false);

  const go = (id: string) => {
    if (!LESSON_IDS.includes(id)) return;
    setView({ kind: 'lesson', id });
    setNavOpen(false);
    p.visit(id);
    if (typeof window !== 'undefined') window.scrollTo?.({ top: 0 });
  };
  const goDashboard = () => {
    setView({ kind: 'dashboard' });
    setNavOpen(false);
  };

  const lesson = view.kind === 'lesson' ? getLesson(view.id) : null;
  const mod = lesson ? getModuleOf(lesson.id) : null;
  const completed = p.progress.completedLessons;
  const nav = useMemo(() => <CourseNav current={view} completed={completed} onGo={go} onDashboard={goDashboard} />, [view, completed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div data-testid="reseller-academy-shell">
      <div className="mb-4 flex items-center justify-between gap-2 lg:hidden">
        <ActionButton variant="ghost" onClick={() => setNavOpen(true)}>☰ Lessons</ActionButton>
        <ActionButton variant="ghost" onClick={() => setResOpen(true)}>Resources</ActionButton>
      </div>

      <div className="lg:grid lg:grid-cols-[250px_minmax(0,1fr)_270px] lg:gap-6">
        <div className="hidden lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 lg:sticky lg:top-4">{nav}</div>

        <main id="academy-main" className="min-w-0" aria-live="polite">
          {!p.ready ? (
            <p className="text-sm" style={{ color: semantic.textSecondary }}>Loading your progress…</p>
          ) : view.kind === 'dashboard' || !lesson || !mod ? (
            <Dashboard p={p} onGo={go} onSelect={p.selectApp} />
          ) : (
            <LessonView
              lesson={lesson}
              moduleTitle={`Module ${mod.id} · ${mod.title}`}
              progress={p.progress}
              nextLessonId={nextLessonId(lesson.id)}
              onPhase={p.phase}
              onToggle={p.toggle}
              onComplete={p.complete}
              onGo={go}
            />
          )}
        </main>

        <div className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
          <ResourcePanel lessonId={lesson?.id ?? null} appId={p.progress.selectedAppId} />
        </div>
      </div>

      <Drawer open={navOpen} onClose={() => setNavOpen(false)} side="left" title="Lessons">{nav}</Drawer>
      <Drawer open={resOpen} onClose={() => setResOpen(false)} side="right" title="Resources">
        <ResourcePanel lessonId={lesson?.id ?? null} appId={p.progress.selectedAppId} />
      </Drawer>
    </div>
  );
}

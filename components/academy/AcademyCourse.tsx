'use client';

import React from 'react';
import { AcademyCard, Pill, ActionButton, cx, SparkIcon } from './primitives';
import { AssetGallery, LessonViewer } from './AssetGallery';
import { TemplateView } from './TemplateComponents';
import { academyAssets, type AcademyAsset } from '@/data/academyAssets';
import { academyTemplates } from '@/data/academyTemplates';
import type { AcademyTrack } from '@/lib/academyLessons';
import manifest from '@/data/academyMediaManifest.json';
import studioKnowledgeBase from '@/data/studioKnowledgeBase.json';
import { panels, buttons, semantic, appWrapper, optionStyle, colors } from '@/shared/styles/designTokens';
import { academyStudioUrl, academyTrackUrl, getStudioGuide, BUILD_WITH_AI_TRACK } from '@/data/academyStudioGuides';
import { LessonPlayer } from './player/LessonPlayer';
import { useCourseProgress } from './useCourseProgress';
import { courseContinueTarget, overallPercent, type CourseProgress } from '@/lib/academyCourseProgress';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Step = 'learn' | 'see' | 'create';

type StudioTab =
  | 'create'
  | 'overview'
  | 'getting-started'
  | 'inputs-models'
  | 'best-practices'
  | 'use-cases'
  | 'troubleshooting'
  | 'business-related'
  | 'glossary'
  | 'academy-guidance';

interface Studio {
  id: string;
  name: string;
  route: string;
  description: string;
  shortDescription: string;
  keyFeatures: string[];
  howToUse: string;
  whenToUse?: string[];
  whenToUseAnother?: string[];
  bestFor?: string;
  featureExplanations?: Array<{
    feature: string;
    explanation: string;
    whyToUse: string;
    inputRequired: string;
    restrictions: string;
  }>;
  inputDetails?: Array<{
    name: string;
    description: string;
    required: boolean;
    whenToUse: string;
    restrictions: string;
  }>;
  modeExplanations?: Array<{
    mode: string;
    description: string;
    acronymExpanded: string;
    useCase: string;
  }>;
  modelExplanations?: string;
  advancedFeatureExplanations?: Array<{
    feature: string;
    explanation: string;
    useCase: string;
    restrictions: string;
  }>;
  outputDetails?: Array<{
    outputType: string;
    description: string;
    postGenerationActions: string[];
  }>;
  exampleWorkflows?: Array<{
    title: string;
    steps: string[];
  }>;
  tips?: string[];
  commonProblems?: Array<{
    problem: string;
    whyItHappens: string;
    howToFix: string;
  }>;
  troubleshootingSteps?: Array<{
    issue: string;
    steps: string[];
  }>;
  limitationDetails?: Array<{
    limitation: string;
    impact: string;
    workaround: string;
  }>;
  relatedStudioGuidance?: Array<{
    studio: string;
    relationship: string;
    whenToMove: string;
    why: string;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  targetCustomers?: string[];
  contentTypes?: string[];
  businessValue?: string;
  competitivePositioning?: string;
  gettingStarted?: string[];
  bestPractices?: string[];
  useCases?: Array<{
    title: string;
    description: string;
    steps: string[];
    expectedOutput: string;
    businessImpact: string;
  }>;
  glossary?: Record<string, string>;
  academyGuidance?: Array<{
    resource: string;
    whatYouLearn: string;
  }>;
  inputs?: string[];
  requiredInputs?: string[];
  optionalInputs?: string[];
  generationModes?: string[];
  modelCapabilities?: string;
  advancedFeatures?: string[];
  outputs?: string[];
  limitations?: string[];
  troubleshooting?: string[];
  relatedStudios?: string[];
  howToSteps?: string[];
}

interface StudioKnowledgeBase {
  studios: Studio[];
}

const STUDIOS: Studio[] = (studioKnowledgeBase as any as StudioKnowledgeBase).studios;

const STUDIO_TABS: { id: StudioTab; label: string }[] = [
  { id: 'create', label: 'Create with this studio' },
  { id: 'overview', label: 'Overview' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'inputs-models', label: 'Inputs & Models' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'use-cases', label: 'Use Cases' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
  { id: 'business-related', label: 'Business & Related' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'academy-guidance', label: 'Academy Guidance' },
];

/* ------------------------------------------------------------------ */
/*  Step meta                                                          */
/* ------------------------------------------------------------------ */

const STEP_META: { id: Step; label: string; blurb: string }[] = [
  { id: 'learn', label: 'LEARN', blurb: 'The lesson / content' },
  { id: 'see', label: 'SEE', blurb: 'GIF / video / image example' },
  { id: 'create', label: 'CREATE', blurb: 'Launch a SmartVideo GO AI template or recipe' },
];

/* ------------------------------------------------------------------ */
/*  Manifest typing                                                    */
/* ------------------------------------------------------------------ */

interface ManifestEntry {
  track: string;
  trackTitle: string;
  type: 'image' | 'gif' | 'video';
  src: string;
  file: string;
}
const mediaManifest = manifest as ManifestEntry[];

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useMarkdown(track: string, slug: string, kind: 'lesson' | 'template') {
  const [md, setMd] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMd(null);
    fetch(`/api/academy/content?track=${encodeURIComponent(track)}&slug=${encodeURIComponent(slug)}&kind=${kind}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setMd(d.markdown ?? '');
      })
      .catch(() => !cancelled && setMd('Failed to load content.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [track, slug, kind]);
  return { md, loading };
}

/* ------------------------------------------------------------------ */
/*  Sub-components: Learning Paths (unchanged)                         */
/* ------------------------------------------------------------------ */

function TemplateModal({
  track,
  slug,
  title,
  onClose,
}: {
  track: string;
  slug: string;
  title: string;
  onClose: () => void;
}) {
  const { md, loading } = useMarkdown(track, slug, 'template');
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl p-5"
        style={panels.card}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs hover:bg-white/10"
            style={buttons.ghost}
          >
            Close
          </button>
        </div>
        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: semantic.textSecondary }}>Loading template…</div>
        ) : (
          <div className="text-white">
            <LessonViewer markdown={md ?? ''} track={track} />
          </div>
        )}
        <div className="mt-4 border-t border-white/10 pt-4">
          <a
            href="/studio/video"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#22d3ee]/25"
            style={{ ...buttons.primary, background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}
          >
            <SparkIcon /> Use this template in SmartVideo GO AI
          </a>
        </div>
      </div>
    </div>
  );
}

type Course = ReturnType<typeof useCourseProgress>;

const lessonKey = (track: string, slug: string) => `${track}/${slug}`;

function SyncNote({ sync }: { sync: Course['sync'] }) {
  const text =
    sync === 'saved' ? 'Progress saved to your account'
    : sync === 'syncing' ? 'Saving…'
    : sync === 'offline' ? 'Saved in this browser (could not reach your account)'
    : 'Saved in this browser. Sign in to keep your progress on every device.';
  return <span className="text-[11px]" style={{ color: semantic.textMuted }} aria-live="polite">{text}</span>;
}

/** "Continue where you left off", shown once the learner has started anything. */
function ContinueCard({
  progress,
  lessonIds,
  describe,
  onContinue,
  sync,
}: {
  progress: CourseProgress;
  lessonIds: string[];
  describe: (lessonId: string) => { track: string; lesson: string } | null;
  onContinue: (lessonId: string, stepId: string | null) => void;
  sync: Course['sync'];
}) {
  const started = !!progress.lastLessonId || progress.completedLessons.length > 0;
  const target = courseContinueTarget(progress, lessonIds);
  if (!started || !target) return null;
  const d = describe(target.lessonId);
  if (!d) return null;
  return (
    <div data-testid="continue-card" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4" style={{ borderColor: 'rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.06)' }}>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: colors.primary }}>Continue where you left off</p>
        <p className="text-sm font-bold text-white">{d.lesson}</p>
        <p className="text-[11px]" style={{ color: semantic.textSecondary }}>
          {d.track} · {overallPercent(progress, lessonIds)}% of the Academy complete · <SyncNote sync={sync} />
        </p>
      </div>
      <button type="button" onClick={() => onContinue(target.lessonId, target.stepId)} className="rounded-lg px-5 py-2 text-xs font-bold text-black" style={{ background: colors.primary }}>
        Continue →
      </button>
    </div>
  );
}

function LearningPathsView({ tracks, initial, course }: { tracks: AcademyTrack[]; initial?: AcademyInitialState; course: Course }) {
  const seedTrack = tracks.find((t) => t.slug === initial?.track) ?? tracks[0];
  const seedLesson = seedTrack?.lessons.find((l) => l.slug === initial?.lesson) ?? seedTrack?.lessons[0];
  const [activeTrackSlug, setActiveTrackSlug] = React.useState(seedTrack?.slug ?? '');
  const [activeLessonSlug, setActiveLessonSlug] = React.useState(seedLesson?.slug ?? '');
  const [step, setStep] = React.useState<Step>(initial?.step === 'see' || initial?.step === 'create' ? initial.step : 'learn');
  // keep the address bar in step with the open lesson (only after the learner navigates or arrived by a deep link)
  const touched = React.useRef(!!initial?.track);
  // the step open inside the lesson (deep link `s=`); null lets the player resume from saved progress
  const [lessonStepId, setLessonStepId] = React.useState<string | null>(initial?.s ?? null);
  const [shownStepId, setShownStepId] = React.useState<string | null>(initial?.s ?? null);
  React.useEffect(() => {
    if (touched.current) syncUrl({ track: activeTrackSlug, lesson: activeLessonSlug, step: step === 'learn' ? null : step, s: step === 'learn' ? shownStepId : null });
  }, [activeTrackSlug, activeLessonSlug, step, shownStepId]);
  React.useEffect(() => { touched.current = true; }, [activeTrackSlug, activeLessonSlug, step]);
  const [modalTemplate, setModalTemplate] = React.useState<{ slug: string; title: string } | null>(null);

  const activeTrack = tracks.find((t) => t.slug === activeTrackSlug) ?? tracks[0];
  const isUgc = activeTrack.slug === 'ugc';

  const openLesson = (trackSlug: string, lessonSlug: string, stepId: string | null = null) => {
    setActiveTrackSlug(trackSlug);
    setActiveLessonSlug(lessonSlug);
    setLessonStepId(stepId);
    setShownStepId(stepId);
    setStep('learn');
  };
  const selectTrack = (slug: string) => {
    const t = tracks.find((x) => x.slug === slug);
    // opening a track resumes the lesson the learner was last on in it, else its first lesson
    const resume = course.progress.lastLessonId?.startsWith(`${slug}/`) ? course.progress.lastLessonId.slice(slug.length + 1) : null;
    const lesson = (resume && t?.lessons.find((l) => l.slug === resume)?.slug) || t?.lessons[0]?.slug || '';
    openLesson(slug, lesson);
  };

  const lessonIds = React.useMemo(() => tracks.flatMap((t) => t.lessons.map((l) => lessonKey(t.slug, l.slug))), [tracks]);
  const describe = (id: string) => {
    const [tr, ...rest] = id.split('/');
    const t = tracks.find((x) => x.slug === tr);
    const l = t?.lessons.find((x) => x.slug === rest.join('/'));
    return t && l ? { track: t.title, lesson: l.title } : null;
  };
  const continueTo = (id: string, stepId: string | null) => {
    const [tr, ...rest] = id.split('/');
    openLesson(tr, rest.join('/'), stepId);
  };
  // the lesson after this one, in course order (crossing into the next track)
  const nextLesson = (() => {
    const i = lessonIds.indexOf(lessonKey(activeTrack.slug, activeLessonSlug));
    const nextId = i >= 0 ? lessonIds[i + 1] : undefined;
    const d = nextId ? describe(nextId) : null;
    return nextId && d ? { title: d.lesson, go: () => continueTo(nextId, null) } : null;
  })();

  const ugcAssets: AcademyAsset[] = isUgc
    ? academyAssets
    : mediaManifest
        .filter((m) => m.track === activeTrack.slug)
        .map((m) => ({
          id: m.file,
          title: m.file.split('/').pop() ?? m.file,
          type: m.type,
          src: m.src,
          thumbnail: m.src,
          category: 'ugc' as const,
          lesson: activeLessonSlug,
          description: `${m.trackTitle} example media (${m.type}).`,
          tags: [m.track, m.type],
          requiresProvenanceReview: false,
        }));

  const ugcTemplates = isUgc ? academyTemplates : [];

  return (
    <div className="grid grid-cols-1 gap-0 md:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="border-b border-white/10 md:max-h-[calc(100vh-57px)] md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="p-3">
          <span className="px-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Tracks</span>
          <nav className="mt-2 space-y-1">
            {tracks.map((t) => (
              <div key={t.slug}>
                <button
                  onClick={() => selectTrack(t.slug)}
                  className={cx(
                    'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  )}
                  style={
                    t.slug === activeTrackSlug
                      ? { background: semantic.activeAccent, color: colors.primary }
                      : { color: semantic.textSecondary }
                  }
                >
                  {t.title}
                  <span className="ml-1 text-[10px]" style={{ color: semantic.textMuted }}>
                    {t.lessons.length}L · {t.templates.length}T
                    {(() => {
                      const n = t.lessons.filter((l) => course.progress.completedLessons.includes(lessonKey(t.slug, l.slug))).length;
                      return n > 0 ? ` · ${n}/${t.lessons.length} done` : '';
                    })()}
                  </span>
                </button>
                {t.slug === activeTrackSlug && (
                  <div className="ml-2 mt-1 space-y-0.5 border-l border-white/10 pl-2">
                    {t.lessons.map((l, i) => (
                      <button
                        key={l.slug}
                        onClick={() => openLesson(t.slug, l.slug)}
                        aria-current={l.slug === activeLessonSlug ? 'page' : undefined}
                        className={cx(
                          'block w-full rounded px-2 py-1 text-left text-[12px] transition-colors',
                        )}
                        style={{
                          color: l.slug === activeLessonSlug ? colors.primary : semantic.textMuted,
                        }}
                      >
                        {course.progress.completedLessons.includes(lessonKey(t.slug, l.slug)) ? (
                          <><span aria-hidden="true" style={{ color: '#34d399' }}>✓ </span><span className="sr-only">Completed: </span></>
                        ) : i === 0 ? '★ ' : `${i} `}
                        {l.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <main className="p-4 md:p-6">
        <ContinueCard progress={course.progress} lessonIds={lessonIds} describe={describe} onContinue={continueTo} sync={course.sync} />
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-wide" style={{ color: semantic.textSecondary }}>{activeTrack.title}</p>
          <h2 className="text-xl font-extrabold">
            {activeTrack.lessons.find((l) => l.slug === activeLessonSlug)?.title ?? 'Lesson'}
          </h2>
        </div>

        {/* Step switcher */}
        <div className="mb-5 flex flex-wrap gap-2">
          {STEP_META.map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={cx(
                'group flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
              )}
              style={
                step === s.id
                  ? { borderColor: colors.primary, background: semantic.activeAccent }
                  : panels.card
              }
            >
              <span
                className={cx(
                  'flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold',
                )}
                style={
                  step === s.id
                    ? { background: colors.primary, color: 'black' }
                    : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }
                }
              >
                {s.id === 'learn' ? 'L' : s.id === 'see' ? 'S' : 'C'}
              </span>
              <span>
                <span className="block text-xs font-bold text-white">{s.label}</span>
                <span className="block text-[10px]" style={{ color: semantic.textSecondary }}>{s.blurb}</span>
              </span>
            </button>
          ))}
        </div>

        {step === 'learn' && (
          <LessonPlayer
            key={lessonKey(activeTrack.slug, activeLessonSlug)}
            track={activeTrack.slug}
            lessonSlug={activeLessonSlug}
            lessonTitle={activeTrack.lessons.find((l) => l.slug === activeLessonSlug)?.title ?? 'Lesson'}
            progress={course.progress}
            ready={course.ready}
            actions={course}
            initialStepId={lessonStepId}
            onStepChange={setShownStepId}
            next={nextLesson}
          />
        )}

        {step === 'see' && (
          <div>
            {ugcAssets.length ? (
              <AssetGallery assets={ugcAssets} />
            ) : (
              <EmptyState text="No example media bundled for this track yet." />
            )}
          </div>
        )}

        {step === 'create' && (
          <div className="space-y-5">
            {isUgc ? (
              ugcTemplates.map((tpl) => (
                <div key={tpl.id} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white">{tpl.title}</span>
                    {tpl.tags.slice(0, 4).map((tag) => (
                      <Pill key={tag}>#{tag}</Pill>
                    ))}
                  </div>
                  <TemplateView template={tpl} />
                </div>
              ))
            ) : activeTrack.templates.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeTrack.templates.map((tpl) => (
                  <button
                    key={tpl.slug}
                    onClick={() => setModalTemplate({ slug: tpl.slug, title: tpl.title })}
                    className="rounded-2xl p-4 text-left transition-colors hover:border-[#22d3ee]/40"
                    style={panels.card}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-white">
                      <SparkIcon /> {tpl.title}
                    </span>
                    <span className="mt-1 block text-[11px]" style={{ color: semantic.textSecondary }}>
                      Reusable SmartVideo GO AI template — click to open
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState text="No interactive template for this track." />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component: "Build with AI" course (its own tab in the header)  */
/* ------------------------------------------------------------------ */

function BuildWithAiView({ track, initial, course }: { track: AcademyTrack; initial?: AcademyInitialState; course: Course }) {
  const lessons = track.lessons;
  const ids = React.useMemo(() => lessons.map((l) => lessonKey(track.slug, l.slug)), [lessons, track.slug]);
  const seed = initial?.lesson && lessons.some((l) => l.slug === initial.lesson) ? initial.lesson : null;
  const [lessonSlug, setLessonSlug] = React.useState<string | null>(seed);
  const [stepId, setStepId] = React.useState<string | null>(seed ? initial?.s ?? null : null);
  const [shownStepId, setShownStepId] = React.useState<string | null>(seed ? initial?.s ?? null : null);
  const [drawer, setDrawer] = React.useState(false);

  React.useEffect(() => {
    syncUrl({ view: 'build-with-ai', lesson: lessonSlug, s: lessonSlug ? shownStepId : null });
  }, [lessonSlug, shownStepId]);

  const open = (slug: string | null, step: string | null = null) => {
    setLessonSlug(slug);
    setStepId(step);
    setShownStepId(step);
    setDrawer(false);
  };
  const describe = (id: string) => {
    const l = lessons.find((x) => lessonKey(track.slug, x.slug) === id);
    return l ? { track: 'Build with AI', lesson: l.title } : null;
  };
  const continueTo = (id: string, step: string | null) => open(id.slice(track.slug.length + 1), step);
  const idx = lessonSlug ? lessons.findIndex((l) => l.slug === lessonSlug) : -1;
  const nextL = idx >= 0 ? lessons[idx + 1] : undefined;
  const done = ids.filter((id) => course.progress.completedLessons.includes(id)).length;
  const percent = overallPercent(course.progress, ids);
  const started = !!course.progress.lastLessonId && ids.includes(course.progress.lastLessonId) || done > 0;
  const target = courseContinueTarget(course.progress, ids);

  const nav = (
    <nav aria-label="Build with AI lessons" className="space-y-0.5">
      <button
        type="button"
        onClick={() => open(null)}
        aria-current={lessonSlug === null ? 'page' : undefined}
        className="block w-full rounded px-2 py-1.5 text-left text-[12px] font-semibold"
        style={{ color: lessonSlug === null ? colors.primary : semantic.textSecondary }}
      >
        Course home
      </button>
      {lessons.map((l, i) => {
        const complete = course.progress.completedLessons.includes(lessonKey(track.slug, l.slug));
        return (
          <button
            key={l.slug}
            type="button"
            onClick={() => open(l.slug)}
            aria-current={l.slug === lessonSlug ? 'page' : undefined}
            className="block w-full rounded px-2 py-1 text-left text-[12px] transition-colors"
            style={{ color: l.slug === lessonSlug ? colors.primary : semantic.textMuted }}
          >
            {complete ? (
              <><span aria-hidden="true" style={{ color: '#34d399' }}>✓ </span><span className="sr-only">Completed: </span></>
            ) : `${i} `}
            {l.title}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="grid grid-cols-1 gap-0 md:grid-cols-[260px_1fr]" data-testid="build-with-ai">
      <aside className="border-b border-white/10 p-3 md:max-h-[calc(100vh-57px)] md:overflow-y-auto md:border-b-0 md:border-r">
        <button type="button" onClick={() => setDrawer((d) => !d)} aria-expanded={drawer} className="mb-2 w-full rounded-lg border px-3 py-2 text-left text-xs font-semibold md:hidden" style={{ borderColor: 'var(--border-color)', color: semantic.textSecondary }}>
          ☰ Lessons ({done}/{lessons.length} done)
        </button>
        <div className={drawer ? 'block' : 'hidden md:block'}>
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>
            Build with AI · {done}/{lessons.length} lessons
          </p>
          {nav}
        </div>
      </aside>

      <main className="p-4 md:p-6">
        {lessonSlug === null ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: colors.primary }}>Self-paced course</p>
            <h2 className="mb-2 text-2xl font-extrabold">Build and launch an app with Claude or ChatGPT</h2>
            <p className="mb-3 max-w-3xl text-sm" style={{ color: semantic.textPrimary }}>
              Open free Netlify, Clerk and Stripe accounts, connect Claude or ChatGPT to them, host your app, add sign-up with Clerk, take test payments with Stripe and go live. Every lesson takes under 20 minutes, goes one step at a time, and remembers where you left off.
            </p>
            <p className="mb-5 max-w-3xl text-sm" style={{ color: semantic.textSecondary }}>
              The reseller apps already include Stripe payments, a database and Google sign-in. Netlify hosting and Clerk sign-in are changes your assistant makes in your own copy, on a separate branch, with your approval at each step.
            </p>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => (started && target ? continueTo(target.lessonId, target.stepId) : open(lessons[0]?.slug ?? null))}
                className="rounded-lg px-6 py-2.5 text-sm font-bold text-black"
                style={{ background: colors.primary }}
              >
                {started && target ? 'Continue where you left off →' : 'Start the course →'}
              </button>
              <span className="text-xs" style={{ color: semantic.textSecondary }}>{percent}% complete · <SyncNote sync={course.sync} /></span>
            </div>
            <ol className="max-w-3xl space-y-1.5">
              {lessons.map((l, i) => {
                const complete = course.progress.completedLessons.includes(lessonKey(track.slug, l.slug));
                return (
                  <li key={l.slug}>
                    <button type="button" onClick={() => open(l.slug)} className="flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors hover:border-[#22d3ee]/40" style={panels.card}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold" style={complete ? { background: '#10b981', color: 'black' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                        {complete ? '✓' : i}
                      </span>
                      <span className="text-white">{l.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-5 max-w-3xl text-xs" style={{ color: semantic.textSecondary }}>
              Bought the reseller package? <a className="underline" style={{ color: colors.primary }} href="/academy/reseller/launch">The Reseller Setup Walkthrough (Module 13)</a> is the same course tied to the app you chose.
            </p>
          </div>
        ) : (
          <>
            <ContinueCard progress={course.progress} lessonIds={ids} describe={describe} onContinue={continueTo} sync={course.sync} />
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-wide" style={{ color: semantic.textSecondary }}>Build with AI · lesson {idx} of {lessons.length - 1}</p>
              <h2 className="text-xl font-extrabold">{lessons[idx]?.title}</h2>
            </div>
            <LessonPlayer
              key={lessonKey(track.slug, lessonSlug)}
              track={track.slug}
              lessonSlug={lessonSlug}
              lessonTitle={lessons[idx]?.title ?? 'Lesson'}
              progress={course.progress}
              ready={course.ready}
              actions={course}
              initialStepId={stepId}
              onStepChange={setShownStepId}
              next={nextL ? { title: nextL.title, go: () => open(nextL.slug) } : null}
            />
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component: Studio Reference View                              */
/* ------------------------------------------------------------------ */

/** Initial navigation state, parsed from the URL by app/academy/page.tsx (deep links). */
export interface AcademyInitialState {
  view?: 'learning-paths' | 'studio-reference' | 'build-with-ai';
  studio?: string;
  tab?: string;
  track?: string;
  lesson?: string;
  step?: string;
  /** The lesson step to open (deep link). */
  s?: string;
}

const VALID_TABS = new Set(['create', 'overview', 'getting-started', 'inputs-models', 'best-practices', 'use-cases', 'troubleshooting', 'business-related', 'glossary', 'academy-guidance']);

/** Keep the address bar in step with what the learner is looking at, so reload and sharing work. */
function syncUrl(params: Record<string, string | null | undefined>) {
  try {
    const u = new URL(window.location.href);
    for (const k of ['view', 'studio', 'tab', 'track', 'lesson', 'step', 's']) u.searchParams.delete(k);
    for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
    window.history.replaceState(null, '', `${u.pathname}${u.search}`);
  } catch {
    /* no window / blocked: deep links are a convenience only */
  }
}

function StudioCard({ studio, onClick }: { studio: Studio; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl p-5 text-left transition-all hover:border-[#22d3ee]/30"
      style={panels.card}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-extrabold text-white">{studio.name}</h3>
        <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(34,211,238,0.15)', color: colors.primary }}>
          {studio.keyFeatures.length} features
        </span>
      </div>
      <p className="mb-3 text-xs leading-relaxed line-clamp-3" style={{ color: semantic.textSecondary }}>
        {studio.shortDescription}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {studio.keyFeatures.slice(0, 3).map((f, i) => (
          <span key={i} className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: semantic.textSecondary }}>
            {f}
          </span>
        ))}
        {studio.keyFeatures.length > 3 && (
          <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: semantic.textMuted }}>
            +{studio.keyFeatures.length - 3} more
          </span>
        )}
      </div>
    </button>
  );
}

function StudioDetailPanel({
  studio,
  onClose,
  tracks = [],
  initialTab = 'create',
  onTabChange,
}: {
  studio: Studio;
  onClose: () => void;
  tracks?: AcademyTrack[];
  initialTab?: StudioTab;
  onTabChange?: (t: StudioTab) => void;
}) {
  const [activeTab, setActiveTabState] = React.useState<StudioTab>(initialTab);
  const setActiveTab = (t: StudioTab) => {
    setActiveTabState(t);
    onTabChange?.(t);
  };
  const guide = getStudioGuide(studio.id);
  const studioRoute = guide?.route ?? studio.route;

  const renderField = (label: string, value: React.ReactNode) => (
    <div className="mb-4">
      <h4 className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>{label}</h4>
      <div className="text-sm leading-relaxed" style={{ color: semantic.textSecondary }}>{value}</div>
    </div>
  );

  const renderList = (items: string[] = []) => (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: semantic.textSecondary }}>
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: colors.primary }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

  const renderDict = (obj: Record<string, string> = {}) => (
    <div className="space-y-2">
      {Object.entries(obj).map(([key, val]) => (
        <div key={key} className="rounded-lg p-3" style={panels.card}>
          <span className="block text-xs font-bold" style={{ color: colors.primary }}>{key}</span>
          <span className="mt-1 block text-sm" style={{ color: semantic.textSecondary }}>{val}</span>
        </div>
      ))}
    </div>
  );

  const renderArrayObjects = (items: Array<Record<string, any>> = [], titleKey?: string) => (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl p-4" style={{ ...panels.card, background: 'rgba(255,255,255,0.02)' }}>
          {titleKey && item[titleKey] && (
            <h4 className="mb-2 text-sm font-bold text-white">{item[titleKey]}</h4>
          )}
          {Object.entries(item).map(([key, val]) => {
            if (titleKey && key === titleKey) return null;
            if (Array.isArray(val)) {
              return (
                <div key={key} className="mb-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: semantic.textLabel }}>{key}</span>
                  <ul className="mt-1 space-y-1">
                    {(val as string[]).map((v, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm" style={{ color: semantic.textSecondary }}>
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: colors.primary }} />
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            if (typeof val === 'object' && val !== null) {
              return (
                <div key={key} className="mb-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: semantic.textLabel }}>{key}</span>
                  <div className="mt-1 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {Object.entries(val).map(([k, v]) => (
                      <div key={k} className="mb-1">
                        <span className="text-xs font-bold" style={{ color: colors.primary }}>{k}: </span>
                        <span className="text-sm" style={{ color: semantic.textSecondary }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <div key={key} className="mb-1">
                <span className="text-xs font-bold" style={{ color: colors.primary }}>{key}: </span>
                <span className="text-sm" style={{ color: semantic.textSecondary }}>{String(val)}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/80 p-4 pt-8 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-2xl"
        style={panels.card}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 p-5" style={{ background: 'var(--bg-card)' }}>
          <div>
            <h2 className="text-lg font-extrabold text-white">{studio.name}</h2>
            <p className="mt-1 text-xs" style={{ color: semantic.textSecondary }}>{studio.shortDescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs hover:bg-white/10"
            style={buttons.ghost}
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 px-5 pt-3">
          <div className="flex gap-1 overflow-x-auto">
            {STUDIO_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                style={
                  activeTab === tab.id
                    ? { background: semantic.activeAccent, color: colors.primary }
                    : { color: semantic.textMuted }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === 'create' && (
            <div data-testid="studio-create-guide">
              {guide?.tagline && <p className="mb-4 text-sm" style={{ color: semantic.textSecondary }}>{guide.tagline}</p>}
              <a
                href={studioRoute}
                className="mb-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: colors.primary }}
              >
                <SparkIcon /> Open {guide?.label ?? studio.name}
              </a>
              {(() => {
                const steps = studio.howToSteps && studio.howToSteps.length ? studio.howToSteps : studio.gettingStarted ?? [];
                return steps.length ? (
                  <div className="mb-6">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Step by step</h4>
                    <ol className="space-y-3">
                      {steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold" style={{ background: 'rgba(34,211,238,0.15)', color: colors.primary }}>{i + 1}</span>
                          <span className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null;
              })()}
              {(studio as any).exampleWorkflows?.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Example workflows</h4>
                  <div className="space-y-3">
                    {((studio as any).exampleWorkflows as Array<{ title: string; steps: string[] }>).map((w, i) => (
                      <details key={i} className="rounded-xl border px-4 py-3" style={{ borderColor: 'var(--glass-border)' }}>
                        <summary className="cursor-pointer text-sm font-semibold text-white">{w.title}</summary>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm" style={{ color: semantic.textSecondary }}>
                          {w.steps.map((st, j) => <li key={j}>{st}</li>)}
                        </ol>
                      </details>
                    ))}
                  </div>
                </div>
              )}
              {guide && (guide.lessons.length > 0 || (guide.resellerLessons?.length ?? 0) > 0) && (
                <div className="mb-4" data-testid="studio-lessons">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Lessons to take for this studio</h4>
                  <ul className="space-y-1.5">
                    {guide.lessons.map((l) => {
                      const title = tracks.find((t) => t.slug === l.track)?.lessons.find((x) => x.slug === l.lesson)?.title ?? l.lesson;
                      return (
                        <li key={`${l.track}/${l.lesson}`} className="text-sm">
                          <a href={academyTrackUrl(l.track, l.lesson)} className="font-semibold underline" style={{ color: colors.primary }}>{title}</a>
                          <span style={{ color: semantic.textSecondary }}> — {l.why}</span>
                        </li>
                      );
                    })}
                    {guide.resellerLessons?.map((l) => (
                      <li key={`r${l.id}`} className="text-sm">
                        <a href={`/academy/reseller/launch?lesson=${l.id}`} className="font-semibold underline" style={{ color: colors.primary }}>{l.id} {l.title}</a>
                        <span style={{ color: semantic.textSecondary }}> — Reseller Setup Walkthrough</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {guide && guide.tracks.length > 0 && (
                <div className="mb-2">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Related Academy courses</h4>
                  <div className="flex flex-wrap gap-2">
                    {guide.tracks.map((slug) => (
                      <a key={slug} href={academyTrackUrl(slug)} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(34,211,238,0.3)', color: colors.primary }}>
                        {tracks.find((t) => t.slug === slug)?.title ?? slug}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {studio.id === 'apps' && (
                <p className="mt-4 text-sm"><a className="underline" style={{ color: colors.primary }} href="/academy/reseller/launch">Reseller Setup Walkthrough →</a></p>
              )}
            </div>
          )}

          {activeTab === 'overview' && (
            <div>
              {renderField('Description', <p className="whitespace-pre-line">{studio.description}</p>)}
              {studio.keyFeatures?.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Key Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {studio.keyFeatures.map((f, i) => (
                      <Pill key={i} tone="primary">{f}</Pill>
                    ))}
                  </div>
                </div>
              )}
              {renderField('How to Use', <p className="whitespace-pre-line">{studio.howToUse}</p>)}
              {studio.whenToUse && studio.whenToUse.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>When to Use</h4>
                  {renderList(studio.whenToUse)}
                </div>
              )}
              {studio.whenToUseAnother && studio.whenToUseAnother.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>When to Use Another Studio</h4>
                  {renderList(studio.whenToUseAnother)}
                </div>
              )}
              {studio.bestFor && renderField('Best For', studio.bestFor)}
            </div>
          )}

          {activeTab === 'getting-started' && (
            <div>
              {studio.gettingStarted && studio.gettingStarted.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Getting Started</h4>
                  <div className="space-y-3">
                    {studio.gettingStarted.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold" style={{ background: 'rgba(34,211,238,0.15)', color: colors.primary }}>{i + 1}</span>
                        <span className="text-sm" style={{ color: semantic.textSecondary }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {studio.howToSteps && studio.howToSteps.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>How To Steps</h4>
                  <div className="space-y-3">
                    {studio.howToSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold" style={{ background: 'rgba(168,85,247,0.15)', color: '#c4b5fd' }}>{i + 1}</span>
                        <span className="text-sm" style={{ color: semantic.textSecondary }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inputs-models' && (
            <div className="space-y-6">
              {studio.inputs && studio.inputs.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Inputs</h4>
                  {renderList(studio.inputs)}
                </div>
              )}
              {studio.requiredInputs && studio.requiredInputs.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Required Inputs</h4>
                  {renderList(studio.requiredInputs)}
                </div>
              )}
              {studio.optionalInputs && studio.optionalInputs.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Optional Inputs</h4>
                  {renderList(studio.optionalInputs)}
                </div>
              )}
              {studio.generationModes && studio.generationModes.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Generation Modes</h4>
                  <div className="flex flex-wrap gap-2">
                    {studio.generationModes.map((m, i) => (
                      <Pill key={i} tone="accent">{m}</Pill>
                    ))}
                  </div>
                </div>
              )}
              {studio.modelCapabilities && renderField('Model Capabilities', <p className="whitespace-pre-line">{studio.modelCapabilities}</p>)}
              {studio.modelExplanations && renderField('Model Explanations', <p className="whitespace-pre-line">{studio.modelExplanations}</p>)}
              {studio.featureExplanations && studio.featureExplanations.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Feature Explanations</h4>
                  {renderArrayObjects(studio.featureExplanations, 'feature')}
                </div>
              )}
              {studio.inputDetails && studio.inputDetails.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Input Details</h4>
                  {renderArrayObjects(studio.inputDetails, 'name')}
                </div>
              )}
              {studio.modeExplanations && studio.modeExplanations.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Mode Explanations</h4>
                  {renderArrayObjects(studio.modeExplanations, 'mode')}
                </div>
              )}
              {studio.advancedFeatures && studio.advancedFeatures.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Advanced Features</h4>
                  {renderList(studio.advancedFeatures)}
                </div>
              )}
              {studio.advancedFeatureExplanations && studio.advancedFeatureExplanations.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Advanced Feature Explanations</h4>
                  {renderArrayObjects(studio.advancedFeatureExplanations, 'feature')}
                </div>
              )}
              {studio.outputDetails && studio.outputDetails.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Output Details</h4>
                  {renderArrayObjects(studio.outputDetails, 'outputType')}
                </div>
              )}
            </div>
          )}

          {activeTab === 'best-practices' && (
            <div>
              {studio.bestPractices && studio.bestPractices.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Best Practices</h4>
                  {renderList(studio.bestPractices)}
                </div>
              )}
              {studio.tips && studio.tips.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Tips</h4>
                  {renderList(studio.tips)}
                </div>
              )}
              {studio.exampleWorkflows && studio.exampleWorkflows.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Example Workflows</h4>
                  {renderArrayObjects(studio.exampleWorkflows, 'title')}
                </div>
              )}
            </div>
          )}

          {activeTab === 'use-cases' && (
            <div>
              {studio.useCases && studio.useCases.length > 0 ? (
                renderArrayObjects(studio.useCases, 'title')
              ) : (
                <p className="text-sm" style={{ color: semantic.textMuted }}>No use cases documented yet.</p>
              )}
            </div>
          )}

          {activeTab === 'troubleshooting' && (
            <div className="space-y-6">
              {studio.commonProblems && studio.commonProblems.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Common Problems</h4>
                  {renderArrayObjects(studio.commonProblems, 'problem')}
                </div>
              )}
              {studio.troubleshootingSteps && studio.troubleshootingSteps.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Troubleshooting Steps</h4>
                  {renderArrayObjects(studio.troubleshootingSteps, 'issue')}
                </div>
              )}
              {studio.limitationDetails && studio.limitationDetails.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Limitation Details</h4>
                  {renderArrayObjects(studio.limitationDetails, 'limitation')}
                </div>
              )}
              {studio.limitations && studio.limitations.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Limitations</h4>
                  {renderList(studio.limitations)}
                </div>
              )}
              {studio.troubleshooting && studio.troubleshooting.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Troubleshooting</h4>
                  {renderList(studio.troubleshooting)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'business-related' && (
            <div className="space-y-6">
              {studio.businessValue && renderField('Business Value', <p className="whitespace-pre-line">{studio.businessValue}</p>)}
              {studio.competitivePositioning && renderField('Competitive Positioning', <p className="whitespace-pre-line">{studio.competitivePositioning}</p>)}
              {studio.targetCustomers && studio.targetCustomers.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Target Customers</h4>
                  <div className="flex flex-wrap gap-2">
                    {studio.targetCustomers.map((c, i) => (
                      <Pill key={i} tone="default">{c}</Pill>
                    ))}
                  </div>
                </div>
              )}
              {studio.contentTypes && studio.contentTypes.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Content Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {studio.contentTypes.map((c, i) => (
                      <Pill key={i} tone="accent">{c}</Pill>
                    ))}
                  </div>
                </div>
              )}
              {studio.relatedStudioGuidance && studio.relatedStudioGuidance.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Related Studio Guidance</h4>
                  {renderArrayObjects(studio.relatedStudioGuidance, 'studio')}
                </div>
              )}
              {studio.faqs && studio.faqs.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>FAQs</h4>
                  <div className="space-y-3">
                    {studio.faqs.map((faq, i) => (
                      <div key={i} className="rounded-xl p-4" style={panels.card}>
                        <h5 className="mb-1 text-sm font-bold text-white">{faq.question}</h5>
                        <p className="text-sm" style={{ color: semantic.textSecondary }}>{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'glossary' && (
            <div>
              {studio.glossary && Object.keys(studio.glossary).length > 0 ? (
                renderDict(studio.glossary)
              ) : (
                <p className="text-sm" style={{ color: semantic.textMuted }}>No glossary terms documented yet.</p>
              )}
            </div>
          )}

          {activeTab === 'academy-guidance' && (
            <div>
              {studio.academyGuidance && studio.academyGuidance.length > 0 ? (
                <div className="space-y-3">
                  {studio.academyGuidance.map((ag, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ ...panels.card, borderColor: 'rgba(34,211,238,0.2)' }}>
                      <h4 className="mb-1 text-sm font-bold" style={{ color: colors.primary }}>{ag.resource}</h4>
                      <p className="text-sm" style={{ color: semantic.textSecondary }}>{ag.whatYouLearn}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: semantic.textMuted }}>No academy guidance documented yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudioReferenceView({ onBack, tracks = [], initial }: { onBack: () => void; tracks?: AcademyTrack[]; initial?: AcademyInitialState }) {
  const [search, setSearch] = React.useState('');
  const [selectedStudio, setSelectedStudioState] = React.useState<Studio | null>(
    () => STUDIOS.find((x) => x.id === initial?.studio) ?? null,
  );
  const [studioTab, setStudioTab] = React.useState<StudioTab>(
    initial?.tab && VALID_TABS.has(initial.tab) ? (initial.tab as StudioTab) : 'create',
  );
  const setSelectedStudio = (st: Studio | null) => {
    setSelectedStudioState(st);
    if (st) { setStudioTab('create'); syncUrl({ view: 'studio-reference', studio: st.id, tab: 'create' }); }
    else syncUrl({ view: 'studio-reference' });
  };

  const filtered = React.useMemo(() => {
    if (!search.trim()) return STUDIOS;
    const q = search.toLowerCase();
    return STUDIOS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (getStudioGuide(s.id)?.label ?? '').toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.shortDescription.toLowerCase().includes(q) ||
        s.keyFeatures.some((f) => f.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-white">Studio Reference</h2>
        <p className="mt-1 text-xs" style={{ color: semantic.textSecondary }}>
          Browse all {STUDIOS.length} SmartVideo GO AI studios. Click a studio to view detailed documentation.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search studios by name, description, or keyword..."
          className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
          style={{ ...panels.card, color: 'white' }}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((studio) => (
          <StudioCard
            key={studio.id}
            studio={studio}
            onClick={() => setSelectedStudio(studio)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: semantic.textMuted }}>No studios match your search.</p>
        </div>
      )}

      {selectedStudio && (
        <StudioDetailPanel
          key={selectedStudio.id}
          studio={selectedStudio}
          tracks={tracks}
          initialTab={studioTab}
          onTabChange={(t) => { setStudioTab(t); syncUrl({ view: 'studio-reference', studio: selectedStudio.id, tab: t }); }}
          onClose={() => setSelectedStudio(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state helper                                                 */
/* ------------------------------------------------------------------ */

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm" style={{ color: semantic.textSecondary }}>
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Top-level AcademyCourse                                            */
/* ------------------------------------------------------------------ */

type AcademyView = 'learning-paths' | 'studio-reference' | 'build-with-ai';

export default function AcademyCourse({ tracks, initial }: { tracks: AcademyTrack[]; initial?: AcademyInitialState }) {
  // The Build with AI course has its own tab; the other tracks are the Learning Paths.
  const buildTrack = tracks.find((t) => t.slug === BUILD_WITH_AI_TRACK) ?? null;
  const pathTracks = React.useMemo(() => tracks.filter((t) => t.slug !== BUILD_WITH_AI_TRACK), [tracks]);
  const allLessonIds = React.useMemo(() => tracks.flatMap((t) => t.lessons.map((l) => lessonKey(t.slug, l.slug))), [tracks]);
  // one progress store for the whole Academy, shared by every tab
  const course = useCourseProgress(allLessonIds);

  const [view, setViewState] = React.useState<AcademyView>(
    buildTrack && (initial?.view === 'build-with-ai' || initial?.track === BUILD_WITH_AI_TRACK)
      ? 'build-with-ai'
      : initial?.view === 'studio-reference' || (initial?.studio && !initial?.track) ? 'studio-reference' : 'learning-paths',
  );
  const setView = (v: AcademyView) => {
    setViewState(v);
    // each tab writes its own address (the views sync it themselves once they open); clear stale params first
    syncUrl(v === 'studio-reference' ? { view: 'studio-reference' } : v === 'build-with-ai' ? { view: 'build-with-ai' } : {});
  };
  // links to the Build with AI track from older addresses open the tab with the same lesson
  const buildInitial: AcademyInitialState | undefined = initial?.track === BUILD_WITH_AI_TRACK ? { ...initial, view: 'build-with-ai' } : initial;
  const learningInitial: AcademyInitialState | undefined = initial?.track === BUILD_WITH_AI_TRACK ? { ...initial, track: undefined, lesson: undefined } : initial;

  const tabs: { id: AcademyView; label: string }[] = [
    { id: 'learning-paths', label: 'Learning Paths' },
    { id: 'studio-reference', label: 'Studio Reference' },
    ...(buildTrack ? [{ id: 'build-with-ai' as const, label: 'Build with AI' }] : []),
  ];

  return (
    <div className="min-h-screen" style={appWrapper}>
      <header className="sticky top-0 z-30 border-b backdrop-blur-md" style={panels.subHeader}>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
              <SparkIcon />
            </div>
            <div>
              <h1 className="text-sm font-extrabold leading-tight">SmartVideo GO AI Academy</h1>
              <p className="text-[11px]" style={{ color: semantic.textSecondary }}>
                {pathTracks.length} course tracks · rebranded for SmartVideo GO AI
              </p>
            </div>
          </div>

          {/* View switcher */}
          <div role="tablist" aria-label="Academy sections" className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={view === t.id}
                onClick={() => setView(t.id)}
                className={cx('rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors')}
                style={
                  view === t.id
                    ? { background: semantic.activeAccent, color: colors.primary, border: '1px solid rgba(34,211,238,0.3)' }
                    : { color: semantic.textMuted }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <a
            href={getStudioGuide(initial?.studio)?.route ?? '/studio'}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-white/10 hover:text-white"
            style={buttons.ghost}
          >
            Open Studio →
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {view === 'learning-paths' ? (
          <LearningPathsView tracks={pathTracks} initial={learningInitial} course={course} />
        ) : view === 'build-with-ai' && buildTrack ? (
          <BuildWithAiView track={buildTrack} initial={buildInitial} course={course} />
        ) : (
          <StudioReferenceView onBack={() => setView('learning-paths')} tracks={tracks} initial={initial} />
        )}
      </div>
    </div>
  );
}

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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Step = 'learn' | 'see' | 'create';

type StudioTab =
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

function LearningPathsView({ tracks }: { tracks: AcademyTrack[] }) {
  const [activeTrackSlug, setActiveTrackSlug] = React.useState(tracks[0]?.slug ?? '');
  const [activeLessonSlug, setActiveLessonSlug] = React.useState(tracks[0]?.lessons[0]?.slug ?? '');
  const [step, setStep] = React.useState<Step>('learn');
  const [modalTemplate, setModalTemplate] = React.useState<{ slug: string; title: string } | null>(null);

  const activeTrack = tracks.find((t) => t.slug === activeTrackSlug) ?? tracks[0];
  const isUgc = activeTrack.slug === 'ugc';

  const selectTrack = (slug: string) => {
    const t = tracks.find((x) => x.slug === slug);
    setActiveTrackSlug(slug);
    setActiveLessonSlug(t?.lessons[0]?.slug ?? '');
    setStep('learn');
  };

  const { md: lessonMd, loading: lessonLoading } = useMarkdown(activeTrack.slug, activeLessonSlug, 'lesson');

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
                  <span className="ml-1 text-[10px]" style={{ color: semantic.textMuted }}>{t.lessons.length}L · {t.templates.length}T</span>
                </button>
                {t.slug === activeTrackSlug && (
                  <div className="ml-2 mt-1 space-y-0.5 border-l border-white/10 pl-2">
                    {t.lessons.map((l, i) => (
                      <button
                        key={l.slug}
                        onClick={() => {
                          setActiveLessonSlug(l.slug);
                          setStep('learn');
                        }}
                        className={cx(
                          'block w-full rounded px-2 py-1 text-left text-[12px] transition-colors',
                        )}
                        style={{
                          color: l.slug === activeLessonSlug ? colors.primary : semantic.textMuted,
                        }}
                      >
                        {i === 0 ? '★ ' : `${i} `}
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
          <AcademyCard>
            {lessonLoading ? (
              <div className="py-10 text-center text-sm" style={{ color: semantic.textSecondary }}>Loading lesson…</div>
            ) : (
              <LessonViewer markdown={lessonMd ?? ''} track={activeTrack.slug} />
            )}
          </AcademyCard>
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
/*  Sub-component: Studio Reference View                              */
/* ------------------------------------------------------------------ */

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

function StudioDetailPanel({ studio, onClose }: { studio: Studio; onClose: () => void }) {
  const [activeTab, setActiveTab] = React.useState<StudioTab>('overview');

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

function StudioReferenceView({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = React.useState('');
  const [selectedStudio, setSelectedStudio] = React.useState<Studio | null>(null);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return STUDIOS;
    const q = search.toLowerCase();
    return STUDIOS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
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
        <StudioDetailPanel studio={selectedStudio} onClose={() => setSelectedStudio(null)} />
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

export default function AcademyCourse({ tracks }: { tracks: AcademyTrack[] }) {
  const [view, setView] = React.useState<'learning-paths' | 'studio-reference'>('learning-paths');

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
                {tracks.length} course tracks · rebranded for SmartVideo GO AI
              </p>
            </div>
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setView('learning-paths')}
              className={cx(
                'rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors',
              )}
              style={
                view === 'learning-paths'
                  ? { background: semantic.activeAccent, color: colors.primary, border: '1px solid rgba(34,211,238,0.3)' }
                  : { color: semantic.textMuted }
              }
            >
              Learning Paths
            </button>
            <button
              onClick={() => setView('studio-reference')}
              className={cx(
                'rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors',
              )}
              style={
                view === 'studio-reference'
                  ? { background: semantic.activeAccent, color: colors.primary, border: '1px solid rgba(34,211,238,0.3)' }
                  : { color: semantic.textMuted }
              }
            >
              Studio Reference
            </button>
          </div>

          <a
            href="/studio/video"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-white/10 hover:text-white"
            style={buttons.ghost}
          >
            Open Studio →
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {view === 'learning-paths' ? (
          <LearningPathsView tracks={tracks} />
        ) : (
          <StudioReferenceView onBack={() => setView('learning-paths')} />
        )}
      </div>
    </div>
  );
}

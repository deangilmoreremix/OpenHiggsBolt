'use client';

import React from 'react';
import { AcademyCard, Pill, ActionButton, cx, SparkIcon } from './primitives';
import { AssetGallery, LessonViewer } from './AssetGallery';
import { TemplateView } from './TemplateComponents';
import { academyAssets, type AcademyAsset } from '@/data/academyAssets';
import { academyTemplates } from '@/data/academyTemplates';
import type { AcademyTrack } from '@/lib/academyLessons';
import manifest from '@/data/academyMediaManifest.json';
import studioKb from '@/data/studioKnowledgeBase.json';
import { panels, buttons, semantic, appWrapper, optionStyle, colors } from '@/shared/styles/designTokens';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Step = 'learn' | 'see' | 'create';

type StudioKb = {
  id: string;
  name: string;
  route: string;
  description: string;
  keyFeatures: string[];
  targetCustomers: string[];
  contentTypes: string[];
  howToUse: string;
  bestPractices: string[];
  useCases: { title: string; description: string; steps: string[]; expectedOutput: string; businessImpact: string }[];
  glossary: Record<string, string>;
  academyGuidance: { resource: string; whatYouLearn: string }[];
};

const studios = studioKb.studios as unknown as StudioKb[];

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

      {modalTemplate && (
        <TemplateModal
          track={activeTrack.slug}
          slug={modalTemplate.slug}
          title={modalTemplate.title}
          onClose={() => setModalTemplate(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-component: Studio Reference View                              */
/* ------------------------------------------------------------------ */

type DetailTab =
  | 'overview'
  | 'targetCustomers'
  | 'contentTypes'
  | 'howToUse'
  | 'bestPractices'
  | 'useCases'
  | 'glossary'
  | 'academyGuidance';

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'targetCustomers', label: 'Target Customers' },
  { id: 'contentTypes', label: 'Content Types' },
  { id: 'howToUse', label: 'How to Use' },
  { id: 'bestPractices', label: 'Best Practices' },
  { id: 'useCases', label: 'Use Cases' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'academyGuidance', label: 'Academy Guidance' },
];

function StudioCard({ studio, onClick }: { studio: StudioKb; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl p-5 text-left transition-colors hover:border-[#22d3ee]/40"
      style={panels.card}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-white">{studio.name}</h3>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: semantic.activeAccent, color: colors.primary, border: '1px solid rgba(34,211,238,0.25)' }}
        >
          {studio.keyFeatures.length} features
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>
        {studio.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {studio.keyFeatures.slice(0, 3).map((f) => (
          <span
            key={f}
            className="rounded-md px-2 py-0.5 text-[10px]"
            style={{ background: 'rgba(255,255,255,0.05)', color: semantic.textSecondary, border: '1px solid var(--border-color)' }}
          >
            {f}
          </span>
        ))}
        {studio.keyFeatures.length > 3 && (
          <span className="px-2 py-0.5 text-[10px]" style={{ color: semantic.textMuted }}>
            +{studio.keyFeatures.length - 3} more
          </span>
        )}
      </div>
    </button>
  );
}

function StudioDetailPanel({ studio, onClose }: { studio: StudioKb; onClose: () => void }) {
  const [tab, setTab] = React.useState<DetailTab>('overview');

  const sections: { id: DetailTab; label: string; render: () => React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Overview',
      render: () => (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: semantic.textSecondary }}>{studio.description}</p>
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Key Features</h4>
            <ul className="space-y-1.5">
              {studio.keyFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs" style={{ color: semantic.textSecondary }}>
                  <span style={{ color: colors.primary }}>›</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: semantic.textLabel }}>How to Use</h4>
            <p className="text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>{studio.howToUse}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'targetCustomers',
      label: 'Target Customers',
      render: () => (
        <div className="flex flex-wrap gap-2">
          {studio.targetCustomers.map((c) => (
            <span
              key={c}
              className="rounded-lg px-3 py-1.5 text-xs"
              style={{ background: 'rgba(255,255,255,0.05)', color: semantic.textSecondary, border: '1px solid var(--border-color)' }}
            >
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: 'contentTypes',
      label: 'Content Types',
      render: () => (
        <div className="flex flex-wrap gap-2">
          {studio.contentTypes.map((c) => (
            <span
              key={c}
              className="rounded-lg px-3 py-1.5 text-xs"
              style={{ background: 'rgba(255,255,255,0.05)', color: semantic.textSecondary, border: '1px solid var(--border-color)' }}
            >
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: 'howToUse',
      label: 'How to Use',
      render: () => (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: semantic.textSecondary }}>{studio.howToUse}</p>
        </div>
      ),
    },
    {
      id: 'bestPractices',
      label: 'Best Practices',
      render: () => (
        <ul className="space-y-2">
          {studio.bestPractices.map((bp) => (
            <li key={bp} className="flex items-start gap-2 text-xs" style={{ color: semantic.textSecondary }}>
              <span className="mt-0.5 shrink-0" style={{ color: colors.primary }}>✓</span>
              {bp}
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'useCases',
      label: 'Use Cases',
      render: () => (
        <div className="space-y-5">
          {studio.useCases.map((uc) => (
            <div key={uc.title} className="rounded-xl p-4" style={{ ...panels.card, background: 'var(--glass-bg)' }}>
              <h4 className="text-sm font-bold text-white">{uc.title}</h4>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>{uc.description}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                {uc.steps.map((s, i) => (
                  <li key={i} className="text-xs" style={{ color: semantic.textSecondary }}>{s}</li>
                ))}
              </ol>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-[10px] font-bold uppercase" style={{ color: semantic.textLabel }}>Expected Output</span>
                  <p className="mt-0.5 text-[11px]" style={{ color: semantic.textSecondary }}>{uc.expectedOutput}</p>
                </div>
                <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-[10px] font-bold uppercase" style={{ color: semantic.textLabel }}>Business Impact</span>
                  <p className="mt-0.5 text-[11px]" style={{ color: semantic.textSecondary }}>{uc.businessImpact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'glossary',
      label: 'Glossary',
      render: () => (
        <dl className="space-y-3">
          {Object.entries(studio.glossary).map(([term, def]) => (
            <div key={term}>
              <dt className="text-xs font-bold" style={{ color: colors.primary }}>{term}</dt>
              <dd className="mt-0.5 text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>{def}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: 'academyGuidance',
      label: 'Academy Guidance',
      render: () => (
        <div className="space-y-3">
          {studio.academyGuidance.map((g) => (
            <div key={g.resource} className="rounded-xl p-4" style={{ ...panels.card, background: 'rgba(34,211,238,0.05)', borderColor: 'rgba(34,211,238,0.15)' }}>
              <h4 className="text-xs font-bold" style={{ color: colors.primary }}>{g.resource}</h4>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>{g.whatYouLearn}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/80 p-4 pt-8 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl"
        style={panels.card}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-white">{studio.name}</h2>
              <p className="mt-1 text-xs" style={{ color: semantic.textSecondary }}>{studio.description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md px-2 py-1 text-xs hover:bg-white/10"
              style={buttons.ghost}
            >
              Close
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {studio.keyFeatures.slice(0, 5).map((f) => (
              <span
                key={f}
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{ background: semantic.activeAccent, color: colors.primary }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 overflow-x-auto border-b border-white/10">
          <div className="flex gap-0.5 px-4 pt-2">
            {DETAIL_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  'whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors',
                )}
                style={
                  tab === t.id
                    ? { background: semantic.activeAccent, color: colors.primary, borderBottom: '2px solid var(--color-primary)' }
                    : { color: semantic.textMuted }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {sections.find((s) => s.id === tab)?.render()}
        </div>
      </div>
    </div>
  );
}

function StudioReferenceView() {
  const [query, setQuery] = React.useState('');
  const [selectedStudio, setSelectedStudio] = React.useState<StudioKb | null>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return studios;
    const q = query.toLowerCase();
    return studios.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.keyFeatures.some((f) => f.toLowerCase().includes(q)) ||
        s.id.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div>
      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search studios by name, feature, or keyword…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
          style={{ ...panels.card, color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
        />
        {query && (
          <p className="mt-1.5 text-[11px]" style={{ color: semantic.textMuted }}>
            {filtered.length} studio{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Grid / list */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <StudioCard key={s.id} studio={s} onClick={() => setSelectedStudio(s)} />
          ))}
        </div>
      ) : (
        <EmptyState text="No studios match your search." />
      )}

      {/* Detail modal */}
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
  const [view, setView] = React.useState<'learning' | 'reference'>('learning');

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
              onClick={() => setView('learning')}
              className={cx(
                'rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors',
              )}
              style={
                view === 'learning'
                  ? { background: semantic.activeAccent, color: colors.primary, border: '1px solid rgba(34,211,238,0.3)' }
                  : { color: semantic.textMuted }
              }
            >
              Learning Paths
            </button>
            <button
              onClick={() => setView('reference')}
              className={cx(
                'rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors',
              )}
              style={
                view === 'reference'
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
        {view === 'learning' ? (
          <LearningPathsView tracks={tracks} />
        ) : (
          <StudioReferenceView />
        )}
      </div>
    </div>
  );
}

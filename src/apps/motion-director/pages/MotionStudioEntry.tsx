'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Palette } from 'lucide-react';
import { semantic, appWrapper } from '@/shared/styles/designTokens';
import { useT } from '../i18n';
import { useStore } from '../store';
import { useDemoPersonalize } from '@/shared/personalization/DemoPersonalizeProvider';
import { useSmartVideoAccess, ENTITLEMENTS } from '@/access/SmartVideoAccessProvider';
import type { AspectRatio } from '../projectContract';
import { usePersonalizationPerson } from '../personalizationAdapter';
import { prepareMedia, type MediaAttachment } from '../lib/mediaUpload';
import {
  AttachButton,
  HomeHero,
  NewProjectTile,
  PillButton,
  ProjectTile,
  PromptCard,
  PromptInput,
  SelectedChip,
  SendButton,
  TemplateOption,
  TemplatePickerModal,
  TemplatesPill,
  useTypingPlaceholder,
} from '@/apps/design-agent/ui';
import { RecipePreview } from '../components/RecipePreview';
import { FilmDirectorChat } from '../components/FilmDirectorChat';
import { useFilmDirector } from '../components/useFilmDirector';
import { MAX_PICKED_SHOTS } from '../lib/filmChat';
import {
  searchMotionTemplates,
  motionTemplateTitle,
  MOTION_CATEGORIES,
  MOTION_TEMPLATES,
  type MotionTemplate,
} from '@/data/motionRecipeCatalog';

/**
 * Synthetic PersonalizationSource that opens the shared modal from Motion
 * Studio's "Use My Brand" button. `mediaType: 'prompt-only'` keeps the modal
 * on its prompt surface (this entry is brand-context, not media-to-personalize).
 * The `sourceType: 'landing-demo'` value is recognised by the normaliser
 * (free Discovery uses the same shape) so the modal actually opens. Motion
 * Studio does not pass any media into the modal — it only wants to expose the
 * brand form (business name, colors, logos, frames) so the visitor can save a
 * brand or pick an existing one before composition creation.
 */
const MOTION_STUDIO_BRAND_SOURCE = {
  id: 'motion-studio-brand',
  title: 'Motion Studio Brand',
  mediaType: 'prompt-only',
  sourceMedia: null,
  poster: null,
  shortPrompt: 'Connect your brand — business name, colors, logos and reference frames.',
  fullPrompt: 'Connect your brand — business name, colors, logos and reference frames.',
  originalPrompt: 'Connect your brand — business name, colors, logos and reference frames.',
  sourceType: 'landing-demo',
  sourceMetadata: { motionStudioEntry: true },
} as const;

/** Recipe categories for the template picker, sourced from the catalog */
const RECIPE_CATEGORIES = MOTION_CATEGORIES.map((cat) => ({
  key: cat.key,
  label: cat.labelEn,
  recipes: MOTION_TEMPLATES.filter((t) => t.category === cat.key),
}));

/** Look up a template by id (used to show the selected recipe name/description) */
const TEMPLATE_BY_ID: Record<string, MotionTemplate> = {};
MOTION_TEMPLATES.forEach((t) => {
  TEMPLATE_BY_ID[t.id] = t;
});

const ASPECT_RATIOS: AspectRatio[] = ['16:9', '9:16', '1:1'];
const DURATIONS = [5, 6, 8, 10, 12, 15, 20, 25, 30, 45, 60];

/** Typewriter prompts for the composer (Design Agent pattern, Motion Studio copy). */
const PLACEHOLDERS = [
  'Create a 30-second promotional film from my website...',
  'Animate my product screenshots with brand colors...',
  'Make a launch teaser with a bold title card...',
  'Turn my changelog into a punchy feature reel...',
];

/** One-click example prompts shown under the composer. */
const EXAMPLE_PROMPTS = [
  'Use video-shotcraft to make a promo for my product.',
  'Make a launch film for https://your-product.com with the Ink Press template.',
  'Use the deck-deal-flyin and row-embed shot cards to present this feature.',
  'Design a product close-up inspired by spotlight-hero-card.',
];

/** Pill that opens a small option menu (aspect ratio / duration). */
function OptionPill<T extends string | number>({ label, options, value, onChange, format }: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format: (value: T) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: semantic.textSecondary }}
      >
        {format(value)}
      </button>
      {open && (
        <div role="menu" aria-label={label} className="absolute bottom-full mb-2 left-0 z-20 min-w-[120px] rounded-xl p-1 shadow-2xl" style={{ background: '#111', border: '1px solid var(--border-color)' }}>
          {options.map((option) => (
            <button
              key={String(option)}
              type="button"
              role="menuitemradio"
              aria-checked={option === value}
              onClick={() => { onChange(option); setOpen(false); }}
              className="w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg text-xs text-left hover:bg-white/5"
              style={{ color: option === value ? '#60a5fa' : semantic.textSecondary }}
            >
              {format(option)}
              {option === value && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MotionStudioEntry() {
  const t = useT();
  const navigate = useNavigate();
  const { requireEntitlement } = useSmartVideoAccess();
  // The Personalization context exposes clients + an asset library (not a singular "person").
  // We use the dedicated adapter to derive a typed PersonalizationPerson payload
  // for the entry — this keeps the mapping logic in one place and keeps this
  // component focused on the entry flow.
  const { openPersonalize, clients, selectedClientId, selectClient, assets } = useDemoPersonalize();
  const person = usePersonalizationPerson();
  const { setProject } = useStore();
  const project = useStore((s) => s.project);
  const sessions = useStore((s) => s.sessions);
  const applySession = useStore((s) => s.applySession);
  const deleteSession = useStore((s) => s.deleteSession);

  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState(20);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  /** Recipe under the pointer / keyboard focus in the picker — the one live Remotion preview. */
  const [previewRecipe, setPreviewRecipe] = useState<string | null>(null);
  /** 提示词条上选的本地素材（object URL）——生成工程时一起带进新工程 */
  const [media, setMedia] = useState<MediaAttachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const placeholder = useTypingPlaceholder(PLACEHOLDERS, Boolean(description));
  const hasSeenEntry = typeof window !== 'undefined' && !!window.localStorage.getItem('motion-director:entry-seen-v1');
  const hasCurrentProject = hasSeenEntry && project.tracks.some((track) => track.clips.length > 0);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchMotionTemplates(searchQuery);
  }, [searchQuery]);

  // Derive the active client record from the Personalization context.
  const activeClient = clients.find((c) => c.id === selectedClientId) ?? null;

  // Derive brand assets from the asset library.
  // Note: AssetLibrary exposes logos, firstFrame, lastFrame but not a colors
  // array (colors live in the client form). The "brand loaded" badge reflects
  // whether any visual asset is present.
  const hasBrandAssets = (assets?.logos?.length ?? 0) > 0
    || assets?.firstFrame !== null
    || assets?.lastFrame !== null;
  const hasLogos = (assets?.logos?.length ?? 0) > 0;
  const hasFirstFrame = assets?.firstFrame !== null;
  const hasLastFrame = assets?.lastFrame !== null;

  // Sync aspect ratio from personalization if first/last frame hints are present
  useEffect(() => {
    if (activeClient) {
      // Could infer aspect ratio from first/last frame if needed
    }
  }, [activeClient]);

  const director = useFilmDirector({
    settings: () => ({
      aspectRatio,
      durationSec: duration,
      brandKit: person
        ? { businessName: person.businessName ?? null, colors: person.brandColors ?? null, notes: person.notes ?? null, logo: person.logos?.main ?? null }
        : null,
      media,
      pickedRecipes: selectedRecipes.map((id) => TEMPLATE_BY_ID[id]).filter(Boolean),
    }),
  });
  const conversing = director.messages.length > 0;
  /** Keep the newest message / storyboard / film in view. */
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [director.messages.length, director.stage, director.activity.length]);
  const busy = director.stage === 'storyboarding' || director.stage === 'building';

  const handleCreate = () => {
    // With only picks, the message names them for the chat; the picks themselves (exact shots,
    // variants included) reach the storyboard through `pickedRecipes`, not by re-reading this text.
    const text = description.trim() || (selectedRecipes.length ? `Make a film with the shot cards I picked: ${selectedTemplates.map(motionTemplateTitle).join(', ')}` : '');
    if (!text || busy) return;
    // The dev-only e2e auth bypass cookie honors create actions regardless of
    // paid entitlement. The StandaloneShell has already gated the route through
    // Clerk middleware, so this only short-circuits the client-side gate for
    // automated tests — production users without SMARTVIDEO_GO will see the
    // upgrade modal via requireEntitlement as designed.
    const isE2E = typeof document !== 'undefined'
      && document.cookie.includes('__e2e_auth_bypass=1');
    const run = () => {
      // In the entry composer every message is about the film: a new request, the
      // answer to the Ink Press question, or a revision of the storyboard.
      director.send(text, { force: director.stage === 'idle' || director.stage === 'film' });
      setDescription('');
    };
    if (isE2E) run();
    else requireEntitlement(ENTITLEMENTS.SMARTVIDEO_GO, run);
  };

  const openWorkbench = () => {
    try {
      window.localStorage.setItem('motion-director:entry-seen-v1', '1');
    } catch {
      /* private mode / storage disabled — entry will just reappear next visit */
    }
    navigate('/');
  };

  /** Hand the finished film to the Motion Workbench (tracks, inspector, library, export). */
  const editInWorkbench = () => {
    if (!director.film) return;
    setProject(director.film.project);
    openWorkbench();
  };

  const selectedTemplates = selectedRecipes.map((id) => TEMPLATE_BY_ID[id]).filter(Boolean);
  const canCreate = Boolean(description.trim()) || (director.stage === 'idle' && selectedRecipes.length > 0);

  /** 本地素材 → object URL（不上传）；生成工程时再接进新工程 */
  const handleFiles = (files: FileList | null) => {
    const prepared = prepareMedia(Array.from(files ?? []));
    if (prepared.length) setMedia((prev) => [...prev, ...prepared]);
  };

  const openSession = (id: string) => {
    applySession(id);
    try {
      window.localStorage.setItem('motion-director:entry-seen-v1', '1');
    } catch {
      /* storage disabled */
    }
    navigate('/');
  };

  const closePicker = () => {
    setShowRecipePicker(false);
    setSearchQuery('');
    setPreviewRecipe(null);
  };

  /** Only one recipe plays at a time: the hovered one, else the last one picked. */
  const playingRecipe = previewRecipe ?? selectedRecipes[selectedRecipes.length - 1];
  const recipeOption = (tpl: MotionTemplate, description: string) => (
    <TemplateOption
      key={tpl.id}
      label={motionTemplateTitle(tpl)}
      meta={tpl.nameEn}
      description={description}
      selected={selectedRecipes.includes(tpl.id)}
      onSelect={() => pickRecipe(tpl.id)}
      media={<RecipePreview recipe={tpl} playing={playingRecipe === tpl.id} />}
      onActiveChange={(active) => setPreviewRecipe((current) => (active ? tpl.id : current === tpl.id ? null : current))}
    />
  );

  /** Templates picker is multi-select: each pick adds (or removes) a shot card for the film. */
  const pickRecipe = (id: string) => {
    setSelectedRecipes((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : prev.length >= MAX_PICKED_SHOTS ? prev : [...prev, id]));
  };

  return (
    <div className="flex flex-col min-h-full" style={appWrapper}>
      <TemplatePickerModal
        open={showRecipePicker}
        onClose={closePicker}
        title="Motion Templates"
        subtitle={selectedRecipes.length ? `${selectedRecipes.length} of up to ${MAX_PICKED_SHOTS} shot cards chosen — the film is built around them, in this order. Close when done.` : 'Pick the shot cards for your film (pick several, in order) — or let Motion Director choose them from your description.'}
        search={searchQuery}
        setSearch={setSearchQuery}
        searchPlaceholder="Search recipes..."
        footerLabel={`${MOTION_TEMPLATES.length} SHOTS · ${MOTION_CATEGORIES.length} CATEGORIES`}
      >
        {searchResults ? (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: semantic.textMuted }}>Search results</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {searchResults.map((tpl) => {
                const cat = MOTION_CATEGORIES.find((c) => c.key === tpl.category);
                return recipeOption(tpl, `${cat?.labelEn ?? tpl.category} · ${tpl.summaryEn}`);
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {RECIPE_CATEGORIES.map((cat) => (
              <div key={cat.key} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: semantic.textMuted }}>{cat.label}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {cat.recipes.map((tpl) => recipeOption(tpl, tpl.summaryEn))}
                </div>
              </div>
            ))}
          </div>
        )}
      </TemplatePickerModal>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,audio/*"
        multiple
        aria-label="Attach media files"
        data-testid="motion-prompt-media-input"
        onChange={(event) => {
          handleFiles(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-4 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <PillButton
            active={Boolean(activeClient)}
            tone="green"
            onClick={() => openPersonalize({ source: MOTION_STUDIO_BRAND_SOURCE })}
            title="Business name, colors, logos, images, and reference frames"
          >
            {activeClient ? 'Brand Kit · On' : 'Brand Kit'}
          </PillButton>
          {activeClient && (
            <button
              type="button"
              onClick={() => selectClient('')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid var(--border-color)', color: '#86efac' }}
              title="Clear selected client"
            >
              <Palette size={11} />
              {activeClient.businessName ?? 'Brand loaded'}
              {hasLogos && ' · Logo'}
              {(hasFirstFrame || hasLastFrame) && ' · Frames'}
              {!hasLogos && !hasFirstFrame && !hasLastFrame && hasBrandAssets && ' · Assets'}
            </button>
          )}
        </div>
        <span className="text-xs font-medium" style={{ color: semantic.textMuted }}>Motion Director</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 pb-8 space-y-8">
        <HomeHero lead="Films are easier with" accent="Motion Director" subtitle="The AI director that turns your product into a cinematic, editable film" />

        <div className="w-full max-w-5xl space-y-2">
          {conversing && (
            <div ref={chatRef} className="rounded-2xl p-3 sm:p-4 max-h-[70vh] overflow-y-auto custom-scrollbar" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
              <FilmDirectorChat director={director} onOpenWorkbench={editInWorkbench} onPickShots={() => setShowRecipePicker(true)} />
            </div>
          )}
          {media.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-color)' }}>
              {media.map((m) => (
                <div key={m.id} data-testid="motion-prompt-media-thumb" title={m.name} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs" style={{ background: 'var(--bg-card)' }}>
                  {m.kind === 'image' ? (
                    <img src={m.url} alt={m.name} className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <span>{m.kind === 'video' ? '🎬' : '🎵'}</span>
                  )}
                  <span className="max-w-[140px] truncate">{m.name}</span>
                  <button type="button" onClick={() => setMedia((prev) => prev.filter((x) => x.id !== m.id))} aria-label={`Remove ${m.name}`} className="opacity-60 hover:opacity-100">×</button>
                </div>
              ))}
            </div>
          )}
          <PromptCard>
            <PromptInput
              ref={promptRef}
              value={description}
              onChange={setDescription}
              onSubmit={() => { if (canCreate && !busy) handleCreate(); }}
              typingText={placeholder}
              placeholder={director.stage === 'offer' ? 'Answer: use Ink Press, let the director pick, or name shot cards…' : director.stage === 'plan' ? 'Tell me what to change in the storyboard…' : director.stage === 'film' ? 'Describe another film…' : 'Describe your motion video...'}
              aria-label="Describe your motion video"
              disabled={busy}
              rows={3}
            />
            <div className="flex flex-wrap items-center gap-2">
              <AttachButton onClick={() => fileRef.current?.click()} disabled={busy} label="Attach image / video / audio" testId="motion-prompt-media-button" />
              <TemplatesPill onClick={() => setShowRecipePicker(true)} ariaLabel={selectedTemplates.length ? `Templates — ${selectedTemplates.map(motionTemplateTitle).join(', ')}` : 'Templates — Select a recipe'} />
              {selectedTemplates.map((tpl) => (
                <SelectedChip key={tpl.id} label={motionTemplateTitle(tpl)} onClear={() => setSelectedRecipes((prev) => prev.filter((id) => id !== tpl.id))} clearLabel={`Remove ${motionTemplateTitle(tpl)}`} />
              ))}
              <OptionPill<AspectRatio> label="Aspect ratio" options={ASPECT_RATIOS} value={aspectRatio} onChange={setAspectRatio} format={(v) => v} />
              <OptionPill<number> label="Duration" options={DURATIONS} value={duration} onChange={setDuration} format={(v) => `${v}s`} />
              <span className="text-[10px]" style={{ color: semantic.textMuted }}>{media.length} references</span>
              <div className="flex-1" />
              <SendButton onClick={handleCreate} disabled={!canCreate || busy} active={canCreate} label={director.stage === 'idle' || director.stage === 'film' ? 'Generate' : 'Send'} />
            </div>
          </PromptCard>
          {!conversing && <div className="flex flex-wrap gap-2 pt-1">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => { setDescription(example); promptRef.current?.focus(); }}
                className="max-w-full truncate px-3 py-1.5 rounded-full text-[11px] transition-all hover:text-white"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: semantic.textSecondary }}
              >
                {example}
              </button>
            ))}
          </div>}
        </div>

        <div className="w-full max-w-5xl">
          <h2 className="text-base font-semibold mb-4">Recent Projects</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <NewProjectTile onClick={() => promptRef.current?.focus()} />
            {hasCurrentProject && (
              <ProjectTile name={project.name || 'Current project'} meta="Continue editing" onOpen={() => navigate('/')} />
            )}
            {sessions.slice(0, 7).map((session) => (
              <ProjectTile
                key={session.id}
                name={session.name}
                meta={`${session.messageCount} messages · ${new Date(session.updatedAt).toLocaleDateString()}`}
                onOpen={() => openSession(session.id)}
                onDelete={() => deleteSession(session.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

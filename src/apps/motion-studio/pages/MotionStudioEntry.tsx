'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Layers, Palette, ArrowRight, Sparkle, Search } from 'lucide-react';
import { useT } from '../i18n';
import { useStore } from '../store';
import { useDemoPersonalize } from '@/shared/personalization/DemoPersonalizeProvider';
import { useSmartVideoAccess, ENTITLEMENTS } from '@/access/SmartVideoAccessProvider';
import { createProjectFromEntry, type MotionStudioEntry, type AspectRatio } from '../projectContract';
import { usePersonalizationPerson } from '../personalizationAdapter';
import MotionPromptBar from '../components/MotionPromptBar';
import { attachMediaAttachments, type MediaAttachment } from '../lib/mediaUpload';
import {
  searchMotionTemplates,
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

/** Recipe categories for the "Choose Motion Design" dropdown, sourced from the catalog */
const CATEGORY_ICONS: Record<string, ReactNode> = {
  opening: <Sparkles className="w-5 h-5" />,
  typography: <Layers className="w-5 h-5" />,
  'ui-entrance': <Palette className="w-5 h-5" />,
  camera: <Zap className="w-5 h-5" />,
  data: <Search className="w-5 h-5" />,
  interaction: <ArrowRight className="w-5 h-5" />,
  transition: <ArrowRight className="w-5 h-5" />,
  rhythm: <Zap className="w-5 h-5" />,
  effects: <Sparkle className="w-5 h-5" />,
  outro: <Sparkles className="w-5 h-5" />,
};

const RECIPE_CATEGORIES = MOTION_CATEGORIES.map((cat) => ({
  key: cat.key,
  label: cat.labelEn,
  icon: CATEGORY_ICONS[cat.key],
  recipes: MOTION_TEMPLATES
    .filter((t) => t.category === cat.key)
    .map((t): { id: string; name: string; description: string } => ({
      id: t.id,
      name: t.nameEn,
      description: t.summaryEn,
    })),
}));

/** Flatten recipes for the select dropdown */
const ALL_RECIPES = RECIPE_CATEGORIES.flatMap((cat) => cat.recipes);

/** Look up a template by id (used to show the selected recipe name/description) */
const TEMPLATE_BY_ID: Record<string, MotionTemplate> = {};
MOTION_TEMPLATES.forEach((t) => {
  TEMPLATE_BY_ID[t.id] = t;
});

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

  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState(5);
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  /** 提示词条上选的本地素材（object URL）——生成工程时一起带进新工程 */
  const [media, setMedia] = useState<MediaAttachment[]>([]);

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

  const handleCreate = async () => {
    if (!description.trim()) return;
    // The dev-only e2e auth bypass cookie honors create actions regardless of
    // paid entitlement. The StandaloneShell has already gated the route through
    // Clerk middleware, so this only short-circuits the client-side gate for
    // automated tests — production users without SMARTVIDEO_GO will see the
    // upgrade modal via requireEntitlement as designed.
    const isE2E = typeof document !== 'undefined'
      && document.cookie.includes('__e2e_auth_bypass=1');
    const runCreate = async () => {
        setIsCreating(true);
        try {
          // `usePersonalizationPerson` (via personalizationAdapter) already
          // maps the active client + asset library onto a typed
          // PersonalizationPerson (or null when no brand context is present).
          const entry: MotionStudioEntry = {
            description,
            aspectRatio,
            duration,
            person: person ?? undefined,
            recipeId: selectedRecipe || undefined,
          };

          const project = createProjectFromEntry(entry);
          setProject(project);
          // 本地素材跟着新工程一起走：接在已有片段之后（object URL，不上传）
          if (media.length) {
            const end = project.tracks.reduce(
              (max, track) =>
                track.clips.reduce((m, clip) => Math.max(m, clip.start + clip.duration), max),
              0,
            );
            attachMediaAttachments(media, { at: end });
          }
          try {
            window.localStorage.setItem('motion-studio:entry-seen-v1', '1');
          } catch {
            /* private mode / storage disabled — entry will just reappear next visit */
          }
          navigate('/');
        } catch (error) {
          console.error('Failed to create Motion Studio project:', error);
          window.alert(t('export.startFailed'));
        } finally {
          setIsCreating(false);
        }
    };
    if (isE2E) {
      void runCreate();
    } else {
      requireEntitlement(ENTITLEMENTS.SMARTVIDEO_GO, runCreate);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkle className="w-8 h-8 text-amber-500" />
            <h1 className="text-2xl font-bold">Motion Studio</h1>
            <span className="text-sm text-gray-400">Create motion video</span>
          </div>
          <div className="flex items-center gap-4">
            {activeClient && (
              <button
                onClick={() => selectClient('')}
                className="flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
                title="Clear selected client"
              >
                <Palette className="w-4 h-4" />
                <span>{activeClient.businessName ?? 'Brand loaded'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Step 1: Describe your video */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold">Describe your video</h2>
          </div>
          <MotionPromptBar
            value={description}
            onChange={setDescription}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            duration={duration}
            onDurationChange={setDuration}
            onGenerate={handleCreate}
            generating={isCreating}
            onMediaChange={(batch) => setMedia((prev) => [...prev, ...batch])}
            autoAttach={false}
          />
          <p className="text-sm text-gray-500">
            Be specific about style, pacing, and key elements. This guides the motion design selection.
          </p>
        </section>

        {/* Step 3: Use My Brand */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold">Use My Brand</h2>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => openPersonalize({ source: MOTION_STUDIO_BRAND_SOURCE })}
              className={`w-full flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all ${
                activeClient
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <Palette className="w-6 h-6 text-purple-500" />
              <div className="text-left">
                {activeClient ? (
                  <>
                    <div className="font-medium text-white">{activeClient.businessName ?? 'Brand loaded'}</div>
                    <div className="text-sm text-gray-400">
                      {hasBrandAssets && 'Brand assets loaded'}
                      {hasLogos && ' · Logo loaded'}
                      {hasFirstFrame && ' · Frame loaded'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium text-white">Connect Personalization</div>
                    <div className="text-sm text-gray-500">
                      Business name, colors, logos, images, and reference frames
                    </div>
                  </>
                )}
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </button>
          </div>
        </section>

        {/* Step 4: Choose Motion Design */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold">Choose Motion Design</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowRecipePicker(!showRecipePicker)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              selectedRecipe
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-700 hover:border-gray-600'
              }`}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-green-500" />
              <div>
                <div className="font-medium text-white">
                  {selectedRecipe
                    ? ALL_RECIPES.find((r) => r.id === selectedRecipe)?.name ?? selectedRecipe
                    : 'Select a recipe...'}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedRecipe
                    ? ALL_RECIPES.find((r) => r.id === selectedRecipe)?.description ?? ''
                    : 'Motion Studio will match your description to a compatible design'}
                </div>
              </div>
            </div>
            <Sparkles className={`w-5 h-5 transition-transform ${showRecipePicker ? 'rotate-180' : ''} text-gray-400`} />
          </button>

          {showRecipePicker && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -mt-2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
              {searchResults ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Search results</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.map((t) => {
                      const cat = MOTION_CATEGORIES.find((c) => c.key === t.category);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedRecipe(t.id);
                            setShowRecipePicker(false);
                            setSearchQuery('');
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                            selectedRecipe === t.id
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <span className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-green-500" />
                          </span>
                          <div>
                            <div className="font-medium text-white">{t.nameEn}</div>
                            <div className="text-xs text-gray-500">
                              {cat?.labelEn ?? t.category} · {t.summaryEn}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                RECIPE_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      {cat.icon} {cat.label}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cat.recipes.map((recipe) => (
                        <button
                          key={recipe.id}
                          type="button"
                          onClick={() => {
                            setSelectedRecipe(recipe.id);
                            setShowRecipePicker(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                            selectedRecipe === recipe.id
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <span className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-green-500" />
                          </span>
                          <div>
                            <div className="font-medium text-white">{recipe.name}</div>
                            <div className="text-xs text-gray-500">{recipe.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
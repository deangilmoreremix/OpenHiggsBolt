/**
 * Recipe Registry & Executor
 * ------------------------------------------------------------------
 * The Academy templates connect to SmartVideo's "Create With AI" system
 * through this registry. It is the single source of truth for which
 * recipes exist, where they route, and what preset payload they carry.
 *
 * Design notes:
 *  - The executor does NOT duplicate generation logic. It only (1) stashes
 *    a preset payload that a target studio can read on mount, and (2)
 *    navigates to the existing studio route (StandaloneShell tab). The
 *    actual video/image generation is performed by the existing studio
 *    components — exactly as if the user had opened them manually.
 *  - Presets are handed off via `sessionStorage` + a `window` global so no
 *    generation code is re-implemented here.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export type RecipeTarget =
  | 'video'
  | 'image'
  | 'cinema'
  | 'lipsync'
  | 'storyboard'
  | 'ai-influencer'
  | 'vfx-studio'
  | 'thumbnail-studio';

export interface RecipeDefinition {
  id: string;
  title: string;
  /** Short description shown on the recipe badge. */
  description: string;
  /** StandaloneShell tab the recipe routes to. */
  target: RecipeTarget;
  /** Optional base prompt seeded into the target studio. */
  basePrompt?: string;
  /** Academy template ids this recipe powers (for back-linking). */
  poweredBy: string[];
  /** Tags for grouping in the recipe picker. */
  tags: string[];
}

export const RECIPE_PRESET_KEY = 'academy_recipe_preset';

/** Read-and-clear the pending preset (called by a target studio on mount). */
export function consumeRecipePreset(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      (window as unknown as { __academyRecipePreset?: string }).__academyRecipePreset ||
      sessionStorage.getItem(RECIPE_PRESET_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(RECIPE_PRESET_KEY);
    delete (window as unknown as { __academyRecipePreset?: string }).__academyRecipePreset;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Stash a preset for the next studio mount and return the route to push. */
export function stageRecipePreset(
  recipe: RecipeDefinition,
  values: Record<string, unknown>,
): string {
  const payload = {
    recipeId: recipe.id,
    target: recipe.target,
    basePrompt: recipe.basePrompt,
    values,
    at: Date.now(),
  };
  const raw = JSON.stringify(payload);
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(RECIPE_PRESET_KEY, raw);
    (window as unknown as { __academyRecipePreset?: string }).__academyRecipePreset = raw;
  }
  return `/studio/${recipe.target}`;
}

export const recipeRegistry: RecipeDefinition[] = [
  {
    id: 'ugc-ad',
    title: 'Create UGC Ad',
    description: 'Generate a talking-head UGC ad from a hook/pitch/proof/CTA script.',
    target: 'video',
    basePrompt:
      'Generate a UGC-style talking-head ad: a real person holding a product, casual tone, captions burned in, 9:16.',
    poweredBy: ['ugc-script-template'],
    tags: ['ugc', 'video', 'ads'],
  },
  {
    id: 'ugc-campaign',
    title: 'Create UGC Campaign',
    description: 'Batch-produce a 5–10 ad variant matrix from a locked product + varied hooks/angles.',
    target: 'video',
    basePrompt:
      'Batch-generate a UGC ad campaign: keep the same product, avatar and CTA, vary only the hook and selling angle per variant.',
    poweredBy: ['batch-matrix-template', 'retainer-proposal-template'],
    tags: ['ugc', 'batch', 'campaign'],
  },
  {
    id: 'consistent-character',
    title: 'Create Consistent Character',
    description: 'Generate a reference anchor and condition new shots on it to prevent identity drift.',
    target: 'image',
    basePrompt:
      'Create a consistent AI spokesperson: generate a high-res front-facing anchor portrait, then condition every new shot on that reference image.',
    poweredBy: ['character-consistency-checklist'],
    tags: ['character', 'consistency', 'image'],
  },
  {
    id: 'campaign-planner',
    title: 'AI Campaign Planner',
    description: 'Turn an ad brief, outreach or teardown into a structured campaign plan and sample ad.',
    target: 'storyboard',
    basePrompt:
      'Plan a UGC campaign from the brief: define product, platforms, variant count, hook angles and a test plan.',
    poweredBy: ['ad-brief-checklist', 'outreach-template', 'teardown-worksheet'],
    tags: ['planning', 'campaign', 'brief'],
  },
];

export function getRecipe(id: string): RecipeDefinition | undefined {
  return recipeRegistry.find((r) => r.id === id);
}

/** Hook used by Academy UI to launch a recipe without re-implementing nav. */
export function useRecipeExecutor() {
  const router = useRouter();
  return useCallback(
    (recipeId: string, values: Record<string, unknown> = {}) => {
      const recipe = getRecipe(recipeId);
      if (!recipe) {
        console.warn(`[recipe] unknown recipe: ${recipeId}`);
        return;
      }
      const route = stageRecipePreset(recipe, values);
      router.push(route);
    },
    [router],
  );
}

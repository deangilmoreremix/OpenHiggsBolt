import { MOTION_TEMPLATES, motionTemplateTitle } from '@/data/motionRecipeCatalog';
import { DEMO_TEXTS } from '../demosrc/_generated/demoTexts';
import { isProductTextureShot } from './productShots';
import { rulesOf } from './shotRules';
import type { AspectRatio } from '../projectContract';
import sweep from './_generated/recipeSweepResults.json';
import recipeReads from './_generated/recipeReads.json';

/**
 * What a recipe needs and what it does with it, per recipe. The static half comes from the recipe's own source and
 * metadata; `renderable` and `personalizable` come from MEASUREMENT: e2e/motion-director-recipe-sweep.spec.ts renders
 * every recipe with supplied pictures, a brand name and words in the export renderer and records what appears.
 * A recipe is only called "tested" when that run showed it; anything not measured is "untested".
 */
export type Personalizable = 'tested' | 'partly' | 'sample-only' | 'not-applicable' | 'untested';

export interface SweepResult {
  renderable: boolean;
  /** Largest share of a rendered frame filled with one of the supplied picture colours. */
  supplied: number;
  variance: number;
  /** Lines of text the recipe draws, and how many the sweep replaced with site words plus the product's name. */
  lines: number;
  replaced: number;
  /** Lines replaced with only the product's name (a film with no site words). */
  neutral: number;
  /** Share of a frame's pixels that changed when only the company's brand (name, logo, colours) was applied. */
  brandDiff?: number;
  /** Share of pixels that changed when the person's words replaced the template's (0 when the words never showed). */
  textDiff?: number;
  error?: string;
}

export interface RecipeContract {
  stem: string;
  name: string;
  requiredAssets: Array<'pictures' | 'text'>;
  acceptedProps: string[];
  aspectRatios: { native: AspectRatio[]; letterboxed: AspectRatio[] };
  referenceFrames: string[];
  /** null: not measured. */
  renderable: boolean | null;
  personalizable: Personalizable;
  /** One line saying what the measurement showed. */
  basis: string;
  /** Share of its own text lines replaced with the product's name alone (a film with no site words), or null. */
  noSiteWords: number | null;
}

/** A picture counts as shown when one supplied colour fills at least this share of some frame. */
export const PICTURE_SHARE = 0.02;
/** A recipe's words count as the person's when at least this share of its lines was replaced. */
export const WORDS_SHARE = 0.5;
/** ...and the replacement must be visible: at least this share of a frame's pixels changed. */
export const TEXT_VISIBLE = 0.0005;
/** ...and a brand counts as shown when it changed at least this share of a frame's pixels. */
export const BRAND_VISIBLE = 0.002;

/** What each recipe reads of the person's material, from its own source (scripts/gen-recipe-reads.mjs). */
const READS = recipeReads as unknown as Record<string, { brand: boolean; textures: boolean; fixtures: boolean }>;

const RESULTS = sweep as unknown as Record<string, SweepResult>;

export function classify(stem: string, r: SweepResult | undefined): Pick<RecipeContract, 'renderable' | 'personalizable' | 'basis' | 'noSiteWords'> {
  if (!r) return { renderable: null, personalizable: 'untested', basis: 'not measured', noSiteWords: null };
  if (!r.renderable) return { renderable: false, personalizable: 'untested', basis: `did not render${r.error ? `: ${r.error}` : ' (blank frames)'}`, noSiteWords: null };
  const reads = isProductTextureShot(stem);
  const kinds = READS[stem] ?? { brand: false, textures: false, fixtures: false };
  const brandShown = kinds.brand && (r.brandDiff ?? 0) >= BRAND_VISIBLE;
  const pictures = reads && r.supplied >= PICTURE_SHARE;
  const shown = r.textDiff === undefined || r.textDiff >= TEXT_VISIBLE;
  const words = r.lines > 0 && shown ? r.replaced / r.lines : 0;
  const noSiteWords = r.lines > 0 ? +(r.neutral / r.lines).toFixed(2) : null;
  if (pictures) return { renderable: true, personalizable: 'tested', basis: `supplied pictures filled ${(r.supplied * 100).toFixed(0)}% of a frame`, noSiteWords };
  if (words >= WORDS_SHARE) return { renderable: true, personalizable: 'tested', basis: `${r.replaced} of ${r.lines} lines of text replaced with the site's words`, noSiteWords };
  // A recipe with no words of its own whose wordmark, logo and colours come from the company's brand: the brand is what there is to replace, and it was seen to.
  if (r.lines === 0 && brandShown) return { renderable: true, personalizable: 'tested', basis: `its wordmark, logo and colours are the company's own (the brand changed ${((r.brandDiff ?? 0) * 100).toFixed(1)}% of a frame)`, noSiteWords };
  if (r.lines === 0 && !kinds.brand && !kinds.textures && !kinds.fixtures && !reads) return { renderable: true, personalizable: 'not-applicable', basis: 'it draws no interface, words, brand or picture of its own: there is nothing in it to replace', noSiteWords };
  if (r.replaced > 0 && shown) return { renderable: true, personalizable: 'partly', basis: `only ${r.replaced} of ${r.lines} lines of text could be replaced${reads ? '; its pictures did not show the supplied ones' : ''}`, noSiteWords };
  return { renderable: true, personalizable: 'sample-only', basis: r.replaced > 0 && !shown ? 'its words were replaced but the replacement did not show in the frames' : reads ? 'it reads pictures but the supplied ones did not appear' : r.lines ? 'none of its text could be replaced' : 'it has no pictures or words of the person to draw', noSiteWords };
}

export function recipeContract(stem: string): RecipeContract {
  const template = MOTION_TEMPLATES.find((t) => t.componentName === stem);
  const reads = isProductTextureShot(stem);
  const lines = DEMO_TEXTS[stem]?.length ?? 0;
  const rules = rulesOf(stem);
  return {
    stem,
    name: template ? motionTemplateTitle(template) : stem,
    requiredAssets: [...(reads ? (['pictures'] as const) : []), ...(lines > 0 ? (['text'] as const) : [])],
    acceptedProps: ['accent', ...(lines > 0 ? ['texts'] : []), ...(reads ? ['screens', 'crops'] : []), ...(rules && !rules.technique ? ['adaptedCode'] : [])],
    // Every recipe is authored as a 1920x1080 stage; other ratios show that stage letterboxed (preview/clipBody FitStage).
    aspectRatios: { native: ['16:9'], letterboxed: ['9:16', '1:1'] },
    referenceFrames: ['a', 'b', 'c'].map((k) => `/motion-studio/previews/${stem}-${k}.jpg`),
    ...classify(stem, RESULTS[stem]),
  };
}

/** The short label the recipe picker and the director's catalog use. Only "tested" recipes are called personalizable. */
export function personalizableLabel(stem: string): string {
  const c = recipeContract(stem);
  switch (c.personalizable) {
    case 'tested': return c.noSiteWords !== null && c.noSiteWords < WORDS_SHARE && !c.requiredAssets.includes('pictures') ? 'Personalizable with your site\'s words (tested)' : 'Personalizable (tested)';
    case 'partly': return 'Partly personalizable';
    case 'sample-only': return 'Draws its own sample content';
    case 'not-applicable': return 'Pure motion (nothing of yours to show)';
    default: return c.renderable === false ? 'Does not render' : 'Personalization not tested';
  }
}

export const contractSummary = () => {
  const all = MOTION_TEMPLATES.map((t) => t.componentName).filter((s, i, a) => a.indexOf(s) === i).map(recipeContract);
  const n = (p: Personalizable) => all.filter((c) => c.personalizable === p).length;
  return { total: all.length, tested: n('tested'), partly: n('partly'), sampleOnly: n('sample-only'), notApplicable: n('not-applicable'), untested: n('untested'), notRenderable: all.filter((c) => c.renderable === false).length };
};

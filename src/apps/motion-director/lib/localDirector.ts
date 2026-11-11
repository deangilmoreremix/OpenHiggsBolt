/**
 * Create without AI: the storyboard is built by the program from what the site really gave (no model, no key).
 *
 * Recipes come from the library's own contract: a recipe is chosen only if it is measured to show the person's material
 * (`recipeContract(...).personalizable` is 'tested', or it has nothing of the person's to show), the material in hand
 * satisfies what it reads (`needsOf` / `satisfies`: a page, its cards, pictures, words...), and it suits the business
 * (`suitableFor`). Recipes that would need their source rewritten by a model are simply not candidates. The copy is the site's own
 * words (applySiteContent / inkPressPlan's content slots); nothing is invented.
 */
import { MOTION_TEMPLATES, resolveMotionTemplate, type MotionTemplate } from '@/data/motionRecipeCatalog';
import type { BusinessKind, Material } from './productBrief';
import { recipeContract } from './recipeContract';
import { needsOf, suitableFor } from './recipeNeeds';
import { rulesOf } from './shotRules';

/** Techniques in the order a promo tells its story: openers and product reveals first, camera moves between, an outro last. */
const PREFERRED: readonly string[] = [
  'SpotlightHeroCard',
  'DeckDealFlyin',
  'MultiplaneReal',
  'RowEmbed',
  'CrashZoomReal',
  'WhipBrakeReal',
  'FreezeAnnotateReal',
  'CrashImpactReal',
  'TypeAndFilter',
  'ListStackPress',
  'PageWaterfallWall',
  'OutroGroupPhotoLaunch',
];

const measured = (stem: string) => ['tested', 'not-applicable'].includes(recipeContract(stem).personalizable);

export interface LocalPick { template: MotionTemplate; why: string }

/** The shots a no-AI film uses, in film order, and why each qualified. Fewer than asked when the material does not support more. */
export function chooseLocalShots(opts: { kind: BusinessKind; material: Material; count: number; /** The film's look family (the site's ground): a recipe designed for the other family is not chosen (shot-card rule: one look). */ ground?: 'dark' | 'light' | null }): { picks: LocalPick[]; skipped: Array<{ stem: string; why: string }> } {
  const picks: LocalPick[] = [];
  const skipped: Array<{ stem: string; why: string }> = [];
  const unique = MOTION_TEMPLATES.filter((m, k, all) => all.findIndex((x) => x.componentName === m.componentName) === k);
  const order = [...PREFERRED, ...unique.map((m) => m.componentName).filter((s) => !PREFERRED.includes(s))];
  for (const stem of order) {
    if (picks.length >= opts.count) break;
    const t = unique.find((m) => m.componentName === stem);
    if (!t) continue;
    const rules = rulesOf(stem);
    // Seams (technique cards) are chosen by the film's seam logic, not as shots.
    if (!rules || rules.technique) continue;
    if (!measured(stem)) { if (PREFERRED.includes(stem)) skipped.push({ stem, why: `not measured to show the business's material (${recipeContract(stem).personalizable})` }); continue; }
    const fit = suitableFor(stem, opts.kind, opts.material);
    if (!fit.ok) { if (PREFERRED.includes(stem)) skipped.push({ stem, why: fit.why ?? 'material missing' }); continue; }
    if (opts.ground && rules.polarity && rules.polarity !== opts.ground) { if (PREFERRED.includes(stem)) skipped.push({ stem, why: `a ${rules.polarity} look in a ${opts.ground} film` }); continue; }
    const { need } = needsOf(stem);
    // A shot with nothing of the person's to show (pure motion) is not a promo of the business.
    if (need === 'abstract' || need === 'none') continue;
    picks.push({ template: resolveMotionTemplate(t.id) ?? t, why: `reads ${need === 'page' ? 'the captured page layout' : need === 'images' ? 'the site pictures' : need === 'text' ? 'the site words' : need}; measured personalizable: ${recipeContract(stem).personalizable}` });
  }
  return { picks, skipped };
}

/** How many shots a film of this length holds between its opening and closing cards (about 4.5 s each, 3 to 6). */
export const localShotCount = (durationSec: number): number => Math.max(3, Math.min(6, Math.round((durationSec - 7) / 4.5)));

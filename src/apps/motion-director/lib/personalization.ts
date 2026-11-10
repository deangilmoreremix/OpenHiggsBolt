import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { isProductTextureShot } from './productShots';
import { DEMO_TEXTS } from '../demosrc/_generated/demoTexts';
import { motionTemplateTitle } from '@/data/motionRecipeCatalog';
import type { ClipData, ProjectData } from '../types';

/**
 * What became of each recipe shot of a built film, in plain words:
 *  - adapted: the recipe's source was rewritten for the product and passed its checks (`adaptedCode`).
 *  - parameterized: the plain recipe draws the person's own pictures or words (captured pages, supplied images,
 *    rewritten text), with its motion untouched.
 *  - unmodified: the plain demo; nothing of the person's reached it (or only a framed inset beside it).
 */
export type PersonalizationState = 'adapted' | 'parameterized' | 'unmodified';

export interface ShotPersonalization {
  clipId: string;
  stem: string;
  name: string;
  state: PersonalizationState;
  reason: string;
}

const stemOf = (c: ClipData) => (c.cardId.startsWith('demo:') ? c.cardId.slice(5) : '');
const count = (v: unknown) => (Array.isArray(v) ? v.length : 0);
const textCount = (v: unknown) => {
  if (typeof v === 'string') {
    try {
      return Object.keys(JSON.parse(v) ?? {}).length;
    } catch {
      return 0;
    }
  }
  return v && typeof v === 'object' ? Object.keys(v as object).length : 0;
};

/** At least this share of a recipe's own lines must be replaced for its words to count as the person's. */
const WORDS_SHARE = 0.5;

export function shotPersonalization(clip: ClipData): ShotPersonalization | null {
  const stem = stemOf(clip);
  if (!stem) return null;
  const template = MOTION_TEMPLATES.find((t) => t.componentName === stem);
  const name = template ? motionTemplateTitle(template) : stem;
  const props = clip.props ?? {};
  const base = { clipId: clip.id, stem, name };
  if (props.adaptedCode) return { ...base, state: 'adapted', reason: 'its source was rewritten for your product' };
  const pictures = count(props.screens) + count(props.crops);
  const lines = DEMO_TEXTS[stem]?.length ?? 0;
  const replaced = Math.min(textCount(props.texts), lines || Infinity);
  const reads = isProductTextureShot(stem);
  const inset = count((props.scenePictures as { crops?: unknown } | undefined)?.crops) > 0;
  if (reads && pictures > 0) return { ...base, state: 'parameterized', reason: `it draws your pictures${replaced ? ' and words' : ''}` };
  if (lines > 0 && replaced / lines >= WORDS_SHARE) return { ...base, state: 'parameterized', reason: `${replaced} of its ${lines} lines of text were rewritten` };
  const why = reads
    ? 'no pictures were available for it'
    : lines > 0
      ? `it draws its own sample content and only ${replaced} of its ${lines} lines of text could be replaced${inset ? '; your pictures appear beside it, not in it' : ''}`
      : 'it has no pictures or words of yours to draw';
  return { ...base, state: 'unmodified', reason: why };
}

export function filmPersonalization(project: ProjectData): ShotPersonalization[] {
  return project.tracks.flatMap((t) => t.clips).map(shotPersonalization).filter((x): x is ShotPersonalization => Boolean(x));
}

export interface PersonalizationSummary {
  total: number;
  adapted: number;
  parameterized: number;
  unmodified: number;
  personalized: number;
  line: string;
  details: string[];
}

export function summarizePersonalization(shots: readonly ShotPersonalization[]): PersonalizationSummary {
  const n = (s: PersonalizationState) => shots.filter((x) => x.state === s).length;
  const adapted = n('adapted');
  const parameterized = n('parameterized');
  const unmodified = n('unmodified');
  const personalized = adapted + parameterized;
  const line = shots.length
    ? `Personalised ${personalized} of ${shots.length} shot${shots.length === 1 ? '' : 's'}: ${adapted} adapted, ${parameterized} parameterised, ${unmodified} unmodified`
    : 'No recipe shots to personalise';
  const details = shots.filter((s) => s.state === 'unmodified').map((s) => `${s.name} is unmodified: ${s.reason}`);
  return { total: shots.length, adapted, parameterized, unmodified, personalized, line, details };
}

/** Why shot adaptation did not run or did not finish; shown with the summary so a deployment problem is not blamed on the model. */
export type AdaptationOutcome =
  | { kind: 'ran'; adapted: number; attempted: number; note?: string; /** Clip ids the pass did not reach (continue with them). */ pending?: string[] }
  | { kind: 'skipped'; reason: string }
  | { kind: 'stopped'; adapted: number; attempted: number; reason: string; pending?: string[] };

import type { SiteContent } from './filmChat';

/**
 * Stage 0 — product understanding. Upstream's agent reads the product before it writes any video code. This is the
 * program's side of that: a structured brief (who the business is, what it sells, the objective, the features to show,
 * what material is in hand and what is missing) and the requirements → decisions table (requirement, decision,
 * effect on the film, asset need, how it is verified). It is deterministic so the stage can always produce its output,
 * and it is what the later stages READ: the business kind filters which recipes may be chosen, the feature list is
 * what the feature → shot map must cover, and the decision rows become the final review's checklist.
 */

export type BusinessKind = 'software' | 'real-estate' | 'restaurant' | 'fitness' | 'retail' | 'services' | 'health' | 'education' | 'creative' | 'unknown';

const KINDS: Array<{ kind: BusinessKind; re: RegExp }> = [
  { kind: 'real-estate', re: /\b(?:real estate|realtor|realty|propert(?:y|ies)|listings?|homes? for sale|luxury (?:home|villa|condo|estate)|apartments?|condos?|villas?|beachfront|mortgage|open house|broker(?:age)?|house tour)\b/i },
  { kind: 'restaurant', re: /\b(?:restaurant|cafe|café|bistro|bakery|bar & grill|pizzeria|chef|menu|dishes?|cuisine|catering|brunch|dinner|coffee shop|food truck|tasting menu|dine)\b/i },
  { kind: 'fitness', re: /\b(?:gym|fitness|workout|crossfit|yoga|pilates|personal train(?:er|ing)|boot ?camp|athlet(?:e|ic)|studio class(?:es)?|training plans?)\b/i },
  { kind: 'health', re: /\b(?:clinic|dental|dentist|medical|doctor|therapy|therapist|wellness|spa|chiropract|health ?care|patients?)\b/i },
  { kind: 'education', re: /\b(?:course|academy|school|tutor|curriculum|students?|bootcamp|university|learning platform|lessons?)\b/i },
  { kind: 'retail', re: /\b(?:shop|store|boutique|apparel|clothing|jewel(?:l)?ery|sneakers?|e-?commerce|collection|new arrivals|products? line|skincare|cosmetics|furniture)\b/i },
  { kind: 'creative', re: /\b(?:photograph(?:er|y)|portfolio|film ?maker|design studio|agency|music(?:ian)?|band|artist|wedding)\b/i },
  { kind: 'software', re: /\b(?:saas|software|app\b|platform|dashboard|api\b|developers?|workflow|automation|analytics|crm\b|devops|cloud|ai (?:tool|assistant|agent)|integrations?|open source|github)\b/i },
  { kind: 'services', re: /\b(?:managed (?:it|services)|it support|consult(?:ing|ants?)|accounting|law firm|attorneys?|insurance|cyber ?security|staffing|logistics|plumbing|hvac|cleaning|contractor|solutions|services?)\b/i },
];

/** What kind of business this is, from everything the person gave us. Order matters: the more specific kinds win. */
export function classifyBusiness(text: string): { kind: BusinessKind; evidence: string[] } {
  const hits: Array<{ kind: BusinessKind; words: string[] }> = [];
  for (const { kind, re } of KINDS) {
    const found = [...text.matchAll(new RegExp(re.source, 'gi'))].map((m) => m[0].toLowerCase());
    if (found.length) hits.push({ kind, words: [...new Set(found)] });
  }
  if (!hits.length) return { kind: 'unknown', evidence: [] };
  // Software words are common on any site ("platform", "app"); a more specific kind with as many hits beats it.
  const ranked = [...hits].sort((a, b) => b.words.length - a.words.length || KINDS.findIndex((k) => k.kind === a.kind) - KINDS.findIndex((k) => k.kind === b.kind));
  const best = ranked[0];
  return { kind: best.kind, evidence: best.words.slice(0, 4) };
}

/** Kinds whose products live in a screen: only these suit shots that draw or animate a software interface. */
export const SCREEN_BUSINESSES: ReadonlySet<BusinessKind> = new Set(['software', 'services', 'education', 'unknown']);

export interface Material {
  /** The site's own captured pages (screenshots), when a capture completed. */
  pages: number;
  /** Card-like blocks found on the captured home page. */
  cards: number;
  /** Uploaded or found photographs. */
  images: number;
  /** Uploaded videos. */
  videos: number;
  logo: boolean;
  /** Sentences and headings the site (or the person) supplied. */
  textLines: number;
  /** Text blocks that could make up a document layout (headings + paragraphs + list items). */
  documentBlocks: number;
  /** Uploaded music. */
  music: boolean;
  /** Which geometry the capture gave (lib/customerLayout `source.mapped`: projects.cards, detail.rows, papers.cards5, plate...). */
  parts?: string[];
}

export interface ProductBrief {
  productName: string;
  kind: BusinessKind;
  kindEvidence: string[];
  /** What the film is for. */
  objective: string;
  audience: string;
  /** The features / products / offers the film must show, in priority order. */
  features: string[];
  durationSec: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  style: string;
  material: Material;
  /** What is missing and cannot reasonably be inferred. */
  missing: string[];
  /** Data and claims rules for this film. */
  restrictions: string[];
  source: 'site' | 'uploads' | 'prompt' | 'site+uploads';
}

export interface DecisionRow {
  requirement: string;
  decision: string;
  effect: string;
  assetNeed: string;
  verification: string;
}

const OBJECTIVES: Array<[RegExp, string]> = [
  [/\b(?:launch|announce|introducing|new product|unveil)\b/i, 'announce a launch'],
  [/\b(?:book|booking|reserv|schedule a|appointment|visit|tour)\b/i, 'drive bookings and visits'],
  [/\b(?:sign ?up|trial|download|install|get started)\b/i, 'drive sign-ups'],
  [/\b(?:hire|recruit|careers?|join (?:us|our team))\b/i, 'recruit'],
  [/\b(?:sell|sales|buy|shop|order|purchase)\b/i, 'drive purchases'],
  [/\b(?:brand|awareness|story|about us)\b/i, 'build brand awareness'],
];
const AUDIENCE: Partial<Record<BusinessKind, string>> = {
  'real-estate': 'prospective buyers and renters', restaurant: 'local diners', fitness: 'people looking to train', health: 'prospective patients', education: 'prospective students',
  retail: 'shoppers', creative: 'prospective clients', software: 'teams evaluating the product', services: 'businesses that need the service',
};
const STYLE: Record<BusinessKind, string> = {
  'real-estate': 'controlled camera, long holds, refined transitions, minimal effects', restaurant: 'warm, appetising close-ups, gentle rhythm', fitness: 'fast, impactful, energetic cuts',
  health: 'calm, clean, reassuring', education: 'clear, structured, friendly', retail: 'crisp product reveals, confident pace', creative: 'expressive, image-led, cinematic',
  software: 'clear feature emphasis, legible interfaces, structured motion', services: 'confident, clear, trustworthy', unknown: 'clean and cinematic',
};

const clean = (v: string | undefined | null) => (v ?? '').replace(/\s+/g, ' ').trim();
const notChrome = (v: string) => v.length >= 4 && v.length <= 90 && !/^(?:home|menu|login|log in|sign in|search|contact|privacy|terms|cookies?)$/i.test(v);

export function buildProductBrief(input: {
  prompt: string;
  productName: string;
  content?: SiteContent | null;
  siteTitle?: string | null;
  durationSec: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  material: Material;
  brandKitName?: string | null;
  hasSite: boolean;
}): ProductBrief {
  const text = [input.prompt, input.siteTitle, input.content?.headline, input.content?.description, ...(input.content?.headings ?? []), ...(input.content?.nav ?? [])].filter(Boolean).join(' . ');
  const { kind, evidence } = classifyBusiness(text);
  const fromSite = [...(input.content?.headings ?? [])].map(clean).filter(notChrome);
  // Features the person named in the prompt ("highlight the company's services", "three luxury properties") lead; the site's headings follow.
  const features = [...new Set(fromSite)].slice(0, 6);
  const missing: string[] = [];
  if (!input.productName.trim() || /^(?:your product|product)$/i.test(input.productName)) missing.push('the name of the business or product');
  if (!features.length && !input.material.images) missing.push('what to show: a website to read, photos to animate, or a list of offers');
  const source = input.hasSite && input.material.images ? 'site+uploads' : input.hasSite ? 'site' : input.material.images ? 'uploads' : 'prompt';
  const objective = OBJECTIVES.find(([re]) => re.test(input.prompt))?.[1] ?? (/\b(?:call to action|cta)\b/i.test(input.prompt) ? 'end on a call to action' : 'promote the business');
  return {
    productName: clean(input.productName) || clean(input.brandKitName),
    kind,
    kindEvidence: evidence,
    objective,
    audience: AUDIENCE[kind] ?? 'the business\'s customers',
    features,
    durationSec: input.durationSec,
    aspectRatio: input.aspectRatio,
    style: STYLE[kind],
    material: input.material,
    missing,
    restrictions: [
      'Words on screen come from the site or the brief; no invented numbers, prices, handles or features.',
      ...(kind === 'real-estate' ? ['Only features visible in the supplied photos or stated by the person are claimed (no invented room counts, views or prices).'] : []),
      ...(kind === 'restaurant' ? ['No invented dishes, prices or awards.'] : []),
      ...(kind === 'health' ? ['No medical claims or outcomes.'] : []),
    ],
    source,
  };
}

/** The requirements → decisions table: each confirmed need and what it changes in the film (upstream stage 0). */
export function decisionTable(brief: ProductBrief): DecisionRow[] {
  const m = brief.material;
  const rows: DecisionRow[] = [];
  rows.push({
    requirement: `${brief.durationSec}s ${brief.aspectRatio} film for ${brief.audience}`,
    decision: `Pace and shot lengths follow the "${brief.style}" voice`,
    effect: 'sets recipe family, native-length fitting, hold lengths and seams',
    assetNeed: '—',
    verification: 'storyboard total equals the requested length; every shot plays its native length',
  });
  if (brief.features.length) {
    rows.push({ requirement: `Show: ${brief.features.slice(0, 4).join('; ')}`, decision: 'One mapped shot per feature (first choice + fallback)', effect: 'the feature → shot map decides which recipes the storyboard may use', assetNeed: m.pages ? 'the site\'s captured pages' : m.images ? 'the supplied photos' : 'text only', verification: 'every mapped feature appears in the storyboard (F1)' });
  }
  if (m.images) rows.push({ requirement: `${m.images} supplied image${m.images === 1 ? '' : 's'}`, decision: 'The supplied images are the visual subjects of the image-led shots', effect: 'selects product-reveal and camera shots that animate a photograph', assetNeed: `${m.images} verified image${m.images === 1 ? '' : 's'}`, verification: 'each supplied image is visible in a rendered frame of its scene' });
  if (m.pages) rows.push({ requirement: 'Use the real website', decision: 'The captured pages and element geometry feed the page shots', effect: 'page-driven recipes (card deal, row embed, spotlight) are allowed', assetNeed: `${m.pages} page(s), ${m.cards} cards`, verification: 'frames show the site\'s own pages, not the sample interface' });
  if (m.logo || /logo|brand|cta|call to action/i.test(brief.objective)) rows.push({ requirement: 'Brand and call to action', decision: 'End on the brand lockup with the business\'s own mark and words', effect: 'closing brand scene uses the logo (or a typographic mark)', assetNeed: m.logo ? 'the logo' : 'the business name', verification: 'final frames name the business correctly' });
  if (!SCREEN_BUSINESSES.has(brief.kind)) rows.push({ requirement: `${brief.kind.replace('-', ' ')} business`, decision: 'No software-dashboard recipes unless the person named them', effect: 'recipes that draw a sample app screen are excluded from the choice', assetNeed: '—', verification: 'no sample interface visible in any frame' });
  return rows;
}

export const briefLines = (b: ProductBrief): string[] => [
  `${b.productName || 'The business'} · ${b.kind.replace('-', ' ')}${b.kindEvidence.length ? ` (from: ${b.kindEvidence.join(', ')})` : ''} · aim: ${b.objective} · for ${b.audience}`,
  b.features.length ? `Features to show: ${b.features.slice(0, 5).join('; ')}` : 'No features read yet',
  `Material: ${[b.material.pages ? `${b.material.pages} site page${b.material.pages === 1 ? '' : 's'}` : '', b.material.images ? `${b.material.images} image${b.material.images === 1 ? '' : 's'}` : '', b.material.videos ? `${b.material.videos} video${b.material.videos === 1 ? '' : 's'}` : '', b.material.logo ? 'logo' : '', b.material.textLines ? `${b.material.textLines} text lines` : ''].filter(Boolean).join(', ') || 'none beyond the prompt'}`,
  ...(b.missing.length ? [`Still needed: ${b.missing.join('; ')}`] : []),
];

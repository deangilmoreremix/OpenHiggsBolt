/**
 * Academy Template Data (typed, interactive)
 * ------------------------------------------------------------------
 * Each upstream Markdown template is analyzed and converted into typed
 * application data here — NOT treated as a static document. The matching
 * interactive component (see components/academy/) renders these structures
 * as fillable fields, checklists and matrices, with a "Use Template" /
 * "Create With AI" action that routes to a registered SmartVideo Recipe.
 *
 * Recipe ids referenced below must exist in `src/data/recipeRegistry.ts`.
 */

import type { AcademyAssetCategory } from './academyAssets';

/* ------------------------------------------------------------------ */
/* Shared building blocks                                             */
/* ------------------------------------------------------------------ */

export interface TemplateField {
  /** Stable key for controlled inputs. */
  key: string;
  label: string;
  placeholder?: string;
  /** 'text' = single line, 'textarea' = multi-line, 'number'. */
  input: 'text' | 'textarea' | 'number';
  /** Short helper shown under the field. */
  hint?: string;
  /** Pre-filled example value (from the template's worked example). */
  example?: string;
}

export interface TemplateChecklistItem {
  key: string;
  label: string;
  /** Pre-checked in the worked example? */
  exampleChecked?: boolean;
}

export interface RecipeLink {
  /** Must match a recipe id in recipeRegistry.ts */
  recipeId: string;
  /** Label for the action button. */
  label: string;
  /** 'create' => "Create With AI", 'use' => "Use Template". */
  action: 'create' | 'use';
  /** Optional preset values seeded into the recipe executor. */
  preset?: Record<string, string>;
}

export type AcademyTemplateKind =
  | 'script'
  | 'checklist'
  | 'matrix'
  | 'brief'
  | 'worksheet'
  | 'outreach'
  | 'proposal';

export interface AcademyTemplateBase {
  id: string;
  title: string;
  kind: AcademyTemplateKind;
  /** Lesson this template belongs to (lesson slug). */
  lesson: string;
  /** One-line description shown on cards. */
  summary: string;
  /** Long description shown in the detail view. */
  description: string;
  tags: string[];
  source: string; // original markdown filename
  /** Asset ids to surface in the SEE step. */
  assetIds: string[];
  /** Connected SmartVideo recipe(s). */
  recipes: RecipeLink[];
}

/* ------------------------------------------------------------------ */
/* 1. UGC Script Template  (ugc-script-template.md)                   */
/* ------------------------------------------------------------------ */

export interface ScriptBeat extends TemplateField {
  /** Time window string, e.g. "0-2s". */
  timing: string;
}

export interface ScriptTemplate extends AcademyTemplateBase {
  kind: 'script';
  product: TemplateField;
  targetLength: TemplateField;
  beats: ScriptBeat[];
  checklist: TemplateChecklistItem[];
}

export const ugcScriptTemplate: ScriptTemplate = {
  id: 'ugc-script-template',
  title: 'UGC Script Template',
  kind: 'script',
  lesson: 'how-ugc-works',
  summary: 'Hook / Problem-Pitch / Proof-Demo / CTA — the 30-second UGC ad script.',
  description:
    'A fill-in-the-blank structure for a sub-30-second UGC ad. Each beat maps to a timing window. Use it to brief an avatar/voice generation, then launch the UGC Ad recipe to produce the talking clip.',
  tags: ['script', 'ugc', 'hook', 'cta'],
  source: 'ugc-script-template.md',
  assetIds: ['gripmount-hook-clip'],
  recipes: [
    {
      recipeId: 'ugc-ad',
      label: 'Create UGC Ad',
      action: 'create',
    },
  ],
  product: {
    key: 'product',
    label: 'Product',
    placeholder: 'e.g. GripMount — magnetic phone car mount',
    input: 'text',
    example: 'GripMount — magnetic phone car mount',
  },
  targetLength: {
    key: 'targetLength',
    label: 'Target length',
    input: 'text',
    example: '28 seconds (~85 words)',
  },
  beats: [
    {
      key: 'hook',
      label: 'Hook',
      timing: '0-2s',
      input: 'textarea',
      placeholder:
        'A question, bold claim, or visual surprise that stops the scroll. Be specific, not generic.',
      hint: 'Specificity stops a scroll. "I did not expect X" beats "this product is amazing."',
      example:
        'Okay, I did not expect this to actually hold my phone through a pothole.',
    },
    {
      key: 'problemPitch',
      label: 'Problem / Pitch',
      timing: '2-15s',
      input: 'textarea',
      placeholder:
        'What problem does the viewer have, and how does this solve it — said like a friend, not ad copy.',
      hint: 'Naming a competing product\'s actual failure reads like a real opinion, not a feature list.',
      example:
        'I used to have one of those suction ones that fell off literally every drive — this one\'s magnetic, snaps on in like two seconds.',
    },
    {
      key: 'proofDemo',
      label: 'Proof / Demo',
      timing: '15-25s',
      input: 'textarea',
      placeholder:
        'Show it working, a result, or a specific detail that makes it credible.',
      hint: 'A concrete number ("two weeks", "10 minutes") beats an adjective ("amazing").',
      example:
        "[demo: slaps phone onto mount] It's held through every drive for the last two weeks, potholes included.",
    },
    {
      key: 'cta',
      label: 'Call to Action',
      timing: '25-28s',
      input: 'textarea',
      placeholder: 'One clear next step — link in bio, use code X. State the price if it is a strength.',
      hint: 'One action only. Tie urgency to a real reason, not just "buy now."',
      example:
        "It's $28, link's below — honestly just get it before your next road trip.",
    },
  ],
  checklist: [
    { key: 'hookSoundOff', label: 'Hook works with sound off (captions alone make sense)', exampleChecked: true },
    { key: 'oneCta', label: 'No more than one CTA', exampleChecked: true },
    { key: 'speechNotScript', label: 'Sounds like speech, not a script, when read aloud', exampleChecked: true },
    { key: 'concreteNumber', label: 'At least one concrete number or detail (not just adjectives)', exampleChecked: true },
    { key: 'under30s', label: 'Total read-aloud time is under 30 seconds', exampleChecked: true },
  ],
};

/* ------------------------------------------------------------------ */
/* 2. Ad Brief Checklist  (ad-brief-checklist.md)                     */
/* ------------------------------------------------------------------ */

export interface BriefField extends TemplateField {
  /** Group used for layout (identity / distribution / constraints). */
  group: 'product' | 'distribution' | 'constraints';
}

export interface BriefTemplate extends AcademyTemplateBase {
  kind: 'brief';
  fields: BriefField[];
}

export const adBriefTemplate: BriefTemplate = {
  id: 'ad-brief-checklist',
  title: 'Ad Brief Checklist',
  kind: 'brief',
  lesson: 'how-ugc-works',
  summary: 'Fill this out before producing a batch — for yourself or a client.',
  description:
    'A pre-production checklist that captures the product, target platform/aspect, variant count, tone, brand/legal constraints, available assets, and deadline. Routes into the AI Campaign Planner recipe.',
  tags: ['brief', 'planning', 'client'],
  source: 'ad-brief-checklist.md',
  assetIds: ['character-anchor', 'gripmount-hook-clip'],
  recipes: [
    {
      recipeId: 'campaign-planner',
      label: 'AI Campaign Planner',
      action: 'create',
    },
  ],
  fields: [
    {
      key: 'product',
      label: 'Product / service name + one-sentence description',
      input: 'text',
      group: 'product',
      example: 'GripMount — $28 magnetic phone car mount',
    },
    {
      key: 'platform',
      label: 'Target platform(s) / aspect ratio',
      input: 'text',
      group: 'distribution',
      example: 'TikTok + Instagram Reels, 9:16',
    },
    {
      key: 'variants',
      label: 'Number of variants needed',
      input: 'number',
      group: 'distribution',
      example: '5',
    },
    {
      key: 'tone',
      label: 'Tone',
      input: 'text',
      group: 'product',
      example: 'Casual, slightly surprised — not polished/corporate',
    },
    {
      key: 'constraints',
      label: 'Brand / legal constraints',
      input: 'textarea',
      group: 'constraints',
      example: "Can't claim \"unbreakable\" — say \"held up through daily driving\" instead",
    },
    {
      key: 'assets',
      label: 'Existing brand assets available',
      input: 'textarea',
      group: 'constraints',
      example: 'Product photos yes, no existing avatar/voice — this batch establishes one',
    },
    {
      key: 'deadline',
      label: 'Deadline / revision rounds included',
      input: 'text',
      group: 'constraints',
      example: '3 business days, 1 revision round included',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 3. Character Consistency Checklist  (character-consistency...)     */
/* ------------------------------------------------------------------ */

export interface ConsistencyCheckGroup {
  /** Column / shot label, e.g. "Car interior". */
  shot: string;
  /** Pre-filled verdict for the worked example (optional). */
  exampleVerdict?: string;
}

export interface ConsistencyTemplate extends AcademyTemplateBase {
  kind: 'checklist';
  items: TemplateChecklistItem[];
  /** Optional worked-example shots to render as a comparison table. */
  exampleShots?: ConsistencyCheckGroup[];
}

export const characterConsistencyTemplate: ConsistencyTemplate = {
  id: 'character-consistency-checklist',
  title: 'Character Consistency Checklist',
  kind: 'checklist',
  lesson: 'character-consistency',
  summary: 'Before delivering a batch, compare every shot of the same character against these.',
  description:
    'A drift-check workflow for reference-image (or LoRA) conditioned characters. Tick each identity attribute across shots before delivery. Connects to the Consistent Character recipe.',
  tags: ['character', 'consistency', 'drift', 'reference-image'],
  source: 'character-consistency-checklist.md',
  assetIds: ['character-anchor', 'character-drift-car', 'character-drift-kitchen', 'character-drift-outside'],
  recipes: [
    {
      recipeId: 'consistent-character',
      label: 'Create Consistent Character',
      action: 'create',
    },
  ],
  items: [
    { key: 'facialStructure', label: 'Facial structure matches across shots (face shape, eye spacing, nose)' },
    { key: 'apparentAge', label: 'Apparent age is consistent' },
    { key: 'distinguishing', label: 'Distinguishing features (freckles, scars, specific hairstyle) appear in every shot' },
    { key: 'skinTone', label: 'Skin tone / lighting doesn\'t shift the apparent identity' },
    { key: 'outfitContinuity', label: 'Outfit continuity between cuts (if the scene requires it)' },
  ],
  exampleShots: [
    { shot: 'Car interior', exampleVerdict: '✅ no drift' },
    { shot: 'Kitchen counter', exampleVerdict: '✅ no drift' },
    { shot: 'Walking outside', exampleVerdict: '✅ identity holds (different lighting)' },
  ],
};

/* ------------------------------------------------------------------ */
/* 4. Batch Matrix Template  (batch-matrix-template.md)               */
/* ------------------------------------------------------------------ */

export interface BatchRow {
  ad: number;
  hookExample: string;
  angleExample: string;
  notesExample: string;
}

export interface BatchMatrixTemplate extends AcademyTemplateBase {
  kind: 'matrix';
  constantsField: TemplateField;
  productField: TemplateField;
  columns: { key: string; label: string; placeholder: string }[];
  exampleRows: BatchRow[];
  /** How many blank rows to render by default. */
  rowCount: number;
}

export const batchMatrixTemplate: BatchMatrixTemplate = {
  id: 'batch-matrix-template',
  title: '10-Ad Batch Matrix',
  kind: 'matrix',
  lesson: 'building-ad-batch',
  summary: 'Plan hook × angle combinations before producing a batch.',
  description:
    'Lock the constants (product, proof point, CTA), then vary one or two axes (hook, angle) per ad so the test results are readable. Launch the UGC Campaign recipe to batch-generate the variant set.',
  tags: ['batch', 'matrix', 'campaign', 'testing'],
  source: 'batch-matrix-template.md',
  assetIds: ['gripmount-problem-first', 'gripmount-pov'],
  recipes: [
    {
      recipeId: 'ugc-campaign',
      label: 'Create UGC Campaign',
      action: 'create',
    },
  ],
  constantsField: {
    key: 'constants',
    label: 'Constants (same across every ad)',
    input: 'textarea',
    example: 'Product demo, proof section ("two weeks, potholes included"), CTA ("$28, link\'s below")',
  },
  productField: {
    key: 'product',
    label: 'Product',
    input: 'text',
    example: 'GripMount — $28 magnetic phone car mount',
  },
  columns: [
    { key: 'hook', label: 'Hook angle', placeholder: 'Opening line / hook' },
    { key: 'angle', label: 'Selling angle', placeholder: 'price / convenience / social proof / novelty' },
    { key: 'notes', label: 'Notes', placeholder: 'What this variant is testing' },
  ],
  rowCount: 5,
  exampleRows: [
    { ad: 1, hookExample: 'I did not expect this to hold through a pothole.', angleExample: 'Durability/surprise', notesExample: 'Baseline ad' },
    { ad: 2, hookExample: 'My old mount fell off literally every drive.', angleExample: 'Problem-first', notesExample: 'Tests naming the competitor\'s failure' },
    { ad: 3, hookExample: "POV: you're driving and your phone doesn't fall for once.", angleExample: 'Relatable/POV', notesExample: 'Tests if POV framing changes hook rate' },
    { ad: 4, hookExample: 'This $28 thing fixed a problem I didn\'t know had a fix.', angleExample: 'Price/value', notesExample: 'Leads with price as the hook' },
    { ad: 5, hookExample: 'Two weeks, every pothole, still holding.', angleExample: 'Proof-first', notesExample: 'Leads with the result, not the question' },
  ],
};

/* ------------------------------------------------------------------ */
/* 5. Outreach Template  (outreach-template.md)                       */
/* ------------------------------------------------------------------ */

export interface OutreachTemplate extends AcademyTemplateBase {
  kind: 'outreach';
  fields: TemplateField[];
  subjectField: TemplateField;
}

export const outreachTemplate: OutreachTemplate = {
  id: 'outreach-template',
  title: 'Client Outreach Template',
  kind: 'outreach',
  lesson: 'pricing-and-selling-ugc',
  summary: 'Cold outreach that leads with a finished, product-specific sample.',
  description:
    'A cold-outreach message structure for project-based UGC work. Always leads with a finished sample ad for the prospect\'s actual product — never with an explanation of the AI process. Connects to the AI Campaign Planner to produce that sample.',
  tags: ['sales', 'outreach', 'client'],
  source: 'outreach-template.md',
  assetIds: ['gripmount-hook-clip'],
  recipes: [
    {
      recipeId: 'campaign-planner',
      label: 'AI Campaign Planner',
      action: 'create',
      preset: { goal: 'produce-sample-ad' },
    },
  ],
  subjectField: {
    key: 'subject',
    label: 'Subject',
    input: 'text',
    placeholder: 'A quick ad concept for [Brand]',
    example: 'a UGC-style ad concept for TrailGear Co.',
  },
  fields: [
    {
      key: 'brand',
      label: 'Brand',
      input: 'text',
      placeholder: '[Brand]',
      example: 'TrailGear Co.',
    },
    {
      key: 'contact',
      label: 'Contact name',
      input: 'text',
      placeholder: '[Name]',
      example: 'Sam',
    },
    {
      key: 'product',
      label: 'Product',
      input: 'text',
      placeholder: "[Brand]'s [product]",
      example: 'GripMount phone mount',
    },
    {
      key: 'turnaround',
      label: 'Turnaround',
      input: 'text',
      placeholder: '[X days]',
      example: '3 days',
    },
    {
      key: 'yourName',
      label: 'Your name',
      input: 'text',
      placeholder: '[Your name]',
      example: 'Jess',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 6. Retainer Proposal Template  (retainer-proposal-template.md)     */
/* ------------------------------------------------------------------ */

export interface ProposalTemplate extends AcademyTemplateBase {
  kind: 'proposal';
  fields: TemplateField[];
}

export const retainerProposalTemplate: ProposalTemplate = {
  id: 'retainer-proposal-template',
  title: 'Retainer Proposal Template',
  kind: 'proposal',
  lesson: 'pricing-and-selling-ugc',
  summary: 'Pitch ongoing monthly batch production after 2-3 completed projects.',
  description:
    'A fill-in retainer pitch: scope, monthly ad count, price, revision policy, turnaround, term, and a "why this works" line tied to real delivered results. Anchors to the documented $1,500–$3,000/month range.',
  tags: ['sales', 'retainer', 'pricing', 'proposal'],
  source: 'retainer-proposal-template.md',
  assetIds: ['character-anchor'],
  recipes: [
    {
      recipeId: 'ugc-campaign',
      label: 'Create UGC Campaign',
      action: 'create',
      preset: { mode: 'retainer' },
    },
  ],
  fields: [
    { key: 'client', label: 'Client', input: 'text', example: 'TrailGear Co.' },
    { key: 'scope', label: 'Scope', input: 'text', example: '8 ad variants/month, across 2 batches' },
    { key: 'price', label: 'Price', input: 'text', example: '$2,000/month' },
    { key: 'includes', label: 'Includes', input: 'textarea', example: 'scripting, production, 2 revision rounds/batch, 9:16 + 1:1, one-page test-plan' },
    { key: 'turnaround', label: 'Turnaround', input: 'text', example: '5 business days per batch' },
    { key: 'term', label: 'Term', input: 'text', example: 'month-to-month, no minimum' },
    { key: 'why', label: 'Why this works', input: 'textarea', example: 'The GripMount test batch (Ad #2, problem-first hook) outperformed original creative on hook rate.' },
  ],
};

/* ------------------------------------------------------------------ */
/* 7. Teardown Worksheet  (teardown-worksheet.md)                     */
/* ------------------------------------------------------------------ */

export interface TeardownLayer extends TemplateField {
  layer: string;
}

export interface TeardownTemplate extends AcademyTemplateBase {
  kind: 'worksheet';
  topFields: TemplateField[];
  layers: TeardownLayer[];
  takeawayField: TemplateField;
}

export const teardownWorksheet: TeardownTemplate = {
  id: 'teardown-worksheet',
  title: 'Ad Teardown Worksheet',
  kind: 'worksheet',
  lesson: 'case-study-teardown',
  summary: 'Reverse-engineer a winning ad into reusable structural decisions.',
  description:
    'A five-layer teardown (hook, pitch, proof, CTA, avatar/voice, video structure, captions) applied to a real running ad from a public ad library. Turns "that ad performed well" into reusable takeaways — and doubles as a prospecting opener.',
  tags: ['teardown', 'analysis', 'research', 'sales'],
  source: 'teardown-worksheet.md',
  assetIds: ['gripmount-pov'],
  recipes: [
    {
      recipeId: 'campaign-planner',
      label: 'AI Campaign Planner',
      action: 'create',
      preset: { goal: 'apply-teardown' },
    },
  ],
  topFields: [
    { key: 'category', label: 'Ad category / product type', input: 'text', example: 'Skincare serum' },
    { key: 'longevity', label: 'How long has it been running (longevity signal)', input: 'text', example: '47 days, 6 near-identical variants' },
  ],
  layers: [
    { key: 'hook', layer: 'Hook', label: 'Hook', input: 'textarea', example: '"I stopped using retinol after this happened to my skin."' },
    { key: 'pitch', layer: 'Pitch / Problem', label: 'Pitch / Problem', input: 'textarea', example: 'Names the specific complaint (retinol irritation) before introducing the product' },
    { key: 'proof', layer: 'Proof / Demo', label: 'Proof / Demo', input: 'textarea', example: 'Before/after skin close-up, timestamped "day 1 / day 14"' },
    { key: 'cta', layer: 'CTA', label: 'CTA', input: 'textarea', example: '"Link in bio, 20% off first order"' },
    { key: 'avatarVoice', layer: 'Avatar / Voice tone', label: 'Avatar / Voice tone', input: 'textarea', example: 'Calm, first-person, slightly vulnerable' },
    { key: 'videoStructure', layer: 'Video structure', label: 'Video structure (talking-head vs b-roll ratio)', input: 'textarea', example: 'Mostly talking-head, one b-roll cut for the before/after' },
    { key: 'captions', layer: 'Captions style', label: 'Captions style', input: 'textarea', example: 'Bold-highlighted keywords, tightly synced' },
  ],
  takeawayField: {
    key: 'takeaway',
    label: 'Structural takeaway I could reuse for a different product',
    input: 'textarea',
    example:
      'A pain-first hook that withholds the product name for the first few seconds, paired with a dated before/after, works well for skincare-category ads.',
  },
};

/* ------------------------------------------------------------------ */
/* Registry accessors                                                 */
/* ------------------------------------------------------------------ */

export type AnyAcademyTemplate =
  | ScriptTemplate
  | BriefTemplate
  | ConsistencyTemplate
  | BatchMatrixTemplate
  | OutreachTemplate
  | ProposalTemplate
  | TeardownTemplate;

export const academyTemplates: AnyAcademyTemplate[] = [
  ugcScriptTemplate,
  adBriefTemplate,
  characterConsistencyTemplate,
  batchMatrixTemplate,
  outreachTemplate,
  retainerProposalTemplate,
  teardownWorksheet,
];

export function getTemplate(id: string): AnyAcademyTemplate | undefined {
  return academyTemplates.find((t) => t.id === id);
}

export function getTemplatesByLesson(lesson: string): AnyAcademyTemplate[] {
  return academyTemplates.filter((t) => t.lesson === lesson);
}

/** Category used for asset filtering on the SEE step. */
export const templateAssetCategory: Record<string, AcademyAssetCategory | undefined> = {
  'ugc-script-template': 'ugc-hook',
  'ad-brief-checklist': 'ugc',
  'character-consistency-checklist': 'character',
  'batch-matrix-template': 'ugc-problem-first',
  'outreach-template': 'ugc',
  'retainer-proposal-template': 'ugc',
  'teardown-worksheet': 'ugc-pov',
};

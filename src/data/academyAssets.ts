/**
 * Academy Asset Manifest
 * ------------------------------------------------------------------
 * Central registry of every reusable course asset imported from the
 * upstream `ai-creator-academy` track "01-ai-video-ads-ugc".
 *
 * Assets are copied locally into `public/academy/ugc/...` — this file
 * NEVER references GitHub raw URLs at runtime. Each entry carries the
 * metadata the Academy UI (LEARN / SEE / CREATE) and the asset viewer
 * need to render and link assets to their lesson + template.
 *
 * Provenance / licensing: every asset here ships inside the upstream
 * repository's `templates/examples/` folder. They are teaching examples
 * (GripMount phone-mount UGC ads) bundled with the course. Marked
 * `requiresProvenanceReview` where a brand/face asset may need a usage
 * check before being used in paid client deliverables — see REPORT.
 */

export type AcademyAssetType =
  | 'image'
  | 'video'
  | 'gif';

export type AcademyAssetCategory =
  | 'character'
  | 'ugc'
  | 'ugc-hook'
  | 'ugc-problem-first'
  | 'ugc-pov';

export interface AcademyAsset {
  id: string;
  title: string;
  type: AcademyAssetType;
  /** Local path to the image/poster/thumbnail. */
  thumbnail?: string;
  /** Local path to a silent GIF preview (optional). */
  gifSrc?: string;
  /** Local path to the full MP4 (optional). */
  videoSrc?: string;
  /** Local path to a still image (for images / poster frames). */
  src?: string;
  category: AcademyAssetCategory;
  /** Lesson id this asset illustrates (e.g. "how-ugc-works"). */
  lesson?: string;
  /** Template id this asset illustrates (optional). */
  template?: string;
  description: string;
  tags: string[];
  /** True when this asset depicts a real brand/face and needs a usage review. */
  requiresProvenanceReview?: boolean;
}

const BASE = '/academy/ugc';

export const academyAssets: AcademyAsset[] = [
  // ---- Character consistency examples (Module 2) ----
  {
    id: 'character-anchor',
    title: 'Master Character Anchor',
    type: 'image',
    src: `${BASE}/images/character-anchor.jpg`,
    thumbnail: `${BASE}/images/character-anchor.jpg`,
    category: 'character',
    lesson: 'character-consistency',
    template: 'character-consistency-checklist',
    description:
      'The reference anchor portrait (woman, late 20s, brown hair, freckles) used for reference-image conditioning across every other shot. This is the "source of truth" image the consistency checklist is measured against.',
    tags: ['character', 'anchor', 'consistency', 'reference-image'],
    requiresProvenanceReview: true,
  },
  {
    id: 'character-drift-car',
    title: 'Consistent Render — Car Interior',
    type: 'image',
    src: `${BASE}/images/character-drift-car.jpg`,
    thumbnail: `${BASE}/images/character-drift-car.jpg`,
    category: 'character',
    lesson: 'character-consistency',
    template: 'character-consistency-checklist',
    description:
      'Same anchor character, new setting (car interior). Produced by passing the anchor image as an edit input to a reference-conditioned model — face shape, freckles and age stay locked.',
    tags: ['character', 'drift-check', 'reference-image', 'car'],
    requiresProvenanceReview: true,
  },
  {
    id: 'character-drift-kitchen',
    title: 'Consistent Render — Kitchen Counter',
    type: 'image',
    src: `${BASE}/images/character-drift-kitchen.jpg`,
    thumbnail: `${BASE}/images/character-drift-kitchen.jpg`,
    category: 'character',
    lesson: 'character-consistency',
    template: 'character-consistency-checklist',
    description:
      'Same anchor character on a kitchen counter. Drift-check sample #2 — identity held across a different scene and lighting.',
    tags: ['character', 'drift-check', 'reference-image', 'kitchen'],
    requiresProvenanceReview: true,
  },
  {
    id: 'character-drift-outside',
    title: 'Consistent Render — Walking Outside',
    type: 'image',
    src: `${BASE}/images/character-drift-outside.jpg`,
    thumbnail: `${BASE}/images/character-drift-outside.jpg`,
    category: 'character',
    lesson: 'character-consistency',
    template: 'character-consistency-checklist',
    description:
      'Same anchor character walking outside with completely different outdoor lighting. Drift-check sample #3 — the hardest case, identity still holds.',
    tags: ['character', 'drift-check', 'reference-image', 'outdoor'],
    requiresProvenanceReview: true,
  },

  // ---- UGC hook clip (Module 1 & 4) ----
  {
    id: 'gripmount-hook-clip',
    title: 'GripMount Hook Clip (I2V)',
    type: 'video',
    videoSrc: `${BASE}/videos/gripmount-hook-clip.mp4`,
    gifSrc: `${BASE}/gifs/gripmount-hook-clip.gif`,
    thumbnail: `${BASE}/gifs/gripmount-hook-clip.gif`,
    category: 'ugc-hook',
    lesson: 'how-ugc-works',
    template: 'ugc-script-template',
    description:
      'Unedited first-pass clip: the anchor image animated into a short talking clip from the Module 1 hook line. Shows what a real first-pass output looks like before b-roll/captions.',
    tags: ['ugc', 'hook', 'image-to-video', 'gripmount'],
    requiresProvenanceReview: true,
  },

  // ---- UGC problem-first ad (Module 3, Ad 2) ----
  {
    id: 'gripmount-problem-first',
    title: 'Problem-First UGC Ad',
    type: 'video',
    videoSrc: `${BASE}/videos/gripmount-ad2-problem-first.mp4`,
    gifSrc: `${BASE}/gifs/gripmount-ad2-problem-first.gif`,
    thumbnail: `${BASE}/gifs/gripmount-ad2-problem-first.gif`,
    category: 'ugc-problem-first',
    lesson: 'building-ad-batch',
    template: 'batch-matrix-template',
    description:
      'Ad #2 of the 5-ad batch. Problem-first hook ("My old mount fell off literally every drive.") — same anchor character and product, only the opening line changes.',
    tags: ['ugc', 'batch', 'problem-first', 'gripmount'],
    requiresProvenanceReview: true,
  },

  // ---- UGC POV ad (Module 3, Ad 3 / Module 5 teardown) ----
  {
    id: 'gripmount-pov',
    title: 'POV Demonstration UGC Ad',
    type: 'video',
    videoSrc: `${BASE}/videos/gripmount-ad3-pov.mp4`,
    gifSrc: `${BASE}/gifs/gripmount-ad3-pov.gif`,
    thumbnail: `${BASE}/gifs/gripmount-ad3-pov.gif`,
    category: 'ugc-pov',
    lesson: 'building-ad-batch',
    template: 'batch-matrix-template',
    description:
      'Ad #3 of the 5-ad batch. Relatable/POV format ("POV: you\'re driving and your phone doesn\'t fall for once.") — tests whether POV framing changes hook rate.',
    tags: ['ugc', 'batch', 'pov', 'gripmount', 'teardown'],
    requiresProvenanceReview: true,
  },
];

export function getAsset(id: string): AcademyAsset | undefined {
  return academyAssets.find((a) => a.id === id);
}

export function getAssetsByLesson(lesson: string): AcademyAsset[] {
  return academyAssets.filter((a) => a.lesson === lesson);
}

export function getAssetsByTemplate(template: string): AcademyAsset[] {
  return academyAssets.filter((a) => a.template === template);
}

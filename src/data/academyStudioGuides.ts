/**
 * One entry per studio the Academy teaches. Single source of truth for:
 *   - the Academy "Create with <studio>" guide (components/academy/AcademyCourse.tsx)
 *   - the in-studio "Guide" link (components/StandaloneShell.js)
 *   - the help assistant's links (scripts/build-help-index.ts)
 *
 * `id` matches the studio tab id in components/StandaloneShell.js TABS and the
 * `id` in src/data/studioKnowledgeBase.json. `route` is the REAL page a customer
 * opens (brand-studio and photo-studio are not under /studio). Tests check that
 * every TABS id is present, every kbId resolves and every track slug exists.
 */
export interface AcademyStudioGuide {
  id: string;
  label: string;
  route: string;
  /** Academy track slugs (folders in src/content/academy) most relevant to this studio. */
  tracks: string[];
  /** Short line shown above the numbered steps. */
  tagline: string;
}

export const ACADEMY_STUDIO_GUIDES: AcademyStudioGuide[] = [
  { id: 'image', label: 'Image Studio', route: '/studio/image', tracks: ['07-ai-product-photography', '10-ai-headshots-and-portraits', '11-ai-print-on-demand-and-merch'], tagline: 'Create and transform images from prompts and reference photos.' },
  { id: 'brand-studio', label: 'Brand Studio', route: '/brand-studio', tracks: ['14-ai-freelancing-and-agency-business'], tagline: 'Build a brand and generate on-brand campaign assets.' },
  { id: 'video', label: 'Video Studio', route: '/studio/video', tracks: ['ugc', '02-ai-filmmaking'], tagline: 'Generate video from text or images.' },
  { id: 'edit', label: 'Edit', route: '/studio/edit', tracks: ['13-ai-tools-mastery'], tagline: 'Edit and assemble your media.' },
  { id: 'audio', label: 'Audio Studio', route: '/studio/audio', tracks: ['06-ai-audio-and-music'], tagline: 'Create voices, music and sound.' },
  { id: 'clipping', label: 'AI Clipping', route: '/studio/clipping', tracks: ['04-ai-content-factories', '03-faceless-ai-channels'], tagline: 'Turn long videos into short clips.' },
  { id: 'vibe-motion', label: 'Vibe Motion', route: '/studio/vibe-motion', tracks: ['04-ai-content-factories'], tagline: 'Create motion graphics and animated visuals.' },
  { id: 'motion-control', label: 'Motion Control', route: '/studio/motion-control', tracks: ['02-ai-filmmaking'], tagline: 'Drive a character or subject with reference motion.' },
  { id: 'lipsync', label: 'Lip Sync', route: '/studio/lipsync', tracks: ['05-ai-avatars-and-influencers', 'ugc'], tagline: 'Make a portrait speak your audio.' },
  { id: 'cinema', label: 'Cinema Studio', route: '/studio/cinema', tracks: ['02-ai-filmmaking'], tagline: 'Cinematic stills and shots with camera control.' },
  { id: 'storyboard', label: 'Storyboard', route: '/studio/storyboard', tracks: ['02-ai-filmmaking', 'ugc'], tagline: 'Plan scenes and shots before you generate.' },
  { id: 'zackd', label: 'Zack D Studio', route: '/studio/zackd', tracks: ['04-ai-content-factories'], tagline: 'Compose and render finished videos from templates.' },
  { id: 'marketing', label: 'Marketing Studio', route: '/studio/marketing', tracks: ['ugc', '14-ai-freelancing-and-agency-business'], tagline: 'Make marketing creative for products and campaigns.' },
  { id: 'motion-director', label: 'Motion Director', route: '/studio/motion-director', tracks: ['02-ai-filmmaking', 'ugc'], tagline: 'Direct a finished film with an AI director.' },
  { id: 'recast', label: 'Body Swap', route: '/studio/recast', tracks: ['05-ai-avatars-and-influencers', '08-ai-fashion-and-virtual-tryon'], tagline: 'Swap a person or character in your footage.' },
  { id: 'layers', label: 'Layers Studio', route: '/studio/layers', tracks: ['07-ai-product-photography'], tagline: 'Separate, upscale and extend image layers.' },
  { id: 'workflows', label: 'Workflows', route: '/studio/workflows', tracks: ['13-ai-tools-mastery', '15-ai-agents-and-vibe-coding'], tagline: 'Chain steps into repeatable automations.' },
  { id: 'agents', label: 'Agents', route: '/studio/agents', tracks: ['15-ai-agents-and-vibe-coding'], tagline: 'Create and chat with AI agents.' },
  { id: 'design-agent', label: 'Design Agent AI', route: '/studio/design-agent', tracks: ['13-ai-tools-mastery'], tagline: 'Design with a conversational AI agent.' },
  { id: 'vfx-studio', label: 'VFX', route: '/studio/vfx-studio', tracks: ['02-ai-filmmaking'], tagline: 'Apply AI effects and motion to video.' },
  { id: 'thumbnail-studio', label: 'Thumbnail Studio', route: '/studio/thumbnail-studio', tracks: ['03-faceless-ai-channels'], tagline: 'Design click-worthy thumbnails.' },
  { id: 'ai-influencer', label: 'AI Influencer Studio', route: '/studio/ai-influencer', tracks: ['05-ai-avatars-and-influencers'], tagline: 'Create a consistent AI character for content.' },
  { id: 'go-ai-viral', label: 'GO-Viral', route: '/studio/go-ai-viral', tracks: ['04-ai-content-factories'], tagline: 'Plan and produce viral short-form content.' },
  { id: 'apps', label: 'SmartVideo GO AI Apps', route: '/studio/apps', tracks: [], tagline: 'Browse, launch and resell ready-made AI apps.' },
  { id: 'photo-studio', label: 'Photo Studio', route: '/photo-studio', tracks: ['07-ai-product-photography'], tagline: 'Product and portrait photo workflows.' },
  { id: 'social-publishing', label: 'Social Publishing', route: '/studio/image', tracks: ['04-ai-content-factories'], tagline: 'Publish your creations to social accounts from any studio.' },
];

export const STUDIO_GUIDE_IDS = ACADEMY_STUDIO_GUIDES.map((g) => g.id);

export function getStudioGuide(id: string | null | undefined): AcademyStudioGuide | null {
  return ACADEMY_STUDIO_GUIDES.find((g) => g.id === id) ?? null;
}

/** Academy deep link to a studio's "Create with" guide. */
export function academyStudioUrl(id: string): string {
  return `/academy?view=studio-reference&studio=${encodeURIComponent(id)}&tab=create`;
}

/** Academy deep link to a track (and optionally a lesson). */
export function academyTrackUrl(track: string, lesson?: string): string {
  return `/academy?track=${encodeURIComponent(track)}${lesson ? `&lesson=${encodeURIComponent(lesson)}` : ''}`;
}

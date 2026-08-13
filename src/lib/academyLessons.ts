import fs from 'node:fs';
import path from 'node:path';

export interface AcademyLesson {
  slug: string;
  title: string;
  order: number;
  markdown: string;
}

export interface AcademyEntry {
  slug: string;
  title: string;
}

export interface AcademyTrack {
  slug: string;
  title: string;
  order: number;
  lessons: AcademyEntry[];
  templates: AcademyEntry[];
}

const ACADEMY_DIR = path.join(process.cwd(), 'src', 'content', 'academy');

const TRACK_TITLES: Record<string, string> = {
  ugc: 'AI Video Ads & UGC',
  '01-ai-video-ads-ugc': 'AI Video Ads & UGC',
  '02-ai-filmmaking': 'AI Filmmaking',
  '03-faceless-ai-channels': 'Faceless AI Channels',
  '04-ai-content-factories': 'AI Content Factories',
  '05-ai-avatars-and-influencers': 'AI Avatars & Influencers',
  '06-ai-audio-and-music': 'AI Audio & Music',
  '07-ai-product-photography': 'AI Product Photography',
  '08-ai-fashion-and-virtual-tryon': 'AI Fashion & Virtual Try-On',
  '09-ai-real-estate-staging': 'AI Real Estate Staging',
  '10-ai-headshots-and-portraits': 'AI Headshots & Portraits',
  '11-ai-print-on-demand-and-merch': 'AI Print-on-Demand & Merch',
  '12-ai-stock-content-and-licensing': 'AI Stock Content & Licensing',
  '13-ai-tools-mastery': 'AI Tools Mastery',
  '14-ai-freelancing-and-agency-business': 'AI Freelancing & Agency Business',
  '15-ai-agents-and-vibe-coding': 'AI Agents & Vibe Coding',
};

/* Track order: 01 (content folder "ugc") first, then the rest by number. */
function trackOrder(slug: string): number {
  const m = slug.match(/^(\d+)-/);
  if (slug === 'ugc') return 1;
  return m ? parseInt(m[1], 10) : 99;
}

function titleFromFilename(file: string): string {
  return file
    .replace(/\.md$/, '')
    .replace(/^\d+-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function listMarkdown(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

let cache: AcademyTrack[] | null = null;

export function getAllTracks(): AcademyTrack[] {
  if (cache) return cache;
  const tracks: AcademyTrack[] = [];
  for (const entry of fs.readdirSync(ACADEMY_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const trackSlug = entry.name;
    const trackDir = path.join(ACADEMY_DIR, trackSlug);
    const lessons = listMarkdown(path.join(trackDir, 'lessons')).map((f, i) => ({
      slug: f.replace(/\.md$/, ''),
      title: titleFromFilename(f),
      order: i,
    }));
    const templates = listMarkdown(path.join(trackDir, 'templates')).map((f, i) => ({
      slug: f.replace(/\.md$/, ''),
      title: titleFromFilename(f),
      order: i,
    }));
    tracks.push({
      slug: trackSlug,
      title: TRACK_TITLES[trackSlug] || titleFromFilename(trackSlug),
      order: trackOrder(trackSlug),
      lessons,
      templates,
    });
  }
  cache = tracks.sort((a, b) => a.order - b.order);
  return cache;
}

/** Read a single lesson's markdown from disk (server-side only). */
export function getLessonMarkdown(trackSlug: string, lessonSlug: string): string {
  const file = path.join(ACADEMY_DIR, trackSlug, 'lessons', `${lessonSlug}.md`);
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return `# ${lessonSlug}\n\nLesson content unavailable.`;
  }
}

/** Read a single template's markdown (raw, rebranded copy). */
export function getTemplateMarkdown(trackSlug: string, templateSlug: string): string {
  const file = path.join(ACADEMY_DIR, trackSlug, 'templates', `${templateSlug}.md`);
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return `# ${templateSlug}\n\nTemplate content unavailable.`;
  }
}

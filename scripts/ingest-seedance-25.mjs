/**
 * Ingest script for BeatAPI/awesome-seedance-2-5-prompts
 *
 * Downloads 50 curated English video+prompt entries from the BeatAPI catalog,
 * places them in public/media/seedance-25/, and generates src/data/seedance25Demos.ts
 *
 * Usage: node scripts/ingest-seedance-25.mjs
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { request } from 'node:https';

const CATALOG_URL =
  'https://raw.githubusercontent.com/BeatAPI/awesome-seedance-2-5-prompts/main/prompts/catalog.json';

// Source-category → canonical landing-page category mapping
const CATEGORY_MAP = {
  'cinematic-action': 'Action',
  'cinematic-story': 'Cinema',
  'brand-film': 'Commercial',
  'music-video': 'Social',
  'vlog': 'Social',
  'animation': 'Animation',
  'fantasy': 'Cinema',
  'documentary': 'Social',
  'horror': 'Cinema',
  'comedy': 'Social',
  'dance': 'Animation',
  'dialogue': 'Cinema',
  performance: 'Cinema',
};

const STUDIO_TAB_MAP = {
  Action: 'cinema',
  Animation: 'ai-influencer',
  Cinema: 'cinema',
  Commercial: 'marketing',
  Fashion: 'ai-influencer',
  Social: 'video',
  UGC: 'video',
};

const MEDIA_DIR = 'public/media/seedance-25';
const VIDEOS_DIR = `${MEDIA_DIR}/videos`;
const PREVIEWS_DIR = `${MEDIA_DIR}/previews`;
const DATA_DIR = 'src/data';

const ZH_REGEX = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
function isEnglish(text) {
  return !ZH_REGEX.test(text);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    request(url, (res) => {
      if (res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function download(url, filepath) {
  return new Promise((resolve, reject) => {
    console.log(`  ↳ ${url} → ${filepath}`);
    request(url, (res) => {
      if (res.statusCode === 404) {
        reject(new Error(`404: ${url}`));
        return;
      }
      if (res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }
      const file = createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(true)));
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔄 Fetching BeatAPI catalog...');
  const catalog = await fetchJson(CATALOG_URL);
  const prompts = catalog.prompts;
  console.log(`📦 Total catalog entries: ${prompts.length}`);

  // Filter: must have video URL, prompt text, and be English
  const valid = prompts.filter((p) => {
    const media = p.media || {};
    const hasVideo = !!media.video && typeof media.video === 'string';
    const hasPrompt = !!p.prompt && typeof p.prompt === 'string' && p.prompt.length > 10;
    const isEn = isEnglish(p.prompt);
    return hasVideo && hasPrompt && isEn;
  });
  console.log(`✅ Entries with video + English prompt: ${valid.length}`);

  // Map to canonical categories
  const mapped = valid.map((p) => ({
    ...p,
    canonicalCategory: CATEGORY_MAP[p.category] || 'Cinema',
  }));

  // Group by canonical category
  const byCat = {};
  for (const p of mapped) {
    if (!byCat[p.canonicalCategory]) byCat[p.canonicalCategory] = [];
    byCat[p.canonicalCategory].push(p);
  }

  // Sort each category by videoBytes (proxy for quality), descending
  for (const cat of Object.keys(byCat)) {
    byCat[cat].sort((a, b) => (b.media?.videoBytes || 0) - (a.media?.videoBytes || 0));
  }

  // Curate to 50: distribute across categories
  // Action(8) + Animation(6) + Cinema(10) + Commercial(8) + Fashion(4) + Social(8) + UGC(2) = 46
  // Remaining 4 from highest videoBytes
  const TARGETS = {
    Action: 8,
    Animation: 6,
    Cinema: 10,
    Commercial: 8,
    Fashion: 4,
    Social: 8,
    UGC: 2,
  };

  let curated = [];
  for (const [cat, count] of Object.entries(TARGETS)) {
    curated.push(...(byCat[cat] || []).slice(0, count));
  }

  // Fill remaining from highest videoBytes
  const usedSlugs = new Set(curated.map((p) => p.slug));
  const remaining = mapped
    .filter((p) => !usedSlugs.has(p.slug))
    .sort((a, b) => (b.media?.videoBytes || 0) - (a.media?.videoBytes || 0));
  curated.push(...remaining.slice(0, 50 - curated.length));

  // Final trim to 50 by videoBytes
  curated.sort((a, b) => (b.media?.videoBytes || 0) - (a.media?.videoBytes || 0));
  curated = curated.slice(0, 50);
  console.log(`🎯 Curated to ${curated.length} entries`);

  // Create directories
  await mkdir(VIDEOS_DIR, { recursive: true });
  await mkdir(PREVIEWS_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });

  // Download videos and thumbnails, build data entries
  const demoEntries = [];
  for (let i = 0; i < curated.length; i++) {
    const p = curated[i];
    const slug = p.slug;
    const videoUrl = p.media.video;
    const thumbnailUrl = p.media.thumbnail;
    const videoFilename = videoUrl.split('/').pop();
    const localPoster = slug + '.jpg';
    const localVideo = `${VIDEOS_DIR}/${videoFilename}`;
    const localThumbnail = `${PREVIEWS_DIR}/${localPoster}`;

    try {
      await download(videoUrl, localVideo);
      await download(thumbnailUrl, localThumbnail);
    } catch (e) {
      console.warn(`  ⚠️  Failed to download ${slug}: ${e.message}`);
      continue;
    }

    demoEntries.push({
      id: demoEntries.length + 1,
      slug,
      title: typeof p.title === 'object' ? p.title.en : p.title,
      category: p.canonicalCategory,
      rawCategory: p.category,
      useCase:
        p.ingredients && p.ingredients.length > 0
          ? p.ingredients.join(', ')
          : `${p.category} prompt`,
      duration: p.duration,
      durationLabel: p.duration || '30s',
      aspectRatio: p.aspectRatio || '16:9',
      videoSrc: `/media/seedance-25/videos/${videoFilename}`,
      posterSrc: `/media/seedance-25/previews/${localPoster}`,
      prompt: p.prompt,
      featured: false,
      hero: false,
      interactive: false,
      studioTab: STUDIO_TAB_MAP[p.canonicalCategory] || 'video',
      tags: [p.category, ...(p.ingredients?.map((ing) => ing.toLowerCase()) || [])],
      sourceUrl: p.source?.url || '',
      sourceRepo: 'seedance-25',
    });
  }

  // Mark hero and interactive
  if (demoEntries.length > 0) {
    demoEntries[0].hero = true;
    demoEntries[0].featured = true;
    if (demoEntries.length > 1) {
      demoEntries[1].interactive = true;
    }
  }

  const fileContent = `// AUTO-GENERATED by scripts/ingest-seedance-25.mjs
// Source: https://github.com/BeatAPI/awesome-seedance-2-5-prompts
// Only entries with BOTH a video AND an English prompt are included.
// Non-English entries were filtered out.

import { type VideoDemo } from './types';
export { DEMO_CATEGORIES } from './types';

export const SEEDANCE_25_DEMOS: VideoDemo[] = ${JSON.stringify(demoEntries, null, 2)};

export const HERO_DEMO_25 = SEEDANCE_25_DEMOS.find((d) => d.hero);
export const INTERACTIVE_DEMO_25 = SEEDANCE_25_DEMOS.find((d) => d.interactive);
export const FEATURED_25 = SEEDANCE_25_DEMOS.filter((d) => d.featured);
`;

  await writeFile(`${DATA_DIR}/seedance25Demos.ts`, fileContent);
  console.log(`📝 Generated ${DATA_DIR}/seedance25Demos.ts with ${demoEntries.length} entries`);
  console.log('✅ Done! Downloads complete.');
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});

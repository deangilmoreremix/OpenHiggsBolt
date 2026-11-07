#!/usr/bin/env node
// Generates replacement thumbnails for MuAPI template workflows whose own
// thumbnail is gone from MuAPI's CDN (cdn.muapi.ai/outputs/* answers 403).
//
//   MUAPI_API_KEY=... npm run thumbnails:workflow-templates            # missing files only
//   MUAPI_API_KEY=... npm run thumbnails:workflow-templates -- --force # regenerate all
//   MUAPI_API_KEY=... npm run thumbnails:workflow-templates -- --only <file>
//
// Each image is a result-style still of what the workflow makes, rendered with
// muapi's nano-banana-pro model, resized to 600x800 JPEG (the 3:4 workflow
// card) and written to public/thumbnails/workflows/<file>. The upstream URL is
// mapped to that file in app/api/workflow/[[...path]]/thumbnail-rewrite.js;
// scripts/refresh-workflow-thumbnails.mjs keeps these files and map entries.

import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/thumbnails/workflows');
const API = `${(process.env.MUAPI_BASE_URL || 'https://api.muapi.ai').replace(/\/$/, '')}/api/v1`;
const MODEL_ENDPOINT = 'nano-banana-pro';
const POLL_MS = 3000;
const TIMEOUT_MS = 5 * 60 * 1000;

const STYLE =
  'Vertical 3:4 portrait composition, cinematic lighting, rich contrast, photoreal, high detail. ' +
  'No text, no letters, no words, no watermark, no logos, no UI.';

// Upstream thumbnail URL (dead on MuAPI's CDN) -> replacement file and prompt.
export const TEMPLATE_THUMBNAILS = {
  'https://cdn.muapi.ai/outputs/generated/f66e3b6a88a24179a97e557a0ee1e4dd.png': {
    file: 'ugc-ads-workflow-seedance-2-omni.jpg',
    prompt:
      'A smiling young female influencer filming a selfie-style UGC video ad, holding a sleek skincare bottle up to the camera in her hand, bright modern apartment, natural window light, authentic social media look.',
  },
  'https://cdn.muapi.ai/outputs/generated/9c5d7533c1f94c2882f08e1a27eac66d.jpg': {
    file: 'multi-angle-photo-reshoot-nano-banana-2.jpg',
    prompt:
      'A 2x2 grid of photos of the same stylish young man in a brown leather jacket, each from a different camera angle: front, three-quarter side, low angle and dramatic fisheye close-up, consistent studio lighting.',
  },
  'https://cdn.muapi.ai/outputs/8be1261a6cbb4c47be9e26873059c9b7.jpg': {
    file: 'paper-cutting-art-seedream-v5.jpg',
    prompt:
      'Intricate layered paper-cut art of India: the Taj Mahal, palm trees, elephants and peacocks in many stacked layers of saffron, white and green paper with deep shadows between layers, shadow-box diorama.',
  },
  'https://cdn.muapi.ai/outputs/db8173687fa04f73a55d0513bc878bb1.jpg': {
    file: 'selfie-with-celebrities-kling-o1-pixverse-v5.jpg',
    prompt:
      'A cheerful fan taking a selfie on a grand fantasy movie set, glowing blue bioluminescent jungle behind, film crew lights and camera rigs visible, behind-the-scenes blockbuster atmosphere.',
  },
  'https://cdn.muapi.ai/outputs/ce671ecafd804eda9610ffabca0ef575.jpg': {
    file: 'double-exposure-portrait-maker-nano-banana-2.jpg',
    prompt:
      'Artistic double exposure portrait: the side profile silhouette of a young woman blended with the Paris skyline and the Eiffel Tower at dusk inside her head, soft white background, fine-art photography.',
  },
  'https://cdn.muapi.ai/outputs/3000550ad162428d8b98afeb7065c20c.jpg': {
    file: 'soccer-collectable-card-maker-nano-banana.jpg',
    prompt:
      'A premium holographic soccer trading card standing on a dark surface, showing a professional footballer in action in a blue and white striped kit, foil shine, gold border, collectible card design.',
  },
  'https://cdn.muapi.ai/outputs/3939f69e112f47fda84f3da6845c7482.jpg': {
    file: 'ai-sculpture-maker-nano-banana-2.jpg',
    prompt:
      'An ultra-detailed sculpture bust of a young man carved from shining polished white marble with gold veins, displayed on a pedestal in a museum gallery with soft spotlight.',
  },
  'https://cdn.muapi.ai/outputs/ebc035845ad94da9818b8a9454f484bf.jpg': {
    file: 'furniture-campaign-generator-seedream-v5-qwen-nano.jpg',
    prompt:
      'A luxury furniture advertising campaign photo: a serene modern bedroom with a walnut bed, linen bedding, sculptural lamp and warm earth-tone moodboard palette, editorial interior photography.',
  },
  'https://cdn.muapi.ai/outputs/87ecbea083264af288a0d832064e312a.jpg': {
    file: 'phoenix-multi-model-image-to-video-wan2-seedream.jpg',
    prompt:
      'A colossal phoenix statue carved from molten obsidian stands atop a floating volcanic island, glowing lava veins and fiery wings spread wide, embers in a dark sky, epic fantasy scene.',
  },
};

function parseArgs(argv) {
  const args = { force: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--force') args.force = true;
    else if (argv[i] === '--only') args.only = argv[++i];
  }
  return args;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(pathname, key, init = {}) {
  const response = await fetch(`${API}/${pathname}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, ...(init.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

async function generate(prompt, key) {
  const submitted = await api(MODEL_ENDPOINT, key, {
    method: 'POST',
    body: JSON.stringify({ prompt, aspect_ratio: '3:4', resolution: '1k' }),
  });
  const requestId = submitted.request_id || submitted.id;
  if (!requestId) throw new Error(`No request id in response: ${JSON.stringify(submitted).slice(0, 200)}`);

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    const result = await api(`predictions/${requestId}/result`, key).catch((error) => {
      if (/^5\d\d/.test(error.message)) return { status: 'processing' };
      throw error;
    });
    const data = result.data || result;
    const status = String(data.status || '').toLowerCase();
    if (['completed', 'succeeded', 'success'].includes(status)) {
      const url = data.outputs?.[0] || data.url || data.output?.url;
      if (!url) throw new Error('Completed without an output URL');
      return url;
    }
    if (['failed', 'error', 'cancelled'].includes(status)) {
      throw new Error(`Generation ${status}: ${data.error || 'no detail'}`);
    }
  }
  throw new Error(`Timed out after ${TIMEOUT_MS / 1000}s (request ${requestId})`);
}

async function main() {
  const key = process.env.MUAPI_API_KEY;
  if (!key) {
    console.error('MUAPI_API_KEY is not set. Add it to your environment and run again.');
    process.exit(1);
  }
  const { force, only } = parseArgs(process.argv.slice(2));
  const entries = Object.values(TEMPLATE_THUMBNAILS).filter((entry) => !only || entry.file === only);
  if (only && entries.length === 0) {
    const known = Object.values(TEMPLATE_THUMBNAILS).map((entry) => entry.file);
    console.error(`Unknown file "${only}". Known: ${known.join(', ')}`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const failed = [];
  let made = 0;
  for (const { file, prompt } of entries) {
    const dest = path.join(OUT_DIR, file);
    if (!force && existsSync(dest)) {
      console.log(`skip  ${file} (exists; use --force to regenerate)`);
      continue;
    }
    process.stdout.write(`make  ${file} … `);
    try {
      const url = await generate(`${prompt} ${STYLE}`, key);
      const image = Buffer.from(await (await fetch(url)).arrayBuffer());
      // Loaded here, not at the top, so importing TEMPLATE_THUMBNAILS does not need `sharp`.
      const { default: sharp } = await import('sharp');
      await sharp(image).resize(600, 800, { fit: 'cover' }).jpeg({ quality: 82 }).toFile(dest);
      made++;
      console.log('done');
    } catch (error) {
      failed.push(file);
      console.log(`FAILED: ${error.message}`);
    }
  }
  console.log(`\n${made} generated, ${failed.length} failed${failed.length ? `: ${failed.join(', ')}` : ''}.`);
  if (failed.length) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

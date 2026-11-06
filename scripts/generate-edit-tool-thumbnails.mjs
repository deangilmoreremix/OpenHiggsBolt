#!/usr/bin/env node
// Generates the AI thumbnails for the Edit Studio tool cards.
//
//   MUAPI_API_KEY=... npm run thumbnails:edit-tools            # missing files only
//   MUAPI_API_KEY=... npm run thumbnails:edit-tools -- --force # regenerate all
//   MUAPI_API_KEY=... npm run thumbnails:edit-tools -- --only face-swap
//
// Each image is a before/after demo of the tool, rendered with muapi's
// nano-banana-pro model, resized to 960x540 WebP and written to
// public/thumbnails/edit-tools/<slug>.webp (the path editTools.js points at).

import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/thumbnails/edit-tools');
const API = `${(process.env.MUAPI_BASE_URL || 'https://api.muapi.ai').replace(/\/$/, '')}/api/v1`;
const MODEL_ENDPOINT = 'nano-banana-pro';
const POLL_MS = 3000;
const TIMEOUT_MS = 5 * 60 * 1000;

const STYLE =
  'Split-screen before/after composition: left half shows the original, right half shows the result, ' +
  'separated by a thin glowing cyan (#22d3ee) vertical divider line. Dark studio background, cinematic lighting, ' +
  'rich contrast, photoreal, high detail, 16:9. No text, no letters, no words, no watermark, no logos, no UI.';

export const THUMBNAIL_PROMPTS = {
  'ai-image-generator':
    'Left: a dim floating holographic panel of abstract glowing prompt lines. Right: the vivid generated image it became, a breathtaking fantasy landscape with floating islands, waterfalls and a purple sunset.',
  'ai-video-generator':
    'Left: a dim floating holographic panel of abstract glowing prompt lines. Right: a strip of three cinematic film frames showing a red sports car racing along a coastal road at golden hour, with subtle motion blur.',
  'image-to-video':
    'Left: a still photograph of a woman standing on a windy cliff by the sea, frozen. Right: the same scene alive with motion, her hair and dress flowing, waves crashing, motion trails and a translucent play-button glow.',
  'image-upscale':
    'Left: a low-resolution, blurry, pixelated close-up portrait of an elderly man. Right: the same portrait in ultra-sharp 4K detail with crisp skin texture, eyelashes and fabric.',
  'background-remover':
    'Left: a white sneaker sitting on a cluttered bedroom floor among clothes. Right: the same sneaker perfectly cut out, floating on a grey-and-white transparency checkerboard pattern.',
  'watermark-remover':
    'Left: a scenic video frame of a mountain lake covered by a large semi-transparent diagonal watermark pattern and a corner logo blob. Right: the identical frame, perfectly clean.',
  'face-swap':
    'Left: a man in a tailored suit at a red-carpet event, face clearly visible. Right: the identical shot, same suit, pose and lighting, but with a different person\'s face, a young woman with short hair.',
  'product-shot':
    'Left: an amateur phone photo of a perfume bottle on a messy kitchen counter. Right: the same perfume bottle in a luxury studio scene on black marble with water splashes and soft gold rim light.',
  'lip-sync':
    'Left: a close-up portrait of a young man with mouth closed, beside a glowing cyan audio waveform. Right: the same portrait mid-speech, mouth open naturally as if singing, the waveform flowing into his lips.',
  'ai-image-editor':
    'Left: a red vintage convertible car parked on a city street at noon. Right: the same car repainted metallic blue, parked on the same street transformed into a dramatic orange sunset scene.',
  'ai-video-editor':
    'Left: a strip of film frames of a city street in plain daylight. Right: the same film frames restyled as a rainy neon cyberpunk night with reflections on wet asphalt.',
  'motion-controls':
    'Left: a glowing cyan skeleton pose-tracking rig of a dancer mid-jump, made of dots and lines. Right: a stylish 3D animated character performing the exact same dance pose on a stage.',
  'ai-audio-music':
    'Left: a dim floating holographic panel of abstract glowing prompt lines. Right: studio headphones and a vivid flowing multicolor sound waveform with musical energy bursting out of a mixing desk.',
  'anime-generator':
    'Left: a real photograph of a girl with a bicycle on a Tokyo street at dusk. Right: the same scene redrawn as a beautiful hand-painted anime illustration with soft pastel sky.',
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
    body: JSON.stringify({ prompt, aspect_ratio: '16:9', resolution: '1k' }),
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
  if (only && !THUMBNAIL_PROMPTS[only]) {
    console.error(`Unknown slug "${only}". Known: ${Object.keys(THUMBNAIL_PROMPTS).join(', ')}`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const slugs = only ? [only] : Object.keys(THUMBNAIL_PROMPTS);
  const failed = [];
  let made = 0;
  for (const slug of slugs) {
    const file = path.join(OUT_DIR, `${slug}.webp`);
    if (!force && existsSync(file)) {
      console.log(`skip  ${slug} (exists; use --force to regenerate)`);
      continue;
    }
    process.stdout.write(`make  ${slug} … `);
    try {
      const url = await generate(`${THUMBNAIL_PROMPTS[slug]} ${STYLE}`, key);
      const image = Buffer.from(await (await fetch(url)).arrayBuffer());
      // Loaded here, not at the top, so importing THUMBNAIL_PROMPTS (the unit test does) does not need `sharp`.
      // Running this script needs `sharp` installed (it is not a dependency of the app).
      const { default: sharp } = await import('sharp');
      await sharp(image).resize(960, 540, { fit: 'cover' }).webp({ quality: 80 }).toFile(file);
      made++;
      console.log('done');
    } catch (error) {
      failed.push(slug);
      console.log(`FAILED: ${error.message}`);
    }
  }
  console.log(`\n${made} generated, ${failed.length} failed${failed.length ? `: ${failed.join(', ')}` : ''}.`);
  if (failed.length) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

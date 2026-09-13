import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, statSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';

const BASE_URL = 'https://api.muapi.ai';
const DIR = join(process.cwd(), 'public/thumbnails/workflows');
const REWRITE_PATH = join(process.cwd(), 'app/api/workflow/[[...path]]/thumbnail-rewrite.js');
const MIN_IMAGE_BYTES = 5000;
const TMP_DIR = join(process.cwd(), 'tmp-workflow-thumbnails');

const apiKey = process.env.MUAPI_API_KEY;
if (!apiKey) {
  console.error('MUAPI_API_KEY is required');
  process.exit(1);
}

mkdirSync(DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

function toSlug(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function getExtension(url, contentType) {
  if (contentType?.includes('png') || url.endsWith('.png')) return '.png';
  return '.jpg';
}

function download(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`timeout fetching ${url}`));
    });
  });
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  });
  if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
  return res.json();
}

async function getAllWorkflows() {
  const [templates, user, published] = await Promise.all([
    fetchJson(`${BASE_URL}/workflow/get-template-workflows`),
    fetchJson(`${BASE_URL}/workflow/get-workflow-defs`),
    fetchJson(`${BASE_URL}/workflow/get-published-workflows`),
  ]);

  const byUrl = new Map();
  const addList = (list) => {
    if (!Array.isArray(list)) return;
    for (const wf of list) {
      const url = wf.thumbnail || wf.icon_url;
      if (!url) continue;
      const key = url;
      if (!byUrl.has(key)) {
        byUrl.set(key, wf);
      }
    }
  };
  addList(templates);
  addList(user);
  addList(published);
  return Array.from(byUrl.values());
}

function getStem(url) {
  const parts = url.split('/');
  const last = parts[parts.length - 1] || 'workflow';
  const withoutExt = last.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  return toSlug(withoutExt) || 'workflow';
}

async function main() {
  console.log('Fetching workflows...');
  const workflows = await getAllWorkflows();
  console.log(`Found ${workflows.length} unique workflows with thumbnails`);

  const map = {};
  const downloaded = [];
  const skipped = [];

  for (const wf of workflows) {
    const url = wf.thumbnail || wf.icon_url;
    if (!url) continue;

    const ext = getExtension(url);
    const stem = getStem(url);
    const fileName = `${stem}${ext}`;
    const tmpPath = join(TMP_DIR, fileName);

    try {
      console.log(`DOWNLOAD ${url} -> ${fileName}`);
      const buffer = await download(url);
      if (buffer.length < MIN_IMAGE_BYTES) {
        skipped.push({ url, fileName, reason: `too small (${buffer.length} bytes)` });
        console.warn(`  SKIP ${fileName}: ${skipped[skipped.length - 1].reason}`);
        continue;
      }
      await sharp(buffer).resize(600, 800, { fit: 'cover' }).toFile(tmpPath);
      downloaded.push({ url, fileName, path: tmpPath, bytes: buffer.length });
      map[url] = `/thumbnails/workflows/${fileName}`;
    } catch (err) {
      skipped.push({ url, fileName, reason: err.message });
      console.warn(`  FAIL ${fileName}: ${err.message}`);
    }
  }

  // Clean target directory and move validated downloads into place
  console.log('\nRefreshing local thumbnails...');
  const existing = new Set(readdirSync(DIR));
  for (const f of existing) {
    try { unlinkSync(join(DIR, f)); } catch {}
  }
  for (const item of downloaded) {
    const dest = join(DIR, item.fileName);
    writeFileSync(dest, readFileSync(item.path));
    console.log(`  WRITE ${item.fileName} (${item.bytes} bytes)`);
  }

  await writeRewriteFile(map);

  console.log(`\nDone.`);
  console.log(`  downloaded: ${downloaded.length}`);
  console.log(`  skipped:    ${skipped.length}`);
  console.log(`  map_entries: ${Object.keys(map).length}`);
  if (skipped.length) {
    console.log('\nSkipped URLs:');
    skipped.forEach(s => console.log(`  ${s.url} -> ${s.reason}`));
  }
}

async function writeRewriteFile(map) {
  const lines = [];
  lines.push(`// AUTO-GENERATED by scripts/refresh-workflow-thumbnails.mjs.`);
  lines.push(`// Maps upstream MuAPI thumbnail URLs -> local files in /public/thumbnails/workflows.`);
  lines.push(`// Plain ESM module (no JSON import assertion, no fs) so it bundles cleanly in`);
  lines.push(`// the browser via Turbopack/Webpack/Vite and in Node.`);
  lines.push('');
  lines.push(`const thumbnailLocalMap = {`);

  for (const [url, localPath] of Object.entries(map)) {
    lines.push(`  "${url}": "${localPath}",`);
  }

  lines.push(`};`);
  lines.push('');
  lines.push(`export function rewriteThumbnail(url) {`);
  lines.push(`  if (!url || typeof url !== 'string') return url;`);
  lines.push(`  if (url.startsWith('/')) return url;`);
  lines.push(`  if (thumbnailLocalMap[url]) return thumbnailLocalMap[url];`);
  lines.push(`  return \`/api/thumbnail?url=\${encodeURIComponent(url)}\`;`);
  lines.push(`}`);
  lines.push('');
  lines.push(`export function rewriteThumbnails(list) {`);
  lines.push(`  if (!Array.isArray(list)) return list;`);
  lines.push(`  return list.map((item) => {`);
  lines.push(`    if (!item || typeof item !== 'object') return item;`);
  lines.push(`    let next = item;`);
  lines.push(`    if (item.thumbnail) {`);
  lines.push(`      next = { ...next, thumbnail: rewriteThumbnail(item.thumbnail) };`);
  lines.push(`    }`);
  lines.push(`    if (item.icon_url) {`);
  lines.push(`      next = { ...next, icon_url: rewriteThumbnail(item.icon_url) };`);
  lines.push(`    }`);
  lines.push(`    return next;`);
  lines.push(`  });`);
  lines.push(`}`);
  lines.push('');

  writeFileSync(REWRITE_PATH, lines.join('\n') + '\n', 'utf-8');
  console.log(`Wrote ${REWRITE_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

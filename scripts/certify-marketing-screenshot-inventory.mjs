import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventoryDir = path.join(root, 'visual-assets', 'marketing-current');
const manifestPath = path.join(inventoryDir, 'manifest.json');

const studioSlugs = [
  'image',
  'video',
  'audio',
  'clipping',
  'vibe-motion',
  'lipsync',
  'cinema',
  'storyboard',
  'marketing',
  'recast',
  'layers',
  'workflows',
  'agents',
  'design-agent',
  'vfx-studio',
  'thumbnail-studio',
  'ai-influencer',
  'social-publishing',
  'go-ai-viral',
  'photo-studio',
  'brand-studio',
];

const personalizationFiles = [
  '01-modal-overview.png',
  '02-client-profile.png',
  '03-personalized-prompt.png',
  '04-asset-upload.png',
  '05-find-business-assets.png',
  '06-edit-image-entry.png',
  '07-what-smartvideo-will-use.png',
];

async function assertNonEmpty(filePath) {
  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat?.isFile() || stat.size <= 0) {
    throw new Error(`Missing or empty screenshot: ${path.relative(root, filePath)}`);
  }
}

async function collectPngs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectPngs(full));
    else if (entry.isFile() && entry.name.endsWith('.png')) files.push(full);
  }
  return files;
}

for (const slug of studioSlugs) {
  await assertNonEmpty(path.join(inventoryDir, slug, 'full-page.png'));
  await assertNonEmpty(path.join(inventoryDir, slug, 'viewport-1920x1080.png'));
}

for (const file of personalizationFiles) {
  await assertNonEmpty(path.join(inventoryDir, 'personalization', file));
}

const pngs = await collectPngs(inventoryDir);
const manifest = {
  inventory: 'SmartVideo GO current marketing screenshots',
  status: 'PASS',
  totalProductSurfaces: 22,
  studioSurfacesRequired: 21,
  studioSurfacesCaptured: 21,
  personalizationStatesRequired: 7,
  personalizationStatesCaptured: 7,
  totalScreenshots: pngs.length,
  requiredPersonalizationScreenshots: personalizationFiles.map((name) => `personalization/${name}`),
  certification: {
    studioCapture: 'PASS',
    personalizationCapture: 'PASS',
    manifestPathsVerified: true,
    readyForMailerLiteEmailAuthoring: true,
  },
};

await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`STUDIO_SURFACES=21/21`);
console.log(`PERSONALIZATION_SCREENSHOTS=7/7`);
console.log(`TOTAL_SCREENSHOTS=${pngs.length}`);
console.log('SCREENSHOT_INVENTORY=PASS');
console.log('READY_FOR_MAILERLITE_EMAIL_AUTHORING=YES');

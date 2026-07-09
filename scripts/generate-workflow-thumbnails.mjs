import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const workflows = JSON.parse(readFileSync('/tmp/wf.json', 'utf8'));
const mapPath = 'scripts/workflow-thumbnails-map.json';
const map = JSON.parse(readFileSync(mapPath, 'utf8'));
const dir = 'public/thumbnails/workflows';
mkdirSync(dir, { recursive: true });

const W = 600, H = 800;
const palettes = [
  ['#0ea5e9', '#7c3aed'],
  ['#22d3ee', '#3b82f6'],
  ['#a855f7', '#ec4899'],
  ['#10b981', '#06b6d4'],
  ['#f59e0b', '#ef4444'],
  ['#6366f1', '#8b5cf6'],
  ['#14b8a6', '#0ea5e9'],
  ['#f43f5e', '#8b5cf6'],
];

function escapeXml(s = '') {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

function wrap(text, max) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

let made = 0;
for (let i = 0; i < workflows.length; i++) {
  const wf = workflows[i];
  const url = wf.thumbnail;
  if (!url) continue;
  const localRel = map[url];
  const fileName = localRel.replace(/^\/thumbnails\/workflows\//, '');
  const filePath = `${dir}/${fileName}`;

  // Skip if we already have a real downloaded image.
  try { if (readFileSync(filePath).length > 5000) { console.log(`KEEP real ${fileName}`); continue; } } catch {}

  const [c1, c2] = palettes[i % palettes.length];
  const nameLines = wrap(wf.name || 'Workflow', 22);
  const category = (wf.category || 'General').toUpperCase();
  const nameSvg = nameLines.map((l, k) => `
    <text x="40" y="${H - 150 + k * 42}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="#ffffff">${escapeXml(l)}</text>`).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/>
        <stop offset="1" stop-color="${c2}"/>
      </linearGradient>
      <radialGradient id="r" cx="0.8" cy="0.2" r="0.9">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect width="${W}" height="${H}" fill="url(#r)"/>
    <g opacity="0.25" stroke="#ffffff" stroke-width="2" fill="none">
      <rect x="40" y="44" width="60" height="60" rx="10"/>
      <rect x="120" y="44" width="60" height="60" rx="10"/>
      <rect x="40" y="124" width="60" height="60" rx="10"/>
      <rect x="120" y="124" width="60" height="60" rx="10"/>
      <path d="M75 74v28M155 74v28M75 158v28M155 158v28M100 89h28M100 173h28"/>
    </g>
    <text x="40" y="${H - 190}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3" fill="#ffffff" opacity="0.85">${escapeXml(category)}</text>
    ${nameSvg}
  </svg>`;

  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(filePath);
  made++;
  console.log(`MADE ${fileName}`);
}

console.log(`\nGenerated ${made} placeholder thumbnails. Total local files: ${Object.keys(map).length}`);

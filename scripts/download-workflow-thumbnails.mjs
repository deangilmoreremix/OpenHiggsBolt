import { writeFileSync, mkdirSync, readFileSync, existsSync, statSync } from 'fs';

const raw = readFileSync('/tmp/wf.json', 'utf8');
const workflows = JSON.parse(raw);

function localName(wf) {
  const slug = (wf.slug || wf.name || wf.id)
    .toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const ext = (wf.thumbnail || '').split('?')[0].split('.').pop().replace(/[^a-z]/gi, '') || 'jpg';
  return `${slug}.${ext}`;
}

mkdirSync('public/thumbnails/workflows', { recursive: true });
const map = {};
const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'Referer': 'https://muapi.ai/',
};

let ok = 0;
for (const wf of workflows) {
  const url = wf.thumbnail;
  if (!url) continue;
  const name = localName(wf);
  const target = `public/thumbnails/workflows/${name}`;
  map[url] = `/thumbnails/workflows/${name}`;
  if (existsSync(target) && statSync(target).size > 1000) { console.log(`SKIP ${name}`); ok++; continue; }
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) { console.error(`FAIL ${res.status} ${name}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(target, buf);
    console.log(`OK  ${name} (${buf.length})`);
    ok++;
  } catch (e) {
    console.error(`ERR ${name}: ${e.message}`);
  }
}
writeFileSync('scripts/workflow-thumbnails-map.json', JSON.stringify(map, null, 2));
console.log(`\n${ok}/${workflows.length} downloaded.`);

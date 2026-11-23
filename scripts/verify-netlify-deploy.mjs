#!/usr/bin/env node
/**
 * Post-deploy self-check for a Netlify draft URL.
 *
 * Verifies that the DEPLOYED artifact is internally consistent: every asset
 * the server-rendered HTML actually requests must exist in the same deploy.
 * This is the check that catches a "mixed build" deploy, where the published
 * static tree and the packaged SSR function come from different builds and
 * the app never hydrates (blank spinner, every chunk 404).
 *
 * Usage: node scripts/verify-netlify-deploy.mjs <deploy-url> [origin]
 */
import { setTimeout as sleep } from 'node:timers/promises';

const base = process.argv[2];
const origin = process.argv[3] || base;
if (!base) {
  console.error('usage: node scripts/verify-netlify-deploy.mjs <deploy-url> [origin]');
  process.exit(2);
}

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

const head = async (url) => {
  const r = await fetch(url, { method: 'HEAD', redirect: 'manual' });
  return { status: r.status, headers: r.headers };
};

// 1. root must serve 200 and the real app shell
const rootRes = await fetch(`${base}/`, { redirect: 'manual' });
const rootHtml = await rootRes.text();
check('root returns 200', rootRes.status === 200, `status=${rootRes.status}`);
check(
  'root renders the app shell',
  /SmartVideo GO/i.test(rootHtml) && !/^\s*◌\s*$/.test(rootHtml),
  `title=${(rootHtml.match(/<title>([^<]*)<\/title>/) || [])[1] || 'none'}`
);

// 2. CSP must allow the Remotion web renderer
const csp = rootRes.headers.get('content-security-policy') || '';
check(
  'CSP connect-src allows https://www.remotion.pro',
  /connect-src[^;]*https:\/\/www\.remotion\.pro/.test(csp),
  csp ? 'present' : 'no CSP header'
);

// 3. the studio route must be reachable and protected (307 -> /sign-in) or served
const studioRes = await fetch(`${base}/studio/motion-studio`, { redirect: 'manual' });
check(
  'studio route responds',
  [200, 307, 302].includes(studioRes.status),
  `status=${studioRes.status} location=${studioRes.headers.get('location') || '-'}`
);

// 4. THE decisive check: every asset the SSR HTML references must exist
const assets = new Set();
for (const m of rootHtml.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) assets.add(m[1]);
check('SSR HTML references build assets', assets.size > 0, `${assets.size} referenced`);

let missing = [];
for (const a of assets) {
  const r = await head(`${base}${a}`);
  if (r.status !== 200) missing.push(`${a} (${r.status})`);
}
check(
  'every asset referenced by the SSR HTML is served',
  missing.length === 0,
  missing.length === 0 ? `${assets.size}/${assets.size} OK` : `${missing.length} MISSING: ${missing.slice(0, 5).join(', ')}`
);

// 5. the Motion Studio textures must ship
const tex = await head(`${base}/motion-studio/textures/live/card1.png`);
check('motion-studio texture ships', tex.status === 200, `status=${tex.status}`);

// 6. the deployed bundle must actually contain the Motion Studio app
let studioRefs = 0;
for (const a of assets) {
  if (!a.endsWith('.js')) continue;
  const body = await (await fetch(`${base}${a}`)).text();
  if (body.includes('motion-studio') || body.includes('Motion Studio')) studioRefs++;
}
check(
  'deployed bundle contains the Motion Studio app',
  studioRefs > 0,
  `${studioRefs} chunk(s) reference motion-studio`
);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('FAILED: ' + failed.map((f) => f.name).join('; '));
  process.exit(1);
}
console.log('DEPLOY SELF-CHECK OK — deployed artifact is internally consistent.');

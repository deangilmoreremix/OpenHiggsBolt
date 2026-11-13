#!/usr/bin/env node
/**
 * Builds src/data/resellerAppFacts.json from the REAL source code of the 38
 * reseller apps. Nothing is invented: every value is extracted by reading
 * files, and each fact keeps the file it came from.
 *
 *   node scripts/build-reseller-app-facts.mjs <workdir>
 *
 * <workdir> must contain:
 *   dest/<appId>/   shallow clone of the deangilmoreremix destination repo
 *   up/<appId>/     shallow clone of the upstream SamurAIGPT repo (only needed
 *                   where the destination repo is attribution-only)
 *
 * Source selection: destination repo when it holds real source (>= 10 files
 * and a package.json), otherwise the upstream clone (factSource = "upstream").
 * Secrets are never read: only variable NAMES are recorded (from process.env
 * references and .env.example keys), never values.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = process.argv[2];
if (!work) {
  console.error('usage: build-reseller-app-facts.mjs <workdir>');
  process.exit(1);
}

const bundles = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/resellerAppBundles.json'), 'utf8')).apps;
const destinations = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/resellerDestinations.json'), 'utf8')).destinations;

const SECRET = /(SECRET|TOKEN|SERVICE_ROLE|API_KEY|PASSWORD|DATABASE_URL|DIRECT_URL)/;
const ROLE_RULES = [
  [/^(DATABASE_URL|DIRECT_URL)$/, 'database'],
  [/SUPABASE/, 'database'],
  [/^NEXTAUTH_/, 'auth'],
  [/^GOOGLE_/, 'auth'],
  [/STRIPE/, 'stripe'],
  [/^WEBHOOK_URL$/, 'webhook'],
  [/(MUAPI|MU_API|_API_KEY)/, 'ai'],
  [/^(GITHUB_TOKEN|VERCEL_TOKEN|VERCEL)$/, 'cloud-export'],
  [/^NEXT_PUBLIC_THEME$/, 'branding'],
];
const roleOf = (name) => (ROLE_RULES.find(([re]) => re.test(name)) || [null, 'other'])[1];

function gitFiles(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    return [];
  }
}
const read = (dir, f) => {
  try {
    return fs.readFileSync(path.join(dir, f), 'utf8');
  } catch {
    return '';
  }
};

function pickSource(id) {
  const d = path.join(work, 'dest', id);
  const df = gitFiles(d);
  if (df.length >= 10 && df.includes('package.json')) return { dir: d, files: df, factSource: 'destination' };
  const u = path.join(work, 'up', id);
  const uf = gitFiles(u);
  if (uf.length >= 10 && uf.includes('package.json')) return { dir: u, files: uf, factSource: 'upstream' };
  return { dir: null, files: [], factSource: 'none' };
}

function exampleKeys(text) {
  return [...text.matchAll(/^\s*#?\s*([A-Z][A-Z0-9_]+)\s*=/gm)].map((m) => m[1]);
}

function parsePlans(config) {
  const i = config.indexOf('plans:');
  if (i < 0) return { plans: [], raw: null };
  const block = config.slice(i, i + 900).split('\n').slice(0, 12).join('\n');
  const plans = [];
  for (const m of block.matchAll(/(\w+):\s*\{([^{}]*)\}/g)) {
    const body = m[2];
    const num = (k) => {
      const r = body.match(new RegExp(`${k}:\\s*(\\d+)`));
      return r ? Number(r[1]) : null;
    };
    const name = body.match(/name:\s*["'`]([^"'`]+)["'`]/);
    const price = num('price');
    if (price != null) plans.push({ key: m[1], name: name ? name[1] : null, credits: num('credits') ?? num('amount'), amountCents: price });
  }
  return { plans, raw: block.replace(/process\.env\.[A-Z_]+/g, 'process.env.…') };
}

const apps = {};
const issues = [];
for (const b of bundles) {
  const id = b.id;
  const dest = destinations[id] || {};
  const src = pickSource(id);
  const entry = {
    id,
    name: b.name,
    category: b.category,
    destinationRepo: dest.repoUrl || null,
    destinationStatus: dest.repoStatus || 'unconfigured',
    appKind: 'nextjs-saas',
    factSource: src.factSource,
    sourceRepoForFacts: null,
    licensePresent: false,
    stack: {},
    envVars: [],
    database: { prisma: false, host: null },
    payment: { model: 'not-found-in-source', plans: [], checkoutRoutes: [], webhookRoutes: [], eventsHandled: [], configFile: null },
    readme: { oneClickDeployUrl: null, stripeWebhookPath: null, googleCallbackPath: null, dbPushMentioned: false },
    buildCommand: null,
    notes: [],
  };
  if (!src.dir) {
    const d = path.join(work, 'dest', id);
    const df = gitFiles(d);
    if (df.includes('requirements.txt') && df.includes('main.py')) {
      entry.appKind = 'python-cli';
      entry.sourceRepoForFacts = destinations[id]?.repoUrl || null;
      entry.licensePresent = df.some((f) => /^LICENSE(\.md)?$/i.test(f));
      entry.notes.push('Python command-line tool (requirements.txt + main.py). No Next.js app, no Stripe Checkout, no webhook route and no one-click Vercel deployment exist in the source.');
      apps[id] = entry;
      issues.push(`${id}: python-cli — standard Stripe/Vercel path does not apply`);
      continue;
    }
    entry.notes.push('No application source found in the destination repo or the upstream repo clone.');
    apps[id] = entry;
    issues.push(`${id}: no source`);
    continue;
  }
  const { dir, files } = src;
  entry.licensePresent = files.some((f) => /^LICENSE(\.md)?$/i.test(f));
  const origin = execFileSync('git', ['-C', dir, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim().replace(/\.git$/, '');
  entry.sourceRepoForFacts = origin;

  const pkg = JSON.parse(read(dir, 'package.json') || '{}');
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  entry.stack = {
    next: deps.next || null,
    nextAuth: !!deps['next-auth'],
    prisma: !!deps['@prisma/client'],
    stripe: !!deps.stripe,
    supabaseJs: !!deps['@supabase/supabase-js'],
  };
  entry.buildCommand = pkg.scripts?.build || null;

  // env vars: referenced in code, plus keys in .env.example
  const used = new Set();
  for (const f of files.filter((x) => /\.(js|jsx|ts|tsx|mjs)$/.test(x))) {
    for (const m of read(dir, f).matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) used.add(m[1]);
  }
  const example = new Set(exampleKeys(read(dir, '.env.example')));
  const skip = new Set(['NODE_ENV', 'VERCEL', 'NEXT_RUNTIME', 'CI']);
  const names = [...new Set([...used, ...example])].filter((n) => !skip.has(n)).sort();
  entry.envVars = names.map((name) => ({
    name,
    role: roleOf(name),
    secret: SECRET.test(name) && !name.startsWith('NEXT_PUBLIC_'),
    clientVisible: name.startsWith('NEXT_PUBLIC_'),
    inEnvExample: example.has(name),
    referencedInCode: used.has(name),
  }));
  entry.database = {
    prisma: files.includes('prisma/schema.prisma'),
    prismaMigrationsPresent: files.some((f) => f.startsWith('prisma/migrations/')),
    supabaseMigrationsPresent: files.some((f) => f.startsWith('supabase/migrations/')),
    host: names.some((n) => /SUPABASE/.test(n)) ? 'supabase-client-keys-used' : 'any-postgres-via-DATABASE_URL',
  };

  // payment
  const cfgFile = ['src/lib/config.js', 'src/lib/config.ts'].find((f) => files.includes(f));
  if (cfgFile) {
    const { plans, raw } = parsePlans(read(dir, cfgFile));
    entry.payment.plans = plans;
    entry.payment.configFile = cfgFile;
    if (!plans.length && raw) entry.payment.plansRaw = raw;
  }
  const payFiles = files.filter((f) => /\.(js|jsx|ts|tsx)$/.test(f));
  const modes = new Set();
  const events = new Set();
  for (const f of payFiles) {
    const t = read(dir, f);
    for (const m of t.matchAll(/mode:\s*["'`](payment|subscription|setup)["'`]/g)) modes.add(m[1]);
    for (const m of t.matchAll(/["'`]((?:checkout\.session|invoice|customer\.subscription|payment_intent)\.[a-z_.]+)["'`]/g)) events.add(m[1]);
  }
  entry.payment.eventsHandled = [...events].sort();
  entry.payment.model = modes.size === 0 ? 'not-found-in-source' : modes.has('subscription') ? (modes.has('payment') ? 'credit-packs-and-subscription' : 'subscription') : 'credit-packs-one-time';
  const routeOf = (f) => '/' + f.replace(/^src\//, '').replace(/^app\//, '').replace(/\/route\.(js|ts)$/, '').replace(/\[\.\.\.(\w+)\]/g, ':$1');
  entry.payment.checkoutRoutes = files.filter((f) => /api\/.*checkout.*\/route\.(js|ts)$/.test(f)).map(routeOf);
  const whFiles = files
    .filter((f) => /api\/.*(webhook).*\/route\.(js|ts)$/.test(f))
    .filter((f) => /stripe/.test(f) || /constructEvent|stripe-signature/.test(read(dir, f)));
  entry.payment.webhookRoutes = whFiles.map(routeOf);
  const verifies = (f) => /stripe-signature|constructEvent|handleWebhook/.test(read(dir, f));
  entry.payment.webhookRoutesWithSignatureCheck = whFiles.filter(verifies).map(routeOf);

  // README facts (what the app's own docs tell the operator)
  const readme = read(dir, 'README.md');
  const deploy = readme.match(/https:\/\/vercel\.com\/new\/[^\s)"']+/);
  entry.readme.oneClickDeployUrl = deploy ? deploy[0] : null;
  const wh = readme.match(/\/api\/[a-z/-]*stripe[a-z/-]*webhook[a-z/-]*|\/api\/webhooks?\/stripe/i);
  entry.readme.stripeWebhookPath = wh ? wh[0] : null;
  const cb = readme.match(/\/api\/auth\/callback\/google/);
  entry.readme.googleCallbackPath = cb ? cb[0] : null;
  entry.readme.dbPushMentioned = /prisma db push/.test(readme);

  entry.payment.recommendedWebhookPath =
    (entry.readme.stripeWebhookPath && entry.payment.webhookRoutesWithSignatureCheck.includes(entry.readme.stripeWebhookPath)
      ? entry.readme.stripeWebhookPath
      : null) ||
    entry.payment.webhookRoutesWithSignatureCheck.find((r) => r === '/api/stripe/webhook') ||
    entry.payment.webhookRoutesWithSignatureCheck[0] ||
    null;
  if (!entry.payment.webhookRoutes.length) entry.notes.push('No Stripe webhook route found in source.');
  if (entry.payment.model === 'not-found-in-source') entry.notes.push('No Stripe Checkout session creation found in source.');
  if (entry.payment.webhookRoutes.length > 1) entry.notes.push('More than one webhook-style route exists in the source; register only the recommended path.');
  if (!entry.envVars.some((e) => e.role === 'ai')) entry.notes.push('No MuAPI/AI key variable found in source.');
  if (src.factSource === 'upstream') entry.notes.push('Destination repo is attribution-only; facts were read from the upstream source and must be re-checked once source is published.');
  if (!entry.licensePresent) entry.notes.push('No LICENSE file in the source repo used for these facts — redistribution rights pending owner confirmation.');
  apps[id] = entry;
}

const out = {
  meta: {
    description:
      'Facts extracted from the real source of each reseller app (variable NAMES only, never values). Used by the Reseller Academy app workshops. Do not hand-edit; regenerate with scripts/build-reseller-app-facts.mjs.',
    generatedBy: 'scripts/build-reseller-app-facts.mjs',
    generatedAt: new Date().toISOString().slice(0, 10),
    appCount: Object.keys(apps).length,
    issues,
  },
  apps,
};
fs.writeFileSync(path.join(ROOT, 'src/data/resellerAppFacts.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${out.meta.appCount} apps; issues: ${issues.length ? issues.join(', ') : 'none'}`);

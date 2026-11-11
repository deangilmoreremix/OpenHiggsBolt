/**
 * Builds src/data/helpIndex.json — the searchable knowledge for the
 * "Ask SmartVideo" help agent. Run: npx tsx scripts/build-help-index.ts
 *
 * Sources (all real content already in the repo; nothing is invented here):
 *   - src/data/studioKnowledgeBase.json       -> kind "studio"   (url = real studio route, guideUrl = Academy "Create with" guide)
 *   - src/content/academy/** /*.md            -> kind "academy"  (url = /academy?track=T&lesson=SLUG deep link)
 *   - src/content/resellerAcademy             -> kind "reseller" (url = /academy/reseller/launch?lesson=ID)
 *   - src/data/resellerAppFacts.json          -> kind "app"      (url = /academy/reseller/apps/ID)
 *   - studio tab directory                    -> kind "studio"   (so every studio can be pointed to)
 *
 * Secrets are never indexed: app facts hold variable NAMES only, and any chunk
 * text matching a credential pattern fails the build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODULES } from '../src/content/resellerAcademy';
import { ACADEMY_STUDIO_GUIDES, academyStudioUrl, academyTrackUrl, getStudioGuide } from '../src/data/academyStudioGuides';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

export interface HelpChunk {
  id: string;
  kind: 'studio' | 'academy' | 'reseller' | 'app';
  studioId: string | null;
  title: string;
  url: string;
  /** For studio chunks: the Academy "Create with <studio>" guide. */
  guideUrl?: string;
  text: string;
}

const MAX_CHARS = 1400;
const chunks: HelpChunk[] = [];
const push = (c: Omit<HelpChunk, 'text'> & { text: string }) => {
  const text = c.text.replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (text.length < 40) return;
  chunks.push({ ...c, text });
};

/** Render any JSON value as readable text lines. */
function render(v: unknown, label?: string): string {
  if (v == null) return '';
  if (typeof v === 'string') return label ? `${label}: ${v}` : v;
  if (typeof v === 'number' || typeof v === 'boolean') return label ? `${label}: ${v}` : String(v);
  if (Array.isArray(v)) {
    const items = v.map((x) => render(x)).filter(Boolean);
    return (label ? `${label}:\n` : '') + items.map((i) => `- ${i.replace(/\n/g, '; ')}`).join('\n');
  }
  if (typeof v === 'object') {
    const parts = Object.entries(v as Record<string, unknown>).map(([k, x]) => render(x, k)).filter(Boolean);
    return (label ? `${label}: ` : '') + parts.join(' | ');
  }
  return '';
}

/** Split long text on paragraph boundaries into <= MAX_CHARS pieces. */
function split(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];
  const out: string[] = [];
  let cur = '';
  for (const para of text.split(/\n{1,2}/)) {
    if ((cur + '\n' + para).length > MAX_CHARS && cur) { out.push(cur); cur = para; } else cur = cur ? `${cur}\n${para}` : para;
  }
  if (cur) out.push(cur);
  return out;
}

/* ------------------------------ studios ------------------------------ */
const STUDIO_GROUPS: [string, string[]][] = [
  ['Overview', ['description', 'shortDescription', 'fullDescription', 'bestFor', 'whenToUse', 'whenToUseAnother', 'businessValue']],
  ['How to use', ['howToUse', 'howToSteps', 'gettingStarted', 'tips', 'bestPractices']],
  ['Features', ['keyFeatures', 'featureExplanations', 'advancedFeatures', 'advancedFeatureExplanations', 'generationModes', 'modeExplanations', 'modelCapabilities', 'modelExplanations']],
  ['Inputs and outputs', ['inputs', 'requiredInputs', 'optionalInputs', 'inputDetails', 'outputs', 'outputDetails']],
  ['Problems and limits', ['troubleshooting', 'troubleshootingSteps', 'commonProblems', 'limitations', 'limitationDetails', 'faqs']],
  ['Workflows and use cases', ['exampleWorkflows', 'useCases', 'targetCustomers', 'contentTypes', 'relatedStudioGuidance', 'academyGuidance']],
];
const kb = JSON.parse(rd('src/data/studioKnowledgeBase.json')).studios as Record<string, unknown>[];
const GUIDES = ACADEMY_STUDIO_GUIDES;
for (const s of kb) {
  const g = getStudioGuide(String(s.id));
  if (!g) continue; // not a studio the Academy teaches (e.g. an old KB id)
  s.route = g.route; // the manifest holds the real, current route
  s.name = g.label;
  for (const [group, fields] of STUDIO_GROUPS) {
    const body = fields.map((f) => render(s[f], f)).filter(Boolean).join('\n');
    split(body).forEach((t, i, arr) =>
      push({
        id: `studio:${s.id}:${group.toLowerCase().replace(/\W+/g, '-')}${arr.length > 1 ? `-${i + 1}` : ''}`,
        kind: 'studio', studioId: String(s.id),
        title: `${s.name} — ${group}`, url: String(s.route), guideUrl: academyStudioUrl(String(s.id)),
        text: `${s.name} (${s.route}). ${group}.\n${t}`,
      }),
    );
  }
  if (s.glossary) push({ id: `studio:${s.id}:glossary`, kind: 'studio', studioId: String(s.id), title: `${s.name} — Glossary`, url: String(s.route), guideUrl: academyStudioUrl(String(s.id)), text: render(s.glossary, 'Glossary') });
}

// Directory of every studio, plus per-studio "Academy guide" chunks, from the manifest.
const kbIds = new Set(kb.map((x) => String(x.id)));
push({
  id: 'studio:directory', kind: 'studio', studioId: null, title: 'All studios in SmartVideo GO AI', url: '/studio', guideUrl: '/academy?view=studio-reference',
  text: 'Studios available in SmartVideo GO AI (open the studio, or open its step-by-step Academy guide):\n' + GUIDES.map((g) => `- ${g.label}: ${g.route} (Academy guide: ${academyStudioUrl(g.id)})`).join('\n'),
});

/** Track titles come from each track's first lesson heading ("# Track 7 — Title"). */
const academyRootForTitles = path.join(ROOT, 'src/content/academy');
const trackTitle = (slug: string): string => {
  try {
    const dir = path.join(academyRootForTitles, slug, 'lessons');
    const first = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()[0];
    const h1 = fs.readFileSync(path.join(dir, first), 'utf8').match(/^#\s+(.+)$/m)?.[1] ?? slug;
    return h1.replace(/^Track\s+\d+\s*[:—-]\s*/i, '').trim();
  } catch { return slug; }
};

for (const g of GUIDES) {
  const courses = g.tracks.map((t) => `${trackTitle(t)} (${academyTrackUrl(t)})`).join('; ');
  push({
    id: `studio:${g.id}:academy-guide`, kind: 'studio', studioId: g.id, title: `${g.label} — Academy guide`, url: g.route, guideUrl: academyStudioUrl(g.id),
    text: `${g.label}: ${g.tagline} Open it at ${g.route}. Step-by-step "Create with ${g.label}" guide in the Academy: ${academyStudioUrl(g.id)}.${courses ? ` Related Academy courses: ${courses}.` : ''}`,
  });
  if (!kbIds.has(g.id)) {
    push({
      id: `studio:${g.id}:directory`, kind: 'studio', studioId: g.id, title: g.label, url: g.route, guideUrl: academyStudioUrl(g.id),
      text: `${g.label} is a studio in SmartVideo GO AI, opened at ${g.route}. Detailed how-to documentation for this studio has not been written yet.`,
    });
  }
}

/* ------------------------------ academy ------------------------------ */
const academyRoot = path.join(ROOT, 'src/content/academy');
for (const track of fs.readdirSync(academyRoot).sort()) {
  for (const kind of ['lessons', 'templates']) {
    const dir = path.join(academyRoot, track, kind);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      const md = fs.readFileSync(path.join(dir, file), 'utf8');
      const h1 = md.match(/^#\s+(.+)$/m)?.[1] ?? file.replace(/\.md$/, '');
      const sections = md.split(/^##\s+/m);
      sections.forEach((sec, si) => {
        const heading = si === 0 ? null : sec.split('\n')[0].trim();
        const body = (si === 0 ? sec : sec.split('\n').slice(1).join('\n'))
          .replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[>*_`]/g, '').replace(/\n{3,}/g, '\n\n');
        split(body).forEach((t, i) =>
          push({
            id: `academy:${track}:${kind}:${file.replace(/\.md$/, '')}:${si}-${i}`,
            kind: 'academy', studioId: null,
            title: `${h1}${heading ? ` — ${heading}` : ''}`,
            url: kind === 'lessons' ? academyTrackUrl(track, file.replace(/\.md$/, '')) : academyTrackUrl(track),
            text: `Academy ${kind === 'templates' ? 'template' : 'lesson'}: ${h1}${heading ? ` / ${heading}` : ''}.\n${t}`,
          }),
        );
      });
    }
  }
}

/* ------------------------- reseller walkthrough ------------------------ */
for (const m of MODULES) {
  for (const l of m.lessons) {
    const text = [
      `Reseller Setup Walkthrough, Module ${m.id} (${m.title}), lesson ${l.id}: ${l.title}. Outcome: ${l.outcome}`,
      ...l.learn,
      'Steps: ' + l.follow.map((f, i) => `${i + 1}. ${f.text}${f.copy ? ` [${f.copy.label}: ${f.copy.value}]` : ''}`).join(' '),
      'Check it worked: ' + l.verify.join(' '),
      l.mistakes.length ? 'Common mistakes: ' + l.mistakes.join(' ') : '',
      l.troubleshooting.length ? 'Troubleshooting: ' + l.troubleshooting.map((t) => `${t.problem} -> ${t.fix}`).join(' ') : '',
    ].filter(Boolean).join('\n');
    split(text).forEach((t, i, arr) =>
      push({
        id: `reseller:${l.id}${arr.length > 1 ? `-${i + 1}` : ''}`, kind: 'reseller', studioId: 'apps',
        title: `Reseller Setup Walkthrough ${l.id} — ${l.title}`, url: `/academy/reseller/launch?lesson=${l.id}`, text: t,
      }),
    );
  }
}

/* ------------------------------ app facts ------------------------------ */
const facts = JSON.parse(rd('src/data/resellerAppFacts.json')).apps as Record<string, any>;
for (const [id, a] of Object.entries(facts)) {
  const p = a.payment ?? {};
  const env = (a.envVars ?? []).map((e: any) => e.name).join(', ');
  const plans = (p.plans ?? []).map((x: any) => `${x.name ?? x.key}: ${x.credits ?? '?'} credits for $${(x.amountCents / 100).toFixed(2)}`).join('; ');
  push({
    id: `app:${id}`, kind: 'app', studioId: 'apps', title: `${a.name} — launch workshop`, url: `/academy/reseller/apps/${id}`,
    text: [
      `${a.name} (${a.category}) reseller app. Kind: ${a.appKind}. Facts source: ${a.factSource}.`,
      env ? `Environment variables to set in Vercel (names only): ${env}.` : '',
      p.model ? `Payment model: ${p.model}.` : '',
      plans ? `Default credit packs: ${plans}.` : '',
      p.recommendedWebhookPath ? `Stripe webhook path to register: ${p.recommendedWebhookPath} (event checkout.session.completed).` : '',
      (a.notes ?? []).join(' '),
    ].filter(Boolean).join('\n'),
  });
}

/* ------------------------------ safety + output ------------------------------ */
const SECRET = /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}|\bwhsec_[A-Za-z0-9]{10,}|\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|\bghp_[A-Za-z0-9]{20,}/;
const bad = chunks.filter((c) => SECRET.test(c.text));
if (bad.length) { console.error('Secret-looking text in chunks:', bad.map((b) => b.id)); process.exit(1); }
const ids = new Set(chunks.map((c) => c.id));
if (ids.size !== chunks.length) { console.error('Duplicate chunk ids'); process.exit(1); }

const out = { meta: { generatedBy: 'scripts/build-help-index.ts', chunkCount: chunks.length, byKind: Object.fromEntries(['studio', 'academy', 'reseller', 'app'].map((k) => [k, chunks.filter((c) => c.kind === k).length])) }, chunks };
fs.writeFileSync(path.join(ROOT, 'src/data/helpIndex.json'), JSON.stringify(out) + '\n');
console.log('help index:', JSON.stringify(out.meta));

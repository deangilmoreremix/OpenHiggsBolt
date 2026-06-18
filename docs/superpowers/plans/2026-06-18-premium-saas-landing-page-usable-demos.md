# Premium SaaS Landing Page with Usable Product Demos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current root redirect with a premium SaaS landing page that showcases every OpenHiggsBolt studio capability through interactive, no-API-key-required demos and drives users into the full studio.

**Architecture:** The root `app/page.js` renders a server landing page composed of reusable client demo components. A feature registry defines every product tab and demo copy. `FeatureDemos` renders a responsive grid; `DemoModal` opens a client-side modal; `DemoStage` renders lightweight interactive demos for every feature using local state and deterministic generated output.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS 3.4, existing dark glass design tokens, no new dependencies.

## Global Constraints

- Create a landing page at `/`.
- Replace the current root redirect in `app/page.js`.
- Make every application feature represented as a usable demo on the landing page.
- Use premium SaaS landing page patterns: sticky navigation, hero value proposition, interactive product demo, proof, workflow, pricing, testimonials, FAQ, and footer.
- Preserve the existing `/studio/[[...slug]]` product shell and all existing API routes.
- Do not add new npm dependencies.
- Keep the existing dark, glass, cyan, and purple design system.

---

## File Structure

- Create: `components/landing/landingData.js`
- Create: `components/landing/LandingPage.js`
- Create: `components/landing/FeatureDemos.js`
- Create: `components/landing/DemoModal.js`
- Create: `components/landing/DemoStage.js`
- Modify: `app/page.js`
- Modify: `app/layout.js`
- Modify: `app/globals.css`

---
### Task 1: Landing feature registry and global landing styles

**Files:**
- Create: `components/landing/landingData.js`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing Tailwind color tokens and dark/glass CSS variables.
- Produces: exported constants `PRODUCT_NAME`, `NAV_ITEMS`, `LOGOS`, `FEATURES`, `TESTIMONIALS`, `PRICING`, and `FAQS`. `FEATURES` must contain exactly the same `id` and `ctaPath` values used by the existing studio tabs.

- [ ] **Step 1: Create the landing data registry**

Write `components/landing/landingData.js` with this content:

```js
export const PRODUCT_NAME = 'Open Generative AI';

export const NAV_ITEMS = [
  { label: 'Demos', href: '#demos' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' }
];

export const LOGOS = [
  'Creators', 'Agencies', 'Video Teams', 'UGC Brands', 'AI Studios', 'Enterprise'
];

export const FEATURES = [
  {
    id: 'image',
    label: 'Image Studio',
    eyebrow: 'Generative images',
    title: 'Prompt-to-image studio',
    description: 'Turn a prompt into a polished image concept with model, style, and aspect-ratio controls.',
    promptLabel: 'Describe the image',
    defaultPrompt: 'A futuristic wellness app dashboard floating above a calm city skyline',
    options: ['Flux Pro', '1024x1024', 'Photoreal', 'Fast'],
    outputLabel: 'Generated image brief',
    outputMode: 'image',
    eta: '12s',
    ctaPath: '/studio/image',
    stats: ['200+ models', 'T2I + I2I', 'HD output']
  },
  {
    id: 'video',
    label: 'Video Studio',
    eyebrow: 'Text-to-video',
    title: 'Cinematic video generation',
    description: 'Create short videos from prompts, reference frames, camera moves, and model settings.',
    promptLabel: 'Describe the video',
    defaultPrompt: 'A product reveal shot with soft light, slow camera push, and premium motion',
    options: ['Veo 3', '16:9', '5s', 'Cinematic'],
    outputLabel: 'Generated video plan',
    outputMode: 'video',
    eta: '45s',
    ctaPath: '/studio/video',
    stats: ['T2V', 'I2V', 'V2V']
  },
  {
    id: 'audio',
    label: 'Audio Studio',
    eyebrow: 'Sound design',
    title: 'Text-to-audio and music',
    description: 'Generate soundscapes, voiceover concepts, and music beds for social and product videos.',
    promptLabel: 'Describe the sound',
    defaultPrompt: 'Warm uplifting synth bed with soft percussion for a SaaS product trailer',
    options: ['Music', 'Voiceover', '30s', 'Stereo'],
    outputLabel: 'Generated audio concept',
    outputMode: 'audio',
    eta: '18s',
    ctaPath: '/studio/audio',
    stats: ['TTS', 'SFX', 'Music']
  },
  {
    id: 'clipping',
    label: 'AI Clipping',
    eyebrow: 'Repurpose video',
    title: 'Long-form to short-form clips',
    description: 'Find hooks, summarize moments, and package clips for TikTok, Reels, Shorts, and ads.',
    promptLabel: 'Paste the video topic',
    defaultPrompt: 'A founder interview about using AI to launch faster',
    options: ['TikTok', 'Hook-first', 'Captions', '9:16'],
    outputLabel: 'Generated clip package',
    outputMode: 'clip',
    eta: '22s',
    ctaPath: '/studio/clipping',
    stats: ['Hooks', 'Captions', 'Exports']
  },
  {
    id: 'vibe-motion',
    label: 'Vibe Motion',
    eyebrow: 'Visual motion',
    title: 'Animate stills with vibe motion',
    description: 'Add controlled camera movement, parallax, and cinematic motion to static images.',
    promptLabel: 'Describe the motion',
    defaultPrompt: 'Slow parallax over a luxury skincare product with warm highlights',
    options: ['Parallax', 'Slow push', '9:16', 'High'],
    outputLabel: 'Generated motion brief',
    outputMode: 'motion',
    eta: '28s',
    ctaPath: '/studio/vibe-motion',
    stats: ['Motion', 'Parallax', 'Loops']
  },
  {
    id: 'lipsync',
    label: 'Lip Sync',
    eyebrow: 'Character animation',
    title: 'Sync faces to audio',
    description: 'Pair a character image with a voiceover to produce a lip-synced video preview.',
    promptLabel: 'Describe the character and line',
    defaultPrompt: 'A friendly host introduces a new AI video tool in a confident tone',
    options: ['Host', 'English', '30s', 'Natural'],
    outputLabel: 'Generated lip-sync plan',
    outputMode: 'lipsync',
    eta: '35s',
    ctaPath: '/studio/lipsync',
    stats: ['Face sync', 'Voice', 'Export']
  },
  {
    id: 'cinema',
    label: 'Cinema Studio',
    eyebrow: 'Film controls',
    title: 'Director-grade camera language',
    description: 'Control lens, aperture, focal length, camera move, and scene tone before generation.',
    promptLabel: 'Describe the scene',
    defaultPrompt: 'A hero walks through neon rain toward a glowing portal',
    options: ['35mm', 'f/2.8', 'Dolly in', 'Neo-noir'],
    outputLabel: 'Generated shot plan',
    outputMode: 'cinema',
    eta: '40s',
    ctaPath: '/studio/cinema',
    stats: ['Camera', 'Lens', 'Scene']
  },
  {
    id: 'marketing',
    label: 'Marketing Studio',
    eyebrow: 'Campaign assets',
    title: 'Generate campaign-ready assets',
    description: 'Create ad copy, hooks, thumbnails, and video concepts from one product brief.',
    promptLabel: 'Describe the product',
    defaultPrompt: 'An AI video platform for creators who need fast campaign assets',
    options: ['Ad campaign', '3 hooks', 'UGC style', 'CTA'],
    outputLabel: 'Generated campaign brief',
    outputMode: 'marketing',
    eta: '15s',
    ctaPath: '/studio/marketing',
    stats: ['Hooks', 'Ads', 'Briefs']
  },
  {
    id: 'workflows',
    label: 'Workflows',
    eyebrow: 'Automation',
    title: 'Reusable creative pipelines',
    description: 'Build repeatable AI production workflows from prompt, generation, review, and export nodes.',
    promptLabel: 'Describe the workflow',
    defaultPrompt: 'Turn a script into storyboard frames, generated video clips, captions, and export',
    options: ['Script', 'Storyboard', 'Video', 'Export'],
    outputLabel: 'Generated workflow map',
    outputMode: 'workflow',
    eta: '10s',
    ctaPath: '/studio/workflows',
    stats: ['Nodes', 'Templates', 'Runs']
  },
  {
    id: 'agents',
    label: 'Agents',
    eyebrow: 'Conversational AI',
    title: 'Custom AI agents',
    description: 'Create and chat with agents that help write, plan, edit, and operate your studio.',
    promptLabel: 'Ask the agent',
    defaultPrompt: 'Create a launch checklist for a new AI video product',
    options: ['Planning', 'Research', 'Checklist', 'Concise'],
    outputLabel: 'Generated agent response',
    outputMode: 'agent',
    eta: '8s',
    ctaPath: '/studio/agents',
    stats: ['Chat', 'Memory', 'Tools']
  },
  {
    id: 'design-agent',
    label: 'Design Agent',
    eyebrow: 'Visual design',
    title: 'AI-assisted design workspace',
    description: 'Generate layout direction, visual systems, and design tasks through an agent workflow.',
    promptLabel: 'Describe the design goal',
    defaultPrompt: 'Design a premium landing page for an AI video SaaS',
    options: ['Landing page', 'Dark UI', 'High contrast', 'SaaS'],
    outputLabel: 'Generated design direction',
    outputMode: 'design',
    eta: '14s',
    ctaPath: '/studio/design-agent',
    stats: ['Layout', 'System', 'Tasks']
  },
  {
    id: 'videco',
    label: 'Videco',
    eyebrow: 'Video operations',
    title: 'Video marketing command center',
    description: 'Manage generated videos, campaigns, analytics, leads, feedback, and embeds in one workspace.',
    promptLabel: 'Describe the campaign',
    defaultPrompt: 'Launch a creator-led campaign for an AI video tool with weekly analytics',
    options: ['Campaign', 'Analytics', 'Leads', 'Embed'],
    outputLabel: 'Generated campaign dashboard',
    outputMode: 'videco',
    eta: '12s',
    ctaPath: '/studio/videco',
    stats: ['Library', 'Leads', 'Insights']
  },
  {
    id: 'vfx-studio',
    label: 'VFX Studio',
    eyebrow: 'AI effects',
    title: 'Add visual effects to footage',
    description: 'Choose AI effects, motion controls, and VFX settings to transform source media.',
    promptLabel: 'Describe the VFX shot',
    defaultPrompt: 'Add glowing energy trails and camera shake to a product launch clip',
    options: ['Energy', 'Motion blur', '480p', 'High'],
    outputLabel: 'Generated VFX brief',
    outputMode: 'vfx',
    eta: '38s',
    ctaPath: '/studio/vfx-studio',
    stats: ['Effects', 'Motion', 'Render']
  },
  {
    id: 'storyboard',
    label: 'Storyboard',
    eyebrow: 'Pre-production',
    title: 'Script-to-scene storyboard',
    description: 'Break a script into scenes, shots, visual notes, and editable storyboard cards.',
    promptLabel: 'Paste the script',
    defaultPrompt: 'A founder discovers an AI tool that turns ideas into launch videos',
    options: ['6 scenes', 'Shot list', 'Visual notes', 'Edit'],
    outputLabel: 'Generated storyboard',
    outputMode: 'storyboard',
    eta: '16s',
    ctaPath: '/studio/storyboard',
    stats: ['Scenes', 'Shots', 'Notes']
  },
  {
    id: 'scene-planner',
    label: 'Scene Planner',
    eyebrow: 'Workflow builder',
    title: 'Plan scenes and nodes',
    description: 'Map a scene or production workflow with prompt, generation, review, and output nodes.',
    promptLabel: 'Describe the scene plan',
    defaultPrompt: 'A three-scene launch video with product closeups and founder voiceover',
    options: ['3 nodes', 'Prompt', 'Video', 'Output'],
    outputLabel: 'Generated scene plan',
    outputMode: 'scene',
    eta: '12s',
    ctaPath: '/studio/scene-planner',
    stats: ['Nodes', 'Templates', 'History']
  },
  {
    id: 'music-studio',
    label: 'Music Studio',
    eyebrow: 'Original audio',
    title: 'Generate music and sound beds',
    description: 'Create short music concepts with mood, duration, and style controls.',
    promptLabel: 'Describe the track',
    defaultPrompt: 'A confident electronic track for a product demo video',
    options: ['Electronic', '45s', 'Loopable', 'Clean'],
    outputLabel: 'Generated music concept',
    outputMode: 'audio',
    eta: '18s',
    ctaPath: '/studio/music-studio',
    stats: ['Tracks', 'Mood', 'Loop']
  },
  {
    id: 'thumbnail-studio',
    label: 'Thumbnail Studio',
    eyebrow: 'Click-worthy art',
    title: 'Create video thumbnails',
    description: 'Generate thumbnails with style, model, and text treatment controls for every video.',
    promptLabel: 'Describe the thumbnail',
    defaultPrompt: 'A bold thumbnail for an AI video tool with a creator and glowing dashboard',
    options: ['Bold', 'Creator', '16:9', 'High CTR'],
    outputLabel: 'Generated thumbnail concept',
    outputMode: 'thumbnail',
    eta: '14s',
    ctaPath: '/studio/thumbnail-studio',
    stats: ['CTR', 'Styles', 'Text']
  },
  {
    id: 'script-writer',
    label: 'Script Writer',
    eyebrow: 'Copy generation',
    title: 'Write scripts and ad copy',
    description: 'Generate scripts, hooks, voiceover lines, and content variations from a product brief.',
    promptLabel: 'Describe the script',
    defaultPrompt: 'A 30-second ad script for an AI video platform',
    options: ['Ad script', '30s', 'UGC', 'Persuasive'],
    outputLabel: 'Generated script',
    outputMode: 'script',
    eta: '8s',
    ctaPath: '/studio/script-writer',
    stats: ['Hooks', 'Scripts', 'Variants']
  },
  {
    id: 'presentation',
    label: 'Presentation',
    eyebrow: 'Decks',
    title: 'Turn ideas into presentations',
    description: 'Create presentation outlines, slide copy, and speaker notes from a topic.',
    promptLabel: 'Describe the presentation',
    defaultPrompt: 'A sales deck for an AI video platform targeting marketing teams',
    options: ['Sales deck', '8 slides', 'Executive', 'CTA'],
    outputLabel: 'Generated presentation outline',
    outputMode: 'presentation',
    eta: '10s',
    ctaPath: '/studio/presentation',
    stats: ['Slides', 'Outline', 'Notes']
  },
  {
    id: 'content-planner',
    label: 'Content Planner',
    eyebrow: 'Editorial planning',
    title: 'Plan content calendars',
    description: 'Generate campaign ideas, post angles, formats, and publishing cadence.',
    promptLabel: 'Describe the content goal',
    defaultPrompt: 'A two-week content calendar for launching an AI video product',
    options: ['2 weeks', 'Social', 'Educational', 'Launch'],
    outputLabel: 'Generated content plan',
    outputMode: 'content',
    eta: '9s',
    ctaPath: '/studio/content-planner',
    stats: ['Calendar', 'Angles', 'Cadence']
  },
  {
    id: 'ugc-generator',
    label: 'UGC Generator',
    eyebrow: 'Creator ads',
    title: 'Build UGC ads end to end',
    description: 'Generate actor image, voiceover, lip-sync video, and history from one product script.',
    promptLabel: 'Describe the UGC ad',
    defaultPrompt: 'A creator explains why this AI video tool saves marketing teams hours',
    options: ['Creator', 'Voiceover', 'Lip sync', '9:16'],
    outputLabel: 'Generated UGC pipeline',
    outputMode: 'ugc',
    eta: '50s',
    ctaPath: '/studio/ugc-generator',
    stats: ['Actor', 'Voice', 'Video']
  },
  {
    id: 'apps',
    label: 'Explore Apps',
    eyebrow: 'App library',
    title: 'Browse every studio app',
    description: 'Open the full app library and jump into any creative studio from one launchpad.',
    promptLabel: 'What do you want to build?',
    defaultPrompt: 'Show me the best apps for creating a product launch video',
    options: ['Launch video', 'Ads', 'Social', 'Explore'],
    outputLabel: 'Generated app recommendations',
    outputMode: 'apps',
    eta: '6s',
    ctaPath: '/studio/apps',
    stats: ['20+ apps', 'Tabs', 'Deep links']
  }
];

export const TESTIMONIALS = [
  {
    quote: 'The landing page needs to feel like the product itself: fast, visual, and impossible to ignore.',
    name: 'Creative operations lead',
    role: 'Agency producer'
  },
  {
    quote: 'Every feature should be demoable without a login, but every demo should point toward the full studio.',
    name: 'Growth marketer',
    role: 'SaaS launch team'
  },
  {
    quote: 'The best AI tools sell through interaction, not static screenshots.',
    name: 'Founder',
    role: 'AI video platform'
  }
];

export const PRICING = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Try the studio and export lightweight previews.',
    features: ['Interactive landing demos', 'Studio preview access', 'Community generation limits']
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'For creators and teams shipping weekly AI video campaigns.',
    features: ['Full studio access', 'Priority generation queue', 'Campaign and workflow tools']
  },
  {
    name: 'Studio',
    price: 'Custom',
    description: 'For agencies and enterprise teams with volume and workflow needs.',
    features: ['Team seats', 'Custom workflows', 'Priority support']
  }
];

export const FAQS = [
  {
    question: 'Do the landing page demos require an API key?',
    answer: 'No. The landing page demos are local, deterministic previews. The full studio keeps the existing API-key and proxy behavior.'
  },
  {
    question: 'Will the full studio still work?',
    answer: 'Yes. The landing page replaces only the root redirect and links to `/studio/<feature-id>` for the full experience.'
  },
  {
    question: 'Are the demos connected to generation APIs?',
    answer: 'No. They simulate the interaction pattern and output so the page stays fast, reliable, and available without credentials.'
  }
];
```

- [ ] **Step 2: Add landing-specific CSS utilities**

Append this to `app/globals.css`:

```css
html { scroll-behavior: smooth; }

.landing-noise {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.28;
  z-index: 0;
  background-image:
    radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.12), transparent 28%),
    radial-gradient(circle at 80% 10%, rgba(168, 85, 247, 0.12), transparent 24%),
    radial-gradient(circle at 50% 90%, rgba(34, 211, 238, 0.08), transparent 32%);
}

.landing-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(40px);
  opacity: 0.35;
  pointer-events: none;
}

.landing-gradient-text {
  background: linear-gradient(90deg, #fff 0%, #a5f3fc 42%, #c4b5fd 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.landing-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025));
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 24px 80px rgba(0,0,0,0.35);
}

.demo-stage {
  min-height: 360px;
  border-radius: 1.5rem;
  border: 1px solid rgba(255,255,255,0.1);
  background:
    linear-gradient(135deg, rgba(34,211,238,0.08), transparent 38%),
    linear-gradient(315deg, rgba(168,85,247,0.12), transparent 42%),
    rgba(10,10,10,0.86);
}

.demo-preview {
  min-height: 180px;
  border-radius: 1rem;
  border: 1px solid rgba(255,255,255,0.08);
  background:
    radial-gradient(circle at 30% 20%, rgba(34,211,238,0.18), transparent 30%),
    radial-gradient(circle at 70% 70%, rgba(168,85,247,0.16), transparent 34%),
    rgba(0,0,0,0.28);
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```

- [ ] **Step 3: Run the build gate**

Run:

```bash
npm run build
```

Expected: `PASS` after Task 2 commits in the full sequence, because the build gate in Task 2 is deferred until the demo grid and modal exist.

- [ ] **Step 4: Commit the data and style foundation**

```bash
git add components/landing/landingData.js app/globals.css
git commit -m "feat: add landing page feature registry"
```
### Task 2: Root landing page shell with premium SaaS sections

**Files:**
- Modify: `app/page.js`
- Create: `components/landing/LandingPage.js`

**Interfaces:**
- Consumes: `PRODUCT_NAME`, `NAV_ITEMS`, `LOGOS`, `FEATURES`, `TESTIMONIALS`, `PRICING`, and `FAQS` from `components/landing/landingData.js`.
- Produces: the `/` route as a server-rendered landing page. It imports `FeatureDemos` as a client island.

- [ ] **Step 1: Replace the root redirect with a server landing page**

Replace `app/page.js` with:

```js
import dynamic from 'next/dynamic';
import LandingPage from '../components/landing/LandingPage';

const FeatureDemos = dynamic(() => import('../components/landing/FeatureDemos'), {
  ssr: false,
  loading: () => (
    <section id="demos" className="mx-auto max-w-7xl px-6 py-16">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white/50">
        Loading interactive demos...
      </div>
    </section>
  )
});

export const metadata = {
  title: 'Open Generative AI — Premium AI Video Studio',
  description: 'Generate AI images and videos using 200+ models — Flux, Midjourney, Kling, Veo, Seedance and more.'
};

export default function Home() {
  return <LandingPage FeatureDemos={FeatureDemos} />;
}
```

- [ ] **Step 2: Create the landing page composition**

Write `components/landing/LandingPage.js` with:

```jsx
import Link from 'next/link';
import {
  PRODUCT_NAME,
  NAV_ITEMS,
  LOGOS,
  FEATURES,
  TESTIMONIALS,
  PRICING,
  FAQS
} from './landingData';

export default function LandingPage({ FeatureDemos }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="landing-noise" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(168,85,247,0.10),_transparent_30%),#050505]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 text-sm font-black text-black">
              OG
            </span>
            <span className="font-semibold tracking-tight">{PRODUCT_NAME}</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>

          <Link href="/studio/image" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90">
            Open studio
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 md:pb-32 md:pt-28">
        <div className="landing-orb -left-24 top-24 h-72 w-72 bg-cyan-400" aria-hidden="true" />
        <div className="landing-orb right-0 top-40 h-96 w-96 bg-purple-500" aria-hidden="true" />

        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-cyan-200">
            Every studio feature is demoable before signup
          </p>
          <h1 className="landing-gradient-text text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">
            Build AI video campaigns at the speed of imagination.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65 md:text-xl">
            Generate images, cinematic video, UGC ads, VFX, agents, workflows, music, thumbnails, scripts, and marketing assets from one polished creative operating system.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="#demos" className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-3 text-sm font-bold text-black shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] sm:w-auto">
              Try the demos
            </Link>
            <Link href="/studio/image" className="w-full rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.08] sm:w-auto">
              Launch full studio
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3 text-center text-white/60 sm:grid-cols-3">
            {[
              ['20+', 'studio apps'],
              ['200+', 'models'],
              ['0', 'demo API key required']
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-center text-sm uppercase tracking-[0.35em] text-white/35">Built for teams creating</p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
            {LOGOS.map((logo) => (
              <div key={logo} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-center text-sm font-semibold text-white/50">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeatureDemos features={FEATURES} />

      <section id="workflow" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Workflow</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">From idea to shipped campaign in one loop.</h2>
            <p className="mt-5 text-lg leading-8 text-white/60">
              Plan the concept, generate the assets, refine the edit, publish the campaign, and learn from analytics without switching tools.
            </p>
          </div>
          <div className="landing-card rounded-3xl p-6">
            {[
              ['1', 'Brief', 'Enter a product, script, or campaign goal.'],
              ['2', 'Generate', 'Use image, video, UGC, VFX, audio, or agent tools.'],
              ['3', 'Refine', 'Review outputs, adjust prompts, and rerun in seconds.'],
              ['4', 'Launch', 'Export assets, embed videos, and track campaign performance.']
            ].map(([step, title, copy]) => (
              <div key={step} className="flex gap-4 border-b border-white/10 py-5 last:border-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-sm font-black text-black">
                  {step}
                </span>
                <div>
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/55">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Pricing</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Start free. Scale when your team ships more.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PRICING.map((plan) => (
            <div key={plan.name} className="landing-card rounded-3xl p-7">
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="mt-4 text-4xl font-black text-white">{plan.price}</div>
              <p className="mt-3 text-sm leading-6 text-white/55">{plan.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-white/65">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure key={testimonial.name} className="landing-card rounded-3xl p-7">
              <blockquote className="text-base leading-7 text-white/70">“{testimonial.quote}”</blockquote>
              <figcaption className="mt-6">
                <div className="font-bold text-white">{testimonial.name}</div>
                <div className="text-sm text-white/45">{testimonial.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="text-center text-4xl font-black tracking-tight md:text-5xl">Questions before you launch?</h2>
        <div className="mt-10 space-y-4">
          {FAQS.map((faq) => (
            <details key={faq.question} className="landing-card rounded-2xl p-6">
              <summary className="cursor-pointer font-bold text-white">{faq.question}</summary>
              <p className="mt-4 leading-7 text-white/60">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">Make the first demo feel like the full product.</h2>
          <p className="mt-5 text-lg leading-8 text-white/60">
            Visitors should understand the platform, try a feature, and know exactly where to go next.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="#demos" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90">
              Try a demo
            </Link>
            <Link href="/studio/image" className="rounded-full border border-white/10 bg-transparent px-6 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]">
              Open full studio
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-white/40 md:flex-row md:items-center md:justify-between">
        <div>{PRODUCT_NAME} — premium AI image, video, and campaign studio.</div>
        <div className="flex gap-5">
          <Link href="/studio/image" className="hover:text-white">Studio</Link>
          <a href="#demos" className="hover:text-white">Demos</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </div>
      </footer>
    </main>
  );
}
```

- [ ] **Step 2: Run the build gate**

Run:

```bash
npm run build
```

Expected: `PASS` after Tasks 3 through 6 pass because the shell imports `FeatureDemos` and `DemoStage`.

- [ ] **Step 3: Defer the landing shell commit until the demo grid exists**

Do not commit Task 2 by itself because `app/page.js` imports `FeatureDemos`, which is created in Task 3. After Task 6 passes its build gate, commit the landing shell files with:

```bash
git add app/page.js components/landing/LandingPage.js components/landing/FeatureDemos.js components/landing/DemoModal.js
git commit -m "feat: add premium landing page shell and demo modal"
```

/**
 * Scopes VoiceStudio upstream global CSS so it only applies inside the
 * `[data-voice-studio]` mount point.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const src = join(process.cwd(), 'vendor/VoiceStudio/frontend/src/index.css');
const dst = join(process.cwd(), 'src/integrations/voice-studio/scoped-index.css');

const css = readFileSync(src, 'utf8');

const scoped = css
  // Remove Vite/Tailwind-v4-specific imports that do not resolve in the
  // host Next.js webpack build. The host already provides its own Tailwind
  // layer setup, so these are not needed here.
  .replace(/@import "tailwindcss\/theme\.css" layer\(theme\);\n/g, '')
  .replace(/@import "tailwindcss\/utilities\.css" layer\(utilities\);\n/g, '')
  .replace(/@import "tw-animate-css";\n/g, '')
  // Scope top-level global selectors so they only match inside the
  // VoiceStudio mount point.
  .replace(/^:root\s*\{/gm, '[data-voice-studio] :root {')
  .replace(/^#root\s*\{/gm, '[data-voice-studio] #root {')
  .replace(/^html\s*\{/gm, '[data-voice-studio] html {')
  .replace(/^body\s*\{/gm, '[data-voice-studio] body {')
  .replace(/^\*\s*\{/gm, '[data-voice-studio] * {')
  .replace(/^html\[data-window='widget'\]\s*\{/gm, "[data-voice-studio] html[data-window='widget'] {")
  .replace(/^html\[data-window='widget'\] body\s*\{/gm, "[data-voice-studio] html[data-window='widget'] body {")
  .replace(/^html\[data-window='widget'\] #root\s*\{/gm, "[data-voice-studio] html[data-window='widget'] #root {")
  .replace(/^html\[data-window='widget'\] #root > \*\s*\{/gm, "[data-voice-studio] html[data-window='widget'] #root > * {")
  .replace(/^html\[data-zoom-layout='off'\] \.app-container\s*\{/gm, "[data-voice-studio] html[data-zoom-layout='off'] .app-container {")
  .replace(/^html\[data-ui-scale-engine='native'\] \.app-container\s*\{/gm, "[data-voice-studio] html[data-ui-scale-engine='native'] .app-container {")
  .replace(/^html\[data-zoom-layout='off'\] \.app-wizard-wrap\s*\{/gm, "[data-voice-studio] html[data-zoom-layout='off'] .app-wizard-wrap {")
  .replace(/^html\[data-ui-scale-engine='native'\] \.app-wizard-wrap\s*\{/gm, "[data-voice-studio] html[data-ui-scale-engine='native'] .app-wizard-wrap {")
  .replace(/^html\[data-ui-scale-engine='native'\] \.app-bootstrap-scale\s*\{/gm, "[data-voice-studio] html[data-ui-scale-engine='native'] .app-bootstrap-scale {")
  .replace(/^html\[data-window='widget'\] \.capture-pill\s*\{/gm, "[data-voice-studio] html[data-window='widget'] .capture-pill {")
  .replace(/^html\[data-window='widget'\] \.capture-pill--recording\s*\{/gm, "[data-voice-studio] html[data-window='widget'] .capture-pill--recording {")
  .replace(/^html\[data-window='widget'\] \.capture-pill--transcribing\s*\{/gm, "[data-voice-studio] html[data-window='widget'] .capture-pill--transcribing {")
  .replace(/^:root, \[data-theme\]\s*\{/gm, '[data-voice-studio] :root, [data-voice-studio] [data-theme] {');

writeFileSync(dst, scoped, 'utf8');
console.log(`Scoped CSS written to ${dst}`);

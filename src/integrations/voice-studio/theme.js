/**
 * SmartVideo theme tokens for VoiceStudio.
 *
 * VoiceStudio is mounted and removed when it unmounts, so this is an
 * apply-on-mount / clear-on-unmount pair. It does NOT permanently alter
 * the host shell.
 *
 * The upstream CSS is imported unscoped from vendor/VoiceStudio/frontend/src/index.css.
 * CSS isolation is handled separately by scoping that stylesheet to
 * [data-voice-studio] via next.config.mjs / PostCSS alias.
 */

export function applyVoiceStudioTheme() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-voice-studio', 'smartvideo');

  // SmartVideo semantic color tokens.
  // These are consumed by the host shell AND exposed as CSS custom properties
  // so upstream components that reference --color-brand / --color-fg / etc.
  // resolve to the correct SmartVideo palette.
  const tokens = {
    '--color-brand': '#22d3ee',
    '--color-brand-hover': '#06b6d4',
    '--color-brand-glow': 'rgba(34,211,238,0.4)',
    '--color-bg': '#050505',
    '--color-bg-elev-1': '#0a0a0a',
    '--color-bg-elev-2': '#141414',
    '--color-fg': '#f5f5f5',
    '--color-fg-muted': '#a1a1aa',
    '--color-fg-subtle': '#52525b',
    '--color-fg-inverse': '#050505',
  };

  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
}

export function clearVoiceStudioTheme() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.removeAttribute('data-voice-studio');

  const tokens = [
    '--color-brand',
    '--color-brand-hover',
    '--color-brand-glow',
    '--color-bg',
    '--color-bg-elev-1',
    '--color-bg-elev-2',
    '--color-fg',
    '--color-fg-muted',
    '--color-fg-subtle',
    '--color-fg-inverse',
  ];

  for (const key of tokens) {
    root.style.removeProperty(key);
  }
}

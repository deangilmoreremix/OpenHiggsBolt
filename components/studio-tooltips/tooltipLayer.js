// One delegated, portaled hover-help layer for the OpenHiggsBolt studios. It watches pointer hover and keyboard focus, finds the control's
// label (data-help, title, aria-label, id, short button text), looks it up in ./studioHelp.js and shows a themed card: name + one-line
// summary first, then the longer text after a pause. Controls that only have a native title (no copy yet) get the same themed card, so the
// unstyled browser bubbles are replaced without touching each studio.
//
// Colors are this app's own scheme: electric cyan (--color-primary #22d3ee) on the #0a0a0a panel, with the creative purple
// (--color-accent #a855f7) on the shortcut chip. They are read from the app's CSS variables with the same values as fallbacks.
// This is NOT remix-new-editor's lime scheme: do not copy colors between the two repos.

import { resolveStudioHelp, idLabels, studioEntry } from './studioHelp.js';

const SHOW_DELAY_MS = 350;
const EXPAND_DELAY_MS = 900;
const HIDE_DELAY_MS = 120;
const CARD_ID = 'studio-tip-card';
const STYLE_ID = 'studio-tip-style';
const SKIP = '.studio-tip, [data-no-studio-tip]';

export const TIP_CSS = `
:root {
  --tip-bg: #0a0a0a;
  --tip-border: #27272a;
  --tip-accent: var(--color-primary, #22d3ee);
  --tip-accent-2: var(--color-accent, #a855f7);
  --tip-text: #e4e4e7;
  --tip-muted: #a1a1aa;
}
.studio-tip {
  position: fixed; z-index: 100000; width: max-content; max-width: min(300px, calc(100vw - 20px));
  padding: 9px 12px 10px; border-radius: 10px; background: var(--tip-bg); color: var(--tip-text);
  border: 1px solid color-mix(in srgb, var(--tip-accent) 35%, var(--tip-border));
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0, 0, 0, 0.4);
  font: 12px/1.45 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; pointer-events: none;
  animation: studio-tip-in 0.12s ease-out;
}
.studio-tip__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.studio-tip__name { font-size: 13px; font-weight: 600; color: var(--tip-accent); }
.studio-tip--plain .studio-tip__name { color: var(--tip-text); font-weight: 500; }
.studio-tip__key {
  font: 600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; padding: 3px 6px; border-radius: 5px;
  background: color-mix(in srgb, var(--tip-accent-2) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--tip-accent-2) 40%, transparent); color: var(--tip-text);
}
.studio-tip__summary { margin: 4px 0 0; color: var(--tip-text); }
.studio-tip__what { margin: 8px 0 0; padding-top: 8px; border-top: 1px solid var(--tip-border); color: var(--tip-muted); }
@keyframes studio-tip-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .studio-tip { animation: none; } }
`;

let mounted = false;

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = TIP_CSS;
  document.head.appendChild(el);
}

/** The short caption beside a form field ("Duration", "Resolution"), for selects and inputs that carry no label of their own. */
function fieldLabel(el) {
  if (!(el instanceof HTMLSelectElement || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return '';
  const own = (n) => (n?.textContent || '').trim().replace(/\s+/g, ' ');
  const wrap = el.closest('label');
  const span = wrap?.querySelector(':scope > span, :scope > div');
  const first = el instanceof HTMLSelectElement ? (el.options[0]?.text || '').trim() : '';
  return [own(span), own(el.previousElementSibling), own(wrap), first].find((c) => c && c.length <= 28) || '';
}

/** Find the control under the pointer and the text it is known by. */
export function findHelp(start) {
  let el = start instanceof HTMLElement ? start : start && start.parentElement;
  let firstPlain = null; // a control's own title is only used when no ancestor has written copy
  for (let i = 0; el && i < 6; i++, el = el.parentElement) {
    if (el.closest(SKIP)) return null;
    // The shell's studio tabs carry data-tab=<studio id>: show that studio's own description.
    const studio = el.dataset.tab ? studioEntry(el.dataset.tab) : null;
    if (studio) return { el, entry: studio };
    // Copy supplied by the studio at render time (fields generated from a model schema have no fixed label to look up):
    // data-help-text is the sentence, data-help-name an optional heading (otherwise the control's own label).
    if (el.dataset.helpText) {
      const name = el.dataset.helpName || el.getAttribute('aria-label') || el.getAttribute('placeholder') || fieldLabel(el) || el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40);
      return { el, entry: { name: name || 'Info', summary: el.dataset.helpText } };
    }
    const plain = el.dataset.helpTitle || el.getAttribute('title') || '';
    const text = (el.tagName === 'BUTTON' || (el.tagName === 'A' && el.hasAttribute('href')) || el.tagName === 'SUMMARY' || el.getAttribute('role') === 'button')
      ? (el.textContent || '').trim().replace(/\s+/g, ' ') : '';
    // Try every label the control carries against the copy before settling for plain text: a long title sentence must not shadow
    // the visible name that has an entry.
    // Placeholders are often long sentences; they are only matched by prefix, so allow them more room than a label.
    const placeholder = el.getAttribute('placeholder');
    const candidates = [el.dataset.help, text, el.getAttribute('aria-label'), ...idLabels(el.id), placeholder, fieldLabel(el), plain];
    for (const c of candidates) {
      const entry = c && c.length <= (c === placeholder ? 240 : 80) ? resolveStudioHelp(c) : null;
      if (entry) return { el, entry };
    }
    if (plain && plain.length <= 160 && !firstPlain) firstPlain = { el, entry: { name: plain } };
  }
  return firstPlain;
}

/** Card position: beside small icon controls, otherwise below, then above, clamped to the viewport. */
export function place(rect, w, h, vw = window.innerWidth, vh = window.innerHeight) {
  const pad = 10;
  const clampTop = (t) => Math.max(pad, Math.min(t, vh - h - pad));
  const clampLeft = (l) => Math.max(pad, Math.min(l, vw - w - pad));
  if (rect.width <= 64 && rect.right + pad + w <= vw) return { left: rect.right + pad, top: clampTop(rect.top + rect.height / 2 - 24) };
  if (rect.bottom + pad + h <= vh) return { left: clampLeft(rect.left + rect.width / 2 - w / 2), top: rect.bottom + pad };
  if (rect.top - pad - h >= 0) return { left: clampLeft(rect.left + rect.width / 2 - w / 2), top: rect.top - pad - h };
  if (rect.right + pad + w <= vw) return { left: rect.right + pad, top: clampTop(rect.top) };
  return { left: clampLeft(rect.left - pad - w), top: clampTop(rect.top) };
}

function buildCard(entry) {
  const card = document.createElement('div');
  card.id = CARD_ID;
  // A card with no written summary is just a control's own title text: it keeps the light text color, not the accent title.
  card.className = entry.summary ? 'studio-tip' : 'studio-tip studio-tip--plain';
  card.setAttribute('role', 'tooltip');
  const head = document.createElement('div');
  head.className = 'studio-tip__head';
  const name = document.createElement('strong');
  name.className = 'studio-tip__name';
  name.textContent = entry.name;
  head.appendChild(name);
  if (entry.shortcut) {
    const key = document.createElement('kbd');
    key.className = 'studio-tip__key';
    key.textContent = entry.shortcut;
    head.appendChild(key);
  }
  card.appendChild(head);
  if (entry.summary) {
    const p = document.createElement('p');
    p.className = 'studio-tip__summary';
    p.textContent = entry.summary;
    card.appendChild(p);
  }
  return card;
}

/** Mount the layer once for the whole page. Returns a function that removes it again. */
export function mountStudioTooltips() {
  if (mounted || typeof document === 'undefined') return () => {};
  mounted = true;
  injectStyle();

  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  let card = null;
  let target = null; // { el, title }
  const timers = {};

  const clearTimers = () => { clearTimeout(timers.show); clearTimeout(timers.expand); clearTimeout(timers.hide); };
  const restore = () => {
    if (!target) return;
    const { el, title } = target;
    if (title != null && !el.getAttribute('title')) el.setAttribute('title', title);
    el.removeAttribute('aria-describedby');
    delete el.dataset.helpTitle;
    target = null;
  };
  const hide = () => { clearTimers(); restore(); card?.remove(); card = null; };

  const open = (el, entry) => {
    if (target?.el === el) return;
    clearTimers(); restore(); card?.remove(); card = null;
    const title = el.getAttribute('title');
    if (title != null) { el.dataset.helpTitle = title; el.removeAttribute('title'); } // no second, native bubble
    target = { el, title };
    timers.show = setTimeout(() => {
      if (target?.el !== el) return;
      card = buildCard(entry);
      card.style.left = '-9999px';
      card.style.top = '-9999px';
      document.body.appendChild(card);
      const r = card.getBoundingClientRect();
      const pos = place(el.getBoundingClientRect(), r.width, r.height);
      card.style.left = `${pos.left}px`;
      card.style.top = `${pos.top}px`;
      el.setAttribute('aria-describedby', CARD_ID);
      if (entry.what) {
        timers.expand = setTimeout(() => {
          if (!card || target?.el !== el) return;
          const more = document.createElement('p');
          more.className = 'studio-tip__what';
          more.textContent = entry.what;
          card.appendChild(more);
          const rr = card.getBoundingClientRect();
          const p2 = place(el.getBoundingClientRect(), rr.width, rr.height);
          card.style.left = `${p2.left}px`;
          card.style.top = `${p2.top}px`;
        }, EXPAND_DELAY_MS - SHOW_DELAY_MS);
      }
    }, SHOW_DELAY_MS);
  };

  const on = (type, fn, opts) => { document.addEventListener(type, fn, opts); return () => document.removeEventListener(type, fn, opts); };
  const offs = [
    on('pointerover', (e) => {
      if (e.pointerType === 'touch' || coarse) return;
      const hit = findHelp(e.target);
      if (hit) { clearTimeout(timers.hide); open(hit.el, hit.entry); }
    }, true),
    on('pointerout', (e) => {
      const to = e.relatedTarget;
      if (to && target?.el.contains(to)) return;
      clearTimeout(timers.hide);
      timers.hide = setTimeout(hide, HIDE_DELAY_MS);
    }, true),
    on('focusin', (e) => {
      const hit = findHelp(e.target);
      if (hit && e.target.matches?.(':focus-visible')) open(hit.el, hit.entry);
    }, true),
    on('focusout', hide, true),
    on('pointerdown', hide, true),
    on('keydown', (e) => { if (e.key === 'Escape') hide(); }, true),
  ];
  window.addEventListener('scroll', hide, true);
  window.addEventListener('blur', hide);

  return () => {
    offs.forEach((off) => off());
    window.removeEventListener('scroll', hide, true);
    window.removeEventListener('blur', hide);
    hide();
    document.getElementById(STYLE_ID)?.remove();
    mounted = false;
  };
}

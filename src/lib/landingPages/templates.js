/**
 * Landing page templates, config defaults/sanitizing and {{token}} filling.
 *
 * A page's `config` (jsonb in public.landing_pages) is plain data. Templates
 * are presets over it; the public page (src/pages/VideoPage.jsx) and the studio
 * preview both render from the same config, so what you design is what viewers
 * get. Everything here is pure so it can be unit tested.
 */

import { ICON_KEYS } from './siteIcons.js';
import { PUCK_TEMPLATES } from './puck/designs.js';

export const TEMPLATES = Object.freeze([...PUCK_TEMPLATES]);


export const FONTS = Object.freeze({
  system: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  display: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
});

/** Token keys a viewer is allowed to see (must match landing_page_contact_tokens). */
export const PUBLIC_TOKEN_KEYS = Object.freeze(['firstname', 'lastname', 'company', 'companylogo', 'role', 'city', 'custom1', 'custom2', 'custom3']);

/** Token keys that carry an image URL: never accepted from the page URL, https only when rendered. */
export const IMAGE_TOKEN_KEYS = Object.freeze(['companylogo']);

export const FORM_FIELD_TYPES = Object.freeze(['text', 'email', 'tel', 'textarea']);

const HEX = /^#[0-9a-f]{6}$/i;
const clip = (v, n) => String(v ?? '').slice(0, n);

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];

/** http(s), mailto and tel links only. Anything else (javascript:, data:) becomes ''. */
export function safeUrl(value) {
  const s = String(value ?? '').trim();
  if (!s || s.length > 2048) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(s)) return s;
  return '';
}

/** Only https image URLs for logos/posters. */
export function safeImageUrl(value) {
  const s = String(value ?? '').trim();
  return /^https:\/\//i.test(s) && s.length <= 2048 ? s : '';
}

export function defaultConfig(templateId = 'clean', { title = '', brand = {} } = {}) {
  const t = getTemplate(templateId);
  const base = {
    template: t.id,
    theme: { ...t.theme, ...(brand.accent ? { accent: brand.accent } : {}), logoUrl: brand.logoUrl || '' },
    headline: title || 'Watch this video',
    subhead: '',
    cta: { label: 'Book a call', url: '', type: 'link' },
    form: {
      enabled: t.id === 'sales',
      title: 'Want to hear more?',
      submitLabel: 'Send',
      successMessage: 'Thanks! We will be in touch.',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
      ],
    },
    sections: t.id === 'sales'
      ? [{ heading: 'Why watch', body: 'Add two or three short benefits here.' }]
      : [],
    consent: { notice: '' },
    autoplay: false,
  };
  if (t.puck) {
    return sanitizeConfig({ ...base, headline: title || 'Watch this video', form: { ...base.form, enabled: false }, puck: JSON.parse(JSON.stringify(t.puckData)) });
  }
  return sanitizeConfig(base);
}

/**
 * Switch template but keep what the user wrote: the new template's theme is applied
 * (the user's logo is kept), and only content blocks that are still empty are filled
 * from the new template's defaults.
 */
export function applyTemplate(config, templateId, opts = {}) {
  const current = sanitizeConfig(config);
  const next = defaultConfig(templateId, opts);
  const merged = { ...current, template: next.template, theme: { ...next.theme, logoUrl: current.theme.logoUrl || next.theme.logoUrl } };
  ['brand', 'badge', 'overlay', 'story', 'sender', 'testimonial', 'logos', 'footer'].forEach((k) => {
    if (isEmptyBlock(current[k])) merged[k] = next[k];
  });
  if (!current.headline) merged.headline = next.headline;
  if (!current.subhead) merged.subhead = next.subhead;
  if (!current.form.enabled && next.form.enabled) merged.form = next.form;
  return sanitizeConfig(merged);
}


/**
 * Editable-page (Puck) data: a JSON tree of components. It is only ever rendered by our own React components
 * (text escaped, links/images checked), so here we just bound its shape and size.
 */
export function sanitizePuck(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.content)) return null;
  try {
    const plain = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
    const json = JSON.stringify({
      content: input.content.filter((c) => c && typeof c.type === 'string').slice(0, 60),
      root: { props: plain(input.root?.props) },
      zones: plain(input.zones),
    });
    if (json.length > 150000) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Make any stored/edited config safe and complete. Never throws. */
export function sanitizeConfig(input) {
  const c = input && typeof input === 'object' ? input : {};
  const t = getTemplate(c.template);
  const theme = c.theme && typeof c.theme === 'object' ? c.theme : {};
  const color = (v, fallback) => (HEX.test(String(v || '')) ? String(v).toLowerCase() : fallback);
  const cta = c.cta && typeof c.cta === 'object' ? c.cta : {};
  const form = c.form && typeof c.form === 'object' ? c.form : {};

  const seen = new Set();
  const fields = (Array.isArray(form.fields) ? form.fields : [])
    .map((f) => ({
      key: clip(f?.key, 40).replace(/[^a-z0-9_]/gi, '').toLowerCase(),
      label: clip(f?.label, 80),
      type: FORM_FIELD_TYPES.includes(f?.type) ? f.type : 'text',
      required: !!f?.required,
      placeholder: clip(f?.placeholder, 80),
    }))
    .filter((f) => f.key && f.label && !seen.has(f.key) && seen.add(f.key))
    .slice(0, 8);

  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const brand = obj(c.brand);
  const overlay = obj(c.overlay);
  const story = obj(c.story);
  const sender = obj(c.sender);
  const testimonial = obj(c.testimonial);
  const footer = obj(c.footer);
  const accent = color(theme.accent, t.theme.accent);
  const ctas = (Array.isArray(c.ctas) ? c.ctas : [])
    .map((b) => {
      const kind = CTA_KINDS.includes(b?.kind) ? b.kind : 'link';
      return {
        label: clip(b?.label, 60),
        kind,
        value: clip(b?.value, 2048).trim(),
        style: ['primary', 'secondary', 'text'].includes(b?.style) ? b.style : 'secondary',
      };
    })
    .filter((b) => b.label || b.value)
    .slice(0, 5);
  const calendar = obj(c.calendar);
  const transcript = obj(c.transcript);
  const countdown = obj(c.countdown);
  const endsMs = Date.parse(String(countdown.endsAt || ''));
  const logos = (Array.isArray(c.logos) ? c.logos : [])
    .map((l) => ({ name: clip(l?.name, 60), imageUrl: safeImageUrl(l?.imageUrl) }))
    .filter((l) => l.name || l.imageUrl)
    .slice(0, 6);

  return {
    template: t.id,
    theme: {
      mode: theme.mode === 'dark' ? 'dark' : theme.mode === 'light' ? 'light' : t.theme.mode,
      accent,
      highlight: color(theme.highlight, t.theme.highlight || accent),
      bg: color(theme.bg, t.theme.bg),
      text: color(theme.text, t.theme.text),
      font: Object.prototype.hasOwnProperty.call(FONTS, theme.font) ? theme.font : t.theme.font,
      logoUrl: safeImageUrl(theme.logoUrl),
    },
    brand: { name: clip(brand.name, 60), tagline: clip(brand.tagline, 100) },
    badge: clip(c.badge, 100),
    headline: clip(c.headline, 200),
    subhead: clip(c.subhead, 300),
    cta: {
      label: clip(cta.label, 60),
      url: safeUrl(cta.url),
      type: ['link', 'phone', 'calendar', 'play'].includes(cta.type) ? cta.type : 'link',
    },
    overlay: { title: clip(overlay.title, 100), subtitle: clip(overlay.subtitle, 100) },
    story: {
      heading: clip(story.heading, 120),
      body: (Array.isArray(story.body) ? story.body : []).map((p) => clip(p, 600)).filter((p) => p.trim()).slice(0, 4),
    },
    sender: { name: clip(sender.name, 80), title: clip(sender.title, 100), avatarUrl: safeImageUrl(sender.avatarUrl) },
    form: {
      enabled: !!form.enabled && fields.length > 0,
      title: clip(form.title, 120),
      subtitle: clip(form.subtitle, 200),
      submitLabel: clip(form.submitLabel, 40) || 'Send',
      successMessage: clip(form.successMessage, 200),
      privacy: clip(form.privacy, 200),
      fields,
    },
    sections: (Array.isArray(c.sections) ? c.sections : [])
      .map((s) => ({ heading: clip(s?.heading, 120), body: clip(s?.body, 1000) }))
      .filter((s) => s.heading || s.body)
      .slice(0, 6),
    testimonial: { quote: clip(testimonial.quote, 280), by: clip(testimonial.by, 120) },
    logos,
    ctas,
    calendar: { url: isCalendarUrl(calendar.url) ? String(calendar.url).trim() : '', title: clip(calendar.title, 80) },
    likes: { enabled: !!obj(c.likes).enabled },
    transcript: {
      enabled: !!transcript.enabled,
      items: (Array.isArray(transcript.items) ? transcript.items : [])
        .map((i) => ({ t: Math.max(0, Math.min(86400, Number(i?.t) || 0)), text: clip(i?.text, 300) }))
        .filter((i) => i.text.trim())
        .slice(0, 300),
    },
    countdown: {
      enabled: !!countdown.enabled && Number.isFinite(endsMs) && Math.abs(endsMs - Date.now()) < 5 * 365 * 864e5,
      endsAt: Number.isFinite(endsMs) ? new Date(endsMs).toISOString() : '',
      label: clip(countdown.label, 80),
    },
    footer: { text: clip(footer.text, 160), optOutUrl: safeUrl(footer.optOutUrl) },
    consent: { notice: clip(c.consent?.notice, 300) },
    autoplay: !!c.autoplay,
    ...(t.puck || c.puck ? { puck: sanitizePuck(c.puck) || (t.puck ? JSON.parse(JSON.stringify(t.puckData)) : null) } : {}),
  };
}

export const CTA_KINDS = Object.freeze(['link', 'calendar', 'phone', 'sms', 'download', 'form']);

/** Booking sites whose pages may be embedded under the player (https only, exact host or subdomain). */
const CALENDAR_HOSTS = ['calendly.com', 'cal.com', 'tidycal.com', 'youcanbook.me', 'savvycal.com', 'calendar.google.com', 'calendar.app.google', 'zcal.co', 'chilipiper.com', 'acuityscheduling.com', 'outlook.office365.com', 'outlook.office.com'];
const HUBSPOT_MEETINGS = /^meetings(-[a-z0-9]+)?\.hubspot\.com$/;

export function isCalendarUrl(value) {
  let u;
  try { u = new URL(String(value || '').trim()); } catch { return false; }
  if (u.protocol !== 'https:' || u.username || u.password) return false;
  const host = u.hostname.toLowerCase();
  return HUBSPOT_MEETINGS.test(host) || CALENDAR_HOSTS.some((d) => host === d || host.endsWith(`.${d}`));
}

/** Phone number for tel:/sms: links: digits with an optional leading +; '' when it doesn't look like a number. */
export function cleanPhone(value) {
  const s = String(value ?? '').trim();
  if (!/^\+?[\d\s().-]{5,25}$/.test(s)) return '';
  const digits = s.replace(/[^\d]/g, '');
  return digits.length >= 5 && digits.length <= 15 ? `${s.startsWith('+') ? '+' : ''}${digits}` : '';
}

/** Safe href for an action button, or '' when the value is missing or unsafe. */
export function ctaHref(kind, value) {
  const v = String(value ?? '').trim();
  if (kind === 'phone') { const n = cleanPhone(v); return n ? `tel:${n}` : ''; }
  if (kind === 'sms') { const n = cleanPhone(v); return n ? `sms:${n}` : ''; }
  if (kind === 'download') return safeImageUrl(v); // https only
  if (kind === 'calendar') return /^https:\/\//i.test(v) && v.length <= 2048 ? v : '';
  if (kind === 'form') return ''; // scrolls to the lead form on the page; no link
  return safeUrl(v);
}

/** "0:00 Hello" / "1:05 Next point" lines -> [{ t, text }]. Lines without a time continue from the previous one. */
export function parseTranscript(text) {
  const out = [];
  String(text ?? '').split(/\r?\n/).forEach((line) => {
    const m = /^\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+(.+)$/.exec(line);
    if (m) out.push({ t: (Number(m[1] || 0) * 3600) + (Number(m[2]) * 60) + Number(m[3]), text: m[4].trim() });
    else if (line.trim() && out.length) out[out.length - 1].text += ` ${line.trim()}`;
  });
  return out.slice(0, 300);
}

export function formatTranscript(items = []) {
  return items.map((i) => {
    const t = Math.round(i.t);
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')} ${i.text}`;
  }).join('\n');
}

/**
 * Value to prefill a form field from the viewer's contact tokens. Only names and company are ever prefilled;
 * email is private by design (the contact lookup never returns it), so it is never revealed to a link holder.
 */
export function prefillFor(key, tokens = {}) {
  const t = (k) => String(tokens[k] ?? '').trim();
  if (key === 'name') return [t('firstname'), t('lastname')].filter(Boolean).join(' ');
  if (key === 'firstname' || key === 'lastname' || key === 'company' || key === 'role' || key === 'city') return t(key);
  return '';
}

/** Move an item inside an array (returns a new array); out-of-range moves are ignored. */
export function moveItem(list, from, to) {
  if (!Array.isArray(list) || from < 0 || to < 0 || from >= list.length || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Split `[[highlighted]]` markers out of a headline (before token filling, so a token value can't add markers). */
export function splitAccent(text) {
  const out = [];
  const re = /\[\[([^\]]{1,120})\]\]/g;
  let last = 0;
  let m;
  const s = String(text ?? '');
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), accent: false });
    out.push({ text: m[1], accent: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), accent: false });
  return out;
}

/** Format seconds as m:ss ('' when unknown). */
export function formatDuration(seconds) {
  const n = Math.round(Number(seconds));
  if (!Number.isFinite(n) || n <= 0) return '';
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

/**
 * Fill {{token}} / {{token|fallback}} from a token map. Unknown tokens without a
 * fallback collapse to '' so a viewer never sees raw braces.
 */
export function fillTokens(text, tokens = {}) {
  return String(text ?? '').replace(/\{\{\s*([a-zA-Z0-9_]{1,40})\s*(?:\|([^}]{0,80}))?\}\}/g, (_, key, fallback) => {
    const v = tokens[key];
    if (v != null && String(v).trim() !== '') return String(v).trim();
    return fallback != null ? fallback.trim() : '';
  });
}

/** Token names used in a config, for the studio's "tokens in this page" hint. */
export function tokensUsed(config) {
  const c = sanitizeConfig(config);
  const blob = [
    c.headline, c.subhead, c.badge, c.brand.tagline, c.cta.label, c.overlay.title, c.overlay.subtitle,
    c.story.heading, ...c.story.body, c.form.title, c.form.subtitle, c.form.successMessage, c.form.privacy,
    c.footer.text, ...c.sections.flatMap((s) => [s.heading, s.body]),
  ].join(' ');
  // sender, brand and duration come from the page itself, not from a contact.
  const own = new Set(['sender', 'brand', 'duration']);
  return [...new Set([...blob.matchAll(/\{\{\s*([a-zA-Z0-9_]{1,40})/g)].map((m) => m[1]))].filter((k) => !own.has(k));
}

/** Keep only viewer-visible keys from tokens given in a URL (?firstname=Ann). */
/** @param {string} [search] @returns {Record<string, string>} */
export function tokensFromQuery(search = '') {
  const params = new URLSearchParams(search);
  const out = {};
  PUBLIC_TOKEN_KEYS.filter((k) => !IMAGE_TOKEN_KEYS.includes(k)).forEach((k) => {
    const v = params.get(k);
    if (v) out[k] = v.slice(0, 80);
  });
  return out;
}

// ---- colour helpers (WCAG 2.x relative luminance / contrast) -------------------------------

function channel(v) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance of a #rrggbb colour. */
export function luminance(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG contrast ratio between two #rrggbb colours (1 to 21). */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Mix `fg` over `bg` at `alpha` (0..1) and return #rrggbb: what semi-transparent text really looks like. */
export function blend(fg, bg, alpha) {
  const p = (h) => { const n = parseInt(String(h).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const [f, b] = [p(fg), p(bg)];
  return `#${f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('')}`;
}

/** White or near-black, whichever reads better on `bg`. */
export function readableOn(bg) {
  return contrastRatio('#ffffff', bg) >= contrastRatio('#0b0b0f', bg) ? '#ffffff' : '#0b0b0f';
}

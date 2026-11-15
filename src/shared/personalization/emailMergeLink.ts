/**
 * Email merge-tag links: ONE link per campaign, the email provider fills in
 * each recipient's values when it sends.
 *
 *   https://watch.example/v/abc?firstName=*|FNAME|*&company=*|COMPANY|*
 *
 * This is the "bulk" counterpart of perContact.personalLink() (one link per
 * known contact). The watch page reads the same canonical token names
 * (publishClient.profileFromQuery), so both link styles render the same video.
 *
 * Tag syntax below follows each provider's documented merge-tag format.
 * Providers change these now and then — keep `fields` small and verified.
 * Checked against provider docs (2026-11): Mailchimp, Salesforce MC (emailaddr), Constant Contact (first name only).
 * Still unconfirmed, send a live test before relying on them: Campaign Monitor, GetResponse (`[[ ]]` vs `{{ }}`), Brevo,
 * MailerLite, Kit, Constant Contact last name/email, Salesforce first name (needs the field in the sending data extension).
 */
// OpenHiggsBolt has no tokenSchema; this small map covers the names that matter for email.
const ALIASES: Record<string, string> = {
  firstname: 'firstName', lastname: 'lastName', fullname: 'fullName', name: 'fullName',
  email: 'email', company: 'company', companyname: 'company', title: 'title', jobtitle: 'title',
  role: 'title', phone: 'phone', location: 'location', city: 'location',
};
export function canonicalTokenKey(name: string): string | null {
  const norm = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  return ALIASES[norm] || null;
}
export const isImageTokenKey = (key: string) => /(url|image|logo|photo|avatar|picture)$/i.test(key);

import PROVIDER_DATA from './emailProviders.json'

/**
 * Provider catalogue: DATA lives in emailProviders.json, which is byte-identical in remix-new-editor
 * (src/lib/editor/personalize) and OpenHiggsBolt (src/shared/personalization). Edit it in one repo, copy it to
 * the other, and run `node scripts/check-email-providers-sync.mjs <path-to-other-repo>` to confirm they match.
 *
 * open/close wrap the provider's field name. `fields` maps OUR canonical token keys to that provider's field.
 * A token with no entry becomes a custom field named by `custom` ({ case: 'upper'|'lower'|'as-is', prefix }),
 * and the caller is told via `unmapped` so the UI can say "create this field in <provider>".
 */
type CustomSpec = { case?: 'upper' | 'lower' | 'as-is'; prefix?: string }
const customName = (spec?: CustomSpec) => (k: string) => {
  const base = spec?.case === 'upper' ? k.toUpperCase() : spec?.case === 'lower' ? k.toLowerCase() : k;
  return `${spec?.prefix || ''}${base}`;
};

export const EMAIL_PROVIDERS: EmailProvider[] = (PROVIDER_DATA as Array<Omit<EmailProvider, 'custom'> & { custom?: CustomSpec }>).map((p) => ({ ...p, custom: customName(p.custom) }));

export interface EmailProvider {
  key: string; label: string; open: string; close: string
  fields: Record<string, string>
  custom?: (k: string) => string
}


export const emailProviderByKey = (key: string): EmailProvider | null => EMAIL_PROVIDERS.find((p) => p.key === key) || null;

/** The merge tag a provider uses for one token, and whether it is a built-in field. */
export function mergeTagFor(provider: EmailProvider, tokenKey: string) {
  const key = canonicalTokenKey(tokenKey) || tokenKey;
  const mapped = provider.fields?.[key];
  const field = mapped ?? (provider.custom ? provider.custom(key) : key);
  return { tag: `${provider.open}${field}${provider.close}`, mapped: mapped != null };
}

/**
 * True for a value that is still an unreplaced merge tag from any provider
 * ("*|FNAME|*", "{{ first_name }}", "%FIRSTNAME%"…). Happens when someone
 * opens the link outside an email (preview, forwarded to a non-subscriber,
 * provider that didn't substitute). The player must not print these.
 */
export function isUnreplacedMergeTag(value: unknown): boolean {
  const v = String(value ?? '').trim();
  if (v.length < 3) return false;
  return EMAIL_PROVIDERS.some((p) => {
    const open = p.open.trim();
    const close = p.close.trim();
    return open && close && v.length > open.length + close.length && v.startsWith(open) && v.endsWith(close);
  });
}

/**
 * Build the campaign link.
 *   mergeTagLink(url, ['firstName', 'company'], provider, { preload: false })
 * Image tokens can't be merge tags (they're URLs), so they're reported in
 * `skipped`; tokens the provider has no built-in field for are in `unmapped`.
 * Tags are appended raw on purpose: encoding them (%2A%7C…) would stop the
 * provider recognising and replacing them.
 */
export function mergeTagLink(
  baseUrl: string,
  tokens: string[] = [],
  provider: EmailProvider | string,
  { preload = true }: { preload?: boolean } = {},
): { link: string; unmapped: string[]; skipped: string[] } {
  const prov = typeof provider === 'string' ? emailProviderByKey(provider) : provider;
  if (!prov) throw new Error('Unknown email provider');
  const url = new URL(baseUrl);
  const parts: string[] = [];
  const unmapped: string[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();
  for (const raw of tokens) {
    const key = canonicalTokenKey(String(raw)) || String(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (isImageTokenKey(key)) {
      skipped.push(key);
      continue;
    }
    const { tag, mapped } = mergeTagFor(prov, key);
    if (!mapped) unmapped.push(key);
    parts.push(`${encodeURIComponent(key)}=${tag}`);
  }
  if (!preload) parts.unshift('preload=none');
  const base = url.toString();
  if (!parts.length) return { link: base, unmapped, skipped };
  const sep = url.search ? '&' : '?';
  return { link: `${base}${sep}${parts.join('&')}`, unmapped, skipped };
}

/** Token names used in a text ({{firstName}}, {{d company "there"}}, {{first name}}), in order, de-duplicated. */
export function tokensInText(text: string): string[] {
  const out: string[] = [];
  for (const m of String(text || '').matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)) {
    const body = m[1].trim().replace(/\s+(["']).*\1$/, '').replace(/^(?:d|up)\s+(?=\S)/, '');
    const key = canonicalTokenKey(body) || body;
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

type LeadBusiness = { name?: string; email?: string; phone?: string; city?: string; region?: string; address?: string }
const LEAD_TOKEN_SOURCES: Record<string, (b: LeadBusiness) => string | undefined> = {
  firstName: () => '',
  fullName: (b: LeadBusiness) => b.name,
  company: (b: LeadBusiness) => b.name,
  email: (b: LeadBusiness) => b.email,
  phone: (b: LeadBusiness) => b.phone,
  title: () => '',
  location: (b: LeadBusiness) => b.city || b.region || b.address,
};

/** The value a saved lead (a business record) gives for one token, or '' when it has none. */
export function leadTokenValue(business: LeadBusiness | null | undefined, tokenKey: string): string {
  const key = canonicalTokenKey(tokenKey) || tokenKey;
  const pick = LEAD_TOKEN_SOURCES[key];
  return String((pick ? pick(business || {}) : '') ?? '').trim().slice(0, 200);
}

/**
 * One personal link per lead: the base link plus the values that lead has for the video's tokens.
 * Image tokens and tokens the lead has no value for are left out (the video shows its fallback).
 * Returns [{ name, email, company, link }].
 */
export function leadLinks(
  baseUrl: string,
  tokens: string[] = [],
  leads: Array<{ business?: LeadBusiness } | LeadBusiness> = [],
): Array<{ name: string; email: string; company: string; link: string }> {
  return leads.map((lead) => {
    const b: LeadBusiness = (lead as { business?: LeadBusiness })?.business || (lead as LeadBusiness) || {};
    const url = new URL(baseUrl);
    for (const raw of tokens) {
      const key = canonicalTokenKey(raw) || String(raw);
      if (!key || isImageTokenKey(key)) continue;
      const v = leadTokenValue(b, key);
      if (v) url.searchParams.set(key, v);
    }
    return { name: b.name || '', email: b.email || '', company: b.name || '', link: url.toString() };
  });
}

const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV of name, email, company, link, for email tools. */
export function leadLinksCsv(rows: Array<{ name: string; email: string; company: string; link: string }>): string {
  const head = ['Name', 'Email', 'Company', 'Link'];
  return [head, ...rows.map((r) => [r.name, r.email, r.company, r.link])].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

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

/**
 * open/close wrap the provider's field name. `fields` maps OUR canonical token
 * keys to that provider's field. A token with no entry is sent as a custom
 * field named by `custom(key)` (default: the key itself); the caller is told
 * via `unmapped` so the UI can say "create this field in <provider>".
 */
export interface EmailProvider {
  key: string; label: string; open: string; close: string
  fields: Record<string, string>
  custom?: (k: string) => string
}

export const EMAIL_PROVIDERS: EmailProvider[] = [
  {
    key: 'mailchimp', label: 'Mailchimp', open: '*|', close: '|*',
    fields: { firstName: 'FNAME', lastName: 'LNAME', email: 'EMAIL', fullName: 'FNAME', company: 'COMPANY', phone: 'PHONE' },
    custom: (k: string) => k.toUpperCase(),
  },
  {
    key: 'activecampaign', label: 'ActiveCampaign', open: '%', close: '%',
    fields: { firstName: 'FIRSTNAME', lastName: 'LASTNAME', email: 'EMAIL', fullName: 'FULLNAME', company: 'ORGNAME' },
    custom: (k: string) => k.toUpperCase(),
  },
  {
    key: 'klaviyo', label: 'Klaviyo', open: '{{ ', close: ' }}',
    fields: { firstName: 'first_name', lastName: 'last_name', email: 'email', company: 'organization', title: 'title' },
    custom: (k: string) => `person.${k}`,
  },
  {
    key: 'hubspot', label: 'HubSpot', open: '{{', close: '}}',
    fields: { firstName: 'contact.firstname', lastName: 'contact.lastname', email: 'contact.email', company: 'contact.company', title: 'contact.jobtitle' },
    custom: (k: string) => `contact.${k.toLowerCase()}`,
  },
  {
    key: 'constantcontact', label: 'Constant Contact', open: '[[', close: ']]',
    fields: { firstName: 'FirstName', lastName: 'LastName', email: 'Email', company: 'CompanyName' },
  },
  {
    key: 'brevo', label: 'Brevo (Sendinblue)', open: '{{ contact.', close: ' }}',
    fields: { firstName: 'FIRSTNAME', lastName: 'LASTNAME', email: 'EMAIL' },
    custom: (k: string) => k.toUpperCase(),
  },
  {
    key: 'mailerlite', label: 'MailerLite', open: '{$', close: '}',
    fields: { firstName: 'name', lastName: 'last_name', email: 'email', company: 'company', phone: 'phone' },
    custom: (k: string) => k.toLowerCase(),
  },
  {
    key: 'kit', label: 'Kit (ConvertKit)', open: '{{ subscriber.', close: ' }}',
    fields: { firstName: 'first_name', email: 'email_address' },
    custom: (k: string) => k,
  },
  {
    key: 'getresponse', label: 'GetResponse', open: '[[', close: ']]',
    fields: { firstName: 'firstname', lastName: 'lastname', email: 'email', fullName: 'name' },
    custom: (k: string) => k.toLowerCase(),
  },
  {
    key: 'campaignmonitor', label: 'Campaign Monitor', open: '[', close: ',fallback=]',
    fields: { firstName: 'firstname', lastName: 'lastname', email: 'email', fullName: 'fullname' },
    custom: (k: string) => k.toLowerCase(),
  },
  {
    key: 'salesforcemc', label: 'Salesforce Marketing Cloud', open: '%%', close: '%%',
    fields: { firstName: 'FirstName', lastName: 'LastName', email: 'EmailAddress', company: 'Company' },
  },
  {
    // Generic: {{token}} with our own canonical names, for tools that map by name.
    key: 'custom', label: 'Custom ({{token}})', open: '{{', close: '}}',
    fields: {},
    custom: (k: string) => k,
  },
];

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

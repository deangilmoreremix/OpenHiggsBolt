import { describe, it, expect } from 'vitest';
import { withPageTracking } from '../../../../lib/pageCsp.js';

const CSP = ["default-src 'self'", "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net", "connect-src 'self' https://*.supabase.co", "img-src 'self' https:"].join('; ');

describe('tracking hosts in the content-security policy', () => {
  it('are allowed on public landing pages only', () => {
    const page = withPageTracking(CSP, '/p/my-page');
    expect(page).toContain('https://www.googletagmanager.com'); expect(page).toContain('https://connect.facebook.net'); expect(page).toContain('https://analytics.tiktok.com');
    expect(page.split('; ').find((d) => d.startsWith('script-src '))).toContain('googletagmanager.com');
    expect(page.split('; ').find((d) => d.startsWith('connect-src '))).toContain('google-analytics.com');
    expect(page.split('; ').find((d) => d.startsWith('img-src '))).toBe("img-src 'self' https:");
    for (const path of ['/', '/studio', '/studio/video-pages', '/api/landing-pages', '/pricing', '']) expect(withPageTracking(CSP, path)).toBe(CSP);
    expect(withPageTracking(CSP, '/p')).toBe(CSP); expect(withPageTracking(CSP, '/pages/x')).toBe(CSP);
  });
  it('never loosens the policy for everyone: no wildcard script host, no unsafe additions', () => {
    const script = withPageTracking(CSP, '/p/x').split('; ').find((d) => d.startsWith('script-src '));
    expect(script).not.toMatch(/\*\s|https:\s*$|http:/); expect(script).toContain("'self'");
  });
});

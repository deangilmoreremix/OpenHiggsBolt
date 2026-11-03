import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { hasSmartVideoGo, hasSmartVideoViral } from '../entitlements';

// Access is granted by the owner (CSV list / Stripe purchase), never by
// signing in alone: the Clerk sign-up page is public.

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const netlifyGuard = require('../../../netlify/functions/shared/entitlementAuth.js');

describe('hasSmartVideoGo: owner-granted access only', () => {
  it('denies a signed-in user with no entitlement row (sign-up page is public)', () => {
    expect(hasSmartVideoGo({} as never, undefined)).toBe(false);
    expect(hasSmartVideoGo(null, null)).toBe(false);
  });

  it('grants rows holding smartvideo_go, smartvideo_ai or founders', () => {
    expect(hasSmartVideoGo({ smartvideo_go: true }, 'active')).toBe(true);
    expect(hasSmartVideoGo({ smartvideo_ai: true } as never, 'active')).toBe(true);
    expect(hasSmartVideoGo({ smartvideo_go: false, founders: true }, 'inactive')).toBe(true);
  });

  it('keeps granted buyers whose rows read inactive/expired (production data)', () => {
    expect(hasSmartVideoGo({ smartvideo_go: true }, 'inactive')).toBe(true);
    expect(hasSmartVideoGo({ smartvideo_go: true }, 'expired')).toBe(true);
  });

  it('denies revoked rows and rows without a grant', () => {
    expect(hasSmartVideoGo({ smartvideo_go: true }, 'revoked')).toBe(false);
    expect(hasSmartVideoGo({ smartvideo_go: false }, 'active')).toBe(false);
    expect(hasSmartVideoGo({ apps_studio_diy: true } as never, 'active')).toBe(false);
  });

  it('does not grant go-ai-viral by default', () => {
    expect(hasSmartVideoViral({ smartvideo_go: false }, undefined)).toBe(false);
    expect(hasSmartVideoViral({ smartvideo_go: true, smartvideo_ai: true }, 'active')).toBe(false);
  });

  it('grants go-ai-viral to buyers (smartvideo_viral or legacy go_viral_ai)', () => {
    expect(hasSmartVideoViral({ smartvideo_go: true, smartvideo_viral: true }, 'active')).toBe(true);
    expect(hasSmartVideoViral({ go_viral_ai: true } as never, 'active')).toBe(true);
    expect(hasSmartVideoViral({ smartvideo_viral: true } as never, 'revoked')).toBe(false);
  });
});

describe('Netlify guard default access', () => {
  function fakeSupabase(row: unknown) {
    const query = {
      select: () => query,
      eq: () => query,
      update: () => query,
      maybeSingle: async () => ({ data: row }),
    };
    return { from: () => query };
  }

  it('module loads (plain JS, no TypeScript syntax)', () => {
    expect(typeof netlifyGuard.requirePaidEntitlement).toBe('function');
  });

  it('denies a user with no entitlement row', async () => {
    const result = await netlifyGuard.resolveHasSmartVideoGo(fakeSupabase(null), 'user_123', 'stranger@example.com');
    expect(result.hasSmartVideoGo).toBe(false);
    expect(result.hasSmartVideoViral).toBe(false);
  });

  it('grants a user with an owner-granted row', async () => {
    const result = await netlifyGuard.resolveHasSmartVideoGo(
      fakeSupabase({ clerk_user_id: 'user_123', entitlements: { smartvideo_go: true }, status: 'active' }),
      'user_123',
      'buyer@example.com'
    );
    expect(result.hasSmartVideoGo).toBe(true);
  });

  it('denies a revoked row with no permanent grant', async () => {
    const result = await netlifyGuard.resolveHasSmartVideoGo(
      fakeSupabase({ clerk_user_id: 'user_123', entitlements: { smartvideo_go: true }, status: 'revoked' }),
      'user_123',
      'buyer@example.com'
    );
    expect(result.hasSmartVideoGo).toBe(false);
  });
});

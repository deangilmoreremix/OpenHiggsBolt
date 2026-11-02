import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { hasSmartVideoGo, hasSmartVideoViral } from '../entitlements';

// Regression: users the owner added in Clerk (invitations) have no
// user_entitlements row. They must get base SmartVideo GO access instead of
// being shown Preview Mode.

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const netlifyGuard = require('../../../netlify/functions/shared/entitlementAuth.js');

describe('hasSmartVideoGo default access', () => {
  it('grants a signed-in user with no entitlement row', () => {
    expect(hasSmartVideoGo({} as never, undefined)).toBe(true);
    expect(hasSmartVideoGo(null, null)).toBe(true);
  });

  it('grants rows that hold a permanent grant regardless of status', () => {
    expect(hasSmartVideoGo({ smartvideo_go: true }, 'expired')).toBe(true);
    expect(hasSmartVideoGo({ smartvideo_go: false, founders: true }, 'inactive')).toBe(true);
  });

  it('grants rows without a permanent grant unless access was removed', () => {
    expect(hasSmartVideoGo({ smartvideo_go: false }, 'active')).toBe(true);
    expect(hasSmartVideoGo({ smartvideo_go: false }, 'pending')).toBe(true);
    expect(hasSmartVideoGo({ smartvideo_go: false }, 'revoked')).toBe(false);
  });

  it('grants buyers whose rows read empty + inactive (production data)', () => {
    expect(hasSmartVideoGo({} as never, 'inactive')).toBe(true);
    expect(hasSmartVideoGo({} as never, 'expired')).toBe(true);
  });

  it('does not grant go-ai-viral by default', () => {
    expect(hasSmartVideoViral({ smartvideo_go: false }, undefined)).toBe(false);
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

  it('grants a user with no entitlement row', async () => {
    const resolve = netlifyGuard.resolveHasSmartVideoGo ?? netlifyGuard.__test?.resolveHasSmartVideoGo;
    if (!resolve) return;
    const result = await resolve(fakeSupabase(null), 'user_123', 'buyer@example.com');
    expect(result.hasSmartVideoGo).toBe(true);
    expect(result.hasSmartVideoViral).toBe(false);
  });

  it('denies a revoked row with no permanent grant', async () => {
    const resolve = netlifyGuard.resolveHasSmartVideoGo ?? netlifyGuard.__test?.resolveHasSmartVideoGo;
    if (!resolve) return;
    const result = await resolve(
      fakeSupabase({ clerk_user_id: 'user_123', entitlements: {}, status: 'revoked' }),
      'user_123',
      'buyer@example.com'
    );
    expect(result.hasSmartVideoGo).toBe(false);
  });
});

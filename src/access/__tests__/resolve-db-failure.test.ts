import { describe, it, expect, vi } from 'vitest';

// Regression: when the entitlement lookup fails (database timeout), signed-in
// the super user keeps everything and everyone else gets an error (the
// browser then keeps their last confirmed access) - never a guess.

let email = 'deanvideoremix.io@gmail.com';
vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: 'user_dean' }),
  currentUser: async () => ({ id: 'user_dean', emailAddresses: [{ emailAddress: email }] }),
}));

const calls: string[] = [];
vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => {
    const q: any = {
      select: () => q,
      eq: (col: string) => { calls.push(col); return q; },
      maybeSingle: async () => ({ data: null, error: { message: 'canceling statement due to statement timeout' } }),
    };
    return { from: () => q };
  },
}));

import { resolveSmartVideoAccess } from '../resolveAccess';

describe('resolveSmartVideoAccess when the database fails', () => {
  it('keeps the super user on full access', async () => {
    calls.length = 0;
    const result = await resolveSmartVideoAccess();
    expect(result.state).toBe('paid');
    if (result.state === 'signed_out') throw new Error('unexpected');
    expect(result.access.isSuperUser).toBe(true);
    expect(result.access.hasSmartVideoViral).toBe(true);
    // Only the one lookup: no placeholder-adoption queries piled on.
    expect(calls).toEqual(['clerk_user_id']);
  });

  it('reports "unknown" for anyone else instead of guessing paid or unpaid', async () => {
    email = 'buyer@example.com';
    await expect(resolveSmartVideoAccess()).rejects.toThrow(/lookup failed/i);
  });
});

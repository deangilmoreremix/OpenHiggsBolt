import { describe, it, expect, vi, afterEach } from 'vitest';
import { findClerkUserIdByEmail, inviteBuyer, type ClerkLike } from '../buyerOnboarding';
import { entitlementsForProduct } from '../stripeProductEntitlements';

function fakeClerk(users: string[] = [], failInvite = false) {
  const invites: any[] = [];
  const client: ClerkLike = {
    users: { getUserList: async () => ({ data: users.map((id) => ({ id })) }) },
    invitations: {
      createInvitation: async (p) => {
        if (failInvite) throw new Error('boom');
        invites.push(p);
        return { id: 'inv_1' };
      },
    },
  };
  return { client, invites };
}

describe('Stripe product -> access', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('maps GO AI and Viral products, ignores other apps', () => {
    expect(entitlementsForProduct('prod_UqMGFO6fCK3OvH')).toEqual(['smartvideo_go', 'smartvideo_ai']);
    expect(entitlementsForProduct('prod_VAETfUO4Od22Qc')).toEqual(['smartvideo_viral']);
    expect(entitlementsForProduct('prod_V83t0syihXOVd4')).toEqual([]); // Thumbnailsy
    expect(entitlementsForProduct(undefined)).toEqual([]);
  });

  it('env overrides and extends the defaults, dropping unknown keys', () => {
    vi.stubEnv('STRIPE_PRODUCT_ENTITLEMENTS', JSON.stringify({ prod_NEW: ['smartvideo_go', 'bogus'] }));
    expect(entitlementsForProduct('prod_NEW')).toEqual(['smartvideo_go']);
  });
});

describe('Stripe buyer -> Clerk', () => {
  it('finds an existing account by email', async () => {
    expect(await findClerkUserIdByEmail('a@b.com', fakeClerk(['user_1']).client)).toBe('user_1');
    expect(await findClerkUserIdByEmail('a@b.com', fakeClerk([]).client)).toBeNull();
  });

  it('emails a Clerk invitation to a new buyer, once', async () => {
    const { client, invites } = fakeClerk();
    expect(await inviteBuyer('new@buyer.com', ['smartvideo_go'], client)).toBe(true);
    expect(invites[0]).toMatchObject({
      emailAddress: 'new@buyer.com',
      notify: true,
      ignoreExisting: true,
      publicMetadata: { purchased: ['smartvideo_go'] },
    });
    expect(invites[0].redirectUrl).toMatch(/\/sign-up$/);
  });

  it('never throws when the invitation fails (purchase stays recorded)', async () => {
    expect(await inviteBuyer('x@y.com', ['smartvideo_go'], fakeClerk([], true).client)).toBe(false);
    expect(await inviteBuyer('x@y.com', ['smartvideo_go'], null)).toBe(false);
  });
});

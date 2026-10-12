import { describe, it, expect, beforeEach, vi } from 'vitest';

const { store, grantEntitlementMock } = vi.hoisted(() => {
  type FakeUser = {
    clerk_user_id: string;
    email: string;
    entitlements: Record<string, boolean>;
    status: string;
  };

  const store = {
    users: new Map<string, FakeUser>(),
    purchases: [] as Array<Record<string, any>>,
  };

  const grantEntitlementMock = vi.fn(
    async (clerkUserId: string, email: string, entitlementKey: string) => {
      const existing =
        store.users.get(clerkUserId) ||
        ({
          clerk_user_id: clerkUserId,
          email,
          entitlements: {},
          status: 'active',
        } as FakeUser);
      existing.entitlements[entitlementKey] = true;
      existing.status = 'active';
      store.users.set(clerkUserId, existing);
    }
  );

  return { store, grantEntitlementMock };
});

vi.mock('@/access/resolveAccess', () => ({
  grantEntitlement: grantEntitlementMock,
}));

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => ({
    from(table: string) {
      if (table === 'user_entitlements') {
        return {
          select: () => ({
            eq: (column: string, value: string) => ({
              maybeSingle: async () => {
                if (column === 'clerk_user_id') {
                  return { data: store.users.get(value) || null, error: null };
                }
                if (column === 'email') {
                  const found = [...store.users.values()].find((u) => u.email === value);
                  return { data: found || null, error: null };
                }
                return { data: null, error: null };
              },
            }),
          }),
        };
      }

      if (table === 'reseller_purchases') {
        return {
          insert: async (row: Record<string, any>) => {
            const duplicate = store.purchases.find(
              (p) =>
                (row.stripe_session_id && p.stripe_session_id === row.stripe_session_id) ||
                (row.clerk_user_id &&
                  p.clerk_user_id === row.clerk_user_id &&
                  p.package_id === row.package_id)
            );
            if (duplicate) {
              return { data: null, error: { code: '23505', message: 'duplicate key value' } };
            }
            store.purchases.push(row);
            return { data: row, error: null };
          },
        };
      }

      throw new Error(`unexpected table: ${table}`);
    },
  }),
}));

import {
  applyResellerPurchase,
  evaluateUpgradeEligibility,
  getResellerEntitlements,
  getResellerUserState,
  hasDiyEntitlement,
  hasResellerEntitlement,
  hasTrainingEntitlement,
  isResellerStatusActive,
} from './entitlements';

function user(
  entitlements: Record<string, boolean>,
  status: string | null = 'active'
) {
  return { entitlements, status };
}

describe('reseller entitlement helpers', () => {
  beforeEach(() => {
    store.users.clear();
    store.purchases.length = 0;
    grantEntitlementMock.mockClear();
  });

  it('isResellerStatusActive treats active/empty/absent status as active', () => {
    expect(isResellerStatusActive('active')).toBe(true);
    expect(isResellerStatusActive('')).toBe(true);
    expect(isResellerStatusActive(null)).toBe(true);
    expect(isResellerStatusActive(undefined)).toBe(true);
    expect(isResellerStatusActive('inactive')).toBe(false);
    expect(isResellerStatusActive('refunded')).toBe(false);
  });

  it('getResellerEntitlements returns the active reseller keys held', () => {
    expect(getResellerEntitlements(user({ apps_studio_diy: true }))).toEqual([
      'apps_studio_diy',
    ]);
    expect(
      getResellerEntitlements(
        user({ apps_studio_diy: true, apps_studio_training: true })
      )
    ).toEqual(['apps_studio_diy', 'apps_studio_training']);
    expect(getResellerEntitlements(user({ smartvideo_go: true }))).toEqual([]);
    expect(getResellerEntitlements(user({ apps_studio_diy: true }, 'refunded'))).toEqual([]);
    expect(getResellerEntitlements(null)).toEqual([]);
  });

  it('hasResellerEntitlement only answers for reseller keys', () => {
    const diyUser = user({ apps_studio_diy: true });
    expect(hasResellerEntitlement(diyUser, 'apps_studio_diy')).toBe(true);
    expect(hasResellerEntitlement(diyUser, 'apps_studio_training')).toBe(false);
    expect(hasResellerEntitlement(diyUser, 'smartvideo_go')).toBe(false);
    expect(hasResellerEntitlement(null, 'apps_studio_diy')).toBe(false);
    expect(hasDiyEntitlement(diyUser)).toBe(true);
    expect(hasTrainingEntitlement(diyUser)).toBe(false);
  });

  it('keeps entitlements isolated between users', () => {
    const userA = user({ apps_studio_diy: true, apps_studio_training: true });
    const userB = user({});
    const userC = user({ apps_studio_diy: true }, 'refunded');

    expect(getResellerEntitlements(userA)).toEqual([
      'apps_studio_diy',
      'apps_studio_training',
    ]);
    expect(getResellerEntitlements(userB)).toEqual([]);
    expect(getResellerEntitlements(userC)).toEqual([]);
    expect(hasResellerEntitlement(userA, 'apps_studio_training')).toBe(true);
    expect(hasResellerEntitlement(userB, 'apps_studio_training')).toBe(false);
  });

  describe('upgrade eligibility', () => {
    it('allows an active DIY owner to upgrade to training', () => {
      expect(evaluateUpgradeEligibility(user({ apps_studio_diy: true }))).toEqual({
        eligible: true,
      });
    });

    it('rejects an upgrade for an account that already owns training', () => {
      const result = evaluateUpgradeEligibility(
        user({ apps_studio_diy: true, apps_studio_training: true })
      );
      expect(result.eligible).toBe(false);
      expect(result).toMatchObject({ reason: 'ALREADY_TRAINING' });

      const trainingOnly = evaluateUpgradeEligibility(
        user({ apps_studio_training: true })
      );
      expect(trainingOnly).toMatchObject({ reason: 'ALREADY_TRAINING' });
    });

    it('rejects an upgrade for an account without an active DIY purchase', () => {
      expect(evaluateUpgradeEligibility(user({}))).toMatchObject({
        eligible: false,
        reason: 'UPGRADE_NOT_ELIGIBLE',
      });
      expect(evaluateUpgradeEligibility(null)).toMatchObject({
        eligible: false,
        reason: 'UPGRADE_NOT_ELIGIBLE',
      });
      expect(
        evaluateUpgradeEligibility(user({ apps_studio_diy: true }, 'refunded'))
      ).toMatchObject({ eligible: false, reason: 'UPGRADE_NOT_ELIGIBLE' });
    });
  });

  describe('getResellerUserState', () => {
    it('derives flags from the stored entitlements row', async () => {
      store.users.set('user_1', {
        clerk_user_id: 'user_1',
        email: 'a@example.com',
        entitlements: { apps_studio_diy: true },
        status: 'active',
      });

      const state = await getResellerUserState('user_1');
      expect(state.exists).toBe(true);
      expect(state.hasDiy).toBe(true);
      expect(state.hasTraining).toBe(false);
      expect(state.resellerEntitlements).toEqual(['apps_studio_diy']);
    });

    it('reports a missing row as unpaid', async () => {
      const state = await getResellerUserState('user_missing');
      expect(state.exists).toBe(false);
      expect(state.hasDiy).toBe(false);
      expect(state.hasTraining).toBe(false);
    });
  });

  describe('applyResellerPurchase', () => {
    it('grants apps_studio_diy and records the DIY purchase', async () => {
      const result = await applyResellerPurchase({
        clerkUserId: 'user_1',
        email: 'Buyer@Example.com',
        packageId: 'diy',
        stripeSessionId: 'cs_test_1',
        stripeCustomerId: 'cus_1',
        amountTotal: 19700,
        currency: 'usd',
      });

      expect(result.granted).toEqual(['apps_studio_diy']);
      expect(result.alreadyGranted).toEqual([]);
      expect(result.purchaseRecorded).toBe(true);
      expect(result.duplicatePurchase).toBe(false);

      expect(grantEntitlementMock).toHaveBeenCalledWith(
        'user_1',
        'buyer@example.com',
        'apps_studio_diy',
        'stripe',
        expect.objectContaining({ stripe_customer_id: 'cus_1' })
      );
      expect(store.purchases).toHaveLength(1);
      expect(store.purchases[0]).toMatchObject({
        clerk_user_id: 'user_1',
        email: 'buyer@example.com',
        package_id: 'diy',
        stripe_session_id: 'cs_test_1',
      });
    });

    it('is idempotent when the same Stripe session is processed twice', async () => {
      const input = {
        clerkUserId: 'user_1',
        email: 'buyer@example.com',
        packageId: 'diy' as const,
        stripeSessionId: 'cs_test_dup',
      };

      const first = await applyResellerPurchase(input);
      expect(first.granted).toEqual(['apps_studio_diy']);
      expect(grantEntitlementMock).toHaveBeenCalledTimes(1);

      const second = await applyResellerPurchase(input);
      expect(second.granted).toEqual([]);
      expect(second.alreadyGranted).toEqual(['apps_studio_diy']);
      expect(second.purchaseRecorded).toBe(false);
      expect(second.duplicatePurchase).toBe(true);
      expect(grantEntitlementMock).toHaveBeenCalledTimes(1);
      expect(store.purchases).toHaveLength(1);
    });

    it('prevents a duplicate entitlement when the same package is bought twice', async () => {
      await applyResellerPurchase({
        clerkUserId: 'user_1',
        email: 'buyer@example.com',
        packageId: 'training',
        stripeSessionId: 'cs_test_training_1',
      });

      expect(store.users.get('user_1')?.entitlements).toEqual({
        apps_studio_diy: true,
        apps_studio_training: true,
      });

      const second = await applyResellerPurchase({
        clerkUserId: 'user_1',
        email: 'buyer@example.com',
        packageId: 'training',
        stripeSessionId: 'cs_test_training_2',
      });

      expect(second.granted).toEqual([]);
      expect(second.alreadyGranted).toEqual([
        'apps_studio_diy',
        'apps_studio_training',
      ]);
      expect(second.duplicatePurchase).toBe(true);
      expect(grantEntitlementMock).toHaveBeenCalledTimes(2);
      expect(store.purchases).toHaveLength(1);
    });

    it('grants only training for the upgrade purchase and keeps DIY', async () => {
      store.users.set('user_1', {
        clerk_user_id: 'user_1',
        email: 'buyer@example.com',
        entitlements: { apps_studio_diy: true },
        status: 'active',
      });

      const result = await applyResellerPurchase({
        clerkUserId: 'user_1',
        email: 'buyer@example.com',
        packageId: 'upgrade',
        stripeSessionId: 'cs_test_upgrade_1',
        amountTotal: 40000,
      });

      expect(result.granted).toEqual(['apps_studio_training']);
      expect(store.users.get('user_1')?.entitlements).toEqual({
        apps_studio_diy: true,
        apps_studio_training: true,
      });
    });

    it('falls back to an email lookup when the session has no clerk user id', async () => {
      store.users.set('user_by_email', {
        clerk_user_id: 'user_by_email',
        email: 'buyer@example.com',
        entitlements: {},
        status: 'active',
      });

      const result = await applyResellerPurchase({
        email: 'Buyer@Example.com',
        packageId: 'diy',
        stripeSessionId: 'cs_test_email_1',
      });

      expect(result.clerkUserId).toBe('user_by_email');
      expect(result.granted).toEqual(['apps_studio_diy']);
      expect(result.purchaseRecorded).toBe(true);
    });

    it('does not grant or record anything when no user can be resolved', async () => {
      const result = await applyResellerPurchase({
        email: 'stranger@example.com',
        packageId: 'diy',
        stripeSessionId: 'cs_test_stranger_1',
      });

      expect(result.reason).toBe('NO_USER');
      expect(result.granted).toEqual([]);
      expect(result.purchaseRecorded).toBe(false);
      expect(grantEntitlementMock).not.toHaveBeenCalled();
      expect(store.purchases).toHaveLength(0);
    });

    it('keeps purchases isolated between users', async () => {
      await applyResellerPurchase({
        clerkUserId: 'user_a',
        email: 'a@example.com',
        packageId: 'diy',
        stripeSessionId: 'cs_test_a',
      });
      await applyResellerPurchase({
        clerkUserId: 'user_b',
        email: 'b@example.com',
        packageId: 'diy',
        stripeSessionId: 'cs_test_b',
      });

      expect(store.purchases).toHaveLength(2);
      expect(store.users.get('user_a')?.entitlements).toEqual({ apps_studio_diy: true });
      expect(store.users.get('user_b')?.entitlements).toEqual({ apps_studio_diy: true });
      expect(store.users.get('user_c')).toBeUndefined();
    });
  });
});

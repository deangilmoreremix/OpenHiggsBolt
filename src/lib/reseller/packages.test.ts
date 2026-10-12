import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  RESELLER_ENTITLEMENTS,
  RESELLER_PACKAGES,
  RESELLER_PACKAGE_IDS,
  RESELLER_PRICE_ENV_KEYS,
  RESELLER_PURCHASABLE_PACKAGE_IDS,
  getResellerMissingConfig,
  getResellerPackage,
  getResellerPackageIdForPriceId,
  getResellerPurchasablePackages,
  getResellerStripePriceId,
  getResellerUpgradeRule,
  isResellerEntitlementKey,
  isResellerPackageId,
  isResellerPurchasablePackageId,
  isResellerStripeConfigured,
} from './packages';

const ENV_KEYS = [
  'STRIPE_SECRET_KEY',
  'RESELLER_STRIPE_PRICE_DIY',
  'RESELLER_STRIPE_PRICE_TRAINING',
  'RESELLER_STRIPE_PRICE_UPGRADE',
] as const;

let savedEnv: Record<string, string | undefined> = {};

function clearResellerEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe('reseller packages table', () => {
  beforeEach(() => {
    savedEnv = {};
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    clearResellerEnv();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = savedEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('defines exactly the three reseller packages', () => {
    expect([...RESELLER_PACKAGE_IDS]).toEqual(['diy', 'training', 'upgrade']);
    expect(Object.keys(RESELLER_PACKAGES).sort()).toEqual(['diy', 'training', 'upgrade']);
  });

  it('defines the reseller entitlement keys', () => {
    expect(RESELLER_ENTITLEMENTS.DIY).toBe('apps_studio_diy');
    expect(RESELLER_ENTITLEMENTS.TRAINING).toBe('apps_studio_training');
  });

  it('prices the three packages at $197 / $597 / $400 USD', () => {
    expect(RESELLER_PACKAGES.diy.priceCents).toBe(19700);
    expect(RESELLER_PACKAGES.training.priceCents).toBe(59700);
    expect(RESELLER_PACKAGES.upgrade.priceCents).toBe(40000);

    for (const id of RESELLER_PACKAGE_IDS) {
      expect(RESELLER_PACKAGES[id].currency).toBe('usd');
    }
  });

  it('grants apps_studio_diy for DIY and both keys for Apps + Training', () => {
    expect(RESELLER_PACKAGES.diy.grantsEntitlements).toEqual(['apps_studio_diy']);
    expect(RESELLER_PACKAGES.training.grantsEntitlements).toEqual([
      'apps_studio_diy',
      'apps_studio_training',
    ]);
  });

  it('grants only training for the upgrade and never re-grants DIY', () => {
    expect(RESELLER_PACKAGES.upgrade.grantsEntitlements).toEqual(['apps_studio_training']);
  });

  it('defines the DIY -> training upgrade rule at the $400 difference', () => {
    const rule = getResellerUpgradeRule();
    expect(rule.fromEntitlement).toBe('apps_studio_diy');
    expect(rule.toEntitlement).toBe('apps_studio_training');
    expect(rule.blockedByEntitlement).toBe('apps_studio_training');
    expect(rule.priceCents).toBe(40000);
    expect(rule.priceEnvKey).toBe('RESELLER_STRIPE_PRICE_UPGRADE');
  });

  it('exposes only diy and training as directly purchasable packages', () => {
    expect([...RESELLER_PURCHASABLE_PACKAGE_IDS]).toEqual(['diy', 'training']);
    expect(getResellerPurchasablePackages().map((p) => p.id)).toEqual(['diy', 'training']);
    expect(isResellerPurchasablePackageId('diy')).toBe(true);
    expect(isResellerPurchasablePackageId('training')).toBe(true);
    expect(isResellerPurchasablePackageId('upgrade')).toBe(false);
    expect(isResellerPurchasablePackageId('nope')).toBe(false);
  });

  it('recognises package ids and entitlement keys', () => {
    expect(isResellerPackageId('diy')).toBe(true);
    expect(isResellerPackageId('upgrade')).toBe(true);
    expect(isResellerPackageId('pro')).toBe(false);
    expect(isResellerEntitlementKey('apps_studio_diy')).toBe(true);
    expect(isResellerEntitlementKey('apps_studio_training')).toBe(true);
    expect(isResellerEntitlementKey('smartvideo_go')).toBe(false);
  });

  it('never hardcodes Stripe price ids and reads them from dedicated env vars', () => {
    expect(RESELLER_PRICE_ENV_KEYS).toEqual({
      diy: 'RESELLER_STRIPE_PRICE_DIY',
      training: 'RESELLER_STRIPE_PRICE_TRAINING',
      upgrade: 'RESELLER_STRIPE_PRICE_UPGRADE',
    });

    expect(getResellerStripePriceId('diy')).toBe('');
    process.env.RESELLER_STRIPE_PRICE_DIY = 'price_diy_test';
    expect(getResellerStripePriceId('diy')).toBe('price_diy_test');
  });

  it('maps configured Stripe price ids back to package ids', () => {
    process.env.RESELLER_STRIPE_PRICE_DIY = 'price_diy_test';
    process.env.RESELLER_STRIPE_PRICE_TRAINING = 'price_training_test';
    process.env.RESELLER_STRIPE_PRICE_UPGRADE = 'price_upgrade_test';

    expect(getResellerPackageIdForPriceId('price_diy_test')).toBe('diy');
    expect(getResellerPackageIdForPriceId('price_training_test')).toBe('training');
    expect(getResellerPackageIdForPriceId('price_upgrade_test')).toBe('upgrade');
    expect(getResellerPackageIdForPriceId('price_unknown')).toBeNull();
    expect(getResellerPackageIdForPriceId('')).toBeNull();
    expect(getResellerPackageIdForPriceId(undefined)).toBeNull();
  });

  it('does not map prices that belong to the pre-existing products', () => {
    process.env.RESELLER_STRIPE_PRICE_DIY = 'price_diy_test';
    expect(getResellerPackageIdForPriceId('price_smartvideo_go')).toBeNull();
  });

  it('reports missing Stripe configuration for the whole reseller store', () => {
    expect(getResellerMissingConfig()).toEqual([
      'STRIPE_SECRET_KEY',
      'RESELLER_STRIPE_PRICE_DIY',
      'RESELLER_STRIPE_PRICE_TRAINING',
      'RESELLER_STRIPE_PRICE_UPGRADE',
    ]);
    expect(isResellerStripeConfigured()).toBe(false);
  });

  it('reports missing configuration per package', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    expect(getResellerMissingConfig(['diy'])).toEqual(['RESELLER_STRIPE_PRICE_DIY']);
    expect(getResellerMissingConfig(['training'])).toEqual(['RESELLER_STRIPE_PRICE_TRAINING']);
    expect(getResellerMissingConfig(['upgrade'])).toEqual(['RESELLER_STRIPE_PRICE_UPGRADE']);

    process.env.RESELLER_STRIPE_PRICE_DIY = 'price_diy_test';
    expect(getResellerMissingConfig(['diy'])).toEqual([]);
    expect(isResellerStripeConfigured(['diy'])).toBe(true);
    expect(isResellerStripeConfigured()).toBe(false);
  });

  it('getResellerPackage returns null for unknown ids', () => {
    expect(getResellerPackage('diy')).toBe(RESELLER_PACKAGES.diy);
    expect(getResellerPackage('training')).toBe(RESELLER_PACKAGES.training);
    expect(getResellerPackage('upgrade')).toBe(RESELLER_PACKAGES.upgrade);
    expect(getResellerPackage('mystery')).toBeNull();
    expect(getResellerPackage(null)).toBeNull();
    expect(getResellerPackage(42)).toBeNull();
  });
});

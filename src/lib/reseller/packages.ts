export const RESELLER_ENTITLEMENTS = {
  DIY: 'apps_studio_diy',
  TRAINING: 'apps_studio_training',
} as const;

export type ResellerEntitlementKey =
  (typeof RESELLER_ENTITLEMENTS)[keyof typeof RESELLER_ENTITLEMENTS];

export const RESELLER_PACKAGE_IDS = ['diy', 'training', 'upgrade'] as const;

export type ResellerPackageId = (typeof RESELLER_PACKAGE_IDS)[number];

export const RESELLER_PRICE_ENV_KEYS = {
  diy: 'RESELLER_STRIPE_PRICE_DIY',
  training: 'RESELLER_STRIPE_PRICE_TRAINING',
  upgrade: 'RESELLER_STRIPE_PRICE_UPGRADE',
} as const;

export const RESELLER_STRIPE_SECRET_ENV_KEY = 'STRIPE_SECRET_KEY';

export const RESELLER_PURCHASABLE_PACKAGE_IDS: ResellerPackageId[] = ['diy', 'training'];

export interface ResellerUpgradeRule {
  fromEntitlement: ResellerEntitlementKey;
  toEntitlement: ResellerEntitlementKey;
  blockedByEntitlement: ResellerEntitlementKey;
  priceCents: number;
  currency: 'usd';
  priceEnvKey: string;
}

export interface ResellerPackage {
  id: ResellerPackageId;
  name: string;
  priceCents: number;
  currency: 'usd';
  grantsEntitlements: ResellerEntitlementKey[];
  priceEnvKey: string;
  upgrade?: ResellerUpgradeRule;
}

export const RESELLER_PACKAGES: Record<ResellerPackageId, ResellerPackage> = {
  diy: {
    id: 'diy',
    name: 'DIY App Builder',
    priceCents: 19700,
    currency: 'usd',
    grantsEntitlements: [RESELLER_ENTITLEMENTS.DIY],
    priceEnvKey: RESELLER_PRICE_ENV_KEYS.diy,
    upgrade: {
      fromEntitlement: RESELLER_ENTITLEMENTS.DIY,
      toEntitlement: RESELLER_ENTITLEMENTS.TRAINING,
      blockedByEntitlement: RESELLER_ENTITLEMENTS.TRAINING,
      priceCents: 40000,
      currency: 'usd',
      priceEnvKey: RESELLER_PRICE_ENV_KEYS.upgrade,
    },
  },
  training: {
    id: 'training',
    name: 'Apps + Training',
    priceCents: 59700,
    currency: 'usd',
    grantsEntitlements: [
      RESELLER_ENTITLEMENTS.DIY,
      RESELLER_ENTITLEMENTS.TRAINING,
    ],
    priceEnvKey: RESELLER_PRICE_ENV_KEYS.training,
  },
  upgrade: {
    id: 'upgrade',
    name: 'Apps + Training Upgrade',
    priceCents: 40000,
    currency: 'usd',
    grantsEntitlements: [RESELLER_ENTITLEMENTS.TRAINING],
    priceEnvKey: RESELLER_PRICE_ENV_KEYS.upgrade,
  },
};

export function isResellerPackageId(value: unknown): value is ResellerPackageId {
  return (
    typeof value === 'string' &&
    (RESELLER_PACKAGE_IDS as readonly string[]).includes(value)
  );
}

export function isResellerPurchasablePackageId(
  value: unknown
): value is ResellerPackageId {
  return (
    isResellerPackageId(value) &&
    RESELLER_PURCHASABLE_PACKAGE_IDS.includes(value)
  );
}

export function getResellerPackage(id: unknown): ResellerPackage | null {
  return isResellerPackageId(id) ? RESELLER_PACKAGES[id] : null;
}

export function getResellerPurchasablePackages(): ResellerPackage[] {
  return RESELLER_PURCHASABLE_PACKAGE_IDS.map((id) => RESELLER_PACKAGES[id]);
}

export function isResellerEntitlementKey(value: unknown): value is ResellerEntitlementKey {
  if (typeof value !== 'string') return false;
  return (Object.values(RESELLER_ENTITLEMENTS) as string[]).includes(value);
}

function readEnv(key: string): string {
  return (process.env[key] || '').trim();
}

export function getResellerPriceEnvKey(id: ResellerPackageId): string {
  return RESELLER_PACKAGES[id].priceEnvKey;
}

export function getResellerStripePriceId(id: ResellerPackageId): string {
  return readEnv(getResellerPriceEnvKey(id));
}

export function getResellerUpgradeRule(): ResellerUpgradeRule {
  return RESELLER_PACKAGES.diy.upgrade!;
}

export function getResellerPackageIdForPriceId(priceId: string | null | undefined): ResellerPackageId | null {
  const id = (priceId || '').trim();
  if (!id) return null;

  for (const packageId of RESELLER_PACKAGE_IDS) {
    const configured = getResellerStripePriceId(packageId);
    if (configured && configured === id) {
      return packageId;
    }
  }
  return null;
}

export function getResellerMissingConfig(
  packageIds: readonly ResellerPackageId[] = RESELLER_PACKAGE_IDS
): string[] {
  const missing: string[] = [];

  if (!readEnv(RESELLER_STRIPE_SECRET_ENV_KEY)) {
    missing.push(RESELLER_STRIPE_SECRET_ENV_KEY);
  }

  for (const packageId of packageIds) {
    const envKey = getResellerPriceEnvKey(packageId);
    if (!readEnv(envKey)) {
      missing.push(envKey);
    }
  }

  return missing;
}

export function isResellerStripeConfigured(
  packageIds: readonly ResellerPackageId[] = RESELLER_PACKAGE_IDS
): boolean {
  return getResellerMissingConfig(packageIds).length === 0;
}

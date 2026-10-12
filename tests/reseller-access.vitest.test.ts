import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  RESELLER_ENTITLEMENTS,
  RESELLER_UPGRADE,
  canAccessTraining,
  canDownloadSource,
  getResellerApp,
  getTrainingEntitlementGap,
  isKnownResellerApp,
  listResellerAppIds,
  resolveResellerEntitlements,
  type ResellerUser,
} from '@/lib/resellerAccess';
import {
  BUNDLE_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  createBundleDownloadUrl,
  isBundleStorageConfigured,
} from '@/lib/resellerStorage';

function user(entitlements: Record<string, boolean>): ResellerUser {
  return { userId: 'user_1', entitlements, status: 'active' };
}

const DIY_USER = user({ [RESELLER_ENTITLEMENTS.DIY]: true });
const TRAINING_USER = user({ [RESELLER_ENTITLEMENTS.TRAINING]: true });
const BOTH_USER = user({
  [RESELLER_ENTITLEMENTS.DIY]: true,
  [RESELLER_ENTITLEMENTS.TRAINING]: true,
});
const NO_USER = user({});

const APP_ID = 'ai-headshot-studio';

describe('canDownloadSource (entitlement isolation)', () => {
  it('user A (DIY) can download their entitled app bundle', () => {
    expect(canDownloadSource(DIY_USER, APP_ID)).toBe(true);
  });

  it('user B without entitlements cannot download user A’s app bundle', () => {
    expect(canDownloadSource(NO_USER, APP_ID)).toBe(false);
  });

  it('training holders can also download (package includes everything in DIY)', () => {
    expect(canDownloadSource(TRAINING_USER, APP_ID)).toBe(true);
    expect(canDownloadSource(BOTH_USER, APP_ID)).toBe(true);
  });

  it('rejects unknown/traversal appIds even for entitled users', () => {
    expect(canDownloadSource(BOTH_USER, 'not-an-app')).toBe(false);
    expect(canDownloadSource(BOTH_USER, '../../etc/passwd')).toBe(false);
    expect(canDownloadSource(BOTH_USER, 'AI-HEADSHOT-STUDIO')).toBe(false);
    expect(canDownloadSource(BOTH_USER, '')).toBe(false);
  });

  it('treats inactive status as not entitled', () => {
    const inactive = { ...DIY_USER, status: 'inactive' };
    expect(canDownloadSource(inactive, APP_ID)).toBe(false);
  });
});

describe('canAccessTraining', () => {
  it('is false for DIY-only (blocked from training)', () => {
    expect(canAccessTraining(DIY_USER)).toBe(false);
  });

  it('is true for training holders', () => {
    expect(canAccessTraining(TRAINING_USER)).toBe(true);
    expect(canAccessTraining(BOTH_USER)).toBe(true);
  });

  it('is false for unentitled users', () => {
    expect(canAccessTraining(NO_USER)).toBe(false);
  });
});

describe('getTrainingEntitlementGap ($400 upgrade)', () => {
  it('training holders have no gap', () => {
    const gap = getTrainingEntitlementGap(TRAINING_USER);
    expect(gap.entitled).toBe(true);
    expect(gap.missingEntitlements).toEqual([]);
    expect(gap.upgrade).toBeNull();
  });

  it('DIY-only gap is exactly apps_studio_training, granted only by the $400 upgrade', () => {
    const gap = getTrainingEntitlementGap(DIY_USER);
    expect(gap.entitled).toBe(false);
    expect(gap.missingEntitlements).toEqual([RESELLER_ENTITLEMENTS.TRAINING]);
    expect(gap.upgrade).toEqual({
      from: RESELLER_UPGRADE.from,
      to: RESELLER_UPGRADE.to,
      priceDifferenceUsd: 400,
      grants: [RESELLER_ENTITLEMENTS.TRAINING],
    });
    expect(gap.requiresFullPurchase).toBe(false);
  });

  it('unentitled users require the full purchase (both keys)', () => {
    const gap = getTrainingEntitlementGap(NO_USER);
    expect(gap.missingEntitlements).toEqual([
      RESELLER_ENTITLEMENTS.DIY,
      RESELLER_ENTITLEMENTS.TRAINING,
    ]);
    expect(gap.requiresFullPurchase).toBe(true);
    expect(gap.upgrade).toBeNull();
  });
});

describe('app allowlist manifest (38 apps)', () => {
  const ids = listResellerAppIds();

  it('contains exactly the 38 apps from AppsStudio.jsx', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'packages/studio/src/components/AppsStudio.jsx'),
      'utf8',
    );
    const parsed = [...source.matchAll(/^\s*id:\s*"([a-z0-9-]+)",$/gm)].map((m) => m[1]);
    expect(parsed).toHaveLength(38);
    expect([...ids].sort()).toEqual([...parsed].sort());
    expect(new Set(ids).size).toBe(38);
  });

  it('resolves known apps and rejects everything else', () => {
    expect(getResellerApp('ai-youtube-shorts-generator')?.name).toBe(
      'AI YouTube Shorts Generator',
    );
    expect(getResellerApp('nope')).toBeNull();
    expect(isKnownResellerApp('../secret')).toBe(false);
  });

  it('invents no checksums: every artifact is missing with null sha256', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'src/data/resellerAppBundles.json'), 'utf8'),
    );
    expect(manifest.apps).toHaveLength(38);
    for (const app of manifest.apps) {
      expect(app.artifacts.length).toBeGreaterThan(0);
      for (const artifact of app.artifacts) {
        expect(artifact.status).toBe('missing');
        expect(artifact.sha256).toBeNull();
      }
    }
    expect(manifest.bucketVisibility).toBe('private');
  });
});

describe('private storage signed URLs', () => {
  it('uses a private bucket and a short TTL', () => {
    expect(BUNDLE_BUCKET).toBe('reseller-app-bundles');
    expect(SIGNED_URL_TTL_SECONDS).toBeLessThanOrEqual(300);
  });

  it('reports storage as unconfigured without Supabase credentials', () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      expect(isBundleStorageConfigured()).toBe(false);
    } finally {
      if (prevUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
      if (prevKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
    }
  });

  it('refuses to sign URLs for unknown apps', async () => {
    const result = await createBundleDownloadUrl('../../etc/passwd');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('UNKNOWN_APP');
  });

  it('reports bundles as unavailable while artifacts are missing', async () => {
    // Supabase env vars are set here only so execution passes the
    // storage-configuration guard and reaches artifact availability: the
    // real manifest still marks every artifact missing, so the honest
    // BUNDLE_NOT_AVAILABLE gap is what surfaces. Presence-only flags —
    // no Supabase client is constructed and no bucket is invented.
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    try {
      const result = await createBundleDownloadUrl(APP_ID);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe('BUNDLE_NOT_AVAILABLE');
    } finally {
      if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      else process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
      if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
    }
  });
});

describe('resolveResellerEntitlements', () => {
  it('falls back to the existing user_entitlements store', async () => {
    vi.resetModules();
    vi.doMock('@/access/resolveAccess', () => ({
      resolveSmartVideoAccessForUser: vi.fn(async () => ({
        clerkUserId: 'user_1',
        entitlements: { apps_studio_diy: true },
        status: 'active',
        source: 'stripe',
      })),
    }));
    const { resolveResellerEntitlements: resolve } = await import('@/lib/resellerAccess');
    // Loader that never finds the external module.
    const resolved = await resolve('user_1', {
      loadModule: async () => {
        throw new Error('not found');
      },
    });
    expect(resolved.entitlements).toEqual({ apps_studio_diy: true });
    expect(canDownloadSource(resolved, APP_ID)).toBe(true);
    vi.doUnmock('@/access/resolveAccess');
  });

  it('delegates to the concurrent agent’s entitlements module when present', async () => {
    const resolved = await resolveResellerEntitlements('user_2', {
      loadModule: async (specifier: string) => {
        if (specifier === '@/lib/reseller/entitlements') {
          return {
            resolveResellerEntitlements: async () => ({
              entitlements: { apps_studio_training: true },
            }),
          };
        }
        throw new Error('not found');
      },
    });
    expect(resolved.entitlements).toEqual({ apps_studio_training: true });
    expect(canAccessTraining(resolved)).toBe(true);
    expect(canDownloadSource(resolved, APP_ID)).toBe(true);
    expect(resolved.source).toBe('lib/reseller/entitlements');
  });

  it('upgrade flow: DIY user gains only training access after upgrade', async () => {
    const upgraded = user({ apps_studio_diy: true, apps_studio_training: true });
    const gap = getTrainingEntitlementGap(upgraded);
    expect(gap.entitled).toBe(true);
    expect(canDownloadSource(upgraded, APP_ID)).toBe(true);
    expect(canAccessTraining(upgraded)).toBe(true);
  });

  it('upgrade grants training only, never a second copy of DIY', () => {
    // Both directions: before the upgrade a DIY holder has downloads but
    // no training; after it, training only is added — DIY is never
    // re-granted and downloads keep working through the original panel.
    expect(RESELLER_UPGRADE.grants).toEqual([RESELLER_ENTITLEMENTS.TRAINING]);
    expect(RESELLER_UPGRADE.grants).not.toContain(RESELLER_ENTITLEMENTS.DIY);
    expect(canDownloadSource(DIY_USER, APP_ID)).toBe(true);
    expect(canAccessTraining(DIY_USER)).toBe(false);
    expect(canAccessTraining(TRAINING_USER)).toBe(true);
    expect(canDownloadSource(TRAINING_USER, APP_ID)).toBe(true);
  });
});

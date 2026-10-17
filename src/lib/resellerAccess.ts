import bundlesManifest from '@/data/resellerAppBundles.json';

/**
 * Reseller (Apps Studio) entitlement keys. Shared contract with
 * `lib/reseller/entitlements.*` + `lib/reseller/packages.*` and
 * `app/api/reseller/checkout|upgrade` (built concurrently by another
 * agent; those modules are imported — never edited — from here).
 *
 * Entitlements are stored in the existing `user_entitlements` table
 * (see src/access/entitlements.ts + src/access/resolveAccess.ts) as a
 * free-form JSON blob, so these keys ride on the existing, untouched
 * entitlement machinery.
 */
export const RESELLER_ENTITLEMENTS = {
  DIY: 'apps_studio_diy',
  TRAINING: 'apps_studio_training',
} as const;

export type ResellerEntitlementKey =
  (typeof RESELLER_ENTITLEMENTS)[keyof typeof RESELLER_ENTITLEMENTS];

/** What the $400 upgrade from DIY to Apps + Training grants: training only. */
export const RESELLER_UPGRADE = {
  from: RESELLER_ENTITLEMENTS.DIY,
  to: RESELLER_ENTITLEMENTS.TRAINING,
  priceDifferenceUsd: 400,
  grants: [RESELLER_ENTITLEMENTS.TRAINING] as ResellerEntitlementKey[],
} as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ResellerEntitlementMap = Record<string, boolean>;

export interface ResellerUser {
  userId: string;
  entitlements: ResellerEntitlementMap;
  /** Mirrors src/access: 'active' | 'inactive' | undefined are the norm. */
  status?: string;
  source?: string;
}

export interface TrainingEntitlementGap {
  /** Caller already holds apps_studio_training. */
  entitled: boolean;
  /** Entitlement keys still required to reach full training access. */
  missingEntitlements: ResellerEntitlementKey[];
  /** Present only when the caller holds DIY and can upgrade for $400. */
  upgrade: {
    from: ResellerEntitlementKey;
    to: ResellerEntitlementKey;
    priceDifferenceUsd: number;
    /** The upgrade grants ONLY training — never a second copy of DIY. */
    grants: ResellerEntitlementKey[];
  } | null;
  /** True when the caller holds neither package (full $597 purchase path). */
  requiresFullPurchase: boolean;
}

/**
 * Duck-typed surface of the concurrent agent's
 * `@/lib/reseller/entitlements` module. Only async userId resolvers are
 * consumed; their pure helpers take user objects and are deliberately
 * NOT called with a userId.
 */
interface ExternalEntitlementsModule {
  getResellerUserState?: (userId: string) => Promise<unknown>;
  resolveResellerEntitlements?: (userId: string) => Promise<unknown>;
  resolveEntitlements?: (userId: string) => Promise<unknown>;
}

type OptionalModuleLoader = (specifier: string) => Promise<unknown>;

/** Module specifier of the concurrent agent's entitlements helper. */
const EXTERNAL_MODULE_SPECIFIER = '@/lib/reseller/entitlements';

/* ------------------------------------------------------------------ */
/*  Manifest allowlist                                                 */
/* ------------------------------------------------------------------ */

interface BundleArtifact {
  kind: string;
  objectPath: string;
  status: 'missing' | 'available';
  sha256: string | null;
}

interface BundleApp {
  id: string;
  name: string;
  category: string;
  repo: string;
  artifacts: BundleArtifact[];
}

interface BundlesManifest {
  bucket: string;
  bucketVisibility: string;
  signedUrlTtlSeconds: number;
  apps: BundleApp[];
}

const manifest = bundlesManifest as unknown as BundlesManifest;

export const RESELLER_BUNDLE_BUCKET = manifest.bucket;
export const RESELLER_SIGNED_URL_TTL_SECONDS = manifest.signedUrlTtlSeconds;

const APPS_BY_ID = new Map<string, BundleApp>(
  manifest.apps.map((app) => [app.id, app]),
);

/** Strict appId grammar; anything else can never be a manifest key. */
const APP_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function isKnownResellerApp(appId: string): boolean {
  return (
    typeof appId === 'string' &&
    APP_ID_PATTERN.test(appId) &&
    APPS_BY_ID.has(appId)
  );
}

export function getResellerApp(appId: string): BundleApp | null {
  if (!isKnownResellerApp(appId)) return null;
  return APPS_BY_ID.get(appId) ?? null;
}

export function listResellerApps(): BundleApp[] {
  return manifest.apps;
}

export function listResellerAppIds(): string[] {
  return manifest.apps.map((app) => app.id);
}

/* ------------------------------------------------------------------ */
/*  Pure entitlement checks (no I/O — safe for unit tests)             */
/* ------------------------------------------------------------------ */

/** Mirrors src/access/resolveAccess.ts hasSmartVideoGo() status handling. */
function isStatusActive(status?: string): boolean {
  return status === undefined || status === '' || status === 'active';
}

function holds(
  user: ResellerUser | null | undefined,
  key: ResellerEntitlementKey,
): boolean {
  if (!user || !user.entitlements) return false;
  if (!isStatusActive(user.status)) return false;
  return user.entitlements[key] === true;
}

/**
 * Source-bundle download permission: the $197 DIY package and the $597
 * Apps + Training package both include every application source bundle,
 * so either entitlement grants downloads. Unknown appIds are always
 * rejected (allowlist), never reaching storage.
 */
export function canDownloadSource(
  user: ResellerUser | null | undefined,
  appId: string,
): boolean {
  if (!isKnownResellerApp(appId)) return false;
  return (
    holds(user, RESELLER_ENTITLEMENTS.DIY) ||
    holds(user, RESELLER_ENTITLEMENTS.TRAINING)
  );
}

/** Academy reseller training is exclusive to the $597 training package. */
export function canAccessTraining(
  user: ResellerUser | null | undefined,
): boolean {
  return holds(user, RESELLER_ENTITLEMENTS.TRAINING);
}

/**
 * Reports what the $400 DIY -> Apps + Training upgrade would still grant
 * (only `apps_studio_training`), and what a caller must still acquire.
 */
export function getTrainingEntitlementGap(
  user: ResellerUser | null | undefined,
): TrainingEntitlementGap {
  const entitled = canAccessTraining(user);
  if (entitled) {
    return {
      entitled: true,
      missingEntitlements: [],
      upgrade: null,
      requiresFullPurchase: false,
    };
  }

  const hasDiy = holds(user, RESELLER_ENTITLEMENTS.DIY);
  return {
    entitled: false,
    missingEntitlements: hasDiy
      ? [RESELLER_ENTITLEMENTS.TRAINING]
      : [RESELLER_ENTITLEMENTS.DIY, RESELLER_ENTITLEMENTS.TRAINING],
    upgrade: hasDiy
      ? {
          from: RESELLER_UPGRADE.from,
          to: RESELLER_UPGRADE.to,
          priceDifferenceUsd: RESELLER_UPGRADE.priceDifferenceUsd,
          grants: [...RESELLER_UPGRADE.grants],
        }
      : null,
    requiresFullPurchase: !hasDiy,
  };
}

/* ------------------------------------------------------------------ */
/*  Server-side resolution                                             */
/* ------------------------------------------------------------------ */

function pickExternalResolver(
  mod: ExternalEntitlementsModule | null | undefined,
): ((userId: string) => Promise<unknown>) | null {
  if (!mod || typeof mod !== 'object') return null;
  // Prefer the concurrent agent's getResellerUserState (their real API),
  // then generic resolver names. Their pure helpers (e.g.
  // getResellerEntitlements(user)) take user objects, NOT userIds, so
  // they are intentionally not invoked here.
  return (
    mod.getResellerUserState ??
    mod.resolveResellerEntitlements ??
    mod.resolveEntitlements ??
    null
  );
}

/** Normalize whatever the external resolver returns into an entitlement map. */
function normalizeEntitlements(result: unknown): ResellerEntitlementMap {
  if (!result || typeof result !== 'object') return {};
  const candidate = result as Record<string, unknown>;
  if (
    candidate.entitlements &&
    typeof candidate.entitlements === 'object' &&
    candidate.entitlements !== null
  ) {
    return normalizeEntitlements(candidate.entitlements);
  }
  const map: ResellerEntitlementMap = {};
  for (const [key, value] of Object.entries(candidate)) {
    if (typeof value === 'boolean') map[key] = value;
  }
  return map;
}

/** Preserve the caller's entitlement status when the helper reports one. */
function normalizeStatus(result: unknown): string {
  if (result && typeof result === 'object') {
    const status = (result as Record<string, unknown>).status;
    if (typeof status === 'string') return status;
  }
  return 'active';
}

export interface ResolveOptions {
  /**
   * Injectable module loader (tests). Defaults to importing the
   * concurrent agent's `@/lib/reseller/entitlements` module.
   */
  loadModule?: OptionalModuleLoader | null;
}

/** Default loader: literal specifier so bundlers can resolve it. */
async function defaultLoadModule(
  specifier: string,
): Promise<ExternalEntitlementsModule | null> {
  if (specifier !== EXTERNAL_MODULE_SPECIFIER) return null;
  const mod = (await import('@/lib/reseller/entitlements')) as ExternalEntitlementsModule;
  return mod;
}

/**
 * Resolve the caller's reseller entitlements. Prefers the concurrent
 * agent's `lib/reseller/entitlements` helper when present; otherwise
 * falls back to the EXISTING entitlement store (`user_entitlements`
 * via src/access/resolveAccess.ts) — additive, no schema or logic
 * changes. Both paths read the same table.
 */
export async function resolveResellerEntitlements(
  userId: string,
  options: ResolveOptions = {},
): Promise<ResellerUser> {
  const loadModule =
    options.loadModule !== undefined ? options.loadModule : defaultLoadModule;

  if (loadModule) {
    try {
      const mod = await loadModule(EXTERNAL_MODULE_SPECIFIER);
      const resolver = pickExternalResolver(mod as ExternalEntitlementsModule);
      if (resolver) {
        const result = await resolver(userId);
        return {
          userId,
          entitlements: normalizeEntitlements(result),
          status: normalizeStatus(result),
          source: 'lib/reseller/entitlements',
        };
      }
    } catch {
      // External helper unavailable or threw: fall back to the existing
      // entitlement store below.
    }
  }

  return resolveFromExistingStore(userId);
}

/**
 * Fallback: read entitlements from the existing `user_entitlements`
 * table through the untouched src/access helpers. Imported lazily so
 * pure-function unit tests never pull Clerk/Supabase into the graph.
 */
async function resolveFromExistingStore(userId: string): Promise<ResellerUser> {
  const empty: ResellerUser = {
    userId,
    entitlements: {},
    status: 'inactive',
    source: 'user_entitlements',
  };
  try {
    const { resolveSmartVideoAccessForUser } = await import(
      '@/access/resolveAccess'
    );
    const access = await resolveSmartVideoAccessForUser(userId);
    if (!access) return empty;
    return {
      userId,
      // `UserEntitlements` names only the SmartVideo keys; the reseller
      // keys ride in the same free-form JSON blob, so widen through
      // `unknown` rather than pretending the types overlap.
      entitlements: (access.entitlements ?? {}) as unknown as ResellerEntitlementMap,
      status: access.status,
      source: access.source,
    };
  } catch {
    return empty;
  }
}

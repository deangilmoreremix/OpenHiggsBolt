import {
  RESELLER_BUNDLE_BUCKET,
  RESELLER_SIGNED_URL_TTL_SECONDS,
  getResellerApp,
} from './resellerAccess';

/**
 * Private source-bundle delivery. Bundles live in a PRIVATE Supabase
 * Storage bucket and are only ever reachable through short-lived signed
 * URLs minted here with the service-role client — never through public
 * paths, never through predictable URLs.
 *
 * Required configuration:
 *   - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - private bucket `reseller-app-bundles` (see
 *     supabase/migrations/20261012000000_reseller_app_bundles_bucket.sql)
 *   - optional override: RESELLER_BUNDLES_BUCKET
 *
 * The Supabase client factory is injected by the caller (the route
 * statically imports it), which keeps this module free of server-only
 * imports and trivially testable.
 */

export type BundleDownloadResult =
  | {
      ok: true;
      appId: string;
      objectPath: string;
      signedUrl: string;
      expiresInSeconds: number;
      expiresAt: string;
    }
  | {
      ok: false;
      code:
        | 'STORAGE_NOT_CONFIGURED'
        | 'UNKNOWN_APP'
        | 'BUNDLE_NOT_AVAILABLE'
        | 'SIGN_FAILED';
      message: string;
    };

export const BUNDLE_BUCKET =
  process.env.RESELLER_BUNDLES_BUCKET || RESELLER_BUNDLE_BUCKET;

export const SIGNED_URL_TTL_SECONDS = RESELLER_SIGNED_URL_TTL_SECONDS;

/** Supabase service-role credentials present? */
export function isBundleStorageConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key);
}

interface StorageFileApi {
  createSignedUrl: (
    path: string,
    expiresIn: number,
  ) => Promise<{ data: { signedUrl?: string } | null; error: unknown }>;
}

interface StorageBucketApi {
  from: (bucket: string) => StorageFileApi;
}

/** Shape of `SupabaseClient` used here: `client.storage.from(bucket)`. */
interface SupabaseStorageClient {
  storage: StorageBucketApi;
}

export interface BundleSignerDeps {
  /** Returns the service-role Supabase client (Stripe-shaped storage API). */
  getSupabaseAdmin: () => unknown;
}

/**
 * Create a short-lived signed URL for an app's source bundle.
 *
 * The object path ALWAYS comes from the allowlisted manifest entry —
 * the caller-supplied appId is never interpolated into a path, so no
 * directory traversal is possible.
 */
export async function createBundleDownloadUrl(
  appId: string,
  deps: BundleSignerDeps,
): Promise<BundleDownloadResult> {
  const app = getResellerApp(appId);
  if (!app) {
    return { ok: false, code: 'UNKNOWN_APP', message: 'Unknown application.' };
  }

  // Root-cause ordering: without storage credentials nothing can be
  // served, so report that before artifact availability.
  if (!isBundleStorageConfigured()) {
    return {
      ok: false,
      code: 'STORAGE_NOT_CONFIGURED',
      message:
        'Private bundle storage is not configured (missing SUPABASE_URL and/or ' +
        `SUPABASE_SERVICE_ROLE_KEY, or the private ${BUNDLE_BUCKET} bucket).`,
    };
  }

  const sourceArtifact = app.artifacts.find((a) => a.kind === 'source-zip');
  if (!sourceArtifact || sourceArtifact.status !== 'available') {
    return {
      ok: false,
      code: 'BUNDLE_NOT_AVAILABLE',
      message:
        'Source bundle for this app is not published yet. Required artifact ' +
        'is tracked as missing in src/data/resellerAppBundles.json.',
    };
  }

  try {
    const supabase = deps.getSupabaseAdmin() as SupabaseStorageClient;
    const { data, error } = await supabase.storage
      .from(BUNDLE_BUCKET)
      .createSignedUrl(sourceArtifact.objectPath, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      return {
        ok: false,
        code: 'SIGN_FAILED',
        message: 'Failed to mint a signed download URL.',
      };
    }

    return {
      ok: true,
      appId,
      objectPath: sourceArtifact.objectPath,
      signedUrl: data.signedUrl,
      expiresInSeconds: SIGNED_URL_TTL_SECONDS,
      expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
    };
  } catch {
    return {
      ok: false,
      code: 'SIGN_FAILED',
      message: 'Failed to mint a signed download URL.',
    };
  }
}

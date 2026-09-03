import { createClient } from '@supabase/supabase-js';
import { grantEntitlement } from '../src/access/resolveAccess';
import { ENTITLEMENTS } from '../src/access/entitlements';

type Purchaser = {
  email: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  entitlement?: string;
};

type ReconciliationResult = {
  total: number;
  matched: number;
  granted: number;
  alreadyEntitled: number;
  noClerkAccount: number;
  ambiguous: number;
  failed: number;
  details: Array<{
    email: string;
    status: 'granted' | 'already_entitled' | 'no_clerk_account' | 'ambiguous' | 'failed';
    clerkUserId?: string;
    error?: string;
  }>;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

async function reconcilePurchasers(purchasers: Purchaser[]): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    total: purchasers.length,
    matched: 0,
    granted: 0,
    alreadyEntitled: 0,
    noClerkAccount: 0,
    ambiguous: 0,
    failed: 0,
    details: [],
  };

  for (const purchaser of purchasers) {
    const normalizedEmail = normalizeEmail(purchaser.email);
    const entitlementKey = purchaser.entitlement || ENTITLEMENTS.SMARTVIDEO_GO;

    try {
      const { data: existingEntitlement, error: entitlementError } = await supabase
        .from('user_entitlements')
        .select('clerk_user_id, entitlements')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (entitlementError) {
        result.failed += 1;
        result.details.push({
          email: normalizedEmail,
          status: 'failed',
          error: entitlementError.message,
        });
        continue;
      }

      if (existingEntitlement?.clerk_user_id) {
        const entitlements = (existingEntitlement.entitlements || {}) as Record<string, boolean>;
        if (entitlements[entitlementKey]) {
          result.alreadyEntitled += 1;
          result.matched += 1;
          result.details.push({
            email: normalizedEmail,
            status: 'already_entitled',
            clerkUserId: existingEntitlement.clerk_user_id,
          });
        } else {
          await grantEntitlement(
            existingEntitlement.clerk_user_id,
            normalizedEmail,
            entitlementKey,
            'stripe',
            {
              stripe_customer_id: purchaser.stripe_customer_id,
              stripe_subscription_id: purchaser.stripe_subscription_id,
            }
          );
          result.granted += 1;
          result.matched += 1;
          result.details.push({
            email: normalizedEmail,
            status: 'granted',
            clerkUserId: existingEntitlement.clerk_user_id,
          });
        }
        continue;
      }

      const { data: appUser, error: userError } = await supabase
        .from('app_users')
        .select('clerk_user_id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (userError) {
        result.failed += 1;
        result.details.push({
          email: normalizedEmail,
          status: 'failed',
          error: userError.message,
        });
        continue;
      }

      if (appUser?.clerk_user_id) {
        await grantEntitlement(
          appUser.clerk_user_id,
          normalizedEmail,
          entitlementKey,
          'stripe',
          {
            stripe_customer_id: purchaser.stripe_customer_id,
            stripe_subscription_id: purchaser.stripe_subscription_id,
          }
        );
        result.granted += 1;
        result.matched += 1;
        result.details.push({
          email: normalizedEmail,
          status: 'granted',
          clerkUserId: appUser.clerk_user_id,
        });
      } else {
        result.noClerkAccount += 1;
        result.details.push({
          email: normalizedEmail,
          status: 'no_clerk_account',
        });
      }
    } catch (err) {
      result.failed += 1;
      result.details.push({
        email: normalizedEmail,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return result;
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error('Usage: node scripts/reconcile-purchasers.mjs <purchasers.json>');
    console.error('Expected JSON format: [{ "email": "...", "stripe_customer_id": "...", "entitlement": "smartvideo_go" }]');
    process.exit(1);
  }

  const { readFile } = await import('node:fs/promises');
  const content = await readFile(inputPath, 'utf-8');
  const purchasers: Purchaser[] = JSON.parse(content);

  if (!Array.isArray(purchasers)) {
    console.error('Input must be a JSON array of purchasers');
    process.exit(1);
  }

  console.log(`Reconciling ${purchasers.length} purchasers...`);
  const result = await reconcilePurchasers(purchasers);

  console.log('\nReconciliation complete:');
  console.log(`  Total:        ${result.total}`);
  console.log(`  Matched:      ${result.matched}`);
  console.log(`  Granted:      ${result.granted}`);
  console.log(`  Already ent.: ${result.alreadyEntitled}`);
  console.log(`  No Clerk acct:${result.noClerkAccount}`);
  console.log(`  Ambiguous:    ${result.ambiguous}`);
  console.log(`  Failed:       ${result.failed}`);

  if (result.failed > 0) {
    console.log('\nFailures:');
    result.details
      .filter((d) => d.status === 'failed')
      .forEach((d) => {
        console.log(`  - ${d.email}: ${d.error}`);
      });
  }

  if (result.noClerkAccount > 0) {
    console.log('\nNo Clerk account (retain for later auto-association):');
    result.details
      .filter((d) => d.status === 'no_clerk_account')
      .forEach((d) => {
        console.log(`  - ${d.email}`);
      });
  }
}

main().catch((err) => {
  console.error('Reconciliation failed:', err);
  process.exit(1);
});

/**
 * Per-app workshop data for the Reseller Academy. Pure, read-only helpers over
 *   - src/data/resellerAppFacts.json   (extracted from each app's real source)
 *   - src/data/resellerDestinations.json (verified repos / Vercel eligibility)
 * No entitlement logic lives here; access to the pages that use this is decided
 * by the unchanged `canAccessTraining` gate.
 *
 * Secrets are never represented: environment variables are names + placeholders.
 */
import facts from '@/data/resellerAppFacts.json';
import destinations from '@/data/resellerDestinations.json';

export interface FactEnvVar {
  name: string;
  role: string;
  secret: boolean;
  clientVisible: boolean;
  inEnvExample: boolean;
  referencedInCode: boolean;
}

export interface AppFacts {
  id: string;
  name: string;
  category: string;
  appKind: 'nextjs-saas' | 'python-cli';
  destinationRepo: string | null;
  destinationStatus: string;
  factSource: 'destination' | 'upstream' | 'none';
  sourceRepoForFacts: string | null;
  licensePresent: boolean;
  envVars: FactEnvVar[];
  database: { prisma: boolean; host: string | null; prismaMigrationsPresent?: boolean; supabaseMigrationsPresent?: boolean };
  payment: {
    model: string;
    plans: { key: string; name: string | null; credits: number | null; amountCents: number }[];
    checkoutRoutes: string[];
    webhookRoutes: string[];
    eventsHandled: string[];
    configFile: string | null;
    recommendedWebhookPath?: string | null;
  };
  readme: { oneClickDeployUrl: string | null; stripeWebhookPath: string | null; googleCallbackPath: string | null; dbPushMentioned: boolean };
  buildCommand: string | null;
  notes: string[];
}

const FACTS = (facts as unknown as { apps: Record<string, AppFacts> }).apps;
const DEST = (destinations as unknown as {
  destinations: Record<string, { repoUrl: string | null; repoStatus: string; hostedDemoUrl: string | null; vercelDeploy: string }>;
}).destinations;

export const WORKSHOP_APP_IDS: string[] = Object.keys(FACTS);

export function getAppFacts(appId: string): AppFacts | null {
  return Object.prototype.hasOwnProperty.call(FACTS, appId) ? FACTS[appId] : null;
}

/** Safe placeholder shown instead of any value. Never a real credential. */
export function placeholderFor(v: FactEnvVar): string {
  switch (v.name) {
    case 'NEXTAUTH_URL':
    case 'WEBHOOK_URL':
      return 'https://your-domain  (no trailing slash)';
    case 'NEXTAUTH_SECRET':
      return '<a long random string you generate>';
    case 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY':
      return '<pk_test_… now, pk_live_… when live>';
    case 'STRIPE_SECRET_KEY':
      return '<sk_test_… now, sk_live_… when live>';
    case 'STRIPE_WEBHOOK_SECRET':
      return '<whsec_… from your Stripe webhook>';
    case 'DATABASE_URL':
      return '<pooled postgresql:// connection string>';
    case 'DIRECT_URL':
      return '<direct postgresql:// connection string>';
    case 'GOOGLE_CLIENT_ID':
      return '<from Google Cloud>';
    case 'GOOGLE_CLIENT_SECRET':
      return '<from Google Cloud>';
    default:
      return v.secret ? '<your secret value>' : '<value from the app README>';
  }
}

export const ROLE_LABEL: Record<string, string> = {
  database: 'Database',
  auth: 'Sign-in (Google / NextAuth)',
  stripe: 'Stripe payments',
  webhook: 'Public callback address',
  ai: 'MuAPI (AI)',
  'cloud-export': 'Optional cloud export (not needed to launch)',
  branding: 'Branding',
  other: 'Other',
};

export type Readiness = 'ready' | 'source-pending' | 'cli-only';

export interface WorkshopSummary {
  appId: string;
  facts: AppFacts;
  demoUrl: string | null;
  repoUrl: string | null;
  vercelButton: boolean;
  readiness: Readiness;
  /** Plain-language statement of where the facts came from and any caveat. */
  sourceStatement: string;
  /** Variables a student must set to launch (excludes optional cloud-export). */
  requiredEnv: FactEnvVar[];
  optionalEnv: FactEnvVar[];
  usesSupabaseKeys: boolean;
  aiKeyVars: string[];
  commonErrors: { problem: string; fix: string }[];
  verification: string[];
}

export function getWorkshop(appId: string): WorkshopSummary | null {
  const f = getAppFacts(appId);
  if (!f) return null;
  const d = DEST[appId];
  const cli = f.appKind === 'python-cli';
  const requiredEnv = f.envVars.filter((e) => e.role !== 'cloud-export' && e.name !== 'NEXT_PUBLIC_THEME');
  const optionalEnv = f.envVars.filter((e) => e.role === 'cloud-export' || e.name === 'NEXT_PUBLIC_THEME');

  let sourceStatement: string;
  if (cli) {
    sourceStatement =
      'This app is a Python command-line tool. Its source has no web app, no Stripe checkout and no one-click Vercel deployment, so the standard SaaS launch path does not apply to it.';
  } else if (f.factSource === 'destination') {
    sourceStatement = 'These facts were read from the real source code in the destination repository.';
  } else {
    sourceStatement =
      'The destination repository does not contain the app source yet. These facts were read from the original upstream source and must be re-checked once the destination repository is complete.';
  }

  const webhook = f.payment.recommendedWebhookPath;
  const commonErrors: { problem: string; fix: string }[] = [
    { problem: 'Google sign-in shows redirect_uri_mismatch.', fix: 'Add https://YOUR-DOMAIN/api/auth/callback/google as an Authorized redirect URI and make NEXTAUTH_URL equal to your address.' },
    { problem: 'The build fails or the app cannot reach the database.', fix: 'Re-copy DATABASE_URL (and DIRECT_URL) with the real password and make sure the database project is running.' },
    { problem: 'Generations fail with an authorization error.', fix: `Check ${f.envVars.filter((e) => e.role === 'ai').map((e) => e.name).join(' / ') || 'the MuAPI key variable'} holds a valid MuAPI key, then redeploy.` },
  ];
  if (webhook) {
    commonErrors.push({ problem: 'A payment succeeded but credits did not appear.', fix: `Check that Stripe's webhook points to https://YOUR-DOMAIN${webhook}, listens for checkout.session.completed, and STRIPE_WEBHOOK_SECRET matches that endpoint.` });
  }
  if (f.payment.webhookRoutes.length > 1) {
    commonErrors.push({ problem: 'Which webhook path do I use?', fix: `The source contains more than one webhook route (${f.payment.webhookRoutes.join(', ')}). Register only ${webhook ?? 'the path named in this workshop'}.` });
  }

  const verification = cli
    ? ['Follow the README of the tool to run it locally; there is no deployed-app verification for this application.']
    : [
        'The Vercel deployment shows Ready and your address opens the app.',
        'You can sign in with Google and a User row appears in your database.',
        'One generation completes and appears in MuAPI usage.',
        `A Stripe test purchase adds the pack's credits (webhook ${webhook ?? 'path see above'}).`,
        'The same checks pass on your own domain.',
      ];

  return {
    appId,
    facts: f,
    demoUrl: d?.hostedDemoUrl ?? null,
    repoUrl: d?.repoUrl ?? null,
    vercelButton: d?.vercelDeploy === 'template',
    readiness: cli ? 'cli-only' : f.factSource === 'destination' ? 'ready' : 'source-pending',
    sourceStatement,
    requiredEnv,
    optionalEnv,
    usesSupabaseKeys: f.envVars.some((e) => /SUPABASE/.test(e.name)),
    aiKeyVars: f.envVars.filter((e) => e.role === 'ai').map((e) => e.name),
    commonErrors,
    verification,
  };
}

export const formatUsd = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

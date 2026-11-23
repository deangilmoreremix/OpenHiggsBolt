import type { ResourceLink } from './types';

const L = (label: string, url: string, kind: ResourceLink['kind']): ResourceLink => ({ label, url, kind });

/** Official pages only. Every URL here is link-checked by tests/reseller-academy-content.vitest.test.ts (format) and the e2e link checker (reachability). */
export const LINKS = {
  githubSignup: L('Create a GitHub account', 'https://github.com/signup', 'account'),
  githubFork: L('GitHub docs: fork a repository', 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo', 'docs'),
  muapi: L('MuAPI', 'https://muapi.ai', 'account'),
  muapiKeys: L('MuAPI access keys', 'https://muapi.ai/access-keys', 'account'),
  supabase: L('Supabase dashboard', 'https://supabase.com/dashboard', 'account'),
  supabaseConnect: L('Supabase docs: connecting to Postgres', 'https://supabase.com/docs/guides/database/connecting-to-postgres', 'docs'),
  neon: L('Neon (alternative Postgres host)', 'https://neon.tech', 'account'),
  prismaDbPush: L('Prisma docs: db push', 'https://www.prisma.io/docs/orm/reference/prisma-cli-reference#db-push', 'docs'),
  googleCreds: L('Google Cloud: credentials', 'https://console.cloud.google.com/apis/credentials', 'account'),
  googleOauthHelp: L('Google help: set up OAuth 2.0', 'https://support.google.com/cloud/answer/6158849', 'docs'),
  vercelSignup: L('Create a Vercel account', 'https://vercel.com/signup', 'account'),
  vercelEnv: L('Vercel docs: environment variables', 'https://vercel.com/docs/environment-variables', 'docs'),
  vercelDomains: L('Vercel docs: add a domain', 'https://vercel.com/docs/domains', 'docs'),
  vercelBuild: L('Vercel docs: troubleshoot a build', 'https://vercel.com/docs/deployments/troubleshoot-a-build', 'docs'),
  stripeRegister: L('Create a Stripe account', 'https://dashboard.stripe.com/register', 'account'),
  stripeSite: L('stripe.com', 'https://stripe.com', 'account'),
  stripeActivate: L('Stripe docs: activate your account', 'https://docs.stripe.com/get-started/account/activate', 'docs'),
  stripePayouts: L('Stripe docs: payouts', 'https://docs.stripe.com/payouts', 'docs'),
  stripeKeys: L('Stripe docs: API keys', 'https://docs.stripe.com/keys', 'docs'),
  stripeTesting: L('Stripe docs: test cards', 'https://docs.stripe.com/testing', 'docs'),
  stripeWebhooks: L('Stripe docs: webhooks', 'https://docs.stripe.com/webhooks', 'docs'),
  stripeRefunds: L('Stripe docs: refunds', 'https://docs.stripe.com/refunds', 'docs'),
  stripeDisputes: L('Stripe docs: disputes', 'https://docs.stripe.com/disputes', 'docs'),
  stripePricing: L('Stripe pricing (current fees)', 'https://stripe.com/pricing', 'docs'),
  stripeDashboardPayments: L('Stripe Dashboard: payments', 'https://dashboard.stripe.com/payments', 'tool'),
  stripeDashboardKeys: L('Stripe Dashboard: API keys', 'https://dashboard.stripe.com/apikeys', 'tool'),
  stripeDashboardWebhooks: L('Stripe Dashboard: webhooks', 'https://dashboard.stripe.com/webhooks', 'tool'),
  netlifySignup: L('Create a Netlify account', 'https://app.netlify.com/signup', 'account'),
  netlifyPricing: L('Netlify pricing (current free plan limits)', 'https://www.netlify.com/pricing/', 'docs'),
  netlifyDocs: L('Netlify docs', 'https://docs.netlify.com', 'docs'),
  clerkSignup: L('Create a Clerk account', 'https://dashboard.clerk.com/sign-up', 'account'),
  clerkPricing: L('Clerk pricing (current free plan limits)', 'https://clerk.com/pricing', 'docs'),
  clerkDocs: L('Clerk docs', 'https://clerk.com/docs', 'docs'),
  stripeMcp: L('Stripe docs: Model Context Protocol (MCP)', 'https://docs.stripe.com/mcp', 'docs'),
  claudeSite: L('Claude', 'https://claude.ai', 'account'),
  chatgptSite: L('ChatGPT', 'https://chatgpt.com', 'account'),
  mcpSite: L('Model Context Protocol (what connectors are built on)', 'https://modelcontextprotocol.io', 'docs'),
  nextAuthUrl: L('NextAuth docs: NEXTAUTH_URL', 'https://next-auth.js.org/configuration/options#nextauth_url', 'docs'),
};

export type LinkKey = keyof typeof LINKS;

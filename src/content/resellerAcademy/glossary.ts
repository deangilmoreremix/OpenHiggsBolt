export const GLOSSARY: Record<string, { term: string; plain: string }> = {
  'api-key': {
    term: 'API key',
    plain:
      'A long password that lets your app talk to another service (like MuAPI or Stripe) and be billed to your account. Anyone who has it can spend your money, so it only ever goes into Vercel environment variables — never into code, screenshots, chat or email.',
  },
  'env-var': {
    term: 'Environment variable',
    plain:
      'A named setting (like STRIPE_SECRET_KEY) that you give to Vercel so your app can read it while running. It keeps secrets out of your code. After you add or change one you must redeploy.',
  },
  repo: {
    term: 'Repository (repo)',
    plain: 'A folder of project files stored on GitHub. Your app\'s source code lives in a repo.',
  },
  fork: {
    term: 'Fork',
    plain: 'Your own copy of someone else\'s repo, stored in your GitHub account. Vercel deploys from your copy.',
  },
  vercel: {
    term: 'Vercel',
    plain: 'The hosting service that builds your app from GitHub and puts it on the internet at a web address.',
  },
  deployment: {
    term: 'Deployment',
    plain: 'One build-and-publish run on Vercel. Each time you change a setting or code, you make a new deployment.',
  },
  postgres: {
    term: 'PostgreSQL database',
    plain:
      'Where the app stores its users, credits and generated results. These apps accept any PostgreSQL database; Supabase and Neon both offer free starter ones.',
  },
  prisma: {
    term: 'Prisma / db push',
    plain:
      'The tool inside the app that creates the tables in your database. "prisma db push" builds the tables the app expects. You only need it once per new database.',
  },
  oauth: {
    term: 'Google sign-in (OAuth)',
    plain:
      'How your customers log in: with their Google account. You create a "Google OAuth client" in Google Cloud and give its ID and secret to the app.',
  },
  stripe: {
    term: 'Stripe',
    plain: 'The payment company. A customer pays Stripe by card; Stripe takes its fee and pays the rest out to your bank account on a schedule.',
  },
  'test-mode': {
    term: 'Test mode',
    plain:
      'A Stripe environment where no real money moves. It has its own keys, its own webhook and fake card numbers. Always finish testing here first.',
  },
  'live-mode': {
    term: 'Live mode',
    plain: 'The real Stripe environment. Real cards are charged and real money is paid out. It uses a different set of keys from test mode.',
  },
  webhook: {
    term: 'Webhook',
    plain:
      'A message Stripe sends to your app after a payment succeeds. Your app uses it to add the credits. If the webhook is not set up, customers pay but never receive credits.',
  },
  'signing-secret': {
    term: 'Webhook signing secret',
    plain: 'A value (starts with whsec_) that proves a webhook really came from Stripe. Each webhook endpoint has its own, separately for test and live.',
  },
  credits: {
    term: 'Credit pack',
    plain: 'Customers buy a bundle of credits once; each AI generation spends some. This is how all of these apps charge — it is a one-time purchase per pack, not a monthly subscription.',
  },
  muapi: {
    term: 'MuAPI',
    plain: 'The AI service that actually generates the images, video or text. Your app calls it with your MuAPI key and MuAPI bills your account for usage.',
  },
  'multi-tenant': {
    term: 'Multi-tenant',
    plain:
      'One running copy of the app serves many separate customers. Each customer signs in with their own account and has their own credits and creations. You run one deployment for all of your customers.',
  },
  dns: {
    term: 'DNS record',
    plain: 'Instructions stored with your domain registrar that tell the internet which server your domain name points to.',
  },
  payout: {
    term: 'Payout',
    plain: 'Stripe sending your balance to your bank account. Timing and availability depend on your country and account.',
  },
  chargeback: {
    term: 'Dispute / chargeback',
    plain: 'A customer asks their bank to reverse a payment. Stripe may take the amount back plus a fee while the dispute is decided.',
  },
};

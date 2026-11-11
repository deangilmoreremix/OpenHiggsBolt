import type { Module } from './types';
import { LINKS as K } from './links';
import { MODULE_13_EXTRA } from './modules-13-extra';

/**
 * Module 13 — build and launch with Claude / ChatGPT + Netlify + Clerk + Stripe.
 *
 * Honest scope notes (kept in the lessons too):
 *  - The reseller apps ship with NextAuth (Google sign-in), Prisma/Postgres and Stripe already
 *    integrated (see each app's workshop panel). Hosting on Netlify and signing users in with
 *    Clerk are CHANGES the learner's assistant makes to their own copy of the app.
 *  - Connector menu names differ between Claude and ChatGPT and change often; lessons say
 *    "follow the official page" instead of quoting exact labels.
 *  - Secrets never go into the chat. They go into Netlify / Clerk / Stripe dashboards.
 */
const BASE_13: Module[] = [
  {
    id: 13,
    title: 'Build Your App with Claude or ChatGPT, Netlify, Clerk and Stripe',
    outcome: 'Your own copy of an app is hosted on Netlify, people sign up through Clerk, Stripe takes test payments, and an AI chat helped you do each step.',
    lessons: [
      {
        id: '13.1',
        title: 'Start your free accounts: Netlify, Clerk and Stripe',
        minutes: 15,
        outcome: 'You have free Netlify, Clerk and Stripe accounts (Stripe in test mode) plus GitHub, and know what each one does.',
        learn: [
          'Four accounts, four jobs. GitHub stores your copy of the app. Netlify builds it and puts it on the internet. Clerk handles people signing up and signing in. Stripe takes the payments (the apps already include Stripe — you only connect your own keys).',
          'All three services have a free plan at the time of writing, but limits and prices change. Open each pricing page and read the current free limits before you rely on them.',
          'Use the same email you will use for your business, and turn on two-step sign-in for each account. Stripe stays in test mode until you decide to go live later in the course.',
        ],
        follow: [
          { text: 'Create or sign in to GitHub (you should already have it from Module 3).', link: K.githubSignup },
          { text: 'Create a Netlify account. Choosing "Sign up with GitHub" makes connecting your repo easier.', link: K.netlifySignup, expect: 'You see your Netlify team dashboard.' },
          { text: 'Create a Clerk account and, when asked, create an application. Name it after your business and keep Email and Google as sign-in options.', link: K.clerkSignup, expect: 'You see your Clerk application dashboard with a development instance.' },
          { text: 'Create or sign in to Stripe and stay in test mode (look for the Test mode / Sandbox indicator in the dashboard).', link: K.stripeRegister },
          { text: 'Open each pricing page and note the current free limits in your own notes.', link: K.netlifyPricing },
        ],
        complete: ['I have GitHub, Netlify, Clerk and Stripe accounts', 'Two-step sign-in is on for each', 'Stripe is in test mode'],
        verify: ['You can open all four dashboards in separate browser tabs.'],
        mistakes: ['Skipping the pricing pages and being surprised by a limit later.', 'Switching Stripe to live mode before the test purchase works.'],
        troubleshooting: [{ problem: 'Clerk asks me to choose a plan.', fix: 'Choose the free plan if one is offered on the current pricing page. If it is not, check the page again before paying for anything.' }],
        resources: [K.netlifyPricing, K.clerkPricing, K.stripePricing],
        glossary: ['netlify', 'clerk', 'stripe'],
      },
      {
        id: '13.2',
        title: 'Connect Claude to Netlify, Clerk and Stripe with connectors',
        minutes: 15,
        outcome: 'Claude can see your Netlify sites, your Clerk application and your Stripe test data, with your approval each time.',
        learn: [
          'A connector (sometimes called a plugin) lets a chat use another service for you. You sign in to the service, approve access, and from then on you can ask the chat to do things there — like listing your Netlify sites or checking a Stripe test payment.',
          'Netlify, Stripe and Clerk each offer a connector for Claude. Where the buttons are and what they are called changes, so you will follow each service\'s official page rather than a screenshot.',
          'The safety rule: sign in with your own accounts, approve only what you understand, and never paste a secret key into the chat. The connector signs in for you, so you do not need to.',
        ],
        follow: [
          { text: 'Open Claude and sign in. Open its settings and find where connectors (or integrations) are managed.', link: K.claudeSite },
          { text: 'Add the Netlify connector and sign in to Netlify when asked. Approve access to your own team.', link: K.netlifyDocs, expect: 'Claude shows Netlify as connected.' },
          { text: 'Add the Stripe connector and sign in. Pick your test-mode account.', link: K.stripeMcp, expect: 'Claude shows Stripe as connected.' },
          { text: 'Add the Clerk connector and sign in. Select the application you created in 13.1.', link: K.clerkDocs, expect: 'Claude shows Clerk as connected.' },
          { text: 'Start a new chat and test each one with a read-only question.', copy: { label: 'Test message', value: 'Using your Netlify, Stripe and Clerk connectors, list my Netlify sites, my Clerk application name, and my five most recent Stripe test payments. Do not change anything.' } },
        ],
        complete: ['The three connectors show as connected', 'My read-only test message worked'],
        verify: ['Claude answers with real names from your own Netlify, Clerk and Stripe accounts, and changes nothing.'],
        mistakes: ['Connecting a work or client account by mistake.', 'Asking the chat to change things before testing with a read-only question.'],
        troubleshooting: [
          { problem: 'A connector says it needs authorization.', fix: 'Open its entry in the connector settings and complete the sign-in. The tools only appear after you approve.' },
          { problem: 'I cannot find where to add connectors.', fix: 'Your plan or workspace may restrict them. Check the official page for your plan, or ask your workspace admin.' },
        ],
        resources: [K.claudeSite, K.mcpSite, K.stripeMcp],
        glossary: ['connector', 'api-key'],
      },
      {
        id: '13.3',
        title: 'Connect ChatGPT the same way',
        minutes: 15,
        outcome: 'ChatGPT can use the same three services, or you know exactly what your plan does not allow.',
        learn: [
          'ChatGPT can also use connectors built on the same standard (MCP). Whether you can add them, and where, depends on your plan and on settings OpenAI changes from time to time — so check OpenAI\'s current help page before you start.',
          'Everything from 13.2 still applies: your own accounts, approve only what you understand, test read-only first, never paste secrets.',
          'You do not need both assistants. Pick one for the build and keep the other as a second opinion for hard problems.',
        ],
        follow: [
          { text: 'Open ChatGPT and look in its settings for connectors or apps. If your plan does not show them, read OpenAI\'s current help page for what is available.', link: K.chatgptSite },
          { text: 'Add Netlify, Stripe and Clerk, signing in to each and approving access to your own account only.' },
          { text: 'Run the same read-only test message you used in 13.2 and compare the answers.', copy: { label: 'Test message', value: 'Using your Netlify, Stripe and Clerk connectors, list my Netlify sites, my Clerk application name, and my five most recent Stripe test payments. Do not change anything.' } },
        ],
        complete: ['I connected ChatGPT, or I confirmed my plan does not allow it and will use Claude', 'The read-only test returned my real data'],
        verify: ['The answer matches what you see in the three dashboards.'],
        mistakes: ['Assuming a menu name from a video is still current.'],
        troubleshooting: [{ problem: 'ChatGPT will not let me add a custom connector.', fix: 'It may be limited to certain plans or need a setting turned on. Follow the current OpenAI instructions, or do this module with Claude.' }],
        resources: [K.chatgptSite, K.mcpSite],
        glossary: ['connector'],
      },
      {
        id: '13.4',
        title: 'Give the assistant your app and your plan',
        minutes: 15,
        outcome: 'Your assistant knows which app you are building, what it already includes and what you want changed.',
        appPanel: 'overview',
        learn: [
          'Your assistant knows nothing about your app until you tell it. Give it three things: where the code is (your GitHub copy), what the app already has (the workshop panel below lists its database, sign-in, payments and variable names), and what you want changed.',
          'What the apps already include: Stripe payments, a PostgreSQL database through Prisma and Google sign-in through NextAuth. Netlify hosting and Clerk sign-in are changes your assistant makes in your own copy — this module walks you through them.',
          'Work in small steps and ask the assistant to explain each change before it makes one. You approve every change, and you can undo any step in GitHub.',
        ],
        follow: [
          { text: 'Open your app\'s workshop page and keep its panels open: they list your app\'s real variable names.' },
          { text: 'Start a chat and paste the briefing below, filling in your app name and repo address.', copy: { label: 'Briefing', value: 'I am building my own copy of a reseller app called <APP NAME>. My code is in my GitHub repo <YOUR REPO ADDRESS>. It already uses Next.js, Prisma with PostgreSQL, Stripe payments and Google sign-in through NextAuth. My goal: host it on Netlify, replace sign-in with Clerk, and keep the existing Stripe credits flow working in test mode. Work in small steps. Before each change, tell me what you will change and why. Never ask me to paste secret keys into this chat; tell me which dashboard setting to use instead.' } },
          { text: 'Ask it to read the repo and summarise the pieces: the sign-in code, the payment code and the build command.' },
        ],
        complete: ['The assistant summarised my app correctly', 'It agreed to explain before changing and not to ask for secrets'],
        verify: ['The summary names your app\'s real sign-in and Stripe webhook code, matching the workshop panel.'],
        mistakes: ['Pasting secret keys into the chat to "help" the assistant.', 'Letting the assistant make many changes at once.'],
        troubleshooting: [{ problem: 'The assistant cannot see my repo.', fix: 'Make sure the repo is yours, and use its GitHub connector or paste the files it asks for. Do not paste anything secret.' }],
        resources: [],
        glossary: ['repo', 'env-var', 'prisma'],
      },
      {
        id: '13.5',
        title: 'Host your app on Netlify with your assistant',
        minutes: 25,
        outcome: 'Your app builds on Netlify and opens at a netlify.app address.',
        appPanel: 'envvars',
        learn: [
          'Netlify builds your app straight from your GitHub repo every time you push a change. The assistant checks what the app needs (the build command and the environment variables), and you add the values in Netlify\'s dashboard.',
          'Secret values — the database address, Stripe keys, MuAPI key — go in Netlify\'s environment variable settings, never in the chat and never in the code. The assistant tells you the names; you paste the values yourself.',
          'After you add or change a variable, trigger a new deploy so the app picks it up.',
        ],
        follow: [
          { text: 'Ask the assistant to check your app builds on Netlify and to list any change it needs, then review each change before you accept it.', copy: { label: 'Prompt', value: 'Check this Next.js app is ready to deploy on Netlify. List the build command, the Node version, and every environment variable the code reads (names only). Tell me about any change needed before I deploy.' } },
          { text: 'Ask the assistant to create the Netlify site from your GitHub repo through the connector, or create it yourself in Netlify with "Add new project" and choose your repo.', link: K.netlifyDocs },
          { text: 'In Netlify, open the site\'s environment variable settings and add each variable from your workshop page. Paste the values yourself.' },
          { text: 'Trigger a deploy and wait for it to finish. Ask the assistant to read the deploy log if it fails.', expect: 'The deploy shows Published and the site opens.' },
        ],
        complete: ['The site is created from my repo', 'All variables are set in Netlify, not in chat', 'The deploy shows Published'],
        verify: ['Your netlify.app address opens your app\'s home page.'],
        mistakes: ['Changing variables and forgetting to redeploy.', 'Putting a secret in the repo.'],
        troubleshooting: [
          { problem: 'The build fails.', fix: 'Ask the assistant to read the deploy log and explain the first error. Fix one error at a time and redeploy.' },
          { problem: 'The page loads but sign-in or the database fails.', fix: 'A variable is missing or has a typo. Compare Netlify\'s list with the workshop panel and redeploy.' },
        ],
        resources: [K.netlifyDocs],
        glossary: ['netlify', 'env-var', 'deployment'],
      },
      {
        id: '13.6',
        title: 'Let people sign up with Clerk',
        minutes: 30,
        outcome: 'Visitors can sign up and sign in with Clerk, and the app knows who they are.',
        appPanel: 'accounts',
        learn: [
          'Your app ships with Google sign-in (NextAuth). Clerk replaces it with ready-made sign-up and sign-in pages, email and Google options, and a user dashboard. This is a code change in your own copy, so you and your assistant do it together in a separate branch and test before merging.',
          'Clerk has a publishable key (public, safe in the browser) and a secret key (private). Both go in Netlify\'s environment variables — only the publishable key is ever visible to visitors.',
          'The important part is what happens to the app\'s credits: each person\'s credits must stay linked to the same user after the change. Ask the assistant to show you where users and credits are stored before it changes anything.',
          'Clerk publishes official instructions for adding sign-in to Next.js, and its tools for AI assistants are described in its docs. Ask your assistant to follow the current Clerk docs rather than from memory.',
        ],
        follow: [
          { text: 'Ask the assistant to read the sign-in code and the database tables that hold users and credits, and explain how it would switch to Clerk without losing credits.', copy: { label: 'Prompt', value: 'Plan how to replace NextAuth with Clerk in this app using the current Clerk docs for Next.js. Show me where users and credits are stored, how each Clerk user will map to a user record, and the files you will change. Do not change anything yet.' } },
          { text: 'Approve the plan, then ask it to make the change on a new branch.' },
          { text: 'In Clerk, copy the publishable key and secret key. Add them to Netlify\'s environment variables yourself (names as the assistant tells you).', link: K.clerkDocs },
          { text: 'Deploy the branch as a Netlify preview. Sign up with a new test email and sign in again.', expect: 'You sign up, land in the app and your user appears in the Clerk dashboard.' },
          { text: 'Check that a new user starts with the right credits. Merge only when this works.' },
        ],
        complete: ['The plan mapped Clerk users to credits', 'Clerk keys are in Netlify only', 'A new test user signed up and appears in Clerk', 'Credits look right'],
        verify: ['The test user is listed in the Clerk dashboard and sees their own credits in the app.'],
        mistakes: ['Merging before testing a fresh sign-up.', 'Putting the Clerk secret key in the code or the chat.', 'Using a live Clerk instance before you have a domain.'],
        troubleshooting: [
          { problem: 'Sign-up works but credits are missing.', fix: 'The new Clerk user is not linked to a user record. Ask the assistant to create or find the record when a user first signs in.' },
          { problem: 'Sign-in fails on the preview address.', fix: 'Clerk development instances work on preview and netlify.app addresses; a production instance needs your own domain. Ask the assistant to check the Clerk docs for your case.' },
        ],
        resources: [K.clerkDocs, K.clerkPricing],
        glossary: ['clerk', 'oauth', 'credits'],
      },
      {
        id: '13.7',
        title: 'Connect Stripe test payments and check them from the chat',
        minutes: 25,
        outcome: 'A test purchase on your Netlify site adds credits, and your assistant can confirm it from Stripe.',
        appPanel: 'webhook',
        learn: [
          'Stripe is already built into your app. You only connect your own keys and webhook, exactly as in Modules 7 to 9, now on Netlify instead of Vercel. The workshop panel shows your app\'s webhook path.',
          'Keep Stripe in test mode. Use Stripe\'s test card, not a real one. The Stripe connector lets your assistant look at the test payment and the webhook delivery for you.',
          'Going live is a separate, deliberate step covered in lesson 9.4 style checks. Do not switch it on here.',
        ],
        follow: [
          { text: 'In Stripe (test mode) copy the secret key and add it to Netlify\'s environment variables yourself.', link: K.stripeDashboardKeys },
          { text: 'Create a webhook in Stripe pointing at your Netlify address plus the webhook path from your workshop panel, listening for checkout.session.completed. Copy its signing secret into Netlify and redeploy.', link: K.stripeDashboardWebhooks },
          { text: 'Buy a credit pack on your site with a Stripe test card.', link: K.stripeTesting, expect: 'Your credits go up.' },
          { text: 'Ask the assistant to check it through the connectors.', copy: { label: 'Prompt', value: 'Using the Stripe connector in test mode, find my most recent test checkout and tell me whether it succeeded and whether the webhook delivery to my site returned success. Do not change anything.' } },
        ],
        complete: ['Stripe keys and webhook secret are in Netlify only', 'A test purchase added credits', 'The assistant confirmed the payment and webhook from Stripe'],
        verify: ['Stripe shows the test payment succeeded and the webhook delivery succeeded, and your credits increased.'],
        mistakes: ['Using a live key while testing.', 'Forgetting to redeploy after adding the webhook secret.'],
        troubleshooting: [{ problem: 'Payment succeeded but credits did not appear.', fix: 'The webhook failed. Ask the assistant to look at the delivery result in Stripe; the usual cause is a wrong address or signing secret.' }],
        resources: [K.stripeWebhooks, K.stripeTesting],
        glossary: ['stripe', 'webhook', 'credits'],
      },
      {
        id: '13.8',
        title: 'The full build, start to finish, for any of the 38 apps',
        minutes: 20,
        outcome: 'You have a repeatable checklist and prompts you can run for every app you launch.',
        appPanel: 'launch',
        learn: [
          'Every app follows the same path: accounts (13.1), connectors (13.2 or 13.3), brief the assistant (13.4), host on Netlify (13.5), add Clerk (13.6), connect Stripe (13.7), then branding, domain and a full customer test from Module 10.',
          'What changes from app to app is only the facts in your workshop panel: its name, its database and its variable names. The prompts stay the same, so you can reuse them.',
          'When you are happy, go live deliberately: a live Stripe key, your own domain, and a final test with a small real payment you refund yourself.',
        ],
        follow: [
          { text: 'Save the briefing and the prompts from 13.4 to 13.7 in a note so you can paste them for your next app.' },
          { text: 'Run the full customer test from Module 10 on your Netlify address.' },
          { text: 'Ask the assistant for a go-live checklist for your specific app and compare it with Module 10 and 11.', copy: { label: 'Prompt', value: 'Give me a go-live checklist for this app on Netlify with Clerk and Stripe: domain, live keys, webhook, Clerk production instance, and a final test. Mark each item as something I do in a dashboard or something you change in the code.' } },
        ],
        complete: ['I saved my reusable prompts', 'I ran the full customer test', 'I have a go-live checklist for this app'],
        verify: ['You could repeat this build for a second app using only your saved prompts and its workshop page.'],
        mistakes: ['Going live without a final end-to-end test.'],
        troubleshooting: [{ problem: 'Something worked on the preview but not on my domain.', fix: 'Check the variables for the production environment, the Clerk production instance and the Stripe live webhook separately; they are not shared with test mode.' }],
        resources: [K.netlifyDocs, K.clerkDocs, K.stripeKeys],
        glossary: ['deployment', 'env-var'],
      },
    ],
  },
];

/** Base lessons plus the extra depth for each lesson (more explanation, steps and advanced notes). */
export const MODULES_13: Module[] = BASE_13.map((m) => ({
  ...m,
  lessons: m.lessons.map((l) => {
    const x = MODULE_13_EXTRA[l.id];
    if (!x) return l;
    return {
      ...l,
      learn: [...l.learn, ...(x.learn ?? [])],
      follow: [...l.follow, ...(x.follow ?? [])],
      complete: [...l.complete, ...(x.complete ?? [])],
      mistakes: [...l.mistakes, ...(x.mistakes ?? [])],
      advanced: [...(l.advanced ?? []), ...(x.advanced ?? [])],
      minutes: Math.round(l.minutes * 1.5),
    };
  }),
}));

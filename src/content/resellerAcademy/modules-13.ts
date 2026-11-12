import type { Lesson, Module } from './types';
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
          { text: 'Create or sign in to GitHub (you should already have it from Module 3).', link: K.githubSignup, expect: 'You see your GitHub home page, signed in.' },
          { text: 'Create a Netlify account. Choosing "Sign up with GitHub" makes connecting your repo easier.', link: K.netlifySignup, expect: 'You see your Netlify team dashboard.' },
          { text: 'Create a Clerk account.', link: K.clerkSignup, expect: 'Clerk asks you to create an application, or shows its dashboard.' },
          { text: 'When asked, create a Clerk application. Name it after your business and keep Email and Google as sign-in options.', expect: 'You see your Clerk application dashboard with a development instance.' },
          { text: 'Create or sign in to Stripe.', link: K.stripeRegister, expect: 'You see your Stripe dashboard.' },
          { text: 'Stay in test mode (look for the Test mode / Sandbox indicator in the dashboard; menus move, so follow the current screen).', expect: 'A Test mode or Sandbox indicator is visible in your Stripe dashboard.' },
          { text: 'Open each pricing page and note the current free limits, with today\'s date, in your own notes.', link: K.netlifyPricing, expect: 'You see each service\'s current plans and free limits, and your notes list them.' },
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
          { text: 'Open Claude and sign in. Open its settings and find where connectors (or integrations) are managed.', link: K.claudeSite, expect: 'You see a connectors (or integrations) list, which may be empty.' },
          { text: 'Add the Netlify connector and sign in to Netlify when asked. Approve access to your own team.', link: K.netlifyDocs, expect: 'Claude shows Netlify as connected.' },
          { text: 'Add the Stripe connector and sign in. Pick your test-mode account.', link: K.stripeMcp, expect: 'Claude shows Stripe as connected.' },
          { text: 'Add the Clerk connector and sign in. Select the application you created in 13.1.', link: K.clerkDocs, expect: 'Claude shows Clerk as connected.' },
          { text: 'Start a new chat.', expect: 'You see an empty chat in which the three connectors are available.' },
          { text: 'Send this read-only test message.', expect: 'Claude asks your permission to use each connector, then answers with names and payments from your own accounts (or empty lists on a new account).', copy: { label: 'Test message', value: 'Using your Netlify, Stripe and Clerk connectors, list my Netlify sites, my Clerk application name, and my five most recent Stripe test payments. Do not change anything.' } },
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
          { text: 'Open ChatGPT and look in its settings for connectors or apps. If your plan does not show them, read OpenAI\'s current help page for what is available.', link: K.chatgptSite, expect: 'You see a connectors or apps area, or a message that your plan does not include it (then you can finish this module with Claude).' },
          { text: 'Add the Netlify connector, sign in and approve access to your own team only.', expect: 'ChatGPT shows Netlify as connected.' },
          { text: 'Add the Stripe connector, sign in and choose your test-mode account.', expect: 'ChatGPT shows Stripe as connected.' },
          { text: 'Add the Clerk connector, sign in and choose your application.', expect: 'ChatGPT shows Clerk as connected.' },
          { text: 'Start a new chat. If your ChatGPT version asks you to enable connectors per chat, switch on the three you added.', expect: 'The three connectors are shown as enabled for this conversation.' },
          { text: 'Send the same read-only test message you used in 13.2.', copy: { label: 'Test message', value: 'Using your Netlify, Stripe and Clerk connectors, list my Netlify sites, my Clerk application name, and my five most recent Stripe test payments. Do not change anything.' }, expect: 'ChatGPT asks permission where needed and answers with your own site, application and test payment data.' },
          { text: 'Compare the answer with the same facts in your three dashboards.', expect: 'The names and payments in the answer match your dashboards (or both are empty on a new account).' },
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
          { text: 'Open your app\'s workshop page and keep its panels open: they list your app\'s real variable names.', expect: 'You see the workshop panels for your app, including its sign-in, database, payments and variable names.' },
          { text: 'Start a new chat with your assistant and paste the briefing below, replacing the two placeholders with your app name and repo address.', expect: 'The briefing in your chat contains your real app name and repo address, and no secret keys.', copy: { label: 'Briefing', value: 'I am building my own copy of a reseller app called <APP NAME>. My code is in my GitHub repo <YOUR REPO ADDRESS>. It already uses Next.js, Prisma with PostgreSQL, Stripe payments and Google sign-in through NextAuth. My goal: host it on Netlify, replace sign-in with Clerk, and keep the existing Stripe credits flow working in test mode. Work in small steps. Before each change, tell me what you will change and why. Never ask me to paste secret keys into this chat; tell me which dashboard setting to use instead.' } },
          { text: 'Send the briefing and wait for the reply.', expect: 'The assistant restates your goal and agrees to explain each change before making it.' },
          { text: 'Ask it to read the repo and summarise the pieces: the sign-in code, the payment code and the build command.', expect: 'You get a summary naming the sign-in code, the payment code and the build command.' },
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
          { text: 'Ask the assistant to check your app builds on Netlify and to list any change it needs.', copy: { label: 'Prompt', value: 'Check this Next.js app is ready to deploy on Netlify. List the build command, the Node version, and every environment variable the code reads (names only). Tell me about any change needed before I deploy.' }, expect: 'The assistant lists the build command, the Node version, variable names (no values) and any change it thinks is needed.' },
          { text: 'Review the answer: compare the variable names with your workshop page and ask about anything missing or extra.', expect: 'The variable names match your workshop page, or you have asked the assistant to explain each difference.' },
          { text: 'Create the Netlify site from your GitHub repo: ask the assistant to do it through the connector, or do it yourself in Netlify with "Add new project" and choose your repo (menu names move; follow the current screen).', link: K.netlifyDocs, expect: 'Your Netlify dashboard lists a new site connected to your repository.' },
          { text: 'In Netlify, open the site\'s environment variable settings.', expect: 'You see the environment variables page for your site (empty or partly filled).' },
          { text: 'Add each variable from your workshop page. Paste the values yourself, never into the chat.', expect: 'Every variable name from your workshop page is listed in Netlify.' },
          { text: 'Trigger a deploy and wait for it to finish.', expect: 'The deploy shows building and then Published.' },
          { text: 'Open the netlify.app address Netlify shows for the site.', expect: 'Your app\'s home page opens. Sign-in and payments may not work yet.' },
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
          { text: 'Ask the assistant to read the sign-in code and the database tables that hold users and credits, and explain how it would switch to Clerk without losing credits.', copy: { label: 'Prompt', value: 'Plan how to replace NextAuth with Clerk in this app using the current Clerk docs for Next.js. Show me where users and credits are stored, how each Clerk user will map to a user record, and the files you will change. Do not change anything yet.' }, expect: 'The assistant shows where users and credits are stored, how a Clerk user maps to a record and which files it would change, and has changed nothing.' },
          { text: 'Check the plan answers four questions: where credits live, how a Clerk user maps to a record, how a new user gets starting credits, and what happens to existing users.', expect: 'The plan answers all four, or you have asked the assistant to fill in the missing answers.' },
          { text: 'Check that the plan does not touch payment code.', expect: 'No payment or webhook files are in the list of files to change, or you have asked for them to be removed.' },
          { text: 'In Clerk, open the API keys page.', link: K.clerkDocs, expect: 'You see a publishable key and a secret key for your development instance.' },
          { text: 'Add the two keys to Netlify\'s environment variables yourself, using the names the assistant gave you. Never paste them into the chat.', expect: 'Both variable names are listed in Netlify, and the chat contains no key values.' },
          { text: 'Deploy the branch as a Netlify preview and wait for it to finish.', expect: 'Netlify shows a deploy preview for the clerk-signup branch as Published.' },
          { text: 'Open the preview and sign up with a new test email.', expect: 'You sign up, land in the app and your user appears in the Clerk dashboard.' },
          { text: 'Sign out and sign in again with the same test email.', expect: 'You return to the same account with the same credits.' },
          { text: 'Check that a new user starts with the right credits.', expect: 'The credits shown match the starting credits the plan described.' },
          { text: 'Merge the branch only when every check so far works.', expect: 'The branch shows as merged and Netlify starts a production deploy.' },
        ],
        complete: ['The plan mapped Clerk users to credits', 'Clerk keys are in Netlify only', 'A new test user signed up and appears in Clerk', 'Credits look right'],
        verify: ['The test user is listed in the Clerk dashboard and sees their own credits in the app.'],
        mistakes: ['Merging before testing a fresh sign-up.', 'Putting the Clerk secret key in the code or the chat.', 'Using a live Clerk instance before you have a domain.'],
        troubleshooting: [
          { problem: 'The preview deploy did not build or shows no Clerk sign-in.', fix: 'Check the Clerk variable names in Netlify against the list the assistant gave you, redeploy, and ask the assistant to read the deploy log and name the first error.' },
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
          { text: 'In Stripe (test mode) open the API keys page.', link: K.stripeDashboardKeys, expect: 'You see the test-mode API keys page with a secret key you can reveal.' },
          { text: 'Copy the secret key and add it to Netlify\'s environment variables yourself, under the name your workshop panel lists.', expect: 'The variable is listed in Netlify and the key is not in any chat.' },
          { text: 'In Stripe (test mode) open the webhooks page and choose to add an endpoint.', link: K.stripeDashboardWebhooks, expect: 'You see the form for adding a webhook endpoint.' },
          { text: 'Enter your Netlify address plus the webhook path from your workshop panel, and listen for checkout.session.completed.', expect: 'The endpoint is listed in test mode with your address and the checkout.session.completed event.' },
          { text: 'Copy the endpoint\'s signing secret into Netlify\'s environment variables yourself, under the name your workshop panel lists.', expect: 'The signing-secret variable is listed in Netlify.' },
          { text: 'Redeploy the site and wait for it to finish.', expect: 'The deploy shows Published.' },
          { text: 'Buy a credit pack on your site with a Stripe test card.', link: K.stripeTesting, expect: 'Stripe Checkout opens, then you return to your app and your credits go up.' },
          { text: 'Ask the assistant to check it through the connectors.', copy: { label: 'Prompt', value: 'Using the Stripe connector in test mode, find my most recent test checkout and tell me whether it succeeded and whether the webhook delivery to my site returned success. Do not change anything.' }, expect: 'The assistant reports the test checkout succeeded and the webhook delivery returned success, and changes nothing.' },
        ],
        complete: ['Stripe keys and webhook secret are in Netlify only', 'A test purchase added credits', 'The assistant confirmed the payment and webhook from Stripe'],
        verify: ['Stripe shows the test payment succeeded and the webhook delivery succeeded, and your credits increased.'],
        mistakes: ['Using a live key while testing.', 'Forgetting to redeploy after adding the webhook secret.'],
        troubleshooting: [
          { problem: 'Payment succeeded but credits did not appear.', fix: 'The webhook failed. Ask the assistant to look at the delivery result in Stripe; the usual cause is a wrong address or signing secret.' },
          { problem: 'My declined test card added credits.', fix: 'Stop and ask the assistant to explain which Stripe event adds credits. Only a completed checkout should add them.' },
        ],
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
          'Every app follows the same path: accounts (13.1), connectors (13.2 or 13.3), brief the assistant (13.4), host on Netlify (13.5 and 13.6), add Clerk (13.7 to 13.9), connect Stripe (13.10 and 13.11), then branding, domain and a full customer test from Module 10.',
          'What changes from app to app is only the facts in your workshop panel: its name, its database and its variable names. The prompts stay the same, so you can reuse them.',
          'When you are happy, go live deliberately: a live Stripe key, your own domain, and a final test with a small real payment you refund yourself.',
        ],
        follow: [
          { text: 'Save the briefing and the prompts from 13.4 to 13.11 in a note so you can paste them for your next app.', expect: 'You have a note holding the briefing and every prompt, with the app-specific parts marked as placeholders.' },
          { text: 'Open your Netlify address in a private (incognito) window.', expect: 'You see your app\'s home page, signed out.' },
          { text: 'Run the full customer test from Module 10 on that address and note anything that fails.', expect: 'Each check in Module 10 passes, or you have a short list of what failed to give your assistant.' },
          { text: 'Ask the assistant for a go-live checklist for your specific app and compare it with Module 10 and 11.', copy: { label: 'Prompt', value: 'Give me a go-live checklist for this app on Netlify with Clerk and Stripe: domain, live keys, webhook, Clerk production instance, and a final test. Mark each item as something I do in a dashboard or something you change in the code.' }, expect: 'You get a checklist where each item is marked as a dashboard task or a code change, and it covers the same points as Module 10 and 11.' },
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

/** Every lesson is under 20 minutes. Long topics are split into parts that each end at a safe stopping point. */
const MERGED: Record<string, Lesson> = {};
for (const l of BASE_13[0].lessons) {
  const x = MODULE_13_EXTRA[l.id] ?? {};
  MERGED[l.id] = {
    ...l,
    learn: [...l.learn, ...(x.learn ?? [])],
    follow: [...l.follow, ...(x.follow ?? [])],
    complete: [...l.complete, ...(x.complete ?? [])],
    mistakes: [...l.mistakes, ...(x.mistakes ?? [])],
    advanced: [...(l.advanced ?? []), ...(x.advanced ?? [])],
    troubleshooting: [...l.troubleshooting, ...(x.troubleshooting ?? [])],
  };
}
const pick = <T,>(arr: T[], idx: number[]): T[] => idx.map((i) => arr[i]).filter((v) => v !== undefined);

interface Part {
  from: string; id: string; title: string; minutes: number; outcome: string;
  learn?: number[]; extraLearn?: string[]; follow?: number[]; complete: string[]; verify: string[];
  mistakes?: number[]; advanced?: boolean; troubleshooting?: boolean; appPanel?: Lesson['appPanel'];
}
const PARTS: Part[] = [
  { from: '13.1', id: '13.1', title: 'Start your free accounts: Netlify, Clerk and Stripe', minutes: 19, outcome: 'You have free Netlify, Clerk and Stripe accounts (Stripe in test mode) plus GitHub, and know what each one does.', complete: [], verify: [], advanced: true, troubleshooting: true },
  { from: '13.2', id: '13.2', title: 'Connect Claude to Netlify, Clerk and Stripe with connectors', minutes: 18, outcome: 'Claude can see your Netlify sites, your Clerk application and your Stripe test data, with your approval each time.', complete: [], verify: [], advanced: true, troubleshooting: true },
  { from: '13.3', id: '13.3', title: 'Connect ChatGPT the same way', minutes: 17, outcome: 'ChatGPT can use the same three services, or you know exactly what your plan does not allow.', complete: [], verify: [], advanced: true, troubleshooting: true },
  { from: '13.4', id: '13.4', title: 'Give the assistant your app and your plan', minutes: 18, outcome: 'Your assistant knows which app you are building, what it already includes and what you want changed.', complete: [], verify: [], advanced: true, troubleshooting: true },
  { from: '13.5', id: '13.5', title: 'Check your app is ready and create the Netlify site', minutes: 18, outcome: 'Your app is checked for Netlify and a Netlify site is connected to your GitHub repo.', learn: [0, 3], follow: [0, 1, 7, 2], complete: ['The assistant listed the build command and every variable name, matching my workshop page', 'Any change was on a branch and explained first', 'A Netlify site exists, connected to my repository'], verify: ['Your Netlify dashboard lists the new site connected to your repository.'], mistakes: [], appPanel: 'envvars' },
  { from: '13.5', id: '13.6', title: 'Add variables, deploy and fix failures', minutes: 18, outcome: 'Your app builds on Netlify and opens at a netlify.app address, with every secret in Netlify and none in the chat.', learn: [1, 2, 4, 5], follow: [3, 4, 5, 9, 8, 6], complete: ['All variables are set in Netlify, not in chat', 'I redeployed after adding variables', 'The deploy shows Published'], verify: ['Your netlify.app address opens your app\'s home page.'], mistakes: [0, 1], advanced: true, troubleshooting: true, appPanel: 'envvars' },
  { from: '13.6', id: '13.7', title: 'Plan the Clerk change', minutes: 15, outcome: 'You have a reviewed plan for replacing NextAuth with Clerk that keeps every person\'s credits.', learn: [0, 4, 5, 2], follow: [0, 1, 2], complete: ['The plan mapped Clerk users to credits', 'It says what happens to existing users, or I have none', 'The plan does not touch payment code'], verify: ['You can say in one sentence how a Clerk user is linked to their credits.'], mistakes: [0], appPanel: 'accounts' },
  { from: '13.6', id: '13.8', title: 'Make the Clerk change and add the keys', minutes: 15, outcome: 'Clerk works on a Netlify preview deploy, with its keys in Netlify only.', learn: [1, 3, 6], follow: [10, 3, 4, 5], complete: ['The change is on a branch called clerk-signup', 'Clerk keys are in Netlify only', 'A preview deploy of the branch built successfully'], verify: ['The preview deploy opens and shows Clerk sign-in.'], mistakes: [1], appPanel: 'accounts' },
  { from: '13.6', id: '13.9', title: 'Test sign-up and merge', minutes: 15, outcome: 'A fresh test sign-up works, appears in Clerk and has the right credits, and the branch is merged.', extraLearn: ['Test on the preview deploy from the last lesson with a brand-new email, because an existing session hides problems. Only merge when every check passes.'], follow: [6, 7, 8, 11, 12, 13, 9], complete: ['A new test user signed up and appears in Clerk', 'Credits look right and survive sign-out and sign-in', 'I merged only after every test passed'], verify: ['The test user is listed in the Clerk dashboard and sees their own credits in the app.'], mistakes: [], advanced: true, troubleshooting: true, appPanel: 'accounts' },
  { from: '13.7', id: '13.10', title: 'Stripe keys and the webhook', minutes: 18, outcome: 'Your Stripe test keys and a webhook endpoint are connected to your Netlify site.', learn: [0, 3, 4], follow: [0, 1, 2, 3, 4, 5], complete: ['Stripe test keys and the webhook signing secret are in Netlify only', 'The webhook points at my site and the path from my workshop page', 'I redeployed after adding them'], verify: ['Stripe lists your webhook endpoint in test mode.'], mistakes: [], appPanel: 'webhook' },
  { from: '13.7', id: '13.11', title: 'Test purchase and check it from the chat', minutes: 15, outcome: 'A test purchase on your Netlify site adds credits, and your assistant confirms it from Stripe.', learn: [1, 2, 5], follow: [6, 7, 8, 9, 10, 11], complete: ['A test purchase added credits', 'The assistant confirmed the payment and webhook from Stripe', 'A declined card added nothing'], verify: ['Stripe shows the test payment succeeded and the webhook delivery succeeded, and your credits increased.'], mistakes: [0, 1], advanced: true, troubleshooting: true, appPanel: 'webhook' },
  { from: '13.8', id: '13.12', title: 'Save your prompts and run the customer test', minutes: 15, outcome: 'You have a repeatable checklist for any of the 38 apps and a passing customer test on your Netlify address.', learn: [0, 1, 5], follow: [0, 1, 2, 11], complete: ['I saved my reusable prompts', 'I ran the full customer test in a private window', 'I set a weekly reminder to check failures'], verify: ['You could repeat this build for a second app using only your saved prompts and its workshop page.'], mistakes: [], appPanel: 'launch' },
  { from: '13.8', id: '13.13', title: 'Go live: domain, Clerk production and Stripe live', minutes: 19, outcome: 'Your app is live on your own domain with Clerk production and Stripe live, tested with a real payment you refunded.', learn: [2, 3, 4], follow: [3, 4, 5, 6, 7, 8, 9, 10], complete: ['I have a go-live checklist for this app', 'I understand domain, Clerk production and Stripe live are three separate switches', 'I refunded my own test purchase'], verify: ['A real sign-up and a small real payment work on your own domain, and the live webhook delivery succeeded.'], mistakes: [0, 1], advanced: true, troubleshooting: true, appPanel: 'launch' },
];

const lessons: Lesson[] = PARTS.map((p) => {
  const m = MERGED[p.from];
  const whole = p.learn === undefined && p.follow === undefined;
  const learn = whole ? m.learn : [...pick(m.learn, p.learn ?? []), ...(p.extraLearn ?? [])];
  return {
    ...m,
    id: p.id,
    title: p.title,
    minutes: p.minutes,
    outcome: p.outcome,
    learn,
    follow: whole ? m.follow : pick(m.follow, p.follow ?? []),
    complete: p.complete.length ? p.complete : m.complete,
    verify: p.verify.length ? p.verify : m.verify,
    mistakes: whole ? m.mistakes : pick(m.mistakes, p.mistakes ?? []).concat(p.mistakes?.length ? [] : ['Skipping a check at the end of the lesson.']),
    advanced: p.advanced ? m.advanced : undefined,
    troubleshooting: whole || p.troubleshooting ? m.troubleshooting : [{ problem: 'Something did not match what the lesson says you should see.', fix: 'Stop, copy the exact message or describe what you see to your assistant, and ask it to explain the first problem before changing anything.' }],
    appPanel: p.appPanel ?? m.appPanel,
  };
});

export const MODULES_13: Module[] = [{ ...BASE_13[0], lessons }];

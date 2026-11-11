import type { FollowStep } from './types';
import { LINKS as K } from './links';

/**
 * Extra depth for Module 13 lessons (merged in modules-13.ts). Same safety rules as the module:
 * names of variables only, never values; follow the official page for menu names.
 */
export interface Module13Extra {
  learn?: string[];
  follow?: FollowStep[];
  advanced?: string[];
  mistakes?: string[];
  complete?: string[];
}

export const MODULE_13_EXTRA: Record<string, Module13Extra> = {
  '13.1': {
    learn: [
      'The AI part (MuAPI) and the database (Supabase or Neon) are already set up from Modules 4 and 5. If you skipped them, do those first, because hosting needs the database address.',
      '"Free" means a free plan with limits, not free at any size. Typical limits are build minutes, bandwidth and monthly active users. Write the limits you see, with today\'s date, so you can notice when you are getting close.',
      'Protect each account like the keys to a shop: a strong unique password in a password manager, two-step sign-in, and your business email so the accounts never depend on a personal address.',
    ],
    follow: [
      { text: 'Turn on two-step sign-in in each of the four accounts and save the recovery codes somewhere safe, away from the chat.' },
      { text: 'In Clerk, find the API keys page and look at it without copying anything. You will use the keys in lesson 13.8.', link: K.clerkDocs },
    ],
    advanced: [
      'Netlify can deploy from several branches. The "production" branch is what customers see; every other branch can get its own preview address. You will use previews to test Clerk safely in 13.9.',
      'Clerk separates a development instance from a production instance, each with its own keys and its own users. Stripe separates test mode from live mode the same way. Keep this pattern in mind: nothing carries over from "practice" to "real" automatically.',
    ],
    complete: ['Two-step sign-in is on and recovery codes are saved', 'I wrote today\'s date next to each free-plan limit'],
  },
  '13.2': {
    learn: [
      'A connector changes what a chat can do from "explain" to "act". The safety comes from you approving access narrowly: one team, one Clerk application, your test-mode Stripe account.',
      'Connectors are removable. You can disconnect each one from the chat\'s settings and from the service\'s own list of authorized apps. If you ever approved the wrong account, remove it and reconnect.',
      'A new account will show zero sites and zero payments. That is a good test result: it proves Claude reached your account, not someone else\'s.',
    ],
    follow: [
      { text: 'Check the answer matches your dashboards (empty lists are fine). If it shows the wrong account or live Stripe data, disconnect, sign out of that service in your browser, and reconnect with the right account.' },
      { text: 'Send this once to set the rule for the whole project.', copy: { label: 'Working rule', value: 'Do not ask me for secret keys. If a step involves a key, tell me the variable name and which dashboard page to paste it into.' } },
    ],
    advanced: [
      'Connectors are usually built on the Model Context Protocol (MCP), an open standard for letting assistants use tools. Both Claude and ChatGPT use it, which is why the same three services work with either.',
      'Some connectors list their tools only after a separate authorization. If a connector shows as added but the chat cannot use it, complete that authorization from its entry in settings.',
    ],
    mistakes: ['Approving a connector for a client or employer account.', 'Ignoring a connector that stays in an "authorization needed" state.'],
  },
  '13.3': {
    learn: [
      'Pick one assistant for the build, because one conversation that knows your app beats two that each know half. Use the other as a second opinion: paste an error message (never a secret) and ask for an independent explanation.',
      'If a feature is missing in ChatGPT it is usually a plan or workspace setting, not something you did wrong. Check OpenAI\'s current help page for what your plan allows.',
      'Even when connectors are unavailable you can finish the whole module: ask the assistant to explain each change, and make the dashboard changes yourself.',
    ],
    follow: [
      { text: 'Check that each connector is switched on for the conversation you are using, if your ChatGPT version asks you to enable them per chat.' },
      { text: 'Read every confirmation before approving an action that changes something. Approve only what you expect.' },
    ],
    advanced: ['Write actions may ask for confirmation each time. That is a feature: it is your chance to catch a wrong target (for example, a live Stripe account instead of test).'],
  },
  '13.4': {
    learn: [
      'A good briefing has four parts: where the code is, what the app already includes, what you want changed, and how you want to work. Most failed AI builds fail because one of these is missing.',
      'You do not need to understand every line of a change. Check three things: does the explanation match what you asked for, is the change on a branch, and is there a test you can run ("open this page, you should see this")?',
    ],
    follow: [
      { text: 'Compare the assistant\'s summary with the workshop panels: same sign-in system, same Stripe webhook route, same variable names, and the place where users and credits are stored. Correct anything it got wrong.' },
      { text: 'Send the working rules message.', copy: { label: 'Working rules', value: 'For the rest of this project: always show me a plan first, change one thing at a time, tell me how to test each change, and tell me exactly which dashboard I must visit for anything involving a key or a setting.' } },
    ],
    advanced: [
      'If the assistant starts changing payment code while you asked about sign-in, stop it: "Explain why this is needed and what could go wrong." Unexpected scope is the most common sign a plan went off track.',
    ],
    mistakes: ['Skipping the summary check: a wrong assumption now becomes a broken build later.'],
  },
  '13.5': {
    learn: [
      'Netlify builds your app each time you push. If a build fails, the previous working version keeps serving, so a failed deploy does not take your site down.',
      'The assistant lists the variable names; you paste the values into Netlify. After adding or changing any variable you must redeploy, because the app reads them when it is built or started.',
      'Two values need care: the variable holding your site\'s own public address (it must match the real netlify.app address, so set it after the first deploy and redeploy), and the database address (use the application connection string your host gives you).',
    ],
    follow: [
      { text: 'If the assistant proposes a configuration change for Netlify, ask for it on a new branch (for example netlify-setup) and have it explain the change first. It should not change how the app behaves.' },
      { text: 'After the first deploy, set the variable that holds your site\'s public address to the real netlify.app address, then redeploy.' },
      { text: 'If the deploy fails, ask the assistant to read the log and name only the first error.', copy: { label: 'Prompt', value: 'Read the failed deploy log through the Netlify connector and tell me the first error and what causes it. Do not change anything yet.' } },
    ],
    advanced: [
      'Fix one error at a time and redeploy after each. The first error is usually the real one; later errors are often consequences of it.',
      'At this stage the home page should load. Sign-in and payments may not work yet: Clerk replaces sign-in in lessons 13.7 to 13.9 and the Stripe webhook is created in 13.10.',
    ],
    mistakes: ['Fixing several errors at once so you cannot tell which fix worked.', 'A typo or wrong capital in a variable name.'],
  },
  '13.6': {
    learn: [
      'Clerk keeps the account and the session. Your app asks Clerk "who is signed in?" and gets a user ID, then uses it to find or create its own user record and its credits. That link is what must not break.',
      'The plan comes before the code. Ask where users and credits are stored, how a Clerk user maps to a record, how a new user gets starting credits, and what happens to people who already signed in with Google. A brand-new app with no customers can ignore the last one.',
      'Clerk\'s development instance works on netlify.app and preview addresses. A production instance needs your own domain, has its own keys and its own user list, and is set up in lesson 13.13.',
    ],
    follow: [
      { text: 'Ask for the change on a new branch called clerk-signup, one explained file at a time. Ask it to tell you the variable names to add in Netlify, not the values.', copy: { label: 'Prompt', value: 'Create a branch called clerk-signup and make the change you described. Explain each file you change. Tell me the exact environment variable names I need to add in Netlify. Do not ask me for secret keys.' } },
      { text: 'Test the edge cases on the preview: signing in with Google if you enabled it, visiting a signed-in page while signed out (you should be sent to sign-in), and visiting sign-in while signed in (you should be sent into the app).' },
      { text: 'Sign out and sign back in. You must return to the same account and the same credits.' },
    ],
    advanced: [
      'If you ever see a redirect loop, ask the assistant to read the middleware and explain which routes are public. This is the usual cause.',
      'If an existing customer base must move to Clerk, ask for a migration plan that keeps their credits and shows you a dry run first. Do not do this on live data without a backup.',
    ],
    mistakes: ['Letting the assistant change payment code as part of the sign-in change.', 'Using the Clerk production instance before you have your own domain.'],
  },
  '13.7': {
    learn: [
      'Stripe is already built in, so you are only connecting your account to your deployment. The flow: the customer pays on Stripe\'s page, Stripe sends your app a webhook, your app checks the signing secret and adds the credits.',
      'The two things people get wrong are the webhook address and the signing secret. Each webhook endpoint has its own signing secret: copy the one for this endpoint, add it to Netlify and redeploy.',
      'Test and live data are completely separate. A test key cannot see live payments and the other way round, which is why test mode is safe to experiment in.',
    ],
    follow: [
      { text: 'Test the unhappy paths: a declined test card must add nothing, cancelling on the Checkout page must come back with no credits, and buying twice must add credits twice, not once or four times.', link: K.stripeTesting },
      { text: 'If credits go to the wrong person, stop and ask the assistant how a checkout is tied to a user. This usually traces back to the user mapping from lessons 13.7 to 13.9.' },
    ],
    advanced: [
      'A trailing slash or a wrong path in the webhook address is a very common cause of "payment succeeded but credits did not appear". Compare the endpoint address with the path in your workshop panel character by character.',
      'Ask the assistant to list recent webhook deliveries and their response codes. A pattern of failures means the signing secret or address is wrong; a pattern of success with no credits means the handler ran but could not find the user.',
    ],
    mistakes: ['Copying the signing secret from a different webhook endpoint.'],
  },
  '13.8': {
    learn: [
      'Going live changes three things at once, and none of them carries over from test: your domain (add it in Netlify and follow its DNS instructions), the Clerk production instance (its own domain, keys and empty user list) and Stripe live mode (live keys and a live webhook for your real address).',
      'Keep production values in Netlify\'s production environment only. Never put live keys in preview builds.',
      'After launch, check weekly for failed deploys and failed webhook deliveries, watch your free-plan limits, rotate any key that was ever exposed and back up your database as your host recommends.',
    ],
    follow: [
      { text: 'Add your domain in Netlify and follow its DNS instructions. Wait until the domain is confirmed before changing Clerk and Stripe.', link: K.netlifyDocs },
      { text: 'Create the Clerk production instance for your domain and put its keys in Netlify\'s production variables. Create the live Stripe webhook for your real address and put its signing secret in Netlify. Redeploy.', link: K.clerkDocs },
      { text: 'Final test: sign up with a new real email on your domain, buy the smallest credit pack with a real card, confirm credits and the successful webhook, then refund the payment yourself in Stripe.', link: K.stripeDashboardPayments },
      { text: 'Set a weekly reminder to ask the assistant for a summary of failed deploys and failed webhook deliveries.', copy: { label: 'Weekly prompt', value: 'Summarise failed Netlify deploys and failed Stripe webhook deliveries from the last 7 days and tell me what each one means. Do not change anything.' } },
    ],
    advanced: ['Sign-in that fails only on your domain usually means the Clerk production instance does not list the domain yet. A payment that succeeds with no effect usually means the live webhook is missing or uses the test signing secret.'],
    mistakes: ['Not refunding your own test purchase.', 'Carrying test keys into production or live keys into previews.'],
  },
};

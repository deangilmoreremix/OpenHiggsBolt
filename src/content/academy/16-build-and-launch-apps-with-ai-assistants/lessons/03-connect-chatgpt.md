# Connect ChatGPT the same way

> **Time:** about 15 minutes. **You will finish with:** ChatGPT connected to Netlify, Clerk and Stripe, or a clear decision to build with Claude instead.

---

## Before you start

You will connect ChatGPT to the same three services you opened in lesson 1: **Netlify** (hosting), **Clerk** (sign-up) and **Stripe** (payments, in test mode). ChatGPT uses connectors built on the same open standard as Claude, so the safety rules are exactly the ones from lesson 2: sign in to your own accounts, approve only what you understand, and test with a question that only reads.

What is different is **whether and where** you can add connectors. That depends on your ChatGPT plan, on whether your workspace admin allows third-party connectors, and on menus that OpenAI renames and moves from time to time. So this lesson teaches the flow and tells you what the result should look like. If a label differs on your screen, follow OpenAI's current help page for connectors and apps.

You will need:

* Your Netlify, Clerk and Stripe accounts from lesson 1, each signed in to in this browser.
* About 15 minutes.

## Do you need both assistants?

No. Pick one to do the build and stay with it, because one conversation that knows your app is more useful than two that each know half.

* Use the assistant whose connectors worked first time on your plan.
* Keep the other as a second opinion for a stubborn error: paste the error message (never a secret) and ask for an independent explanation.

If you already finished lesson 2 and Claude works for you, you can skip this lesson and come back if you ever want a second opinion.

## Step by step

### 1. Check whether your plan allows connectors

1. Open ChatGPT and sign in.
2. Open its settings and look for an area called connectors, apps or integrations.

**You should see:** a list of services you can connect, or a button to add one.

**If you do not:** your plan or workspace may not allow connectors. Skip to step 7. You have not done anything wrong.

### 2. Add Netlify

1. Choose to add or connect Netlify.
2. Sign in to Netlify when asked, using the account from lesson 1.
3. When Netlify shows what is being requested, approve access for **your own team only**.

**You should see:** Netlify listed as connected in ChatGPT.

**If not:** if a window opens and closes without finishing, allow pop-ups for ChatGPT and try again.

### 3. Add Stripe (test mode only)

1. Choose to add or connect Stripe and sign in.
2. Pick your **test-mode** account when asked, and approve.

**You should see:** Stripe listed as connected, and the test or sandbox account named.

**If not:** if it shows a live account, disconnect it and reconnect, choosing test mode. Nothing in this course needs live mode yet.

### 4. Add Clerk

1. Choose to add or connect Clerk and sign in.
2. Select the application you created in lesson 1 and approve.

**You should see:** Clerk listed as connected with your application's name.

**If not:** some connectors need a separate authorization before their tools appear. Open the connector's entry and finish that sign-in.

### 5. Run the read-only test

Open a new chat and make sure the connectors are switched on for it, if ChatGPT asks you to enable them per chat. Then paste this and send it:

```text
Using your Netlify, Stripe and Clerk connectors, list my Netlify sites, my Clerk application name, and my five most recent Stripe test payments. Do not change anything.
```

**You should see:** an answer with names from your own accounts. A brand-new account will say it has no sites and no payments. That is a good result: it proves ChatGPT reached **your** accounts.

**If not:** if it says it cannot see a service, check that connector is enabled for this chat. If ChatGPT asks to confirm an action, read it carefully. This test should never need you to approve a change.

### 6. Compare the answer with your dashboards

Open the Netlify, Clerk and Stripe dashboards in other tabs and check the answer against them.

**You should see:** the same Clerk application name, the same (possibly empty) lists, and Stripe in test mode.

**If not:** a different name or live Stripe data means you connected the wrong account. Disconnect that connector, sign out of that service in your browser, sign in with the right account and connect again.

### 7. If your plan does not allow connectors

You can still finish the whole course:

1. Do the build with **Claude** (lesson 2), or
2. Keep using ChatGPT without connectors: ask it to explain each change and to tell you exactly which dashboard to open, and make the dashboard changes yourself.

Either way, the rule does not change: **never paste a secret key into the chat.**

## Check yourself

* [ ] I connected ChatGPT to Netlify, Clerk and Stripe, **or** I confirmed my plan does not allow it and will use Claude.
* [ ] The read-only test returned my real data and changed nothing.
* [ ] Stripe shows test mode.
* [ ] I know how to disconnect each connector.

## Differences worth knowing

* Some features exist only on certain plans or only in certain modes. If a feature is missing, it is usually the plan, not you.
* Connector tools may need to be switched on in each chat. If the chat says it cannot see Netlify, check that first.
* Actions that change something may ask for confirmation each time. Read it and approve only what you expect.
* You can disconnect a connector from ChatGPT's settings and from the service's own list of authorized apps.

## Common mistakes

* **Copying a menu path from an old video.** These menus move. Use the official page.
* **Assuming it works because it connected.** Always run the read-only test.
* **Giving broad access.** Approve one team, one application and test mode.
* **Pasting a key to "help".** The connector signs in for you, so the chat never needs your secret keys.

Next: lesson 4, briefing your assistant on the app.

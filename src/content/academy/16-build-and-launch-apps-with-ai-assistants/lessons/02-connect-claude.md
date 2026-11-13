# Connect Claude to Netlify, Clerk and Stripe

> **Time:** about 15 minutes. **You will finish with:** Claude connected to your three services, proven by a read-only test.

---

## Before you start

Without connectors, a chat can only talk. It can explain how to deploy a site, but it cannot see your Netlify account. A **connector** (sometimes called a plugin or an integration) gives the chat a controlled way to use another service **as you**. You sign in to the service, approve what the chat may do, and from then on you can say:

* "List my Netlify sites and their last deploy."
* "Show my five most recent Stripe test payments."
* "Which Clerk application am I connected to?"

Most connectors are built on an open standard called the Model Context Protocol (MCP). You do not need to understand it. What you do need to understand is the trust model:

1. **You** sign in to the real service.
2. The service tells you what the chat is asking permission to do.
3. **You** approve it, and you can remove it any time from the same settings.

The chat never needs your password or your secret keys, because the connector holds the sign-in.

Netlify, Stripe and Clerk each offer a connector for Claude. Availability depends on your Claude plan and on whether your workspace allows connectors, and the names and places of the menus change. So this lesson teaches the flow and what the result looks like; where a label differs on your screen, follow the official page for each service.

You will need:

* Your Netlify, Clerk and Stripe accounts from lesson 1, each signed in to in this browser.
* About 15 minutes.

## Step by step

### 1. Open the connector settings

1. Open Claude, sign in, and open its settings.
2. Look for the area that manages **connectors** (or integrations).

**You should see:** a list of connectors, or a button to add one.

**If not:** your plan or workspace may restrict connectors. Check the official help page for your plan, or ask your workspace admin.

### 2. Add Netlify

1. Add the Netlify connector. A Netlify sign-in page opens; sign in with the account from lesson 1.
2. When Netlify shows what is being requested, approve access for **your own team** only.

**You should see:** Netlify shown as connected back in Claude.

**If not:** if the window opens and closes without finishing, allow pop-ups for Claude and try again.

### 3. Add Stripe (test mode only)

1. Add the Stripe connector and sign in.
2. Choose your **test-mode** account when asked, and approve.

**You should see:** Stripe shown as connected, with the test or sandbox account named. Stripe's documentation describes its connector and what it can do; the page is linked in the Reseller Setup Walkthrough, lesson 13.2.

**If not:** if it shows a live account, disconnect and reconnect, choosing test mode. Nothing in this course needs live mode before lesson 13.

### 4. Add Clerk

1. Add the Clerk connector and sign in.
2. Select the application you created in lesson 1 and approve.

**You should see:** Clerk shown as connected with your application's name.

**If not:** some connectors need a separate authorization step before their tools appear. If Clerk says it needs authorization, finish that sign-in from the connector's entry in settings.

### 5. Run the read-only test

Open a new chat and paste this:

```text
Using your Netlify, Stripe and Clerk connectors, list my Netlify sites, my Clerk application name, and my five most recent Stripe test payments. Do not change anything.
```

**You should see:** an answer naming your Clerk application and either "no sites" or the sites you really have. A new account will show zero sites and zero payments. That is fine: you are checking that Claude reaches the right account, not that there is data.

**If not:** if Claude says it cannot see a service, open that connector's entry in settings and finish any pending authorization. This test should never need you to approve a change.

### 6. Compare the answer with your dashboards

Open the Netlify, Clerk and Stripe dashboards in other tabs and check the answer against them.

**You should see:** the same Clerk application name, the same (possibly empty) lists, and Stripe in test mode.

**If not:** a different name or live Stripe data means you signed in with a different account in the browser. Disconnect that connector, sign out of the service, sign in with the right account and reconnect.

## Check yourself

* [ ] All three connectors show as connected.
* [ ] The read-only test answered with facts from my own accounts.
* [ ] Nothing was changed by the test.
* [ ] I know how to disconnect each connector.

## Keeping it safe

* **Approve narrowly.** Choose your own team, your test-mode Stripe account, your one Clerk application.
* **Read before write.** Until you trust the setup, ask questions before you ask for changes.
* **Know how to remove it.** Each connector can be disconnected from the same settings, and from inside the service's own "authorized apps" page.

## Common mistakes

* **Pasting a secret key to "help".** If the chat asks for a secret key, stop: the connector should not need it. Say: "Do not ask me for secret keys. Tell me which dashboard setting to fill in."
* **Assuming it works because it connected.** Always run the read-only test.
* **Approving a live Stripe account.** Test mode only until lesson 13.
* **Copying a menu path from an old video.** These menus move. Use the official page.

Next: lesson 3, ChatGPT.

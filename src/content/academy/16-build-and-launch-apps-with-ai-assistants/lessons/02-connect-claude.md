# Connect Claude to Netlify, Clerk and Stripe

> **Time:** about 20 minutes. **You will finish with:** Claude connected to your three services, proven by a read-only test.

---

## What a connector is

Without connectors, a chat can only talk. It can explain how to deploy a site, but it cannot see your Netlify account. A **connector** (sometimes called a plugin or an integration) gives the chat a controlled way to use another service **as you**. You sign in to the service, approve what the chat may do, and from then on you can say:

* "List my Netlify sites and their last deploy."
* "Show my five most recent Stripe test payments."
* "Which Clerk application am I connected to?"

Most connectors are built on an open standard called the Model Context Protocol (MCP). You do not need to understand it. What you do need to understand is the trust model:

1. **You** sign in to the real service.
2. The service tells you what the chat is asking permission to do.
3. **You** approve it, and you can remove it any time from the same settings.

The chat never needs your password or your secret keys, because the connector holds the sign-in.

## Which connectors

Netlify, Stripe and Clerk each offer a connector for Claude. Availability depends on your Claude plan and on whether your workspace allows connectors, and the names and places of the menus change. So this lesson teaches the flow and what the result looks like; where a label differs, follow the official page for each service.

## Step by step

### 1. Open the connector settings

Open Claude, sign in, and open its settings. Look for the area that manages **connectors** (or integrations). If you cannot find it, your plan or workspace may restrict it; check the official help page for your plan, or ask your workspace admin.

### 2. Add Netlify

1. Add the Netlify connector.
2. A Netlify sign-in page opens. Sign in with the account from lesson 1.
3. Netlify shows what is being requested. Approve access for **your own team** only.
4. Back in Claude, Netlify shows as connected.

### 3. Add Stripe

1. Add the Stripe connector and sign in.
2. Choose your **test-mode** account when asked, and approve.
3. Confirm Stripe shows as connected.

Stripe's documentation describes its connector and what it can do; the page is linked in the Reseller Setup Walkthrough, lesson 13.2.

### 4. Add Clerk

1. Add the Clerk connector and sign in.
2. Select the application you created in lesson 1.
3. Some connectors need a separate authorization step before their tools appear. If Clerk says it needs authorization, finish that sign-in from the connector's entry in settings.

### 5. Test with a question that only reads

Open a new chat and paste:

> Using your Netlify, Stripe and Clerk connectors, list my Netlify sites, my Clerk application name, and my five most recent Stripe test payments. Do not change anything.

A new account will show zero sites and zero payments. That is fine: you are checking that Claude reaches the right account, not that there is data. The answer should name your Clerk application and say "no sites" or list what you really have.

## Check yourself

* [ ] All three connectors show as connected.
* [ ] The read-only test answered with facts from my own accounts.
* [ ] Nothing was changed by the test.

## Keeping it safe

* **Approve narrowly.** Choose your own team, your test-mode Stripe account, your one Clerk application.
* **Read before write.** Until you trust the setup, ask questions before you ask for changes.
* **Know how to remove it.** Each connector can be disconnected from the same settings, and from inside the service's own "authorized apps" page.
* **Never paste secrets.** If the chat asks for a secret key, stop: the connector should not need it. Say: "Do not ask me for secret keys. Tell me which dashboard setting to fill in."

## If something is off

* *A connector says it needs authorization.* Its tools only appear after you complete sign-in; finish it from its entry in settings.
* *The answer shows the wrong account.* You signed in with a different account in the browser. Disconnect, sign out of the service, sign in with the right one and reconnect.
* *Stripe shows live payments.* You approved a live account. Disconnect and reconnect, choosing test mode.

Next: lesson 3, ChatGPT.

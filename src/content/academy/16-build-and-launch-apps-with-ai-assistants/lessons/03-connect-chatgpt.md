# Connect ChatGPT the same way

> **Time:** about 15 minutes. **You will finish with:** ChatGPT connected to your three services, or a clear decision to use Claude.

---

## Same idea, different menus

ChatGPT can also use connectors built on the same open standard (the Model Context Protocol). The principles are identical to lesson 2: you sign in, you approve narrowly, you test with a question that only reads.

What differs is **whether and where** you can add them. That depends on your ChatGPT plan, on whether your workspace admin allows custom or third-party connectors, and on settings that OpenAI renames and moves from time to time. Because of that, start with OpenAI's current help page for connectors and apps, and treat anything below as the flow, not the exact button names.

## Do you need both assistants?

No. Pick one to do the build and stay with it, because a single conversation that knows your app is more useful than two that each know half. Many people keep the other as a second opinion for a stubborn error: paste the error message (never a secret) and ask for an independent explanation.

A reasonable choice:

* Use the assistant whose connectors worked first time on your plan.
* Use the other for review: "Here is the change my other assistant made. Explain what it does and tell me anything risky."

## Step by step

1. Open ChatGPT, sign in, and look in settings for connectors or apps.
2. If your plan shows them, add **Netlify**, **Stripe** and **Clerk**, signing in to each with your own account and approving only your team, your test-mode Stripe account and your Clerk application.
3. If your plan does not show them, read OpenAI's help page for what is available to you. You can still follow the rest of the track: ask the assistant to explain each change and make the dashboard changes yourself, or do the build with Claude.
4. Run the same read-only test as lesson 2:

> Using your Netlify, Stripe and Clerk connectors, list my Netlify sites, my Clerk application name, and my five most recent Stripe test payments. Do not change anything.

5. Compare the answer with your three dashboards.

## Differences worth knowing

* Some features are available only on certain plans or only in certain modes. If a feature is missing, it is usually the plan, not you.
* Connector tools may need to be explicitly switched on in each chat. If the chat says it cannot see Netlify, check that the connector is enabled for this conversation.
* Write actions (changing something) may ask for confirmation each time. Read the confirmation and approve only what you expect.

## Check yourself

* [ ] I connected ChatGPT, **or** I confirmed my plan does not allow it and will use Claude.
* [ ] The read-only test returned my real data.
* [ ] I know how to disconnect each connector.

## Common mistakes

* **Copying a menu path from an old video.** These menus move; use the official page.
* **Assuming it works because it connected.** Always run the read-only test.
* **Giving broad access.** Approve one team, one application, test mode.

Next: lesson 4, briefing your assistant on the app.

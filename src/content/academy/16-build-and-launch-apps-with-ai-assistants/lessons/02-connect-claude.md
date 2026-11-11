# Connect Claude to Netlify, Clerk and Stripe

## What a connector is

A connector (also called a plugin) lets a chat use another service for you. You sign in to the service, approve access, and then you can ask the chat to do things there, such as listing your Netlify sites or checking a Stripe test payment. Most are built on the Model Context Protocol (MCP).

## Steps

1. Open Claude, then its settings, and find where connectors are managed.
2. Add the **Netlify** connector and sign in to your own team.
3. Add the **Stripe** connector and choose your **test-mode** account.
4. Add the **Clerk** connector and choose the application you created.
5. Start a new chat and test with a read-only message:

> Using your Netlify, Stripe and Clerk connectors, list my Netlify sites, my Clerk application name, and my five most recent Stripe test payments. Do not change anything.

## Check yourself

Claude answers with real names from your own accounts and changes nothing.

## If something is off

* A connector that says it needs authorization has not finished sign-in. Complete it from the connector settings.
* If you cannot find where to add connectors, your plan or workspace may restrict them. Check the official page for your plan.

Never paste a secret key into the chat. The connector signs in for you.

Full follow-along version: Reseller Setup Walkthrough, lesson 13.2.

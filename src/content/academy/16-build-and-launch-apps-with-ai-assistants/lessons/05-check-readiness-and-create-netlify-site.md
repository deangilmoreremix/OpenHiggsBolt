# Check your app is ready and create the Netlify site

> **Time:** about 18 minutes. **You will finish with:** your app checked for Netlify and a Netlify site connected to your GitHub repo.

---

## What Netlify does

Netlify connects to your GitHub repository. Every time you push a change, it **builds** the app (turns the code into something a browser can run) and **publishes** it. You do not run a server. If a build fails, nothing breaks: the previous working version keeps serving until a new one succeeds.

For a Next.js app, Netlify provides its own support for running Next.js features. Which settings you need (Node version, build command, plugin) can change between versions, so the assistant should check the current Netlify docs for Next.js rather than guess.

## Step by step

### 1. Ask the assistant to check the app is ready

> Check this Next.js app is ready to deploy on Netlify, using the current Netlify docs for Next.js. List the build command, the Node version needed, and every environment variable the code reads (names only). Tell me about any change needed before I deploy, and wait for my approval before changing anything.

Compare the variable list with the Environment panel on your workshop page. They should match. Differences are worth a question: "Why does the code read X when my workshop page does not list it?"

### 2. Make any approved changes on a branch

If the assistant proposes a change (for example a Netlify configuration file, or a build setting), ask it to put it on a new branch named something like `netlify-setup`, and to explain it first. A typical result is a small configuration file; there should be no changes to your app's behaviour.

### 3. Create the site

Either:

* **Ask the assistant** to create the Netlify site from your GitHub repository through the connector, or
* **Do it yourself:** in Netlify choose to add a new project, import from GitHub, pick your repository and branch, and accept the build settings the assistant listed.

Doing it yourself the first time is a good way to learn where things are.

## Check yourself

* [ ] The assistant listed the build command and every variable name, and it matches my workshop page.
* [ ] Any change was on a branch and explained first.
* [ ] A Netlify site exists, connected to my repository.

## Common mistakes

* **Accepting changes that alter the app's behaviour.** Netlify setup should not change what the app does.
* **Skipping the comparison with the workshop page.**

Next: lesson 6, add variables, deploy and fix failures.

# Check your app is ready and create the Netlify site

> **Time:** about 18 minutes. **You will finish with:** your app checked for Netlify and a Netlify site connected to your GitHub repo.

---

## Before you start

Netlify connects to your GitHub repository. Every time you push a change, it **builds** the app (turns the code into something a browser can run) and **publishes** it. You do not run a server. If a build fails, nothing breaks: the previous working version keeps serving until a new one succeeds.

For a Next.js app, Netlify provides its own support for running Next.js features. Which settings you need (Node version, build command, plugin) can change between versions, so the assistant should check the current Netlify docs for Next.js rather than guess.

You will need:

* The chat from lesson 4, where the assistant already knows your app.
* Your Netlify and GitHub accounts, signed in.
* Your app's workshop page, open in another tab.
* About 18 minutes.

## Step by step

### 1. Ask the assistant to check the app is ready

Send this:

```text
Check this Next.js app is ready to deploy on Netlify, using the current Netlify docs for Next.js. List the build command, the Node version needed, and every environment variable the code reads (names only). Tell me about any change needed before I deploy, and wait for my approval before changing anything.
```

**You should see:** a build command, a Node version, a list of variable names and any proposed changes.

**If not:** if it does not mention the Netlify docs or guesses at settings, ask it to check the current Netlify docs for Next.js and answer again.

### 2. Compare the variable list with your workshop page

Open the Environment panel on your workshop page and compare it with the assistant's list.

**You should see:** the same names.

**If not:** differences are worth a question: "Why does the code read X when my workshop page does not list it?"

### 3. Put any approved changes on a branch

If the assistant proposes a change (for example a Netlify configuration file or a build setting), ask it to put it on a new branch named something like `netlify-setup`, and to explain it first.

**You should see:** a branch with a small configuration file, and no changes to your app's behaviour.

**If not:** if it wants to change how the app works, stop and ask why. Netlify setup should not change what the app does.

### 4. Choose how to create the site

You have two options:

* **Ask the assistant** to create the Netlify site from your GitHub repository through the connector, or
* **Do it yourself** in Netlify. Doing it yourself the first time is a good way to learn where things are.

**You should see:** you have picked one way and are ready to start.

**If not:** if the Netlify connector is not working, do it yourself.

### 5. Start a new project from GitHub

If you are doing it yourself, in Netlify choose to add a new project (the button wording may differ) and import from GitHub. If you asked the assistant, read its plan first and approve it.

**You should see:** Netlify listing your GitHub repositories, or the assistant describing the site it will create.

**If not:** if your repository is missing, Netlify may need permission to see it. Follow the prompt to grant access to that one repository.

### 6. Pick your repository and branch

Pick your own repository and branch, and accept the build settings the assistant listed in step 1.

**You should see:** the build command and Node version matching the assistant's list.

**If not:** if Netlify suggests different settings, ask the assistant which is right according to the current docs.

### 7. Confirm the site exists

Open your site's page in Netlify.

**You should see:** a site connected to your repository. Its first deploy may not succeed yet, because variables are added in lesson 6. That is expected.

**If not:** if no site appears, repeat step 5 and check you are in the right Netlify team.

## Check yourself

* [ ] The assistant listed the build command and every variable name, and it matches my workshop page.
* [ ] Any change was on a branch and explained first.
* [ ] A Netlify site exists, connected to my repository.

## Common mistakes

* **Accepting changes that alter the app's behaviour.** Netlify setup should not change what the app does.
* **Skipping the comparison with the workshop page.**

Next: lesson 6, add variables, deploy and fix failures.

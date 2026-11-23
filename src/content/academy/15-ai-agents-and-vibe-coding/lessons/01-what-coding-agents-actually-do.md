# What Coding Agents Actually Do

> **Time:** about 15 minutes. **You will finish with:** a coding agent installed and one tiny tool it built for you, run on your own computer.

---

## Before you start

Many creators think building tools needs a computer science degree. The barrier used to be that you could not build what you could not write. With coding agents such as Claude Code, Cursor and GitHub Copilot, **you can build anything you can clearly describe**: the agent writes, edits, debugs and explains the code, and you direct it. A **coding agent** reads your project files, writes or edits code, runs it, reads the errors and corrects itself. A chatbot (ChatGPT, Claude.ai on the web) only replies in a chat window and has no file access, and a traditional script is code you must write and debug yourself.

You will need: a computer where you can install software, an empty folder for the project, and a basic comfort with typing one command in a terminal. You do not need any earlier lesson. This lesson is about building tools, so no SmartVideo GO AI studio is required here; the studios come back in Go further.

## Step by step

### 1. Pick one agent

Choose one of the two most creator-friendly options:

* **Claude Code** (Anthropic): a terminal-based agent that runs inside any project folder.
* **Cursor** (cursor.sh): a VS Code-based editor with the agent in a chat sidebar. Pick this if the terminal feels intimidating.

**You should see:** one choice made. You only need one.

**If not:** if you cannot decide, pick Cursor; it has the more familiar visual layout.

### 2. Install it and open an empty folder

1. For Claude Code, run this in a terminal (it needs Node.js already installed):

```bash
npm install -g @anthropic-ai/claude-code
```

2. For Cursor, download the app from cursor.sh, then use it to open a new empty folder.
3. Sign in to the agent with your own account when asked. Never paste a secret key into a chat.

**You should see:** the agent's prompt in your terminal (Claude Code) or a chat sidebar next to an empty file list (Cursor).

**If not:** if the `npm` command is not found, Node.js is not installed yet. Install it first, then run the command again.

### 3. Prime your first session

Open [`templates/vibe-coding-session-brief.md`](templates/vibe-coding-session-brief.md) and read how a session is set up. You will use it properly in lesson 3; for now just see the fields.

**You should see:** a brief with fields such as tool name, input, output and error handling.

**If not:** if the link does not open, continue; the next step does not depend on it.

### 4. Give the agent one clear instruction

Type this single instruction into the agent:

```text
Create a Python script called batch_prompt_runner.py that reads a list of prompts from a file called prompts.txt (one prompt per line) and prints each one numbered.
```

**You should see:** the agent creating the file and confirming it works. It may also create `prompts.txt` or ask you to.

**If not:** if the agent asks a question, answer in plain English. If `prompts.txt` is missing, ask the agent to create it with three sample prompts.

### 5. Run what the agent built

Run the file in your terminal:

```bash
python batch_prompt_runner.py
```

**You should see:** your prompts printed, numbered. This is your first agent-built tool.

**If not:** if `python` is not found, tell the agent the exact error message and ask it how to run the script on your system.

### 6. Change it with a plain-English correction

Tell the agent:

```text
Now instead of printing, save the output to a file called results.txt.
```

Run the script again and open `results.txt`.

**You should see:** a new `results.txt` with your numbered prompts. You did not read any code; you only described the change.

**If not:** if nothing was created, paste the exact error message back to the agent and ask it to fix it.

## Check yourself

* [ ] I can explain the difference between a chatbot, a coding agent and a script in one sentence each.
* [ ] A coding agent is installed and I opened an empty project folder in it.
* [ ] The agent created and ran `batch_prompt_runner.py`.
* [ ] I changed the tool with a plain-English correction and it saved `results.txt`.

## Common mistakes

* **Starting with something huge.** One small instruction first; ambition comes in lesson 2.
* **Describing the change vaguely.** Say exactly which file and what output you want.
* **Pasting secret keys into the chat.** Keys belong in environment variables, never in a prompt.
* **Treating the chatbot as an agent.** A chat window with no file access cannot run or fix your project.

## Go further

**What agents can build for creators:** batch API runners (call muapi 50 times automatically), metadata generators (a folder of images in, CSV titles and keywords out for stock platforms), prompt matrix expanders (100 variations from a 3-variable template), client intake automations (selfies in, headshot pipeline triggered) and pricing calculators for clients.

**Worked example, Alex, Etsy print-on-demand seller.** She typed 30 product titles into a spreadsheet every week. Instruction: *"Write a Python script that reads a list of design names from `designs.txt` and generates 3 SEO-friendly Etsy product title variations for each design, saving all results to `etsy_titles.csv`."* Time to a working tool: 8 minutes including installing Claude Code. Time saved: 2.5 hours a week. Sold on Gumroad at $19, it would pay back its creation time after the first 3 sales.

**Compare tools**

| Agent Platform | Interface Style | Best For | Monthly Cost |
|---|---|---|---|
| **Claude Code** | Terminal (command line) | Creators comfortable with a basic terminal | ~$20/mo (Anthropic API credits) |
| **Cursor** | Visual editor (like VS Code) | Creators who prefer a graphical interface | Free tier + $20/mo Pro |
| **GitHub Copilot** | In-editor autocomplete | Creators already using VS Code for other work | $10/mo |
| **Replit Agent** | Browser-based, zero install | Creators who want zero local setup | Free tier available |

Prices change, so check each tool's own pricing page.

**What you can sell:** an Agent Setup Service. Charge **$99-$199** to set up Claude Code or Cursor for creators who find the installation confusing.

**Exercises**

1. **Easy:** In a blank project, ask the agent: *"Create a file called `hello.txt` containing the words 'My first agent output'."* Confirm the file exists.
2. **Medium:** Ask for a Python script that reads a text file of product names and writes an all-caps version of each into a new file.
3. **Hard:** Ask for a script that generates 5 Midjourney prompt variations from a subject, aesthetic style and camera angle, reading inputs from a CSV and writing to a new CSV.

**Templates:** [`templates/vibe-coding-session-brief.md`](templates/vibe-coding-session-brief.md) for agent instruction frameworks, session planning sheets and first-tool prompt libraries.

**Produce this in SmartVideo GO AI:** the tools you build here can feed these studios: Image Studio (anchors, character sheets, product and brand shots), Video Studio (UGC ads, talking-head clips, image-to-video motion), AI Influencer Studio (consistent recurring characters), Storyboard / Campaign Planner (batch matrices, ad briefs, test plans) and Lip-Sync Studio (voice and mouth-sync for avatar performances).

Next: Building Your First Sellable Micro-Tool.

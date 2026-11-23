# Building Your First Sellable Micro-Tool

> **Time:** about 18 minutes. **You will finish with:** a scoped micro-tool, built and tested on real data, with a plain-English README a buyer could follow.

---

## Before you start

Most creators who discover coding agents try to build something huge, such as a full SaaS platform. These projects stall within 48 hours because the scope is too large to describe in one instruction, errors cannot be traced, and weeks pass with nothing to sell. The **Micro-Tool Method** fixes this: build one tool that does **exactly one thing** well, small enough for a single 60-minute session. Before you open the agent, answer four questions: what is the exact **input**, the exact **output**, the one **transformation**, and who is the **buyer**.

You will need: a coding agent from lesson 1 (Claude Code or Cursor) in a new empty folder, an OpenAI API key stored in an environment variable called `OPENAI_API_KEY` (never pasted into a chat), and 5 real product names. Prerequisite: lesson 1. No SmartVideo GO AI studio is needed to build the tool.

## Step by step

### 1. Pick one painful, repetitive task

Choose one category, or your own in the same style:

| Tool Category | What It Does | Target Buyer | Sell Price |
|---|---|---|---|
| **Batch Prompt Runner** | Sends 50+ prompts to FLUX/muapi in one click | AI image creators | $29 - $49 |
| **Etsy SEO Title Generator** | Generates 3 title + keyword sets per product from a name list | POD sellers | $19 - $39 |
| **Stock Metadata CSV Writer** | Reads image filenames and writes 30 IPTC keywords per image | Stock contributors | $29 - $59 |
| **Pricing Calculator Widget** | Interactive web form that calculates package pricing for a client | Agency freelancers | $19 - $29 |
| **YouTube Script Formatter** | Reformats a raw script into hook / body / CTA sections with timestamps | Faceless channel creators | $15 - $25 |

The rest of this lesson uses the **Etsy SEO Title Generator**.

**You should see:** one tool chosen that solves a task you or a buyer repeats often.

**If not:** if two tools tempt you, pick the one whose buyer you can name today.

### 2. Fill in the scope definition

Open [`templates/tool-scope-definition.md`](templates/tool-scope-definition.md) and answer the four questions. For the Etsy tool:

* **Input:** a `.txt` file named `products.txt`, one product name per line (for example `Cyberpunk Cat Tee`, `Botanical Wildflower Mug`).
* **Output:** a `seo_titles.csv` with columns `Product Name`, `Title 1`, `Title 2`, `Title 3`, `Keywords`.
* **Transformation:** call the OpenAI API with a fixed SEO prompt for each product name.
* **Buyer:** Etsy POD sellers who publish 20+ new designs per month.

**You should see:** four short, specific answers, each one line.

**If not:** if an answer needs "and", the tool is doing two things. Cut one.

### 3. Give the agent the instruction

Open your agent in a new empty folder and paste this, adapting it only if you chose another tool:

```text
Build a Python script called etsy_seo_generator.py that:
1. Reads product names from products.txt (one per line).
2. For each name, calls the OpenAI chat completions API using the model gpt-4o-mini with this system prompt: 'You are an expert Etsy SEO copywriter. Generate 3 optimized Etsy listing title variations and 5 relevant keywords for the given product name. Format your response as JSON: {title1, title2, title3, keywords}.'
3. Writes all results to seo_titles.csv with columns: ProductName, Title1, Title2, Title3, Keywords.
4. Reads the OpenAI API key from an environment variable called OPENAI_API_KEY.
```

**You should see:** the agent creating `etsy_seo_generator.py` and explaining in plain English what it built.

**If not:** if the explanation does not match the four points, correct it with one sentence, not a full re-description.

### 4. Test with real data

1. Create `products.txt` with 5 of your actual product names.
2. Run:

```bash
python etsy_seo_generator.py
```

3. Open `seo_titles.csv` and judge the titles.

**You should see:** a CSV with 5 rows, each with 3 titles and keywords.

**If not:** paste the exact error message into the agent. If a title looks weak, tell it:

```text
Improve the system prompt to produce more buyer-intent focused titles with emotional hooks.
```

### 5. Package it for non-technical buyers

Ask the agent:

```text
Add a simple README.md explaining how to install and run this tool in plain English for someone who has never used Python. Include the exact terminal commands.
```

**You should see:** a `README.md` with numbered install and run steps.

**If not:** if it is too technical, ask the agent to rewrite it for a complete beginner and add a sample `products.txt`.

## Check yourself

* [ ] I can state my tool's input, output, transformation and buyer in four lines.
* [ ] The script ran on 5 real product names and produced a correct CSV.
* [ ] The API key is read from `OPENAI_API_KEY`, not written in the code or chat.
* [ ] A README explains installation and use for a beginner.

## Common mistakes

* **Building a platform.** One input, one output, one transformation.
* **Skipping the buyer.** If you cannot name who pays, do not build it yet.
* **Testing on dummy data.** Weak titles only show up with real product names.
* **Pasting your API key into the agent.** Use the environment variable.

## Go further

**Worked example: Stock Metadata CSV Writer.** Stock photographers spend 8-15 minutes tagging each image with IPTC keywords. The tool reads a folder of image filenames, asks GPT-4o-mini for 30 commercial stock keywords each, and writes a `metadata.csv` ready for FTP upload. Build time: 45 minutes including testing with 10 sample filenames. Agent errors: 2 (a missing `csv` import and a JSON parsing edge case), both fixed by pasting the error back. It processes 100 images in 4 minutes versus about 25 hours by hand. Listed on Gumroad at $39 one-time, first month: 14 sales x $39 = **$546**.

**Compare tools:** Claude Code (terminal) is best for this lesson because it handles multi-file projects cleanly. Cursor is a good alternative if the terminal is intimidating. ChatGPT with manual copy-paste is best avoided: you spend more time copying code than building.

**How to wrap and price it:** zip the script, README and sample input; price at **$19-$59** by time saved per use. A one-time lifetime license is the easiest sell for small tools. On Gumroad you can create a downloadable product page in about 10 minutes, and it handles payment, delivery and VAT.

**Exercises**

1. **Easy:** Complete the scope definition for a "YouTube Script Formatter" in `templates/tool-scope-definition.md`.
2. **Medium:** Build a script that reads `designs.txt` and outputs `titles.csv` with 3 Etsy title variations per design using GPT-4o-mini.
3. **Hard:** Package the tool with a README, a sample input file and a `requirements.txt`, then ask a fellow creator to run it from scratch.

**Templates:** [`templates/tool-scope-definition.md`](templates/tool-scope-definition.md) for scope definitions, input/output specs and monetization checklists.

**Produce this in SmartVideo GO AI:** pair your tool with Image Studio, Video Studio, AI Influencer Studio, Storyboard / Campaign Planner and Lip-Sync Studio; the workflow is Learn, See Example, Use Template, Generate.

Next: The Vibe-Coding Workflow.

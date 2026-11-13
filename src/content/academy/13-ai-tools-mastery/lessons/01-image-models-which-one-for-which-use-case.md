# Image Models — Which One for Which Use Case

> **Time:** about 15 minutes. **You will finish with:** an image model chosen for each part of a brief, with settings noted and a 100% zoom audit done.

---

## Before you start

Many creators use one image tool for everything. Midjourney gives garbled text on typography jobs, and DALL-E 3 gives over-saturated, plastic-looking skin on corporate headshots. Matching the model to the requirement saves you from fighting its limits. The four dimensions to judge are: photorealism and texture (lead: **FLUX 1.1 Pro** / **FLUX Schnell**), typography (**Ideogram v2** / **FLUX**), prompt adherence on spatial layouts (**DALL-E 3** / **FLUX**), and artistic style (**Midjourney v6**).

You will need a client brief or a made-up one (for example a headshot, a logo and a banner), and the template [`templates/image-model-selection-guide.md`](templates/image-model-selection-guide.md). In SmartVideo GO AI you will use **Image Studio**, with **Storyboard / Campaign Planner** for the plan.

## Step by step

### 1. Open the selection guide

Open [`templates/image-model-selection-guide.md`](templates/image-model-selection-guide.md) next to your brief.

**You should see:** comparison matrices, prompt adherence rules and resolution benchmarks.

**If not:** check the link path as written; if the file will not open, use the Compare Tools table in Go further below.

### 2. Name the primary constraint

Read your brief and pick the one thing that matters most:

1. Photorealistic headshots or products need skin pores and sub-surface scattering: **FLUX 1.1 Pro / muapi `/nano-banana-2`**.
2. Graphic typography and merch quotes need perfect spelling: **Ideogram v2 / FLUX**.
3. Cinematic concept art and storyboards need painterly lighting defaults: **Midjourney v6**.

**You should see:** one model (or pair) written next to each part of your brief.

**If not:** if a brief has two constraints, split it into two assets and choose per asset.

### 3. Set the model parameters

Note the settings for each chosen model:

1. FLUX models: guidance scale `3.5`, steps `28` to `40`.
2. Midjourney v6: `--stylize 100-250` for photorealism, or `--stylize 500+` for artistic flair.

**You should see:** a settings line beside each model choice.

**If not:** menus and setting names move between tools; follow the current screen and use the nearest equivalent.

### 4. Generate the asset in Image Studio

Open **Image Studio** in SmartVideo GO AI and generate the asset with your chosen model and settings. Add explicit lighting words to the prompt, because FLUX needs explicit lighting prompts.

**You should see:** a finished image for your main constraint.

**If not:** if the result is flat, add a lighting description and run it again.

### 5. Audit at 100% zoom

Zoom to 100% and inspect edges, text legibility and finger geometry.

**You should see:** clean edges, correctly spelled text and natural fingers.

**If not:** if text or skin fails, go back to step 2 and switch to the model that leads that dimension.

### 6. Plan a multi-model pipeline

Write one line for each stage: FLUX for the base asset, Ideogram for text overlays, Midjourney for artistic atmosphere exploration.

**You should see:** a short pipeline note you can reuse on the next brief.

**If not:** if one stage has no job in your brief, leave it out.

## Check yourself

* [ ] I named the primary constraint for each part of my brief.
* [ ] I picked a model from the four dimensions, not from habit.
* [ ] I noted the FLUX or Midjourney settings.
* [ ] I audited the render at 100% zoom.

## Common mistakes

* Using Midjourney for complex typography, which gives garbled text.
* Using DALL-E 3 for photorealistic headshots, which gives plastic skin.
* Judging a render without zooming to 100%.
* Skipping explicit lighting words in FLUX prompts.

## Go further

**Worked example: "High-Fashion Apparel Campaign."** Requirement: 8k studio product shot with legible brand typography on a black hoodie. DALL-E 3 had great text spelling but waxy, plastic skin. FLUX 1.1 Pro (via muapi) gave perfect skin pores, crisp fabric weave and exact spelling. Final selection: FLUX 1.1 Pro, with 100% client approval. Visuals: `templates/examples/model-benchmark-comparison.jpg` and `templates/examples/tools-workflow-motion.mp4`.

| Model | Strengths | Weaknesses | Best use case |
|---|---|---|---|
| **FLUX 1.1 Pro / Schnell** | Photorealistic skin, top-tier text rendering, high prompt adherence | Requires explicit lighting prompts | Corporate headshots, POD merch, stock content |
| **Midjourney v6** | Superior out-of-the-box aesthetics, cinematic color defaults | Text spelling can drift, proprietary Discord interface | Concept art, film storyboards, social creative |
| **Ideogram v2** | Unrivaled vector typography and logo layout | Lower photorealism on human skin | Posters, apparel text designs, badges |
| **DALL-E 3** | High prompt adherence for simple concepts | Over-saturated, cartoonish skin texture | Fast conceptual brainstorming |

Exercises:

1. **Easy:** generate a 1-word logo graphic in Ideogram v2 vs. Midjourney v6 and compare spelling accuracy.
2. **Medium:** render a corporate portrait with FLUX 1.1 Pro and inspect skin micro-textures at 100% crop.
3. **Hard:** build a tool selection decision matrix for a 3-part client campaign needing headshots, logos and cinematic banners.

Template: [`templates/image-model-selection-guide.md`](templates/image-model-selection-guide.md) for comparison matrices, prompt adherence rules and resolution benchmarks.

Other SmartVideo GO AI studios that use this: Video Studio (image-to-video motion), AI Influencer Studio (consistent recurring characters), Storyboard / Campaign Planner (batch matrices, ad briefs, test plans), Lip-Sync Studio (voice and mouth-sync).

Next: Video Models — Which One for Which Use Case.

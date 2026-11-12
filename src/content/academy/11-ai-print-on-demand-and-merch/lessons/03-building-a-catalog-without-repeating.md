# Building a Catalog Without Repeating Yourself

> **Time:** about 16 minutes. **You will finish with:** a 3x3 niche prompt matrix, a reusable variable prompt and 12 generated graphics.

---

## Before you start

Real revenue on Etsy or POD marketplaces needs a catalog of **50 to 200+ listings**. Two mistakes sink creators: spamming near-identical designs with tiny color tweaks (flagged as listing spam), and burning hours on one-off prompts. The fix is a **Niche Prompt Matrix** that expands one core theme across sub-niches and styles, for example Retro Vintage Animals, then Cat / Dog / Owl / Bear, then 80s Synthwave / Japanese Ink / Minimal Line, giving 12 distinct listings.

You need lesson 1 (Designing Sellable AI Art for Merch) and lesson 2 (Print-on-Demand Platform Basics) done, `templates/merch-prompt-brief.md`, and SmartVideo GO AI **Image Studio** and **Storyboard / Campaign Planner** for batch matrices.

## Step by step

### 1. Pick a passion niche

Choose a passionate buyer niche, for example *Outdoor Camping & Coffee*.

**You should see:** one niche written at the top of your notes.

**If not:** pick something you know buyers care about, such as Coffee, Gaming or Cats.

### 2. Fill the 3x3 matrix

Make three columns: Subject (Axis A), Aesthetic Style (Axis B), Target Customer Niche (Axis C). Examples: Cyberpunk Cat / Japanese Sumi-e Ink / Tech Developers and Programmers; Vintage Botanical Sunflower / Cottagecore Watercolor / Gardening and Plant Enthusiasts; Retro Synthwave Mountain / 80s Neon Vector / Hikers and Outdoor Campers.

**You should see:** three rows, nine cells, no two rows alike.

**If not:** change whichever row shares a subject or style with another.

### 3. Build the variable prompt

Open `templates/merch-prompt-brief.md` and save this template:

```text
Clean vector graphic of [SUBJECT] drinking coffee by a campfire, [STYLE] style, bold outlines, isolated on solid background, 300 DPI
```

**You should see:** a prompt with two replaceable variables.

**If not:** keep the brackets so you can swap values quickly.

### 4. List the variable values

Write `[SUBJECT]`: Bear, Fox, Raccoon, Owl. `[STYLE]`: Retro 70s Badge, Minimalist Linework, Synthwave Neon.

**You should see:** 4 subjects x 3 styles = **12 combinations**.

**If not:** count again; every subject must pair with every style.

### 5. Generate the 12 graphics

Run each combination through muapi `/nano-banana-2` (use Image Studio or Storyboard / Campaign Planner for batches).

**You should see:** 12 distinct graphics on solid backgrounds.

**If not:** if two look alike, change the style wording, not just the color.

## Check yourself

* [ ] I have a niche and a filled 3x3 matrix.
* [ ] My prompt template uses [SUBJECT] and [STYLE].
* [ ] I generated 12 visibly different graphics.

## Common mistakes

* Uploading the same image with minor color tweaks.
* Writing a custom prompt for every single shirt.
* Varying only color instead of subject or style.

## Go further

**Worked example, "The Retro Outdoor Collection":** Retro National Park Badge illustrations; 5 animals (Bear, Wolf, Bison, Eagle, Moose); 70s Vintage Sunburst and Linework styles; 5 animals x 3 products (Shirt, Mug, Hoodie) = **45 active listings**; 2.5 hours total setup. Preview: `templates/examples/merch-design-vector-art.jpg`.

**Exercises:**

1. Easy: build a 3x3 prompt matrix for a niche of your choice.
2. Medium: batch generate 6 distinct graphics from your matrix and isolate their backgrounds.
3. Hard: publish a 15-item collection across 3 product types (Tee, Mug, Tote) in your dev store.

**Template:** `templates/merch-prompt-brief.md` has matrix prompt templates, niche variable tables and trademark compliance checklists.

Next: Building a Catalog Without Repeating Yourself, part 2.

# Designing Sellable AI Art for Merch

> **Time:** about 18 minutes. **You will finish with:** a transparent, 4500x5400px, 300 DPI graphic placed on a t-shirt mockup.

---

## Before you start

Raw AI images (1024x1024px) pixelate when stretched across a t-shirt chest print area that needs **4500x5400px at 300 DPI**. A solid-background image prints as an ugly box on the shirt, and dark or muddy colors wash out in direct-to-garment (DTG) ink. The fix is a pipeline: isolated vector prompt, then transparent PNG, then 4x upscale, then mockup.

You need access to SmartVideo GO AI **Image Studio** (generation) and **Video Studio** (optional showcase motion), a background remover and an AI upscaler (tools below), and the template `templates/merch-prompt-brief.md`. No prerequisites.

## Step by step

### 1. Open the prompt brief

Open `templates/merch-prompt-brief.md` and keep it beside Image Studio.

**You should see:** vector style prompts, DPI specs and negative prompts.

**If not:** check the Templates list in the track overview for the file.

### 2. Write the vector prompt

Draft this apparel-optimized prompt:

```text
Clean vector t-shirt graphic of a cyberpunk samurai cat wearing futuristic glowing neon goggles, Japanese typography, bold outlines, vibrant synthwave colors, isolated on solid black background, high contrast, 8k graphic.
```

**You should see:** a single prompt that names subject, style, outlines, colors and an isolated solid background.

**If not:** add "vector illustration, isolated on white background, clean lines, bold graphic, high contrast, 300 DPI" as the style core.

### 3. Add the negative prompt

Use this negative prompt with it:

```text
photograph, realistic skin, complex background, gradient box, blurry lines, low resolution, noise, drop shadow.
```

**You should see:** the negative field filled in beside the prompt.

**If not:** if your tool has no negative field, say "no photograph, no drop shadow, no gradient box" inside the prompt.

### 4. Generate the graphic

Run the prompt with muapi `/nano-banana-2`.

**You should see:** a bold graphic with strong outlines on a solid background.

**If not:** if it looks like a photo or has a busy background, regenerate and keep the negative prompt.

### 5. Isolate the artwork

Pass the output to an AI background remover (Photoroom or Clipdrop) and save `merch-graphic-transparent.png`.

**You should see:** the artwork on a checkerboard (transparent) background with no box.

**If not:** try again from a solid-color background; edges are cleaner when the subject stands out.

### 6. Upscale 4x

Run an AI upscaler (Real-ESRGAN, muapi high-res upscaling, or Vectorizer.ai for vector SVG) at a **4x scale factor**.

**You should see:** the image at least **4500px wide**, with crisp, sharp linework.

**If not:** if it is smaller, run the upscaler again on the result or choose a higher scale; if edges are soft, regenerate with bolder outlines.

### 7. Boost vibrancy

Raise color vibrancy about **+15%** before exporting, because POD ink absorbs slightly into the fabric. Also check contrast on dark vs. light garments (white linework for black tees, dark linework for white or heather grey).

**You should see:** punchy colors that still keep detail.

**If not:** if colors clip or look neon-flat, back off the boost a little.

### 8. Place it on a mockup

Place `merch-graphic-transparent.png` on a heavy cotton t-shirt mockup in your editor, about **2 inches below the neck collar**.

**You should see:** the graphic sitting cleanly on the shirt with no rectangle behind it.

**If not:** a visible box means the background was not fully removed; redo step 5.

## Check yourself

* [ ] My graphic is a transparent PNG with no background box.
* [ ] It is at least 4500px wide at 300 DPI with crisp edges.
* [ ] I checked contrast for dark and light garments.
* [ ] It sits about 2 inches below the collar on the mockup.

## Common mistakes

* Uploading raw 1024x1024px generations straight to Printify, Printful or Redbubble.
* Leaving a solid square background, which prints as a box.
* Muddy, low-contrast colors that wash out in DTG printing.
* Skipping the dark-vs-light garment test.

## Go further

**Worked example, "Cyberpunk Cat Tee":** target niche Cyberpunk and cat lovers; 4500x5400px transparent PNG at 300 DPI; Heavyweight Unisex Crewneck T-Shirt (Black); generation cost **$0.06** AI credit vs **$250** freelance illustrator quote. Preview: `templates/examples/cyberpunk-cat-merch-tshirt.jpg`, showcase motion `templates/examples/merch-design-motion.mp4`. Make showcase motion in Video Studio (image-to-video).

**Compare tools:**

| Tool | Purpose | Best for |
|---|---|---|
| FLUX / muapi Vector Mode | Graphic generation (high quality) | Crisp linework and graphic illustrations |
| Photoroom / Clipdrop | Background removal (transparent PNG) | Isolating artwork from solid backgrounds |
| Real-ESRGAN / Vectorizer.ai | Upscaling (4x / vector SVG) | Scaling to 4500x5400px 300DPI |

**Exercises:**

1. Easy: generate a minimalist retro sunset vector graphic isolated on white.
2. Medium: remove the background and upscale it to 4500x5400px at 300 DPI.
3. Hard: create a 3-item collection (T-shirt, Mug, Tote Bag) with variations of one design style.

**Template:** `templates/merch-prompt-brief.md` has vector style prompts, DPI specs and negative prompt libraries.

**SmartVideo GO AI studios:** Image Studio (product and brand shots), Video Studio (image-to-video motion), Storyboard / Campaign Planner (batch matrices), AI Influencer Studio, Lip-Sync Studio. Workflow: Learn, See Example, Use Template, Generate.

Next: Print-on-Demand Platform Basics.

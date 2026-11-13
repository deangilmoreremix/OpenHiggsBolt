# High-converting Studio Lookbooks

> **Time:** about 18 minutes. **You will finish with:** one lookbook image: a generated backdrop, a model composited with matched shadows, and a colour grade, filled in on your moodboard.

---

## Before you start

Seasonal lookbooks are logistics nightmares (weather, travel, props, changing light), shot in a plain office they look flat, and stock photos look generic. The fix is a cohesive pipeline: pick a **theme**, build a **backdrop** with consistent lighting, composite your try-on model, then apply one **colour grade** (LUT) so every image looks like the same shoot. Use diffused side softbox light with soft neutral shadows; avoid harsh sunbeams unless the collection is high-contrast summer.

You will need:

* A try-on model image from lesson 1 (Garment Try-on).
* [`templates/lookbook-moodboard.md`](templates/lookbook-moodboard.md).
* SmartVideo GO AI **Image Studio** for the backdrop; a layer editor such as Photoshop or Photopea for compositing and grading (menus move; follow the current screen).

## Step by step

### 1. Lock the moodboard theme

1. Open [`templates/lookbook-moodboard.md`](templates/lookbook-moodboard.md).
2. Choose a visual archetype, colour palette and studio lighting setup. Example: "Nordic Autumn" with taupe, soft sand and slate grey.

**You should see:** a filled moodboard with theme, palette and lighting.

**If not:** if you cannot choose, use the Nordic Autumn example and change it later.

### 2. Generate the backdrop

1. In Image Studio (or another image generator), paste this prompt:

```text
A high-end fashion studio backdrop. A minimalist light grey textured plaster screen, soft diffused overcast window light casting faint shadows, editorial fashion set, photorealistic, 8k resolution, shot on 85mm lens, f/5.6.
```

2. Save the result as `studio_bg_01.jpg`.

**You should see:** an empty plaster-style set with soft light and faint shadows.

**If not:** if the light is harsh or colours drift from your palette, add your palette words to the prompt and regenerate.

### 3. Composite the model

1. Import your lesson 1 model layer over `studio_bg_01.jpg`.
2. Position the model centred in the frame.

**You should see:** the model standing on the backdrop, still floating without shadows.

**If not:** if edges look cut out, refine the mask edge before continuing.

### 4. Match light and cast shadows

1. Check that highlights on the face and shoulders match the backdrop's light direction (for example key light from top-left).
2. Paint a soft shadow on the screen where shoulders and torso block the light; set the layer to **25%** opacity and **Multiply** blend mode.
3. Paint a soft contact shadow under the shoes at the baseline.

**You should see:** the model sits in the scene, lit from the same side as the backdrop.

**If not:** if the shadow looks pasted on, soften the brush and lower the opacity.

### 5. Grade and export

1. Create one global grading layer (gradient map, LUT or Lightroom preset).
2. Shift shadows slightly toward teal and midtones toward warm beige; limit maximum contrast so dark fabrics keep detail.
3. Export as high-quality WebP, at least 2000px vertical so shop zoom stays sharp.

**You should see:** a finished lookbook image with a unified colour feel.

**If not:** if skin looks over-smoothed or orange, reduce the grade strength and skip blur filters.

## Check yourself

* [ ] My moodboard names a theme, palette and lighting setup.
* [ ] Backdrop light direction matches the model's light.
* [ ] Shadow layer is 25% Multiply, with a contact shadow at the shoes.
* [ ] One grade is applied, and the export is at least 2000px vertical.

## Common mistakes

* **Mixed themes.** A sand plaster screen for one model and a concrete warehouse for the next breaks the story.
* **Harsh direct light.** Stick to diffused side softbox light.
* **Over-smoothed skin.** Keep natural pores and hair texture; it builds credibility.
* **Grading each image by hand.** Apply one shared grade across the whole set.

## Go further

**Worked example, cashmere collection (Nordic Autumn).** Minimalist plaster backdrop, soft side daylight, earth tones. Backdrop: a warm grey stucco wall with a soft window-frame shadow. Model: beige oversized organic cashmere knit sweater. Grading: shadows teal shift +5%, highlights gold shift +8%, 5% digital grain for a film feel. Export 1080x1350px vertical. Result: a 10-page editorial lookbook ready for print and web.

![Lookbook model](templates/examples/fashion-lookbook-model.jpg)

Motion loop: [templates/examples/fashion-lookbook-loop.mp4](templates/examples/fashion-lookbook-loop.mp4)

**Compare tools**

| Tool | Quality | Batch processing | Best for |
|---|---|---|---|
| FLUX Pro / Midjourney | Ultra-high | Low | Editorial backdrops (plaster, wood, fabric) |
| Lightroom / Capture One | High | Ultra-high | Batch-syncing colour profiles across hundreds of images |
| Photoshop / Photopea | High | Medium | Compositing, shadow masking, QA edits |

**Exercises**

1. Easy: customize the moodboard for a Summer swimwear collection.
2. Medium: generate 2 backdrops with different prompts but identical palette and lighting angles.
3. Hard: composite a model on your backdrop, apply a custom LUT matching the model's highlights to the backdrop's warm tone, and add a soft grain layer.

**Template:** [`templates/lookbook-moodboard.md`](templates/lookbook-moodboard.md).

**SmartVideo GO AI studios for this track:** Image Studio, Video Studio (image-to-video camera motion), AI Influencer Studio, Storyboard / Campaign Planner, Lip-Sync Studio.

Next: Sizing & Layout Consistency.

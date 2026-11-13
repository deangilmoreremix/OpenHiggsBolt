# Consistent Headshot Generation, part 2

> **Time:** about 12 minutes. **You will finish with:** a wardrobe variation, a skin-checked final file named `corporate-executive-headshot.jpg`, and a price list for your first package.

---

## Before you start

Part 1 gave you an identity-locked render. Now you keep it believable. Low-end filters destroy natural pores, fine wrinkles and freckles, so you inspect at 100% zoom and keep the identity seed locked while changing clothes. Professional lighting follows a 3-point idea: a **key light** (softbox at 45 degrees, Rembrandt or Butterfly pattern), a **fill light** (soft light on the shadow side) and a **rim / hair light** (backlight separating hair and shoulders).

You will need your render from part 1 and **Image Studio**. Menus move; follow the current screen.

## Step by step

### 1. Check the 3-point lighting on your render

1. Look for a key light shaping one side of the face, soft fill in the shadow side, and a rim edge on hair and shoulders.
2. If one is missing, add it to the prompt (for example "subtle rim light separating shoulders from background") and regenerate.

**You should see:** dimension on the face, no harsh dark patches, and a clean edge around hair and shoulders.

**If not:** add "soft Rembrandt key light" to the prompt and keep the negative prompt "harsh direct flash".

### 2. Swap clothing and background with inpainting

1. If the client wants variations (formal suit versus business casual sweater), run targeted inpainting over the torso area only.
2. Keep the facial identity seed locked so the face does not change.

**You should see:** new clothing on the same face and the same lighting.

**If not:** if the face shifts, your mask touched the head. Redraw the mask below the chin.

### 3. Inspect skin and eyes at 100% zoom

1. Zoom to 100%. Confirm visible natural pores and authentic eye catchlights.
2. Apply subtle sharpening to the iris reflections, and use frequency separation in post if skin looks flat.

**You should see:** realistic skin micro-texture, not a smooth mannequin face.

**If not:** re-run with denoising strength nearer 0.40 and the negative prompt "plastic skin, smooth mannequin face".

### 4. Save the final file

Save the high-resolution result as `corporate-executive-headshot.jpg`.

**You should see:** one named, full-resolution file ready to deliver.

**If not:** if the export is small, re-export from the original render, not from a screenshot.

## Check yourself

* [ ] The render shows key, fill and rim light.
* [ ] A clothing variation kept the same face.
* [ ] I checked pores and eye catchlights at 100% zoom.
* [ ] The final file is saved as `corporate-executive-headshot.jpg`.

## Common mistakes

* **Masking the face during a wardrobe swap.** Only paint the torso.
* **Judging at a small zoom.** Waxy skin only shows at 100%.
* **Changing the seed between variations.** It changes the face.

## Go further

**Worked example, "Apex Financial Group":** source was a living-room selfie under harsh ceiling light. Target style: Executive Corporate navy blazer and office bokeh. Pipeline: identity extraction via InstantID plus FLUX 1.1. Settings: denoising `0.45`, identity weight `0.85`, 85mm lens anchor. Turnaround 3 minutes; cost **$0.06** versus a **$350** studio quote.

<p align="center">
<img src="templates/examples/corporate-executive-headshot.jpg" alt="Corporate Executive AI Headshot" width="320">
<img src="templates/examples/headshot-lighting-motion.gif" alt="Headshot Lighting & Motion Loop (I2V)" width="320">
</p>

Image-to-video motion loop: [templates/examples/headshot-lighting-motion.mp4](templates/examples/headshot-lighting-motion.mp4). You can make a similar loop in **Video Studio**.

**Compare tools**

| Platform / Pipeline | Face Consistency | Skin Realism | Best For |
|---|---|---|---|
| FLUX PuLID / InstantID (muapi API) | Extremely High | Photorealistic, keeps pores and expression | Professional client delivery, corporate team packages |
| Consumer apps (Remini, HeadshotPro) | Medium | Low, over-smoothed plastic skin | Low-budget personal social avatars |
| Custom LoRA fine-tuning (ComfyUI / Kohya) | Maximum | High, needs 15+ training images | Celebrity, executive or recurring influencer models |

**Packaging options:** Individual Professional Package **$49 - $79** (5 styled variations: Formal, Business Casual, Creative, Studio Dark, Office Bokeh). Corporate Team Pass (10 employees) **$399 - $599**, with consistent background and dress code matching brand guidelines.

**Exercises**

1. Easy: take a casual selfie in window daylight and write a prompt for a studio portrait with a blurred office background.
2. Medium: swap a casual t-shirt for a navy suit blazer on the generated portrait.
3. Hard: generate 3 consistent team headshots for 3 people with the same lighting prompt and background bokeh.

**Template:** [`templates/headshot-style-guide.md`](templates/headshot-style-guide.md) has lighting prompts, wardrobe descriptors and negative prompt libraries.

**Studios in SmartVideo GO AI:** Image Studio (anchors, character sheets, brand shots), Video Studio (image-to-video motion), AI Influencer Studio (recurring on-brand characters), Storyboard / Campaign Planner (batch matrices), Lip-Sync Studio (voice and mouth-sync). Workflow: Learn, See Example, Use Template, Generate.

Next: Standing Out Against Fiverr Competition.

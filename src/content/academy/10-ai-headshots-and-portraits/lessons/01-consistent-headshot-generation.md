# Consistent Headshot Generation

> **Time:** about 15 minutes. **You will finish with:** a first studio-grade corporate headshot rendered from your own casual selfies, with identity locked.

---

## Before you start

Traditional studio headshots cost **$250 to $600 per person**, take 5 to 7 days for edited proofs, and are nearly impossible to keep consistent across a remote team. Basic face swaps and over-filtered presets look fake: waxy skin, drifting eye colors, rows of artificial teeth, and background light that does not match the face. The fix is a pipeline: casual selfie, then identity lock, then a studio lighting and outfit prompt, then detail and skin-texture checks. Identity-locking models (InstantID / FLUX PuLID) read face landmarks (eye spacing, jawline, nose bridge, skin tone) from 1 to 3 selfies so the result looks like the subject.

You will need 3 to 5 casual photos of one willing subject (yourself is fine), the file [`templates/headshot-style-guide.md`](templates/headshot-style-guide.md), and access to SmartVideo GO AI **Image Studio** (use **AI Influencer Studio** if you want the same face to recur). Menus move; follow the current screen.

## Step by step

### 1. Collect quality source selfies

1. Gather 3 to 5 casual photos: well lit by window daylight, no heavy filters, no sunglasses, neutral or smiling expression.
2. Make sure they show direct eye contact and varying angles (front-facing and 3/4 turn).

**You should see:** a small folder of sharp, evenly lit photos where the face is clearly visible.

**If not:** retake any photo that is dark, filtered or hides the eyes. Weak sources produce weak identity locks.

### 2. Open the style guide and pick a tier

1. Open [`templates/headshot-style-guide.md`](templates/headshot-style-guide.md).
2. Choose the target tier: Executive Corporate or Creative Tech Founder.

**You should see:** the lighting, wardrobe and negative prompt entries for your chosen tier.

**If not:** if the file will not open, use the prompts in the next steps directly.

### 3. Assemble the studio prompt

Copy the prompt for your tier and replace `[Identity Anchor]` with your subject description. Executive Corporate:

```text
Photorealistic 8k corporate studio portrait photograph of [Identity Anchor], confident friendly expression, wearing a tailored charcoal navy blazer and crisp white shirt, soft Rembrandt key light, subtle rim light separating shoulders from background, blurred modern glass office background with soft bokeh, shot on 85mm f/1.8 lens, natural skin pores, studio quality.
```

Creative Tech Founder:

```text
Photorealistic 8k editorial portrait photograph of [Identity Anchor], warm approachable smile, wearing a stylish dark grey turtleneck, soft warm studio lighting, neutral grey gradient background, crisp focus on eyes, 85mm lens, highly detailed.
```

Negative prompt (use with either):

```text
plastic skin, smooth mannequin face, extra teeth, asymmetric eyes, cartoon, oversaturated, harsh direct flash, warped neck, low resolution, blurry.
```

**You should see:** one complete positive prompt plus the negative prompt, with no leftover square brackets.

**If not:** if a bracket remains, the generator may draw it literally. Replace it with a short description of the subject.

### 4. Run identity-locked inference

1. In **Image Studio**, add your selfies as the face reference and paste the prompt and negative prompt.
2. Set the aspect ratio to **1:1** for LinkedIn/Slack avatars or **4:5** for executive team pages.
3. Use the settings from the worked example as a starting point: denoising strength `0.45` (keep within **0.40–0.55**), identity weight `0.85`. Generate.

**You should see:** a portrait that looks unmistakably like your subject, in studio light with a soft office or gradient background.

**If not:** if the face drifts, raise identity weight slightly or add a better reference selfie. If the skin looks waxy, lower denoising strength toward 0.40.

## Check yourself

* [ ] I used 3 to 5 sharp, well-lit selfies with eye contact.
* [ ] My prompt has an identity anchor, lighting, wardrobe, lens and the negative prompt.
* [ ] I rendered at 1:1 or 4:5 with denoising 0.40-0.55.
* [ ] The result looks like the person, not a random face.

## Common mistakes

* **Over-filtered source photos.** Filters carry into the render; use plain window daylight.
* **Denoising too high.** Above about 0.55 the model rewrites skin and identity.
* **Skipping the negative prompt.** It is what keeps plastic skin and extra teeth away.
* **Leaving `[Identity Anchor]` unfilled.**

Next: Consistent Headshot Generation, part 2.

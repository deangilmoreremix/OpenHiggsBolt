# Character & Face Consistency

> **Time:** about 16 minutes. **You will finish with:** one anchor character rendered in three settings with no visible face drift, and a drift-check result.

---

## Before you start

If your AI creator looks like a different person in every shot, nobody will pay for the ad. This is the most common complaint about AI-generated content, and for an ad campaign, a faceless channel host or an AI influencer it is disqualifying. The fix is an **anchor** the model cannot drift away from. Three anchor types, weakest to strongest: prompt-only (re-describing the character in text), reference-image conditioning (passing the actual photo with each prompt), and a trained/locked identity (LoRA or equivalent, usually a local step). A fixed seed helps within a session but is a helper, not the main mechanism.

You will need an anchor image (or the one from lesson 1) and these SmartVideo GO AI studios: **Image Studio** with an edit or reference option, and optionally **AI Influencer Studio**. Open `templates/character-consistency-checklist.md` for the final check.

## Step by step

### 1. Create or pick your anchor

1. In **Image Studio**, generate or upload one character: for example a woman in her late 20s, front-facing, neutral lighting, brown hair, freckles across her nose.
2. Use high resolution.

**You should see:** a sharp, front-facing, neutrally lit portrait.

**If not:** regenerate until face and freckles are clearly visible; a weak anchor makes every later image worse.

### 2. Use the anchor as a reference, not a description

For every new shot, pass the anchor image as the reference or edit input to an edit-capable image model. Do not retype the face in a fresh text prompt.

**You should see:** a reference or image-input field accepting your anchor.

**If not:** if your tool only has a plain text prompt, look for an edit, reference or character option (names may differ) before continuing.

### 3. Render the first setting: car interior

Describe only what changes:

```text
Same woman as in the reference image, now sitting in a car, holding a phone.
```

**You should see:** the same face, freckles and apparent age, in a car.

**If not:** if the face changed, check that the reference was really passed to an edit-capable endpoint and that your prompt does not describe facial features.

### 4. Render the second and third settings

Repeat with the same anchor each time:

```text
Same woman as in the reference image, now standing at a kitchen counter.
```

```text
Same woman as in the reference image, now walking outside in daylight.
```

**You should see:** three images of the same person in three places, including different lighting in the outdoor shot.

**If not:** regenerate only the drifted shot, and make the prompt shorter and about the setting only.

### 5. Run the drift check

Line up the anchor and all three renders. Compare facial structure, apparent age, freckle placement, hairstyle and jaw shape.

**You should see:** no meaningful drift on any of them.

**If not:** common drift signs are a rounder jaw, vanished freckles or a different age. Tighten the prompt to describe only outfit and background, and lean on the reference image for the face.

### 6. Decide whether you need a trained identity

Ask: will this creator front dozens of ads over months, or just one batch?

**You should see:** a clear yes/no. For a one-off ad, reference-image conditioning is enough. For a recurring creator, plan a one-time LoRA training pass on 15-20 photos.

**If not:** if unsure, start with reference images and revisit when you notice repeated drift.

### 7. Save the anchor and the checklist result

Save the anchor under a clear name and complete the checklist from `templates/character-consistency-checklist.md`.

**You should see:** the anchor and three approved renders stored together.

**If not:** if any render failed the checklist, do not deliver it; regenerate.

## Check yourself

* [ ] I used the anchor image as a reference for every new shot.
* [ ] My prompts described only the setting, never the face.
* [ ] I compared at least three renders against the anchor.
* [ ] I know whether this character justifies a trained identity.

## Common mistakes

* **Re-describing the face in text.** This is the most common cause of drift.
* **Not passing the reference to an edit-capable model.** A plain text prompt ignores it.
* **Treating a seed as a lock.** It does not survive different prompts or sessions.
* **Accepting small drift.** Clients notice immediately.

## Go further

* **Models that worked:** `nano-banana-2-edit` ($0.06/image) was used with the same uploaded image as `images_list` for each of 3 shots; alternatives `nano-banana-pro-edit` and `gpt-image-2-image-to-image`. Current image models (for example Nano Banana 2/Pro, Seedream) hold identity better than older ones.
* **Paths compared:** API reference conditioning (good, low setup, the default for most ad work); other paid tools with built-in "character" features (varies, GUI); local ComfyUI with a trained LoRA (strongest, high setup, worth it for a character used dozens or hundreds of times).
* **Pricing idea:** consistency is baked into your ad price, but you can upsell a "branded AI character" package, a one-time setup fee of $200-$500 plus per-piece production.
* **Positioning:** sell "your reusable AI spokesperson", not "an AI-generated photo".
* **Exercises:** easy, same character in 3 outfits; medium, 5 scenes, noting which details drift first (usually age, facial proportions, hairstyle); hard, a local ComfyUI trained identity compared with the API approach over the same 5 scenes.
* **Template:** `templates/character-consistency-checklist.md`.

Next: Building a 10-Ad Batch.

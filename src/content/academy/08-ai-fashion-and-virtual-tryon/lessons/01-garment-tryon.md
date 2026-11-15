# Garment Try-on for Fashion E-commerce

> **Time:** about 16 minutes. **You will finish with:** one flat garment draped onto a model, checked at high zoom, with a filled try-on spec sheet.

---

## Before you start

A single fashion shoot with models, hair and makeup, a photographer and a studio can cost over $5,000 and take weeks to edit. Flat-lays and ghost mannequin shots are cheap but look flat, which means low click-through and high returns because shoppers cannot judge the fit. A **Virtual Try-On (VTO)** pipeline fixes this: it isolates your garment (segmentation), then drapes it onto a model body while preserving about **95%** of the original texture, stitching, buttons and patterns.

You will need:

* One photo of a garment, flat-lay or on a mannequin, in focus under clean daylight.
* The spec sheet [`templates/tryon-spec-sheet.md`](templates/tryon-spec-sheet.md).
* SmartVideo GO AI: **Image Studio** for the cut-out and try-on. The tool names below (IDM-TryOn, Kolors VTO, `nano-banana-2-edit`) come from the original lesson; menus move, so follow the current screen.

## Step by step

### 1. Cut out the garment

1. Open your garment photo in Image Studio (or any AI subject cutter).
2. Remove the background so only the garment remains, and save it as `garment_ref.png`.

**You should see:** the garment alone on a transparent background, edges clean, no table or hanger left.

**If not:** if edges are ragged, re-shoot flatter and in better light, then cut out again.

### 2. Define the model

1. Open [`templates/tryon-spec-sheet.md`](templates/tryon-spec-sheet.md).
2. Write the target model's parameters, for example:

```text
East Asian male, 28 years old, athletic build, standing in a studio environment.
```

**You should see:** the demographic line saved in your spec sheet.

**If not:** if you are unsure, copy the example above and change one detail at a time.

### 3. Choose the target pose

1. If your try-on tool supports reference models, upload a photo of a model in your pose (Pose A: standing straight, hands at sides).
2. If you use a text-to-image edit model such as `nano-banana-2-edit`, upload the original mannequin photo, mask the clothing area and paste your model description from step 2.

**You should see:** a pose image or a masked mannequin photo ready as the body input.

**If not:** if the tool has no reference-model option, use the mask-and-describe route.

### 4. Run the draping engine

1. Submit to your try-on engine (such as IDM-TryOn or Kolors VTO API): `garment_ref.png` as the clothing input, the pose image or text as the target body input.
2. Set the draping fitting rate to **0.75**, which balances cloth detail with realistic body wrinkles.
3. Generate and download the output `.jpg`.

**You should see:** your garment worn by the model, with natural folds.

**If not:** if details look washed out, check that the garment input is sharp; if the fit looks stiff, keep 0.75 and change only one setting per retry.

### 5. Quality-check at high zoom

Zoom in on the result and inspect three areas:

* **Collar and buttons:** crisp shapes, not blurred or merged with skin.
* **Cuffs and hem:** hands pass naturally through cuffs; the hem lies straight.
* **Prints and textures:** stripes, prints and logos follow the body's curves.

**You should see:** all three areas pass; record the result under QA checks in the spec sheet.

**If not:** regenerate, or fix small border bleed in a photo editor.

## Check yourself

* [ ] I have a clean `garment_ref.png` with a removed background.
* [ ] The model description is in the spec sheet.
* [ ] I used a fitting rate of 0.75.
* [ ] I checked collar, cuffs, hem and prints at high zoom.

## Common mistakes

* **A blurry or tilted garment photo.** The model can only preserve detail that exists in the input.
* **A different model face on every item.** Use the same model face and body across one category page, or the store looks amateur.
* **Skipping the zoom check.** Errors hide at collars and cuffs.
* **Not saving poses.** Keep your best model poses in a master folder to speed up batch rendering for the next line.

## Go further

**Worked example, linen shirt mannequin-to-model swap.** Input: a ghost mannequin shot of an off-white linen button-down. Target: a 30-year-old Caucasian male model, athletic build. Pipeline: IDM-TryOn API call with `garment_image` = `linen_shirt.png` and `model_image` = `reference_male_model.jpg`. Output: buttons clear, stitching sharp, the cross-hatch linen texture preserved, soft shadow under the collar. The catalog moved from a plastic mannequin to a professional model shot.

![Linen shirt VTO](templates/examples/linen-shirt-vto.jpg)

Motion loop: [templates/examples/linen-shirt-motion.mp4](templates/examples/linen-shirt-motion.mp4)

**Compare tools**

| Tool | Detail preservation | Pose customization | Best for |
|---|---|---|---|
| IDM-TryOn | Ultra-high (patterns, textures, stitching) | Medium | High-fidelity catalog photos |
| Kolors Virtual Try-On | High | High | Editorial lookbooks, social graphics |
| Kling AI Image-to-Video | Medium | High | Short walking loops |

IDM-TryOn suits product detail pages (Shopify, Amazon) because logos and textures stay sharp. Kolors suits banner ads with active poses.

**Exercises**

1. Easy: photograph a t-shirt flat-lay and make a clean clothing PNG with a background cutter.
2. Medium: try the t-shirt on a male and a female model.
3. Hard: run a buttoned jacket from a ghost mannequin shot, review collar and cuff seams at 200% zoom and fix any border bleeding in a photo editor.

**Template:** [`templates/tryon-spec-sheet.md`](templates/tryon-spec-sheet.md).

**SmartVideo GO AI studios for this track:** Image Studio (anchors, character sheets, product shots), Video Studio (image-to-video motion), AI Influencer Studio (consistent recurring characters), Storyboard / Campaign Planner (batch matrices, briefs, test plans), Lip-Sync Studio (voice and mouth-sync). The flow is Learn, See Example, Use Template, Generate.

Next: High-converting Studio Lookbooks.

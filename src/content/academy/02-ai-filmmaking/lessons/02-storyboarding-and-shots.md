# Storyboarding & Shot Planning

> **Time:** about 17 minutes. **You will finish with:** a style guide, a locked character anchor image, 3 storyboard frames (wide, medium, close-up) and a filled shot list.

---

## Before you start

Generating video straight from text is a gamble: John's outfit turns blue, the room is bright, the camera is on the ceiling, and a rerun changes his face. Twenty clips this way look like twenty different movies and waste dollars and hours. Storyboarding fixes lighting, palette, framing and wardrobe with cheap still images **before** you render video. The chain is: Visual Style Guide, Character Anchor, Storyboard Images, then Image-to-Video. You will need your script from lesson 1 (Screenplay & Story Generation), and the templates [`templates/style-guide-template.md`](templates/style-guide-template.md), [`templates/shot-list-template.md`](templates/shot-list-template.md) and [`templates/storyboard-script-template.md`](templates/storyboard-script-template.md). Use SmartVideo GO AI's **Image Studio** for anchors and frames, and the **Storyboard / Campaign Planner** for batch matrices and briefs. Use the **AI Influencer Studio** if you want a consistent recurring character.

## Step by step

### 1. Create the visual style guide

Open [`templates/style-guide-template.md`](templates/style-guide-template.md) and lock in a film stock (for example `35mm film grain`), a color palette (for example `teal shadows, warm amber highlights`) and an aspect ratio (for example `--ar 16:9`). Write them as one **style prefix** such as:

```text
Cinematic 35mm film photograph
```

**You should see:** a style guide with a prefix, palette and aspect ratio.

**If not:** if you cannot decide, copy the values from the worked example below and change them later.

### 2. Generate the character anchor image

In **Image Studio**, write a detailed prompt for your character's hero portrait: face, hair, age and one specific wardrobe element, for example:

```text
A worn silver flight suit with a red shoulder patch
```

Generate several options and save the best one. This is your **Character Reference Image (Cref)**.

**You should see:** one portrait you are happy with, saved where you can find it.

**If not:** if the face is generic or the clothing is vague, add more specific details to the prompt and regenerate.

### 3. Generate a wide establishing frame

Start the prompt with your style prefix, describe the framing (wide shot) and the location. No character is needed here.

**You should see:** a wide frame that shows the space and sets the palette.

**If not:** if the lighting is not what you want, restate the palette words from your style guide.

### 4. Generate the medium and close-up frames

For each remaining shot in your screenplay, start with the style prefix and name the framing (medium shot, close-up). For character shots, use the model's image-to-image or character-reference option with your anchor. If your model supports it, keep the scene seed constant and vary only framing and posture. A prop close-up is a safe shot because props do not drift like faces.

**You should see:** three frames (wide, medium, close-up) that clearly share colors and lighting.

**If not:** if the character changes, confirm the anchor image is attached to that generation.

### 5. Build the shot list

Log each approved frame in [`templates/shot-list-template.md`](templates/shot-list-template.md): camera framing, target action, dialogue line, and the file path of the approved image.

**You should see:** one row per shot, each pointing to a real image file.

**If not:** if a shot has no approved image yet, leave the row open and regenerate it.

### 6. Run a drift check

Place the frames side by side. Ask: does hair or outfit shift between cuts? Does the lighting change color temperature? If yes, re-render the drifting frame with tighter text prompts.

**You should see:** frames that look like one film.

**If not:** repeat the re-render, copying the exact prefix and wardrobe wording from the frames that match.

## Check yourself

* [ ] I have a style guide with a prefix, palette and aspect ratio.
* [ ] I have a character anchor image saved.
* [ ] I have wide, medium and close-up frames that share one look.
* [ ] My shot list links each shot to an approved image.

## Common mistakes

* Starting with video generation instead of still frames.
* Changing the style prefix between shots.
* Skipping the character reference, so the face changes shot to shot.
* Skipping the drift check and finding the mismatch only after paying for video.

## Go further

**Worked example, "The Last Signal" Scene 1** (INT. SPACESHIP COCKPIT - NIGHT; John, 40s, tired eyes, weathered silver flight suit, narrates "Day 412. Still no response from deep space relay Theta..." as a monitor flashes NO SIGNAL).

* Shot 1, wide: `"Cinematic 35mm film photograph, establishing wide shot of a cramped spaceship cockpit. glowing green control panels line the curved metallic walls. Muted teal lighting with deep shadows. No characters. Widescreen, highly detailed."`
* Shot 2, medium (reference image: character anchor): `"Cinematic 35mm film photograph, medium shot of a tired astronaut (40s, short gray hair, stubble, wearing a worn silver flight suit) sitting in a pilot seat inside a spaceship cockpit. Cool blue light illuminates his face, glowing green control panels out of focus in the background. Widescreen."`
* Shot 3, close-up: `"Cinematic 35mm film photograph, extreme close-up of a dusty CRT monitor screen showing static and a flashing green text reading 'NO SIGNAL'. Widescreen."`

Why it works: the wide shot sets the space, the medium shot introduces John using the anchor, the close-up uses a prop with no facial drift, and all three share the same prefix and green panel details. Example files: [`templates/examples/storyboard-shot1-wide.jpg`](templates/examples/storyboard-shot1-wide.jpg), [`templates/examples/storyboard-anim-clip.mp4`](templates/examples/storyboard-anim-clip.mp4).

**Exercises**

1. Easy: create a style guide for a neo-noir film set in a rainy city, with colors, lighting styles and negative prompts.
2. Medium: generate 3 storyboard images (WS, MS, CU) of a character at a park bench at golden hour, consistent in character and color.
3. Hard: storyboard a character moving from indoors (warm light) to outdoors (cool daylight); write transition prompts that change the light on the face but keep clothing and identity locked.

**Compare tools.** Flux 1.1 or Midjourney v6 via muapi cost roughly $0.01 to $0.06 per image, with very high consistency (image-to-image, style reference, seed control): best for rapid iteration. Specialized storyboard software is subscription-based and has low consistency for AI work. Local ComfyUI (Flux/SDXL) is free after GPU investment and offers extreme control (ControlNet, IP-Adapter, LoRA) for advanced creators. General image APIs are the best choice because they are cheap enough for dozens of variations.

**Launch it.** Sell storyboard decks to agencies and directors (**$150-$400** per 10-15 frame deck; pitch 24-hour turnaround vs. 5 days for a manual artist), or full pitch decks combining storyboards, mood boards and script concepts (**$300-$800**). Find clients on FilmFreeway, director forums, Upwork and agency directories; cold email local agencies offering a free 3-frame sample.

**Templates:** [`templates/storyboard-script-template.md`](templates/storyboard-script-template.md), [`templates/shot-list-template.md`](templates/shot-list-template.md), [`templates/style-guide-template.md`](templates/style-guide-template.md).

Next: Camera Movement & Cinematography Prompts.

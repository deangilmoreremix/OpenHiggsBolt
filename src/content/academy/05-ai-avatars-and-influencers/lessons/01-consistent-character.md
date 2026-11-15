# Building a Consistent AI Character

> **Time:** about 18 minutes. **You will finish with:** a locked master portrait of your character, one face-swapped scene render, and a plan for a 9-post launch batch.

---

## Before you start

A virtual influencer lives or dies on **face drift**. If you prompt a character in a bedroom and again in an office, text-to-image models give you two different people: hair length, facial symmetry and clothing all change. Audiences do not bond with a face that keeps changing, and you cannot sell sponsorships to an account that looks like several different accounts. The fix is three anchors: a **description anchor** (the same face and hair tokens in every prompt), a **wardrobe anchor** (one or two clothing tags that never change) and a **master face** projected onto every new scene with a face swap.

```
Master Face Portrait  ──►  New Scene Generation  ──►  Face Swap Layer  ──►  Consistent Render
```

You need: the [character style guide template](templates/character-style-guide.md), and these SmartVideo GO AI studios: **Image Studio** (anchors, character sheets) and **AI Influencer Studio** (consistent recurring characters). No prerequisites.

## Step by step

### 1. Define your character profile

1. Open [`templates/character-style-guide.md`](templates/character-style-guide.md).
2. Write down the face, hair, clothing style and signature colors. Use unique tokens, for example: textured crop brown hair, oval face, green eyes, slight freckles. Pick one or two wardrobe tags, for example: a dark blue crewneck sweater.

**You should see:** a filled-in profile with a face description, hair, and a wardrobe line you will not change.

**If not:** if the description is vague ("a beautiful woman"), add concrete details until two people would picture the same face.

### 2. Generate the master portrait

1. In **Image Studio**, use `nano-banana-2` with aspect ratio `1:1`.
2. Paste this example prompt (swap in your own description):

```text
Front portrait of Emma, a 28-year-old female influencer with a short textured brown bob, oval face, slight freckles on her nose, looking at the camera. Soft neutral studio lighting, clean gray background, photorealistic, 8k.
```

3. Generate a few and save the best as your **Master Reference Face**, for example `emma-master.jpg`.

**You should see:** a clean, front-facing, evenly lit headshot with a plain background.

**If not:** if the face is turned away or the lighting is dramatic, regenerate; the master must be neutral and front-facing.

### 3. Generate a new scene with identical tokens

Keep face, hair and wardrobe wording **100% identical** to the master prompt and change only the location:

```text
Emma, a 28-year-old female influencer with a short textured brown bob, oval face, slight freckles, wearing a dark blue crewneck sweater, sitting at a wooden cafe table holding a coffee cup. Minimalist cafe background, warm morning light, photorealistic, 8k.
```

**You should see:** a cafe scene with someone who looks similar to your master, possibly with small differences.

**If not:** if the clothing or hair changed a lot, compare your prompt to the master line by line and restore the exact tokens.

### 4. Run the face swap

If the face drifted, use the `/z-image-p` (or InsightFace face swap) endpoint, or `ai-image-face-swap`:

1. **Source Image (Reference):** upload `emma-master.jpg`.
2. **Target Image:** upload your new cafe generation.
3. Run it. The engine keeps the target's lighting and head angle while locking in the master's nose, eyes and cheek structure.

**You should see:** the cafe scene with the master's exact facial features.

**If not:** if the result looks pasted or the angle is extreme, regenerate the scene with a more frontal pose and swap again.

### 5. Compare against the master

Put the master and the swapped render side by side.

**You should see:** the same nose, eyes, freckles, hair and sweater in both.

**If not:** if any feature differs, swap again, or generate a new scene with the anchor tokens repeated word for word.

### 6. Plan the launch batch

Create dedicated Instagram and TikTok accounts for the character. Write a normal, humanized bio (for example: "Sharing automation hacks and tech reviews"); do not label it "AI Generated" in the main bio header. Then list **9 scene prompts** (office, home, studio, cafe, and so on), all reusing your anchors, so the grid looks cohesive when a new viewer lands on the profile.

**You should see:** a list of at least 9 scene prompts, each starting with the same character description and wardrobe tag.

**If not:** if you are short of ideas, vary only location and lighting.

## Check yourself

* [ ] My style guide has face, hair and wardrobe anchors.
* [ ] I saved a front-facing master portrait.
* [ ] My swapped scene matches the master's facial features.
* [ ] I have a list of 9 scene prompts for the launch batch.

## Common mistakes

* Typing a generic prompt ("a beautiful woman") instead of rigid description tokens.
* Changing the outfit in every scene.
* Skipping the face swap and trusting the prompt alone.
* Publishing before there are at least 9 consistent posts.

## Go further

**Worked example, "Emma" (tech influencer):** master profile is a 28-year-old with a short textured brown bob, oval face, freckles, dark blue crewneck sweater. Scene 1 office desk, Scene 2 modern living room, Scene 3 studio with professional microphones; each is face-swapped with the master. Across three scenes with different lighting, face, hair and sweater stay consistent. Reference images: [master](templates/examples/emma-master.jpg), [consistent cafe render](templates/examples/emma-cafe-consistent.jpg), [motion clip](templates/examples/emma-cafe-motion.mp4).

How the real example was made via muapi: master 1:1 with `nano-banana-2` ($0.06/image); 9:16 cafe scene with `nano-banana-2` using identical tokens; both uploaded to `ai-image-face-swap` ($0.03/swap).

**Compare tools:**

| Tool | Consistency | Cost | Best for |
|---|---|---|---|
| muapi `/ai-image-face-swap` | High, any angle or lighting | ~$0.03 per swap | Fast, bulk face swaps for image feeds |
| Midjourney `--cref` | High; can struggle with precise clothing | Subscription | Background variations and poses |
| Stable Diffusion (IP-Adapter) | Ultra-high, full control | Free (local GPU) | Agencies building custom models |

Fastest starter pipeline: Midjourney or `nano-banana-2` for the scene, then a muapi face swap.

**Exercises:**

1. Easy: write a detailed physical description, generate three headshots, pick the master.
2. Medium: generate two scene variations (walking in a city, sitting in a park) with identical anchors.
3. Hard: project your master face onto a third-party stock photo scene, matching lighting and angle, and verify features hold.

**Template:** [`templates/character-style-guide.md`](templates/character-style-guide.md) holds prompt anchors and seed lists.

Next: Character to Content Pipeline.

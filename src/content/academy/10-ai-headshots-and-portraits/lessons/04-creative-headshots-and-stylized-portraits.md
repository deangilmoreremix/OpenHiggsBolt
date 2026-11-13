# Creative Headshots & Stylized Portraits

> **Time:** about 15 minutes. **You will finish with:** a color-graded editorial portrait saved as `creative-studio-headshot.jpg`, in a style chosen to match a creative client.

---

## Before you start

Creative professionals reject bland corporate photography. Keynote speakers and authors want dramatic stage light and dark moody backgrounds; podcasters and music artists want gel accents (neon cyan, warm amber); tech founders and designers want relaxed environmental settings like sunlit lofts and brick walls. Clients like these pay **$150 to $350 per custom portrait pack**. The pipeline: identity lock, cinematic mood prompt, gel and environment light, then editorial polish. Three styles: Keynote Speaker (dark background, strong key, warm rim), Tech Founder Loft (brick, soft window light, casual attire) and Podcast / Media Creator (magenta key plus cyan rim, dark studio).

You will need a client selfie (lesson 1 standards), [`templates/headshot-style-guide.md`](templates/headshot-style-guide.md), and SmartVideo GO AI **Image Studio**. Menus move; follow the current screen.

## Step by step

### 1. Open the style guide and match the client

Open [`templates/headshot-style-guide.md`](templates/headshot-style-guide.md) and pick the style that fits the client's brand personality.

**You should see:** creative lighting prompts, gel ratios and editorial negative prompts.

**If not:** use the prompts below.

### 2. Paste the prompt

Keynote Author:

```text
Photorealistic 8k editorial portrait photograph of [Identity Anchor], thoughtful confident expression, dark moody studio background, dramatic Rembrandt side lighting, warm rim light on hair and shoulders, 85mm f/1.4 lens, shallow depth of field, high contrast, NYT bestseller book cover style.
```

Creative Tech Founder:

```text
Photorealistic 8k environmental portrait of [Identity Anchor], approachable friendly smile, wearing a dark navy turtleneck, exposed brick loft background with warm window sunlight, soft bokeh, 85mm lens.
```

**You should see:** a prompt with the identity anchor filled in.

**If not:** do not leave the brackets; describe the person in a few words.

### 3. Lock identity and generate

1. Pass the client's selfie into your identity-locked generator (muapi `/nano-banana-2` or InstantID).
2. Set identity weight to `0.85`, which keeps facial accuracy while letting the model create dramatic lighting.

**You should see:** the client's face in new, cinematic light.

**If not:** if the face drifts under strong effects, raise identity weight a little or add a better reference photo.

### 4. Polish and grade

1. Apply a subtle color balance (cinematic teal and orange, or warm amber midtones) for a magazine feel.
2. Check micro-detail at 100% zoom, then save as `creative-studio-headshot.jpg`.

**You should see:** a cohesive editorial look with natural skin.

**If not:** if the grade looks heavy, halve its strength.

## Check yourself

* [ ] I picked a style that matches the client's brand.
* [ ] Identity weight was 0.85 and the face is accurate.
* [ ] A subtle color grade was applied.
* [ ] The final is saved as `creative-studio-headshot.jpg`.

## Common mistakes

* **Offering only suit headshots.** You miss creative and media clients.
* **Over-grading.** Heavy color shifts skin tone and identity.
* **Weak identity weight under dramatic lighting.**

## Go further

**Worked example, "Keynote Speaker Series":** a bestselling author and keynote speaker; 5 editorial portraits for a book cover, billboard and speaker one-sheet; styles Keynote Stage Lighting, NYT Author Mood and Warm Urban Loft; package rate **$249.00**; production time 25 minutes.

<p align="center">
<img src="templates/examples/creative-studio-headshot.jpg" alt="Creative Studio Tech Founder Portrait" width="480">
</p>

**Compare tools**

| Style / Platform | Creative control | Client tier | Best for |
|---|---|---|---|
| FLUX PuLID / InstantID (muapi) | High (responds to gel lighting and loft anchors) | Creative professionals, media clients | Fast editorial batches for agencies |
| Midjourney (--cref identity reference) | Medium-High (great aesthetics, weaker identity lock) | Individual creatives | Social editorial series and speaker headshots |
| Local ComfyUI (InstantID + LoRA) | Maximum | High-budget executives | Luxury speaker and author packages |

**Pricing:** Individual Creative Portrait Pack **$149 - $249** (5 variations: Keynote Stage, Loft Environmental, Podcast Gel, Author Dark, Studio Press Kit). Offer pre-sized assets: Spotify podcast covers (3000x3000px), YouTube banners (2560x1440px) and speaker press kits.

**Exercises**

1. Easy: generate a portrait with dual-color gel lighting (blue key light + amber rim light).
2. Medium: create an environmental loft headshot for a tech founder with exposed brick.
3. Hard: produce a 4-portrait press kit (Author Cover, Stage Lighting, Loft Casual, Studio Dark) for a keynote speaker.

**Template:** [`templates/headshot-style-guide.md`](templates/headshot-style-guide.md) has creative lighting prompts, gel ratios and editorial negative prompts.

**Studios in SmartVideo GO AI:** Image Studio, Video Studio, AI Influencer Studio, Storyboard / Campaign Planner, Lip-Sync Studio.

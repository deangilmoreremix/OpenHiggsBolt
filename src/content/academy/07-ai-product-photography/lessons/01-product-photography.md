# Product Shots Without a Photographer

> **Time:** about 14 minutes. **You will finish with:** a transparent product cutout and a studio backdrop, composited together and ready for shadows.

---

## Before you start

A premium backdrop shifts your product from cheap to premium. A studio shoot costs thousands of dollars and weeks of coordination, while a phone photo on a cheap background makes customers assume the product is cheap too. The fix is to photograph the real product once, isolate it as a transparent PNG, and build the environment *around* it, because image generators (like Stable Diffusion or FLUX) cannot render existing labels or logos accurately. The pipeline is: raw photo, background removal, AI backdrop, composite and shadows. This lesson covers the first three parts and the composite; lesson 1, part 2 adds shadows and colour.

You will need: a phone, one product with a clean label, a background remover (Photoroom, Clipdrop or a `/remove-background` API), an image generator (for example **Image Studio** in SmartVideo GO AI), a photo editor (Photoshop, Photopea, or a Python Pillow script), and [`templates/photography-brief-template.md`](templates/photography-brief-template.md).

## Step by step

### 1. Photograph the product

Use diffused daylight from a window. Do not mix warm yellow house lamps with cool daylight: it creates mixed reflections on the packaging that AI cannot fix later. Make sure the label is clean, in focus and free of extreme glare.

**You should see:** a sharp photo where every word on the label is readable.

**If not:** move away from the lamp, turn off overhead lights, and shoot again with the product facing the window.

### 2. Isolate the product

Upload the photo to Photoroom, Clipdrop, or call the `/remove-background` API. Download the result as a transparent PNG named `product_mask.png`.

**You should see:** the product on a checkerboard (transparent) background with clean edges and an intact label.

**If not:** if edges are ragged, retake the photo against a plain, contrasting surface and run the remover again.

### 3. Open your photography brief

Open [`templates/photography-brief-template.md`](templates/photography-brief-template.md) and fill in the backdrop environment and composition fields before you generate anything.

**You should see:** a brief that names the surface, light direction and mood you want.

**If not:** copy the prompt from the next step as your starting backdrop description.

### 4. Generate the studio backdrop

In your image generator, run this prompt:

```text
An elegant studio product backdrop. A single rectangular travertine stone slab on a beige concrete surface, soft side golden sunlight, warm shadows, minimalist aesthetic, commercial product setup, high resolution, f/4 lens, depth of field.
```

Save the best result as `backdrop.jpg`.

**You should see:** an empty stone slab with warm side light and no product on it.

**If not:** if a product or text appears, regenerate. Keep the slab as the only subject.

### 5. Composite the layers

In your photo editor, place `backdrop.jpg` as the bottom layer and `product_mask.png` as the top layer. Scale the product to sit naturally on the slab. Hold `Shift` while scaling so the aspect ratio never stretches or warps.

**You should see:** the product standing on the slab at a believable size, still looking a bit "pasted" (no shadows yet).

**If not:** if it looks squashed, undo and rescale holding `Shift`. Save the layered file, since part 2 continues from it.

## Check yourself

* [ ] My product photo used diffused daylight with no mixed lamps.
* [ ] `product_mask.png` has a transparent background and a readable label.
* [ ] `backdrop.jpg` contains only the empty stone slab scene.
* [ ] I scaled the product proportionally onto the backdrop.

## Common mistakes

* Mixing warm house lamps and cool daylight when photographing.
* Stretching or warping the product PNG to fit the background.
* Asking the generator to draw the product itself, which ruins labels and logos.

## Go further

**Worked example: backdrop shift for an organic aloe vera gel tube.** Source: a green plastic bottle on a white desk under office lighting. Background removed, keeping only the container. Backdrop prompt:

```text
Minimalist bathroom counter, white marble surface, warm sunbeams passing through a window, soft shadows, green eucalyptus leaf casting shadows, high-end organic cosmetic background, 85mm, photorealistic.
```

The tube was scaled to occupy 70% of the vertical frame. Result: it looks shot in a high-end luxury spa, raising perceived value.

**Exercises.** Easy: photograph a coffee mug and isolate it as a transparent PNG with a free remover. Medium: generate a wooden-block backdrop with a soft sunset shadow and composite your object onto it. Hard: continue in part 2 with the two-part shadow and colour balance.

**Compare tools.**

| Tool | Purpose | Control | Best for |
|---|---|---|---|
| FLUX Dev / Schnell | Backdrop generation | High (responds well to prop and lighting prompts) | Complex, stylized studio settings |
| Photoroom / Clipdrop | Fast background replacement and auto shadows | Instant (template-driven) | Fast batch rendering of basic Amazon listings |
| Magnific AI / Relight | High-resolution detailing and colour matching | High | Premium hero images for luxury sites |

For standard listings, Photoroom gives a clean white-background shot with auto-shadows in about 5 seconds. For creative banners, FLUX backdrops with manual compositing give the highest quality.

**Template:** [`templates/photography-brief-template.md`](templates/photography-brief-template.md) covers backdrop environments, composition structures and prompt logs.

**SmartVideo GO AI studios** (generic list, same for every lesson):

* **Image Studio**: anchors, character sheets, product and brand shots
* **Video Studio**: UGC ads, talking-head clips, image-to-video motion
* **AI Influencer Studio**: consistent recurring on-brand characters
* **Storyboard / Campaign Planner**: batch matrices, ad briefs and test plans
* **Lip-Sync Studio**: voice + mouth-sync for avatar performances

The workflow is the same everywhere in SmartVideo GO AI: **Learn, See Example, Use Template, Generate.**

Next: Product Shots Without a Photographer, part 2.

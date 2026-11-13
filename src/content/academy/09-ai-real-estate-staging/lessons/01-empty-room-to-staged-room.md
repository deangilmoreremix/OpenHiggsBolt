# Empty Room → Staged Room Pipeline

> **Time:** about 18 minutes. **You will finish with:** one staged room photo, `staged-living-room.jpg`, made from a vacant room with its perspective and floor intact.

---

## Before you start

Empty rooms feel smaller and colder, and buyers struggle to picture living there. The National Association of Realtors (NAR) reports that **81% of buyers find it easier to visualize a property as a future home when it is staged**, and staged homes sell for **up to 20% more**. Physical staging costs **$2,500 to $5,000+ per month** and takes **3 to 7 days**. Careless editing makes furniture look flat or floating. This lesson uses perspective-locked, depth-aware inpainting: depth mask, perspective alignment, furniture inpainting, then shadow checking.

You will need: a vacant room photo (your own, or a stock photo of an empty room), basic comfort with image prompts, and **Image Studio** in SmartVideo GO AI (menus move; follow the current screen). Keep [`templates/virtual-staging-brief.md`](templates/virtual-staging-brief.md) open.

## Step by step

### 1. Pick the source photograph

1. Choose a high-resolution wide-angle photo of a vacant room. Real estate lenses are 16-24mm.
2. It should be straight (level horizon, vertical walls) and lit by natural daylight.
3. Save it as `empty-room-source.jpg`.

**You should see:** a bright, level photo of an empty room with a clear floor and windows.

**If not:** if walls lean or the horizon tilts, choose another photo. Furniture will look skewed if perspective is off.

### 2. Mask the floor area

1. Open your photo editor or the inpainting interface.
2. Paint a mask over the open floor where furniture will sit, covering **60-70% of the open floor space**.
3. Keep windows, fireplaces, support columns and structural walls untouched.

**You should see:** a mask layer on the floor only, with structural features outside it.

**If not:** if the mask touches windows or walls, erase those parts. Otherwise the AI may alter them.

### 3. Choose a style from the brief

Open [`templates/virtual-staging-brief.md`](templates/virtual-staging-brief.md). Pick one style preset. Examples:

* **Modern Scandinavian:** light oak, neutral linen sofas, minimalist coffee tables, potted monstera plants.
* **Contemporary Luxury:** velvet sectionals, marble coffee tables, brass accent lighting, plush area rugs.
* **Coastal Modern:** light textiles, rattan accents, soft blues, woven jute rugs, warm natural sunlight.

**You should see:** one style chosen, with its furniture list in front of you.

**If not:** if unsure, use Contemporary Luxury, which matches the prompt in the next step.

### 4. Paste the staging prompt

Add the prompt in Image Studio. It starts with architectural and lighting anchor words that match the original photo:

```text
High-end modern luxury living room virtual staging. A sleek cream fabric L-shaped sectional sofa with plush pillows resting on a soft beige area rug, low-profile oval wood coffee table, potted fiddle-leaf fig in ceramic planter, natural sunlight casting soft shadows, interior design magazine style, 8k photorealistic resolution, perfectly aligned to floor plane.
```

Then add the negative prompt:

```text
warped floor, distorted furniture legs, floating objects, cartoon, low resolution, blurry, altered windows, altered walls, 3d render look, oversaturated.
```

**You should see:** both prompts entered in their own fields.

**If not:** if there is no negative prompt field, look for "avoid" or "exclude"; menus move, so follow the current screen.

### 5. Run the inpainting with depth reference

1. Give the tool `empty-room-source.jpg` and your mask. Models used in this course include FLUX Inpainting and muapi `/nano-banana-2` in inpainting mode.
2. Set ControlNet Depth weight to `0.75` so floor geometry is enforced while the model still builds 3D furniture.
3. Generate.

**You should see:** a staged image with furniture inside the masked floor area.

**If not:** if furniture floats or warps, raise the depth weight slightly and run again.

### 6. Check contact shadows at 100% zoom

1. Zoom to 100%.
2. **Floor contact:** sofa and table legs should touch the floor with dark, tight contact shadows (ambient occlusion).
3. **Light source:** highlights on the furniture should match the window sunlight direction.

**You should see:** grounded furniture with shadows consistent with the window light.

**If not:** regenerate. Check that the prompt still says "perfectly aligned to floor plane".

### 7. Save the result

Save the final image as `staged-living-room.jpg`. Keep it next to `empty-room-source.jpg` for lessons 2 and 3.

**You should see:** both files in your folder.

**If not:** if the export is small, re-export at the highest resolution available.

## Check yourself

* [ ] My source photo was straight and well lit.
* [ ] The mask covered the floor, not windows or walls.
* [ ] I used the prompt, the negative prompt and depth weight `0.75`.
* [ ] Furniture legs have contact shadows and the light matches the window.
* [ ] I saved `staged-living-room.jpg`.

## Common mistakes

* Using a tilted photo, which skews furniture.
* Masking windows, doors or walls, which lets the AI alter them.
* Skipping the negative prompt, which allows floating objects and warped floors.
* Judging the result only at thumbnail size instead of 100% zoom.

## Go further

**Worked example, "Oakridge Listing":** an empty 450 sq ft living room with hardwood floors and large sunlit windows, for a young professional couple wanting modern luxury. Furniture pack: Scandinavian Luxury (cream sectional, oak coffee table, textured rug, indoor botanicals). Settings: denoising strength `0.65`, depth weight `0.80`, 16:9 aspect ratio to match the camera. Result: 4 minutes processing, **$0.06** AI cost versus a **$3,200** physical staging quote. Example files: `templates/examples/staged-living-room.jpg` and `templates/examples/living-room-staging-motion.gif` (video: `templates/examples/living-room-staging-motion.mp4`), an image-to-video walkthrough loop made in **Video Studio**.

**Compare tools:**

| Method | Turnaround | Cost per photo | Best for |
|---|---|---|---|
| FLUX / muapi Inpainting API | < 1 minute | $0.05 - $0.15 | High-volume agencies; custom depth control |
| Staging SaaS (BoxBrownie, VirtualStagingAI) | 24 - 48 hours | $20 - $35 | One-off listings with a fixed budget |
| Traditional physical staging | 3 - 7 days | $2,500 - $5,000+ | Ultra-luxury $5M+ homes with in-person open houses |

**Delivery and pricing preview:** single room **$35 - $50** per photo; 5-room package (living room, master bedroom, kitchen/dining, guest bedroom, patio) **$149 - $199**. Deliver JPEGs 3000px+ wide for MLS, Zillow and Redfin within 24 hours.

**Exercises:**

1. Easy: photograph or download an empty room; find the main vanishing point and window light source.
2. Medium: place a modern sofa and coffee table while preserving the flooring and wall textures.
3. Hard: stage the same room in **Modern Scandinavian** and **Industrial Loft**, keeping lighting and perspective matched.

**Studios in SmartVideo GO AI:** Image Studio (staging), Video Studio (image-to-video motion), AI Influencer Studio, Storyboard / Campaign Planner, Lip-Sync Studio. Workflow: Learn → See Example → Use Template → Generate.

Template: [`templates/virtual-staging-brief.md`](templates/virtual-staging-brief.md).

Next: Pricing Against Traditional Staging.

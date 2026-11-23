# Sizing & Layout Consistency

> **Time:** about 15 minutes. **You will finish with:** one model image aligned to a 1080 x 1350px grid (shoulders at Y 400, seam at X 540) and exported as WebP.

---

## Before you start

If head size or shoulder height jumps between product pages, a store looks cheap, and aligning by eye always produces errors. The fix is a standard grid. Three rules: align the **shoulder joints** to the same Y coordinate on every image; keep **margins** on a 4:5 vertical canvas (1080x1350px) of **10%** at the bottom for the feet and **12%** at the top for head clearance; and put the garment's vertical **centre seam** (zipper or buttons) on the canvas centre X.

You will need:

* A model try-on render (from lesson 1).
* [`templates/mannequin-alignment-template.md`](templates/mannequin-alignment-template.md).
* An editor with guides (Photoshop, Photopea). SmartVideo GO AI **Image Studio** can produce the render; menus move, so follow the current screen.

## Step by step

### 1. Set up the canvas grid

1. Open [`templates/mannequin-alignment-template.md`](templates/mannequin-alignment-template.md).
2. In your editor, set canvas size to **1080 x 1350px**.
3. Add a vertical guide at **X: 540px** and horizontal guides: Shoulder Line **Y: 400px**, Waist Line **Y: 750px**, Hip Line **Y: 950px**.

**You should see:** a blank canvas with one vertical and three horizontal guides.

**If not:** if guides will not snap, turn on snapping in your editor's View menu.

### 2. Import the model layer

Import your try-on render and place it roughly in the centre.

**You should see:** the model over the grid, not yet aligned.

**If not:** if the layer is far too big or small, scale it down or up first before fine alignment.

### 3. Align the shoulders

1. Scale the layer proportionally (hold `Shift`).
2. Drag until the left and right shoulder seams sit on the Shoulder Line (**Y: 400px**).
3. Let head and legs scale naturally.

**You should see:** both shoulder seams touching the 400px guide.

**If not:** if the shoulders are tilted, check the pose; a tilted source cannot be fixed by scaling.

### 4. Align the centre seam

Move the layer left or right until the collar button or zipper line sits on the vertical guide (**X: 540px**).

**You should see:** the seam straight on the centre guide.

**If not:** if the garment looks tilted, not just offset, regenerate with a straighter pose.

### 5. Check margins and export

1. Make sure the head does not cross the top safety line and hands and sides stay inside the side padding.
2. Hide the grid layers and export as WebP.
3. Repeat for every item in the collection.

**You should see:** a clean image with no guides, framed with the 12% top and 10% bottom margins.

**If not:** if the head is clipped, rescale slightly smaller and re-align the shoulders.

## Check yourself

* [ ] The canvas is 1080 x 1350px with guides at X 540 and Y 400 / 750 / 950.
* [ ] Shoulders sit on Y 400 and the seam on X 540.
* [ ] Top and bottom margins are respected.
* [ ] I exported WebP without grid layers.

## Common mistakes

* **Aligning by eye.** Always snap to guides.
* **Changing camera height between shots.** Keep the camera at chest level (about 4 feet) so perspective stays the same and baselines align.
* **Aligning the head instead of the shoulders.** Shoulders are the garment's anchor.
* **Undocumented grid settings.** Record them in the alignment template and share with your team.

## Go further

**Worked example, 5-item windbreaker collection.** Catalog 1080x1350px, centre guide X 540, shoulder guide Y 400, waist guide Y 750. Five VTO renders (black, blue, orange, red, grey) were scaled so shoulder seams snapped to Y 400 and zippers were centred. Result: on the catalog page the models stand at the same height and centre, so shoppers compare colours without distraction.

![Alignment grid](templates/examples/mannequin-grid-alignment.jpg)

Motion loop: [templates/examples/mannequin-grid-clip.mp4](templates/examples/mannequin-grid-clip.mp4)

**Compare tools**

| Tool | Automation | Layout control | Best for |
|---|---|---|---|
| Photoshop / Photopea | Low (manual scaling) | Ultra-high | High-end listing QC |
| Python Pillow (PIL) | Ultra-high (scripted crop and align using keypoints) | Medium | Large catalogs |
| Figma | Low | High | UI mockups, page layout checks |

For 1000+ catalog updates, a script using a keypoint model such as YOLO-pose to detect shoulder joints and auto-crop is the standard way to scale.

**Exercises**

1. Easy: draw guides for a square 1:1 layout (shoulders Y 300px, waist Y 600px).
2. Medium: import 2 model photos, align shoulders to your guides and toggle layers to verify.
3. Hard: write a checklist to QA 10 listing pages, naming 4 alignment errors (for example off-center zipper, head clipping) and their fixes.

**Template:** [`templates/mannequin-alignment-template.md`](templates/mannequin-alignment-template.md).

**SmartVideo GO AI studios for this track:** Image Studio, Video Studio, AI Influencer Studio, Storyboard / Campaign Planner, Lip-Sync Studio.

Next: Before/After Conversion Cases.

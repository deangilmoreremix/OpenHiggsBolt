# Batch Workflows for Catalogs

> **Time:** about 14 minutes. **You will finish with:** a catalog folder structure, isolated product masks and one locked master backdrop.

---

## Before you start

Brands launch 20, 50 or 200 variations. If each backdrop is prompted from scratch, lighting, shadows and camera angles differ and the catalog looks messy. At 1 hour per product, a 50-item catalog takes about a week. Batch production rests on three ideas: **Prompt Pinning** (same prompt and seed, one pre-rendered background for all products), **Layout Standardization** (the same baseline Y-coordinate and relative height) and **Batch Masking** (remove backgrounds in bulk through folder tools or an API).

You need 3 to 5 raw product shots of one collection, [`templates/batch-catalog-spec.md`](templates/batch-catalog-spec.md), Photoshop (or an API/Python script) for masking, and **Image Studio** in SmartVideo GO AI for the backdrop.

## Step by step

### 1. Create the catalog folders

Open [`templates/batch-catalog-spec.md`](templates/batch-catalog-spec.md) and create: `01_raw_assets/`, `02_isolated_masks/`, `03_ai_backgrounds/`, `04_composite_drafts/`, `05_final_deliver/`.

**You should see:** five empty folders in order.

**If not:** match the names exactly so the spec and your scripts agree.

### 2. Add and name the raw shots

Put every raw product shot in `01_raw_assets/` named by SKU, for example `sku_lavender_01.jpg`, `sku_rose_02.jpg`.

**You should see:** every file starting with its SKU.

**If not:** rename any file named like `IMG_2041.jpg` now, not later.

### 3. Batch remove backgrounds in Photoshop

Go to File -> Scripts -> Image Processor (menus move; follow the current screen). Set the source folder to `01_raw_assets/` and choose "Save as PSD". In the Actions panel record a new action: Select Subject, apply Mask, save as transparent PNG. Run it on the folder, outputting to `02_isolated_masks/`.

**You should see:** one transparent PNG per product in `02_isolated_masks/`.

**If not:** if a mask is poor, rerun that one file. Alternative: run a Python script that sends the folder's files to `/remove-background` and downloads the results. Never put API keys in chat.

### 4. Lock your master backdrop

Generate backdrops with the module 1 prompt style and choose one. Scale and center the travertine block or pedestal surface, then save it as `master_background.jpg`. Keep the prompt and seed in the brief so it can be regenerated identically.

**You should see:** one backdrop file in `03_ai_backgrounds/` that every product will share.

**If not:** if you want a different look, change it now; changing it later means redoing every composite.

## Check yourself

* [ ] All five folders exist with the exact names.
* [ ] Raw files are named by SKU.
* [ ] Every product has a transparent mask in `02_isolated_masks/`.
* [ ] I have exactly one `master_background.jpg`.

## Common mistakes

* Generating a new background for each product.
* Naming files by camera defaults instead of SKU.
* Cleaning masks by hand, pixel by pixel, instead of batching.

## Go further

**Worked example: skincare serum catalog.** 5 serum droppers (Rose, Lavender, Cucumber, Tea Tree, Citrus). Master environment: travertine marble ledge against cream stucco. Baseline at Y: 800px on a 1920x1920px square canvas; product height standardized to exactly 1100px. Folder-wide background removal on the 5 raw shots, then all masks imported into one template.

**Exercises.** Easy: set up the five standard folders. Medium: record a Photoshop Action or write a script that scales an image to 1080x1080px and adds a 10% outer border. Hard: batch process 3 coloured beverage cans on the same ledge at the same baseline with the same shadow layer.

**Compare tools.**

| Tool | Speed | Suitability | Best for |
|---|---|---|---|
| Photoshop Batch Actions | High (local folders, recorded hotkeys) | Excellent (keeps manual control) | Designers with complex layer adjustments |
| Photoroom Batch API | Ultra-high (cloud, hundreds of files at once) | Good | High-volume stores with simple layouts |
| Python Pillow (PIL) | Ultra-high | Good (needs scripting) | Programmers automating bulk overlays |

For agencies, recorded Photoshop actions plus manual QA on shadows is best. For 500+ items, Photoroom's Batch API is the fastest.

**Template:** [`templates/batch-catalog-spec.md`](templates/batch-catalog-spec.md) covers directory setups, bounding box maps, catalog logs and checklists.

**SmartVideo GO AI studios** (generic list, same for every lesson):

* **Image Studio**: anchors, character sheets, product and brand shots
* **Video Studio**: UGC ads, talking-head clips, image-to-video motion
* **AI Influencer Studio**: consistent recurring on-brand characters
* **Storyboard / Campaign Planner**: batch matrices, ad briefs and test plans
* **Lip-Sync Studio**: voice + mouth-sync for avatar performances

The workflow is the same everywhere in SmartVideo GO AI: **Learn, See Example, Use Template, Generate.**

Next: Batch Workflows for Catalogs, part 2.

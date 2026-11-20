# Batch Workflows for Catalogs, part 2

> **Time:** about 13 minutes. **You will finish with:** matching, SKU-named WebP catalog images exported to `05_final_deliver/`.

---

## Before you start

With masks and a locked backdrop from part 1, consistency now comes from one template: every container sits on the same vertical baseline and fills the same relative height, so the grid looks like a brand catalog. Because the lighting is identical, one shadow layer is reused for all products. You need `master_background.jpg`, the PNG masks in `02_isolated_masks/`, and Photoshop or a comparable editor.

## Step by step

### 1. Build the alignment template

Open `master_background.jpg`. Pull a horizontal ruler guide to the baseline where product bottoms touch the pedestal. Add side guides for maximum padding. Save as `catalog_template.psd`.

**You should see:** a PSD with a baseline guide and padding guides.

**If not:** turn on rulers and guides in the View menu; menus move, so follow the current screen.

### 2. Import the masks

Import each product PNG mask into the template as its own layer group.

**You should see:** one layer per product, all stacked in the file.

**If not:** if a mask arrives huge, scale it proportionally (hold `Shift`).

### 3. Align and scale

Align each mask's base to the baseline guide, and scale each to fill the standard bounding box (for example 80% height).

**You should see:** every product bottom on the same line and the same height.

**If not:** compare against the bounding box map in [`templates/batch-catalog-spec.md`](templates/batch-catalog-spec.md).

### 4. Reuse the shadows

Duplicate the shadow layer under each product. Since lighting is identical, the same contact and drop shadow layers work for all files.

**You should see:** identical shadows under each product.

**If not:** if a base is wider than the others, nudge the shadow, not the baseline.

### 5. Export as WebP

Toggle each product on one at a time (click the eye icon next to a layer to show or hide it), keeping the backdrop and shadow layers the same. Export each as WebP into `05_final_deliver/`, named by SKU such as `SKU-BOT-01.webp`, at one uniform size such as 2000x2000px square.

**You should see:** one WebP per product, same size, named by SKU.

**If not:** mixed shapes break a store grid, so re-export any odd file at the standard size.

## Check yourself

* [ ] Every product base sits on the same baseline.
* [ ] All products fill the same bounding box.
* [ ] Shadows and background are identical across files.
* [ ] Files are SKU-named WebP at one uniform size.

## Common mistakes

* Mixing square and vertical exports.
* Naming finals without the SKU, which blocks CSV import.
* Re-tuning shadows per product so the set no longer matches.

## Go further

**Worked example result:** 5 matching skincare images with uniform lighting, shadows and sizing in under 10 minutes. SKU names let developers link images to listings through CSV spreadsheets automatically.

**Exercise (hard):** batch 3 coloured beverage cans on the same ledge, same baseline and shadow layer, and export 3 matching WebP files.

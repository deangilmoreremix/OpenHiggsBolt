// AUTO-GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/generate-template-video-library.mjs
// 539 clips. Each carries a `branding` verdict: "none" = reviewed, no visible logo / watermark / credit; "logo" = has one
// (see scripts/template-video-branding.json). `autoLabeled` clips use a generated title/subcategory until curated in the labels file.

/** @typedef {{ id: string, slug: string, title: string, sourceTitle: string, category: string, subcategory: string, duration: number | null, aspectRatio: string, videoSrc: string, posterSrc: string | null, tags: string[], source: string, topics: string[], orientation: 'landscape' | 'portrait' | 'square', group: string, branding: 'none' | 'logo', marks?: string, autoLabeled?: boolean }} TemplateVideo */

/** @type {TemplateVideo[]} */
export const templateVideos = [];

export const TEMPLATE_VIDEO_CATEGORIES = ["Action","Animation","Cinema","Commercial","Fashion","Social","VFX"];

/** Flat browse groups in display order (the chip row of the modal), More last. */
export const TEMPLATE_VIDEO_GROUPS = ["Drama & Thriller","Fantasy & Surreal","Illustrated & Anime","Vlogs & UGC","Music & Dance","Fashion & Editorial","Food & Drink","Chases & Stunts","Comedy & Pets","Products & Brands","3D Animated","Cute & Kids","Fights & Battles","Travel & Documentary","Sci-Fi","Effects & Motion Graphics","Beauty & Fragrance","Titles & Typography","Fitness & Sports","Period & Historical","Cars & Vehicles","Creatures & Heroes","Lifestyle & Food","Aerial & FPV"];

/** Subcategory chips per category, largest first. */
export const TEMPLATE_VIDEO_SUBCATEGORIES = {
 "Action": [
  "Chases & Stunts",
  "Battles & Disaster",
  "Creatures & Heroes",
  "Aerial & FPV",
  "Fights & Martial Arts"
 ],
 "Animation": [
  "Illustrated & Craft",
  "3D Animated",
  "Cute & Kids",
  "Title Sequences"
 ],
 "Cinema": [
  "Drama & Thriller",
  "Fantasy & Surreal",
  "Travel & Documentary",
  "Sci-Fi",
  "Period & Historical",
  "Comedy"
 ],
 "Commercial": [
  "Food & Beverage",
  "Beauty & Fragrance",
  "Automotive & Mobility",
  "Luxury Goods",
  "Product Reveals",
  "Tech & Gadgets",
  "Brand Films"
 ],
 "Fashion": [
  "Editorial",
  "Runway & Lookbook",
  "Streetwear"
 ],
 "Social": [
  "Vlogs & UGC",
  "Music & Dance",
  "Comedy & Pets",
  "Fitness & Sports",
  "Lifestyle & Food"
 ],
 "VFX": [
  "Effects & Motion Graphics",
  "Title Sequences",
  "Loops & Hero Backgrounds"
 ]
};

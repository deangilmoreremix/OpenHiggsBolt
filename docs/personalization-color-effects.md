# Personalization Studio: color and effects

Step 4. **Color and look** card (right column, above Layers) for the whole video, and an **Effects** group in the layer
inspector (**Layout** tab) for one layer. Nothing here changes a file: a look and effects are settings applied when drawing, and
Reset removes them. They are shown live in the editor and drawn by the same code in the exported video.

## What is offered

| Where | Controls |
| --- | --- |
| Video look | Style presets (Cinematic, Vintage, Black and white, Vivid, Cool, Warm), Exposure, Contrast, Vignette, Saturation, Temperature, Tint, Color overlay (color + strength), Blur, Reset look |
| One layer | Brightness, Contrast, Saturation, Blur, Drop shadow, Glow (color + amount), Reset effects |

Presets only fill the sliders; everything stays editable. The look is applied to the footage only, so brand text, logos and the
end card are never tinted.

## What was verified before building it

A harness exported stills through `@remotion/web-renderer` and compared each with the browser's own rendering, on an image, a
canvas, text, a video and a wrapper element:

- **Export correctly** (identical or within rounding): brightness, contrast, saturate, grayscale, sepia, hue-rotate, blur and
  drop-shadow, on images, canvases, text and video. On video, saturate(0) produced exactly 0 average saturation and blur
  changed the picture, as in the browser.
- A filter on a **wrapper element** also reached its image child in the stills, but the effects here are put on the picture
  element itself, which is the documented behavior of the exporter (it applies each element's own computed filter).

Not used because the exporter cannot draw them: blend modes, backdrop filters, radial CSS gradients. So:

- **Temperature, tint and the color overlay** are flat, low-opacity color layers over the footage (orange/blue, magenta/green).
  This is an approximation of a real color-temperature shift, not the same math.
- **Vignette** is a radial gradient painted on a canvas (the exporter draws canvas pixels). The still-image preview in the editor
  (when Live is off) uses a CSS radial gradient for the same look.
- **Highlights / shadows** controls are not offered: there is no export-safe way to do them.

## Where it is applied

`preview/effects.ts` holds the data, the normalizers and the pure CSS builders (`lookFilter`, `layerEffectsFilter`,
`lookOverlays`, `vignetteStops`). `PersonalizationComposition` puts the filter on the footage element (video, or the poster
image), draws the overlays and vignette just above it (`preview/LookLayers.tsx`), and puts a layer's filter on that layer.
Settings are optional and normalized, so saved projects are unchanged.

## Verified end to end

`e2e/personalization-color-effects.spec.ts` (real modal, real clip, real in-browser export, measured with ffmpeg): with Black and
white + a full vignette, the exported footage has less than 15% of its original colorfulness, the corner is darker relative to the
middle than in the plain export, and the blurred logo has less than 60% of its original fine detail. A frame from each export was
viewed: the footage is black and white with dark corners, and the logo plate is blurred, while the white business name is
unchanged.

## Known limits

- Layer effects (and the look) are shown in the still preview (Live off) only for the footage; turn Live on to see layer effects.
- The look applies to the footage, including the presenter cut-out: the filter is set on the cut-out canvas itself. Verified in a
  real export (`e2e/personalization-presenter-background.spec.ts`): with Black and white on, the presenter's red shirt exports gray.
- Filters are drawn per element in the export, so a look on a very large video adds render time.

# Saved text styles

Step 4 can keep the look of a text layer, or of the captions, under a name and apply it again.

## What it does
- **Layer inspector, Content tab (text layers):** "Saved styles". Type a name and press **Save look**; click a saved style to apply it to the selected layer; pencil renames, bin deletes.
- **Captions card:** the same row for caption styles (the built-in presets stay).
- **What a text style holds:** color, font, size, opacity, animation (and its delay), rotation and effects. It never holds the words, position, timing, lock or keyframes, so applying it never moves or retimes anything. A locked layer will not take a style.
- **Brand colors follow the project.** A color equal to the brand's primary / accent / text color is stored as a reference, so applying the style in a project with different brand colors uses that project's colors.

## Where it is kept
- **In the project** (`settings.textStyles`, up to 30). Saved with the project like other settings; optional, so older projects open unchanged. No server route or migration.
- **In this browser** (`localStorage`, key `personalization:text-styles`). Saving also writes a copy here, and a "From this browser" list offers styles that are not yet in the project, with **Add to this project**. If storage is blocked the project copy still works.

## Limits
- The browser copy is per browser, not per account: it does not sync across devices.
- Position and timing are not captured.
- Deleting a style does not change layers that already use it.
- Caption styles and text styles are separate lists; a captions style is not offered on a text layer.

## Code
`preview/textStyles.ts` (pure helpers: capture/apply, brand references, normalizing, list operations, browser library), `guided/SavedStylesBar.tsx` (the shared row), used by `OverlayEditor.tsx` and `CaptionsPanel.tsx`.

## Tests
Unit: `preview/__tests__/textStyles.test.ts`, `guided/__tests__/savedStylesBar.test.tsx`. Browser + real export: `e2e/personalization-text-styles.spec.ts` (styles one layer, applies it to another, and measures both as magenta in an exported MP4 with ffmpeg; brand reference, browser library and captions styles).

# video-shotcraft Brand Guidelines

## Core Concept

Mark name: **Frame Chisel** (镜刻)

The unclosed black frame is a single shot in the act of being selected; the amber bevel is both the edit cut point and the blade edge that "carves" motion into a shot. The mark does not literally depict a camera, a play button, or film stock; instead it expresses the core action of video-shotcraft: **frame it from motion, finish it with craft.**

## Brand Colours

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--brand-amber` | Lens Amber | `#D3923C` | The sole primary accent colour; key actions, selected states, the mark's blade edge |
| `--brand-ink` | Set Ink | `#171714` | Primary background, headings, mark structure |
| `--brand-paper` | Edit Paper | `#F5F3EE` | Light backgrounds, primary text on dark backgrounds |
| `--brand-slate` | Script Slate | `#B5B0A5` | Secondary text, explanatory information |

Recommended ratio: Set Ink 70% / Edit Paper 20% / Lens Amber 10%. In high-density interfaces, the Lens Amber area should be pushed further down to 3–5%, marking only true cut points or focal points.

For light interfaces, use:

```css
:root {
  --brand-amber: #D3923C;
  --brand-ink: #171714;
  --brand-paper: #F5F3EE;
  --brand-slate: #716D64;
  --brand-line: #D9D5CC;
}
```

For dark interfaces, use:

```css
:root {
  --brand-amber: #D3923C;
  --brand-ink: #171714;
  --brand-paper: #F0EDE5;
  --brand-slate: #B5B0A5;
  --brand-line: #3E3B34;
}
```

## Usage Rules

- Minimum display size: 16px in digital interfaces; below 24px, prefer the mark alone, without the wordmark.
- Clear space: keep at least 1/4 of the mark's width free on all sides.
- Use `logo-mark-reverse.svg` on dark backgrounds; use `logo-mark.svg` on light backgrounds.
- Use `logo-mark-mono.svg` for single-colour printing, laser engraving, and masks.
- The wordmark defaults to Avenir Next / Avenir / Inter, set entirely in lowercase; do not change it to an all-caps tech-style wordmark.
- Do not rotate the bevelled blade edge; do not add glows, gradients, outlines, or drop shadows; do not replace the amber with multiple accent colours.

## Brand Voice

Chinese tagline (in English): **Carve motion into the shot.**

English tagline: **Frame motion. Craft the shot.**

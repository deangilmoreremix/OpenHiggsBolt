---
name: typeset-ui
description: Improve typography hierarchy, fonts, and text layout
---

Use when typography needs refinement.

Improvements to make:
- **Line length** — Cap body text at 65-75ch
- **Scale ratio** — ≥1.25 ratio between heading steps
- **Font count** — Max 3 (display + body + optional mono)
- **No all-caps body** — Uppercase only for short labels, eyebrows
- **Hero ceiling** — clamp() max ≤ 6rem
- **Letter-spacing** — Display ≥ -0.04em
- **Balance text** — `text-wrap: balance` on h1-h3, `pretty` on prose

Checklist:
- Font pairing has contrast (serif/sans, geometric/humanist)
- Hierarchy guides reading, doesn't confuse
- Font loading is optimized (font-display swap)
- Fallbacks work at all sizes
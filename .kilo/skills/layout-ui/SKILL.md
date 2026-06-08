---
name: layout-ui
description: Fix spacing, rhythm, and visual hierarchy in interfaces
---

Use when spacing feels off or layout needs refinement.

Fixes:
- **Vary spacing** — Create rhythm, don't use uniform gaps
- **Card anti-pattern** — Remove nested cards, side-stripe borders
- **Flex vs Grid** — Flexbox for 1D, Grid for 2D
- **Responsive grids** — `repeat(auto-fit, minmax(280px, 1fr))`
- **Z-index scale** — dropdown → sticky → modal-backdrop → modal → toast → tooltip

Check:
- No overflow at any breakpoint
- Elements align to intentional baseline
- White space serves purpose, not decoration
- Mobile layout collapses gracefully
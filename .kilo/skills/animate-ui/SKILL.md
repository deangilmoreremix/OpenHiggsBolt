---
name: animate-ui
description: Add purposeful animations and motion to interfaces
---

Use when adding or improving animations and motion.

Guidelines:
- **Intentional motion** — Every animation serves a purpose
- **No layout property animation** — Only transform/opacity unless necessary
- **Ease out curves** — Use exponential ease-out (quart, quint, expo)
- **Reduced motion fallback** — Every animation has `@media (prefers-reduced-motion)` alternative
- **Premium materials** — Blur, backdrop-filter, clip-path, mask accepted when smooth
- **Reveal safety** — Animations enhance visible defaults, don't gate visibility

Common animations:
- Page transitions (crossfade, slide)
- Hover states (scale, shadow, background)
- Loading states (spinner, skeleton)
- Micro-interactions (button press, toggle)
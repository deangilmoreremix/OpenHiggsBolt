---
name: optimize-ui
description: Diagnose and fix frontend performance issues
---

Use when UI feels slow or needs performance improvements.

Diagnostics:
1. **Bundle analysis** — Check for unused imports, heavy libraries
2. **Image optimization** — Proper sizes, lazy loading, modern formats
3. **Animation budget** — No layout thrashing, transform/opacity primary
4. **Render optimization** — Virtual scroll for long lists, keys on repeated elements
5. **Loading strategy** — Critical CSS inline, fonts preloaded
6. **Memory leaks** — Event listeners cleaned, subscriptions unsubscribed

Fixes:
- Code-split routes and heavy components
- Compress and resize images
- Memoize expensive calculations
- Remove unused CSS
- Add will-change for animated layers

Measure before/after. Document improvement.
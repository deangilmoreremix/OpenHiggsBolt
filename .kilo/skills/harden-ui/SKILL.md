---
name: harden-ui
description: Make UI production-ready with error handling and edge cases
---

Use to make frontend components production-grade.

Production readiness checklist:
- **Error handling** — Loading, error, empty states designed and coded
- **i18n support** — All text externalized, RTL considered
- **Edge cases** — Very long text, zero data, connection errors
- **Security** — No XSS vectors, inputs sanitized
- **Performance** — Bundle size acceptable, lazy loading where appropriate
- **Accessibility** — Screen reader tested, keyboard nav complete
- **Browser support** — Works in target browsers, polyfills loaded

Test each state manually. Use real-world content, not placeholder text.
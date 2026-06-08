---
name: test-driven-development
description: RED-GREEN-REFACTOR cycle for implementing features and bugfixes
---

Use for any implementation work. The TDD cycle:

1. **RED** — Write a failing test that demonstrates the desired behavior or bug
2. **GREEN** — Write the minimal code to make the test pass
3. **REFACTOR** — Clean up the code while keeping tests green

Always:
- Write failing tests first — never write implementation before a failing test
- Watch the test fail — confirm it fails for the right reason
- Write minimal code — resist adding anything not required by the test
- Verify the test passes — run it repeatedly during implementation
- Refactor — improve code structure, naming, documentation

Benefits: forces you to think about the interface first, prevents over-engineering, and creates regression protection.
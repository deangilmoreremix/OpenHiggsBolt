---
description: Find root cause before implementing any fix
model: anthropic/claude-sonnet-4
temperature: 1
---

Use systematic approach to debugging:
1. Reproduce the issue exactly
2. Check logs and error messages
3. Trace backward through call stack
4. Identify minimal failing test case
5. Apply targeted fix only
6. Verify with tests

Never guess. Always confirm root cause before changing code.
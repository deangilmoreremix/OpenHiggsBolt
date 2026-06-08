---
name: code-review
description: Request review from code reviewer subagent before merging
---

Use when completing tasks, implementing major features, or before merging.

Purpose:
- Catch issues before they cascade
- Get fresh perspective on code quality
- Ensure standards are maintained

Process:
1. Ensure tests pass — verification before review
2. Dispatch code reviewer subagent — use Task tool with appropriate prompt
3. Address feedback — verify each suggestion is understood before implementing
4. Re-review if needed — significant changes may warrant another pass

Early and frequent reviews prevent major rework. Don't wait until the end to get feedback.
---
name: subagent-driven-development
description: Dispatch fresh subagent per task with two-stage review
---

Use when executing implementation plans with independent tasks.

Workflow:
1. Identify independent tasks — no shared state or sequential dependencies
2. Dispatch subagent per task — fresh context, focused scope
3. Two-stage review:
   - Stage 1: Spec compliance — did they meet requirements?
   - Stage 2: Code quality — is it well-structured, tested?
4. Integrate results — merge or cherry-pick completed work

Benefits:
- Parallel execution on independent tasks
- Fresh perspective per task
- Built-in review process
- Better than monolithic changes

Each subagent should have a clear, bounded task that can be completed and verified independently.